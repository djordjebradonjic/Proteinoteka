import { Product } from "@/types/product";
import FeaturedPriceDropCard from "@/components/FeaturedPriceDropCard";
import ScrollableRow from "@/components/ScrollableRow";
import { CREATINE_COPY } from "@/lib/creatine";

// The creatine twin of FeaturedSection, minus its "top value" tab: creatine has no value score shown on the
// frontend (backend still computes one for internal audit, but a single price-per-gram figure already tells
// the whole story for a commodity like creatine, so a second "score" carousel had no product value). Just the
// "najveći pad cene" row remains, reusing FeaturedPriceDropCard as-is (it's generic).

const COPY = CREATINE_COPY.featured;

interface Props {
  priceDropProducts: Product[];
}

export default function CreatineFeaturedSection({ priceDropProducts }: Props) {
  if (!priceDropProducts.length) return null;

  return (
    <section
      aria-label={COPY.title}
      className="mb-6 overflow-x-hidden"
      style={{
        background: "linear-gradient(135deg, #fff7ed 0%, #f8fafc 100%)",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-4 sm:mb-5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">{COPY.tabDrops}</h2>
          <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">{COPY.subtitle}</p>
        </div>

        <ScrollableRow fadeFrom="from-[#fff7ed]">
          {priceDropProducts.map((p) => (
            <FeaturedPriceDropCard key={p.id} product={p} />
          ))}
        </ScrollableRow>

      </div>
    </section>
  );
}
