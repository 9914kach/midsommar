import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { username } = await request.json();

  const clean = username?.trim().toLowerCase().replace(/[^a-z0-9_\-åäö]/gi, "");
  if (!clean || clean.length < 2 || clean.length > 20) {
    return NextResponse.json(
      { error: "Användarnamn måste vara 2–20 tecken" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("users")
    .insert({ username: clean })
    .select("id, username")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Namnet är taget, välj ett annat" }, { status: 409 });
    }
    return NextResponse.json({ error: "Något gick fel" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true, user: data });
  response.cookies.set("midsommar_user_id", data.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  response.cookies.set("midsommar_username", data.username, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
