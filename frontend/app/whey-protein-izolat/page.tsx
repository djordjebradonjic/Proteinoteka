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
  title: { absolute: "Whey Protein Izolat u Srbiji — Cena/g Proteina | Proteinoteka" },
  description:
    "Svi whey izolati dostupni u Srbiji sortirani po ceni po gramu proteina. Poređenje sa koncentratom — koliko više zaista platiš i kad se isplati nadoplata.",
  alternates: {
    canonical: "https://proteinoteka.rs/whey-protein-izolat",
    languages: {
      sr: "https://proteinoteka.rs/whey-protein-izolat",
      hr: "https://proteinoteka.com.hr/whey-protein-izolat-hrvatska",
      "x-default": "https://proteinoteka.rs/whey-protein-izolat",
    },
  },
  openGraph: {
    title: "Whey Protein Izolat u Srbiji 2026 — Cena po Gramu Proteina | Proteinoteka",
    description: "Rang lista svih izolata u Srbiji po ceni/g proteina. Poređenje sa koncentratom, ko treba izolat i kad se isplati razlika u ceni.",
    url: "https://proteinoteka.rs/whey-protein-izolat",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
    images: [{ url: "https://proteinoteka.rs/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: { card: "summary_large_image", images: ["https://proteinoteka.rs/opengraph-image"] },
};

export default async function Page() {
  if (CURRENT_MARKET !== "rs") notFound();

  const [isolateProducts, concentrateProducts] = await Promise.all([
    fetchTopProducts({ category: "whey_isolate", sortBy: "valueScore", limit: 25 }),
    fetchTopProducts({ category: "whey_concentrate", sortBy: "valueScore", limit: 15 }),
  ]);

  // Sort isolates by price-per-gram of protein (ascending = cheapest per gram first)
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

  const dec = (v: number) => v.toFixed(2).replace(".", ",");

  const quickAnswer = best
    ? `Najisplativiji izolat po gramu proteina je ${best.name} — ${dec(ppg(best))} RSD/g.${avgIso ? ` Prosek kategorije: ${dec(avgIso)} RSD/g proteina.` : ""}${premiumPct !== null && avgConc ? ` Izolat je u proseku ${premiumPct > 0 ? premiumPct + "%" : "0%"} skuplji od koncentrata (${dec(avgConc)} RSD/g).` : ""}`
    : "Poredimo sve whey izolate u Srbiji po ceni po gramu proteina koji zaista dobijaš.";

  const comparisonSection = (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-3">
          Izolat vs. koncentrat — šta znači razlika u ceni
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 mb-4">
          Izolat košta više jer prolazi kroz dodatnu filtraciju — mikrofiltraciju ili izmenu jona — koja podiže
          udeo proteina sa tipičnih 70–80% (koncentrat) na 85–93%. Usput, gotovo sve laktoza i višak masti
          se uklanjaju. Rezultat: čistiji makro profil po serviranju, ali i viša cena po kilogramu.
        </p>
        <p className="text-[15px] leading-relaxed text-slate-700 mb-4">
          Pravo pitanje nije <em>&ldquo;koji je skuplji na nalepnici?&rdquo;</em> nego{" "}
          <strong className="text-slate-800">koliko platiš po gramu proteina koji zaista unosiš</strong>.
          Izolat sa 92% proteina i izolat sa 86% proteina mogu imati istu cenu po kilogramu — ali ne i po gramu proteina.
          Tabela ispod sortira tačno po tom kriterijumu.
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
                { label: "Laktoza po porciji (30g)", conc: "2–5g", iso: "<1g" },
                { label: "Masti po porciji (30g)", conc: "2–5g", iso: "0.5–2g" },
                {
                  label: "Prosek cene/g proteina (Srbija)",
                  conc: avgConc ? `${dec(avgConc)} RSD` : "–",
                  iso: avgIso ? `${dec(avgIso)} RSD` : "–",
                },
                { label: "Za koga", conc: "Rekreativci, faza mase", iso: "Intolerancija na laktozu, definicija, višestruka dnevna doza" },
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
          Vrednosti su okvirne i zavise od konkretnog proizvoda. Cene su računate iz aktuelne ponude u Srbiji.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-3">Ko zaista treba izolat?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-bold text-green-800 text-sm mb-2">Izolat ima smisla ako</h3>
            <ul className="text-sm text-green-700 space-y-1.5 leading-relaxed">
              <li>• Imaš intoleranciju na laktozu ili osetljiv stomak na mlečne derivate</li>
              <li>• Treniraš u fazi definicije i paziš na svaki gram masti i ugljenih hidrata</li>
              <li>• Uzimas 3+ porcije dnevno — čistiji makro profil zbira se tokom dana</li>
              <li>• Praviš proteinsku hranu (kolači, palačinke) gde laktoza utiče na teksturu</li>
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-bold text-amber-800 text-sm mb-2">Koncentrat je sasvim dovoljan ako</h3>
            <ul className="text-sm text-amber-700 space-y-1.5 leading-relaxed">
              <li>• Nemaš problema sa laktozom i treniraš rekreativno 2–3× nedeljno</li>
              <li>• Si u fazi mase — eventualni višak masti ni izbliza nije problem</li>
              <li>• Uzimas jednu porciju dnevno — razlika u laktoži je mala</li>
              <li>• Budžet je ograničen — koncentrat daje isti protein za manje novca</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-3">Šta znači value score u ovoj kategoriji</h2>
        <p className="text-[15px] leading-relaxed text-slate-700">
          Value score na Proteinoteci uzima u obzir cenu po gramu proteina, ali i apsolutni sadržaj proteina,
          sastav (da li ima nepotrebnih punioca), i reputaciju brenda. Izolat sa visokim value scoreom je
          ne samo jeftin po gramu proteina nego i čist — bez prekomernog skroba, šećera ili kolagena koji
          veštački podiže protein procenat na deklaraciji.{" "}
          <Link href="/kako-racunamo-value-score" className="text-[#FF9900] hover:underline font-medium">
            Kako računamo value score →
          </Link>
        </p>
      </section>
    </div>
  );

  return (
    <SEOLandingPage
      h1="Whey Protein Izolat u Srbiji — Cena po Gramu Proteina"
      intro={`Izolat košta 30–60% više od koncentrata. Pre nego što otvoriš novčanik, pogledaj jednu tablicu: svi izolati dostupni u Srbiji, sortirani po ceni po gramu proteina koji zaista dobijaš${premiumPct !== null ? ` — razlika prema koncentratu iznosi ${premiumPct}%` : ""}.`}
      quickAnswer={quickAnswer}
      products={sortedIsolates.length > 0 ? sortedIsolates : isolateProducts}
      listHeading="Svi whey izolati u Srbiji — rang lista po ceni/g proteina"
      tableCaption="Whey izolat proteini u Srbiji — cena po gramu proteina i value score"
      currentSlug="whey-protein-izolat"
      showPricePerGramProtein={true}
      middleSection={comparisonSection}
      extraLinks={[
        { href: "/vodici/whey-isolate-vs-concentrate",     label: "Izolat vs. Koncentrat — vodič" },
        { href: "/whey-isolate-srbija",                    label: "Alternativna lista izolata" },
        { href: "/whey-protein-cena",                      label: "Cene svih whey proteina" },
        { href: "/protein-kalkulator",                     label: "Kalkulator proteina" },
        { href: "/vodici/protein-bez-laktoze",             label: "Proteini bez laktoze" },
        { href: "/kategorija/whey-isolate",                label: "Kategorija: Whey Izolat" },
      ]}
      faqs={[
        {
          q: "Koja je razlika između whey izolata i koncentrata?",
          a: "Koncentrat prolazi kroz jednu fazu filtracije i zadržava 70–80% proteina, uz nešto laktoze i masti. Izolat ide kroz dodatnu mikrofiltraciju ili izmenu jona koja podiže proteinski sadržaj na 85–93% i drastično smanjuje laktozu (ispod 1g po porciji) i masti. Razlika u praksi: izolat je čistiji makro obrok po porciji, ali u proseku skuplji.",
        },
        {
          q: "Da li izolat nema laktozu?",
          a: "Nije potpuno bez laktoze, ali je sadrži znatno manje od koncentrata — obično ispod 1g po porciji od 30g. Večina osoba sa umerenom intolerancijom na laktozu podnosi izolat bez simptoma. Ako imaš ozbiljnu intoleranciju ili celijakiju, uvek proveri deklaraciju konkretnog proizvoda.",
        },
        {
          q: "Isplati li se platiti više za izolat?",
          a: "Zavisi od tvojih ciljeva. Ako treniraš rekreativno i nemaš problema sa laktozom, koncentrat ti daje isti protein za manje novca — razlika u mišićnom rastu je zanemarljiva. Ako si u kalorijski deficitu, uzimas 3+ porcije dnevno ili imaš intoleranciju na laktozu — izolat je opravdan izbor. Gledaj cenu po gramu proteina, ne po kilogramu.",
        },
        {
          q: "Šta znači '90% proteina' na deklaraciji — tačno ili marketinško?",
          a: "Na deklaraciji se deklarišu proteini na 100g praška, ne na 100g čistog proteina. Izolati koji deklarišu 90g proteina/100g su legitimni — to je realan analitički rezultat. Paziti na izolate koji imaju visok proteinski procenat ali i puno dodane aminokiseline (npr. taurin, glicin, kreatin) — to može veštački da podigne procenat bez povećanja stvarnog mišićnog proteina.",
        },
        {
          q: "Koji izolat je trenutno najjeftiniji po gramu proteina u Srbiji?",
          a: best
            ? `Na osnovu aktuelnih cena u bazi, ${best.name} nudi cenu od ${dec(ppg(best))} RSD po gramu proteina. Lista se ažurira redovno iz svih prodavnica — uvek pogledaj aktuelni rang iznad.`
            : "Rang lista iznad sortirana je po ceni po gramu proteina i ažurira se redovno iz svih prodavnica u bazi.",
        },
        {
          q: "Da li je whey izolat bolji za definiciju nego za masu?",
          a: "Whey izolat je dobar za oba cilja, ali u fazi definicije ima jasnu prednost: manji sadržaj masti i laktoze znači lakšu kontrolu kalorija dok unosiš isti protein. U fazi mase, koncentrat daje iste mišićne efekte za manje novca — jedina praktična prednost izolata ostaje lakša probavljivost.",
        },
        {
          q: "Koliko grama izolata dnevno treba uzeti?",
          a: "Isti princip kao za svaki protein: 1.6–2.4g po kilogramu telesne mase, zavisno od nivoa aktivnosti i cilja. Izolat se ni po čemu ne razlikuje od koncentrata u preporučenoj dozi — razlika je samo u čistoći makroa, ne u tome koliko trebaš uzeti.",
        },
        {
          q: "Može li neko bez intolerance na laktozu da pije izolat?",
          a: "Apsolutno. Izolat nije rezervisan za osobe sa intolerancijom. Ako ne imaš problema sa koncentratom ali ti odgovara čistiji makro profil — izolat je sasvim validan izbor. Jedina stvarna razlika je u ceni i laktoži. Ako ti ni jedno ni drugo nije problem, koncentrat je finansijski isplativiji.",
        },
      ]}
    />
  );
}
