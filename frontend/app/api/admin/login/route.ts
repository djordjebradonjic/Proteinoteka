import { NextRequest, NextResponse } from "next/server";
import { safeEqual } from "@/lib/safeEqual";
import { ADMIN_COOKIE, SESSION_MAX_AGE_S, auditLog, clientIp, createSessionToken } from "@/lib/adminAuth";

// Best-effort limiter: max 5 failed attempts per IP per 15 minutes. It lives in process memory, so
// on serverless it only slows a single instance down; a Vercel WAF rate-limit rule on this path is
// the real protection.
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED_IPS = 5000;

function pruneExpired(now: number) {
  if (failedAttempts.size < MAX_TRACKED_IPS) return;
  for (const [ip, entry] of failedAttempts) if (now > entry.resetAt) failedAttempts.delete(ip);
  // Still full of live entries (an attack): drop the oldest half rather than grow unbounded.
  if (failedAttempts.size >= MAX_TRACKED_IPS) {
    [...failedAttempts.keys()].slice(0, MAX_TRACKED_IPS / 2).forEach(ip => failedAttempts.delete(ip));
  }
}

function isRateLimited(ip: string): boolean {
  const entry = failedAttempts.get(ip);
  return !!entry && Date.now() <= entry.resetAt && entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  pruneExpired(now);
  const entry = failedAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    failedAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count++;
  }
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Previše neuspelih pokušaja. Pokušajte ponovo za 15 minuta." },
      { status: 429 },
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neispravan zahtev" }, { status: 400 });
  }

  // Evaluate both comparisons (no short-circuit) and require the env vars to be set, so an
  // unconfigured deployment can never be logged into with empty/undefined credentials.
  const userOk = safeEqual(body.username as string, process.env.ADMIN_USERNAME);
  const passOk = safeEqual(body.password as string, process.env.ADMIN_PASSWORD);
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && userOk && passOk) {
    failedAttempts.delete(ip);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, await createSessionToken(), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_S,
      path: "/",
    });
    await auditLog(req, "LOGIN", "uspešna prijava");
    return res;
  }

  recordFailure(ip);
  await auditLog(req, "LOGIN_FAILED", "pogrešni kredencijali");
  return NextResponse.json({ error: "Pogrešni kredencijali" }, { status: 401 });
}
