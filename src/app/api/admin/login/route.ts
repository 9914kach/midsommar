import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("midsommar_admin", process.env.ADMIN_PASSWORD!, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });
  return response;
}
