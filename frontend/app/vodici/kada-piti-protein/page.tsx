import { CURRENT_MARKET, MARKET_CONFIG } from '@/lib/marketConfig';
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import VodiciNav from "@/components/VodiciNav";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";

export const metadata: Metadata = {
  title: { absolute: "Kada piti protein: pre ili posle treninga? | Proteinoteka" },
  description:
    "Posle treninga nije jedini dobar momenat — ujutru i pre sna imaju podjednaku naučnu podlogu. Konkretni raspored za osobu od 80 kg koja trenira 4× nedeljno, plus kada tajming uopšte nije bitan.",
  alternates: { canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/kada-piti-protein` },
  openGraph: {
    title: "Kada piti protein: pre ili posle treninga? | Proteinoteka",
    description:
      "Posle treninga nije jedini dobar momenat — ujutru i pre sna imaju podjednaku naučnu podlogu. Konkretni raspored za osobu od 80 kg koja trenira 4× nedeljno, plus kada tajming uopšte nije bitan.",
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/kada-piti-protein`,
    siteName: "Proteinoteka",
    locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
    type: "article",
    images: [{ url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: [`https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`],
  },
};

const TOC: TocSection[] = [
  { id: "anabolicki-prozor", title: "Mit o anaboličkom prozoru od 30 minuta" },
  { id: "sta-kaze-nauka", title: "Šta nauka zapravo kaže?", level: 3 },
  { id: "optimalno-vreme", title: "Optimalno vreme za različite ciljeve" },
  { id: "izgradnja-misica", title: "Izgradnja mišića — raspored je važniji od tajminga", level: 3 },
  { id: "mrsavljenje-timing", title: "Mršavljenje i fasted trening", level: 3 },
  { id: "jutarnji-protein", title: "Jutarnji protein i kazein pre sna" },
  { id: "ujutru", title: "Whey ujutru — zašto ima smisla", level: 3 },
  { id: "kazein-pre-sna", title: "Kazein pre sna — 40g protokol", level: 3 },
  { id: "meduobrok", title: "Protein između obroka" },
  { id: "raspored", title: "Praktičan raspored za prosečnog vežbača" },
  { id: "trening-dan", title: "Trening dan vs. netrenirajući dan", level: 3 },
  { id: "faq", title: "Česta pitanja" },
];

const faqItems = [
  {
    q: "Da li je protein ujutru na prazan stomak loša ideja?",
    a: "Nije — protein ujutru je odlična ideja. Posle noćnog posta mišići su u lakšem kataboličkom stanju, pa unos proteina za doručak pomaže da pokreneš sintezu mišićnih proteina. Šejk ili jaja za doručak su sasvim dobar start dana.",
  },
  {
    q: "Mogu li da popijem protein pre spavanja?",
    a: "Da, i ima smisla — naročito kazein koji se polako apsorbuje tokom noći. Studija Res i saradnika (2012) pokazala je da 40g kazeina pre sna povećava sintezu mišićnih proteina tokom spavanja bez negativnog uticaja na sagorevanje masti. Whey pre sna je manje efikasan zbog brzine apsorpcije, ali i dalje bolji nego ništa.",
  },
  {
    q: "Šta ako ne mogu da popijem protein odmah posle treninga?",
    a: "Ništa dramatično. Istraživanja pokazuju da je ukupan dnevni unos proteina daleko važniji od preciznog tajminga. Ako si jeo protein sat-dva pre treninga, telo još uvek ima aminokiseline na raspolaganju. Fokusiraj se na to da uneseš dovoljno tokom dana.",
  },
  {
    q: "Koliko puta dnevno treba uzimati protein?",
    a: "Optimalno je rasporediti unos proteina na 3–5 obroka dnevno, sa 25–40g proteina po obroku. Svaki obrok aktivira sintezu mišićnih proteina. Jedan veliki unos od 80g odjednom nije efikasniji od podeljenog unosa.",
  },
];

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/vodici/kada-piti-protein";

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Kada piti protein — pre, posle treninga ili ujutru?",
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
        { "@type": "ListItem", position: 3, name: "Kada piti protein", item: `${BASE}${SLUG}` },
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
            <span className="text-slate-600">Kada piti protein</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Kada piti protein — pre, posle treninga ili ujutru?
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>7 min čitanja</span>
              <span>·</span>
              <span>Ažurirano: {new Date().toLocaleDateString("sr-RS", { month: "long", year: "numeric" })}</span>
            </div>
          </div>

          <p className="text-lg text-slate-700 leading-relaxed mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            Najvažnija stvar kod uzimanja proteina nije <em>kada</em> — nego <strong className="text-slate-900">koliko ukupno uneseš tokom dana</strong>. Tajming je sekundarna optimizacija. Ali ako već razmišljaš o tome, posle treninga, za doručak i pre sna su tri momenta sa naučnom podlogom.
          </p>

          <GuideToc sections={TOC} />

          <section className="mb-10" id="anabolicki-prozor">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Mit o anaboličkom prozoru od 30 minuta</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Godinama je vladalo uverenje da moraš da popiješ šejk unutar 30 minuta posle treninga ili "gubite sve". Taj mit je izrastao iz ranih istraživanja na atletičarima visokog intenziteta u stanju gladovanja. Za prosečnog rekreativca koji jede normalno, situacija je drugačija.
              </p>
            </div>

            <h3 id="sta-kaze-nauka" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Šta nauka zapravo kaže?</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Meta-analiza Schoenfeldа i Aragona (2013, <em>Journal of the International Society of Sports Nutrition</em>) analizirala je dostupne studije o tajmingu proteina i zaključila: <strong className="text-slate-900">anabolički prozor traje 4–6 sati, ne 30 minuta</strong>. Ako si jeo/la normalan obrok bogat proteinima sat-dva pre treninga, telo ima aminokiseline na raspolaganju i posle poslednjeg seta.
              </p>
              <p>
                Isti autori su u naknadnim radovima utvrdili da je ukupan dnevni unos proteina konzistentno važniji faktor za rast mišića od preciznog tajminga — kada i šta jedeš oko treninga daleko je manje bitno od toga koliko ukupno uneseš tokom dana.
              </p>
              <div className="bg-[#FFF8EC] border border-[#FF9900]/30 rounded-xl p-4">
                <p className="text-[14px] text-slate-700">
                  <strong className="text-slate-900">Praktična poruka:</strong> Ako trebaš da biraš između "popiti šejk odmah posle treninga a ne jesti godinu dana dovoljno proteina" i "propustiti prozor ali jesti 160g proteina dnevno" — drugi scenario daje bolje rezultate.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10" id="optimalno-vreme">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Optimalno vreme za različite ciljeve</h2>

            <h3 id="izgradnja-misica" className="text-[17px] font-bold text-slate-800 mt-4 mb-3">Izgradnja mišića — raspored je važniji od tajminga</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Za hipertrofiju, ključno je rasporediti ukupan dnevni unos proteina na <strong className="text-slate-900">3–5 obroka od 25–40g</strong>. Svaki obrok nezavisno aktivira sintezu mišićnih proteina (MPS). Jedan šejk od 80g odjednom nije efikasniji od dva obroka po 40g.
              </p>
              <p>
                Šejk posle treninga je <em>logistički zgodan</em> — ali nije magičan. Telo ne čeka na prozor; ono koristi aminokiseline koje su dostupne u sistemu u periodu od nekoliko sati nakon treninga.
              </p>
            </div>

            <h3 id="mrsavljenje-timing" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Mršavljenje i fasted trening</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Ako treniraš ujutru na prazan stomak (fasted cardio), šejk odmah po treningu ima više smisla nego inače — jer telo nije imalo unos proteina od prethodne večeri. Ovde tajming ima opipljiv efekat: unos proteina u prvom satu posle gladnog jutarnjeg treninga pomaže da zaustavi razgradnju mišića.
              </p>
              <p>
                Za mršavljenje, protein ujutru pre treninga (ili odmah posle) pomaže sitosti tokom dana i smanjuje verovatnoću prejedanja u drugoj polovini dana.
              </p>
            </div>
          </section>

          <section className="mb-10" id="jutarnji-protein">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Jutarnji protein i kazein pre sna</h2>

            <h3 id="ujutru" className="text-[17px] font-bold text-slate-800 mt-4 mb-3">Whey ujutru — zašto ima smisla</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Posle 7–9 sati noćnog posta mišići su u blagom kataboličkom stanju — telo je iscrpilo aminokiseline iz cirkulacije i počelo da ih uzima iz mišićnog tkiva. Whey protein je idealan ujutru jer <strong className="text-slate-900">brzo se apsorbuje</strong> (dostupan u krvi za 30–60 min) i efikasno gasi kataboličko stanje.
              </p>
              <p>
                Kombinacija whey šejka sa ovsenim pahuljicama i voćem pruža brzo (protein) + sporo (vlakna, ugljeni hidrati) gorivo i drži energiju stabilnom do ručka.
              </p>
            </div>

            <h3 id="kazein-pre-sna" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Kazein pre sna — 40g protokol</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Kazein se apsorbuje 6–8 sati, što ga čini idealnim za noćni period. Studija Res i saradnika (<em>Medicine & Science in Sports & Exercise</em>, 2012) pokazala je da <strong className="text-slate-900">40g kazeina pre sna</strong> značajno povećava sintezu mišićnih proteina tokom spavanja i ne utiče negativno na oksidaciju masti.
              </p>
              <p>
                Ako nemaš kazein u prahu, <strong className="text-slate-900">grčki jogurt ili svježi sir</strong> pre sna daje sličan efekat — oba su prirodno bogata kazeinom i znatno su jeftiniji. 200g svežeg sira sadrži ~22g kazeina.
              </p>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Opcija pre sna</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">Proteini</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">Kalorije</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 hidden sm:table-cell">Apsorpcija</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { o: "Kazein protein (40g praška)", p: "~32g", k: "~160 kcal", a: "6–8 h" },
                        { o: "Svježi sir 200g", p: "~22g", k: "~160 kcal", a: "4–6 h" },
                        { o: "Grčki jogurt 200g", p: "~18g", k: "~130 kcal", a: "3–5 h" },
                        { o: "Whey protein (30g praška)", p: "~24g", k: "~120 kcal", a: "1–2 h" },
                      ].map(({ o, p, k, a }) => (
                        <tr key={o}>
                          <td className="px-3 py-2.5 text-slate-700 text-[13px]">{o}</td>
                          <td className="px-3 py-2.5 text-center font-medium text-slate-800 text-[13px]">{p}</td>
                          <td className="px-3 py-2.5 text-center text-slate-600 text-[13px]">{k}</td>
                          <td className="px-3 py-2.5 text-center text-slate-600 text-[13px] hidden sm:table-cell">{a}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-10" id="meduobrok">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Protein između obroka</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Protein kao međuobrok ima smisla kad imaš više od 4–5 sati između obroka ili kad tražiš nešto zasitno sa malo kalorija. 30g whey proteina u vodi = ~120 kcal i ~25g proteina. Poređenja radi, jabuka ima 80 kcal ali svega ~0.4g proteina.
              </p>
              <p>
                Za mišićni rast, idealno je da nijedan period od buđenja do spavanja ne traje duže od 4–5 sati bez unosa proteina. Šejk između obroka pomaže da ne probijete taj interval.
              </p>
            </div>
          </section>

          <section className="mb-10" id="raspored">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Praktičan raspored za prosečnog vežbača</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
              <p>
                Primer za osobu od 80 kg, cilj ~160g proteina dnevno, trening poslepodne:
              </p>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { time: "07:00 — Doručak", items: ["3 jaja (~19g)", "200g grčkog jogurta (~18g)", "Ukupno: ~37g"] },
                { time: "12:30 — Ručak", items: ["200g piletine (~44g)", "Prilog (pirinač, povrće)", "Ukupno: ~46g"] },
                { time: "16:00 — Pre treninga", items: ["Whey šejk 30g (~25g) ili obrok", "Opciono: banana za energiju"] },
                { time: "18:30 — Posle treninga", items: ["Ako nisi jeo pre treninga: whey šejk 30g", "Ako jesi jeo: direktno na večeru"] },
                { time: "20:00 — Večera", items: ["200g lososa ili mesa (~40g)", "Povrće, salata"] },
                { time: "22:00 — Pre sna", items: ["200g svežeg sira (~22g)", "Ukupno dana: ~160–170g ✓"] },
              ].map(({ time, items }) => (
                <div key={time} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <p className="font-bold text-[#FF9900] text-[13px] mb-1">{time}</p>
                  <ul className="text-[14px] text-slate-600 space-y-0.5">
                    {items.map((item, i) => (
                      <li key={i} className={item.startsWith("Ukupno") ? "font-semibold text-slate-800 mt-1" : ""}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <h3 id="trening-dan" className="text-[17px] font-bold text-slate-800 mt-4 mb-3">Trening dan vs. netrenirajući dan</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Netrenirajući dan ne znači da ti ne treba protein. Oporavak i rast mišića dešavaju se <em>između</em> treninga — tokom mirovanja. Ciljaj isti dnevni unos proteina bez obzira da li treniraš tog dana. Tajming je manje bitan — samo obezbedi raspoređen unos kroz ceo dan.
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
              <li>Schoenfeld BJ & Aragon AA (2013). The effect of protein timing on muscle strength and hypertrophy. <em>Journal of the International Society of Sports Nutrition</em>, 10(1), 53.</li>
              <li>Res PT et al. (2012). Protein ingestion before sleep improves postexercise overnight recovery. <em>Medicine & Science in Sports & Exercise</em>, 44(8), 1560–1569.</li>
              <li>Areta JL et al. (2013). Timing and distribution of protein ingestion during prolonged recovery. <em>Journal of Physiology</em>, 591(9), 2319–2331.</li>
            </ol>
          </section>

          <GuideDisclaimer />

          <section className="mt-10 mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni vodiči</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/vodici/koliko-proteina-dnevno" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/vodici/whey-isolate-vs-concentrate" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Isolate vs Concentrate
              </Link>
              <Link href="/vodici/da-li-protein-goji" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Da li protein goji?
              </Link>
              <Link href="/kategorija/casein?sort=valueScore,desc" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Kazein proteini
              </Link>
              <Link href="/whey-protein-cena" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey protein cena u Srbiji
              </Link>
              <Link href="/najjeftiniji-whey-protein" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Najjeftiniji whey protein
              </Link>
            </div>
          </section>

          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center">
            <p className="text-base leading-relaxed mb-4">
              Pronađi whey protein koji odgovara tvom rasporedu — uporedi sve brendove dostupne u Srbiji.
            </p>
            <Link
              href="/?sort=valueScore,desc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Uporedi proteine →
            </Link>
          </div>

          <VodiciNav currentSlug="kada-piti-protein" />
        </main>
      </div>
    </>
  );
}
