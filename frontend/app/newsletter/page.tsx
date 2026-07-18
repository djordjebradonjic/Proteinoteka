import { Metadata } from "next";
import Link from "next/link";
import { TrendingDown, Tag, Mail } from "lucide-react";
import Header from "@/components/Header";
import NewsletterInlineForm from "@/components/NewsletterInlineForm";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { hreflangAlternates } from "@/lib/hreflang";

export const revalidate = 86400;

const isHR = CURRENT_MARKET === "hr";
const domain = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;

export const metadata: Metadata = isHR
  ? {
      title: "Newsletter | Najveće uštede na protein — Proteinoteka",
      description:
        "Prijavi se na Proteinoteka newsletter i dva puta mjesečno dobij pregled najvećih padova cijena i najboljih akcija za protein suplemente u Hrvatskoj.",
      alternates: { canonical: `${domain}/newsletter`, languages: hreflangAlternates("/newsletter") },
      openGraph: {
        title: "Newsletter | Najveće uštede na protein — Proteinoteka",
        description: "Dva puta mjesečno — najveći padovi cijena i najbolje akcije, direktno u inbox.",
        url: `${domain}/newsletter`,
        siteName: "Proteinoteka",
        locale: "hr_HR",
        type: "website",
        images: [{ url: `${domain}/opengraph-image`, width: 1200, height: 630, alt: "Proteinoteka" }],
      },
    }
  : {
      title: "Newsletter | Najveće uštede na protein — Proteinoteka",
      description:
        "Prijavi se na Proteinoteka newsletter i dva puta mesečno dobij pregled najvećih padova cena i najboljih akcija za protein suplemente u Srbiji.",
      alternates: { canonical: `${domain}/newsletter`, languages: hreflangAlternates("/newsletter") },
      openGraph: {
        title: "Newsletter | Najveće uštede na protein — Proteinoteka",
        description: "Dva puta mesečno — najveći padovi cena i najbolje akcije, direktno u inbox.",
        url: `${domain}/newsletter`,
        siteName: "Proteinoteka",
        locale: "sr_RS",
        type: "website",
        images: [{ url: `${domain}/opengraph-image`, width: 1200, height: 630, alt: "Proteinoteka" }],
      },
    };

const BENEFITS = isHR
  ? [
      { icon: TrendingDown, text: "Najveći padovi cijena proteina i suplemenata, dva puta mjesečno" },
      { icon: Tag, text: "Aktualne akcije po trgovinama koje pratimo" },
      { icon: Mail, text: "Kratko i konkretno — bez spama, odjava u jednom kliku" },
    ]
  : [
      { icon: TrendingDown, text: "Najveći padovi cena proteina i suplemenata, dva puta mesečno" },
      { icon: Tag, text: "Aktuelne akcije po prodavnicama koje pratimo" },
      { icon: Mail, text: "Kratko i konkretno — bez spama, odjava u jednom kliku" },
    ];

export default function NewsletterPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isHR ? "Početna" : "Početna", item: domain },
      { "@type": "ListItem", position: 2, name: "Newsletter", item: `${domain}/newsletter` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-xl mx-auto px-4 py-10">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <span className="text-slate-600">Newsletter</span>
          </nav>

          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#FF9900]/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-[#FF9900]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#131921] mb-2">
              {isHR ? "Najveće uštede, direktno u inbox" : "Najveće uštede, direktno u inbox"}
            </h1>
            <p className="text-slate-500 text-sm">
              {isHR
                ? "Dva puta mjesečno šaljemo pregled najboljih akcija i najvećih padova cijena."
                : "Dva puta mesečno šaljemo pregled najboljih akcija i najvećih padova cena."}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-6">
            <NewsletterInlineForm source="landing_page" variant="light" />
          </div>

          <ul className="space-y-3">
            {BENEFITS.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-[#FFF3DC] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#FF9900]" />
                </div>
                <span className="pt-1.5 leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </main>
      </div>
    </>
  );
}
