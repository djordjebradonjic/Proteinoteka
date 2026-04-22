"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, Heart, Search } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

function Logo() {
  return (
    <Link href="/" className="flex items-center shrink-0 group">
      <svg
        width="200"
        height="52"
        viewBox="0 0 690 210"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        className="h-20 w-auto"
      >
        <title>Proteinoteka logo</title>
        <rect width="690" height="210" fill="transparent" />
        <g transform="translate(28, 35)">
          <rect x="0"  y="85" width="16" height="35" fill="#FF9900" rx="2" opacity="0.3"/>
          <rect x="20" y="68" width="16" height="52" fill="#FF9900" rx="2" opacity="0.45"/>
          <rect x="40" y="50" width="16" height="70" fill="#FF9900" rx="2" opacity="0.6"/>
          <rect x="60" y="30" width="16" height="90" fill="#FF9900" rx="2" opacity="0.8"/>
          <rect x="80" y="8"  width="16" height="112" fill="#FF9900" rx="2"/>
          <polygon points="88,2 91,10 99,10 93,15 95,23 88,18 81,23 83,15 77,10 85,10" fill="#FF9900"/>
          <rect x="0" y="120" width="96" height="2" fill="#FF9900" rx="1" opacity="0.5"/>
        </g>
        <line x1="153" y1="42" x2="153" y2="158" stroke="#FF9900" strokeWidth="1.5" opacity="0.3"/>
        <text x="171" y="138" fontFamily="Arial Black, sans-serif" fontSize="60" fontWeight="900" letterSpacing="0">
          <tspan fill="white">PROTEIN</tspan>
          <tspan fill="#FF9900">OTEKA</tspan>
        </text>
      </svg>
    </Link>
  );
}

function SearchBarHeader({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-1 max-w-2xl mx-4">
      <div className="flex w-full rounded-md overflow-hidden shadow-sm ring-2 ring-transparent focus-within:ring-[#FF9900] transition-all">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Pretraži proteine, suplementi, brendovi..."
          className="flex-1 px-4 py-2.5 text-sm text-slate-800 bg-white outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          className="px-4 bg-[#FF9900] hover:bg-[#e68a00] transition-colors flex items-center justify-center"
          aria-label="Pretraži"
        >
          <Search className="w-5 h-5 text-[#131921]" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-slate-200 hover:text-[#FF9900] transition-colors whitespace-nowrap px-1"
    >
      {children}
    </Link>
  );
}

function IconButton({
  href,
  icon,
  count,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  count: number;
  label: string;
}) {
  return (
    <Link href={href} className="relative flex items-center group" aria-label={label}>
      <span className="text-slate-200 group-hover:text-[#FF9900] transition-colors">
        {icon}
      </span>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF9900] text-[#131921] text-[10px] font-bold flex items-center justify-center leading-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
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
  const wishlistCount = useAppSelector((state) => (state as any).wishlist.count) as number;
  const cartCount = useAppSelector((state) => (state as any).cart.count) as number;
  const [localSearch, setLocalSearch] = useState(searchValue);

  const handleSearch = (v: string) => {
    setLocalSearch(v);
    onSearchChange?.(v);
  };

  return (
    
        <header className="sticky top-0 z-50 shadow-lg" style={{ backgroundColor: "#131921" }}>
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
            <Logo />
              <div className="hidden md:flex flex-1">
              <SearchBarHeader value={localSearch} onChange={handleSearch} />
          </div>
    <nav className="hidden md:flex items-center gap-5"></nav>
        <nav className="hidden md:flex items-center gap-5">
          <NavLink href="/blog">Blog</NavLink>
          <NavLink href="/kontakt">Kontakt</NavLink>
          <IconButton
            href="/wishlist"
            label="Lista željenih"
            count={wishlistCount}
            icon={
              <Heart
                className="w-6 h-6"
                strokeWidth={1.8}
                fill={wishlistCount > 0 ? "#FF9900" : "none"}
              />
            }
          />
          <IconButton
            href="/korpa"
            label="Korpa"
            count={cartCount}
            icon={<ShoppingCart className="w-6 h-6" strokeWidth={1.8} />}
          />
        </nav>
        <div className="flex md:hidden items-center gap-4 ml-auto">
          <IconButton
            href="/wishlist"
            label="Lista željenih"
            count={wishlistCount}
            icon={<Heart className="w-6 h-6" strokeWidth={1.8} />}
          />
          <IconButton
            href="/korpa"
            label="Korpa"
            count={cartCount}
            icon={<ShoppingCart className="w-6 h-6" strokeWidth={1.8} />}
          />
        </div>
      </div>
       <div className="md:hidden px-4 pb-3" style={{ backgroundColor: "#131921" }}>
      <SearchBarHeader value={localSearch} onChange={handleSearch} />
    </div>
    </header>
  );
}