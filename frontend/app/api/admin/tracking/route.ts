import { NextRequest } from "next/server";
import { auditLog } from "@/lib/adminAuth";
import { forwardToBackend, requireAdmin } from "@/lib/adminProxy";

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const keep = req.nextUrl.searchParams.get("keepClickOut") === "true";
  const market = req.nextUrl.searchParams.get("market");
  const qs = new URLSearchParams();
  if (keep) qs.set("keepClickOut", "true");
  if (market === "rs" || market === "hr") qs.set("market", market);
  const res = await forwardToBackend(`/api/v1/admin/tracking${qs.size ? `?${qs}` : ""}`, { method: "DELETE" });
  if (res.ok) await auditLog(req, "TRACKING_CLEARED", `${keep ? "bez Kupi" : "sve"}, tržište: ${market ?? "sva"}`);
  return res;
}
