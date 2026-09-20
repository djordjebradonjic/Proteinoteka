/**
 * fetch() for calls the Next.js server makes to the backend API (SSR, ISR, sitemap).
 *
 * The backend rate-limits /api/v1 per IP, and every server-side call comes from the same few
 * Vercel IPs, so they identify themselves with RATE_LIMIT_BYPASS_TOKEN. The token is added only
 * for URLs under NEXT_PUBLIC_API_URL so it can never reach a third-party host, and it is a
 * server-only env var (no NEXT_PUBLIC_ prefix) so it is never bundled into client code.
 */
export function apiFetch(input: string | URL, init: RequestInit & { next?: NextFetchRequestConfig } = {}) {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const token = process.env.RATE_LIMIT_BYPASS_TOKEN;
  const url = input.toString();
  if (!token || !base || !url.startsWith(base)) return fetch(input, init);

  const headers = new Headers(init.headers);
  headers.set("X-Internal-Token", token);
  return fetch(input, { ...init, headers });
}
