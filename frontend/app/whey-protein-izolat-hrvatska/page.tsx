import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import { Product } from "@/types/product";
import Link from "next/link";

export const revalidate = 86400;

function ppg(p: Product): number {
  if (!p.proteinPer100g || !p.primaryWeightGrams || p.numericPrice <= 0) return Infinity;
  return p.numericPrice / ((p.proteinPer100g / 100) * p.primaryWeightGrams);
}

export const metadata: Metadata = {
  title: { absolute: "Whey Protein Izolat Hrvatska — Cijena/g Proteina | Proteinoteka" },
  description:
    "Svi whey izolati dostupni u Hrvatskoj, sortirani po cijeni po gramu proteina. Usporedba s koncentratom — koliko više zaista plaćaš i kad se isplati razlika.",
  alternates: {
    canonical: "https://proteinoteka.com.hr/whey-protein-izolat-hrvatska",
    languages: {
      hr: "https://proteinoteka.com.hr/whey-protein-izolat-hrvatska",
      sr: "https://proteinoteka.rs/whey-protein-izolat",
      "x-default": "https://proteinoteka.rs/whey-protein-izolat",
    },
  },
  openGraph: {
    title: "Whey Protein Izolat u Hrvatskoj 2026 — Cijena po Gramu Proteina | Proteinoteka",
    description: "Rang lista svih izolata u Hrvatskoj po cijeni/g proteina. Usporedba s koncentratom, tko treba izolat i kad se isplati.",
    url: "https://proteinoteka.com.hr/whey-protein-izolat-hrvatska",
    siteName: "Proteinoteka",
    locale: "hr_HR",
    type: "website",
    images: [{ url: "https://proteinoteka.com.hr/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: { card: "summary_large_image", images: ["https://proteinoteka.com.hr/opengraph-image"] },
};

export default async function Page() {
  if (CURRENT_MARKET !== "hr") notFound();

  const [isolateProducts, concentrateProducts] = await Promise.all([
    fetchTopProducts({ category: "whey_isolate", sortBy: "valueScore", limit: 25 }),
    fetchTopProducts({ category: "whey_concentrate", sortBy: "valueScore", limit: 15 }),
  ]);

  const sortedIsolates = [...isolateProducts]
    .filter(p => ppg(p) < Infinity)
    .sort((a, b) => ppg(a) - ppg(b));

  const isoWithData = isolateProducts.filter(p => ppg(p) < Infinity);
  const concWithData = concentrateProducts.filter(p => ppg(p) < Infinity);

  const avgIso = isoWithData.length > 0
    ? isoWithData.reduce((s, p) => s + ppg(p), 0) / isoWithData.length
    : null;
  const avgConc = concWithData.length > 0
    ? concWithData.reduce((s, p) => s + ppg(p), 0) / concWithData.length
    : null;

  const best = sortedIsolates[0];
  const premiumPct = avgIso && avgConc
    ? Math.round(((avgIso - avgConc) / avgConc) * 100)
    : null;

  const dec = (v: number) => v.toFixed(3).replace(".", ",");

  const quickAnswer = best
    ? `Najisplativiji izolat po gramu proteina je ${best.name} — ${dec(ppg(best))} €/g.${avgIso ? ` Prosjek kategorije: ${dec(avgIso)} €/g proteina.` : ""}${premiumPct !== null && avgConc ? ` Izolat je u prosjeku ${premiumPct > 0 ? premiumPct + "%" : "0%"} skuplji od koncentrata (${dec(avgConc)} €/g).` : ""}`
    : "Uspoređujemo sve whey izolate u Hrvatskoj po cijeni po gramu proteina koji zaista dobijate.";

  const comparisonSection = (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-3">
          Izolat vs. koncentrat — što znači razlika u cijeni
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 mb-4">
          Izolat košta više jer prolazi kroz dodatnu filtraciju — mikrofiltraciju ili izmjenu iona —
          koja podiže udio proteina s tipičnih 70–80% (koncentrat) na 85–93%. Usput, gotovo sva laktoza
          i višak masti se uklanjaju. Rezultat: čišći makro profil po serviranju, ali i viša cijena po kilogramu.
        </p>
        <p className="text-[15px] leading-relaxed text-slate-700 mb-4">
          Pravo pitanje nije <em>&ldquo;koji je skuplji na naljepnici?&rdquo;</em> nego{" "}
          <strong className="text-slate-800">koliko plaćaš po gramu proteina koji zaista unosiš</strong>.
          Tablica ispod sortira točno po tom kriteriju.
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm bg-white">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Karakteristika</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Koncentrat</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Izolat</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Proteini na 100g", conc: "70–80g", iso: "85–93g" },
                { label: "Laktoza po obroku (30g)", conc: "2–5g", iso: "<1g" },
                { label: "Masti po obroku (30g)", conc: "2–5g", iso: "0,5–2g" },
                {
                  label: "Prosjek cijene/g proteina (HR)",
                  conc: avgConc ? `${dec(avgConc)} €` : "–",
                  iso: avgIso ? `${dec(avgIso)} €` : "–",
                },
                { label: "Za koga", conc: "Rekreativci, faza mase", iso: "Intolerancija na laktozu, definicija" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-600 font-medium text-[13px]">{row.label}</td>
                  <td className="py-3 px-4 text-right text-slate-700">{row.conc}</td>
                  <td className="py-3 px-4 text-right text-slate-800 font-semibold">{row.iso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Vrijednosti su okvirne i ovise o konkretnom proizvodu. Cijene su izračunate iz aktualne ponude u Hrvatskoj.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-3">Tko zaista treba izolat?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-bold text-green-800 text-sm mb-2">Izolat ima smisla ako</h3>
            <ul className="text-sm text-green-700 space-y-1.5 leading-relaxed">
              <li>• Imaš intoleranciju na laktozu ili osjetljiv želudac na mliječne derivate</li>
              <li>• Treniraš u fazi definicije i paziš na svaki gram masti i ugljikohidrata</li>
              <li>• Uzimas 3+ obroka dnevno — čišći makro profil zbraja se kroz dan</li>
              <li>• Praviš proteinski kolač ili palačinke gdje laktoza utječe na teksturu</li>
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-bold text-amber-800 text-sm mb-2">Koncentrat je sasvim dovoljan ako</h3>
            <ul className="text-sm text-amber-700 space-y-1.5 leading-relaxed">
              <li>• Nemaš problema s laktozom i treniraš rekreativno 2–3× tjedno</li>
              <li>• Si u fazi mase — eventualni višak masti nije problem</li>
              <li>• Uzimas jedan obrok dnevno — razlika u laktozi je mala</li>
              <li>• Budžet je ograničen — koncentrat daje isti protein za manje novca</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-3">Što znači value score u ovoj kategoriji</h2>
        <p className="text-[15px] leading-relaxed text-slate-700">
          Value score na Proteinoteci kombinira cijenu po gramu proteina, apsolutni sadržaj proteina,
          čistoću sastava i reputaciju brenda. Izolat s visokim value scoreom nije samo jeftin po gramu
          proteina nego i čist — bez pretjeranog škroba, šećera ili kolagena koji vještački podiže proteinski
          postotak na deklaraciji.{" "}
          <Link href="/kako-racunamo-value-score" className="text-[#FF9900] hover:underline font-medium">
            Kako računamo value score →
          </Link>
        </p>
      </section>
    </div>
  );

  return (
    <SEOLandingPage
      h1="Whey Protein Izolat u Hrvatskoj — Cijena po Gramu Proteina"
      intro={`Izolat košta 30–60% više od koncentrata. Prije nego otvoriš novčanik, pogledaj jednu tablicu: svi izolati dostupni u Hrvatskoj, sortirani po cijeni po gramu proteina koji zaista dobijate${premiumPct !== null ? ` — razlika prema koncentratu iznosi ${premiumPct}%` : ""}.`}
      quickAnswer={quickAnswer}
      products={sortedIsolates.length > 0 ? sortedIsolates : isolateProducts}
      listHeading="Svi whey izolati u Hrvatskoj — rang lista po cijeni/g proteina"
      tableCaption="Whey izolat proteini u Hrvatskoj — cijena po gramu proteina i value score"
      currentSlug="whey-protein-izolat-hrvatska"
      showPricePerGramProtein={true}
      middleSection={comparisonSection}
      extraLinks={[
        { href: "/hr-vodici/whey-isolate-vs-concentrate-hrvatska", label: "Izolat vs. Koncentrat — vodič" },
        { href: "/whey-isolate-hrvatska",                          label: "Alternativna lista izolata" },
        { href: "/whey-protein-cijena",                            label: "Cijene svih whey proteina" },
        { href: "/protein-kalkulator-hrvatska",                    label: "Kalkulator proteina" },
        { href: "/kategorija/whey-isolate",                        label: "Kategorija: Whey Izolat" },
      ]}
      faqs={[
        {
          q: "Koja je razlika između whey izolata i koncentrata?",
          a: "Koncentrat prolazi kroz jednu fazu filtracije i zadržava 70–80% proteina, uz nešto laktoze i masti. Izolat ide kroz dodatnu mikrofiltraciju koja podiže proteinski sadržaj na 85–93% i drastično smanjuje laktozu (ispod 1g po obroku) i masti.",
        },
        {
          q: "Je li izolat bez laktoze?",
          a: "Nije potpuno bez laktoze, ali je sadrži znatno manje od koncentrata — obično ispod 1g po obroku od 30g. Većina osoba s umjerenom intolerancijom na laktozu podnosi izolat bez simptoma. Uvijek provjeri deklaraciju konkretnog proizvoda.",
        },
        {
          q: "Isplati li se platiti više za izolat?",
          a: "Ovisi o tvojim ciljevima. Ako treniraš rekreativno i nemaš problema s laktozom, koncentrat daje isti protein za manje novca. Ako si u kalorijskom deficitu, uzimas 3+ obroka dnevno ili imaš intoleranciju na laktozu — izolat je opravdan. Gledaj cijenu po gramu proteina, ne po kilogramu.",
        },
        {
          q: "Koji izolat je trenutno najjeftiniji po gramu proteina u Hrvatskoj?",
          a: best
            ? `Na temelju aktualnih cijena u bazi, ${best.name} nudi cijenu od ${dec(ppg(best))} €/g proteina. Lista se ažurira redovito iz svih trgovina.`
            : "Rang lista iznad sortirana je po cijeni po gramu proteina i ažurira se redovito.",
        },
        {
          q: "Koliko grama izolata dnevno treba uzeti?",
          a: "Isti princip kao za svaki protein: 1,6–2,4g po kilogramu tjelesne mase, ovisno o razini aktivnosti i cilju. Izolat se ni po čemu ne razlikuje od koncentrata u preporučenoj dozi — razlika je samo u čistoći makroa.",
        },
        {
          q: "Može li netko bez intolerancije na laktozu piti izolat?",
          a: "Apsolutno. Izolat nije rezerviran za osobe s intolerancijom. Ako ti odgovara čišći makro profil — izolat je sasvim valjan izbor. Jedina stvarna razlika je u cijeni i laktozi.",
        },
      ]}
    />
  );
}
