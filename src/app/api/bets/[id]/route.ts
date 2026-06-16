import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hasRole, type Role } from "@/lib/roles";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const callerRole = req.cookies.get("midsommar_role")?.value as Role;
  if (!hasRole(callerRole, "värd")) {
    return NextResponse.json({ error: "Ingen behörighet" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const payload: Record<string, unknown> = {};
  if (body.status !== undefined) payload.status = body.status;
  if (body.winner_side !== undefined) payload.winner_side = body.winner_side;

  const { error } = await supabase.from("bets").update(payload).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const callerRole = request.cookies.get("midsommar_role")?.value as Role;
  if (!hasRole(callerRole, "värd")) {
    return NextResponse.json({ error: "Ingen behörighet" }, { status: 403 });
  }

  const { id } = await params;

  await supabase.from("bet_entries").delete().eq("bet_id", id);
  const { error } = await supabase.from("bets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
