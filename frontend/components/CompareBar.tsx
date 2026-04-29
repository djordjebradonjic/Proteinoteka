"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCompare, removeFromCompare } from "@/store/compareSlice";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function CompareBar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const ids   = useAppSelector((state) => (state as any).compare.ids)   as number[];
  const items = useAppSelector((state) => (state as any).compare.items) as { id: number; name: string }[];

  if (ids.length === 0) return null;

  const handleCompare = () => {
    const validIds = ids.filter((id) => id != null && Number.isFinite(id));
    if (validIds.length < 2) return;
    router.push(`/compare?ids=${validIds.join(",")}`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1B2B4B] text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center justify-between gap-2 md:gap-4">
        {/* Mobile: compact count only | Desktop: count + pills */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs md:text-sm font-semibold shrink-0">
            {ids.length} {ids.length === 1 ? "proizvod" : "proizvoda"}
          </span>
          <div className="hidden md:flex gap-1 flex-wrap">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => dispatch(removeFromCompare(item.id))}
                className="flex items-center gap-0.5 bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-xs transition-colors max-w-[140px]"
                title={item.name}
              >
                <span className="truncate">{item.name.length > 20 ? item.name.slice(0, 18) + "…" : item.name}</span>
                <X className="w-3 h-3 shrink-0" />
              </button>
            ))}
          </div>
          {/* Mobile: show individual X buttons as small chips */}
          <div className="flex md:hidden gap-1 min-w-0 overflow-hidden">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => dispatch(removeFromCompare(item.id))}
                className="flex items-center bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded transition-colors shrink-0"
                title={item.name}
                aria-label={`Ukloni ${item.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => dispatch(clearCompare())}
            className="text-[11px] md:text-xs text-white/60 hover:text-white transition-colors hidden sm:block"
          >
            Obriši sve
          </button>
          <button
            onClick={() => dispatch(clearCompare())}
            className="sm:hidden text-white/60 hover:text-white transition-colors p-1"
            aria-label="Obriši sve"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={handleCompare}
            disabled={ids.length < 2}
            className="bg-[#FF9900] hover:bg-[#e68a00] disabled:opacity-40 disabled:cursor-not-allowed text-[#1B2B4B] font-bold text-xs md:text-sm px-3 md:px-4 py-2 rounded-md transition-colors whitespace-nowrap"
          >
            Uporedi →
          </button>
        </div>
      </div>
    </div>
  );
}
