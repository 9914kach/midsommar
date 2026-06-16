import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const COOKIE_OPTS = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
};

export async function GET(request: NextRequest) {
  const userId = request.cookies.get("midsommar_user_id")?.value;
  if (!userId) return NextResponse.json({ user: null });

  const { data: user } = await supabase
    .from("users")
    .select("id, username, role")
    .eq("id", userId)
    .single();

  if (!user) return NextResponse.json({ user: null });

  const res = NextResponse.json({ user });
  res.cookies.set("midsommar_role", user.role, COOKIE_OPTS);
  res.cookies.set("midsommar_username", user.username, COOKIE_OPTS);
  res.cookies.set("midsommar_user_id_pub", user.id, COOKIE_OPTS);
  return res;
}
