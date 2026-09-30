import { NextRequest } from "next/server";
import { forwardToBackend, requireAdmin } from "@/lib/adminProxy";

export async function GET(req: NextRequest, { params }: { params: Promise<{ storeName: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { storeName } = await params;
  const days = req.nextUrl.searchParams.get("days") ?? "30";
  return forwardToBackend(
    `/api/admin/store-report/${encodeURIComponent(storeName)}?days=${encodeURIComponent(days)}`);
}
