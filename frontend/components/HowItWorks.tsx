import Link from "next/link";
import { CURRENT_MARKET } from "@/lib/marketConfig";

const FEATURES_RS = [
  {
    emoji: "⚡",
    title: "Value Score",
    description:
      "Jedina objektivna ocena 0–10 za svaki protein u Srbiji. Automatski računa cenu, količinu proteina i reputaciju brenda — odmah vidiš da li je protein vredan novca.",
    href: "/kako-racunamo-value-score",
    linkLabel: "Kako računamo Value Score →",
  },
  {
    emoji: "💰",
    title: "Cena po gramu proteina",
    description:
      "Ne gledaj cenu kutije — gledaj RSD/g proteina koji stvarno dobijaš. Niko drugi ovo ne računa automatski za srpsko tržište.",
    href: null,
    linkLabel: null,
  },
  {
    emoji: "🏪",
    title: "Isti protein, sve prodavnice",
    description:
      "Pronađi u kojoj prodavnici je isti protein najjeftiniji. Poredimo 11 prodavnica odjednom — bez pretraživanja.",
    href: null,
    linkLabel: null,
  },
];

const FEATURES_HR = [
  {
    emoji: "⚡",
    title: "Value Score",
    description:
      "Jedina objektivna ocjena 0–10 za svaki protein u Hrvatskoj. Automatski računa cijenu, količinu proteina i reputaciju brenda — odmah vidiš je li protein vrijedan novca.",
    href: "/kako-racunamo-value-score",
    linkLabel: "Kako računamo Value Score →",
  },
  {
    emoji: "💰",
    title: "Cijena po gramu proteina",
    description:
      "Ne gledaj cijenu kutije — gledaj EUR/100g proteina koji stvarno dobivaš. Nitko drugi ovo ne računa automatski za hrvatsko tržište.",
    href: null,
    linkLabel: null,
  },
  {
    emoji: "🏪",
    title: "Isti protein, sve trgovine",
    description:
      "Pronađi u kojoj trgovini je isti protein najjeftiniji. Uspoređujemo 7 trgovina odjednom — bez Googleanja.",
    href: null,
    linkLabel: null,
  },
];

const FEATURES = CURRENT_MARKET === "hr" ? FEATURES_HR : FEATURES_RS;

export default function HowItWorks() {
  return (
    <section
      aria-label="Kako funkcioniše Proteinoteka"
      style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map(({ emoji, title, description, href, linkLabel }) => (
            <div
              key={title}
              className="flex gap-4 p-4 sm:p-5 rounded-xl bg-white border border-slate-100 shadow-sm"
            >
              <div
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: "#fff7ed" }}
                aria-hidden="true"
              >
                {emoji}
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                  {title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {description}
                </p>
                {href && linkLabel && (
                  <Link
                    href={href}
                    className="text-xs font-semibold mt-1 w-fit"
                    style={{ color: "#FF9900" }}
                  >
                    {linkLabel}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
