const STORAGE_KEY = "wl_alerts";
const API = () => process.env.NEXT_PUBLIC_API_URL ?? "";

export interface AlertEntry {
  targetPrice?: number;
}

export type AlertsMap = Record<string, AlertEntry>;

// ── localStorage ─────────────────────────────────────────────────────────────

export function loadAlerts(): AlertsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function persistAlerts(alerts: AlertsMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch {}
}

export function hasAlert(productId: number): boolean {
  return String(productId) in loadAlerts();
}

export function getAlert(productId: number): AlertEntry | undefined {
  return loadAlerts()[String(productId)];
}

export function setAlertLocal(productId: number, entry: AlertEntry): void {
  const alerts = loadAlerts();
  alerts[String(productId)] = entry;
  persistAlerts(alerts);
}

export function removeAlertLocal(productId: number): void {
  const alerts = loadAlerts();
  delete alerts[String(productId)];
  persistAlerts(alerts);
}

// ── Backend API ───────────────────────────────────────────────────────────────

export async function createAlert(
  email: string,
  productId: number,
  targetPrice?: number,
): Promise<void> {
  const body: Record<string, unknown> = { email, productId };
  if (targetPrice !== undefined) body.targetPrice = targetPrice;

  const res = await fetch(`${API()}/api/v1/wishlist/alert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Alert API error: ${res.status}`);

  setAlertLocal(productId, targetPrice !== undefined ? { targetPrice } : {});
}

export async function deleteAlert(email: string, productId: number): Promise<void> {
  const res = await fetch(
    `${API()}/api/v1/wishlist/alert?email=${encodeURIComponent(email)}&productId=${productId}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error(`Alert delete error: ${res.status}`);
  removeAlertLocal(productId);
}
