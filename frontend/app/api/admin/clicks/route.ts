import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function DELETE(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/clicks`,
    {
      method: "DELETE",
      headers: { "X-Admin-Token": process.env.ADMIN_TOKEN ?? "" },
    },
  );
  return new NextResponse(null, { status: res.status });
}
