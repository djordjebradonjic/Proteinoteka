import Link from "next/link";
import { SUPPLEMENT_CATEGORIES } from "@/lib/supplementCategories";

// Primary category navigation for the hero: real links (own URL per family), not a filter, so each family keeps
// its own SEO page, shareable URL and back-button behaviour.
export default function CategorySwitcher({ active }: { active: string }) {
  if (SUPPLEMENT_CATEGORIES.length < 2) return null;
  return (
    // Below md the sticky Header strip does this job, so a second copy in the hero would just duplicate it.
    <nav aria-label="Kategorije suplemenata" className="hidden md:flex justify-center mb-6">
      <ul
        className="inline-flex p-1 gap-1 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        {SUPPLEMENT_CATEGORIES.map((cat) => {
          const isActive = cat.key === active;
          return (
            <li key={cat.key}>
              <Link
                href={cat.href}
                aria-current={isActive ? "page" : undefined}
                className="block px-5 sm:px-7 py-2 rounded-xl text-center transition-colors"
                style={
                  isActive
                    ? { background: "#FF9900", color: "#131921", boxShadow: "0 0 14px rgba(255,153,0,0.35)" }
                    : { color: "#cbd5e1" }
                }
              >
                <span className="block text-sm sm:text-base font-extrabold leading-tight">{cat.label}</span>
                <span
                  className="hidden sm:block text-[11px] leading-tight mt-0.5"
                  style={{ color: isActive ? "rgba(19,25,33,0.7)" : "#94a3b8" }}
                >
                  {cat.hint}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
