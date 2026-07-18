import { CURRENT_MARKET, MARKET_CONFIG, Market } from "@/lib/marketConfig";
import { productUrl } from "@/lib/productUrl";

export interface CampaignPick {
  id: number;
  name: string;
  imageUrl: string | null;
  productUrl: string;
  storeName: string;
  numericPrice: number;
  previousPrice: number | null;
  currency: string;
}

export interface RawProduct {
  id: number;
  name: string;
  imageUrl: string | null;
  storeName: string;
  numericPrice: number | null;
  previousPrice: number | null;
  currency: string;
  proteinSource: string | null;
  canonicalSlug: string | null;
}

const IS_HR = CURRENT_MARKET === "hr";
const DOMAIN = MARKET_CONFIG[CURRENT_MARKET].domain;
const SITE_URL = `https://${DOMAIN}`;

// Placeholder swapped for each recipient's real unsubscribe link right before
// sending — lets us render the campaign HTML once instead of per-recipient.
export const UNSUB_PLACEHOLDER = "{{UNSUBSCRIBE_URL}}";

export function toCampaignPicks(products: RawProduct[]): CampaignPick[] {
  return products
    .filter(p => p.numericPrice != null)
    .map(p => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      productUrl: `${SITE_URL}${productUrl({ id: p.id, name: p.name, proteinSource: p.proteinSource, canonicalSlug: p.canonicalSlug })}`,
      storeName: p.storeName,
      numericPrice: p.numericPrice as number,
      previousPrice: p.previousPrice,
      currency: p.currency,
    }));
}

function formatPrice(n: number, market: Market) {
  return new Intl.NumberFormat(MARKET_CONFIG[market].locale).format(Math.round(n));
}

function pickRow(pick: CampaignPick): string {
  const dropPct = pick.previousPrice && pick.previousPrice > pick.numericPrice
    ? Math.round((1 - pick.numericPrice / pick.previousPrice) * 100)
    : null;

  return `
<tr>
  <td style="padding:14px 0;border-bottom:1px solid #f1f5f9">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        ${pick.imageUrl ? `
        <td width="64" style="padding-right:14px" valign="top">
          <img src="${pick.imageUrl}" width="56" height="56" alt="${pick.name}" style="border-radius:10px;border:1px solid #e2e8f0;object-fit:contain;background:#fff">
        </td>` : ""}
        <td valign="top">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#131921;line-height:1.4">${pick.name}</p>
          <p style="margin:0 0 6px;font-size:11px;color:#94a3b8">${pick.storeName}</p>
          <p style="margin:0">
            <span style="font-size:16px;font-weight:900;color:#FF9900">${formatPrice(pick.numericPrice, CURRENT_MARKET)} ${pick.currency}</span>
            ${pick.previousPrice ? `<span style="font-size:12px;color:#94a3b8;text-decoration:line-through;margin-left:6px">${formatPrice(pick.previousPrice, CURRENT_MARKET)} ${pick.currency}</span>` : ""}
            ${dropPct ? `<span style="font-size:11px;font-weight:800;color:#16a34a;margin-left:6px">-${dropPct}%</span>` : ""}
          </p>
        </td>
        <td width="80" valign="middle" align="right">
          <a href="${pick.productUrl}" style="display:inline-block;background:#1B2B4B;color:#ffffff;font-weight:700;font-size:11px;text-decoration:none;padding:8px 12px;border-radius:8px;white-space:nowrap">
            ${IS_HR ? "Pogledaj" : "Pogledaj"}
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

export function buildCampaignHtml(picks: CampaignPick[]): string {
  const heading = IS_HR ? "Najveće uštede ovog tjedna" : "Najveće uštede ove nedelje";
  const intro = IS_HR
    ? "Ovo su proizvodi s najvećim padom cijene koje smo primijetili od prošlog pregleda."
    : "Ovo su proizvodi sa najvećim padom cene koje smo primetili od prošlog pregleda.";

  return `
<!DOCTYPE html>
<html lang="${MARKET_CONFIG[CURRENT_MARKET].lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07)">

        <tr>
          <td style="background:#131921;padding:32px 36px">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#FF9900;letter-spacing:2px;text-transform:uppercase">Proteinoteka</p>
            <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;line-height:1.3">${heading}</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 36px 0">
            <p style="margin:0;font-size:14px;color:#475569;line-height:1.6">${intro}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:8px 36px 8px">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${picks.map(pickRow).join("")}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 36px 32px">
            <a href="${SITE_URL}" style="display:block;background:linear-gradient(135deg,#FF9900,#e68a00);color:#131921;font-weight:900;font-size:15px;text-align:center;text-decoration:none;padding:16px;border-radius:12px">
              ${IS_HR ? "Pogledaj sve akcije →" : "Pogledaj sve akcije →"}
            </a>
          </td>
        </tr>

        <tr>
          <td style="background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6">
              Primaš ovaj email jer si se prijavio na Proteinoteka newsletter.<br>
              <a href="${UNSUB_PLACEHOLDER}" style="color:#94a3b8;text-decoration:underline">Odjavi se</a> ·
              <a href="${SITE_URL}" style="color:#FF9900;text-decoration:none">${DOMAIN}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}
