import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { newsletterFromAddress } from "@/lib/emailSender";

const resend = new Resend(process.env.RESEND_API_KEY);
const DOMAIN = MARKET_CONFIG[CURRENT_MARKET].domain;
const SITE_URL = `https://${DOMAIN}`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_SOURCES = new Set([
  "footer",
  "modal_scroll",
  "modal_exit_intent",
  "inline_banner",
  "alert_crosssell",
  "landing_page",
]);

export async function POST(req: NextRequest) {
  let body: { email: string; source?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neispravan zahtev" }, { status: 400 });
  }

  const { email, source } = body;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Neispravan email" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedSource = source && VALID_SOURCES.has(source) ? source : "unknown";

  // Save to DB — fire and forget, don't block email send
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalizedEmail, market: CURRENT_MARKET, source: normalizedSource }),
  }).catch(err => console.error("[newsletter] Failed to save subscriber:", err));

  try {
    await resend.emails.send({
      from: newsletterFromAddress(CURRENT_MARKET),
      to: normalizedEmail,
      subject: "Dobrodošao u Proteinoteka newsletter 🎉",
      html: `
<!DOCTYPE html>
<html lang="${MARKET_CONFIG[CURRENT_MARKET].lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07)">

        <!-- Header -->
        <tr>
          <td style="background:#131921;padding:32px 36px">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#FF9900;letter-spacing:2px;text-transform:uppercase">Proteinoteka</p>
            <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;line-height:1.3">Prijava uspešna 💪</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 36px">
            <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6">
              Dva puta mesečno šaljemo pregled najvećih ušteda: gde su cene najviše pale, koje akcije traju i koji proizvodi trenutno nude najbolju vrednost za tvoj novac.
            </p>
            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6">Bez spama. Otkazivanje u jednom kliku, u svakom mejlu.</p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 36px 32px">
            <a href="${SITE_URL}" style="display:block;background:linear-gradient(135deg,#FF9900,#e68a00);color:#131921;font-weight:900;font-size:15px;text-align:center;text-decoration:none;padding:16px;border-radius:12px">
              Pogledaj trenutne akcije →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6">
              Ovaj email si primio jer si se prijavio na newsletter na ${DOMAIN}.<br>
              <a href="${SITE_URL}" style="color:#FF9900;text-decoration:none">${DOMAIN}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
      `.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ error: "Greška pri prijavi" }, { status: 500 });
  }
}
