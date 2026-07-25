import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "";
const TOKEN   = process.env.ADMIN_TOKEN ?? "";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeName: string }> },
) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { storeName } = await params;
  const days = req.nextUrl.searchParams.get("days") ?? "30";

  const res = await fetch(
    `${BACKEND}/api/admin/store-report/${encodeURIComponent(storeName)}/pdf?days=${encodeURIComponent(days)}`,
    { headers: { "X-Admin-Token": TOKEN }, cache: "no-store" },
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to generate report" }, { status: res.status });
  }

  const pdf = await res.arrayBuffer();
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": res.headers.get("content-disposition")
        ?? `attachment; filename="proteinoteka-izvestaj-${storeName}.pdf"`,
    },
  });
}
