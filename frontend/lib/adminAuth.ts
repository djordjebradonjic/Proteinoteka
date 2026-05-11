import { NextRequest } from "next/server";

const COOKIE = "admin_session";

async function expectedToken(): Promise<string> {
  const raw = `${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function isAdminAuthenticated(req: NextRequest): Promise<boolean> {
  const cookie = req.cookies.get(COOKIE)?.value;
  if (!cookie) return false;
  return cookie === await expectedToken();
}
