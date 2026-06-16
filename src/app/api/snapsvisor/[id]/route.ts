import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hasRole, type Role } from "@/lib/roles";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.cookies.get("midsommar_user_id")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: visa } = await supabase.from("custom_snapsvisor").select("created_by").eq("id", id).single();
  if (!visa) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const callerRole = req.cookies.get("midsommar_role")?.value as Role;
  const isAdmin = hasRole(callerRole, "lekledare");
  const isOwner = visa.created_by === userId;

  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from("custom_snapsvisor").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
