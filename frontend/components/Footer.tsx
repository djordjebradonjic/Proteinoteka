"use client";

import Link from "next/link";

const Logo = () => (
  <svg
    width="180"
    height="46"
    viewBox="0 0 690 210"
    role="img"
    aria-label="Proteinoteka logo"
    xmlns="http://www.w3.org/2000/svg"
    className="mb-3"
  >
    <g transform="translate(28, 35)">
      <rect x="0"  y="85" width="16" height="35"  fill="#FF9900" rx="2" opacity="0.3" />
      <rect x="20" y="68" width="16" height="52"  fill="#FF9900" rx="2" opacity="0.45" />
      <rect x="40" y="50" width="16" height="70"  fill="#FF9900" rx="2" opacity="0.6" />
      <rect x="60" y="30" width="16" height="90"  fill="#FF9900" rx="2" opacity="0.8" />
      <rect x="80" y="8"  width="16" height="112" fill="#FF9900" rx="2" />
      <polygon points="88,2 91,10 99,10 93,15 95,23 88,18 81,23 83,15 77,10 85,10" fill="#FF9900" />
      <rect x="0" y="120" width="96" height="2" fill="#FF9900" rx="1" opacity="0.5" />
    </g>
    <line x1="153" y1="42" x2="153" y2="158" stroke="#FF9900" strokeWidth="1.5" opacity="0.3" />
    <text x="171" y="138" fontFamily="Arial Black, sans-serif" fontSize="60" fontWeight="900">
      <tspan fill="white">PROTEIN</tspan>
      <tspan fill="#FF9900">OTEKA</tspan>
    </text>
  </svg>
);

const CATEGORIES = [
  { label: "Whey Concentrate", slug: "whey-concentrate" },
  { label: "Whey Isolate",     slug: "whey-isolate"     },
  { label: "Hidrolizat",       slug: "hidrolizat"       },
  { label: "Kazein",           slug: "kazein"           },
  { label: "Biljni protein",   slug: "biljni-protein"   },
  { label: "Blend",            slug: "blend"            },
];

const STORES = [
  "Ogistrashop",
  "Supplementshop",
  "Pansport",
  "FitLab",
  "Proteinbox",
  "Proteini.si",
];

const NAV_LINKS = [
  { label: "Početna",              href: "/"              },
  { label: "Blog",                 href: "/blog"          },
  { label: "Kontakt",              href: "/#kontakt"      },
  { label: "Najjeftiniji proteini",href: "/?sort=numericPrice,asc"    },
  { label: "Poređenje cena",       href: "/?sort=valueScore,desc"     },
];

const SEO_GUIDES = [
  { label: "Najbolji whey protein u Srbiji", href: "/najbolji-whey-protein-srbija" },
  { label: "Najjeftiniji whey protein",      href: "/najjeftiniji-whey-protein"    },
  { label: "Whey protein cena",              href: "/whey-protein-cena"            },
  { label: "Whey izolat u Srbiji",           href: "/whey-isolate-srbija"          },
  { label: "Protein za masu",                href: "/protein-za-masu"              },
];

function ColHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4"
        style={{ color: "rgba(255,255,255,0.35)" }}>
      {children}
    </h4>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm transition-colors duration-150"
        style={{ color: "rgba(255,255,255,0.55)" }}
        onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#FF9900")}
        onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.55)")}
      >
        {children}
      </Link>
    </li>
  );
}

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#131921" }} className="text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 pt-14 pb-6">

        {/* ── Four-column grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b"
             style={{ borderColor: "rgba(255,255,255,0.08)" }}>

          {/* Col 1 — O nama */}
          <div>
            <Logo />
            <p className="text-sm leading-relaxed mb-5"
               style={{ color: "rgba(255,255,255,0.50)" }}>
              Platforma za poređenje cena proteinskih suplemenata u Srbiji.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2 mb-5">
              {["6+ prodavnica", "250+ proizvoda", "Auto ažurirano"].map((t) => (
                <span key={t}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background: "rgba(255,153,0,0.12)",
                        border: "1px solid rgba(255,153,0,0.25)",
                        color: "#FF9900",
                      }}>
                  {t}
                </span>
              ))}
            </div>

            {/* Store names */}
            <ColHeading>Prodavnice</ColHeading>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {STORES.map((s) => (
                <Link key={s} href={`/?store=${encodeURIComponent(s)}`}
                      className="text-xs transition-colors duration-150"
                      style={{ color: "rgba(255,255,255,0.40)" }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#FF9900")}
                      onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.40)")}>
                  {s}
                </Link>
              ))}
            </div>
          </div>

          {/* Col 2 — Kategorije */}
          <div>
            <ColHeading>Kategorije</ColHeading>
            <ul className="flex flex-col gap-2.5">
              {CATEGORIES.map((c) => (
                <FooterLink key={c.slug} href={`/kategorija/${c.slug}`}>
                  {c.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Col 3 — Brzi linkovi */}
          <div>
            <ColHeading>Brzi linkovi</ColHeading>
            <ul className="flex flex-col gap-2.5 mb-6">
              {NAV_LINKS.map((l) => (
                <FooterLink key={l.href} href={l.href}>
                  {l.label}
                </FooterLink>
              ))}
            </ul>
            <ColHeading>Vodiči</ColHeading>
            <ul className="flex flex-col gap-2.5">
              {SEO_GUIDES.map((l) => (
                <FooterLink key={l.href} href={l.href}>
                  {l.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Col 4 — Pravne informacije */}
          <div>
            <ColHeading>Pravne informacije</ColHeading>
            <ul className="flex flex-col gap-2.5">
              <FooterLink href="/privacy-policy">Politika privatnosti</FooterLink>
              <FooterLink href="/terms-of-use">Uslovi korišćenja</FooterLink>
            </ul>

            <div className="mt-6 p-3 rounded-lg"
                 style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[11px] leading-relaxed"
                 style={{ color: "rgba(255,255,255,0.35)" }}>
                <span className="font-semibold" style={{ color: "rgba(255,153,0,0.8)" }}>Napomena:</span>{" "}
                Proteinoteka nije prodavnica. Cene su informativnog karaktera i mogu se razlikovati od aktuelnih cena kod prodavca.
              </p>
            </div>
          </div>
        </div>

        {/* ── Legal disclosure ─────────────────────────────────────────── */}
        <div className="py-8 space-y-3 border-b"
             style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-xs leading-relaxed max-w-4xl"
             style={{ color: "rgba(255,255,255,0.30)" }}>
            Proteinoteka nije prodavnica i ne prodaje proizvode. Prikazane cene i informacije su informativnog karaktera i mogu se razlikovati od cena na sajtu prodavca. Uvek proverite aktuelnu cenu direktno na sajtu prodavnice pre kupovine.
          </p>
          <p className="text-xs leading-relaxed max-w-4xl"
             style={{ color: "rgba(255,255,255,0.30)" }}>
            Podaci su prikupljeni iz javno dostupnih online prodavnica i automatski ažurirani. Sva prava na brendove i proizvode pripadaju njihovim vlasnicima. Proteinoteka ne garantuje tačnost, potpunost ni ažurnost prikazanih informacija.
          </p>
          <p className="text-xs leading-relaxed max-w-4xl"
             style={{ color: "rgba(255,255,255,0.30)" }}>
            Neki linkovi mogu biti affiliate linkovi, što znači da možemo ostvariti proviziju bez dodatnog troška za korisnika.
          </p>
        </div>

        {/* ── Bottom bar ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
            © {new Date().getFullYear()} Proteinoteka. Sva prava zadržana.
          </p>
          <div className="flex items-center gap-4">
            {[
              { label: "Politika privatnosti", href: "/privacy-policy" },
              { label: "Uslovi korišćenja",    href: "/terms-of-use"   },
            ].map((l) => (
              <Link key={l.href} href={l.href}
                    className="text-xs transition-colors duration-150"
                    style={{ color: "rgba(255,255,255,0.30)" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#FF9900")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.30)")}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
