import { NextRequest, NextResponse } from "next/server";
import { auditLog } from "@/lib/adminAuth";
import { forwardToBackend, requireAdmin } from "@/lib/adminProxy";

export async function GET(req: NextRequest) {
  return (await requireAdmin(req)) ?? forwardToBackend("/api/admin/groups");
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  let body: { productIds?: unknown; canonicalName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neispravan zahtev" }, { status: 400 });
  }
  const ids = Array.isArray(body.productIds) ? body.productIds : [];
  if (ids.length < 2 || !ids.every(i => Number.isInteger(i) && i > 0)) {
    return NextResponse.json({ error: "Potrebna su najmanje 2 ispravna ID-a proizvoda" }, { status: 400 });
  }
  const res = await forwardToBackend("/api/admin/groups/confirm", {
    method: "POST",
    body: { productIds: ids, canonicalName: typeof body.canonicalName === "string" ? body.canonicalName : undefined },
  });
  if (res.ok) await auditLog(req, "GROUP_CREATED", ids.join(","));
  return res;
}
