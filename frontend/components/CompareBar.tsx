"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCompare, removeFromCompare } from "@/store/compareSlice";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function CompareBar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const ids = useAppSelector((state) => (state as any).compare.ids) as number[];

  if (ids.length === 0) return null;

  const handleCompare = () => {
    router.push(`/compare?ids=${ids.join(",")}`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1B2B4B] text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            Poređenje: {ids.length}{" "}
            {ids.length === 1 ? "proizvod" : "proizvoda"}
          </span>
          <div className="flex gap-1">
            {ids.map((id) => (
              <button
                key={id}
                onClick={() => dispatch(removeFromCompare(id))}
                className="flex items-center gap-0.5 bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-xs transition-colors"
              >
                #{id} <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => dispatch(clearCompare())}
            className="text-xs text-white/60 hover:text-white transition-colors"
          >
            Obriši sve
          </button>
          <button
            onClick={handleCompare}
            disabled={ids.length < 2}
            className="bg-[#1B2B4B] hover:bg-[#243860] disabled:opacity-40 disabled:cursor-not-allowed text-[#FF9900] font-bold text-sm px-4 py-2 rounded-md transition-colors"
          >
            Uporedi →
          </button>
        </div>
      </div>
    </div>
  );
}
