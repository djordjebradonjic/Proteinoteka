import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const market = req.nextUrl.searchParams.get("market");
    const qs = market ? `?market=${encodeURIComponent(market)}` : "";
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/clicks/stats${qs}`,
      { headers: { "X-Admin-Token": process.env.ADMIN_TOKEN ?? "" } },
    );
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }
}
