import { NextRequest, NextResponse } from "next/server";
import { auditLog } from "@/lib/adminAuth";
import { forwardToBackend, requireAdmin } from "@/lib/adminProxy";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  let body: { store?: string; types?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neispravan zahtev" }, { status: 400 });
  }
  if (!body.store || typeof body.store !== "string") {
    return NextResponse.json({ error: "Nedostaje prodavnica" }, { status: 400 });
  }
  if (body.types && !/^[a-z]+(,[a-z]+)*$/.test(body.types)) {
    return NextResponse.json({ error: "Neispravan tip" }, { status: 400 });
  }

  const qs = new URLSearchParams({ name: body.store });
  if (body.types) qs.set("types", body.types);
  const res = await forwardToBackend(`/api/admin/scrape/store?${qs}`, { method: "POST" });
  if (res.ok) await auditLog(req, "SCRAPE_STARTED", `${body.store}${body.types ? ` [${body.types}]` : ""}`);
  return res;
}
