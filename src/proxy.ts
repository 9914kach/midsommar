import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/login"];
const SETUP_PATHS = ["/setup", "/api/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const auth = request.cookies.get("midsommar_auth");
  if (!auth || auth.value !== process.env.SITE_PASSWORD) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin/login") || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    const role = request.cookies.get("midsommar_role")?.value;
    const adminCookie = request.cookies.get("midsommar_admin");
    const hasRoleCookie = role === "admin" || role === "lekledare" || role === "värd";
    const hasAdminCookie = adminCookie && adminCookie.value === process.env.ADMIN_PASSWORD;
    if (!hasRoleCookie && !hasAdminCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const adminCookie = request.cookies.get("midsommar_admin");
    if (!adminCookie || adminCookie.value !== process.env.ADMIN_PASSWORD) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
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
