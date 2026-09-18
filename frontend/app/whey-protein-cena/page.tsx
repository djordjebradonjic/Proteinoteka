import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import { formatPrice } from "@/lib/formatPrice";
import {
  getWheyPriceStats,
  type BudgetStat,
  type TypeSource,
  type WheyPriceStats,
} from "@/lib/whey-price-stats";
import Link from "next/link";

export const revalidate = 86400;

// ── Number formatting ─────────────────────────────────────────────────────────
// Every figure on this page is computed from the live catalog (lib/whey-price-stats.ts);
// nothing below is a hand-typed price, count or percentage.

const rsd = (v: number) => (Math.round(v / 100) * 100).toLocaleString("sr-RS"); // RSD/kg, to the nearest 100
const dec = (v: number, digits = 1) => v.toFixed(digits).replace(".", ",");
const pct = (share: number) => Math.round(share * 100);
// Serbian plural of "ponuda": 1 ponuda, 2–4 ponude, 5+ ponuda (but 11–14 ponuda, 21 ponuda, 22 ponude).
const ponuda = (n: number) => {
  const last = n % 10;
  const teen = n % 100 >= 11 && n % 100 <= 14;
  return `${n} ${last === 1 && !teen ? "ponuda" : last >= 2 && last <= 4 && !teen ? "ponude" : "ponuda"}`;
};
const weightLabel = (g: number) =>
  g < 1000 ? `${Math.round(g)}g` : `${(+(g / 1000).toFixed(2)).toString().replace(".", ",")}kg`;

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const url = "https://proteinoteka.rs/whey-protein-cena";
  const s = await getWheyPriceStats();
  const c = s.types.whey_concentrate;
  const i = s.types.whey_isolate;

  const listings = Math.floor(s.wheyListings / 50) * 50;
  const title = listings >= 50
    ? `Whey Protein Cena u Srbiji 2026 — ${listings}+ cena | Proteinoteka`
    : "Whey Protein Cena u Srbiji 2026 | Proteinoteka";
  const description = c && i
    ? `Whey protein cena u Srbiji: koncentrat uglavnom ${rsd(c.kgLow)}–${rsd(c.kgHigh)} RSD/kg, izolat ${rsd(i.kgLow)}–${rsd(i.kgHigh)}. Cene iz ${s.stores} prodavnica i cena po gramu proteina.`
    : `Whey protein cena u Srbiji: uporedi cene iz ${s.stores} prodavnica i vidi cenu po gramu proteina za koncentrat, izolat i hidrolizat.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: "Whey Protein Cena u Srbiji 2026 | Proteinoteka",
      description,
      url,
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
}

// ── Sections ──────────────────────────────────────────────────────────────────

const TYPE_ROWS: { source: TypeSource; label: string; href: string; note: string }[] = [
  { source: "whey_concentrate", label: "Whey Concentrate", href: "/kategorija/whey-concentrate", note: "Najpopularniji izbor, odlična vrednost" },
  { source: "whey_isolate",     label: "Whey Isolate",     href: "/kategorija/whey-isolate",     note: "Manje laktoze i masti, čistiji protein" },
  { source: "hydrolysate",      label: "Hidrolizat",       href: "/kategorija/hidrolizat",       note: "Najbrža apsorpcija, premium segment" },
  { source: "casein",           label: "Kazein",           href: "/kategorija/kazein",           note: "Sporo varenje, idealan pre sna" },
  { source: "vegan",            label: "Biljni protein",   href: "/kategorija/biljni-protein",   note: "Vegan opcija, grašak ili soja baza" },
  { source: "blend",            label: "Blend",            href: "/kategorija/blend",            note: "Mešavina vrsta za duži efekat" },
];

function PriceByTypeTable({ s }: { s: WheyPriceStats }) {
  const rows = TYPE_ROWS.flatMap((row) => {
    const stat = s.types[row.source];
    return stat ? [{ ...row, stat }] : [];
  });

  return (
    <section>
      <h2 className="text-xl font-extrabold text-slate-900 mb-2">
        Cene whey proteina po tipu — 2026
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Tipičan raspon cene za sva pakovanja, računat iz trenutnih cena u našoj bazi. Cene variraju po brendu, prodavnici i veličini pakovanja.
      </p>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tip proteina</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Cena / kg</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">RSD / g proteina</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell whitespace-nowrap">Protein / 100g</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Napomena</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ label, href, note, stat }) => (
                <tr key={label} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-5">
                    <a href={href} className="font-semibold text-slate-900 hover:text-[#FF9900] active:text-[#FF9900] transition-colors">
                      {label}
                    </a>
                    <div className="text-[10px] text-slate-400 mt-0.5">{ponuda(stat.count)}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#FF9900] whitespace-nowrap">
                    {rsd(stat.kgLow)} – {rsd(stat.kgHigh)} RSD/kg
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700 whitespace-nowrap">
                    {dec(stat.gpMedian)}
                    <span className="text-[10px] text-slate-400"> ({dec(stat.gpLow)}–{dec(stat.gpHigh)})</span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 hidden sm:table-cell">
                    {stat.proteinMedian != null ? `${Math.round(stat.proteinMedian)}g` : "—"}
                  </td>
                  <td className="py-3 px-5 text-slate-500 text-xs hidden md:table-cell">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            * Raspon obuhvata 80% ponuda za taj tip (bez 10% najjeftinijih i 10% najskupljih), a cena po gramu proteina je medijana (u zagradi je isti raspon). Računa se iz trenutne baze i osvežava se svakodnevno.
          </p>
        </div>
      </div>
    </section>
  );
}

function PriceFactorsSection({ s }: { s: WheyPriceStats }) {
  const c = s.types.whey_concentrate;
  const i = s.types.whey_isolate;
  const hy = s.types.hydrolysate;
  const sizes = s.concentrateBySize;
  const smallest = sizes[0];
  const largest = sizes[sizes.length - 1];
  const x = s.crossStore;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
      <h2 className="text-xl font-extrabold text-slate-900">
        Šta određuje cenu whey proteina?
      </h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        {c ? (
          <>
            Cena whey koncentrata u Srbiji kreće se otprilike od <strong>{rsd(c.kgLow)}</strong> do{" "}
            <strong>{rsd(c.kgHigh)} RSD/kg</strong> (bez najjeftinijih i najskupljih 10% ponuda) — gornja granica je oko{" "}
            <strong>{dec(c.kgHigh / c.kgLow)} puta</strong> veća od donje, i to za isti tip proteina. Razlog su uglavnom četiri faktora:
          </>
        ) : (
          "Cena whey proteina u Srbiji jako varira i za isti tip proteina — uglavnom zbog četiri faktora:"
        )}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-bold text-slate-900 text-sm mb-1">1. Tip proteina</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Koncentrat prolazi manje faza filtracije i jeftiniji je.
            {c && i && c.proteinMedian != null && i.proteinMedian != null ? (
              <> Izolat ima više proteina (medijana {Math.round(i.proteinMedian)}g na 100g naspram {Math.round(c.proteinMedian)}g kod koncentrata) i manje laktoze, ali košta više — medijana je {rsd(i.kgMedian)} naspram {rsd(c.kgMedian)} RSD/kg.</>
            ) : (
              <> Izolat ima više proteina i manje laktoze, ali košta više.</>
            )}
            {hy ? <> Hidrolizat je pre-digestovan i najskuplji (medijana {rsd(hy.kgMedian)} RSD/kg) — za većinu ljudi ne opravdava razliku u ceni, osim ako imaš ozbiljne probleme sa varenjem.</> : null}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-bold text-slate-900 text-sm mb-1">2. Brend</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Optimum Nutrition, Scitec i BioTech imaju prepoznatljivost i veće marketinške budžete — to plaćaš u ceni. Manje poznati brendovi često nude sličan kvalitet sirovine po nižoj ceni. Value Score na Proteinoteci računa da li je ta razlika opravdana.
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-bold text-slate-900 text-sm mb-1">3. Veličina pakovanja</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {smallest && largest && smallest !== largest ? (
              <>Veće pakovanje je u proseku isplativije: kod koncentrata medijana cene po gramu proteina pada sa {dec(smallest.gpMedian)} RSD ({smallest.label}) na {dec(largest.gpMedian)} RSD ({largest.label}).</>
            ) : (
              <>Veće pakovanje je obično isplativije po gramu proteina.</>
            )}{" "}
            Ako protein koristiš redovno, veće pakovanje se isplati — uz uslov da ga možeš potrošiti pre isteka roka (obično 2–3 godine).
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-bold text-slate-900 text-sm mb-1">4. Prodavnica i akcije</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {x ? (
              <>Za isto pakovanje razlika između najskuplje i najjeftinije prodavnice je obično mala (medijana <strong>{pct(x.median)}%</strong> na {x.groups} proizvoda koje imamo u bar dve prodavnice), ali u {pct(x.shareOver10)}% slučajeva prelazi 10%, a najveća je {pct(x.max)}%. </>
            ) : null}
            Prodavnice povremeno imaju akcije na specifične brendove, zato ima smisla proveriti više mesta — što Proteinoteka radi automatski za {s.stores} prodavnica.
          </p>
        </div>
      </div>
    </section>
  );
}

function bucketText(b: BudgetStat): string {
  return `${ponuda(b.count)}, medijana pakovanja ${weightLabel(b.medianWeightG)}, medijana ${Math.round(b.medianProtein)}g proteina na 100g i oko ${dec(b.gpMedian)} RSD po gramu proteina.`;
}

function BudgetGuideSection({ s }: { s: WheyPriceStats }) {
  const { under3000: lo, from3000to5000: mid, over5000: hi } = s.budget;
  const perGram = lo && mid && hi ? [lo, mid, hi].map((b) => dec(b.gpMedian)) : null;

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
            {lo ? (
              <>
                U ovom opsegu: {bucketText(lo)} Uglavnom su to manja pakovanja whey koncentrata ({pct(lo.concentrateShare)}% ponuda), dobar izbor za početnike koji žele da isprobaju suplementaciju bez velikog ulaganja.
                {lo.lowProteinCount > 0 ? <> Budi pažljiv na sadržaj proteina — {ponuda(lo.lowProteinCount)} ima manje od 65g na 100g.</> : null}
              </>
            ) : (
              <>Uglavnom manja pakovanja whey koncentrata — dobar izbor za početnike koji žele da isprobaju suplementaciju bez velikog ulaganja. Budi pažljiv na sadržaj proteina na 100g.</>
            )}
          </p>
        </div>
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1 mb-2">
            <h3 className="font-bold text-slate-900 text-sm">3.000 – 5.000 RSD po pakovanju</h3>
            <Link href="/najjeftiniji-whey-protein" className="text-xs font-bold text-[#FF9900] hover:underline whitespace-nowrap">Pogledaj ponudu →</Link>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {mid ? (
              <>U ovom opsegu: {bucketText(mid)}</>
            ) : (
              <>Pakovanja od oko kilogram whey proteina.</>
            )}
          </p>
        </div>
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1 mb-2">
            <h3 className="font-bold text-slate-900 text-sm">Iznad 5.000 RSD po pakovanju</h3>
            <Link href="/whey-isolate-srbija" className="text-xs font-bold text-[#FF9900] hover:underline whitespace-nowrap">Pogledaj izolate →</Link>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {hi ? (
              <>
                U ovom opsegu: {bucketText(hi)} Whey izolat i hidrolizat čine {pct(1 - hi.concentrateShare)}% ponuda, a ostalo su uglavnom velika pakovanja koncentrata. Izolat je opravdan izbor ako imaš intoleranciju na laktozu ili preferiraš čistiji proteinski profil. Hidrolizat retko opravdava premijum cenu osim u specifičnim sportskim kontekstima.
              </>
            ) : (
              <>Ovde dominiraju whey izolat, hidrolizat i velika pakovanja (2kg+). Izolat je opravdan izbor ako imaš intoleranciju na laktozu ili preferiraš čistiji proteinski profil.</>
            )}
          </p>
        </div>
      </div>
      {perGram ? (
        <p className="text-xs text-slate-500 leading-relaxed">
          Sam budžet malo govori o vrednosti: medijana cene po gramu proteina je {perGram[0]} RSD do 3.000, {perGram[1]} RSD između 3.000 i 5.000 i {perGram[2]} RSD iznad 5.000. Mnogo više zavisi od tipa proteina i veličine pakovanja.
        </p>
      ) : null}
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function Page() {
  if (CURRENT_MARKET !== "rs") notFound();

  const s = await getWheyPriceStats();
  const c = s.types.whey_concentrate;
  const i = s.types.whey_isolate;
  const hy = s.types.hydrolysate;
  const x = s.crossStore;
  const fx = s.foreignVsDomestic;
  const sizes = s.concentrateBySize;
  const smallest = sizes[0];
  const largest = sizes[sizes.length - 1];
  const top = s.ranked[0];

  // Store prices come as raw scraped strings ("1300", "1.390,00 рсд"); the numeric price is
  // the reliable one, so normalise what this page displays.
  const products = s.ranked.map((r) => ({ ...r.product, price: formatPrice(r.product.numericPrice) }));

  const quickAnswer = top && c && i
    ? `Najpovoljniji whey protein po gramu proteina među pakovanjima od 900g i više je trenutno ${top.product.name} — ${formatPrice(top.product.numericPrice)} za ${weightLabel(top.product.primaryWeightGrams!)}, odnosno ${dec(top.pricePerGProtein, 2)} RSD po gramu proteina. Medijana za whey koncentrat je ${dec(c.gpMedian)}, a za izolat ${dec(i.gpMedian)} RSD/g. Lista ispod je sortirana po ceni po gramu proteina, ne po ceni pakovanja.`
    : "";

  const sizeSentence = smallest && largest && smallest !== largest
    ? ` Kod koncentrata medijana pada sa ${dec(smallest.gpMedian)} RSD/g (${smallest.label}) na ${dec(largest.gpMedian)} RSD/g (${largest.label}).`
    : "";

  const importAnswer = (() => {
    if (!fx) {
      return "Uporedi cenu po gramu proteina zajedno sa dostavom, carinom i PDV-om — cena na sajtu strane prodavnice ne mora da bude konačna cena kod tebe.";
    }
    const ratio = fx.foreign / fx.domestic;
    const numbers = `medijana ${dec(fx.foreign)} RSD naspram ${dec(fx.domestic)} RSD po gramu proteina`;
    const head = ratio > 1.05
      ? `U našim podacima su MyProtein i GymBeam (inostrani lanci) za whey koncentrat skuplji po gramu proteina od ostalih prodavnica: ${numbers}, ${pct(ratio - 1)}% više.`
      : ratio < 0.95
        ? `U našim podacima su MyProtein i GymBeam (inostrani lanci) za whey koncentrat jeftiniji po gramu proteina od ostalih prodavnica: ${numbers}, ${pct(1 - ratio)}% manje.`
        : `U našim podacima su MyProtein i GymBeam (inostrani lanci) za whey koncentrat na sličnoj ceni po gramu proteina kao ostale prodavnice: ${numbers}.`;
    return `${head} To su cene sa njihovih sajtova, a deo razlike može poticati i od drugačijeg asortimana brendova. Ako naručuješ iz inostranstva, dodaj dostavu, carinu i PDV. Zato su za većinu kupaca domaće online prodavnice praktičniji izbor.`;
  })();

  return (
    <SEOLandingPage
      h1="Whey Protein Cena u Srbiji 2026"
      intro={`Transparentan pregled cena whey proteina na srpskom tržištu: ${ponuda(s.wheyListings)} iz ${s.stores} prodavnica. Ispod je pregled cena po tipu proteina, a lista rangira whey proteine (koncentrat, izolat i hidrolizat) po realnoj ceni po gramu proteina — jedinom podatku koji zaista meri vrednost.`}
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini (pakovanja od 900g) sortirani po ceni po gramu proteina"
      tableCaption="Pregled cena whey proteina u Srbiji 2026 — po ceni po gramu proteina"
      currentSlug="whey-protein-cena"
      showPricePerGramProtein
      middleSection={
        <>
          <PriceByTypeTable s={s} />
          <PriceFactorsSection s={s} />
          <BudgetGuideSection s={s} />
        </>
      }
      faqs={[
        {
          q: "Koliko košta whey protein u Srbiji u 2026. godini?",
          a: c && i && hy
            ? `Whey koncentrat uglavnom košta ${rsd(c.kgLow)}–${rsd(c.kgHigh)} RSD/kg (medijana ${rsd(c.kgMedian)}), izolat ${rsd(i.kgLow)}–${rsd(i.kgHigh)} RSD/kg (medijana ${rsd(i.kgMedian)}), a hidrolizat ${rsd(hy.kgLow)}–${rsd(hy.kgHigh)} RSD/kg, s tim što hidrolizata ima malo (${ponuda(hy.count)}). Rasponi ne uključuju 10% najjeftinijih i 10% najskupljih ponuda. Za realnu procenu uvek gledaj cenu po gramu proteina, ne ukupnu cenu pakovanja.`
            : "Cene zavise od tipa proteina, brenda i veličine pakovanja. Za realnu procenu uvek gledaj cenu po gramu proteina, ne ukupnu cenu pakovanja.",
        },
        {
          q: "Koliko košta gram proteina u proseku u Srbiji?",
          a: c && i && hy
            ? `Medijana za whey koncentrat je ${dec(c.gpMedian)} RSD po gramu proteina (uglavnom ${dec(c.gpLow)}–${dec(c.gpHigh)}), za izolat ${dec(i.gpMedian)} RSD (${dec(i.gpLow)}–${dec(i.gpHigh)}), a za hidrolizat ${dec(hy.gpMedian)} RSD. Ovo važi za sva pakovanja zajedno; velika pakovanja su jeftinija po gramu.${sizeSentence} Gledaj cenu po gramu proteina, ne ukupnu cenu pakovanja — tako jedino možeš stvarno porediti.`
            : "Gledaj cenu po gramu proteina, ne ukupnu cenu pakovanja — tako jedino možeš stvarno porediti različite proizvode.",
        },
        {
          q: "Da li se cene razlikuju između prodavnica?",
          a: `Da, ali manje nego što se očekuje. Svaka prodavnica ima različite marže, troškove uvoza i promotivne politike. ${x ? `Za isto pakovanje razlika između najskuplje i najjeftinije prodavnice je medijana ${pct(x.median)}% (na ${x.groups} proizvoda koje imamo u bar dve prodavnice), u ${pct(x.shareOver10)}% slučajeva prelazi 10%, a najveća je ${pct(x.max)}%. ` : ""}Zato ima smisla proveriti više mesta pre kupovine — što Proteinoteka radi automatski.`,
        },
        {
          q: "Da li je izolat uvek skuplji od koncentrata?",
          a: c && i && s.isolateBelowConcentrateShare != null
            ? `U pravilu jeste — dodatna filtracija koja daje višu čistoću proteina i manje laktoze košta više: medijana izolata je ${rsd(i.kgMedian)} RSD/kg, a koncentrata ${rsd(c.kgMedian)} RSD/kg. Ali nije uvek tako: ${pct(s.isolateBelowConcentrateShare)}% izolata košta manje po kilogramu od medijane koncentrata, naročito na akcijama. Lista na ovoj stranici prikazuje koncentrat, izolat i hidrolizat zajedno, pa možeš direktno porediti.`
            : "U pravilu jeste — dodatna filtracija koja daje višu čistoću proteina i manje laktoze košta više. Ali razlika nije uvek drastična, naročito na akcijama. Lista na ovoj stranici prikazuje koncentrat, izolat i hidrolizat zajedno, pa možeš direktno porediti.",
        },
        {
          q: "Na šta treba obratiti pažnju osim na cenu?",
          a: `Veličina pakovanja direktno utiče na cenu po gramu — veće pakovanje je obično isplativije, ako ga možeš potrošiti pre isteka roka. Pored cene, gledaj sadržaj proteina na 100g (što više, to bolje), šećere i masti. Na Proteinoteci su ti podaci prikazani uz svaki proizvod.`,
        },
        {
          q: "Da li je jeftinije kupovati protein online u Srbiji ili uvoziti iz EU?",
          a: importAnswer,
        },
        {
          q: "Kada padaju cene proteina — postoje li sezonske akcije?",
          a: "Najveća sniženja tradicionalno stižu oko Black Fridaya u novembru, a pojedine prodavnice povremeno prave akcije na određene brendove tokom cele godine. Aktuelna prava sniženja pratimo na strani „whey protein akcije\", gde poredimo trenutnu cenu sa prosekom poslednjih 90 dana. Možeš i da aktiviraš obaveštenje o ceni za proizvod koji te zanima — dobiješ email čim cena padne.",
        },
        {
          q: "Koji whey protein daje najviše proteina za novac?",
          a: `${top ? `Najniža cena po gramu proteina među pakovanjima od 900g i više je trenutno ${top.product.name} — ${dec(top.pricePerGProtein, 2)} RSD po gramu. ` : ""}Generalno, cena po gramu pada sa veličinom pakovanja, pa najbolju vrednost obično nude velika pakovanja. Na Proteinoteci svaki proizvod ima Value Score koji kombinuje cenu po gramu proteina, čistoću proteina, apsorpciju, sastojke i reputaciju brenda — sortiraj po njemu za brz odgovor.`,
        },
      ]}
    />
  );
}
