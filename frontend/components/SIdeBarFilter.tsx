"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Minus, SlidersHorizontal, X, Search } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

function FilterGroup({
  label,
  options,
  selected,
  onChange,
  defaultOpen = false,
  searchable = false,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string) => void;
  defaultOpen?: boolean;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = searchable && search.trim()
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Focus search input when panel opens
  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (!open) setSearch("");
  }, [open, searchable]);

  return (
    <div className="border-b border-slate-200 py-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wide flex items-center gap-2">
          {label}
          {selected.length > 0 && (
            <span className="bg-[#FF9900] text-[#1B2B4B] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {selected.length}
            </span>
          )}
        </span>
        {open ? (
          <Minus className="w-4 h-4 text-slate-400" />
        ) : (
          <Plus className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {open && (
        <div className="mt-2">
          {searchable && (
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pretraži ukus..."
                className="w-full border border-slate-200 rounded-md pl-8 pr-7 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          <div className="flex flex-col gap-0.5 max-h-[260px] overflow-y-auto pr-1">
            {options.length === 0 && (
              <p className="text-xs text-slate-400 py-1">Učitavanje...</p>
            )}
            {filtered.length === 0 && options.length > 0 && (
              <p className="text-xs text-slate-400 py-1">Nema rezultata za &ldquo;{search}&rdquo;</p>
            )}
            {filtered.map((opt) => {
              const isSelected = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => onChange(opt)}
                  className="text-left text-sm px-0 py-1.5 flex items-center gap-2 text-[#1A1A1A] hover:text-[#FF9900] transition-colors"
                >
                  <span
                    className={`w-4 h-4 border rounded flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-[#1B2B4B] border-[#1B2B4B]"
                        : "border-slate-300"
                    }`}
                  >
                    {isSelected && (
                      <span className="text-white text-[10px]">✓</span>
                    )}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PriceRange({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
}: {
  minPrice: string;
  maxPrice: string;
  onMinChange: (val: string) => void;
  onMaxChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  // Sync inputs when URL params change (reset or shared link)
  useEffect(() => setLocalMin(minPrice), [minPrice]);
  useEffect(() => setLocalMax(maxPrice), [maxPrice]);

  const min = localMin !== "" ? Number(localMin) : null;
  const max = localMax !== "" ? Number(localMax) : null;
  const isInvalid = min !== null && max !== null && min > max;
  const isActive = minPrice !== "" || maxPrice !== "";

  const apply = () => {
    if (isInvalid) return;
    onMinChange(localMin);
    onMaxChange(localMax);
  };

  return (
    <div className="border-b border-slate-200 py-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wide flex items-center gap-2">
          Cena (RSD)
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9900] shrink-0" />
          )}
        </span>
        {open ? (
          <Minus className="w-4 h-4 text-slate-400" />
        ) : (
          <Plus className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Od"
              value={localMin}
              min={0}
              onChange={(e) => setLocalMin(e.target.value)}
              className={`w-full border rounded px-2 py-2 text-sm outline-none focus:ring-1 ${
                isInvalid
                  ? "border-red-300 focus:ring-red-300"
                  : "border-slate-200 focus:ring-[#FF9900]"
              }`}
            />
            <span className="text-slate-400 text-sm shrink-0">–</span>
            <input
              type="number"
              placeholder="Do"
              value={localMax}
              min={0}
              onChange={(e) => setLocalMax(e.target.value)}
              className={`w-full border rounded px-2 py-2 text-sm outline-none focus:ring-1 ${
                isInvalid
                  ? "border-red-300 focus:ring-red-300"
                  : "border-slate-200 focus:ring-[#FF9900]"
              }`}
            />
          </div>
          {isInvalid && (
            <p className="text-[11px] text-red-500">
              Minimalna cena ne može biti veća od maksimalne.
            </p>
          )}
          <button
            onClick={apply}
            disabled={isInvalid}
            className="w-full bg-[#FF9900] hover:bg-[#e68a00] disabled:opacity-40 disabled:cursor-not-allowed text-[#1B2B4B] text-sm font-semibold py-1.5 rounded transition-colors"
          >
            Primeni
          </button>
        </div>
      )}
    </div>
  );
}

export const WEIGHT_RANGES = [
  { value: "0-500",     label: "0.0 – 0.5 kg" },
  { value: "500-1000",  label: "0.5 – 1.0 kg" },
  { value: "1000-3000", label: "1.0 – 3.0 kg" },
  { value: "3000-6000", label: "3.0 – 6.0 kg" },
];

function WeightRangeFilter({
  selected,
  counts,
  onChange,
}: {
  selected: string[];
  counts: Record<string, number>;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 py-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wide flex items-center gap-2">
          Pakovanje
          {selected.length > 0 && (
            <span className="bg-[#FF9900] text-[#1B2B4B] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {selected.length}
            </span>
          )}
        </span>
        {open ? (
          <Minus className="w-4 h-4 text-slate-400" />
        ) : (
          <Plus className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-0.5">
          {WEIGHT_RANGES.map(({ value, label }) => {
            const isSelected = selected.includes(value);
            const count = counts[value] ?? 0;
            return (
              <button
                key={value}
                onClick={() => onChange(value)}
                className="text-left text-sm px-0 py-1.5 flex items-center gap-2 text-[#1A1A1A] hover:text-[#FF9900] transition-colors"
              >
                <span
                  className={`w-4 h-4 border rounded flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "bg-[#1B2B4B] border-[#1B2B4B]"
                      : "border-slate-300"
                  }`}
                >
                  {isSelected && (
                    <span className="text-white text-[10px]">✓</span>
                  )}
                </span>
                <span>{label}</span>
                <span className="text-slate-400 text-xs ml-auto">({count})</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface SidebarFilterProps {
  brands: string[];
  flavours: string[];
  selectedStore: string[];
  selectedBrand: string[];
  selectedFlavour: string[];
  selectedCategory: string[];
  selectedWeightRange: string[];
  weightCounts: Record<string, number>;
  minPrice: string;
  maxPrice: string;
  onStoreChange: (val: string) => void;
  onBrandChange: (val: string) => void;
  onFlavourChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onWeightRangeChange: (val: string) => void;
  onMinChange: (val: string) => void;
  onMaxChange: (val: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  activeCount: number;
  /** Controlled from parent so both the inline button and the fixed bottom bar can trigger the drawer */
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  onCloseDrawer: () => void;
}

const STORES = [
  "Pansport",
  "Proteini.si",
  "Proteinbox",
  "Supplementshop",
  "FitLab",
  "Ogistrashop",
  "GymBeam",
  "MyProtein",
  "Lama",
  "Shopbuilder",
];

function FilterContent({
  brands,
  flavours,
  selectedStore,
  selectedBrand,
  selectedFlavour,
  selectedCategory,
  selectedWeightRange,
  weightCounts,
  minPrice,
  maxPrice,
  onStoreChange,
  onBrandChange,
  onFlavourChange,
  onCategoryChange,
  onWeightRangeChange,
  onMinChange,
  onMaxChange,
  onReset,
  hasActiveFilters,
  activeCount,
}: SidebarFilterProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#1A1A1A]" />
          <span className="text-sm font-bold text-[#1A1A1A] uppercase tracking-widest">
            Filteri
          </span>
          {activeCount > 0 && (
            <span className="bg-[#FF9900] text-[#1B2B4B] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {activeCount}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-[#FF9900] hover:text-[#e68a00] font-semibold transition-colors"
          >
            Resetuj sve
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="border-b border-slate-200 pb-4 mb-1">
        <p className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wide mb-2">
          Kategorija
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory.includes(cat.value);
            return (
              <button
                key={cat.value}
                onClick={() => onCategoryChange(cat.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
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

      <FilterGroup
        label="Prodavnica"
        options={STORES}
        selected={selectedStore}
        onChange={onStoreChange}
        defaultOpen
      />
      <FilterGroup
        label="Brend"
        options={brands}
        selected={selectedBrand}
        onChange={onBrandChange}
      />
      <FilterGroup
        label="Ukus"
        options={flavours}
        selected={selectedFlavour}
        onChange={onFlavourChange}
        searchable
      />
      <WeightRangeFilter
        selected={selectedWeightRange}
        counts={weightCounts}
        onChange={onWeightRangeChange}
      />
      <PriceRange
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinChange={onMinChange}
        onMaxChange={onMaxChange}
      />
    </div>
  );
}

export default function SidebarFilter(props: SidebarFilterProps) {
  const { drawerOpen, onOpenDrawer, onCloseDrawer } = props;

  useEffect(() => {
    if (!drawerOpen) return;

    // Lock the background in place (overflow:hidden alone doesn't stop touch
    // scrolling on iOS/Android), while leaving the drawer's own scroll free.
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
  }, [drawerOpen]);

  return (
    <>
      {/* Desktop sidebar — top-[72px] clears the 64px sticky header with a small gap */}
      <aside className="hidden md:block w-64 shrink-0 self-start sticky top-[72px]">
        <FilterContent {...props} />
      </aside>

      {/* Mobile inline trigger — always visible above the grid; observed by ProductSection
          to know when to show the fixed bottom bar */}
      <div className="md:hidden w-full mb-2">
        <button
          id="mobile-filter-trigger"
          onClick={onOpenDrawer}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold w-full justify-center shadow-md transition-all active:scale-[0.98] ${
            props.activeCount > 0
              ? "bg-[#FF9900] text-[#1B2B4B]"
              : "bg-[#1B2B4B] text-white"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 shrink-0" />
          Filteri
          {props.activeCount > 0 && (
            <span className="ml-1 bg-[#1B2B4B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {props.activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile drawer — triggered by both the inline button and the fixed bottom bar */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onCloseDrawer}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <span className="text-base font-bold text-slate-800">
                Filteri
              </span>
              <button onClick={onCloseDrawer}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2">
              <FilterContent {...props} />
            </div>
            <div className="shrink-0 px-4 py-3 border-t border-slate-100 bg-white">
              <button
                onClick={onCloseDrawer}
                className="w-full bg-[#1B2B4B] text-white font-bold py-3 rounded-md text-sm uppercase tracking-wide"
              >
                Prikaži rezultate
                {props.activeCount > 0 && (
                  <span className="ml-2 bg-[#FF9900] text-[#1B2B4B] text-xs font-bold px-2 py-0.5 rounded-full">
                    {props.activeCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
