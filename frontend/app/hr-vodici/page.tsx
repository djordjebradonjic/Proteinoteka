import { notFound } from "next/navigation";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: { absolute: "Vodiči o proteinima za Hrvatsku | Proteinoteka" },
  description:
    "Stručni vodiči o whey proteinu, cijenama u Hrvatskoj i savjeti za početnike. Sve što trebate znati o proteinskim dodacima prehrani.",
  alternates: { canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici` },
  openGraph: {
    title: "Vodiči o proteinima za Hrvatsku | Proteinoteka",
    description:
      "Stručni vodiči o whey proteinu, cijenama u Hrvatskoj i savjeti za početnike.",
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici`,
    siteName: "Proteinoteka",
    locale: "hr_HR",
    type: "website",
  },
};

const HR_SEO_PAGES = [
  {
    href: "/najbolji-whey-protein-hrvatska",
    title: "Najbolji whey protein u Hrvatskoj",
    desc: "Rang lista proteina po value score — koji nudi najviše za tvoj novac.",
  },
  {
    href: "/najjeftiniji-whey-protein-hrvatska",
    title: "Najjeftiniji whey protein u Hrvatskoj",
    desc: "Aktualne cijene sortirane od najjeftinije — sve trgovine na jednom mjestu.",
  },
  {
    href: "/whey-protein-cijena",
    title: "Whey protein cijena u Hrvatskoj",
    desc: "Pregled aktualnih cijena koncentrata, izolata i hidrolizata iz svih trgovina.",
  },
  {
    href: "/whey-isolate-hrvatska",
    title: "Whey izolat u Hrvatskoj",
    desc: "Sve dostupne opcije whey izolata — čistiji protein, manje laktoze.",
  },
  {
    href: "/biljni-protein-hrvatska",
    title: "Biljni protein u Hrvatskoj",
    desc: "Grašak, soja, riža — uspoređujemo sve biljne proteine s aktualnim cijenama.",
  },
  {
    href: "/kazein-protein-hrvatska",
    title: "Kazein protein u Hrvatskoj",
    desc: "Sporo-apsorbirajući protein za noćni oporavak — sve dostupne opcije.",
  },
  {
    href: "/hidrolizat-protein-hrvatska",
    title: "Hidrolizat proteina u Hrvatskoj",
    desc: "Najbrža apsorpcija od svih vrsta proteina — premium segment s aktualnim cijenama.",
  },
  {
    href: "/whey-protein-do-20-eura",
    title: "Whey protein do 20 EUR",
    desc: "Kvalitetni proteini u budžetu do 20 EUR — sortirani po value score.",
  },
  {
    href: "/whey-protein-do-40-eura",
    title: "Whey protein do 40 EUR",
    desc: "Pregled whey proteina do 40 EUR — uključujući i kvalitetne izolate.",
  },
  {
    href: "/najjeftiniji-whey-protein-hrvatska-do-500g",
    title: "Whey protein do 500g — HR",
    desc: "Mala pakovanja za probavanje novih okusa ili putovanje.",
  },
  {
    href: "/najjeftiniji-whey-protein-hrvatska-1500g-2500g",
    title: "Whey protein 1.5–2.5kg — HR",
    desc: "Srednja pakovanja — dobar balans cijene i trajanja.",
  },
  {
    href: "/najjeftiniji-whey-protein-hrvatska-2500g-3500g",
    title: "Whey protein 3kg — HR",
    desc: "Klasični izbor za redovne korisnike koji žele nižu cijenu po gramu.",
  },
  {
    href: "/najjeftiniji-whey-protein-hrvatska-3500g-4500g",
    title: "Whey protein 4kg — HR",
    desc: "Velika pakovanja s najboljom cijenom po gramu proteina.",
  },
  {
    href: "/najjeftiniji-whey-protein-hrvatska-4500g-plus",
    title: "Whey protein 5kg+ — HR",
    desc: "Najveća pakovanja za napredne korisnike koji kupuju na zalihu.",
  },
];

const HR_GUIDES = [
  {
    href: "/hr-vodici/najbolji-protein-za-pocetnike-hrvatska",
    title: "Najbolji protein za početnike — top izbori i cijene",
    desc: "Najbolji ukupno, proračun, vrijednost za novac, probavljivost i biljni izbor — s aktualnim cijenama.",
    readMin: 6,
  },
  {
    href: "/hr-vodici/whey-protein-za-pocetnike-hrvatska",
    title: "Whey protein za početnike — što, koliko i odakle?",
    desc: "WPC, WPI ili biljni? Koliko uzimati i koliko košta mjesec dana u Hrvatskoj.",
    readMin: 7,
  },
  {
    href: "/hr-vodici/kako-uzimati-whey-protein-hrvatska",
    title: "Kako uzimati whey protein — doza, tajming, miješanje i pogreške",
    desc: "Točna doza po cilju, raspored tijekom dana, pravilno miješanje bez grudica, s čime kombinirati i najčešće pogreške.",
    readMin: 9,
  },
  {
    href: "/hr-vodici/koliko-kosta-protein-hrvatska",
    title: "Koliko košta whey protein u Hrvatskoj?",
    desc: "Usporedba cijena whey proteina u EUR po gramu proteina — s aktualnim podacima.",
    readMin: 5,
  },
  {
    href: "/hr-vodici/koliko-proteina-dnevno-hrvatska",
    title: "Koliko proteina dnevno treba uzimati?",
    desc: "Tablica preporuka po cilju i tjelesnoj masi. Za osobu od 80kg koja trenira: 128–176g dnevno.",
    readMin: 7,
  },
  {
    href: "/hr-vodici/protein-za-mrsavljenje-hrvatska",
    title: "Koji protein za mršavljenje? + Cijene u Hrvatskoj",
    desc: "Whey izolat je optimalni izbor — visok postotak proteina, minimum masti. Koliko košta mjesec.",
    readMin: 8,
  },
  {
    href: "/hr-vodici/da-li-protein-goji-hrvatska",
    title: "Goji li protein? Ne — ali postoji jedan uvjet",
    desc: "Kratki odgovor: ne. Goji te kalorijski suficit. Što kalorije shakea i termički učinak znače za vas.",
    readMin: 7,
  },
  {
    href: "/hr-vodici/kada-piti-protein-hrvatska",
    title: "Kada piti protein — prije, poslije treninga ili ujutro?",
    desc: "Ukupan dnevni unos je bitniji od trenutka, ali tri termina ipak imaju stvarnu prednost. Konkretan raspored kroz dan.",
    readMin: 7,
  },
  {
    href: "/hr-vodici/whey-isolate-vs-concentrate-hrvatska",
    title: "Whey Isolate ili Concentrate — što odabrati?",
    desc: "Tablica razlika u sastavu, tko stvarno treba isolate i koliko ta razlika košta na godišnjoj razini — s aktualnim cijenama.",
    readMin: 7,
  },
  {
    href: "/hr-vodici/protein-za-zene-hrvatska",
    title: "Protein za žene u Hrvatskoj — mitovi i činjenice",
    desc: "Postoji li stvarno 'ženski' protein? Hoćete li se namišićiti? Konkretni odgovori bez marketinga, s aktualnim cijenama.",
    readMin: 7,
  },
];

export default function Page() {
  if (CURRENT_MARKET !== 'hr') notFound();
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8 flex-wrap">
          <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
          <span>/</span>
          <span className="text-slate-600">Vodiči</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
          Vodiči o proteinima
        </h1>
        <p className="text-slate-500 mb-10 text-[15px]">
          Stručni članci o odabiru, doziranju i cijenama proteinskih dodataka prehrani u Hrvatskoj.
        </p>

        <section className="mb-10">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Članci</h2>
          <div className="space-y-4">
            {HR_GUIDES.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                className="block bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-[#FF9900] hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-[#FF9900] transition-colors mb-1 leading-snug">
                      {g.title}
                    </h2>
                    <p className="text-[14px] text-slate-500 leading-relaxed">{g.desc}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 mt-1">{g.readMin} min</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Pregled cijena</h2>
          <div className="space-y-3">
            {HR_SEO_PAGES.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                className="block bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-[#FF9900] hover:shadow-md transition-all group"
              >
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900 group-hover:text-[#FF9900] transition-colors mb-1 leading-snug">
                    {g.title}
                  </h2>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{g.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
