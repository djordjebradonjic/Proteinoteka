import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-slate-800 hover:text-slate-600">
          💪 Proteinoteka
        </Link>
        <span className="text-sm text-slate-500">
          Poređenje cena proteina u Srbiji
        </span>
      </div>
    </header>
  );
}