import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const clear = { maxAge: 0, path: "/" };
  response.cookies.set("midsommar_user_id", "", clear);
  response.cookies.set("midsommar_user_id_pub", "", clear);
  response.cookies.set("midsommar_username", "", clear);
  response.cookies.set("midsommar_role", "", clear);
  return response;
}
