import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { buildCampaignHtml, toCampaignPicks, UNSUB_PLACEHOLDER, RawProduct } from "@/lib/newsletterCampaignEmail";
import { MARKET_CONFIG, Market } from "@/lib/marketConfig";
import { newsletterFromAddress } from "@/lib/emailSender";

const resend = new Resend(process.env.RESEND_API_KEY);
const API = process.env.NEXT_PUBLIC_API_URL;
const DIGEST_SIZE = 6;
const BATCH_SIZE = 100; // Resend batch.send hard limit per request

async function fetchDigestPicks(market: Market) {
  const res = await fetch(
    `${API}/api/v1/products?market=${market}&sort=lastPriceDropPct,desc&size=${DIGEST_SIZE}&page=0`,
  );
  if (!res.ok) throw new Error("Failed to fetch digest products");
  const page = await res.json();
  const products: RawProduct[] = (page.content ?? []).map((p: Record<string, unknown>) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.imageUrl,
    storeName: p.storeName,
    numericPrice: p.numericPrice,
    previousPrice: p.previousPrice,
    currency: p.currency,
    proteinSource: p.proteinSource,
    canonicalSlug: p.canonicalSlug,
  }));
  return toCampaignPicks(products);
}

interface ActiveSubscriber { email: string; unsubscribeToken: string; }

async function fetchActiveSubscribers(market: Market): Promise<ActiveSubscriber[]> {
  const res = await fetch(
    `${API}/api/v1/admin/newsletter/active-subscribers?market=${market}`,
    { headers: { "X-Admin-Token": process.env.ADMIN_TOKEN ?? "" } },
  );
  if (!res.ok) throw new Error("Failed to fetch active subscribers");
  return res.json();
}

function parseMarket(req: NextRequest): Market {
  const m = req.nextUrl.searchParams.get("market");
  return m === "hr" ? "hr" : "rs";
}

export async function GET(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const market = parseMarket(req);

  try {
    const [picks, subscribers, campaignsRes] = await Promise.all([
      fetchDigestPicks(market),
      fetchActiveSubscribers(market),
      fetch(`${API}/api/v1/admin/newsletter/campaigns?market=${market}`, {
        headers: { "X-Admin-Token": process.env.ADMIN_TOKEN ?? "" },
      }).then(r => r.ok ? r.json() : []),
    ]);

    const html = buildCampaignHtml(picks).replace(UNSUB_PLACEHOLDER, `${SiteUrl(market)}/newsletter/odjava`);

    return NextResponse.json({
      market,
      picks,
      recipientCount: subscribers.length,
      lastCampaign: campaignsRes[0] ?? null,
      html,
    });
  } catch (error) {
    console.error("Newsletter campaign preview error:", error);
    return NextResponse.json({ error: "Greška pri pripremi pregleda" }, { status: 500 });
  }
}

function SiteUrl(market: Market) {
  return `https://${MARKET_CONFIG[market].domain}`;
}

export async function POST(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { market?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neispravan zahtev" }, { status: 400 });
  }

  const market: Market = body.market === "hr" ? "hr" : "rs";

  try {
    const [picks, subscribers] = await Promise.all([
      fetchDigestPicks(market),
      fetchActiveSubscribers(market),
    ]);

    if (subscribers.length === 0) {
      return NextResponse.json({ error: "Nema aktivnih pretplatnika za ovo tržište" }, { status: 400 });
    }
    if (picks.length === 0) {
      return NextResponse.json({ error: "Nema proizvoda sa padom cene za digest" }, { status: 400 });
    }

    const baseHtml = buildCampaignHtml(picks);
    const from = newsletterFromAddress(market);
    const subject = market === "hr" ? "Najveće uštede ovog tjedna — Proteinoteka" : "Najveće uštede ove nedelje — Proteinoteka";

    let sentCount = 0;
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const chunk = subscribers.slice(i, i + BATCH_SIZE);
      const batch = chunk.map(sub => ({
        from,
        to: sub.email,
        subject,
        html: baseHtml.replace(
          UNSUB_PLACEHOLDER,
          `${API}/api/v1/newsletter/unsubscribe?token=${sub.unsubscribeToken}`,
        ),
      }));
      await resend.batch.send(batch);
      sentCount += chunk.length;
    }

    await fetch(`${API}/api/v1/admin/newsletter/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": process.env.ADMIN_TOKEN ?? "" },
      body: JSON.stringify({ market, sentCount }),
    }).catch(err => console.error("[newsletter] Failed to log campaign:", err));

    return NextResponse.json({ success: true, sentCount });
  } catch (error) {
    console.error("Newsletter campaign send error:", error);
    return NextResponse.json({ error: "Greška pri slanju kampanje" }, { status: 500 });
  }
}
