import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hasRole } from "@/lib/roles";
import type { Role } from "@/lib/roles";

function getRole(req: NextRequest): Role {
  return (req.cookies.get("midsommar_role")?.value ?? "gäst") as Role;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasRole(getRole(req), "lekledare")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();

  const { data, error } = await supabase
    .from("tournaments")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tournament: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasRole(getRole(req), "lekledare")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const teamIds = (await supabase.from("tournament_teams").select("id").eq("tournament_id", id)).data?.map((t) => t.id) ?? [];
  const eventIds = (await supabase.from("tournament_events").select("id").eq("tournament_id", id)).data?.map((e) => e.id) ?? [];

  if (teamIds.length > 0) {
    await supabase.from("tournament_event_results").delete().in("tournament_team_id", teamIds);
  }
  if (eventIds.length > 0) {
    await supabase.from("tournament_events").delete().in("id", eventIds);
  }
  await supabase.from("matches").delete().eq("tournament_id", id);
  if (teamIds.length > 0) {
    await supabase.from("tournament_team_members").delete().in("tournament_team_id", teamIds);
  }
  await supabase.from("tournament_teams").delete().eq("tournament_id", id);
  await supabase.from("app_settings").delete().eq("key", "femkamp_active_event");

  const { error } = await supabase.from("tournaments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
