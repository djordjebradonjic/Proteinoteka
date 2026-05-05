"use client";

import Link from "next/link";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Heart, ChevronDown } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { toggleWishlist } from "@/store/wishlistSlice";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import BetaBanner from "@/components/BetaBanner";

// Reads the ?query param and syncs it into Header's local state.
// Lives inside a mini <Suspense> so it never causes SSR bailout of the outer page.
function SearchSync({ onValue }: { onValue: (v: string) => void }) {
  const params = useSearchParams();
  const stable = useCallback(onValue, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    stable(params.get("query") ?? "");
  }, [params, stable]);
  return null;
}

function Logo() {
  return (
    <Link href="/" className="flex items-center shrink-0 group">
      <svg
        width="200"
        height="52"
        viewBox="0 0 690 210"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        className="h-14 w-auto md:h-20"
      >
        <title>Proteinoteka logo</title>
        <rect width="690" height="210" fill="transparent" />
        <g transform="translate(28, 35)">
          <rect
            x="0"
            y="85"
            width="16"
            height="35"
            fill="#FF9900"
            rx="2"
            opacity="0.3"
          />
          <rect
            x="20"
            y="68"
            width="16"
            height="52"
            fill="#FF9900"
            rx="2"
            opacity="0.45"
          />
          <rect
            x="40"
            y="50"
            width="16"
            height="70"
            fill="#FF9900"
            rx="2"
            opacity="0.6"
          />
          <rect
            x="60"
            y="30"
            width="16"
            height="90"
            fill="#FF9900"
            rx="2"
            opacity="0.8"
          />
          <rect x="80" y="8" width="16" height="112" fill="#FF9900" rx="2" />
          <polygon
            points="88,2 91,10 99,10 93,15 95,23 88,18 81,23 83,15 77,10 85,10"
            fill="#FF9900"
          />
          <rect
            x="0"
            y="120"
            width="96"
            height="2"
            fill="#FF9900"
            rx="1"
            opacity="0.5"
          />
        </g>
        <line
          x1="153"
          y1="42"
          x2="153"
          y2="158"
          stroke="#FF9900"
          strokeWidth="1.5"
          opacity="0.3"
        />
        <text
          x="171"
          y="138"
          fontFamily="Arial Black, sans-serif"
          fontSize="60"
          fontWeight="900"
          letterSpacing="0"
        >
          <tspan fill="white">PROTEIN</tspan>
          <tspan fill="#FF9900">OTEKA</tspan>
        </text>
      </svg>
    </Link>
  );
}

const GUIDES = [
  { label: "Koliko proteina dnevno?",   href: "/vodici/koliko-proteina-dnevno"      },
  { label: "Isolate vs Concentrate",    href: "/vodici/whey-isolate-vs-concentrate" },
  { label: "Da li protein goji?",       href: "/vodici/da-li-protein-goji"          },
  { label: "Kada piti protein?",        href: "/vodici/kada-piti-protein"           },
  { label: "Svi vodiči →",             href: "/vodici"                             },
  { label: "Najbolji whey protein",     href: "/najbolji-whey-protein-srbija"       },
  { label: "Najjeftiniji whey",         href: "/najjeftiniji-whey-protein"          },
  { label: "Whey protein cena",         href: "/whey-protein-cena"                  },
  { label: "Whey izolat Srbija",        href: "/whey-isolate-srbija"                },
  { label: "Protein za masu",           href: "/protein-za-masu"                    },
];

function GuidesDropdown({ mobile = false }: { mobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative z-50">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-0.5 text-sm font-medium text-slate-200 hover:text-[#FF9900] transition-colors whitespace-nowrap px-1 cursor-pointer"
        aria-expanded={open}
      >
        Vodiči <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`absolute ${mobile ? "right-0" : "left-0"} top-full w-52 pt-2 z-50`}>
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 py-1 max-h-[260px] overflow-y-auto">
            {GUIDES.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#FF9900] transition-colors"
              >
                {g.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-slate-200 hover:text-[#FF9900] transition-colors whitespace-nowrap px-1"
    >
      {children}
    </Link>
  );
}


export default function Header() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const wishlistCount = useAppSelector(
    (state) => (state as any).wishlist.count,
  ) as number;
  const [localSearch, setLocalSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const displayCount = mounted ? wishlistCount : 0;
  const displayFill = mounted && wishlistCount > 0 ? "#FF9900" : "none";

  const handleSearch = (v: string) => {
    setLocalSearch(v);
    const params = new URLSearchParams(window.location.search);
    if (v) params.set("query", v); else params.delete("query");
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <header
      className="sticky top-0 z-50 shadow-lg"
      style={{ backgroundColor: "#131921" }}
    >
      {/* SearchSync lives in its own Suspense so the full Header is SSR'd without bailout */}
      <Suspense fallback={null}>
        <SearchSync onValue={setLocalSearch} />
      </Suspense>
      <BetaBanner />
      <div className="relative z-[60] max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
        <Logo />

        <div className="hidden md:flex flex-1">
          <SearchAutocomplete value={localSearch} onChange={handleSearch} />
        </div>

        <nav className="hidden md:flex items-center gap-5">
          <GuidesDropdown />
          <NavLink href="/#kontakt">Kontakt</NavLink>

          {/* Desktop Wishlist */}
          <button
            onClick={() => dispatch(toggleWishlist())}
            className="relative flex items-center group"
            aria-label="Lista željenih"
          >
            <span className="text-slate-200 group-hover:text-[#FF9900] transition-colors">
              <Heart className="w-6 h-6" strokeWidth={1.8} fill={displayFill} />
            </span>
            {mounted && displayCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#FF9900] text-[#1B2B4B] text-[9px] font-bold flex items-center justify-center leading-none">
                {displayCount > 99 ? "99+" : displayCount}
              </span>
            )}
          </button>
        </nav>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-4 ml-auto shrink-0">
          <GuidesDropdown mobile />
          <button
            onClick={() => dispatch(toggleWishlist())}
            className="relative flex items-center group"
            aria-label="Lista željenih"
          >
            <span className="text-slate-200 group-hover:text-[#FF9900] transition-colors">
              <Heart className="w-6 h-6" strokeWidth={1.8} fill={displayFill} />
            </span>
            {mounted && displayCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#FF9900] text-[#1B2B4B] text-[9px] font-bold flex items-center justify-center leading-none">
                {displayCount > 99 ? "99+" : displayCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div
        className="md:hidden px-4 pb-3"
        style={{ backgroundColor: "#131921" }}
      >
        <SearchAutocomplete value={localSearch} onChange={handleSearch} />
      </div>
    </header>
  );
}
