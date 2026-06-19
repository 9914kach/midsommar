import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hasRole } from "@/lib/roles";
import type { Role } from "@/lib/roles";

function getRole(req: NextRequest): Role {
  return (req.cookies.get("midsommar_role")?.value ?? "gäst") as Role;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  if (!hasRole(getRole(req), "lekledare")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, teamId } = await params;

  const { data: activeMatches } = await supabase
    .from("matches")
    .select("id")
    .eq("tournament_id", id)
    .neq("status", "pending")
    .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
    .limit(1);

  if (activeMatches && activeMatches.length > 0) {
    return NextResponse.json(
      { error: "Laget har redan spelat. Återställ matcher för att ta bort det." },
      { status: 400 }
    );
  }

  await supabase
    .from("matches")
    .delete()
    .eq("tournament_id", id)
    .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`);

  await supabase.from("tournament_event_results").delete().eq("tournament_team_id", teamId);
  await supabase.from("tournament_team_members").delete().eq("tournament_team_id", teamId);

  const { error } = await supabase
    .from("tournament_teams")
    .delete()
    .eq("id", teamId)
    .eq("tournament_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
