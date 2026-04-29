"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import api from "@/lib/axios";
import { Product } from "@/types/product";
import SidebarFilter from "./SIdeBarFilter";
import SortSelect from "./SortSelect";
import ProductGrid from "./ProductGrid";
import { X } from "lucide-react";
import { getCategoryByValue } from "@/lib/categories";

interface Props {
  initialProducts: Product[];
  initialTotalPages: number;
  initialCategory?: string;
}

type Chip = { key: string; label: string; onRemove: () => void };

function parseList(raw: string | null): string[] {
  return (raw || "").split(",").filter(Boolean);
}

export default function ProductSection({
  initialProducts,
  initialTotalPages,
  initialCategory = "",
}: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const search = searchParams.get("query") || "";
  const selectedStores = parseList(searchParams.get("store"));
  const selectedBrands = parseList(searchParams.get("brand"));
  const selectedFlavours = parseList(searchParams.get("flavour"));
  const urlCategories = parseList(searchParams.get("category"));
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const page = Number(searchParams.get("page")) || 0;
  const sort = searchParams.get("sort") || "id,desc";

  const selectedCategories =
    initialCategory && !urlCategories.includes(initialCategory)
      ? [initialCategory, ...urlCategories]
      : urlCategories;

  const hasUrlFilters =
    !!search ||
    selectedStores.length > 0 ||
    selectedBrands.length > 0 ||
    selectedFlavours.length > 0 ||
    urlCategories.length > 0 ||
    !!minPrice ||
    !!maxPrice ||
    !!searchParams.get("page") ||
    sort !== "id,desc";

  const [products, setProducts] = useState<Product[]>(
    hasUrlFilters ? [] : initialProducts,
  );
  const [totalPages, setTotalPages] = useState(
    hasUrlFilters ? 0 : initialTotalPages,
  );
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(hasUrlFilters);
  const [brands, setBrands] = useState<string[]>([]);
  const [flavours, setFlavours] = useState<string[]>([]);

  const toggleFilter = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = parseList(params.get(name));
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (next.length === 0) params.delete(name);
      else params.set(name, next.join(","));
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, replace],
  );

  const updateFilters = useCallback(
    (name: string, value: string | number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value !== "" && value !== "Sve") params.set(name, value.toString());
      else params.delete(name);
      if (name !== "page") params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
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

      const name = searchParams.get("query");
      const store = searchParams.get("store");
      const brand = searchParams.get("brand");
      const flavour = searchParams.get("flavour");
      const min = searchParams.get("minPrice");
      const max = searchParams.get("maxPrice");

      const urlCatList = parseList(searchParams.get("category"));
      const allCats =
        initialCategory && !urlCatList.includes(initialCategory)
          ? [...urlCatList, initialCategory]
          : urlCatList;

      if (name) params.set("name", name);
      if (store) params.set("storeName", store);
      if (brand) params.set("brand", brand);
      if (flavour) params.set("flavour", flavour);
      if (allCats.length) params.set("category", allCats.join(","));
      if (min) params.set("minPrice", min);
      if (max) params.set("maxPrice", max);

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data?.content ?? []);
      setTotalPages(res.data?.page?.totalPages ?? 0);
      setTotalItems(res.data?.page?.totalElements ?? 0);
    } catch (err) {
      console.error("Greška pri učitavanju:", err);
    } finally {
      setLoading(false);
    }
  }, [searchParams, initialCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleReset = () => replace(pathname, { scroll: false });

  const activeCount =
    selectedStores.length +
    selectedBrands.length +
    selectedFlavours.length +
    urlCategories.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);

  const hasActiveFilters = activeCount > 0 || !!search;

  const chips: Chip[] = [
    search ? { key: "query", label: `"${search}"`, onRemove: () => updateFilters("query", "") } : null,
    ...selectedStores.map((s) => ({ key: `store-${s}`, label: s, onRemove: () => toggleFilter("store", s) })),
    ...selectedBrands.map((b) => ({ key: `brand-${b}`, label: b, onRemove: () => toggleFilter("brand", b) })),
    ...selectedFlavours.map((f) => ({ key: `flavour-${f}`, label: `Ukus: ${f}`, onRemove: () => toggleFilter("flavour", f) })),
    ...urlCategories.map((c) => ({ key: `cat-${c}`, label: getCategoryByValue(c)?.label ?? c, onRemove: () => toggleFilter("category", c) })),
    minPrice ? { key: "minPrice", label: `od ${minPrice} RSD`, onRemove: () => updateFilters("minPrice", "") } : null,
    maxPrice ? { key: "maxPrice", label: `do ${maxPrice} RSD`, onRemove: () => updateFilters("maxPrice", "") } : null,
  ].filter(Boolean) as Chip[];

  return (
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
        minPrice={minPrice}
        maxPrice={maxPrice}
        onStoreChange={(val) => toggleFilter("store", val)}
        onBrandChange={(val) => toggleFilter("brand", val)}
        onFlavourChange={(val) => toggleFilter("flavour", val)}
        onCategoryChange={(val) => toggleFilter("category", val)}
        onMinChange={(val) => updateFilters("minPrice", val)}
        onMaxChange={(val) => updateFilters("maxPrice", val)}
        onReset={handleReset}
        hasActiveFilters={hasActiveFilters}
        activeCount={activeCount}
      />

      <div className="flex-1 min-w-0">
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
            updateFilters("page", newPage);
            document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      </div>
    </div>
  );
}
