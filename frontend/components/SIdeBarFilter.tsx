"use client";

import { useState } from "react";
import { Plus, Minus, SlidersHorizontal, X } from "lucide-react";

interface FilterSection {
  key: string;
  label: string;
  options: string[];
  selected: string;
  onChange: (val: string) => void;
  defaultOpen?: boolean;
}

function FilterGroup({ label, options, selected, onChange, defaultOpen = false }: Omit<FilterSection, "key">) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-200 py-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-base font-semibold text-slate-700">{label}</span>
        {open ? <Minus className="w-4 h-4 text-slate-400" /> : <Plus className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(opt === selected ? "Sve" : opt)}
              className={`text-left text-base px-2 py-1.5 rounded transition-colors ${
                selected === opt
                  ? "bg-[#FF9900]/15 text-[#b36b00] font-medium"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface PriceRangeProps {
  minPrice: string;
  maxPrice: string;
  onMinChange: (val: string) => void;
  onMaxChange: (val: string) => void;
}

function PriceRange({ minPrice, maxPrice, onMinChange, onMaxChange }: PriceRangeProps) {
  const [open, setOpen] = useState(false);
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  return (
    <div className="border-b border-slate-200 py-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-base font-semibold text-slate-700">Cena (RSD)</span>
        {open ? <Minus className="w-4 h-4 text-slate-400" /> : <Plus className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Od"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              className="w-full border border-slate-200 rounded px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-[#FF9900]"
            />
            <span className="text-slate-400 text-sm">–</span>
            <input
              type="number"
              placeholder="Do"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              className="w-full border border-slate-200 rounded px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-[#FF9900]"
            />
          </div>
          <button
            onClick={() => { onMinChange(localMin); onMaxChange(localMax); }}
            className="w-full bg-[#FF9900] hover:bg-[#e68a00] text-[#1B2B4B] text-sm font-semibold py-1.5 rounded transition-colors"
          >
            Primeni
          </button>
        </div>
      )}
    </div>
  );
}

interface SidebarFilterProps {
  brands: string[];
  selectedStore: string;
  selectedBrand: string;
  minPrice: string;
  maxPrice: string;
  onStoreChange: (val: string) => void;
  onBrandChange: (val: string) => void;
  onMinChange: (val: string) => void;
  onMaxChange: (val: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const STORES = ["Pansport", "Proteini.si", "Proteinbox", "Supplementshop", "FitLab", "Ogistrashop"];
const KATEGORIJE = ["Whey protein", "Izolat", "Kazein", "Vegan protein", "Kreatin", "Amino kiseline"];
const UKUSI = ["Čokolada", "Vanila", "Jagoda", "Bez ukusa", "Karamel", "Lešnik"];

function FilterContent({
  brands, selectedStore, selectedBrand, minPrice, maxPrice,
  onStoreChange, onBrandChange, onMinChange, onMaxChange, onReset, hasActiveFilters,
}: SidebarFilterProps) {
  const [selectedKategorija, setSelectedKategorija] = useState("Sve");
  const [selectedUkus, setSelectedUkus] = useState("Sve");

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-base font-bold text-slate-800">Filteri</span>
        {hasActiveFilters && (
          <button onClick={onReset} className="text-xs text-[#FF9900] hover:underline">
            Resetuj
          </button>
        )}
      </div>
      <FilterGroup label="Kategorija" options={KATEGORIJE} selected={selectedKategorija} onChange={setSelectedKategorija} defaultOpen={true} />
      <FilterGroup label="Prodavnica" options={STORES} selected={selectedStore} onChange={onStoreChange} defaultOpen={true} />
      <FilterGroup label="Brend" options={brands.slice(0, 10)} selected={selectedBrand} onChange={onBrandChange} />
      <PriceRange minPrice={minPrice} maxPrice={maxPrice} onMinChange={onMinChange} onMaxChange={onMaxChange} />
      <FilterGroup label="Ukus" options={UKUSI} selected={selectedUkus} onChange={setSelectedUkus} />
    </div>
  );
}

export default function SidebarFilter(props: SidebarFilterProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0">
        <FilterContent {...props} />
      </aside>

      {/* Mobilno dugme */}
      <div className="md:hidden w-full mb-2">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-semibold text-[#1B2B4B] w-full justify-center"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filteri
          {props.hasActiveFilters && (
            <span className="ml-1 bg-[#FF9900] text-[#1B2B4B] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              •
            </span>
          )}
        </button>
      </div>

      {/* Mobilni drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Pozadina */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-base font-bold text-slate-800">Filteri</span>
              <button onClick={() => setDrawerOpen(false)}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="px-4 pb-8">
              <FilterContent {...props} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}