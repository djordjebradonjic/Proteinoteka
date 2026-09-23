"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import api from "@/lib/axios";
import ProductGrid from "@/components/ProductGrid";
import { WEIGHT_RANGES } from "@/components/SIdeBarFilter";
import { Product } from "@/types/product";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import {
  CREATINE_COPY,
  CREATINE_STORES,
  DEFAULT_FORM_TAB,
  FORM_TABS,
  TYPE_LABELS,
  TYPE_OPTIONS,
  formTab,
} from "@/lib/creatine";

// The creatine list. The URL is the single source of truth (bookmarkable, back/forward work); the first
// render matches the server's (defaults, initial data) and the URL is read right after mount. The parameter
// names (sort, brand, store, minPrice, maxPrice, page, query, pak) are the ones robots.ts already keeps
// crawlers out of, so a filtered state never becomes an indexable duplicate of /kreatin.

interface Props {
  initialProducts: Product[];
  initialTotalPages: number;
  initialTotalItems: number;
}

const PAGE_SIZE = 12;
const L = CREATINE_COPY.listing;
const CURRENCY = MARKET_CONFIG[CURRENT_MARKET].currency;

const SORTS = [
  { value: "numericPrice,asc", label: L.sort.priceAsc },
  { value: "numericPrice,desc", label: L.sort.priceDesc },
  { value: "name,asc",         label: L.sort.nameAz },
];

// No value-score sort: creatine's score isn't shown on the frontend (see CreatineFeaturedSection), so cheapest
// first is the one sensible default, regardless of form tab.
const DEFAULT_SORT = "numericPrice,asc";

function list(raw: string | null): string[] {
  return (raw ?? "").split(",").filter(Boolean);
}

function MultiSelect({
  label, options, selected, onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 h-10 px-3 rounded-lg border text-sm font-medium transition-colors ${
          selected.length > 0
            ? "border-[#FF9900] bg-[#FFF8EC] text-[#1B2B4B]"
            : "border-[#E2E8F0] bg-white text-[#1B2B4B] hover:border-[#FFD980]"
        }`}
      >
        {label}
        {selected.length > 0 && (
          <span className="min-w-5 h-5 px-1 rounded-full bg-[#FF9900] text-[#1B2B4B] text-xs font-bold flex items-center justify-center">
            {selected.length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-60 max-h-72 overflow-auto rounded-lg border border-[#E2E8F0] bg-white p-1.5 shadow-lg">
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#FFF8EC] cursor-pointer text-sm text-[#1B2B4B]">
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={() => onToggle(o.value)}
                className="w-4 h-4 accent-[#FF9900]"
              />
              <span className="truncate">{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreatineListing({ initialProducts, initialTotalPages, initialTotalItems }: Props) {
  // "" on the server and on the first client render; the real query string is read right after mount
  const [qs, setQs] = useState("");
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalItems, setTotalItems] = useState(initialTotalItems);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [weightCounts, setWeightCounts] = useState<Record<string, number>>({});
  const [searchDraft, setSearchDraft] = useState("");
  const [minDraft, setMinDraft] = useState("");
  const [maxDraft, setMaxDraft] = useState("");
  const scrollToList = useRef(false);

  useEffect(() => {
    setQs(window.location.search.slice(1));
    setReady(true);
    const onPop = () => setQs(window.location.search.slice(1));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    api.get("/products/brands", { params: { productType: "creatine" } })
      .then((res) => setBrands(res.data ?? []))
      .catch(() => {});
    api.get("/products/weight-distribution", { params: { productType: "creatine" } })
      .then((res) => setWeightCounts(res.data ?? {}))
      .catch(() => {});
  }, []);

  const params = useMemo(() => new URLSearchParams(qs), [qs]);
  const tab = formTab(params.get("oblik") ?? DEFAULT_FORM_TAB);
  const sort = params.get("sort") || DEFAULT_SORT;
  const types = list(params.get("tip"));
  const selBrands = list(params.get("brand"));
  const selStores = list(params.get("store"));
  const selWeights = list(params.get("pak"));
  const minPrice = params.get("minPrice") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";
  const query = params.get("query") ?? "";
  const page = Number(params.get("page")) || 0;

  useEffect(() => { setSearchDraft(query); }, [query]);
  useEffect(() => { setMinDraft(minPrice); }, [minPrice]);
  useEffect(() => { setMaxDraft(maxPrice); }, [maxPrice]);

  const update = useCallback((mutate: (p: URLSearchParams) => void, opts: { keepPage?: boolean; scroll?: boolean } = {}) => {
    const next = new URLSearchParams(qs);
    mutate(next);
    if (!opts.keepPage) next.delete("page");
    const s = next.toString();
    window.history.replaceState(null, "", s ? `${window.location.pathname}?${s}` : window.location.pathname);
    scrollToList.current = opts.scroll === true;
    setQs(s);
  }, [qs]);

  const toggle = (name: string, value: string) =>
    update((p) => {
      const cur = list(p.get(name));
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      if (next.length) p.set(name, next.join(",")); else p.delete(name);
    });

  const setOrDelete = (name: string, value: string) =>
    update((p) => { if (value) p.set(name, value); else p.delete(name); });

  useEffect(() => {
    if (!ready) return;
    // back on the default view: the server-rendered data is right, no request needed
    if (qs === "") {
      setProducts(initialProducts); setTotalPages(initialTotalPages); setTotalItems(initialTotalItems);
      scrollToList.current = false;
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams(qs);
        const t = formTab(q.get("oblik") ?? DEFAULT_FORM_TAB);
        const res = await api.get("/products", {
          params: {
            productType: "creatine",
            page: Number(q.get("page")) || 0,
            size: PAGE_SIZE,
            sort: q.get("sort") || DEFAULT_SORT,
            ...(t.forms && { productForm: t.forms }),
            ...(q.get("tip") && { creatineType: q.get("tip") }),
            ...(q.get("brand") && { brand: q.get("brand") }),
            ...(q.get("store") && { storeName: q.get("store") }),
            ...(q.get("pak") && { weightRange: q.get("pak") }),
            ...(q.get("minPrice") && { minPrice: q.get("minPrice") }),
            ...(q.get("maxPrice") && { maxPrice: q.get("maxPrice") }),
            ...(q.get("query") && { name: q.get("query") }),
          },
        });
        if (cancelled) return;
        setProducts(res.data?.content ?? []);
        setTotalPages(res.data?.page?.totalPages ?? 0);
        setTotalItems(res.data?.page?.totalElements ?? 0);
      } catch {
        // keep what is on screen; the next filter change retries
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs, ready]);

  useEffect(() => {
    if (loading || !scrollToList.current) return;
    scrollToList.current = false;
    const el = document.getElementById("creatine-list-start");
    if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 80), behavior: "smooth" });
  }, [loading]);

  const chips: { key: string; label: string; onRemove: () => void }[] = [
    ...(query ? [{ key: "q", label: `"${query}"`, onRemove: () => setOrDelete("query", "") }] : []),
    ...types.map((v) => ({ key: `t-${v}`, label: TYPE_LABELS[v] ?? v, onRemove: () => toggle("tip", v) })),
    ...selBrands.map((v) => ({ key: `b-${v}`, label: v, onRemove: () => toggle("brand", v) })),
    ...selStores.map((v) => ({ key: `s-${v}`, label: v, onRemove: () => toggle("store", v) })),
    ...selWeights.map((v) => ({ key: `w-${v}`, label: WEIGHT_RANGES.find((r) => r.value === v)?.label ?? v, onRemove: () => toggle("pak", v) })),
    ...(minPrice ? [{ key: "min", label: `${L.from} ${minPrice} ${CURRENCY}`, onRemove: () => setOrDelete("minPrice", "") }] : []),
    ...(maxPrice ? [{ key: "max", label: `${L.to} ${maxPrice} ${CURRENCY}`, onRemove: () => setOrDelete("maxPrice", "") }] : []),
  ];

  const showingFrom = totalItems === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min(totalItems, page * PAGE_SIZE + products.length);

  return (
    <section id="creatine-list" className="max-w-7xl mx-auto px-4 py-8 md:py-10">
      {/* Form tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Oblik kreatina">
        {FORM_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab.key === t.key}
            onClick={() => update((p) => { if (t.key === DEFAULT_FORM_TAB) p.delete("oblik"); else p.set("oblik", t.key); p.delete("sort"); })}
            className={`shrink-0 h-10 px-4 rounded-full text-sm font-semibold border transition-colors ${
              tab.key === t.key
                ? "bg-[#1B2B4B] text-white border-[#1B2B4B]"
                : "bg-white text-[#1B2B4B] border-[#E2E8F0] hover:bg-[#FFF8EC] hover:border-[#FFD980]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <form
          className="relative"
          onSubmit={(e) => { e.preventDefault(); setOrDelete("query", searchDraft.trim()); }}
        >
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onBlur={() => { if (searchDraft.trim() !== query) setOrDelete("query", searchDraft.trim()); }}
            placeholder={L.search}
            aria-label={L.search}
            className="h-10 w-48 md:w-56 pl-9 pr-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1B2B4B] placeholder:text-slate-400 focus:outline-none focus:border-[#FF9900]"
          />
        </form>
        <MultiSelect
          label={L.type}
          options={TYPE_OPTIONS.map((v) => ({ value: v, label: TYPE_LABELS[v] }))}
          selected={types}
          onToggle={(v) => toggle("tip", v)}
        />
        <MultiSelect
          label={L.brand}
          options={brands.map((b) => ({ value: b, label: b }))}
          selected={selBrands}
          onToggle={(v) => toggle("brand", v)}
        />
        <MultiSelect
          label={L.store}
          options={CREATINE_STORES.map((s) => ({ value: s, label: s }))}
          selected={selStores}
          onToggle={(v) => toggle("store", v)}
        />
        <MultiSelect
          label={L.weight}
          options={WEIGHT_RANGES.map((r) => ({ value: r.value, label: `${r.label} (${weightCounts[r.value] ?? 0})` }))}
          selected={selWeights}
          onToggle={(v) => toggle("pak", v)}
        />
        <div className="flex items-center gap-1.5">
          <input
            inputMode="numeric"
            value={minDraft}
            onChange={(e) => setMinDraft(e.target.value.replace(/\D/g, ""))}
            onBlur={() => { if (minDraft !== minPrice) setOrDelete("minPrice", minDraft); }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            placeholder={`${L.from} ${CURRENCY}`}
            aria-label={`${L.price} ${L.from}`}
            className="h-10 w-24 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1B2B4B] placeholder:text-slate-400 focus:outline-none focus:border-[#FF9900]"
          />
          <span className="text-slate-400">–</span>
          <input
            inputMode="numeric"
            value={maxDraft}
            onChange={(e) => setMaxDraft(e.target.value.replace(/\D/g, ""))}
            onBlur={() => { if (maxDraft !== maxPrice) setOrDelete("maxPrice", maxDraft); }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            placeholder={`${L.to} ${CURRENCY}`}
            aria-label={`${L.price} ${L.to}`}
            className="h-10 w-24 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1B2B4B] placeholder:text-slate-400 focus:outline-none focus:border-[#FF9900]"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setOrDelete("sort", e.target.value === DEFAULT_SORT ? "" : e.target.value)}
          aria-label="Sortiranje"
          className="h-10 ml-auto px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm font-medium text-[#1B2B4B] focus:outline-none focus:border-[#FF9900]"
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={c.onRemove}
              className="inline-flex items-center gap-1 h-7 pl-3 pr-2 rounded-full bg-[#FFF8EC] border border-[#FFD980] text-xs font-semibold text-[#1B2B4B]"
            >
              {c.label}
              <X className="w-3.5 h-3.5" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => { window.history.replaceState(null, "", window.location.pathname); setQs(""); }}
            className="text-xs font-semibold text-[#FF9900] hover:underline"
          >
            {L.reset}
          </button>
        </div>
      )}

      <p id="creatine-list-start" className="mt-5 mb-3 text-sm text-[#5A6478]" aria-live="polite">
        {totalItems > 0 ? L.results(showingFrom, showingTo, totalItems) : L.none}
      </p>

      <ProductGrid
        products={products}
        loading={loading}
        searchQuery={query || tab.label}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(p) => update((n) => { if (p > 0) n.set("page", String(p)); else n.delete("page"); }, { keepPage: true, scroll: true })}
      />
    </section>
  );
}
