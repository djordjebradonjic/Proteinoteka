const COOKIE = "wl_email";
const COOKIE_DAYS = 60;
const API = () => process.env.NEXT_PUBLIC_API_URL ?? "";

export function getWishlistEmail(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function setWishlistEmail(email: string): void {
  const maxAge = COOKIE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE}=${encodeURIComponent(email)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

export function clearWishlistEmail(): void {
  document.cookie = `${COOKIE}=; max-age=0; path=/`;
}

export async function fetchWishlistIds(email: string): Promise<number[]> {
  try {
    const res = await fetch(
      `${API()}/api/v1/wishlist?email=${encodeURIComponent(email)}`,
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function pushWishlistToBackend(
  email: string,
  productIds: number[],
): Promise<void> {
  try {
    await fetch(`${API()}/api/v1/wishlist/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, productIds }),
    });
  } catch {
    // fire-and-forget — local state is always the source of truth
  }
}

export async function fetchProductById(id: number): Promise<unknown | null> {
  try {
    const res = await fetch(`${API()}/api/v1/products/${id}`);
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}
