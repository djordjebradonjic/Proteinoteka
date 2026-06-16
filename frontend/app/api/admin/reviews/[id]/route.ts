import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "";
const TOKEN   = process.env.ADMIN_TOKEN ?? "";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const res = await fetch(`${BACKEND}/api/admin/reviews/${id}/approve`, {
    method: "PUT",
    headers: { "X-Admin-Token": TOKEN },
  });
  return new NextResponse(null, { status: res.status });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const res = await fetch(`${BACKEND}/api/admin/reviews/${id}`, {
    method: "DELETE",
    headers: { "X-Admin-Token": TOKEN },
  });
  return new NextResponse(null, { status: res.status });
}
