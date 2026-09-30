import { NextRequest } from "next/server";
import { auditLog } from "@/lib/adminAuth";
import { forwardToBackend, requireAdmin } from "@/lib/adminProxy";

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const market = req.nextUrl.searchParams.get("market");
  const qs = market === "rs" || market === "hr" ? `?market=${market}` : "";
  const res = await forwardToBackend(`/api/v1/admin/clicks${qs}`, { method: "DELETE" });
  if (res.ok) await auditLog(req, "CLICKS_CLEARED", `tržište: ${market ?? "sva"}`);
  return res;
}
