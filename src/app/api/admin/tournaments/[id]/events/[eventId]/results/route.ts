import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST { results: [{ teamId: string, value: number | null }] }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const { eventId } = await params;
  const { results } = await request.json();

  if (!Array.isArray(results)) return NextResponse.json({ error: "results must be array" }, { status: 400 });

  const rows = results.map(({ teamId, value }: { teamId: string; value: number | null }) => ({
    event_id: eventId,
    tournament_team_id: teamId,
    value,
  }));

  const { error } = await supabase
    .from("tournament_event_results")
    .upsert(rows, { onConflict: "event_id,tournament_team_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
