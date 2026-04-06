interface StoreFilterProps {
  stores: string[];
  brands: string[];
  selectedStore: string;
  selectedBrand: string;
  onStoreChange: (store: string) => void;
  onBrandChange: (brand: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export default function StoreFilter({
  stores,
  brands,
  selectedStore,
  selectedBrand,
  onStoreChange,
  onBrandChange,
  onReset,
  hasActiveFilters,
}: StoreFilterProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6 flex flex-wrap gap-4 items-center">

      {/* Filter prodavnica */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 font-medium">Prodavnica</span>
        <div className="flex flex-wrap gap-2">
          {stores.map((store) => (
            <button
              key={store}
              onClick={() => onStoreChange(store)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${selectedStore === store
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {store}
            </button>
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className="w-px h-10 bg-slate-200 hidden sm:block" />

      {/* Filter brendova */}
      <div className="flex flex-col gap-1 flex-1">
        <span className="text-xs text-slate-500 font-medium">Brend</span>
        <div className="flex flex-wrap gap-2">
          {brands.slice(0, 10).map((brand) => (
            <button
              key={brand}
              onClick={() => onBrandChange(brand)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${selectedBrand === brand
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="text-sm text-red-500 hover:text-red-700 font-medium ml-auto"
        >
          Očisti filtere ✕
        </button>
      )}
    </div>
  );
}