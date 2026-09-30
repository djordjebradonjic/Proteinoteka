import Link from "next/link";
import { Product } from "@/types/product";
import FeaturedPriceDropCard from "@/components/FeaturedPriceDropCard";
import ScrollableRow from "@/components/ScrollableRow";
import { CREATINE_PATH } from "@/lib/creatine";
import { CURRENT_MARKET } from "@/lib/marketConfig";

// Homepage teaser for the creatine family: a server-rendered row that sends visitors to /kreatin. Deliberately
// independent of ProductSection (protein filters and URL params stay untouched). Renders nothing when empty.

const HR = CURRENT_MARKET === "hr";
const COPY = {
  title: HR ? "Kreatin: najbolje cijene" : "Kreatin: najbolje cene",
  subtitle: HR
    ? "Kreatin monohidrat iz hrvatskih trgovina, uspoređen na jednom mjestu."
    : "Kreatin monohidrat iz srpskih prodavnica, upoređen na jednom mestu.",
  cta: "Pogledaj sav kreatin →",
};

export default function CreatineTeaser({ products }: { products: Product[] }) {
  if (!products.length) return null;

  return (
    <section
      id="kreatin-teaser"
      aria-label={COPY.title}
      className="mb-6 overflow-x-hidden"
      style={{ background: "linear-gradient(135deg, #f8fafc 0%, #fff7ed 100%)", borderBottom: "1px solid #e2e8f0" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-4 sm:mb-5 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">{COPY.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">{COPY.subtitle}</p>
          </div>
          <Link href={CREATINE_PATH} className="text-sm font-bold text-[#c77700] hover:text-[#FF9900] whitespace-nowrap">
            {COPY.cta}
          </Link>
        </div>

        <ScrollableRow fadeFrom="from-[#f8fafc]">
          {products.map((p) => (
            <FeaturedPriceDropCard key={p.id} product={p} />
          ))}
        </ScrollableRow>
      </div>
    </section>
  );
}
