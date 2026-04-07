import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PriceFilterProps {
  minPrice: string;
  maxPrice: string;
  onMinChange: (val: string) => void;
  onMaxChange: (val: string) => void;
}

export default function PriceFilter({ minPrice, maxPrice, onMinChange, onMaxChange }: PriceFilterProps) {
  return (
    <div className="flex flex-col gap-2 p-1">
      <Label className="text-xs text-slate-500 font-medium ml-1">Opseg cene (RSD)</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min"
          className="w-24 h-9 focus-visible:ring-blue-500"
          value={minPrice}
          onChange={(e) => onMinChange(e.target.value)}
        />
        <span className="text-slate-300 text-sm">—</span>
        <Input
          type="number"
          placeholder="Max"
          className="w-24 h-9 focus-visible:ring-blue-500"
          value={maxPrice}
          onChange={(e) => onMaxChange(e.target.value)}
        />
      </div>
    </div>
  );
}