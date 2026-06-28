import Link from "next/link";

const WEIGHT_RANGE_PAGES = [
  { slug: "najjeftiniji-whey-protein-do-500g",    label: "do 500g"       },
  { slug: "najjeftiniji-whey-protein",             label: "500g – 1.5kg"  },
  { slug: "najjeftiniji-whey-protein-1500g-2500g", label: "1.5 – 2.5kg"  },
  { slug: "najjeftiniji-whey-protein-2500g-3500g", label: "2.5 – 3.5kg"  },
  { slug: "najjeftiniji-whey-protein-3500g-4500g", label: "3.5 – 4.5kg"  },
  { slug: "najjeftiniji-whey-protein-4500g-plus",  label: "4.5kg+"        },
] as const;

export function WeightRangeTabs({ currentSlug }: { currentSlug: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Veličina pakovanja</p>
      <div className="flex flex-wrap gap-2">
        {WEIGHT_RANGE_PAGES.map(({ slug, label }) => {
          const isActive = slug === currentSlug;
          return (
            <Link
              key={slug}
              href={`/${slug}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                isActive
                  ? "bg-[#FF9900] border-[#FF9900] text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
