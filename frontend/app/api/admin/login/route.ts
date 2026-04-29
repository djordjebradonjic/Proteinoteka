import { NextRequest, NextResponse } from "next/server";

const COOKIE = "admin_session";

async function sessionToken(): Promise<string> {
  const raw = `${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = await sessionToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dana
      path: "/",
    });
    return res;
  }

  return NextResponse.json({ error: "Pogrešni kredencijali" }, { status: 401 });
}
