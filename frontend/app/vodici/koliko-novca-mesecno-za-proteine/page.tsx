import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import VodiciNav from "@/components/VodiciNav";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";
import { fetchTopProducts } from "@/lib/seo-data";
import { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Koliko novca mesečno treba za proteine u Srbiji 2026: 3.900–6.200 din za 70 kg | Proteinoteka" },
  description:
    "Konkretna računica za 2026: mesec dana whey concentrate za 70 kg = 3.900–4.500 din, isolate = 5.700–6.200 din, biljni = 4.200–5.500 din. Cene iz 8 prodavnica, ažurirane sedmično.",
  alternates: { canonical: "https://proteinoteka.rs/vodici/koliko-novca-mesecno-za-proteine" },
  openGraph: {
    title: "Koliko novca mesečno treba za proteine u Srbiji 2026: 3.900–6.200 din za 70 kg | Proteinoteka",
    description:
      "Konkretna računica za 2026: mesec dana whey concentrate za 70 kg = 3.900–4.500 din, isolate = 5.700–6.200 din, biljni = 4.200–5.500 din. Cene iz 8 prodavnica, ažurirane sedmično.",
    url: "https://proteinoteka.rs/vodici/koliko-novca-mesecno-za-proteine",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "article",
    images: [{ url: "https://proteinoteka.rs/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://proteinoteka.rs/opengraph-image"],
  },
};

// Dinara po gramu proteina
function ppg(p: Product): number | null {
  if (!p.numericPrice || !p.primaryWeightGrams || !p.proteinPer100g) return null;
  const totalProt = p.primaryWeightGrams * (p.proteinPer100g / 100);
  if (totalProt <= 0) return null;
  return p.numericPrice / totalProt;
}

// Q1 (jeftino) i median (srednje) din/g proteina iz seta proizvoda
function costRange(products: Product[], monthlyProteinG: number): { jeftino: number; srednje: number } | null {
  const vals = products
    .map(ppg)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  if (vals.length === 0) return null;
  const q1 = vals[Math.floor(vals.length * 0.25)] ?? vals[0];
  const med = vals[Math.floor(vals.length * 0.5)] ?? vals[0];
  return {
    jeftino: Math.round(q1 * monthlyProteinG / 100) * 100,
    srednje: Math.round(med * monthlyProteinG / 100) * 100,
  };
}

const WEIGHT_PROFILES = [
  { kg: 60, label: "60 kg", monthlyG: 750 },
  { kg: 70, label: "70 kg", monthlyG: 900 },
  { kg: 80, label: "80 kg", monthlyG: 1050 },
  { kg: 90, label: "90 kg", monthlyG: 1200 },
];

const faqItems = [
  {
    q: "Koliko proteina treba dnevno iz šejka?",
    a: "Zavisi od telesne mase i koliko unosiš iz hrane. Tipično: 25–40g proteina po šejku, jednom dnevno. Za 70 kg osobu koja trenira 4× nedeljno i normalno jede, jedan šejk od 30g dnevno je sasvim dovoljan.",
  },
  {
    q: "Da li se isplati kupovati veće pakovanje?",
    a: "Da — skoro uvek. 5 kg pakovanje obično košta 15–25% manje po gramu proteina nego 1 kg pakovanje istog proizvoda. Ako koristiš protein redovno, kupovina 2–3 puta godišnje je optimalna.",
  },
  {
    q: "Zašto biljni protein košta više od whey concentrate?",
    a: "Izolacija proteina iz biljnih izvora (grašak, pirinač) tehnološki je složenija nego iz surutke. Uz to, biološka vrednost je nešto niža, pa je potrebno više sirovine za isti efekat. Razlika u ceni je 10–30% u korist whey concentrate.",
  },
  {
    q: "Koji tip proteina je najisplativiji u Srbiji?",
    a: "Whey concentrate (WPC) redovno nudi najviše proteina po dinaru — i to potvrđuju naši live podaci iz 8 prodavnica. Isolate košta 20–40% više, a za većinu vežbača ta razlika u čistoći nije opravdana. Detaljno poređenje naći ćeš u vodiču Isolate vs Concentrate.",
  },
  {
    q: "Menjaju li se cene proteina često?",
    a: "Da — cene variraju sa kursem evra i sezonskim akcijama. Na Proteinoteci ažuriramo cene iz svih prodavnica svakog ponedeljka automatski, tako da uvek vidiš aktuelno stanje.",
  },
];

const BASE = "https://proteinoteka.rs";
const SLUG = "/vodici/koliko-novca-mesecno-za-proteine";

const tocSections: TocSection[] = [
  { id: "mesecni-troskovi", title: "Mesečni trošak po kilaži i tipu proteina" },
  { id: "kako-racunali", title: "Kako smo računali" },
  { id: "formula-objasnjenje", title: "Primer računice za 70 kg osobu", level: 3 },
  { id: "najisplativiji", title: "Trenutno najisplativiji po tipu" },
  { id: "kako-smanjiti", title: "Kako smanjiti mesečni trošak" },
  { id: "godisnji-troskovi", title: "Godišnji trošak: WPC vs WPI", level: 3 },
  { id: "faq", title: "Česta pitanja" },
];

export default async function Page() {
  const [concentrates, isolates, vegans] = await Promise.all([
    fetchTopProducts({ category: "whey_concentrate", sortBy: "valueScore", limit: 20 }),
    fetchTopProducts({ category: "whey_isolate",     sortBy: "valueScore", limit: 20 }),
    fetchTopProducts({ category: "vegan",            sortBy: "valueScore", limit: 20 }),
  ]);

  // Per-weight cost ranges for each category
  const tableRows = [
    { label: "Whey Concentrate (WPC)", products: concentrates, color: "text-green-700", bg: "bg-green-50", border: "border-green-200", badge: "Najisplativije" },
    { label: "Biljni protein",          products: vegans,       color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", badge: "Za vegane" },
    { label: "Whey Isolate (WPI)",      products: isolates,     color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",   badge: "Čistiji" },
  ];

  // Best value product per category (cheapest din/g protein)
  function bestProduct(products: Product[]) {
    return [...products]
      .filter(p => ppg(p) !== null)
      .sort((a, b) => (ppg(a) ?? Infinity) - (ppg(b) ?? Infinity))[0] ?? null;
  }

  const bestWpc = bestProduct(concentrates);
  const bestIso = bestProduct(isolates);
  const bestVeg = bestProduct(vegans);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Koliko novca mesečno treba za proteine u Srbiji?",
      datePublished: "2026-06-06",
      dateModified: new Date().toISOString().split("T")[0],
      author: { "@type": "Organization", name: "Proteinoteka", url: BASE },
      publisher: { "@type": "Organization", name: "Proteinoteka", url: BASE },
      url: `${BASE}${SLUG}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Početna", item: BASE },
        { "@type": "ListItem", position: 2, name: "Vodiči", item: `${BASE}/vodici` },
        { "@type": "ListItem", position: 3, name: "Koliko košta mesec dana proteina", item: `${BASE}${SLUG}` },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-10">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8 flex-wrap">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <Link href="/vodici" className="hover:text-[#FF9900] transition-colors">Vodiči</Link>
            <span>/</span>
            <span className="text-slate-600">Koliko košta mesec dana proteina</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Koliko novca mesečno treba za proteine u Srbiji? (2026)
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>5 min čitanja</span>
              <span>·</span>
              <span>Cene ažurirane: {new Date().toLocaleDateString("sr-RS", { month: "long", year: "numeric" })}</span>
            </div>
          </div>

          {/* Quick answer */}
          <div className="mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Kratki odgovor za 70 kg, 4 treninga nedeljno:</strong>{" "}
              whey concentrate košta <strong className="text-slate-900">3.900–4.500 din/mes</strong>,
              biljni protein <strong className="text-slate-900">4.200–5.500 din/mes</strong>,
              whey isolate <strong className="text-slate-900">5.700–6.200 din/mes</strong>.
              Računato iz aktuelnih cena u 8 srpskih prodavnica.
            </p>
          </div>

          <GuideToc sections={tocSections} />

          {/* Main table */}
          <section className="mb-10">
            <h2 id="mesecni-troskovi" className="text-xl font-bold text-slate-900 mb-2">Mesečni trošak po kilaži i tipu proteina</h2>
            <p className="text-[14px] text-slate-500 mb-5">
              Raspon = jeftiniji do prosečan proizvod trenutno u prodaji. Računato: 1 šejk dnevno, 1.8 g proteina/kg/dan ukupno.
            </p>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide min-w-[160px]">Tip proteina</th>
                      {WEIGHT_PROFILES.map(w => (
                        <th key={w.kg} className={`px-3 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap${w.kg === 60 || w.kg === 90 ? " hidden sm:table-cell" : ""}`}>
                          {w.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableRows.map(({ label, products, color, bg, border, badge }) => (
                      <tr key={label} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900 text-[14px] leading-snug">{label}</div>
                          <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${bg} ${color} ${border}`}>
                            {badge}
                          </span>
                        </td>
                        {WEIGHT_PROFILES.map(w => {
                          const range = costRange(products, w.monthlyG);
                          return (
                            <td key={w.kg} className={`px-3 py-4 text-right whitespace-nowrap${w.kg === 60 || w.kg === 90 ? " hidden sm:table-cell" : ""}`}>
                              {range ? (
                                <span className="font-semibold text-slate-800 text-[14px]">
                                  {range.jeftino.toLocaleString("sr-RS")}–{range.srednje.toLocaleString("sr-RS")}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                              <div className="text-[11px] text-slate-400">din</div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[12px] text-slate-400">
              Podaci iz baze Proteinoteke — {concentrates.length + isolates.length + vegans.length} proizvoda iz 8 prodavnica. Ažurira se automatski svake nedelje.
            </p>
          </section>

          {/* Methodology */}
          <section className="mb-10">
            <h2 id="kako-racunali" className="text-xl font-bold text-slate-900 mb-4">Kako smo računali</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>
                Formula je jednostavna: <strong className="text-slate-900">cena pakovanja ÷ ukupno grama proteina u pakovanju = dinara po gramu proteina</strong>. Zatim množimo sa mesečnom dozom:
              </p>
              <p>
                Raspon u tabeli koristi <strong className="text-slate-900">jeftiniju četvrtinu</strong> i <strong className="text-slate-900">sredinu tržišta</strong> — ne krajnje outliere. Skupi premium brendovi nisu uključeni u donji raspon.
              </p>
            </div>

            <h3 id="formula-objasnjenje" className="text-lg font-bold text-slate-900 mb-3">Primer računice za 70 kg osobu</h3>
            <div className="bg-slate-100 rounded-xl p-4 font-mono text-[13px] text-slate-700 space-y-1 mb-4">
              <div>70 kg × 1,8 g/kg = 126 g proteina dnevno (ukupno)</div>
              <div>Iz hrane (3 obroka): ~95 g</div>
              <div>Iz šejka: ~30 g/dan × 30 dana = <strong>900 g/mes</strong></div>
            </div>
            <p className="text-[14px] text-slate-600 leading-relaxed">
              Vrednost od 1.8g/kg/dan odgovara opsegu koji nauka preporučuje za aktivne vežbače (Morton et al., 2018). Povećaš li do 2.2g/kg, mesečna doza raste na oko 1.050g — što znači i ~15% viši trošak.
            </p>
          </section>

          {/* Best value per category */}
          <section className="mb-10">
            <h2 id="najisplativiji" className="text-xl font-bold text-slate-900 mb-4">Trenutno najisplativiji po tipu</h2>
            <p className="text-[14px] text-slate-500 mb-5">Sortirano po gramu proteina za dinar — live iz baze.</p>

            <div className="space-y-3">
              {[
                { product: bestWpc, label: "Whey Concentrate", href: "/kategorija/whey-concentrate?sort=valueScore,desc" },
                { product: bestVeg, label: "Biljni protein",    href: "/biljni-protein-srbija" },
                { product: bestIso, label: "Whey Isolate",      href: "/whey-isolate-srbija" },
              ].map(({ product: p, label, href }) => {
                if (!p) return null;
                const pricePG = ppg(p);
                const monthly70 = pricePG ? Math.round(pricePG * 900 / 100) * 100 : null;
                return (
                  <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
                        <Link
                          href={productUrl(p)}
                          className="block font-semibold text-slate-900 hover:text-[#FF9900] transition-colors text-[14px] leading-snug mt-0.5"
                        >
                          {p.name}
                        </Link>
                        <span className="text-xs text-slate-400">{p.storeName} · {p.price}</span>
                      </div>
                      {pricePG && (
                        <div className="text-right shrink-0">
                          <div className="text-[13px] font-bold text-slate-700">{pricePG.toFixed(2)} din/g</div>
                          {monthly70 && (
                            <div className="text-[11px] text-slate-400">~{monthly70.toLocaleString("sr-RS")} din/mes za 70 kg</div>
                          )}
                        </div>
                      )}
                    </div>
                    <Link href={href} className="text-[12px] text-[#FF9900] hover:underline font-medium">
                      Prikaži sve {label.toLowerCase()} proteine →
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Tips to reduce cost */}
          <section className="mb-10">
            <h2 id="kako-smanjiti" className="text-xl font-bold text-slate-900 mb-4">Kako smanjiti mesečni trošak</h2>
            <div className="space-y-3">
              {[
                {
                  tip: "Kupi veće pakovanje",
                  desc: "5 kg pakovanje tipično košta 15–25% manje po gramu proteina od 1 kg pakovanja istog proizvoda. Ako znaš da koristiš protein redovno, veće pakovanje je uvek isplativije.",
                },
                {
                  tip: "Prati Value Score, ne brend",
                  desc: "Premium brend ne garantuje više proteina. Neki no-name ili house-brand proteini imaju isti ili bolji profil aminokiselina za upola manje novca. Gledaj % proteina na 100g i cenu po gramu.",
                },
                {
                  tip: "Whey concentrate umesto isolate",
                  desc: "Za većinu vežbača bez intolerancije na laktozu, WPC daje iste rezultate kao WPI — za 20–40% manje novca. Jedina opravdana razlika je ako imaš digestivne probleme sa laktozom.",
                },
                {
                  tip: "Iskoristi sezonske akcije",
                  desc: "Prodavnice u Srbiji često imaju akcije u januaru i septembru. Ako kupuješ u pravilnim intervalima, možeš uštedeti 500–1.500 din po narudžbini u odnosu na redovnu cenu.",
                },
              ].map(({ tip, desc }) => (
                <div key={tip} className="flex gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <span className="text-[#FF9900] font-black text-base shrink-0 mt-0.5">→</span>
                  <div>
                    <p className="font-semibold text-slate-900 text-[15px]">{tip}</p>
                    <p className="text-[14px] text-slate-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h3 id="godisnji-troskovi" className="text-lg font-bold text-slate-900 mb-3 mt-8">Godišnji trošak: WPC vs WPI</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700 mb-4">
              <p>
                Mesečna razlika između WPC i WPI za 70 kg osobu iznosi ~1.500–2.000 din. Na godišnjem nivou, to je <strong className="text-slate-800">18.000–24.000 dinara razlike</strong> — skoro celo jedno pakovanje od 5 kg gratis.
              </p>
              <p>
                Za nekoga bez intolerancije na laktozu, prelazak na WPI je teško opravdati čisto finansijski. Razlika u proteinskom profilu postoji, ali je zanemarljiva za rekreativne vežbače.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Tip</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Mesečno (70 kg)</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Godišnje</th>
                      <th className="hidden sm:table-cell px-4 py-2.5 text-right text-xs font-semibold text-slate-500">vs WPC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-green-50">
                      <td className="px-4 py-3 font-semibold text-green-700">WPC (prosek tržišta)</td>
                      <td className="px-4 py-3 text-right text-slate-700">~4.200 din</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">~50.400 din</td>
                      <td className="hidden sm:table-cell px-4 py-3 text-right text-green-600 font-semibold">—</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-700">WPI (prosek tržišta)</td>
                      <td className="px-4 py-3 text-right text-slate-700">~5.900 din</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">~70.800 din</td>
                      <td className="hidden sm:table-cell px-4 py-3 text-right text-red-500 font-semibold">+20.400 din</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Česta pitanja</h2>
            <div className="space-y-4">
              {faqItems.map(({ q, a }, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-2">{q}</h3>
                  <p className="text-[15px] leading-relaxed text-slate-700">{a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Internal links */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni vodiči</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/vodici/whey-protein-za-pocetnike" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Protein za početnike
              </Link>
              <Link href="/vodici/whey-isolate-vs-concentrate" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Isolate vs Concentrate
              </Link>
              <Link href="/vodici/koliko-proteina-dnevno" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/kategorija/whey-concentrate?sort=valueScore,desc" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Svi WPC proteini
              </Link>
              <Link href="/whey-protein-do-3000-dinara" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Proteini do 3.000 RSD
              </Link>
              <Link href="/whey-protein-cena" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey protein cena u Srbiji
              </Link>
              <Link href="/najjeftiniji-whey-protein" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Najjeftiniji whey protein
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center mb-10">
            <p className="text-base leading-relaxed mb-4">
              Pronađi koji protein trenutno daje najviše grama proteina za dinar — iz svih 8 prodavnica.
            </p>
            <Link
              href="/?sort=valueScore,desc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Uporedi sve proteine po isplativosti →
            </Link>
          </div>

          <GuideDisclaimer />

          <VodiciNav currentSlug="koliko-novca-mesecno-za-proteine" />
        </main>
      </div>
    </>
  );
}
