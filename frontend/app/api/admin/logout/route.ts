import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, auditLog } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  await auditLog(req, "LOGOUT");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" });
  return res;
}
