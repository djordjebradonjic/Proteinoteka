"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/axios";
import { Product } from "@/types/product";
import SidebarFilter, { WEIGHT_RANGES } from "./SIdeBarFilter";
import SortSelect from "./SortSelect";
import ProductGrid from "./ProductGrid";
import { X } from "lucide-react";
import { getCategoryByValue } from "@/lib/categories";
import RelatedGuides from "@/components/RelatedGuides";
import ValueScoreBanner from "@/components/ValueScoreBanner";

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
    (sort && sort !== "id,desc")
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
  const sort                = lp.get("sort") || "id,desc";

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
    const sortVal  = live.get("sort")     || "id,desc";
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
        const el = document.getElementById("product-grid");
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

  return (
    <>
    <div
      id="product-grid"
      className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6 items-start relative"
    >
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
      />

      <div className="flex-1 min-w-0 w-full">
        <ValueScoreBanner />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
          <SortSelect value={sort} onSortChange={(val) => updateFilters("sort", val)} />
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
    {guideCategory && <RelatedGuides categoryValue={guideCategory} />}
    </>
  );
}
