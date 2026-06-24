"use client";

import Link from "next/link";

const CATEGORIES = [
  { label: "Whey Concentrate", slug: "whey-concentrate" },
  { label: "Whey Isolate",     slug: "whey-isolate"     },
  { label: "Hidrolizat",       slug: "hidrolizat"       },
  { label: "Kazein",           slug: "kazein"           },
  { label: "Biljni protein",   slug: "biljni-protein"   },
  { label: "Blend",            slug: "blend"            },
];

const STORE_PAGES = [
  { label: "Ogistrashop",    href: "/ogistrashop-proteini"    },
  { label: "Supplementshop", href: "/supplementshop-proteini" },
  { label: "Pansport",       href: "/pansport-proteini"       },
  { label: "FitLab",         href: "/fitlab-proteini"         },
  { label: "Proteinbox",     href: "/proteinbox-proteini"     },
  { label: "Proteini.si",    href: "/proteini-si-srbija"      },
  { label: "Lama",           href: "/lama-proteini"           },
  { label: "Shopbuilder",    href: "/shopbuilder-proteini"    },
  { label: "XSport",        href: "/xsport-proteini"         },
];

const GUIDES = [
  { label: "Protein za početnike",    href: "/vodici/whey-protein-za-pocetnike"   },
  { label: "Koliko proteina dnevno?", href: "/vodici/koliko-proteina-dnevno"      },
  { label: "Protein za mršavljenje",  href: "/vodici/protein-za-mrsavljenje"      },
  { label: "Da li protein goji?",     href: "/vodici/da-li-protein-goji"          },
  { label: "Kada piti protein?",      href: "/vodici/kada-piti-protein"           },
  { label: "Isolate vs Concentrate",  href: "/vodici/whey-isolate-vs-concentrate" },
  { label: "Svi vodiči →",            href: "/vodici"                             },
];

const SITE_LINKS = [
  { label: "Početna",              href: "/"                          },
  { label: "O nama",               href: "/o-nama"                    },
  { label: "Kontakt",              href: "/#kontakt"                  },
  { label: "Kako računamo score",  href: "/kako-racunamo-value-score" },
  { label: "Politika privatnosti", href: "/privacy-policy"           },
  { label: "Uslovi korišćenja",    href: "/terms-of-use"             },
];

function ColHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3"
        style={{ color: "rgba(255,153,0,0.75)" }}>
      {children}
    </h4>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-[13px] leading-relaxed transition-colors duration-150"
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
    <footer id="site-footer" style={{ backgroundColor: "#131921" }} className="text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-5">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 pb-7 border-b"
             style={{ borderColor: "rgba(255,255,255,0.08)" }}>

          {/* Col 1 — Kategorije */}
          <div>
            <ColHeading>Kategorije</ColHeading>
            <ul className="flex flex-col gap-2">
              {CATEGORIES.map((c) => (
                <FooterLink key={c.slug} href={`/kategorija/${c.slug}`}>
                  {c.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Col 2 — Prodavnice */}
          <div>
            <ColHeading>Prodavnice</ColHeading>
            <ul className="flex flex-col gap-2">
              {STORE_PAGES.map((s) => (
                <FooterLink key={s.href} href={s.href}>{s.label}</FooterLink>
              ))}
            </ul>
          </div>

          {/* Col 3 — Vodiči */}
          <div>
            <ColHeading>Vodiči</ColHeading>
            <ul className="flex flex-col gap-2">
              {GUIDES.map((g) => (
                <FooterLink key={g.href} href={g.href}>{g.label}</FooterLink>
              ))}
            </ul>
          </div>

          {/* Col 4 — Sajt + Pravne */}
          <div>
            <ColHeading>Sajt</ColHeading>
            <ul className="flex flex-col gap-2">
              {SITE_LINKS.map((l) => (
                <FooterLink key={l.href} href={l.href}>{l.label}</FooterLink>
              ))}
              <li>
                <button
                  onClick={() => window.dispatchEvent(new Event("cookie-settings"))}
                  className="text-[13px] transition-colors duration-150 cursor-pointer"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#FF9900")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.55)")}
                >
                  Cookie postavke
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* ── Bottom bar ── */}
        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-sm font-black tracking-wide">
            <span style={{ color: "white" }}>PROTEIN</span>
            <span style={{ color: "#FF9900" }}>OTEKA</span>
          </span>
          <p className="text-[11px] leading-relaxed"
             style={{ color: "rgba(255,255,255,0.28)" }}>
            © {new Date().getFullYear()} Proteinoteka. Cene su informativnog karaktera. Neki linkovi mogu biti affiliate.
          </p>
        </div>

      </div>
    </footer>
  );
}
