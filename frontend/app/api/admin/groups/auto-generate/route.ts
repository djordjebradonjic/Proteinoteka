import { NextRequest } from "next/server";
import { auditLog } from "@/lib/adminAuth";
import { forwardToBackend, requireAdmin } from "@/lib/adminProxy";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const res = await forwardToBackend("/api/admin/groups/auto-generate", { method: "POST", timeoutMs: 280_000 });
  if (res.ok) await auditLog(req, "GROUPS_AUTO_GENERATE");
  return res;
}
