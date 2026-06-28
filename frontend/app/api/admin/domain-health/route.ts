import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

interface PageResult {
  path: string;
  status: number | null;
  ok: boolean;
  ms: number;
}

interface DomainResult {
  domain: string;
  market: string;
  reachable: boolean;
  responseMs: number | null;
  pages: PageResult[];
}

const RS_DOMAIN = "https://www.proteinoteka.rs";
const HR_DOMAIN = "https://www.proteinoteka.com.hr";

const RS_PAGES = [
  "/",
  "/najjeftiniji-whey-protein",
  "/kazein-protein-srbija",
  "/biljni-protein-srbija",
];

const HR_PAGES = [
  "/",
  "/whey-protein-cijena",
  "/najjeftiniji-whey-protein-hrvatska",
  "/kazein-protein-hrvatska",
];

async function checkPage(baseUrl: string, path: string): Promise<PageResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    return { path, status: res.status, ok: res.ok, ms: Date.now() - start };
  } catch {
    return { path, status: null, ok: false, ms: Date.now() - start };
  }
}

async function checkDomain(domain: string, market: string, pages: string[]): Promise<DomainResult> {
  const start = Date.now();
  let reachable = false;
  let responseMs: number | null = null;

  try {
    const res = await fetch(domain, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    reachable = res.ok;
    responseMs = Date.now() - start;
  } catch {
    responseMs = Date.now() - start;
  }

  const pageResults = await Promise.all(pages.map(p => checkPage(domain, p)));

  return { domain, market, reachable, responseMs, pages: pageResults };
}

export async function GET(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rs, hr] = await Promise.all([
    checkDomain(RS_DOMAIN, "rs", RS_PAGES),
    checkDomain(HR_DOMAIN, "hr", HR_PAGES),
  ]);

  return NextResponse.json({ rs, hr, checkedAt: new Date().toISOString() });
}
