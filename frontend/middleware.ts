import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Prefer x-forwarded-host (set by Railway/Vercel reverse proxy) over Host header.
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";

  if (host.startsWith("www.")) {
    const url = request.nextUrl.clone();
    // Strip 'www.' and force HTTPS — Railway terminates TLS before the app.
    url.host = host.slice(4);
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on every request except Next.js internals and static assets.
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
};
