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
  const { userId } = await req.json();

  await supabase.from("official_team_members").delete().eq("user_id", userId);

  const { error } = await supabase
    .from("official_team_members")
    .insert({ user_id: userId, team_id: id });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasRole(getRole(req), "lekledare")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { userId } = await req.json();

  const { error } = await supabase
    .from("official_team_members")
    .delete()
    .eq("user_id", userId)
    .eq("team_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
