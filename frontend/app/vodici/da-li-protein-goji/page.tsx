import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import VodiciNav from "@/components/VodiciNav";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";

export const metadata: Metadata = {
  title: { absolute: "Da li protein goji? Ne — ali postoji jedan uslov | Proteinoteka" },
  description:
    "Kratki odgovor: ne. Goji te kalorijski suficit — a whey protein ima viši termički efekat od ugljenih hidrata i pomaže sitosti. Evo kada šejk zapravo može da te ugoji i kada pomaže mršavljenju.",
  alternates: { canonical: "https://proteinoteka.rs/vodici/da-li-protein-goji" },
  openGraph: {
    title: "Da li protein goji? Ne — ali postoji jedan uslov | Proteinoteka",
    description:
      "Kratki odgovor: ne. Goji te kalorijski suficit — a whey protein ima viši termički efekat od ugljenih hidrata i pomaže sitosti. Evo kada šejk zapravo može da te ugoji i kada pomaže mršavljenju.",
    url: "https://proteinoteka.rs/vodici/da-li-protein-goji",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "article",
  },
};

const TOC: TocSection[] = [
  { id: "kalorijski-suficit", title: "Kalorijski suficit = gojenje, ne protein" },
  { id: "termicki-efekat", title: "Termički efekat proteina", level: 3 },
  { id: "kalorije-sejka", title: "Koliko kalorija ima šejk?", level: 3 },
  { id: "sitost-hormoni", title: "Kako protein utiče na sitost i apetit" },
  { id: "leptin-grelin", title: "Hormoni gladi: leptin, grelin i GLP-1", level: 3 },
  { id: "insulin-zabluda", title: "Insulin i protein — česta zabluda", level: 3 },
  { id: "greske", title: "Greške koje zaista vode gojenju" },
  { id: "misici-zastita", title: "Mišićna masa kao zaštita od gojenja", level: 3 },
  { id: "mrsavljenje", title: "Kada protein pomaže mršavljenju" },
  { id: "faq", title: "Česta pitanja" },
];

const faqItems = [
  {
    q: "Može li proteinski šejk da zameni obrok i da li ću smršati?",
    a: "Šejk može biti deo obroka, ali retko ga u potpunosti zamenjuje po sitosti i mikronutrijentima. Ako šejkom zameniš obrok sa manje kalorija i ostaneš u deficitu, gubiš kilograme — ali to važi za svaku hranu, ne samo za protein.",
  },
  {
    q: "Da li protein posle treninga goji ako ne treniram dovoljno?",
    a: "Ako uneseš više kalorija nego što trošiš, višak se skladišti kao mast — bez obzira na to šta si pojeo. Protein nije izuzetak od prvog zakona termodinamike. Trening bez deficita u ishrani neće sam po sebi da skine kilograme.",
  },
  {
    q: "Koliko kalorija ima tipičan proteinski šejk?",
    a: "Jedna porcija whey proteina (30g) u vodi daje uglavnom 100–130 kcal i 22–27g proteina. Sa 250ml punomasnog mleka dodaješ još 150 kcal — ukupno 250–280 kcal. To je manje od prosečnog ručka.",
  },
  {
    q: "Da li ženski proteini goje manje od muških?",
    a: "Ne postoji 'ženski' ili 'muški' protein u biohemijskom smislu. Marketing koji nagovara na posebne formule za žene uglavnom prodaje isti protein u drugačijoj ambalaži. Gledajte sastav: procenat proteina, šećer, masti — ne polne oznake na pakovanju.",
  },
];

const BASE = "https://proteinoteka.rs";
const SLUG = "/vodici/da-li-protein-goji";

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Da li protein goji? Šta kaže nauka o whey proteinu i gojenju",
      datePublished: "2026-06-05",
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
        { "@type": "ListItem", position: 3, name: "Da li protein goji?", item: `${BASE}${SLUG}` },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-10">

          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8 flex-wrap">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <Link href="/vodici" className="hover:text-[#FF9900] transition-colors">Vodiči</Link>
            <span>/</span>
            <span className="text-slate-600">Da li protein goji?</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Da li protein goji?
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>7 min čitanja</span>
              <span>·</span>
              <span>Ažurirano: {new Date().toLocaleDateString("sr-RS", { month: "long", year: "numeric" })}</span>
            </div>
          </div>

          <p className="text-lg text-slate-700 leading-relaxed mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            Proteinski šejk te ne goji — goji te <strong className="text-slate-900">kalorijski suficit</strong>. Ako unosiš više kalorija nego što trošiš, gojiš se bez obzira na izvor. Protein je od sva tri makronutrijenta onaj koji <em>najmanje</em> vodi gojenju — zasićuje, čuva mišiće i ima viši termički efekat od masti i ugljenih hidrata.
          </p>

          <GuideToc sections={TOC} />

          <section className="mb-10" id="kalorijski-suficit">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kalorijski suficit = gojenje, ne protein</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Gojenje je rezultat jednog jedinog procesa: uneseš više energije nego što telo potroši, i taj višak se skladišti kao masno tkivo. To važi za svaki izvor kalorija — proteine, ugljene hidrate i masti podjednako. Protein nije izuzetak, ali ima nekoliko biohemijskih osobina zbog kojih je u praksi teže "ugojiti se od proteina" nego od jednakog broja kalorija iz ugljenih hidrata ili masti.
              </p>
            </div>

            <h3 id="termicki-efekat" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Termički efekat proteina</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Svaki makronutrijent zahteva energiju za varenje i metabolizovanje — to se zove termički efekat ishrane (TEF). Razlika između nutrijenata je značajna:
              </p>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Makronutrijent</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">Termički efekat</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">Neto kcal od 100 kcal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { m: "Proteini", tef: "20–35%", net: "65–80 kcal", hi: true },
                        { m: "Ugljeni hidrati", tef: "5–10%", net: "90–95 kcal", hi: false },
                        { m: "Masti", tef: "0–3%", net: "97–100 kcal", hi: false },
                      ].map(({ m, tef, net, hi }) => (
                        <tr key={m} className={hi ? "bg-[#FFF8EC]" : ""}>
                          <td className="px-4 py-3 font-medium text-slate-800">{m}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{tef}</td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-800">{net}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p>
                Praktično: od 100 kcal iz proteina telo efektivno apsorbuje 65–80 kcal, jer ostatak "sagori" tokom varenja. To je jedinstven efekat koji ni ugljeni hidrati ni masti nemaju u toj meri.
              </p>
            </div>

            <h3 id="kalorije-sejka" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Koliko kalorija ima šejk?</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Jedna porcija whey proteina (30g praška) u vodi daje oko <strong className="text-slate-900">110–130 kcal</strong> i 22–27g proteina. To je manje od jedne banane (89 kcal) ili jedne kriške hleba (80 kcal). Problem nastaje kada šejk <em>dodaš</em> na ionako preobilnu ishranu, umesto da ga koristiš kao zamenu za kalorijski gušće međuobroke.
              </p>
              <div className="bg-[#FFF8EC] border border-[#FF9900]/30 rounded-xl p-4">
                <p className="text-[14px] text-slate-700">
                  <strong className="text-slate-900">Primer:</strong> šejk od 30g WPC u 300ml mleka = ~280 kcal i ~35g proteina. Isto toliko kalorija ima i kifla. Razlika u sitosti i uticaju na mišiće je ogromna.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10" id="sitost-hormoni">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kako protein utiče na sitost i apetit</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Protein je najefikasniji makronutrijent za osećaj sitosti. Istraživanja konzistentno pokazuju da ishrana bogata proteinima spontano smanjuje ukupan kalorijski unos — ne zato što ti se zabrani da jedeš, nego zato što se osetiš sitim duže.
              </p>
            </div>

            <h3 id="leptin-grelin" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Hormoni gladi: leptin, grelin i GLP-1</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Protein pokreće lučenje hormona sitosti koji mozgu šalju signal "dosta je" — i istovremeno snižava nivo <strong className="text-slate-900">grelina</strong>, hormona koji izaziva glad. Rezultat: posle proteinskog obroka jednostavno nisi gladan onoliko dugo koliko bi bio posle iste količine kalorija iz ugljenih hidrata. Kombinacija ova dva efekta znači da posle proteinskog obroka duže nisi gladan nego posle obroka sa ugljenim hidratima iste kalorijske vrednosti.
              </p>
              <p>
                Studija objavljena u <em>British Journal of Nutrition</em> (Westerterp-Plantenga i saradnici, 2012) pokazala je da povećanje unosa proteina na 25–30% ukupnih kalorija spontano smanjuje ukupan dnevni unos hrane za 400–500 kcal — bez svesnog ograničavanja porcija.
              </p>
            </div>

            <h3 id="insulin-zabluda" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Insulin i protein — česta zabluda</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Čuje se tvrdnja: "protein podiže insulin, a insulin goji". Ovo je pogrešno tumačenje. Da, protein stimuliše lučenje insulina — ali i ugljeni hidrati to čine, i to u znatno većoj meri. Insulin nije "hormon gojenja" — to je hormon koji reguliše nivo šećera u krvi i transport hranjivih materija. Gojenje ne nastaje od insulina, nego od kalorijskog suficita.
              </p>
              <p>
                Osim toga, protein istovremeno stimuliše lučenje <strong className="text-slate-900">glukagona</strong> — hormona koji direktno suprotstavlja insulinu i pomaže sagorevanju masti. Efekat na gojenje je neutralan ili blag u korist proteina.
              </p>
            </div>
          </section>

          <section className="mb-10" id="greske">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Greške koje zaista vode gojenju</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Dodavanje šejka bez prilagođavanja ishrane",
                  desc: "Najčešći scenario: osoba počne da uzima proteinski šejk, ali ga doda na već punačku ishranu. Šejk nije kriv — kriv je kalorijski suficit koji je napravila. Šejk treba da zameni nešto, ne da se doda na sve.",
                },
                {
                  title: "Šejk sa puno mleka i šećera",
                  desc: "30g WPC u 400ml punomasnog mleka sa bananom i medom = 500–600 kcal. To je obrok, ne šejk. Ako ti cilj nije gejnovanje, drži se vode ili delimično obranog mleka.",
                },
                {
                  title: "Trening kao dozvola za jelo",
                  desc: "Sat teretane sagori 300–500 kcal. Jedna burek-jogurt kombinacija vraća 600+ kcal. Trening nije dozvola za prejedanje — posebno ne ako si dodao šejk na to.",
                },
                {
                  title: "Proteini sa visokim sadržajem šećera",
                  desc: "Neki flavorizovani proteini imaju 8–15g šećera po porciji. Čitaj deklaraciju — ciljaj ispod 3g šećera na 100g proizvoda.",
                },
              ].map(({ title, desc }) => (
                <div key={title} className="flex gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <span className="text-red-400 font-bold text-lg shrink-0 mt-0.5">✕</span>
                  <div>
                    <p className="font-semibold text-slate-900 text-[15px]">{title}</p>
                    <p className="text-[14px] text-slate-600 leading-relaxed mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h3 id="misici-zastita" className="text-[17px] font-bold text-slate-800 mt-7 mb-3">Mišićna masa kao zaštita od gojenja</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Mišićno tkivo je metabolički aktivno — troši energiju i u mirovanju. Osoba sa više mišića ima viši bazalni metabolizam i lakše održava telesnu težinu. Protein u ishrani, uz trening, pomaže da izgradiš i sačuvaš tu mišićnu masu. U tom smislu, adekvatna proteinska ishrana je zapravo dugoročna <em>zaštita</em> od gojenja, ne uzrok.
              </p>
            </div>
          </section>

          <section className="mb-10" id="mrsavljenje">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kada protein zapravo pomaže mršavljenju</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Ako si u kalorijskom deficitu, viši unos proteina (1.8–2.2g/kg) pomaže da <strong className="text-slate-900">sačuvaš mišićnu masu</strong> dok gubiš mast. Bez dovoljno proteina, telo u deficitu razgrađuje i mišiće — završiš mršavije, ali mlitavije i sa nižim metabolizmom.
              </p>
              <p>
                Proteinski šejk tu može biti praktičan alat — zamena za visokokalorični međuobrok koji te drži sitim sa manje kalorija. 30g whey proteina u vodi = ~120 kcal i ~25g proteina. Malo koji drugi snack nudi takav odnos proteina i kalorija.
              </p>
              <p>
                Za detalje o tome koji tip proteina birati pri mršavljenju i koliko tačno košta mesec dana, pogledaj{" "}
                <Link href="/vodici/protein-za-mrsavljenje" className="text-[#FF9900] hover:underline font-medium">
                  vodič za protein pri mršavljenju →
                </Link>
              </p>
            </div>
          </section>

          <section className="mb-10" id="faq">
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

          <section className="mb-8">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Naučne reference</h2>
            <ol className="space-y-1.5 text-[13px] text-slate-500 list-decimal pl-4">
              <li>Westerterp-Plantenga MS et al. (2012). Dietary protein — its role in satiety, energetics, weight loss and health. <em>British Journal of Nutrition</em>, 108(S2), S105–S112.</li>
              <li>Paddon-Jones D et al. (2008). Protein, weight management, and satiety. <em>American Journal of Clinical Nutrition</em>, 87(5), 1558S–1561S.</li>
              <li>Halton TL & Hu FB (2004). The effects of high protein diets on thermogenesis, satiety and weight loss. <em>Journal of the American College of Nutrition</em>, 23(5), 373–385.</li>
            </ol>
          </section>

          <GuideDisclaimer />

          <section className="mt-10 mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni vodiči</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/vodici/koliko-proteina-dnevno" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/vodici/protein-za-mrsavljenje" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Protein za mršavljenje
              </Link>
              <Link href="/vodici/kada-piti-protein" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Kada piti protein?
              </Link>
              <Link href="/vodici/koliko-novca-mesecno-za-proteine" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko novca mesečno za proteine?
              </Link>
            </div>
          </section>

          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center">
            <p className="text-base leading-relaxed mb-4">
              Pronađi protein koji nudi najviše proteina po gramu i kaloriji — iz svih prodavnica u Srbiji.
            </p>
            <Link
              href="/?sort=valueScore,desc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Uporedi proteine po Value Score-u →
            </Link>
          </div>

          <VodiciNav currentSlug="da-li-protein-goji" />
        </main>
      </div>
    </>
  );
}
