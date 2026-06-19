import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Sva polja su obavezna" },
        { status: 400 }
      );
    }

    const safeName = escapeHtml(String(name).slice(0, 200));
    const safeEmail = escapeHtml(String(email).slice(0, 200));
    const safeMessage = escapeHtml(String(message).slice(0, 5000)).replace(/\n/g, "<br/>");

    await resend.emails.send({
      from: "kontakt@proteinoteka.rs",
      to: "djordjebradonjic99@gmail.com",
      subject: `Nova poruka od ${safeName} — Proteinoteka`,
      html: `
        <h2>Nova poruka sa proteinoteka.rs</h2>
        <p><strong>Ime:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Poruka:</strong></p>
        <p>${safeMessage}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Greška pri slanju poruke" },
      { status: 500 }
    );
  }
}