import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

const BACKEND = () => process.env.NEXT_PUBLIC_API_URL ?? "";

export const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

/**
 * Forwards to a backend admin endpoint with the server-side token and relays status + JSON body.
 * Backend failures become 503 instead of an unhandled 500 with an HTML body.
 */
export async function forwardToBackend(
  path: string,
  init: { method?: string; body?: unknown; timeoutMs?: number } = {},
): Promise<NextResponse> {
  try {
    const res = await fetch(`${BACKEND()}${path}`, {
      method: init.method ?? "GET",
      headers: {
        "X-Admin-Token": process.env.ADMIN_TOKEN ?? "",
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(init.timeoutMs ?? 60_000),
    });
    const text = await res.text();
    if (!text) return new NextResponse(null, { status: res.status === 204 ? 204 : res.status });
    try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
      return NextResponse.json({ message: text }, { status: res.status });
    }
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }
}

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  return (await isAdminAuthenticated(req)) ? null : unauthorized();
}
