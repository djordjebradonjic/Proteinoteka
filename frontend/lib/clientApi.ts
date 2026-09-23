/**
 * Base path for backend calls made from the browser. It goes through the Next.js proxy
 * (app/api/data/[...path]/route.ts), never straight to the backend: with API_REQUIRE_TOKEN on,
 * the backend refuses /api/v1 calls that don't come from this server. Server code uses apiFetch.
 */
export const CLIENT_API = "/api/data";
