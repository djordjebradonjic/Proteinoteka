import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "";
const TOKEN   = process.env.ADMIN_TOKEN ?? "";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND}/api/admin/groups/${id}`, {
      method: "DELETE",
      headers: { "X-Admin-Token": TOKEN },
    });
    return new NextResponse(null, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }
}
