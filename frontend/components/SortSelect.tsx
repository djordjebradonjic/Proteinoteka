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
        <SelectTrigger className="w-[180px] bg-white border-slate-200 rounded-xl shadow-sm focus:ring-blue-500">
          <SelectValue placeholder="Izaberi sortiranje" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="id,desc">Najnovije dodato</SelectItem>
          <SelectItem value="valueScore,asc">⚡ Isplativost</SelectItem> 
          <SelectItem value="numericPrice,asc">Cena: Niža ka višoj</SelectItem>
          <SelectItem value="numericPrice,desc">Cena: Viša ka nižoj</SelectItem>
          <SelectItem value="name,asc">Naziv: A-Z</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}