import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_TOKEN;
  const auth = req.headers.get("Authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("products");
  return NextResponse.json({ revalidated: true, timestamp: new Date().toISOString() });
}
