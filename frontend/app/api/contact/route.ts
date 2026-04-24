import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";


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

    await resend.emails.send({
    from: "kontakt@proteinoteka.rs",
      to: "djordjebradonjic99@gmail.com",          // ← stavi tvoj email ovde
      subject: `Nova poruka od ${name} — Proteinoteka`,
      html: `
        <h2>Nova poruka sa proteinoteka.rs</h2>
        <p><strong>Ime:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Poruka:</strong></p>
        <p>${message.replace(/\n/g, "<br/>")}</p>
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