"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

function FilterGroup({
  label,
  options,
  selected,
  onChange,
  defaultOpen = false,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

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
        <div className="mt-2 flex flex-col gap-0.5 max-h-[260px] overflow-y-auto pr-1">
          {options.length === 0 && (
            <p className="text-xs text-slate-400 py-1">Učitavanje...</p>
          )}
          {options.map((opt) => {
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

export interface SidebarFilterProps {
  brands: string[];
  flavours: string[];
  selectedStore: string[];
  selectedBrand: string[];
  selectedFlavour: string[];
  selectedCategory: string[];
  minPrice: string;
  maxPrice: string;
  onStoreChange: (val: string) => void;
  onBrandChange: (val: string) => void;
  onFlavourChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onMinChange: (val: string) => void;
  onMaxChange: (val: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  activeCount: number;
}

const STORES = [
  "Pansport",
  "Proteini.si",
  "Proteinbox",
  "Supplementshop",
  "FitLab",
  "Ogistrashop",
];

function FilterContent({
  brands,
  flavours,
  selectedStore,
  selectedBrand,
  selectedFlavour,
  selectedCategory,
  minPrice,
  maxPrice,
  onStoreChange,
  onBrandChange,
  onFlavourChange,
  onCategoryChange,
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
        options={brands.slice(0, 20)}
        selected={selectedBrand}
        onChange={onBrandChange}
      />
      <FilterGroup
        label="Ukus"
        options={flavours}
        selected={selectedFlavour}
        onChange={onFlavourChange}
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      {/* Desktop sidebar — top-[108px] clears the header (64px nav + 36px BetaBanner) with a small gap */}
      <aside className="hidden md:block w-64 shrink-0 self-start sticky top-[108px]">
        <FilterContent {...props} />
      </aside>

      {/* Mobile trigger */}
      <div className="md:hidden w-full mb-2">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-semibold text-[#1B2B4B] w-full justify-center"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filteri
          {props.activeCount > 0 && (
            <span className="ml-1 bg-[#FF9900] text-[#1B2B4B] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {props.activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          style={{ touchAction: "none" }}
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <span className="text-base font-bold text-slate-800">
                Filteri
              </span>
              <button onClick={() => setDrawerOpen(false)}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2">
              <FilterContent {...props} />
            </div>
            <div className="shrink-0 px-4 py-3 border-t border-slate-100 bg-white">
              <button
                onClick={() => setDrawerOpen(false)}
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
