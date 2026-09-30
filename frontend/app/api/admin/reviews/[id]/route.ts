import { NextRequest, NextResponse } from "next/server";
import { auditLog } from "@/lib/adminAuth";
import { forwardToBackend, requireAdmin } from "@/lib/adminProxy";

type Ctx = { params: Promise<{ id: string }> };

async function act(req: NextRequest, { params }: Ctx, method: "PUT" | "DELETE") {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Neispravan id" }, { status: 400 });
  const res = await forwardToBackend(
    method === "PUT" ? `/api/admin/reviews/${id}/approve` : `/api/admin/reviews/${id}`, { method });
  if (res.ok) await auditLog(req, method === "PUT" ? "REVIEW_APPROVED" : "REVIEW_REJECTED", `#${id}`);
  return res;
}

export const PUT = (req: NextRequest, ctx: Ctx) => act(req, ctx, "PUT");
export const DELETE = (req: NextRequest, ctx: Ctx) => act(req, ctx, "DELETE");
