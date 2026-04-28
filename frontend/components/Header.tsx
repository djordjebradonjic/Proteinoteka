"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Heart, ChevronDown } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { toggleWishlist } from "@/store/wishlistSlice";
import SearchAutocomplete from "@/components/SearchAutocomplete";

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
  { label: "Najbolji whey protein",   href: "/najbolji-whey-protein-srbija" },
  { label: "Najjeftiniji whey",        href: "/najjeftiniji-whey-protein"    },
  { label: "Whey protein cena",        href: "/whey-protein-cena"            },
  { label: "Whey izolat Srbija",       href: "/whey-isolate-srbija"          },
  { label: "Protein za masu",          href: "/protein-za-masu"              },
];

function GuidesDropdown() {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="flex items-center gap-0.5 text-sm font-medium text-slate-200 hover:text-[#FF9900] transition-colors whitespace-nowrap px-1"
        aria-expanded={open}
      >
        Vodiči <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
          {GUIDES.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#FF9900] transition-colors"
            >
              {g.label}
            </Link>
          ))}
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


export default function Header({
  searchValue = "",
  onSearchChange,
}: {
  searchValue?: string;
  onSearchChange?: (v: string) => void;
}) {
  const dispatch = useAppDispatch();
  const wishlistCount = useAppSelector(
    (state) => (state as any).wishlist.count,
  ) as number;
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayCount = mounted ? wishlistCount : 0;
  const displayFill = mounted && wishlistCount > 0 ? "#FF9900" : "none";

  const handleSearch = (v: string) => {
    setLocalSearch(v);
    onSearchChange?.(v);
  };

  return (
    <header
      className="sticky top-0 z-50 shadow-lg"
      style={{ backgroundColor: "#131921" }}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
        <Logo />

        <div className="hidden md:flex flex-1">
          <SearchAutocomplete value={localSearch} onChange={handleSearch} />
        </div>

        <nav className="hidden md:flex items-center gap-5">
          <GuidesDropdown />
          <NavLink href="/blog">Blog</NavLink>
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
