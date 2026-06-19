import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Role } from "@/lib/roles";

const DEFAULT_NAMES = [
  "kalle", "lisa", "erik", "anna", "magnus", "sara",
  "johan", "emma", "anders", "maria", "bjorn", "sofia",
  "niklas", "hanna", "marcus", "maja", "henrik", "ida",
  "daniel", "julia",
];

export async function POST(request: NextRequest) {
  const role = request.cookies.get("midsommar_role")?.value;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const names: string[] = Array.isArray(body.names) ? body.names : DEFAULT_NAMES;

  const rows = names.map((n) => ({ username: n.toLowerCase().trim(), role: "gäst" as Role }));

  const { data, error } = await supabase
    .from("users")
    .upsert(rows, { onConflict: "username", ignoreDuplicates: true })
    .select("id, username, role");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, created: data?.length ?? 0, users: data });
}

export async function DELETE(request: NextRequest) {
  const role = request.cookies.get("midsommar_role")?.value;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const myId = request.cookies.get("midsommar_user_id")?.value;

  const { data: toDelete } = await supabase
    .from("users")
    .select("id")
    .eq("role", "gäst")
    .neq("id", myId ?? "");

  const ids = (toDelete ?? []).map((u) => u.id);

  if (ids.length > 0) {
    await supabase.from("bet_entries").delete().in("user_id", ids);
  }

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("role", "gäst")
    .neq("id", myId ?? "");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
