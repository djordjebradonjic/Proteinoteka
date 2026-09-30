import { NextRequest, NextResponse } from "next/server";
import { auditLog } from "@/lib/adminAuth";
import { forwardToBackend, requireAdmin } from "@/lib/adminProxy";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Neispravan id" }, { status: 400 });
  const res = await forwardToBackend(`/api/admin/groups/${id}`, { method: "DELETE" });
  if (res.ok) await auditLog(req, "GROUP_DELETED", `#${id}`);
  return res;
}
