import { NextRequest } from "next/server";
import { safeEqual } from "@/lib/safeEqual";

const COOKIE = "admin_session";

async function expectedToken(): Promise<string> {
  const raw = `${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function isAdminAuthenticated(req: NextRequest): Promise<boolean> {
  // Fail closed: without credentials configured the expected cookie would be a hash of
  // "undefined:undefined", which anyone could compute.
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) return false;
  const cookie = req.cookies.get(COOKIE)?.value;
  if (!cookie) return false;
  return safeEqual(cookie, await expectedToken());
}
