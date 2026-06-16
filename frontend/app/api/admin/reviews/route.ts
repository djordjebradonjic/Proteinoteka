import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "";
const TOKEN   = process.env.ADMIN_TOKEN ?? "";

export async function GET(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const res = await fetch(`${BACKEND}/api/admin/reviews`, {
    headers: { "X-Admin-Token": TOKEN },
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
