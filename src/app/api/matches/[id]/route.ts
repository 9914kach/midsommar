import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { score_a, score_b, status } = body;

  const updatePayload: {
    score_a?: number;
    score_b?: number;
    status?: "pending" | "active" | "completed";
  } = {};
  if (score_a !== undefined) updatePayload.score_a = score_a;
  if (score_b !== undefined) updatePayload.score_b = score_b;
  if (status !== undefined) updatePayload.status = status;

  const { data: match, error } = await supabase
    .from("matches")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (status === "completed" && match.team_a_id && match.team_b_id) {
    const finalScoreA = score_a ?? match.score_a;
    const finalScoreB = score_b ?? match.score_b;

    let winnerId: string | null = null;
    let loserId: string | null = null;
    const isDraw = finalScoreA === finalScoreB;

    if (!isDraw) {
      winnerId = finalScoreA > finalScoreB ? match.team_a_id : match.team_b_id;
      loserId = finalScoreA > finalScoreB ? match.team_b_id : match.team_a_id;
    }

    if (isDraw) {
      const { data: teamA } = await supabase
        .from("tournament_teams")
        .select("points")
        .eq("id", match.team_a_id)
        .single();
      const { data: teamB } = await supabase
        .from("tournament_teams")
        .select("points")
        .eq("id", match.team_b_id)
        .single();

      if (teamA) {
        await supabase
          .from("tournament_teams")
          .update({ points: (teamA.points ?? 0) + 1 })
          .eq("id", match.team_a_id);
      }
      if (teamB) {
        await supabase
          .from("tournament_teams")
          .update({ points: (teamB.points ?? 0) + 1 })
          .eq("id", match.team_b_id);
      }
    } else if (winnerId && loserId) {
      const { data: winner } = await supabase
        .from("tournament_teams")
        .select("points")
        .eq("id", winnerId)
        .single();

      if (winner) {
        await supabase
          .from("tournament_teams")
          .update({ points: (winner.points ?? 0) + 3 })
          .eq("id", winnerId);
      }

      if (match.bracket_position !== null && match.bracket_position !== undefined) {
        const nextRound = match.round + 1;
        const nextPosition = Math.ceil(match.bracket_position / 2);

        const { data: nextMatch } = await supabase
          .from("matches")
          .select("id, team_a_id, team_b_id")
          .eq("tournament_id", match.tournament_id)
          .eq("round", nextRound)
          .eq("bracket_position", nextPosition)
          .maybeSingle();

        if (nextMatch) {
          const isOdd = match.bracket_position % 2 === 1;
          await supabase
            .from("matches")
            .update(isOdd ? { team_a_id: winnerId } : { team_b_id: winnerId })
            .eq("id", nextMatch.id);
        }
      }
    }
  }

  return NextResponse.json({ match });
}
