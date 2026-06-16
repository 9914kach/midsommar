import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hasRole } from "@/lib/roles";
import type { Role } from "@/lib/roles";

function getRole(req: NextRequest): Role {
  return (req.cookies.get("midsommar_role")?.value ?? "gäst") as Role;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasRole(getRole(req), "lekledare")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const { data: tournament } = await supabase.from("tournaments").select("format").eq("id", id).single();

  if (tournament?.format === "multi_event") {
    const { data: teams } = await supabase.from("tournament_teams").select("id").eq("tournament_id", id);
    const teamIds = (teams ?? []).map((t) => t.id);
    if (teamIds.length > 0) {
      const { error: resultsErr } = await supabase.from("tournament_event_results").delete().in("tournament_team_id", teamIds);
      if (resultsErr) return NextResponse.json({ error: resultsErr.message }, { status: 500 });
    }
    await supabase.from("app_settings").delete().in("key", ["femkamp_active_event", "femkamp_finished"]);
    return NextResponse.json({ ok: true });
  }

  const { error: matchErr } = await supabase
    .from("matches")
    .delete()
    .eq("tournament_id", id);

  if (matchErr) return NextResponse.json({ error: matchErr.message }, { status: 500 });

  const { error: pointsErr } = await supabase
    .from("tournament_teams")
    .update({ points: 0 })
    .eq("tournament_id", id);

  if (pointsErr) return NextResponse.json({ error: pointsErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
