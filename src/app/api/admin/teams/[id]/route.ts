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
  const body = await req.json();
  const payload: { name?: string; color?: string; emoji?: string } = {};
  if (body.name !== undefined) payload.name = body.name;
  if (body.color !== undefined) payload.color = body.color;
  if (body.emoji !== undefined) payload.emoji = body.emoji;

  const { data, error } = await supabase
    .from("official_teams")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ team: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasRole(getRole(req), "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await supabase
    .from("tournament_teams")
    .update({ official_team_id: null })
    .eq("official_team_id", id);

  await supabase.from("official_team_members").delete().eq("team_id", id);

  const { error } = await supabase.from("official_teams").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
