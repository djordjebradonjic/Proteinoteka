"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Search, X, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { analytics } from "@/lib/analytics";
import { productUrl } from "@/lib/productUrl";
import { navigateTo } from "@/lib/navigation";
import PriceTag from "@/components/PriceTag";

interface ProductSuggestion {
  id: number;
  name: string;
  imageUrl: string;
  price: string;
  numericPrice: number;
  brand: string;
  valueScore?: number;
  storeName: string;
  proteinSource?: string | null;
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

function ValueBadge({ score }: { score: number }) {
  const color =
    score >= 8.0 ? "#86efac"
      : score >= 6.5 ? "#22c55e"
      : score >= 5.0 ? "#f59e0b"
      : "#ea580c";

  const label =
    score >= 8.0 ? "Izuzetna"
      : score >= 6.5 ? "Dobra"
      : score >= 5.0 ? "Prosečna"
      : "Slaba";


  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: color + "22", color }}
    >
      {score.toFixed(1)} · {label}
    </span>
  );
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent text-[#FF9900] font-semibold not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function SearchAutocomplete({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<ProductSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback(
    debounce(async (q: string) => {
      if (q.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/products/search?query=${encodeURIComponent(q)}&size=20`,
        );
        if (!res.ok) throw new Error();
        const data: any[] = await res.json();
        setResults(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            imageUrl: p.imageUrl ?? "",
            price: p.price ?? `${p.numericPrice?.toLocaleString("sr-RS")} RSD`,
            numericPrice: p.numericPrice ?? 0,
            brand: p.brand ?? "",
            valueScore: p.valueScore,
            storeName: p.storeName ?? "",
          })),
        );
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280),
    [],
  );

  // zatvaranje klikom van
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInputChange(v: string) {
    setQuery(v);
    onChange(v);
    setActiveIndex(-1);
    if (v.trim().length < 2) {
      setResults([]);
      setOpen(false);
    } else {
      fetchSuggestions(v);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const p = results[activeIndex];
      setQuery(p.name);
      onChange(p.name);
      setOpen(false);
      analytics.search(p.name);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  function clearSearch() {
    setQuery("");
    onChange("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  const ROW_HEIGHT = 72;
  const VISIBLE_ROWS = 5;
  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="flex flex-1 max-w-2xl mx-4 relative">
      {/* Input */}
      <div
        className="flex w-full rounded-md overflow-hidden shadow-sm ring-2 ring-transparent focus-within:ring-[#FF9900] transition-all"
        style={{ zIndex: 51, position: "relative" }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Pretraži proteine, brendove..."
          className="flex-1 px-4 py-2.5 text-sm text-slate-800 bg-white outline-none placeholder:text-slate-400"
          autoComplete="off"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={clearSearch}
            className="px-2 bg-white text-slate-400 hover:text-slate-600 transition-colors flex items-center"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => { if (query.trim().length >= 2) analytics.search(query.trim()); }}
          className="px-4 bg-[#FF9900] hover:bg-[#e68a00] transition-colors flex items-center justify-center"
          aria-label="Pretraži"
        >
          {loading ? (
            <svg
              className="w-5 h-5 text-[#131921] animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          ) : (
            <Search className="w-5 h-5 text-[#131921]" strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-1 bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden"
          style={{
            zIndex: 200,
            overflowY: results.length > VISIBLE_ROWS ? "scroll" : "hidden",
            height:
              results.length === 0
                ? "auto"
                : `${Math.min(results.length, VISIBLE_ROWS) * ROW_HEIGHT}px`,
          }}
        >
          {results.length === 0 && !loading && (
            <div className="px-4 py-5 text-sm text-slate-500">
              Nema rezultata za &ldquo;{query}&rdquo;
            </div>
          )}

          {results.filter((p) => p.id != null).map((product, idx) => (
            <Link
              key={product.id}
              href={productUrl(product)}
              onClick={() => {
                setQuery(product.name);
                onChange(product.name);
                setOpen(false);
                if (product.id) analytics.search(product.name, product.id, product.storeName);
              }}
              className="flex items-center gap-3 px-3 transition-colors"
              style={{
                height: `${ROW_HEIGHT}px`,
                backgroundColor: activeIndex === idx ? "#fff8ee" : "white",
                borderBottom:
                  idx < results.length - 1 ? "1px solid #f1f5f9" : "none",
              }}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              {/* Slika */}
              <div
                className="shrink-0 rounded bg-slate-50 flex items-center justify-center overflow-hidden"
                style={{ width: 48, height: 48 }}
              >
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={48}
                    height={48}
                    className="object-contain w-full h-full"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                    unoptimized
                  />
                ) : (
                  <TrendingUp className="w-5 h-5 text-slate-300" />
                )}
              </div>

              {/* Naziv + brend */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate leading-tight">
                  <HighlightMatch text={product.name} query={query} />
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {product.brand && (
                    <span className="font-medium text-slate-500">
                      {product.brand}
                    </span>
                  )}
                  {product.brand && product.storeName && (
                    <span className="mx-1 opacity-40">·</span>
                  )}
                  {product.storeName}
                </p>
              </div>

              {/* Cena + badge */}
              <div className="shrink-0 flex flex-col items-end gap-1">
                <PriceTag price={product.numericPrice} className="text-sm font-bold text-[#131921] whitespace-nowrap" />
                {product.valueScore != null && (
                  <ValueBadge score={product.valueScore} />
                )}
              </div>
            </Link>
          ))}

          {results.length > 0 && (
            <div
              className="sticky bottom-0 bg-white border-t border-slate-100 px-4 py-2 flex items-center justify-between"
              style={{ minHeight: 36 }}
            >
              <span className="text-xs text-slate-400">
                {results.length} rezultata
              </span>
              <button
                type="button"
                className="text-xs font-semibold text-[#FF9900] hover:underline"
                onClick={() => {
                  setOpen(false);
                  const url = `/?query=${encodeURIComponent(query.trim())}`;
                  if (window.location.pathname === "/") {
                    navigateTo(url);
                    requestAnimationFrame(() => {
                      const el = document.getElementById("product-grid");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    });
                  } else {
                    window.location.href = url + "#product-grid";
                  }
                }}
              >
                Prikaži sve →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
