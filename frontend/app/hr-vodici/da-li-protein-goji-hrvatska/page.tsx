import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";

export const metadata: Metadata = {
  title: { absolute: "Da li protein goji? Ne — ali postoji jedan uvjet | Proteinoteka" },
  description:
    "Kratki odgovor: ne. Goji te kalorijski suficit — a whey protein ima viši termički učinak od ugljikohidrata i pomaže sitosti. Kada shake zapravo može povećati tjelesnu težinu i kada pomaže mršavljenju.",
  alternates: { canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/da-li-protein-goji-hrvatska` },
  openGraph: {
    title: "Da li protein goji? Ne — ali postoji jedan uvjet | Proteinoteka",
    description:
      "Kratki odgovor: ne. Goji te kalorijski suficit — a whey protein ima viši termički učinak od ugljikohidrata i pomaže sitosti.",
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/da-li-protein-goji-hrvatska`,
    siteName: "Proteinoteka",
    locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
    type: "article",
    images: [{ url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: [`https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`] },
};

const TOC: TocSection[] = [
  { id: "kalorijski-suficit", title: "Kalorijski suficit = debljanje, ne protein" },
  { id: "termicki-ucinak", title: "Termički učinak proteina", level: 3 },
  { id: "kalorije-shakea", title: "Koliko kalorija ima shake?", level: 3 },
  { id: "sitost-hormoni", title: "Kako protein utječe na sitost i apetit" },
  { id: "leptin-grelin", title: "Hormoni gladi: leptin, grelin i GLP-1", level: 3 },
  { id: "insulin-zabluda", title: "Inzulin i protein — česta zabluda", level: 3 },
  { id: "greske", title: "Pogreške koje zaista vode debljanju" },
  { id: "misici-zastita", title: "Mišićna masa kao zaštita od debljanja", level: 3 },
  { id: "mrsavljenje", title: "Kada protein pomaže mršavljenju" },
  { id: "faq", title: "Često postavljana pitanja" },
];

const faqItems = [
  {
    q: "Može li proteinski shake zamijeniti obrok i hoću li smršaviti?",
    a: "Shake može biti dio obroka, ali rijetko ga u potpunosti zamjenjuje po sitosti i mikronutrijentima. Ako shakeom zamijenite obrok s manje kalorija i ostanete u deficitu, gubite kilograme — ali to vrijedi za svaku hranu, ne samo za protein.",
  },
  {
    q: "Goji li protein nakon treninga ako ne treniram dovoljno?",
    a: "Ako unesete više kalorija nego što trošite, višak se skladišti kao mast — bez obzira na to što ste pojeli. Protein nije iznimka od prvog zakona termodinamike. Trening bez deficita u prehrani neće sam po sebi smanjiti tjelesnu masu.",
  },
  {
    q: "Koliko kalorija ima tipičan proteinski shake?",
    a: "Jedna porcija whey proteina (30g) u vodi daje uglavnom 100–130 kcal i 22–27g proteina. S 250ml punomasnog mlijeka dodajete još 150 kcal — ukupno 250–280 kcal. To je manje od prosječnog ručka.",
  },
  {
    q: "Goje li ženski proteini manje od muških?",
    a: "Ne postoji 'ženski' ili 'muški' protein u biokemijskom smislu. Marketing koji nagovara na posebne formule za žene uglavnom prodaje isti protein u drugačijoj ambalaži. Gledajte sastav: postotak proteina, šećer, masti — ne oznake na pakiranju.",
  },
];

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/hr-vodici/da-li-protein-goji-hrvatska";

export default function Page() {
  const dateModified = new Date().toISOString().split("T")[0];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Da li protein goji? Što kaže znanost o whey proteinu i debljanju",
      datePublished: "2026-06-27",
      dateModified,
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
        { "@type": "ListItem", position: 2, name: "Vodiči", item: `${BASE}/hr-vodici` },
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
            <Link href="/hr-vodici" className="hover:text-[#FF9900] transition-colors">Vodiči</Link>
            <span>/</span>
            <span className="text-slate-600">Goji li protein?</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Goji li protein?
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>7 min čitanja</span>
              <span>·</span>
              <time dateTime={dateModified}>Ažurirano: lipanj 2026.</time>
            </div>
          </div>

          <p className="text-lg text-slate-700 leading-relaxed mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            Proteinski shake vas ne goji — goji vas <strong className="text-slate-900">kalorijski suficit</strong>.
            Ako unosite više kalorija nego što trošite, debljate se bez obzira na izvor. Protein je od sva tri
            makronutrijenta onaj koji <em>najmanje</em> vodi debljanju — zasićuje, čuva mišiće i ima viši termički
            učinak od masti i ugljikohidrata.
          </p>

          <GuideToc sections={TOC} />

          <section className="mb-10" id="kalorijski-suficit">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kalorijski suficit = debljanje, ne protein</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Debljanje je rezultat jednog jedinog procesa: unesete više energije nego što tijelo potroši, i taj
                višak se skladišti kao masno tkivo. To vrijedi za svaki izvor kalorija — proteine, ugljikohidrate
                i masti podjednako. Protein nije iznimka, ali ima nekoliko biokemijskih osobina zbog kojih je u
                praksi teže "udebljati se od proteina" nego od jednakog broja kalorija iz ugljikohidrata ili masti.
              </p>
            </div>

            <h3 id="termicki-ucinak" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Termički učinak proteina</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Svaki makronutrijent zahtijeva energiju za probavu i metaboliziranje — to se zove termički učinak
                prehrane (TEF). Razlika između nutrijenata je značajna:
              </p>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Makronutrijent</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">Termički učinak</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">Neto kcal od 100 kcal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { m: "Proteini", tef: "20–35%", net: "65–80 kcal", hi: true },
                        { m: "Ugljikohidrati", tef: "5–10%", net: "90–95 kcal", hi: false },
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
                Praktično: od 100 kcal iz proteina tijelo efektivno apsorbira 65–80 kcal, jer ostatak "sagori"
                tijekom probave. To je jedinstven učinak koji ni ugljikohidrati ni masti nemaju u toj mjeri.
              </p>
            </div>

            <h3 id="kalorije-shakea" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Koliko kalorija ima shake?</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Jedna porcija whey proteina (30g praška) u vodi daje oko{" "}
                <strong className="text-slate-900">110–130 kcal</strong> i 22–27g proteina. To je manje od jedne
                banane (89 kcal) ili jedne kriške kruha (80 kcal). Problem nastaje kada shake{" "}
                <em>dodate</em> na ionako preobilnu prehranu, umjesto da ga koristite kao zamjenu za
                kalorijski gušće međuobroke.
              </p>
              <div className="bg-[#FFF8EC] border border-[#FF9900]/30 rounded-xl p-4">
                <p className="text-[14px] text-slate-700">
                  <strong className="text-slate-900">Primjer:</strong> shake od 30g WPC u 300ml mlijeka = ~280 kcal
                  i ~35g proteina. Isto toliko kalorija ima i kifla. Razlika u sitosti i utjecaju na mišiće je ogromna.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10" id="sitost-hormoni">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kako protein utječe na sitost i apetit</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Protein je najučinkovitiji makronutrijent za osjećaj sitosti. Istraživanja dosljedno pokazuju da
                prehrana bogata proteinima spontano smanjuje ukupan kalorijski unos — ne zato što vam se zabrani
                jesti, nego zato što se osjećate sitima duže.
              </p>
            </div>

            <h3 id="leptin-grelin" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Hormoni gladi: leptin, grelin i GLP-1</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Protein potiče lučenje hormona sitosti koji mozgu šalju signal "dosta je" — i istovremeno snižava
                razinu <strong className="text-slate-900">grelina</strong>, hormona koji izaziva glad. Studija
                objavljena u <em>British Journal of Nutrition</em> (Westerterp-Plantenga i sur., 2012) pokazala je
                da povećanje unosa proteina na 25–30% ukupnih kalorija spontano smanjuje ukupan dnevni unos hrane
                za 400–500 kcal — bez svjesnog ograničavanja porcija.
              </p>
            </div>

            <h3 id="insulin-zabluda" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Inzulin i protein — česta zabluda</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Čuje se tvrdnja: "protein podiže inzulin, a inzulin goji". Ovo je pogrešno tumačenje. Da,
                protein stimulira lučenje inzulina — ali i ugljikohidrati to čine, i to u znatno većoj mjeri.
                Inzulin nije "hormon debljanja" — to je hormon koji regulira razinu šećera u krvi i transport
                hranjivih tvari. Debljanje ne nastaje od inzulina, nego od kalorijskog suficita.
              </p>
              <p>
                Osim toga, protein istovremeno stimulira lučenje{" "}
                <strong className="text-slate-900">glukagona</strong> — hormona koji izravno suprotstavlja
                inzulinu i pomaže sagorijevanju masti. Učinak na debljanje je neutralan ili blag u korist proteina.
              </p>
            </div>
          </section>

          <section className="mb-10" id="greske">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Pogreške koje zaista vode debljanju</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Dodavanje shakea bez prilagodbe prehrane",
                  desc: "Najčešći scenarij: osoba počne uzimati proteinski shake, ali ga doda na već obilnu prehranu. Shake nije kriv — kriv je kalorijski suficit koji je nastao. Shake treba zamijeniti nešto, ne dodati se na sve.",
                },
                {
                  title: "Shake s puno mlijeka i šećera",
                  desc: "30g WPC u 400ml punomasnog mlijeka s bananom i medom = 500–600 kcal. To je obrok, ne shake. Ako vam cilj nije povećanje mase, koristite vodu ili djelomično obrano mlijeko.",
                },
                {
                  title: "Trening kao dozvola za jelo",
                  desc: "Sat teretane sagori 300–500 kcal. Jedna burek-jogurt kombinacija vraća 600+ kcal. Trening nije dozvola za prejedanje — posebno ne ako ste dodali shake na to.",
                },
                {
                  title: "Proteini s visokim sadržajem šećera",
                  desc: "Neki aromatizirani proteini imaju 8–15g šećera po porciji. Čitajte deklaraciju — ciljajte ispod 3g šećera na 100g proizvoda.",
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

            <h3 id="misici-zastita" className="text-[17px] font-bold text-slate-800 mt-7 mb-3">Mišićna masa kao zaštita od debljanja</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Mišićno tkivo je metabolički aktivno — troši energiju i u mirovanju. Osoba s više mišića ima
                viši bazalni metabolizam i lakše održava tjelesnu masu. Protein u prehrani, uz trening, pomaže
                da izgradite i sačuvate tu mišićnu masu. U tom smislu, adekvatna proteinska prehrana je zapravo
                dugoročna <em>zaštita</em> od debljanja, ne uzrok.
              </p>
            </div>
          </section>

          <section className="mb-10" id="mrsavljenje">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kada protein zapravo pomaže mršavljenju</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Ako ste u kalorijskom deficitu, viši unos proteina (1.8–2.2g/kg) pomaže da{" "}
                <strong className="text-slate-900">sačuvate mišićnu masu</strong> dok gubite mast. Bez dovoljno
                proteina, tijelo u deficitu razgrađuje i mišiće — završite mršavije, ali mlitavije i s nižim
                metabolizmom.
              </p>
              <p>
                Proteinski shake tu može biti praktičan alat — zamjena za visokokalorični međuobrok koji vas drži
                sitima s manje kalorija. 30g whey proteina u vodi = ~120 kcal i ~25g proteina. Malo koji drugi
                međuobrok nudi takav omjer proteina i kalorija.
              </p>
              <p>
                Za detalje o tome koji tip proteina odabrati pri mršavljenju i koliko košta mjesec dana u
                Hrvatskoj, pogledajte{" "}
                <Link href="/hr-vodici/protein-za-mrsavljenje-hrvatska" className="text-[#FF9900] hover:underline font-medium">
                  vodič za protein pri mršavljenju →
                </Link>
              </p>
            </div>
          </section>

          <section className="mb-10" id="faq">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Često postavljana pitanja</h2>
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
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Znanstvene reference</h2>
            <ol className="space-y-1.5 text-[13px] text-slate-500 list-decimal pl-4">
              <li>Westerterp-Plantenga MS et al. (2012). Dietary protein — its role in satiety, energetics, weight loss and health. <em>British Journal of Nutrition</em>, 108(S2), S105–S112.</li>
              <li>Paddon-Jones D et al. (2008). Protein, weight management, and satiety. <em>American Journal of Clinical Nutrition</em>, 87(5), 1558S–1561S.</li>
              <li>Halton TL &amp; Hu FB (2004). The effects of high protein diets on thermogenesis, satiety and weight loss. <em>Journal of the American College of Nutrition</em>, 23(5), 373–385.</li>
            </ol>
          </section>

          <GuideDisclaimer />

          <section className="mt-10 mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni vodiči</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/hr-vodici/koliko-proteina-dnevno-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/hr-vodici/protein-za-mrsavljenje-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Protein za mršavljenje
              </Link>
              <Link href="/hr-vodici/whey-protein-za-pocetnike-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey protein za početnike
              </Link>
              <Link href="/hr-vodici/koliko-kosta-protein-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko košta protein u HR?
              </Link>
            </div>
          </section>

          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center">
            <p className="text-base leading-relaxed mb-4">
              Pronađite protein koji nudi najviše proteina po gramu i kaloriji — iz svih prodavnica u Hrvatskoj.
            </p>
            <Link
              href="/?sort=valueScore%2Cdesc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Usporedi proteine po Value Score-u →
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
