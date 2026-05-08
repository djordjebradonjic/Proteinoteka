import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "O Proteinoteci | Poređenje cena proteina u Srbiji",
  description:
    "Saznaj zašto je nastala Proteinoteka i kako pokušavamo da olakšamo poređenje cena whey proteina i suplemenata u Srbiji.",
  alternates: { canonical: "https://proteinoteka.rs/o-nama" },
  openGraph: {
    title: "O Proteinoteci | Poređenje cena proteina u Srbiji",
    description:
      "Saznaj zašto je nastala Proteinoteka i kako pokušavamo da olakšamo poređenje cena whey proteina i suplemenata u Srbiji.",
    url: "https://proteinoteka.rs/o-nama",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

const BASE = "https://proteinoteka.rs";

const RELATED_LINKS = [
  { label: "Najbolji whey protein u Srbiji",  href: "/najbolji-whey-protein-srbija"  },
  { label: "Najjeftiniji whey protein",       href: "/najjeftiniji-whey-protein"     },
  { label: "Whey protein cena",              href: "/whey-protein-cena"             },
  { label: "Vodiči",                          href: "/vodici"                        },
  { label: "Kako računamo Value Score",       href: "/kako-racunamo-value-score"     },
];

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "O Proteinoteci",
      url: `${BASE}/o-nama`,
      description:
        "Proteinoteka je platforma za poređenje cena proteinskih suplemenata u Srbiji.",
      publisher: { "@type": "Organization", name: "Proteinoteka", url: BASE },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Početna", item: BASE },
        { "@type": "ListItem", position: 2, name: "O nama",  item: `${BASE}/o-nama` },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-10">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <span className="text-slate-600">O nama</span>
          </nav>

          {/* H1 */}
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-2">
              O Proteinoteci
            </h1>
            <p className="text-lg text-slate-500">Zašto sam napravio ovaj sajt</p>
          </div>

          {/* Section 1 — Personal story */}
          <section className="mb-10">
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Svaki put kad sam hteo da kupim whey protein, završavao sam sa pet otvorenih tabova.
                Pansport, Supplementshop, Proteini.si, Proteinbox, Ogistrashop — i svaki ima drugačiju
                cenu, drugačiju veličinu pakovanja, drugačije akcije koje možda nisu ni prave akcije.
                Neka prodavnica prikaže "–20%" ali od cene koja je već bila napumpana. Drugde nema popusta
                ali je puna cena jeftinija od svuda.
              </p>
              <p>
                Ručno porediti sve to traje. Moraš da otvoriš deklaraciju, preračunaš cenu po gramu proteina,
                provetiš koliko pakovanje zapravo ima — i na kraju ionako nisi siguran da li si napravio
                pravi izbor ili si samo brže odustao.
              </p>
              <p>
                Nije mi bila jasna ni razlika u ceni za isti brend između različitih prodavnica —
                ponekad i 400–600 dinara za potpuno isti proizvod. To je novac.
              </p>
              <p>
                Napravio sam Proteinoteku jer sam hteo alat koji ovo radi umesto mene. Koji automatski
                prikuplja cene, računa koliko RSD plaćaš po gramu proteina i prikazuje sve na jednom mestu.
                Uglavnom sam ga napravio za sebe. A onda mi se učinilo da bi mogao biti koristan i drugima.
              </p>
            </div>

            {/* Pull quote */}
            <blockquote className="mt-7 border-l-4 border-[#FF9900] pl-5 py-1">
              <p className="text-base italic text-slate-600 leading-relaxed">
                "Hteo sam jedno mesto gde vidim sve cene, bez reklama, bez sponzorisanih rankinga,
                bez gubljenja vremena."
              </p>
            </blockquote>
          </section>

          {/* Section 2 — What Proteinoteka does */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Šta Proteinoteka radi</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Sajt automatski prikuplja cene proteina iz više srpskih i regionalnih prodavnica —
                whey concentrate, whey isolate, gainere, kazein i ostale suplemente — i prikazuje
                ih na jednom mestu.
              </p>
              <p>
                Za svaki proizvod računamo{" "}
                <Link href="/kako-racunamo-value-score" className="font-semibold text-[#FF9900] hover:underline">
                  Value Score
                </Link>{" "}
                — pokazatelj koji uzima u obzir cenu, sadržaj proteina i veličinu pakovanja, i daje ti
                broj koji govori koliko vrediš za novac. Nije savršen, ali je bolji od gledanja
                samo u ukupnu cenu.
              </p>
              <p>
                Cilj je jedan: da za manje od minut vidiš koji protein trenutno nudi
                najviše za tvoj novac, u kojoj prodavnici, i koliko košta po gramu proteina.
              </p>
            </div>
          </section>

          {/* Section 3 — Transparency */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Transparentnost</h2>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                <strong className="text-slate-900">Proteinoteka ne prodaje proizvode.</strong> Nismo
                prodavnica. Prikazujemo cene i linkujemo do prodavnica gde možeš da kupiš.
              </p>
              <p>
                Cene se mogu promeniti između poslednjeg automatskog prikupljanja i trenutka kad
                klikneš — uvek proveri aktuelnu cenu direktno na sajtu prodavnice pre kupovine.
              </p>
              <p>
                Rankinge ne menjamo ručno i nijedna prodavnica ne plaća da bude bolje rangirana.
                Value Score se računa isključivo na osnovu podataka o ceni i nutritivnom profilu.
              </p>
              <p>
                Neki linkovi na sajtu u budućnosti mogu postati affiliate linkovi — što znači da
                možemo da zaradimo malu proviziju bez ikakvih dodatnih troškova za tebe. Ako do
                toga dođe, biće jasno naznačeno. Trenutno to nije slučaj.
              </p>
            </div>
          </section>

          {/* Section 4 — Why this exists */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Zašto ovo uopšte postoji</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Suplementi nisu jeftini. Ako kupuješ whey jednom mesečno, razlika od 500 dinara
                između prodavnica znači 6.000 dinara godišnje — za potpuno isti proizvod.
                To nije sitnica.
              </p>
              <p>
                U Srbiji nije postojao dobar alat za poređenje cena suplemenata koji bi bio ažuran,
                objektivan i lak za korišćenje. Većina poređenja su stari forumski postovi ili
                sponzorisani članci koji preporučuju ono za šta dobijaju proviziju.
              </p>
              <p>
                Hteo sam nešto što zaista funkcioniše. Još uvek nisam zadovoljan svim aspektima —
                sajt je u razvoju i podaci nisu uvek savršeni — ali pravac je jasan.
              </p>
            </div>
          </section>

          {/* Section 5 — Related links */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Pogledaj i</h2>
            <div className="flex flex-wrap gap-3">
              {RELATED_LINKS.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm"
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center">
            <p className="text-base leading-relaxed mb-4">
              Pronađi koji protein trenutno nudi najviše za tvoj novac.
            </p>
            <Link
              href="/?sort=valueScore,desc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Pogledaj sve proteine →
            </Link>
          </div>

        </main>
      </div>
    </>
  );
}
