import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  generateRoundRobinMatches,
  generateBracketMatches,
  getByeMatchIndices,
} from "@/lib/tournament";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .single();

  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  const { data: teams } = await supabase
    .from("tournament_teams")
    .select("id")
    .eq("tournament_id", id);

  if (!teams || teams.length < 2) {
    return NextResponse.json({ error: "Need at least 2 teams" }, { status: 400 });
  }

  const teamIds = teams.map((t) => t.id);
  const format = tournament.format === "round_robin" ? "round_robin" : "bracket";

  const matches = format === "round_robin"
    ? generateRoundRobinMatches(teamIds, id)
    : generateBracketMatches(teamIds, id);

  const { data: inserted, error } = await supabase
    .from("matches")
    .insert(matches)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (format === "bracket" && inserted) {
    const byeIndices = getByeMatchIndices(matches);

    for (const idx of byeIndices) {
      const dbMatch = inserted[idx];
      if (!dbMatch) continue;

      const winnerId = dbMatch.team_a_id ?? dbMatch.team_b_id;
      if (!winnerId) continue;

      await supabase
        .from("matches")
        .update({ status: "completed", score_a: 1, score_b: 0 })
        .eq("id", dbMatch.id);

      const { data: winnerTeam } = await supabase
        .from("tournament_teams")
        .select("points")
        .eq("id", winnerId)
        .single();

      if (winnerTeam) {
        await supabase
          .from("tournament_teams")
          .update({ points: (winnerTeam.points ?? 0) + 3 })
          .eq("id", winnerId);
      }

      if (dbMatch.bracket_position !== null && typeof dbMatch.bracket_position === "number") {
        const nextRound = dbMatch.round + 1;
        const nextPosition = Math.ceil(dbMatch.bracket_position / 2);
        const { data: nextMatch } = await supabase
          .from("matches")
          .select("id, team_a_id, team_b_id")
          .eq("tournament_id", id)
          .eq("round", nextRound)
          .eq("bracket_position", nextPosition)
          .maybeSingle();

        if (nextMatch) {
          const isOdd = dbMatch.bracket_position % 2 === 1;
          await supabase
            .from("matches")
            .update(isOdd ? { team_a_id: winnerId } : { team_b_id: winnerId })
            .eq("id", nextMatch.id);
        }
      }
    }
  }

  const { data: finalMatches } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", id)
    .order("round")
    .order("bracket_position");

  return NextResponse.json({ matches: finalMatches });
}
