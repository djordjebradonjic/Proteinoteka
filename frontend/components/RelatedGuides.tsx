"use client";

import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { GUIDES, CATEGORY_GUIDES } from "@/lib/guides";

interface Props {
  categoryValue: string;
}

export default function RelatedGuides({ categoryValue }: Props) {
  const slugs = CATEGORY_GUIDES[categoryValue];
  if (!slugs || slugs.length === 0) return null;

  const gridCols = slugs.length >= 3
    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    : "grid-cols-1 sm:grid-cols-2";

  return (
    <section className="max-w-7xl mx-auto px-4 pb-10 pt-2">
      <div className="flex items-center gap-2.5 mb-4">
        <BookOpen className="w-5 h-5 text-[#FF9900]" />
        <h2 className="text-lg font-bold text-slate-900">Korisni vodiči</h2>
      </div>
      <div className={`grid ${gridCols} gap-3`}>
        {slugs.map((slug) => {
          const guide = GUIDES[slug];
          return (
            <Link
              key={slug}
              href={guide.path}
              className="group flex items-start gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#FF9900] hover:shadow-md active:border-[#FF9900] active:shadow-md transition-all duration-150"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center mt-0.5">
                <BookOpen className="w-4 h-4 text-[#FF9900]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 leading-snug mb-0.5 group-hover:text-[#FF9900] group-active:text-[#FF9900] transition-colors">
                  {guide.title}
                </p>
                <p className="text-xs text-slate-500 leading-snug">{guide.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#FF9900] group-active:text-[#FF9900] transition-colors shrink-0 mt-1" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
