import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/login"];
const SETUP_PATHS = ["/setup", "/api/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const auth = request.cookies.get("midsommar_auth");
  if (!auth || auth.value !== process.env.SITE_PASSWORD) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (SETUP_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const userId = request.cookies.get("midsommar_user_id");
  if (!userId) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
