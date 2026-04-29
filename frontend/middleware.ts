import { NextRequest, NextResponse } from "next/server";

const COOKIE = "admin_session";

async function sessionToken(): Promise<string> {
  const raw = `${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let the login page and its API through
  if (pathname.startsWith("/admin/login") || pathname.startsWith("/api/admin/login")) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE)?.value;
  const expected = await sessionToken();

  if (cookie === expected) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/login"],
};
