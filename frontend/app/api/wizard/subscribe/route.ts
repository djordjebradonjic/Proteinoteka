import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GOAL_LABEL: Record<string, string> = {
  mass: "Dobijanje mase",
  muscle: "Izgradnja mišića",
  maintain: "Održavanje težine",
  fat_loss: "Gubitak masti uz očuvanje mišića",
};

export async function POST(req: NextRequest) {
  let body: {
    email: string;
    name?: string;
    goal?: string;
    protein: number;
    calories: number;
    carbs: number;
    fat: number;
    meals: number;
    proteinPerMeal: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neispravan zahtev" }, { status: 400 });
  }

  const { email, name, goal, protein, calories, carbs, fat, meals, proteinPerMeal } = body;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Neispravan email" }, { status: 400 });
  }

  const greeting = name ? `Zdravo ${name},` : "Zdravo,";
  const goalLabel = goal ? GOAL_LABEL[goal] ?? goal : null;

  // Save to DB — fire and forget, don't block email send
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/calculator/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, goal, protein, calories, carbs, fat }),
  }).catch(err => console.error("[wizard] Failed to save subscriber:", err));

  try {
    await resend.emails.send({
      from: "plan@proteinoteka.rs",
      to: email,
      subject: "Tvoj personalizovani protein plan — Proteinoteka",
      html: `
<!DOCTYPE html>
<html lang="sr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07)">

        <!-- Header -->
        <tr>
          <td style="background:#131921;padding:32px 36px">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#FF9900;letter-spacing:2px;text-transform:uppercase">Proteinoteka</p>
            <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;line-height:1.3">Tvoj protein plan je spreman 💪</h1>
            ${goalLabel ? `<p style="margin:8px 0 0;font-size:14px;color:#94a3b8">Cilj: ${goalLabel}</p>` : ""}
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:28px 36px 0">
            <p style="margin:0;font-size:15px;color:#475569;line-height:1.6">${greeting} evo tvog personalizovanog dnevnog plana:</p>
          </td>
        </tr>

        <!-- Macro grid -->
        <tr>
          <td style="padding:20px 36px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding:0 6px 12px 0">
                  <div style="background:#FFF8EC;border:1px solid #FFD980;border-radius:12px;padding:16px">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#b36b00;text-transform:uppercase;letter-spacing:1.5px">Protein</p>
                    <p style="margin:0;font-size:28px;font-weight:900;color:#FF9900">${protein}<span style="font-size:13px;font-weight:500;color:#92400e;margin-left:2px">g</span></p>
                  </div>
                </td>
                <td width="50%" style="padding:0 0 12px 6px">
                  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:1.5px">Ugljeni h.</p>
                    <p style="margin:0;font-size:28px;font-weight:900;color:#3b82f6">${carbs}<span style="font-size:13px;font-weight:500;color:#1e40af;margin-left:2px">g</span></p>
                  </div>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:0 6px 0 0">
                  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:1.5px">Masti</p>
                    <p style="margin:0;font-size:28px;font-weight:900;color:#22c55e">${fat}<span style="font-size:13px;font-weight:500;color:#14532d;margin-left:2px">g</span></p>
                  </div>
                </td>
                <td width="50%" style="padding:0 0 0 6px">
                  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:1.5px">Kalorije</p>
                    <p style="margin:0;font-size:28px;font-weight:900;color:#ef4444">${calories.toLocaleString()}<span style="font-size:13px;font-weight:500;color:#7f1d1d;margin-left:2px">kcal</span></p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Meals tip -->
        <tr>
          <td style="padding:0 36px 24px">
            <div style="background:#FFF8EC;border:1px solid #FFD980;border-radius:12px;padding:16px">
              <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#b36b00;text-transform:uppercase;letter-spacing:1.5px">Po obroku</p>
              <p style="margin:0;font-size:14px;color:#78350f;line-height:1.6">
                Rasporedi unos u <strong>${meals} obroka</strong> — ciljaj <strong style="color:#FF9900">${proteinPerMeal}g proteina</strong> po obroku.
              </p>
            </div>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 36px 32px">
            <a href="https://proteinoteka.rs" style="display:block;background:linear-gradient(135deg,#FF9900,#e68a00);color:#131921;font-weight:900;font-size:15px;text-align:center;text-decoration:none;padding:16px;border-radius:12px">
              Pronađi najjeftiniji protein za tvoj cilj →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6">
              Ovaj email si primio jer si koristio Protein kalkulator na proteinoteka.rs.<br>
              <a href="https://proteinoteka.rs" style="color:#FF9900;text-decoration:none">proteinoteka.rs</a>
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
    console.error("Wizard subscribe error:", error);
    return NextResponse.json({ error: "Greška pri slanju plana" }, { status: 500 });
  }
}
