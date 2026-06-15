import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Role } from "@/lib/roles";

const COOKIE_OPTS = (pub = false) => ({
  httpOnly: !pub,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
});

export async function POST(request: NextRequest) {
  const { username } = await request.json();

  const clean = username?.trim().toLowerCase().replace(/[^a-z0-9_\-åäö]/gi, "");
  if (!clean || clean.length < 2 || clean.length > 20) {
    return NextResponse.json({ error: "Användarnamn måste vara 2–20 tecken" }, { status: 400 });
  }

  const { count } = await supabase.from("users").select("*", { count: "exact", head: true });
  const role: Role = count === 0 ? "admin" : "gäst";

  const { data, error } = await supabase
    .from("users")
    .insert({ username: clean, role })
    .select("id, username, role")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Namnet är taget, välj ett annat" }, { status: 409 });
    }
    return NextResponse.json({ error: "Något gick fel" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true, user: data });
  response.cookies.set("midsommar_user_id", data.id, COOKIE_OPTS());
  response.cookies.set("midsommar_user_id_pub", data.id, COOKIE_OPTS(true));
  response.cookies.set("midsommar_username", data.username, COOKIE_OPTS(true));
  response.cookies.set("midsommar_role", data.role, COOKIE_OPTS(true));
  return response;
}
