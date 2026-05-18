import { NextRequest, NextResponse } from "next/server";

const COOKIE = "admin_session";

async function sessionToken(): Promise<string> {
  const raw = `${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // www → non-www redirect (runs on all routes via catch-all matcher)
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  if (host.startsWith("www.")) {
    const url = req.nextUrl.clone();
    url.host = host.slice(4);
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, { status: 301 });
  }

  // Admin auth guard — only for /admin and /api/admin routes
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin/login") || pathname.startsWith("/api/admin/login")) {
    return NextResponse.next();
  }

  try {
    const cookie = req.cookies.get(COOKIE)?.value;
    const expected = await sessionToken();
    if (cookie === expected) return NextResponse.next();
  } catch {
    // fall through to redirect
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Run on every request except Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
};
