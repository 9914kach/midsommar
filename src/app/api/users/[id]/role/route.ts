import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ALL_ROLES, type Role } from "@/lib/roles";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const callerRole = request.cookies.get("midsommar_role")?.value as Role;
  const adminCookie = request.cookies.get("midsommar_admin")?.value;
  const isAdmin = callerRole === "admin" || adminCookie === process.env.ADMIN_PASSWORD;
  if (!isAdmin) {
    return NextResponse.json({ error: "Endast admin" }, { status: 403 });
  }

  const { id } = await params;
  const { role } = await request.json();

  if (!ALL_ROLES.includes(role)) {
    return NextResponse.json({ error: "Ogiltig roll" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", id)
    .select("id, username, role")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data });
}
