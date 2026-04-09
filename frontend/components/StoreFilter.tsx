import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-wrap gap-6 items-end">
      
      {/* Filter prodavnica - Ostaje sa dugmićima jer ih je malo (2-3) */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-slate-500 font-medium ml-1">Prodavnica</span>
        <div className="flex gap-2">
          {stores.map((store) => (
            <button
              key={store}
              onClick={() => onStoreChange(store)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all border
                ${selectedStore === store
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
            >
              {store}
            </button>
          ))}
        </div>
      </div>

      {/* Filter brendova - Koristimo Select jer brendova može biti mnogo */}
      <div className="flex flex-col gap-2 min-w-[200px]">
        <span className="text-xs text-slate-500 font-medium ml-1">Brend</span>
        <Select 
          value={selectedBrand} 
          onValueChange={(val) => onBrandChange(val)}
        >
          <SelectTrigger className="h-9 focus:ring-blue-500">
            <SelectValue placeholder="Izaberi brend" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Sve">Svi brendovi</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reset dugme */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="h-9 px-3 text-sm text-red-500 hover:bg-red-50 rounded-md transition-colors font-medium mb-[2px]"
        >
          Očisti sve ✕
        </button>
      )}
    </div>
  );
}