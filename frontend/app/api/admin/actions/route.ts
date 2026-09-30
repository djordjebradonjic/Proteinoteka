import { NextRequest, NextResponse } from "next/server";
import { auditLog } from "@/lib/adminAuth";
import { forwardToBackend, requireAdmin } from "@/lib/adminProxy";

// Whitelist: the browser never chooses the backend path.
const ACTIONS: Record<string, string> = {
  "recalculate-scores": "/api/admin/recalculate-scores",
  "recalculate-price-changes": "/api/admin/recalculate-price-changes",
  "groups-refresh": "/api/admin/groups/refresh",
  "groups-auto-generate": "/api/admin/groups/auto-generate",
};

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  let action: string | undefined;
  try {
    action = (await req.json()).action;
  } catch {
    return NextResponse.json({ error: "Neispravan zahtev" }, { status: 400 });
  }
  const path = action ? ACTIONS[action] : undefined;
  if (!path) return NextResponse.json({ error: "Nepoznata akcija" }, { status: 400 });

  const res = await forwardToBackend(path, { method: "POST", timeoutMs: 280_000 });
  await auditLog(req, `ACTION_${action!.toUpperCase().replace(/-/g, "_")}`, `HTTP ${res.status}`);
  return res;
}
