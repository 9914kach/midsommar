import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateRoundRobinMatches, generateBracketMatches } from "@/lib/tournament";

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
  let matches;

  if (tournament.format === "round_robin") {
    matches = generateRoundRobinMatches(teamIds, id);
  } else if (tournament.format === "bracket") {
    matches = generateBracketMatches(teamIds, id);
  } else {
    matches = generateRoundRobinMatches(teamIds, id);
  }

  const { data: inserted, error } = await supabase
    .from("matches")
    .insert(matches)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ matches: inserted });
}
