import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import GuideToc, { type TocSection } from "@/components/GuideToc";
import NewsletterInlineForm from "@/components/NewsletterInlineForm";
import { HBars, Columns } from "@/components/report/HBars";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { fetchMarketCatalog } from "@/lib/whey-price-stats";
import { widestSamePackSpread, srPlural } from "@/lib/brand-line-stats";
import { isFresh } from "@/lib/store-price-index";
import { rsPageMetadata } from "@/lib/seo-meta";
import { safeJsonLd } from "@/lib/jsonLd";
import { CATEGORY_HREF, CATEGORY_LABELS, categoriesToday, daysBetween, longDate, pct } from "@/lib/price-report";
import { REPORT_2026_09 as R } from "@/lib/price-reports/2026-09";

// Edition: September 2026. Every number about the 12-week window comes from the generated
// edition file (see ops/price-report); the "today" section is computed from the live catalog.
export const revalidate = 21600;

const PATH = "/izvestaj-o-cenama-proteina";

// ── Numbers used across the copy ──────────────────────────────────────────────

const days = daysBetween(R.baseline, R.end);
const o = R.overall;
const sameShare = Math.round((o.same / o.n) * 100);
const upShare = Math.round((o.up / o.n) * 100);
const fall = R.falls[0];
const mainCategories = R.categories.filter((c) => c.key !== "other");
const otherCategory = R.categories.find((c) => c.key === "other")!;
const byCategory = Object.fromEntries(R.categories.map((c) => [c.key, c]));
const maxMainMean = Math.max(...mainCategories.map((c) => c.mean));

// Brands with a meaningful sample (>= 5 offers).
const brands = R.brands.filter((b) => b.n >= 5);
const movers = brands.filter((b) => b.up > 0);
const still = brands.filter((b) => b.up === 0 && b.mean === 0);
const stillOffers = still.reduce((s, b) => s + b.n, 0);
const brandByName = Object.fromEntries(R.brands.map((b) => [b.brand, b]));
const BRAND_PAGES: Record<string, string> = {
  Maximalium: "/maximalium-proteini",
  Nutriversum: "/nutriversum-proteini",
  "Optimum Nutrition": "/optimum-nutrition-proteini",
  "BioTech USA": "/biotech-usa-proteini",
  "Scitec Nutrition": "/scitec-nutrition-proteini",
  "Tesla Nutrition": "/tesla-nutrition-proteini",
  "Ultimate Nutrition": "/ultimate-nutrition-proteini",
  Vitalikum: "/vitalikum-proteini",
  "Amix Nutrition": "/amix-proteini",
};
const biggest = R.biggestRises[0];
// "Whey pro protein 1kg - Nutriversum" -> "Nutriversum Whey pro protein 1kg"
const biggestName = `${biggest.brand} ${biggest.name.replace(new RegExp(`\\s*[-–]\\s*${biggest.brand}$`, "i"), "")}`;
const peakDay = R.biggestDays[0]; // [date, count]
const peakDetail = (R.dayDetail as Record<string, { stores: number; brands: Record<string, number> }>)[peakDay[0]];
const bulkDay = R.biggestDays[1];
const monthLabels: Record<string, string> = { "2026-06": "24–30. jun", "2026-07": "jul", "2026-08": "avgust", "2026-09": "1–19. sep" };
const months = Object.entries(R.risersByMonth);
const bulkShare = bulkDay[1];

const plural = {
  offerFew: { one: "ponuda", few: "ponude", many: "ponuda" },
  store: { one: "prodavnica", few: "prodavnice", many: "prodavnica" },
};
// Serbian agreement: "232 ponude", but after "od"/"iz" (genitive) 1-4 also takes the singular: "od 22 ponude".
const offersNom = (n: number) => srPlural(n, plural.offerFew);
const offersGen = (n: number) => srPlural(n, { one: "ponude", few: "ponude", many: "ponuda" });
const WORDS_F = ["nula", "jedna", "dve", "tri", "četiri", "pet", "šest", "sedam", "osam", "devet", "deset"];
const wordF = (n: number) => (n >= 0 && n <= 10 ? WORDS_F[n] : String(n));
const din = (n: number) => n.toLocaleString("sr-RS");

// ── Live "today" snapshot (optional: the page still renders if the catalog can't be fetched) ──

const loadToday = cache(async () => {
  try {
    const products = await fetchMarketCatalog();
    const now = new Date();
    const fresh = products.filter((p) => isFresh(p, now));
    const spread = widestSamePackSpread(fresh, 5, { prefer: "pct", maxPct: 1 });
    return { products, categories: categoriesToday(products), spread, stores: new Set(products.map((p) => p.storeName)).size };
  } catch {
    return null;
  }
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...rsPageMetadata({
      path: PATH,
      title: "Cene proteina u Srbiji: šta se promenilo za tri meseca",
      description: `Cene proteina u Srbiji, ${longDate(R.baseline, false)} naspram ${longDate(R.end, false)}: ${sameShare}% ponuda bez promene, ${upShare}% poskupelo u proseku ${pct(o.riserMean)}. Kategorije i brendovi.`,
      ogTitle: "Cene proteina u Srbiji: šta se promenilo za tri meseca | Proteinoteka",
      ogType: "article",
    }),
  };
}

const TOC: TocSection[] = [
  { id: "metod", title: "Kako smo merili, i zašto prosečna cena zavarava" },
  { id: "kategorije", title: "Kategorije: prosek i ono što se krije iza njega" },
  { id: "brendovi", title: "Cene se ne kreću zajedno, nego brend po brend" },
  { id: "vreme", title: "Kada se poskupljivalo" },
  { id: "pojeftinjenja", title: "Pojeftinjenja: jedno na " + o.n },
  { id: "danas", title: "Gde su cene danas" },
  { id: "zakljucak", title: "Šta iz svega toga sledi" },
  { id: "ogranicenja", title: "Šta ovaj izveštaj ne pokazuje" },
  { id: "faq", title: "Česta pitanja" },
];

export default async function Page() {
  if (CURRENT_MARKET !== "rs") notFound();
  const today = await loadToday();

  const concentrateToday = today?.categories.find((c) => c.key === "whey_concentrate");
  const isolateToday = today?.categories.find((c) => c.key === "whey_isolate");
  const isolatePremium = concentrateToday && isolateToday ? Math.round((isolateToday.medianGp / concentrateToday.medianGp - 1) * 100) : null;
  const gp = (v: number) => v.toFixed(1).replace(".", ",");

  const faqs: { q: string; a: string }[] = [
    {
      q: "Da li su proteini poskupeli u Srbiji u 2026?",
      a: `Ne u celini. U uzorku od ${o.n} ${offersGen(o.n)}, praćenih ${days} dana, cena se nije promenila kod ${o.same}, porasla je kod ${o.up} (u proseku ${pct(o.riserMean)}), a pala kod ${o.down}. Prosek cele korpe je ${pct(o.mean, { sign: true })}, medijana nula. Poskupljenja su bila skoncentrisana kod nekoliko brendova, dok većina brendova nije pomerila nijednu cenu.`,
    },
    {
      q: "Koji je protein u proteklom periodu poskupeo najviše?",
      a: `U našem uzorku najveći pojedinačni skok imao je ${biggestName}: sa ${din(biggest.from)} na ${din(biggest.to)} dinara, odnosno ${pct(biggest.pct, { sign: true })}. Među brendovima najveći udeo poskupljenja ima ${movers[0].brand} (${movers[0].up} od ${movers[0].n} ${offersGen(movers[0].n)}).`,
    },
    {
      q: "Koji brendovi nisu menjali cene?",
      a: `U uzorku ima ${still.length} brendova sa najmanje pet ponuda koji nisu pomerili nijednu cenu: ${still.map((b) => `${b.brand} (${b.n})`).join(", ")}. To je ${stillOffers} od ${o.n} ${offersGen(o.n)}.`,
    },
    ...(concentrateToday && isolateToday
      ? [
          {
            q: "Koliko košta gram proteina u Srbiji danas?",
            a: `Medijana za whey koncentrat je ${gp(concentrateToday.medianGp)} RSD po gramu proteina, a za whey izolat ${gp(isolateToday.medianGp)} RSD${isolatePremium != null ? `, što je ${isolatePremium}% više` : ""}. Brojke se računaju iznova iz aktuelnih cena, na celom katalogu.`,
          },
        ]
      : []),
    {
      q: "Kako se računa promena cene u izveštaju?",
      a: `Poredimo istu ponudu u istoj prodavnici: cenu na dan ${longDate(R.baseline)} i cenu na dan ${longDate(R.end)}. Ne poredimo proseke cena, jer se katalog u međuvremenu proširio i prosek bi se pomerio i bez ijedne promene cene. Ponude sa nepouzdanom istorijom (zastarele cene ili cene koje skaču napred-nazad) izostavljene su.`,
    },
    {
      q: "Koliko često izlazi izveštaj o cenama proteina?",
      a: "Jednom mesečno, a sledeće izdanje izlazi u oktobru 2026. Ista metoda, novi prozor: videćeš da li je slika iz ovog izdanja ostala ista.",
    },
  ];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Cene proteina u Srbiji: šta se promenilo za tri meseca",
    description: `Analiza kretanja cena proteina u Srbiji od ${longDate(R.baseline)} do ${longDate(R.end)}: po kategorijama, brendovima i vremenu.`,
    datePublished: R.end,
    inLanguage: "sr-RS",
    image: "https://proteinoteka.rs/opengraph-image",
    mainEntityOfPage: `https://proteinoteka.rs${PATH}`,
    author: { "@type": "Organization", name: "Proteinoteka", url: "https://proteinoteka.rs" },
    publisher: { "@type": "Organization", name: "Proteinoteka", url: "https://proteinoteka.rs" },
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Početna", item: "https://proteinoteka.rs" },
      { "@type": "ListItem", position: 2, name: "Izveštaj o cenama proteina", item: `https://proteinoteka.rs${PATH}` },
    ],
  };

  const catRows = mainCategories.map((c) => ({
    label: CATEGORY_LABELS[c.key],
    href: CATEGORY_HREF[c.key],
    value: c.mean,
    valueLabel: pct(c.mean, { sign: true }),
    note: `${c.n} ${offersNom(c.n)}`,
    title: `${CATEGORY_LABELS[c.key]}: prosečna promena ${pct(c.mean, { sign: true })}, ${c.n} ${offersNom(c.n)}`,
  }));
  const shareRows = mainCategories.map((c) => ({
    label: CATEGORY_LABELS[c.key],
    href: CATEGORY_HREF[c.key],
    value: (c.up / c.n) * 100,
    valueLabel: `${Math.round((c.up / c.n) * 100)}%`,
    note: `${c.up} od ${c.n}`,
    title: `${CATEGORY_LABELS[c.key]}: poskupelo ${c.up} od ${c.n} ${offersGen(c.n)}`,
  }));
  const brandRows = movers.map((b) => ({
    label: b.brand,
    href: BRAND_PAGES[b.brand],
    value: (b.up / b.n) * 100,
    valueLabel: `${Math.round((b.up / b.n) * 100)}%`,
    note: `${b.up} od ${b.n}`,
    title: `${b.brand}: poskupelo ${b.up} od ${b.n} ${offersGen(b.n)}, prosečna promena ${pct(b.mean, { sign: true })}`,
  }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-10">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <span className="text-slate-600">Izveštaj o cenama proteina</span>
          </nav>

          <header className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#b45f00] mb-3">Izveštaj o cenama · izdanje septembar 2026</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Cene proteina u Srbiji: šta se promenilo za tri meseca
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-4">
              Iste ponude, {longDate(R.baseline)} naspram {longDate(R.end)}. Cena se nije pomerila ni za dinar kod {o.same} od {o.n} {offersGen(o.n)}, a {o.up} je poskupelo u proseku {pct(o.riserMean)}.
            </p>
            <div className="flex items-center gap-3 text-sm text-slate-400 flex-wrap">
              <span>8 min čitanja</span>
              <span>·</span>
              <span>Podaci: {longDate(R.baseline, false)} – {longDate(R.end)}</span>
            </div>
          </header>

          <div className="space-y-4 text-[17px] text-slate-700 leading-[1.75] mb-8">
            <p>
              Svako ko redovno kupuje protein ima svoju teoriju o cenama. Jedni tvrde da je od leta sve poskupelo, drugi da su akcije češće nego ikad. Mi smo umesto teorija otvorili istoriju cena koju beležimo i postavili najjednostavnije moguće pitanje: koliko je ista tegla u istoj prodavnici danas skuplja ili jeftinija nego što je bila {longDate(R.baseline, false)}?
            </p>
            <p>
              Za {o.same} od {o.n} {offersGen(o.n)} odgovor glasi: <strong className="text-slate-900">tačno isto</strong>. Priča o ostalima je zanimljivija, i ne ide baš u pravcu u kom bi većina pretpostavila.
            </p>
          </div>

          {/* Headline figures */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
            {[
              { v: `${sameShare}%`, l: `ponuda bez promene cene (${o.same} od ${o.n})` },
              { v: `${upShare}%`, l: `poskupelo, u proseku ${pct(o.riserMean)}` },
              { v: `${o.down}`, l: `pojeftinilo, za ${pct(Math.abs(o.fallerMean))}` },
              { v: pct(o.mean, { sign: true }), l: "prosečna promena cele korpe (medijana: 0%)" },
            ].map((t) => (
              <div key={t.l} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="text-3xl font-extrabold text-slate-900 leading-none mb-2">{t.v}</div>
                <div className="text-xs text-slate-500 leading-snug">{t.l}</div>
              </div>
            ))}
          </div>

          <GuideToc sections={TOC} />

          {/* ── Metod ─────────────────────────────────────────────── */}
          <section className="mb-12">
            <h2 id="metod" className="text-2xl font-bold text-slate-900 mb-4">Kako smo merili, i zašto prosečna cena zavarava</h2>
            <div className="space-y-4 text-[17px] text-slate-700 leading-[1.75]">
              <p>
                Najlakši način da se izmeri koliko su proteini poskupeli jeste da se prosečna cena danas uporedi sa prosečnom cenom pre tri meseca. To je ujedno i najlošiji način. Od {longDate(R.baseline, false)} naš katalog obuhvata još šest prodavnica i desetine novih brendova, pa bi se prosek pomerio i da nijedna tegla nije promenila cenu.
              </p>
              <p>
                Zato smo radili obrnuto. Uzeli smo ponude koje su sigurno postojale pre {longDate(R.baseline, false)} (ima ih {R.panelTotal}) i za svaku pogledali cenu tada i cenu danas: ista tegla, ista prodavnica, dva datuma. Iz obračuna smo izostavili ponude čiji podaci nisu pouzdani: {R.dropped.stale} kojima cena poslednjih dana nije osvežena, {R.dropped.unstable} čija se cena vraćala napred-nazad, i ponude jedne prodavnice čije se kratke akcije završavaju između dva očitavanja, pa se redovna cena ne može pouzdano razdvojiti od akcijske. Ostalo je <strong className="text-slate-900">{o.n} {offersNom(o.n)} u {R.panelStoreCount} {srPlural(R.panelStoreCount, plural.store)}</strong>, a razlike koje ćeš videti niže su isključivo promene cena, ne promene ponude.
              </p>
            </div>
          </section>

          {/* ── Kategorije ────────────────────────────────────────── */}
          <section className="mb-12">
            <h2 id="kategorije" className="text-2xl font-bold text-slate-900 mb-4">Kategorije: prosek i ono što se krije iza njega</h2>
            <p className="text-[17px] text-slate-700 leading-[1.75] mb-6">
              Prosečna promena cene po kategorijama izgleda skromno: od nule do oko {pct(maxMainMean, { digits: 0 })}. Ali dva grafikona ispod, gledana zajedno, pokazuju da prosek nije ono što izgleda.
            </p>

            <div className="grid gap-4 mb-4">
              <figure className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <figcaption className="text-sm font-bold text-slate-900 mb-1">Prosečna promena cene</figcaption>
                <p className="text-xs text-slate-500 mb-4">svih ponuda u kategoriji, uključujući one bez promene</p>
                <HBars ariaLabel="Prosečna promena cene po kategorijama, u procentima" rows={catRows} max={Math.max(...mainCategories.map((c) => c.mean), 1)} />
              </figure>
              <figure className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <figcaption className="text-sm font-bold text-slate-900 mb-1">Udeo ponuda koje su poskupele</figcaption>
                <p className="text-xs text-slate-500 mb-4">koliko je ponuda uopšte promenilo cenu naviše</p>
                <HBars ariaLabel="Udeo ponuda koje su poskupele po kategorijama, u procentima" rows={shareRows} max={100} />
              </figure>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Promena cena po kategorijama, {longDate(R.baseline)} – {longDate(R.end)}</caption>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-3">Kategorija</th>
                      <th className="px-3 py-3 text-right">Ponuda</th>
                      <th className="px-3 py-3 text-right">Poskupelo</th>
                      <th className="px-3 py-3 text-right whitespace-nowrap">Prosečna promena</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap hidden sm:table-cell">Prosek poskupelih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...mainCategories, otherCategory].map((c) => (
                      <tr key={c.key}>
                        <td className="px-4 py-2.5 font-semibold text-slate-900">{CATEGORY_LABELS[c.key]}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{c.n}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{c.up}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{pct(c.mean, { sign: true })}</td>
                        <td className="px-4 py-2.5 text-right text-slate-600 hidden sm:table-cell">{c.up > 0 ? pct(c.riserMean, { sign: true }) : "—"}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold text-slate-900">
                      <td className="px-4 py-2.5">Ukupno</td>
                      <td className="px-3 py-2.5 text-right">{o.n}</td>
                      <td className="px-3 py-2.5 text-right">{o.up}</td>
                      <td className="px-3 py-2.5 text-right">{pct(o.mean, { sign: true })}</td>
                      <td className="px-4 py-2.5 text-right hidden sm:table-cell">{pct(o.riserMean, { sign: true })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4 text-[17px] text-slate-700 leading-[1.75]">
              <p>
                Najvažniji podatak u toj tabeli nije prosek nego ono što u njoj ne piše: <strong className="text-slate-900">medijana je u svakoj kategoriji nula</strong>. Tipična tegla nije promenila cenu. Prosek nastaje zato što retke ponude poskupe mnogo.
              </p>
              <p>
                Whey koncentrat je najveća kategorija u uzorku ({byCategory.whey_concentrate.n} {offersNom(byCategory.whey_concentrate.n)}). Prosek od {pct(byCategory.whey_concentrate.mean, { sign: true })} dolazi od {byCategory.whey_concentrate.up} {offersGen(byCategory.whey_concentrate.up)} koje su poskupele u proseku {pct(byCategory.whey_concentrate.riserMean)}, dok je jedna pojeftinila za skoro trećinu. Izolat na papiru izgleda još skuplje ({pct(byCategory.whey_isolate.mean, { sign: true })}), a poskupelo je samo {byCategory.whey_isolate.up} od {byCategory.whey_isolate.n} {offersGen(byCategory.whey_isolate.n)}. Ali one koje jesu, poskupele su u proseku {pct(byCategory.whey_isolate.riserMean)}, što je najstrmiji skok među kategorijama.
              </p>
              <p>
                Biljni proteini i mešavine su gotovo mirni ({pct(byCategory.vegan.mean, { sign: true })} i {pct(byCategory.blend.mean, { sign: true })}), a poskupljenja u mešavinama su sitna, u proseku {pct(byCategory.blend.riserMean, { digits: 0 })}. Kazein je najstabilniji: nijedna od {byCategory.casein.n} {offersGen(byCategory.casein.n)} nije promenila cenu. Hidrolizat, goveđi protein i protein iz jaja sabrali smo u „ostalo“, jer svaki od njih pojedinačno ima premalo ponuda za bilo kakav zaključak.
              </p>
            </div>
          </section>

          {/* ── Brendovi ──────────────────────────────────────────── */}
          <section className="mb-12">
            <h2 id="brendovi" className="text-2xl font-bold text-slate-900 mb-4">Cene se ne kreću zajedno, nego brend po brend</h2>
            <p className="text-[17px] text-slate-700 leading-[1.75] mb-6">
              Kad se ponude razvrstaju po brendovima, slika se raspada na dva dela. S jedne strane su brendovi čije su cene u ova tri meseca uglavnom krenule naviše, s druge oni koji nisu pomerili nijednu.
            </p>

            <figure className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
              <figcaption className="text-sm font-bold text-slate-900 mb-1">Brendovi kod kojih je bar jedna ponuda poskupela</figcaption>
              <p className="text-xs text-slate-500 mb-4">udeo ponuda koje su poskupele; prikazani su brendovi sa najmanje pet ponuda u uzorku</p>
              <HBars ariaLabel="Udeo poskupelih ponuda po brendovima, u procentima" rows={brandRows} max={100} />
            </figure>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Promena cena po brendovima</caption>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-3">Brend</th>
                      <th className="px-3 py-3 text-right">Ponuda</th>
                      <th className="px-3 py-3 text-right">Poskupelo</th>
                      <th className="px-3 py-3 text-right whitespace-nowrap">Prosečna promena</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Najveći skok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movers.map((b) => (
                      <tr key={b.brand}>
                        <td className="px-4 py-2.5 font-semibold text-slate-900">
                          {BRAND_PAGES[b.brand] ? <Link href={BRAND_PAGES[b.brand]} className="hover:text-[#b45f00] hover:underline">{b.brand}</Link> : b.brand}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{b.n}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{b.up}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{pct(b.mean, { sign: true })}</td>
                        <td className="px-4 py-2.5 text-right text-slate-600">{pct(b.max, { sign: true })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4 text-[17px] text-slate-700 leading-[1.75]">
              <p>
                <Link href={BRAND_PAGES.Maximalium} className="font-semibold text-slate-900 hover:underline">Maximalium</Link> je najdoslednija priča: poskupelo je {brandByName.Maximalium.up} od {brandByName.Maximalium.n} {offersGen(brandByName.Maximalium.n)}, u proseku {pct(brandByName.Maximalium.mean)}, uz najveći skok od {pct(brandByName.Maximalium.max)}.{" "}
                <Link href={BRAND_PAGES.Nutriversum} className="font-semibold text-slate-900 hover:underline">Nutriversum</Link> je poskupeo u {brandByName.Nutriversum.up} od {brandByName.Nutriversum.n} {offersGen(brandByName.Nutriversum.n)}, u proseku {pct(brandByName.Nutriversum.mean)}, a jedan skok je ujedno i najveći u celom uzorku: {biggestName} sa {din(biggest.from)} na {din(biggest.to)} dinara ({pct(biggest.pct, { sign: true })}). Kod Optimum Nutrition-a poskupele su {brandByName["Optimum Nutrition"].up} od {brandByName["Optimum Nutrition"].n} {offersGen(brandByName["Optimum Nutrition"].n)}, ali je uzorak mali da bi se iz toga izvlačilo više od činjenice da su se cene pomerile.
              </p>
              <p>
                Na drugoj strani su brendovi bez ijedne promene:{" "}
                {still.map((b, i) => (
                  <span key={b.brand}>
                    {BRAND_PAGES[b.brand] ? <Link href={BRAND_PAGES[b.brand]} className="hover:underline font-medium text-slate-900">{b.brand}</Link> : b.brand} ({b.n})
                    {i < still.length - 1 ? ", " : ""}
                  </span>
                ))}
                . Zajedno je to {stillOffers} od {o.n} {offersGen(o.n)}, {Math.round((stillOffers / o.n) * 100)}% uzorka, koje danas koštaju tačno koliko i {longDate(R.baseline, false)}. BioTech USA se svodi na gotovo isto: od {brandByName["BioTech USA"].n} {offersGen(brandByName["BioTech USA"].n)} pomerila se jedna, za {pct(brandByName["BioTech USA"].max)}.
              </p>
              <p>
                Šta stoji iza toga, ne znamo: cenovnike uvoznika i prodavnica niko ne objavljuje. Ali obrazac govori dovoljno. Kad se isti brend i ista veličina pakovanja pomere za isti procenat u dve različite prodavnice, teško da je posredi odluka jedne radnje. Takvih parova ima {wordF(R.crossStore.length).replace("jedna", "jedan").replace("dve", "dva")}:{" "}
                {R.crossStore.map((c, i) => (
                  <span key={`${c.brand}-${c.grams}-${c.pct}`}>
                    {c.brand} {c.grams >= 1000 ? `${(c.grams / 1000).toLocaleString("sr-RS")} kg` : `${c.grams} g`} ({pct(c.pct, { sign: true })}, {din(c.from)} → {din(c.to)} dinara)
                    {i < R.crossStore.length - 1 ? "; " : ""}
                  </span>
                ))}
                . To liči na promenu cenovnika na nivou brenda, mada to ne možemo da potvrdimo.
              </p>
            </div>
          </section>

          {/* ── Vreme ─────────────────────────────────────────────── */}
          <section className="mb-12">
            <h2 id="vreme" className="text-2xl font-bold text-slate-900 mb-4">Kada se poskupljivalo</h2>
            <figure className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
              <figcaption className="text-sm font-bold text-slate-900 mb-1">Broj ponuda koje su poskupele, po mesecu poslednje promene</figcaption>
              <p className="text-xs text-slate-500 mb-5">računa se mesec u kome je cena poslednji put promenjena</p>
              <Columns ariaLabel="Broj poskupelih ponuda po mesecima" data={months.map(([m, v]) => ({ label: monthLabels[m] ?? m, value: v as number }))} />
              <ul className="flex gap-3 sm:gap-5 px-1 mt-2" role="list" aria-hidden>
                {months.map(([m]) => (
                  <li key={m} className="flex-1 text-center text-xs text-slate-600">{monthLabels[m] ?? m}</li>
                ))}
              </ul>
            </figure>

            <div className="space-y-4 text-[17px] text-slate-700 leading-[1.75]">
              <p>
                Nije bilo jednog talasa. Poskupljenja stižu kap po kap: {months[0][1]} u poslednjoj nedelji juna, {months[1][1]} u julu, {months[2][1]} u avgustu i {months[3][1]} u prvih devetnaest dana septembra. Izdvaja se samo jedan dan, {longDate(peakDay[0], false)}: tada je u {wordF(peakDetail.stores)} {srPlural(peakDetail.stores, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })} pomereno {wordF(peakDay[1])} ponuda: {Object.entries(peakDetail.brands).map(([b, c]) => `${wordF(c)} ${b}`).join(", ").replace(/, ([^,]*)$/, " i $1")}.
              </p>
              <p>
                Oprez oko septembra: to izgleda kao ubrzanje, ali je delom računovodstvo. Od tih {months[months.length - 1][1]} ponuda, {bulkShare} je zabeleženo istog dana, {longDate(bulkDay[0], false)}, kad su podaci jedne prodavnice osveženi posle pauze, pa pravi datum tih promena znamo samo okvirno. Kad se te ponude izuzmu, prosek cele korpe je {pct(o.meanRobust, { sign: true })} umesto {pct(o.mean, { sign: true })}, dakle skoro isti. Pouzdaniji su jul i avgust: oko {months[1][1]} poskupljenja mesečno.
              </p>
            </div>
          </section>

          {/* ── Pojeftinjenja ─────────────────────────────────────── */}
          <section className="mb-12">
            <h2 id="pojeftinjenja" className="text-2xl font-bold text-slate-900 mb-4">Pojeftinjenja: jedno na {o.n}</h2>
            <div className="space-y-4 text-[17px] text-slate-700 leading-[1.75]">
              <p>
                Pad cene je u našem uzorku redak. Zabeležili smo jedan trajan: cena proizvoda {fall.name.replace(/®/g, "")} spustila se sa {din(fall.from)} na {din(fall.to)} dinara ({pct(fall.pct)}). Ostalo što na prvi pogled liči na pad bile su, koliko smo mogli da proverimo, akcije koje su se posle nekoliko nedelja vratile na redovnu cenu.
              </p>
              <p>
                To ne znači da akcija nema. Znači da se retko zadrže dovoljno dugo da ostave trag u poređenju „tada i sada“. Cena koja padne na deset dana i vrati se ne menja ni prosek ni medijanu, ali kupcu koji je tih deset dana kupovao znači sve. Za takve prilike postoji{" "}
                <Link href="/whey-protein-akcije" className="text-[#b45f00] font-medium hover:underline">stranica sa aktuelnim akcijama</Link>, a na svakom proizvodu možeš da uključiš price alert.
              </p>
            </div>
          </section>

          {/* ── Danas (live) ──────────────────────────────────────── */}
          {today && today.categories.length > 0 && (
            <section className="mb-12">
              <h2 id="danas" className="text-2xl font-bold text-slate-900 mb-4">Gde su cene danas</h2>
              <p className="text-[17px] text-slate-700 leading-[1.75] mb-6">
                Poređenje „tada i sada“ opisuje kretanje. Ovde je slika za danas, izračunata na celom katalogu ({today.products.length} {offersNom(today.products.length)} u {today.stores} {srPlural(today.stores, plural.store)}), a obnavlja se sama.
              </p>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <caption className="sr-only">Cena po gramu proteina po kategorijama, danas</caption>
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                        <th className="px-4 py-3">Kategorija</th>
                        <th className="px-3 py-3 text-right">Ponuda</th>
                        <th className="px-3 py-3 text-right whitespace-nowrap">Medijana, RSD po g proteina</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap hidden sm:table-cell">Uobičajeni raspon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {today.categories.map((c) => (
                        <tr key={c.key}>
                          <td className="px-4 py-2.5 font-semibold text-slate-900">
                            {CATEGORY_HREF[c.key] ? <Link href={CATEGORY_HREF[c.key]} className="hover:text-[#b45f00] hover:underline">{c.label}</Link> : c.label}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-600">{c.offers}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{gp(c.medianGp)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600 hidden sm:table-cell">{gp(c.q1)} – {gp(c.q3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="space-y-4 text-[17px] text-slate-700 leading-[1.75]">
                {concentrateToday && isolateToday && isolatePremium != null && (
                  <p>
                    Gram proteina iz whey koncentrata danas košta medijanu od {gp(concentrateToday.medianGp)} dinara, a iz izolata {gp(isolateToday.medianGp)}: izolat je za {isolatePremium}% skuplji. Cena po gramu proteina je merilo koje ne zavisi od veličine tegle, zato je na njoj izgrađen i{" "}
                    <Link href="/kako-racunamo-value-score" className="text-[#b45f00] font-medium hover:underline">naš value score</Link>, uz kvalitet proteina i sastav.
                  </p>
                )}
                {today.spread && today.spread.pct * 100 > o.riserMean && (
                  <p>
                    Razlike među ponudama istog proizvoda veće su od prosečnog poskupljenja iz ovog izveštaja. {today.spread.name.replace(/\s*\/\s*\d+\s*g$/i, "")}, pakovanje od {today.spread.weightG >= 1000 ? `${(today.spread.weightG / 1000).toLocaleString("sr-RS")} kg` : `${today.spread.weightG} g`}, prodaje se u {today.spread.stores} {srPlural(today.spread.stores, plural.store)} po cenama koje se između najniže i najviše razlikuju za {Math.round(today.spread.pct * 100)}%, dok je prosečno poskupljenje onih ponuda koje su poskupele bilo {pct(o.riserMean, { digits: 0 })}.{" "}
                    <Link href="/gde-kupiti-protein-srbija" className="text-[#b45f00] font-medium hover:underline">Uporedi cene istog proizvoda po prodavnicama →</Link>
                  </p>
                )}
              </div>
            </section>
          )}

          {/* ── Zaključak ─────────────────────────────────────────── */}
          <section className="mb-12">
            <h2 id="zakljucak" className="text-2xl font-bold text-slate-900 mb-4">Šta iz svega toga sledi</h2>
            <div className="space-y-4 text-[17px] text-slate-700 leading-[1.75]">
              <p>
                Ne postoji jedna „cena proteina“ koja raste ili pada. Postoje stotine cena koje se u većini slučajeva ne kreću, i nekoliko desetina koje se kreću mnogo. Zato prvo pitanje nije kakvo je tržište, nego u kojoj je grupi tvoj brend: među onima koji su ove sezone pomerali cene, ili među onima koji nisu.
              </p>
              <p>
                Drugo: ako ti je brend među onima koji su poskupeli, to ne znači da je poskupeo svuda u istoj meri. Cena istog proizvoda i dalje se razlikuje od ponude do ponude, često više nego što je iznosilo samo poskupljenje. Vredi uporediti pre nego što staviš teglu u korpu, a gram proteina je pošteniji sudija od cene pakovanja.
              </p>
              <p>
                Treće, i najiskrenije: šta će se dešavati u oktobru, ne znamo. Zato ćemo isto merenje ponoviti, istom metodom, i objaviti novo izdanje. Ako ti je bitno da ne propustiš pad cene u međuvremenu, price alert na stranici proizvoda radi to umesto tebe.
              </p>
            </div>

            <div className="mt-6 bg-[#131921] rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-1">Najveći padovi cena, dvaput mesečno</h3>
              <p className="text-sm text-slate-300 mb-4">Najbolje akcije i najveće padove cena, direktno u inbox. Odjava u jednom kliku.</p>
              <NewsletterInlineForm source="landing_page" variant="dark" />
            </div>
          </section>

          {/* ── Ograničenja ───────────────────────────────────────── */}
          <section className="mb-12">
            <h2 id="ogranicenja" className="text-2xl font-bold text-slate-900 mb-4">Šta ovaj izveštaj ne pokazuje</h2>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <ul className="space-y-2.5 text-[15px] text-slate-600 leading-relaxed list-disc pl-5">
                <li>Uzorak čini {o.n} {offersNom(o.n)} u {R.panelStoreCount} {srPlural(R.panelStoreCount, plural.store)} koje pratimo od pre {longDate(R.baseline, false)}. Novije prodavnice još nemaju istoriju dovoljnu za ovakvo poređenje.</li>
                <li>Hrvatsko tržište nije uključeno: počelo je da se prati tek krajem juna, pa za njega nema tri meseca istorije.</li>
                <li>Računaju se ponude, ne proizvodi: isti proizvod u dve prodavnice ulazi dva puta.</li>
                <li>U uzorku su samo ponude koje postoje i danas. Proizvodi koji su u međuvremenu izašli iz prodaje ne mogu se porediti.</li>
                <li>Cena na dan {longDate(R.baseline, false)} rekonstruiše se iz istorije promena cena, koja beleži samo promene, ne svako očitavanje.</li>
                <li>Brendovi sa manje od pet ponuda nisu prikazani, jer bi jedna promena cene izgledala kao trend.</li>
                <li>Izveštaj beleži šta se desilo, ne zašto. Razloge cenovnika ne znamo.</li>
              </ul>
            </div>
          </section>

          {/* ── FAQ ───────────────────────────────────────────────── */}
          <section className="mb-12">
            <h2 id="faq" className="text-2xl font-bold text-slate-900 mb-4">Česta pitanja</h2>
            <div className="space-y-3">
              {faqs.map((f) => (
                <div key={f.q} className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="font-bold text-slate-900 text-base mb-2">{f.q}</h3>
                  <p className="text-[15px] text-slate-600 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-slate-100 rounded-xl p-5 border border-slate-200 mb-8">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Još na temu cena:</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "📊 Whey protein cena", href: "/whey-protein-cena" },
                { label: "📋 Svi proteini u Srbiji", href: "/proteini-srbija" },
                { label: "🏪 Gde kupiti protein", href: "/gde-kupiti-protein-srbija" },
                { label: "💸 Mesečni trošak proteina", href: "/vodici/koliko-novca-mesecno-za-proteine" },
                { label: "🔥 Crni petak", href: "/crni-petak" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-[#FF9900] hover:text-[#b45f00] transition-all">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Proteinoteka je nezavisan servis za poređenje cena i nije povezana ni sa jednim brendom ni prodavnicom pomenutom u izveštaju. Cene se prikupljaju automatski i mogu se razlikovati od cena na sajtovima prodavaca. Izveštaj opisuje prošli period i nije preporuka za kupovinu.
          </p>
        </main>
      </div>
    </>
  );
}
