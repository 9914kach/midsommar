import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hasRole, type Role } from "@/lib/roles";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const callerRole = request.cookies.get("midsommar_role")?.value as Role;
  const adminCookie = request.cookies.get("midsommar_admin")?.value;
  const isAdmin = callerRole === "admin" || adminCookie === process.env.ADMIN_PASSWORD;
  if (!isAdmin && !hasRole(callerRole, "värd")) {
    return NextResponse.json({ error: "Ingen behörighet" }, { status: 403 });
  }

  const { id } = await params;

  // Fetch target user to enforce constraints
  const { data: target } = await supabase.from("users").select("id, role").eq("id", id).single();
  if (!target) return NextResponse.json({ error: "Användaren finns inte" }, { status: 404 });

  // Värd can only delete gäster; admin can delete anyone below admin
  if (callerRole === "värd" && target.role !== "gäst") {
    return NextResponse.json({ error: "Värd kan bara ta bort gäster" }, { status: 403 });
  }
  if (target.role === "admin") {
    return NextResponse.json({ error: "Kan inte ta bort admin" }, { status: 403 });
  }

  await supabase.from("official_team_members").delete().eq("user_id", id);
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
