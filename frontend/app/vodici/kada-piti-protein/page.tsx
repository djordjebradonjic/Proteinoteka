import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import VodiciNav from "@/components/VodiciNav";

export const metadata: Metadata = {
  title: { absolute: "Kada piti protein: pre ili posle treninga? | Proteinoteka" },
  description:
    "Posle treninga nije jedini dobar momenat — ujutru i pre sna imaju podjednaku naučnu podlogu. Evo konkretnog rasporeda za osobu od 80kg koja trenira 4x nedeljno, plus kada tajming uopšte nije bitan.",
  alternates: { canonical: "https://proteinoteka.rs/vodici/kada-piti-protein" },
  openGraph: {
    title: "Kada piti protein: pre ili posle treninga? | Proteinoteka",
    description:
      "Posle treninga nije jedini dobar momenat — ujutru i pre sna imaju podjednaku naučnu podlogu. Evo konkretnog rasporeda za osobu od 80kg koja trenira 4x nedeljno, plus kada tajming uopšte nije bitan.",
    url: "https://proteinoteka.rs/vodici/kada-piti-protein",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "article",
  },
};

const faqItems = [
  {
    q: "Da li je protein ujutru na prazan stomak loša ideja?",
    a: "Nije — protein ujutru je odlična ideja. Posle noćnog posta mišići su u lakšem kataboličkom stanju, pa unos proteina za doručak pomaže da pokreneš sintezu mišićnih proteina. Šejk ili jaja za doručak su sasvim dobar start dana.",
  },
  {
    q: "Mogu li da popijem protein pre spavanja?",
    a: "Da, i ima smisla — naročito kazein protein koji se polako apsorbuje tokom noći. Studije su pokazale da 40g kazeina pre sna povećava sintezu mišićnih proteina tokom spavanja bez negativnog uticaja na sagorevanje masti. Whey pre sna je manje efikasan zbog brzine apsorpcije, ali i dalje bolji nego ništa.",
  },
  {
    q: "Šta ako ne mogu da popijem protein odmah posle treninga?",
    a: "Ništa dramatično. Istraživanja pokazuju da je ukupan dnevni unos proteina daleko važniji od preciznog tajminga. Ako si pojeo/la protein sat pre treninga, telo još uvek ima aminokiseline na raspolaganju. Fokusiraj se na to da uneseš dovoljno proteina tokom dana — ne na sat na satu.",
  },
];

const BASE = "https://proteinoteka.rs";
const SLUG = "/vodici/kada-piti-protein";
const WORDS = 630;
const READ_MIN = Math.ceil(WORDS / 200);

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Kada piti protein — pre, posle treninga ili ujutru?",
      datePublished: "2026-06-05",
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

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8 flex-wrap">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <Link href="/vodici" className="hover:text-[#FF9900] transition-colors">Vodiči</Link>
            <span>/</span>
            <span className="text-slate-600">Kada piti protein</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Kada piti protein — pre, posle treninga ili ujutru?
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>{READ_MIN} min čitanja</span>
              <span>·</span>
              <span>Ažurirano: jun 2026.</span>
            </div>
          </div>

          {/* Intro */}
          <p className="text-lg text-slate-700 leading-relaxed mb-10 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            Najvažnija stvar kod uzimanja proteina nije <em>kada</em> — nego <strong className="text-slate-900">koliko ukupno uneseš tokom dana</strong>. Tajming je sekundarna optimizacija. Ali ako već brineš o tome, posle treninga, za doručak i pre sna su tri momenta koja imaju naučnu podlogu.
          </p>

          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Mit o anaboličkom prozoru od 30 minuta</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Godinama je vladalo uverenje da moraš da popiješ šejk unutar 30 minuta posle treninga ili "gubite sve". To je preuveličano. Novija meta-analiza istraživanja pokazuje da je anabolički odgovor mišića povišen 4–6 sati posle treninga, ne samo 30 minuta.
              </p>
              <p>
                Ako si pojeo/la normalan obrok bogat proteinima sat-dva pre treninga, tvoje telo još uvek ima aminokiseline u sistemu i posle treninga. Panika oko brzine šejka posle poslednjeg seta je nepotrebna.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Optimalno vreme za različite ciljeve</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                <strong className="text-slate-800">Za izgradnju mišića:</strong> Rasporedi protein na 3–4 obroka dnevno od po 30–40g. Svaki obrok aktivira sintezu mišićnih proteina. Jedan šejk posle treninga je zgodan za logistiku, ali nije čaroban bez ostatka dnevnog unosa.
              </p>
              <p>
                <strong className="text-slate-800">Za mršavljenje:</strong> Protein ujutru i pre treninga pomaže sitosti i smanjuje šansu za prejedanje. Ako treniraš na prazan stomak (fasted training), šejk odmah posle ima više smisla nego inače.
              </p>
              <p>
                <strong className="text-slate-800">Za oporavak:</strong> Protein unutar 2 sata posle treninga ubrzava oporavak mišića, naročito ako si imao/la intenzivan trening ili dugu sesiju.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Jutarnji protein vs. kazein pre sna</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                <strong className="text-slate-800">Ujutru:</strong> Whey protein je idealan — brzo se apsorbuje i brzo "budi" sintezu mišićnih proteina posle noćnog posta. Možeš ga kombinovati sa ovsenim pahuljicama ili voćem za kompletniji doručak.
              </p>
              <p>
                <strong className="text-slate-800">Pre sna:</strong> Tu kazein proteini imaju prednost. Kazein se apsorbuje 6–8 sati — savršeno za noć. Istraživanja (Res et al., 2012) pokazala su da 40g kazeina pre sna povećava sintezu mišićnih proteina tokom spavanja i ne utiče negativno na sagorevanje masti.
              </p>
              <p>
                Ako nemaš kazein, grčki jogurt ili svježi sir pre sna daje sličan efekat — oba su bogati kazeinom i daleko jeftiniji od kazeinske formule.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Praktičan raspored za prosečnog čoveka</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Ako treniraš 4 puta nedeljno i težiš 80kg (cilj ~160g proteina):
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-slate-800">Doručak:</strong> 3 jaja + šaka oraha → ~25g proteina</li>
                <li><strong className="text-slate-800">Ručak:</strong> 200g piletine ili tune → ~42g proteina</li>
                <li><strong className="text-slate-800">Posle treninga (ili kao međuobrok):</strong> whey šejk 30g u vodi → ~25g proteina</li>
                <li><strong className="text-slate-800">Večera:</strong> 200g mesa + 200g jogurta → ~50g proteina</li>
              </ul>
              <p className="mt-2">
                Ukupno ~142g — blizu cilja. Šejk ti tu služi kao praktično popunjavanje, ne kao zamena za hranu.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-10">
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni linkovi</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/vodici/koliko-proteina-dnevno" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/vodici/whey-isolate-vs-concentrate" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey Isolate vs Concentrate
              </Link>
              <Link href="/kategorija/casein?sort=valueScore,desc" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Kazein proteini
              </Link>
              <Link href="/vodici/da-li-protein-goji" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Da li protein goji?
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center">
            <p className="text-base leading-relaxed mb-4">
              Pronađi whey protein koji odgovara tvom rasporedu — uporedi cene svih brendova dostupnih u Srbiji.
            </p>
            <Link
              href="/?sort=valueScore,desc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Uporedi whey proteine na Proteinoteka.rs
            </Link>
          </div>

          <VodiciNav currentSlug="kada-piti-protein" />
        </main>
      </div>
    </>
  );
}
