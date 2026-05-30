import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Whey Protein Cena u Srbiji 2026 — Poređenje po tipu i prodavnici | Proteinoteka",
  description:
    "Koliko košta whey protein u Srbiji? Poredimo 200+ proizvoda iz 6 prodavnica — concentrate od 2.500, isolate od 4.000 RSD/kg. Nađi najpovoljniji za tvoj budžet.",
  alternates: { canonical: "https://proteinoteka.rs/whey-protein-cena" },
  openGraph: {
    title: "Whey Protein Cena u Srbiji 2026 | Proteinoteka",
    description:
      "Aktuelni pregled cena whey proteina u Srbiji po tipu i prodavnici. Concentrate od ~2.500, isolate od ~4.000, hidrolizat od ~6.000 RSD/kg.",
    url: "https://proteinoteka.rs/whey-protein-cena",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

const PRICE_ROWS = [
  { type: "Whey Concentrate", href: "/kategorija/whey-concentrate", range: "2.500 – 5.500 RSD/kg", protein: "70–80g", note: "Najpopularniji izbor, odlična vrednost" },
  { type: "Whey Isolate",     href: "/kategorija/whey-isolate",     range: "4.000 – 9.000 RSD/kg", protein: "85–95g", note: "Manje laktoze i masti, čistiji protein" },
  { type: "Hidrolizat",       href: "/kategorija/hidrolizat",        range: "6.000 – 12.000 RSD/kg", protein: "85–95g", note: "Najbrža apsorpcija, premium segment" },
  { type: "Kazein",           href: "/kategorija/kazein",            range: "4.000 – 8.000 RSD/kg",  protein: "75–85g", note: "Sporo varenje, idealan pre sna" },
  { type: "Biljni protein",   href: "/kategorija/biljni-protein",    range: "3.000 – 7.000 RSD/kg",  protein: "65–80g", note: "Vegan opcija, grašak ili soja baza" },
  { type: "Blend",            href: "/kategorija/blend",             range: "3.000 – 6.500 RSD/kg",  protein: "70–85g", note: "Mešavina vrsta za duži efekat" },
];

function PriceByTypeTable() {
  return (
    <section>
      <h2 className="text-xl font-extrabold text-slate-900 mb-2">
        Cene whey proteina po tipu — 2026
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Okvirni rasponi za standardno pakovanje od 1&nbsp;kg. Cene variraju po brendu, prodavnici i veličini pakovanja.
      </p>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tip proteina</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Cena / kg</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell whitespace-nowrap">Protein / 100g</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Napomena</th>
              </tr>
            </thead>
            <tbody>
              {PRICE_ROWS.map((row) => (
                <tr key={row.type} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-5">
                    <a href={row.href} className="font-semibold text-slate-900 hover:text-[#FF9900] active:text-[#FF9900] transition-colors">
                      {row.type}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#FF9900] whitespace-nowrap">{row.range}</td>
                  <td className="py-3 px-4 text-right text-slate-600 hidden sm:table-cell">{row.protein}</td>
                  <td className="py-3 px-5 text-slate-500 text-xs hidden md:table-cell">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            * Rasponi su okvirni za standardna pakovanja od 1&nbsp;kg. Aktuelne cene po proizvodima prikazane su u listi ispod.
          </p>
        </div>
      </div>
    </section>
  );
}

export default async function Page() {
  const products = await fetchTopProducts({ sortBy: "price", limit: 20 });

  const cheapest = products[0];
  const avgPrice = products.length > 0
    ? Math.round(products.reduce((s, p) => s + (p.numericPrice ?? 0), 0) / products.length)
    : null;

  const quickAnswer = cheapest
    ? `Najjeftiniji whey protein u trenutnoj bazi je ${cheapest.name} po ceni ${cheapest.price}. Prosek za svih ${products.length} proizvoda je oko ${avgPrice?.toLocaleString("sr-RS")} RSD. Za realnu procenu vrednosti gledaj RSD po gramu proteina — taj podatak je prikazan uz svaki proizvod ispod.`
    : "";

  return (
    <SEOLandingPage
      h1="Whey Protein Cena u Srbiji 2026"
      intro="Transparentan pregled svih aktuelnih cena whey proteina na srpskom tržištu. Upoređujemo concentrate, isolate, hidrolizat, kazein i biljni protein iz svih prodavnica — i računamo realnu cenu po gramu proteina, jedini podatak koji zaista meri vrednost."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini sortirani po ceni — od najjeftinijeg"
      tableCaption="Pregled cena whey proteina u Srbiji 2026"
      currentSlug="whey-protein-cena"
      middleSection={<PriceByTypeTable />}
      faqs={[
        {
          q: "Koliko košta whey protein u Srbiji u 2026. godini?",
          a: "Cene se kreću od oko 2.500 RSD/kg za whey concentrate do 12.000+ RSD/kg za premium hidrolizat. Najpopularniji segment — concentrate od poznatih brendova — obično košta između 3.500 i 5.500 RSD za kilogram. Za realnu procenu uvek gledaj cenu po gramu proteina, ne ukupnu cenu pakovanja.",
        },
        {
          q: "Koliko košta gram proteina u proseku u Srbiji?",
          a: "Za whey koncentrat prosek je otprilike 3–6 dinara po gramu proteina, u zavisnosti od brenda i prodavnice. Za izolat se kreće od 5–10 dinara. Hidrolizat je obično najskuplji. Gledaj cenu po gramu proteina, ne ukupnu cenu pakovanja — tako jedino možeš stvarno porediti.",
        },
        {
          q: "Zašto se cene toliko razlikuju između prodavnica?",
          a: "Svaka prodavnica ima različite marže, troškove uvoza i promotivne politike. Isti protein može koštati i 20–30% više u jednoj prodavnici nego u drugoj. Zato ima smisla proveriti više mesta pre kupovine — što Proteinoteka radi automatski.",
        },
        {
          q: "Da li je izolat uvek skuplji od koncentrata?",
          a: "U pravilu jeste — proces dodatne filtracije koji daje višu čistoću proteina i manje laktoze košta više. Ali razlika nije uvek drastična. Ponekad akcijama ili u manjim pakovanjima možeš naći izolat po ceni sličnoj koncentratu. Lista na ovoj stranici prikazuje sve tipove zajedno, pa možeš direktno porediti.",
        },
        {
          q: "Na šta treba obratiti pažnju osim na cenu?",
          a: "Veličina pakovanja direktno utiče na cenu po gramu — veće pakovanje je obično isplativije, ako ga možeš potrošiti pre isteka roka. Pored cene, gledaj sadržaj proteina na 100g (što više, to bolje), šećere i masti. Na Proteinoteci su ti podaci prikazani uz svaki proizvod.",
        },
        {
          q: "Da li je jeftinije kupovati protein online u Srbiji ili uvoziti iz EU?",
          a: "Za većinu kupaca, domaće online prodavnice su praktičniji izbor. Uvoz iz EU (npr. Myprotein, Bulk) može biti 10–20% jeftiniji po gramu, ali uračunaj troškove dostave, carinu i PDV na pošiljke iznad 150 EUR. Za pakovanja do 1–2kg razlika obično ne opravdava komplikacije.",
        },
        {
          q: "Kada padaju cene proteina — postoje li sezonske akcije?",
          a: "Da. Najveće akcije su tokom Black Friday novembra (popusti do 40%), posle Nove godine (januarski rasprodaja zaliha) i pred letnju sezonu (april–maj). Aktiviraj price alert na Proteinoteci za proizvod koji te zanima — dobiješ email čim cena padne.",
        },
        {
          q: "Koji whey protein daje najviše proteina za novac?",
          a: "To zavisi od trenutnih cena, ali u principu concentrate sa visokim sadržajem proteina (75g+ na 100g) u velikom pakovanju (2kg+) redovno daje best value. Na Proteinoteci svaki proizvod ima izračunat Value Score koji kombinuje cenu po gramu proteina, čistoću i veličinu pakovanja — sortiraj po njemu za brz odgovor.",
        },
      ]}
    />
  );
}
