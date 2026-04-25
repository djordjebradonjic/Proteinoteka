"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/axios";
import { Product } from "@/types/product";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import SortSelect from "@/components/SortSelect";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import SidebarFilter from "./SIdeBarFilter";
import CompareBar from "./CompareBar";
import KontaktSekcija from "./KontaktFoma";
import WishlistDrawer from "./WishlistDrawer";
import { X } from "lucide-react";
import { CATEGORIES, getCategoryByValue } from "@/lib/categories";

interface Props {
  initialProducts: Product[];
  initialTotalPages: number;
  /** When set (on /kategorija/[slug] pages), this category is always applied even without a URL param. */
  initialCategory?: string;
}

type Chip = { key: string; label: string; onRemove: () => void };

export default function HomeContent({
  initialProducts,
  initialTotalPages,
  initialCategory = "",
}: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const search          = searchParams.get("query")    || "";
  const selectedStore   = searchParams.get("store")    || "Sve";
  const selectedBrand   = searchParams.get("brand")    || "Sve";
  const selectedFlavour = searchParams.get("flavour")  || "Sve";
  const categoryFromUrl = searchParams.get("category") || "";
  const minPrice        = searchParams.get("minPrice") || "";
  const maxPrice        = searchParams.get("maxPrice") || "";
  const page            = Number(searchParams.get("page")) || 0;
  const sort            = searchParams.get("sort")     || "id,desc";

  // Effective category: URL param wins, falls back to page-level locked category
  const selectedCategory = categoryFromUrl || initialCategory;

  // Only flash skeleton when URL has extra filters on top of what initialProducts already covers.
  // On /kategorija/[slug] pages, initialProducts are pre-filtered, so no skeleton on first paint.
  const hasUrlFilters =
    !!search ||
    selectedStore  !== "Sve" ||
    selectedBrand  !== "Sve" ||
    selectedFlavour !== "Sve" ||
    !!categoryFromUrl ||          // URL-level category override
    !!minPrice ||
    !!maxPrice ||
    !!searchParams.get("page") ||
    sort !== "id,desc";

  const [products,   setProducts]   = useState<Product[]>(hasUrlFilters ? [] : initialProducts);
  const [totalPages, setTotalPages] = useState(hasUrlFilters ? 0 : initialTotalPages);
  const [totalItems, setTotalItems] = useState(0);
  const [loading,    setLoading]    = useState(hasUrlFilters);
  const [brands,     setBrands]     = useState<string[]>([]);
  const [flavours,   setFlavours]   = useState<string[]>([]);

  const updateFilters = useCallback(
    (name: string, value: string | number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value !== "" && value !== "Sve") {
        params.set(name, value.toString());
      } else {
        params.delete(name);
      }
      if (name !== "page") params.delete("page");
      replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, replace],
  );

  useEffect(() => {
    api.get("/products/brands").then((res) => setBrands(res.data)).catch(() => {});
    api.get("/products/flavours").then((res) => setFlavours(res.data)).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", searchParams.get("page") || "0");
      params.set("size", "12");
      params.set("sort", searchParams.get("sort") || "id,desc");

      const name    = searchParams.get("query");
      const store   = searchParams.get("store");
      const brand   = searchParams.get("brand");
      const flavour = searchParams.get("flavour");
      const cat     = searchParams.get("category") || initialCategory;
      const min     = searchParams.get("minPrice");
      const max     = searchParams.get("maxPrice");

      if (name)                       params.set("name",      name);
      if (store   && store   !== "Sve") params.set("storeName", store);
      if (brand   && brand   !== "Sve") params.set("brand",     brand);
      if (flavour && flavour !== "Sve") params.set("flavour",   flavour);
      if (cat)                          params.set("category",  cat);
      if (min)                          params.set("minPrice",  min);
      if (max)                          params.set("maxPrice",  max);

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data.content);
      setTotalPages(res.data.page.totalPages);
      setTotalItems(res.data.page.totalElements);
    } catch (err) {
      console.error("Greška pri učitavanju:", err);
    } finally {
      setLoading(false);
    }
  }, [searchParams, initialCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleReset = () => {
    if (initialCategory) {
      // On category pages, keep the path, just strip query params
      replace(pathname);
    } else {
      replace(pathname);
    }
  };

  // activeCount: count URL-driven filters only (initialCategory is the page's base, not a "filter")
  const activeCount = [
    selectedStore !== "Sve",
    selectedBrand !== "Sve",
    selectedFlavour !== "Sve",
    !!categoryFromUrl,
    !!minPrice,
    !!maxPrice,
  ].filter(Boolean).length;

  const hasActiveFilters = activeCount > 0 || !!search;

  const chips: Chip[] = [
    search
      ? { key: "query",    label: `"${search}"`,                        onRemove: () => updateFilters("query",    "") }
      : null,
    selectedStore !== "Sve"
      ? { key: "store",    label: selectedStore,                        onRemove: () => updateFilters("store",    "Sve") }
      : null,
    selectedBrand !== "Sve"
      ? { key: "brand",    label: selectedBrand,                        onRemove: () => updateFilters("brand",    "Sve") }
      : null,
    selectedFlavour !== "Sve"
      ? { key: "flavour",  label: `Ukus: ${selectedFlavour}`,           onRemove: () => updateFilters("flavour",  "Sve") }
      : null,
    categoryFromUrl
      ? { key: "category", label: getCategoryByValue(categoryFromUrl)?.label ?? categoryFromUrl,
                                                                         onRemove: () => updateFilters("category", "") }
      : null,
    minPrice
      ? { key: "minPrice", label: `od ${minPrice} RSD`,                 onRemove: () => updateFilters("minPrice", "") }
      : null,
    maxPrice
      ? { key: "maxPrice", label: `do ${maxPrice} RSD`,                 onRemove: () => updateFilters("maxPrice", "") }
      : null,
  ].filter(Boolean) as Chip[];

  return (
    <main className="min-h-screen bg-white">
      <Header
        searchValue={search}
        onSearchChange={(val) => updateFilters("query", val)}
      />

      {/* Category quick-links */}
      <div className="border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => updateFilters("category", isActive ? "" : cat.value)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border whitespace-nowrap ${
                    isActive
                      ? "bg-[#1B2B4B] text-white border-[#1B2B4B]"
                      : "bg-white text-slate-600 border-slate-200 hover:border-[#1B2B4B] hover:text-[#1B2B4B]"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6 items-start relative">
        <SidebarFilter
          brands={brands}
          flavours={flavours}
          selectedStore={selectedStore}
          selectedBrand={selectedBrand}
          selectedFlavour={selectedFlavour}
          selectedCategory={selectedCategory}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onStoreChange={(val)    => updateFilters("store",    val)}
          onBrandChange={(val)    => updateFilters("brand",    val)}
          onFlavourChange={(val)  => updateFilters("flavour",  val)}
          onCategoryChange={(val) => updateFilters("category", val)}
          onMinChange={(val)      => updateFilters("minPrice",  val)}
          onMaxChange={(val)      => updateFilters("maxPrice",  val)}
          onReset={handleReset}
          hasActiveFilters={hasActiveFilters}
          activeCount={activeCount}
        />

        <div className="flex-1 min-w-0">
          {/* Sort + count row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <SortSelect
              value={sort}
              onSortChange={(val) => updateFilters("sort", val)}
            />
            {!loading && totalItems > 0 && (
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{totalItems}</span>{" "}
                proizvoda — stranica{" "}
                <span className="font-semibold text-slate-700">{page + 1}</span>{" "}
                od {totalPages}
              </p>
            )}
          </div>

          {/* Active filter chips */}
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
              updateFilters("page", newPage);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      </div>
      <CompareBar />
      <KontaktSekcija />
      <WishlistDrawer />
    </main>
  );
}
