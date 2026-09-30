import { NextRequest } from "next/server";
import { forwardToBackend, requireAdmin } from "@/lib/adminProxy";

export async function GET(req: NextRequest) {
  return (await requireAdmin(req)) ?? forwardToBackend("/api/admin/audit");
}
