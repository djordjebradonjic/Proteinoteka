import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ArrowLeft, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Odjavljeni ste od obaveštenja",
  robots: { index: false, follow: false },
};

export default function OdjavaPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" strokeWidth={2} />
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Obaveštenja isključena
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Uspešno si se odjavio od price alert-a za ovaj proizvod.
            Nećemo ti više slati email obaveštenja za njega.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1B2B4B] text-white font-semibold text-sm rounded-xl hover:bg-[#243860] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Vrati se na Proteinoteka
            </Link>
            <Link
              href="/?wishlist=open"
              className="flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl hover:border-[#FF9900] hover:text-[#FF9900] transition-colors"
            >
              <Heart className="w-4 h-4" />
              Lista željenih
            </Link>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          I dalje možeš pratiti cene kada poželiš — samo klikni 🔔 na bilo kom proizvodu.
        </p>

      </div>
    </div>
  );
}
