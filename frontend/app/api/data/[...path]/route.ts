import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/apiFetch";

/**
 * The browser's only way to the backend API: /api/data/<path> → <backend>/api/v1/<path>.
 *
 * With API_REQUIRE_TOKEN on, the backend answers /api/v1 only to requests carrying
 * RATE_LIMIT_BYPASS_TOKEN, so the Railway URL is useless to scrapers and every browser call has
 * to pass here, behind the Vercel firewall. Only what the site's client components call is
 * forwarded. X-Client-IP tells the backend who the visitor is, so its per-IP rate limit and
 * page-size cap still apply to them; server rendering sends no X-Client-IP and is not limited.
 * The "Kupi" /buy links and the email links still go straight to the backend (open under the lock).
 */
const ROUTES: { method: string; path: RegExp; cacheable: boolean }[] = [
  { method: "GET", path: /^products$/, cacheable: true },
  { method: "GET", path: /^products\/(search|brands|flavours|weight-distribution|compare)$/, cacheable: true },
  { method: "GET", path: /^products\/\d+$/, cacheable: true },
  { method: "GET", path: /^wishlist$/, cacheable: false },
  { method: "POST", path: /^products\/\d+\/reviews$/, cacheable: false },
  { method: "POST", path: /^wishlist\/(save|alert)$/, cacheable: false },
  { method: "DELETE", path: /^wishlist\/alert$/, cacheable: false },
];

// Same answer for every visitor, so Vercel's CDN can serve repeated filter clicks without a function call.
const CDN_CACHE = "public, s-maxage=60, stale-while-revalidate=300";

function clientIp(req: NextRequest): string {
  // Vercel sets both from the connection and overwrites what the client sent.
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

async function forward(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const path = (await ctx.params).path.join("/");
  const route = ROUTES.find(r => r.method === req.method && r.path.test(path));
  if (!route) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const headers: Record<string, string> = { "X-Client-IP": clientIp(req) };
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  let res: Response;
  try {
    res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/${path}${req.nextUrl.search}`, {
      method: req.method,
      headers,
      body: req.method === "GET" ? undefined : (await req.text()) || undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }

  const out = new NextResponse(res.body, { status: res.status });
  out.headers.set("Content-Type", res.headers.get("content-type") ?? "application/json");
  const retryAfter = res.headers.get("retry-after");
  if (retryAfter) out.headers.set("Retry-After", retryAfter);
  out.headers.set("Cache-Control", route.cacheable && res.ok ? CDN_CACHE : "private, no-store");
  return out;
}

export { forward as GET, forward as POST, forward as DELETE };
