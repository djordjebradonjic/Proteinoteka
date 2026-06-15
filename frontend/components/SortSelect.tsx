"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SortSelectProps {
  value: string;
  onSortChange: (val: string) => void;
}

export default function SortSelect({ value, onSortChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-slate-500 whitespace-nowrap">
        Sortiraj:
      </span>
      <Select value={value} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-[180px] bg-white border-slate-200 rounded-xl shadow-sm focus:ring-[#FF9900]">
          <SelectValue placeholder="Izaberi sortiranje" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="random">Svi proteini</SelectItem>
          <SelectItem value="id,desc">Najnovije dodato</SelectItem>
          <SelectItem value="valueScore,desc">🏆 Najbolja vrednost</SelectItem>
          <SelectItem value="proteinPerRsd,desc">⚡ Najviše proteina za novac</SelectItem>
          <SelectItem value="numericPrice,asc">Cena: Niža ka višoj</SelectItem>
          <SelectItem value="numericPrice,desc">Cena: Viša ka nižoj</SelectItem>
          <SelectItem value="name,asc">Naziv: A-Z</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}