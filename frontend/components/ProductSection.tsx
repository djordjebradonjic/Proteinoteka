"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/axios";
import { Product } from "@/types/product";
import SidebarFilter, { WEIGHT_RANGES } from "./SIdeBarFilter";
import SortSelect from "./SortSelect";
import ProductGrid from "./ProductGrid";
import { ArrowUpDown, SlidersHorizontal, X } from "lucide-react";
import { getCategoryByValue } from "@/lib/categories";
import RelatedGuides from "@/components/RelatedGuides";
import ValueScoreBanner from "@/components/ValueScoreBanner";

const SORT_OPTIONS = [
  { value: "random",              label: "Svi proteini" },
  { value: "id,desc",             label: "Najnovije dodato" },
  { value: "valueScore,desc",     label: "🏆 Najbolja vrednost" },
  { value: "proteinPerRsd,desc",  label: "⚡ Najviše proteina za novac" },
  { value: "numericPrice,asc",    label: "Cena: Niža ka višoj" },
  { value: "numericPrice,desc",   label: "Cena: Viša ka nižoj" },
  { value: "name,asc",            label: "Naziv: A-Z" },
];

interface Props {
  initialProducts: Product[];
  initialTotalPages: number;
  initialTotalItems?: number;
  initialCategory?: string;
}

type Chip = { key: string; label: string; onRemove: () => void };

function parseList(raw: string | null): string[] {
  return (raw || "").split(",").filter(Boolean);
}

function getLiveParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

function hasAnyUrlFilter(live: URLSearchParams): boolean {
  const sort = live.get("sort");
  return !!(
    live.get("query") ||
    live.get("store") ||
    live.get("brand") ||
    live.get("flavour") ||
    live.get("minPrice") ||
    live.get("maxPrice") ||
    (live.get("page") && live.get("page") !== "0") ||
    live.get("category") ||
    live.get("pakovanje") ||
    (sort && sort !== "random")
  );
}

export default function ProductSection({
  initialProducts,
  initialTotalPages,
  initialTotalItems = 0,
  initialCategory = "",
}: Props) {
  const pendingGridScroll = useRef(false);
  // tick drives all re-fetches — incremented on every URL update
  const [tick, setTick] = useState(0);

  // Read display state directly from live URL on every render.
  // getLiveParams() returns empty on SSR → defaults, which matches initialProducts.
  // After hydration, tick changes keep this in sync.
  const lp                  = getLiveParams();
  const search              = lp.get("query")     || "";
  const selectedStores      = parseList(lp.get("store"));
  const selectedBrands      = parseList(lp.get("brand"));
  const selectedFlavours    = parseList(lp.get("flavour"));
  const urlCategories       = parseList(lp.get("category"));
  const selectedWeightRanges = parseList(lp.get("pakovanje"));
  const minPrice            = lp.get("minPrice")  || "";
  const maxPrice            = lp.get("maxPrice")  || "";
  const page                = Number(lp.get("page")) || 0;
  const sort                = lp.get("sort") || "random";

  const selectedCategories =
    initialCategory && !urlCategories.includes(initialCategory)
      ? [initialCategory, ...urlCategories]
      : urlCategories;

  const [products, setProducts]       = useState<Product[]>(initialProducts);
  const [totalPages, setTotalPages]   = useState(initialTotalPages);
  const [totalItems, setTotalItems]   = useState(initialTotalItems);
  const [loading, setLoading]         = useState(false);
  const [brands, setBrands]           = useState<string[]>([]);
  const [flavours, setFlavours]       = useState<string[]>([]);
  const [weightCounts, setWeightCounts] = useState<Record<string, number>>({});

  // Mobile filter drawer + sort sheet state (lifted so fixed bottom bar can trigger them)
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  // Bar logic: visible when inline trigger has scrolled out of view AND product grid is still in viewport.
  // Two independent observers are combined into one state.
  const [triggerGone, setTriggerGone] = useState(false);
  const [inGrid, setInGrid]           = useState(false);
  const barVisible = triggerGone && inGrid;

  // Observe inline mobile trigger button (restored in SidebarFilter with id="mobile-filter-trigger")
  useEffect(() => {
    // Element is rendered by SidebarFilter after mount — wait one tick
    const attach = () => {
      const el = document.getElementById("mobile-filter-trigger");
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => setTriggerGone(!entry.isIntersecting),
        { threshold: 0 },
      );
      obs.observe(el);
      return () => obs.disconnect();
    };
    const cleanup = attach();
    return cleanup ?? undefined;
  }, []);

  // Observe whether the product grid section itself is still in viewport
  useEffect(() => {
    const el = document.getElementById("product-grid");
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInGrid(entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Tell ProteinCalculatorWizard (and anything else) when the bar changes visibility
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("filterbar", { detail: { visible: barVisible } }));
  }, [barVisible]);

  // Lock scroll when sort sheet is open
  useEffect(() => {
    if (!sortSheetOpen) return;
    const scrollY = window.scrollY;
    const { style } = document.body;
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    return () => {
      style.position = "";
      style.top = "";
      style.left = "";
      style.right = "";
      style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [sortSheetOpen]);

  // Update URL without triggering Next.js navigation — no reload, no scroll-to-top.
  const updateUrl = useCallback((url: string) => {
    window.history.replaceState(null, "", url);
    setTick((t) => t + 1);
  }, []);

  const getPathname = () =>
    typeof window !== "undefined" ? window.location.pathname : "/";

  const toggleFilter = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(getLiveParams().toString());
      const current = parseList(params.get(name));
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (next.length === 0) params.delete(name);
      else params.set(name, next.join(","));
      params.delete("page");
      updateUrl(`${getPathname()}?${params.toString()}`);
    },
    [updateUrl],
  );

  const updateFilters = useCallback(
    (name: string, value: string | number) => {
      const params = new URLSearchParams(getLiveParams().toString());
      if (value !== "" && value !== "Sve") params.set(name, value.toString());
      else params.delete(name);
      if (name !== "page") params.delete("page");
      updateUrl(`${getPathname()}?${params.toString()}`);
    },
    [updateUrl],
  );

  // Re-fetch on browser back/forward AND on URL changes from other components
  // (HeroSection category pills, Header search — they dispatch "app:urlchange")
  useEffect(() => {
    const onUrlChange = () => setTick((t) => t + 1);
    window.addEventListener("popstate",       onUrlChange);
    window.addEventListener("app:urlchange",  onUrlChange);
    return () => {
      window.removeEventListener("popstate",      onUrlChange);
      window.removeEventListener("app:urlchange", onUrlChange);
    };
  }, []);

  useEffect(() => {
    api.get("/products/brands").then((res) => setBrands(res.data)).catch(() => {});
    api.get("/products/flavours").then((res) => setFlavours(res.data)).catch(() => {});
    api.get("/products/weight-distribution").then((res) => setWeightCounts(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const live    = getLiveParams();

    // On initial mount with no URL params, skip fetch — SSR data is already correct.
    if (tick === 0 && !hasAnyUrlFilter(live) && !initialCategory) return;

    const pageVal  = live.get("page")     || "0";
    const sortVal  = live.get("sort")     || "random";
    const nameVal  = live.get("query")    || "";
    const storeVal  = live.get("store")     || "";
    const brandVal  = live.get("brand")     || "";
    const flavVal   = live.get("flavour")   || "";
    const minVal    = live.get("minPrice")  || "";
    const maxVal    = live.get("maxPrice")  || "";
    const weightVal = live.get("pakovanje") || "";
    const catList   = parseList(live.get("category"));
    const allCats  = initialCategory && !catList.includes(initialCategory)
      ? [...catList, initialCategory]
      : catList;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", pageVal);
        params.set("size", "12");
        params.set("sort", sortVal);
        if (nameVal)        params.set("name",        nameVal);
        if (storeVal)       params.set("storeName",    storeVal);
        if (brandVal)       params.set("brand",        brandVal);
        if (flavVal)        params.set("flavour",      flavVal);
        if (allCats.length) params.set("category",     allCats.join(","));
        if (minVal)         params.set("minPrice",     minVal);
        if (maxVal)         params.set("maxPrice",     maxVal);
        if (weightVal)      params.set("weightRange",  weightVal);

        const res = await api.get(`/products?${params.toString()}`);
        if (cancelled) return;
        setProducts(res.data?.content ?? []);
        setTotalPages(res.data?.page?.totalPages ?? 0);
        setTotalItems(res.data?.page?.totalElements ?? 0);
      } catch (err) {
        if (cancelled) return;
        console.error("Greška pri učitavanju:", err);
        setProducts((p) => (p.length === 0 ? initialProducts : p));
        setTotalPages((t) => (t === 0 ? initialTotalPages : t));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, initialCategory]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    if (pendingGridScroll.current) {
      pendingGridScroll.current = false;
      requestAnimationFrame(() => {
        const el = document.getElementById("product-list-start");
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      });
      return;
    }

    const key   = `scroll:${window.location.pathname}${window.location.search}`;
    const saved = sessionStorage.getItem(key);
    if (!saved) return;
    sessionStorage.removeItem(key);
    requestAnimationFrame(() => {
      window.scrollTo({ top: parseInt(saved, 10), behavior: "instant" });
    });
  }, [loading]);

  const handleReset = () => updateUrl(getPathname());

  const activeCount =
    selectedStores.length +
    selectedBrands.length +
    selectedFlavours.length +
    urlCategories.length +
    selectedWeightRanges.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);

  const hasActiveFilters = activeCount > 0 || !!search;

  const chips: Chip[] = [
    search    ? { key: "query",    label: `"${search}"`,         onRemove: () => updateFilters("query",    "") } : null,
    ...selectedStores.map( s => ({ key: `store-${s}`,    label: s,             onRemove: () => toggleFilter("store",   s) })),
    ...selectedBrands.map( b => ({ key: `brand-${b}`,    label: b,             onRemove: () => toggleFilter("brand",   b) })),
    ...selectedFlavours.map(f => ({ key: `flavour-${f}`, label: `Ukus: ${f}`,  onRemove: () => toggleFilter("flavour", f) })),
    ...urlCategories.map(  c => ({ key: `cat-${c}`,      label: getCategoryByValue(c)?.label ?? c, onRemove: () => toggleFilter("category", c) })),
    ...selectedWeightRanges.map(w => ({ key: `pak-${w}`, label: WEIGHT_RANGES.find(r => r.value === w)?.label ?? w, onRemove: () => toggleFilter("pakovanje", w) })),
    minPrice  ? { key: "minPrice", label: `od ${minPrice} RSD`, onRemove: () => updateFilters("minPrice", "") } : null,
    maxPrice  ? { key: "maxPrice", label: `do ${maxPrice} RSD`, onRemove: () => updateFilters("maxPrice", "") } : null,
  ].filter(Boolean) as Chip[];

  // Show guides when exactly one category is active (dedicated page or single filter)
  const guideCategory = initialCategory || (urlCategories.length === 1 ? urlCategories[0] : "");

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sortiraj";

  return (
    <>
    <div id="product-grid" className="max-w-7xl mx-auto px-4 pt-8 pb-8 md:pb-8">
      {/* ValueScoreBanner — on mobile shown here (above filters), on desktop inside the column */}
      <div className="md:hidden mb-4">
        <ValueScoreBanner />
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start relative pb-24 md:pb-0">
        <SidebarFilter
          brands={brands}
          flavours={flavours}
          selectedStore={selectedStores}
          selectedBrand={selectedBrands}
          selectedFlavour={selectedFlavours}
          selectedCategory={selectedCategories}
          selectedWeightRange={selectedWeightRanges}
          weightCounts={weightCounts}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onStoreChange={(val) => toggleFilter("store",    val)}
          onBrandChange={(val) => toggleFilter("brand",    val)}
          onFlavourChange={(val) => toggleFilter("flavour",  val)}
          onCategoryChange={(val) => toggleFilter("category", val)}
          onWeightRangeChange={(val) => toggleFilter("pakovanje", val)}
          onMinChange={(val) => updateFilters("minPrice",  val)}
          onMaxChange={(val) => updateFilters("maxPrice",  val)}
          onReset={handleReset}
          hasActiveFilters={hasActiveFilters}
          activeCount={activeCount}
          drawerOpen={drawerOpen}
          onOpenDrawer={() => setDrawerOpen(true)}
          onCloseDrawer={() => setDrawerOpen(false)}
        />

        <div className="flex-1 min-w-0 w-full">
          {/* Desktop ValueScoreBanner */}
          <div className="hidden md:block">
            <ValueScoreBanner />
          </div>

          <div id="product-list-start" className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            {/* Sort select — hidden on mobile (accessible via fixed bar) */}
            <div className="hidden md:flex items-center gap-3">
              <SortSelect value={sort} onSortChange={(val) => updateFilters("sort", val)} />
            </div>
            {/* On mobile: show active sort as a small badge */}
            <div className="flex md:hidden items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Sortirano:</span>
              <span className="text-xs font-semibold text-[#1B2B4B] bg-slate-100 px-2 py-1 rounded-full">{currentSortLabel}</span>
            </div>
            {!loading && totalItems > 0 && (
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{totalItems}</span>{" "}
                proizvoda — stranica{" "}
                <span className="font-semibold text-slate-700">{page + 1}</span>{" "}
                od {totalPages}
              </p>
            )}
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {chips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FFF8EC] border border-[#FFD980] rounded-full text-xs font-medium text-[#7a5500]"
                >
                  {chip.label}
                  <button
                    onClick={chip.onRemove}
                    aria-label={`Ukloni filter: ${chip.label}`}
                    className="hover:text-[#FF9900] transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {chips.length > 1 && (
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors px-1"
                >
                  Obriši sve
                </button>
              )}
            </div>
          )}

          <ProductGrid
            products={products}
            loading={loading}
            searchQuery={search}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              pendingGridScroll.current = true;
              updateFilters("page", newPage);
            }}
          />
        </div>
      </div>
    </div>

    {guideCategory && <RelatedGuides categoryValue={guideCategory} />}

    {/* ── Mobile fixed bottom bar ── */}
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-slate-200 px-4 py-3 flex gap-3 transition-transform duration-300 ${
        barVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <button
        onClick={() => setDrawerOpen(true)}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors active:scale-[0.98] ${
          activeCount > 0
            ? "bg-[#FF9900] text-[#1B2B4B]"
            : "bg-[#1B2B4B] text-white"
        }`}
      >
        <SlidersHorizontal className="w-4 h-4 shrink-0" />
        Filteri
        {activeCount > 0 && (
          <span className="bg-[#1B2B4B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {activeCount}
          </span>
        )}
      </button>
      <button
        onClick={() => setSortSheetOpen(true)}
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-200 text-[#1A1A1A] text-sm font-bold transition-colors active:scale-[0.98]"
      >
        <ArrowUpDown className="w-4 h-4 shrink-0" />
        Sortiranje
      </button>
    </div>

    {/* ── Mobile sort bottom sheet ── */}
    {sortSheetOpen && (
      <div className="fixed inset-0 z-50 md:hidden">
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setSortSheetOpen(false)}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-base font-bold text-slate-800">Sortiranje</span>
            <button onClick={() => setSortSheetOpen(false)}>
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div className="px-4 py-3 pb-8 flex flex-col gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  updateFilters("sort", opt.value);
                  setSortSheetOpen(false);
                }}
                className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-colors ${
                  sort === opt.value
                    ? "bg-[#1B2B4B] text-white"
                    : "bg-slate-50 text-slate-700 active:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
