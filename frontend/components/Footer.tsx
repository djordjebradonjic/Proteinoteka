"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FOOTER_STORES, FOOTER_GUIDES, FOOTER_POPULAR } from "@/lib/navConfig";

const CATEGORIES = [
  { label: "Whey Concentrate", slug: "whey-concentrate" },
  { label: "Whey Isolate",     slug: "whey-isolate"     },
  { label: "Hidrolizat",       slug: "hidrolizat"       },
  { label: "Kazein",           slug: "kazein"           },
  { label: "Biljni protein",   slug: "biljni-protein"   },
  { label: "Blend",            slug: "blend"            },
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
  const t = useTranslations("footer");
  return (
    <footer id="site-footer" style={{ backgroundColor: "#131921" }} className="text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-5">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 pb-7 border-b"
             style={{ borderColor: "rgba(255,255,255,0.08)" }}>

          {/* Col 1 — Kategorije */}
          <div>
            <ColHeading>{t("categories")}</ColHeading>
            <ul className="flex flex-col gap-2">
              {CATEGORIES.map((c) => (
                <FooterLink key={c.slug} href={`/kategorija/${c.slug}`}>
                  {c.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Col 2 — Prodavnice / Trgovine */}
          <div>
            <ColHeading>{t("stores")}</ColHeading>
            <ul className="flex flex-col gap-2">
              {FOOTER_STORES.map((s) => (
                <FooterLink key={s.href} href={s.href}>{s.label}</FooterLink>
              ))}
            </ul>
          </div>

          {/* Col 3 — Vodiči */}
          {FOOTER_GUIDES.length > 0 && (
            <div>
              <ColHeading>{t("guides")}</ColHeading>
              <ul className="flex flex-col gap-2">
                {FOOTER_GUIDES.map((g) => (
                  <FooterLink key={g.href} href={g.href}>{g.label}</FooterLink>
                ))}
              </ul>
            </div>
          )}

          {/* Col 4 — Popularno */}
          <div>
            <ColHeading>{t("popular")}</ColHeading>
            <ul className="flex flex-col gap-2">
              {FOOTER_POPULAR.map((l) => (
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
                  {t("cookieSettings")}
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
            © {new Date().getFullYear()} Proteinoteka. {t("copyright")}
          </p>
        </div>

      </div>
    </footer>
  );
}
