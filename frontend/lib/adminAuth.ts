import { NextRequest } from "next/server";
import { safeEqual } from "@/lib/safeEqual";

export const ADMIN_COOKIE = "admin_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24; // 24h, enforced server-side via the signed expiry

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");

async function hmac(payload: string): Promise<string> {
  // The key never leaves the server; ADMIN_SESSION_SECRET is optional and rotating it (or the
  // password) logs every session out.
  const secret = `${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}:${process.env.ADMIN_SESSION_SECRET ?? ""}`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

/** "<expiryMs>.<hmac>" — unlike a hash of the credentials it expires and leaks nothing offline-crackable. */
export async function createSessionToken(): Promise<string> {
  const exp = String(Date.now() + SESSION_MAX_AGE_S * 1000);
  return `${exp}.${await hmac(exp)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  // Fail closed: without credentials configured anyone could compute the key.
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) return false;
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const exp = token.slice(0, dot);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return safeEqual(token.slice(dot + 1), await hmac(exp));
}

export async function isAdminAuthenticated(req: NextRequest): Promise<boolean> {
  return verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

/** Rightmost X-Forwarded-For entry: the one our own proxy appended, not the client-supplied prefix. */
export function clientIp(req: NextRequest): string {
  const parts = req.headers.get("x-forwarded-for")?.split(",").map(s => s.trim()).filter(Boolean);
  return parts?.length ? parts[parts.length - 1] : (req.headers.get("x-real-ip") ?? "unknown");
}

/** Best-effort audit trail; an unreachable backend must never block the admin action itself. */
export async function auditLog(req: NextRequest, action: string, detail?: string): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": process.env.ADMIN_TOKEN ?? "" },
      body: JSON.stringify({ action, detail, ip: clientIp(req) }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // ignore
  }
}
