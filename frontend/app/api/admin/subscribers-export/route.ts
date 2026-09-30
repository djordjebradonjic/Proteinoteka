import { NextRequest, NextResponse } from "next/server";
import { auditLog } from "@/lib/adminAuth";
import { requireAdmin } from "@/lib/adminProxy";

/** CSV of active newsletter subscribers for one market (email only — never the unsubscribe token). */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const market = req.nextUrl.searchParams.get("market") === "hr" ? "hr" : "rs";
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/newsletter/active-subscribers?market=${market}`,
      { headers: { "X-Admin-Token": process.env.ADMIN_TOKEN ?? "" }, cache: "no-store" },
    );
    if (!res.ok) return NextResponse.json({ error: "Backend error" }, { status: res.status });
    const rows: { email: string }[] = await res.json();
    await auditLog(req, "SUBSCRIBERS_EXPORT", `${market}: ${rows.length}`);
    const csv = "email,market\n" + rows.map(r => `"${r.email.replace(/"/g, '""')}",${market}`).join("\n") + "\n";
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="newsletter-${market}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }
}
