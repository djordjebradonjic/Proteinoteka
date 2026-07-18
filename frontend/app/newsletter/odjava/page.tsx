import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Odjavljen si sa newslettera",
  robots: { index: false, follow: false },
};

export default function NewsletterOdjavaPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" strokeWidth={2} />
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Odjavljen si sa newslettera
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Nećemo ti više slati dvonedeljni pregled ušteda. Uvek se možeš ponovo prijaviti kad poželiš.
          </p>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1B2B4B] text-white font-semibold text-sm rounded-xl hover:bg-[#243860] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Vrati se na Proteinoteka
          </Link>
        </div>

      </div>
    </div>
  );
}
