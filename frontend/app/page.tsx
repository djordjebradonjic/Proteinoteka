"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const HomeContent = dynamic(() => import("@/components/HomeContent"), {
  ssr: false,
});

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 bg-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}