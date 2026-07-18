"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

interface SortSelectProps {
  value: string;
  onSortChange: (val: string) => void;
}

export default function SortSelect({ value, onSortChange }: SortSelectProps) {
  const t = useTranslations("sort");
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-slate-500 whitespace-nowrap">
        {t("label")}
      </span>
      <Select value={value} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-[180px] bg-white border-slate-200 rounded-xl shadow-sm focus:ring-[#FF9900]">
          <SelectValue placeholder={t("placeholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="random">{t("all")}</SelectItem>
          <SelectItem value="id,desc">{t("newest")}</SelectItem>
          <SelectItem value="lastPriceChangeAt,desc">{t("priceChanged")}</SelectItem>
          <SelectItem value="lastPriceDropPct,desc">{t("biggestDrop")}</SelectItem>
          <SelectItem value="lastPriceIncreasePct,desc">{t("biggestIncrease")}</SelectItem>
          <SelectItem value="valueScore,desc">{t("bestValue")}</SelectItem>
          <SelectItem value="proteinPerRsd,desc">{t("mostProtein")}</SelectItem>
          <SelectItem value="numericPrice,asc">{t("priceAsc")}</SelectItem>
          <SelectItem value="numericPrice,desc">{t("priceDesc")}</SelectItem>
          <SelectItem value="name,asc">{t("nameAz")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}