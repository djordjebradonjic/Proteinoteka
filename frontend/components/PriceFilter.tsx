"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PriceFilterProps {
  minPrice: string;
  maxPrice: string;
  onMinChange: (val: string) => void;
  onMaxChange: (val: string) => void;
}

export default function PriceFilter({ minPrice, maxPrice, onMinChange, onMaxChange }: PriceFilterProps) {
  // 1. Lokalni state za trenutni unos (da kucanje ne secka)
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  useEffect(() => {
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localMin !== minPrice) {
        onMinChange(localMin);
      }
    }, 500);
    return () => clearTimeout(timer); 
  }, [localMin, onMinChange, minPrice]);


  useEffect(() => {
    const timer = setTimeout(() => {
      if (localMax !== maxPrice) {
        onMaxChange(localMax);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localMax, onMaxChange, maxPrice]);

  return (
    <div className="flex flex-col gap-2 p-1">
      <Label className="text-xs text-slate-500 font-medium ml-1 text-nowrap">Opseg cene (RSD)</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min"
          className="w-24 h-9 focus-visible:ring-blue-500"
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value)} 
        />
        <span className="text-slate-300 text-sm">—</span>
        <Input
          type="number"
          placeholder="Max"
          className="w-24 h-9 focus-visible:ring-blue-500"
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)} 
        />
      </div>
    </div>
  );
}