import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import Link from "next/link";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Whey Protein Cena u Srbiji 2026 — Uporedi 200+ Cena | Proteinoteka" },
  description:
    "Whey protein cena u Srbiji: concentrate od 2.500, isolate od 4.000 RSD/kg. Uporedi cene iz 8 prodavnica uživo, prati pad cena i nađi najjeftiniju opciju za svoj budžet.",
  alternates: { canonical: "https://proteinoteka.rs/whey-protein-cena" },
  openGraph: {
    title: "Whey Protein Cena u Srbiji 2026 | Proteinoteka",
    description:
      "Aktuelni pregled cena whey proteina u Srbiji po tipu i prodavnici. Concentrate od ~2.500, isolate od ~4.000, hidrolizat od ~6.000 RSD/kg.",
    url: "https://proteinoteka.rs/whey-protein-cena",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
    images: [{ url: "https://proteinoteka.rs/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://proteinoteka.rs/opengraph-image"],
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

function PriceFactorsSection() {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
      <h2 className="text-xl font-extrabold text-slate-900">
        Šta određuje cenu whey proteina?
      </h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Cena whey proteina u Srbiji varira i do <strong>4 puta</strong> za sličan kvalitet — uglavnom zbog četiri faktora:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-bold text-slate-900 text-sm mb-1">1. Tip proteina</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Concentrate prolazi manje faza filtracije i jeftiniji je. Isolate ima 90%+ čistog proteina i manje laktoze, ali košta više. Hidrolizat je pre-digestovan i najskuplji — nema razloga da ga kupuješ osim ako imaš ozbiljne probleme sa varenjem.
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-bold text-slate-900 text-sm mb-1">2. Brend</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Optimum Nutrition, Scitec i BioTech imaju prepoznatljivost i veće marketinške budžete — to plaćaš u ceni. Manje poznati brendovi često nude isti kvalitet sirovine po nižoj ceni. Value Score na Proteinoteci računa da li je ta razlika opravdana.
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-bold text-slate-900 text-sm mb-1">3. Veličina pakovanja</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pakovanje od 2kg ili 5kg skoro uvek daje bolju cenu po gramu proteina nego pakovanje od 1kg. Ako koristiš protein redovno, veće pakovanje se isplati — uz uslov da ga možeš potrošiti pre isteka roka (obično 2–3 godine).
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-bold text-slate-900 text-sm mb-1">4. Prodavnica i akcije</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Isti protein može se razlikovati <strong>20–30% u ceni</strong> između srpskih prodavnica. Prodavnice povremeno imaju akcije na specifične brendove. Zato ima smisla proveriti više mesta — što Proteinoteka radi automatski za sve prodavnice.
          </p>
        </div>
      </div>
    </section>
  );
}

function BudgetGuideSection() {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
      <h2 className="text-xl font-extrabold text-slate-900">
        Koji whey protein kupiti — prema budžetu
      </h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Nije svaki protein vredan iste cene. Evo šta je realno za svaki budžet na srpskom tržištu:
      </p>
      <div className="space-y-3">
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1 mb-2">
            <h3 className="font-bold text-slate-900 text-sm">Do 3.000 RSD po pakovanju</h3>
            <Link href="/whey-protein-do-3000-dinara" className="text-xs font-bold text-[#FF9900] hover:underline whitespace-nowrap">Pogledaj ponudu →</Link>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            U ovom rangu naći ćeš uglavnom manja pakovanja (500g–1kg) whey concentrate proteina. Dobar izbor za početnike koji žele da isprobaju suplementaciju bez velikog ulaganja. Budi pažljiv na sadržaj proteina — neki proizvodi u ovom rangu imaju svega 60g proteina na 100g.
          </p>
        </div>
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1 mb-2">
            <h3 className="font-bold text-slate-900 text-sm">3.000 – 5.000 RSD po pakovanju ⭐ Preporučeni opseg</h3>
            <Link href="/najjeftiniji-whey-protein" className="text-xs font-bold text-[#FF9900] hover:underline whitespace-nowrap">Pogledaj ponudu →</Link>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Ovde se nalazi <strong>najveći izbor kvalitetnih proteina</strong> u Srbiji. Za 3.000–5.000 RSD možeš dobiti pakovanje od 1–2kg poznatog whey concentrate brenda sa 75–80g proteina na 100g. Ovo je opseg u kome vrednost za novac je obično najveća — ne treba da platiš više da bi dobio dobar protein.
          </p>
        </div>
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1 mb-2">
            <h3 className="font-bold text-slate-900 text-sm">Iznad 5.000 RSD po pakovanju</h3>
            <Link href="/whey-isolate-srbija" className="text-xs font-bold text-[#FF9900] hover:underline whitespace-nowrap">Pogledaj izolate →</Link>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            U ovom opsegu dominiraju whey isolate i hidrolizat, kao i velika pakovanja (2kg+) premium brendova. Isolate je opravdan izbor ako imaš intoleranciju na laktozu ili preferiraš čistiji proteinski profil. Hidrolizat retko opravdava premijum cenu osim u specifičnim sportskim kontekstima.
          </p>
        </div>
      </div>
    </section>
  );
}

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
  if (CURRENT_MARKET !== 'rs') notFound();
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
      middleSection={
        <>
          <PriceByTypeTable />
          <PriceFactorsSection />
          <BudgetGuideSection />
        </>
      }
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
          a: "Da. Najveće akcije su tokom Black Friday novembra (popusti do 40%), posle Nove godine (januarska rasprodaja zaliha) i pred letnju sezonu (april–maj). Aktuelna prava sniženja pratimo tokom cele godine na strani „whey protein akcije\", gde poredimo trenutnu cenu sa prosekom poslednjih 90 dana. Možeš i da aktiviraš price alert za proizvod koji te zanima — dobiješ email čim cena padne.",
        },
        {
          q: "Koji whey protein daje najviše proteina za novac?",
          a: "To zavisi od trenutnih cena, ali u principu concentrate sa visokim sadržajem proteina (75g+ na 100g) u velikom pakovanju (2kg+) redovno daje best value. Na Proteinoteci svaki proizvod ima izračunat Value Score koji kombinuje cenu po gramu proteina, čistoću i veličinu pakovanja — sortiraj po njemu za brz odgovor.",
        },
      ]}
    />
  );
}
