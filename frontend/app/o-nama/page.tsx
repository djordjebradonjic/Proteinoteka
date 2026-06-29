import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { hreflangAlternates } from "@/lib/hreflang";

export const revalidate = 86400;

const isHR = CURRENT_MARKET === "hr";
const domain = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;

export const metadata: Metadata = isHR
  ? {
      title: "O Proteinoteci | Usporedba cijena proteina u Hrvatskoj",
      description:
        "Saznaj zašto je nastala Proteinoteka i kako pokušavamo olakšati usporedbu cijena whey proteina i suplemenata u Hrvatskoj.",
      alternates: { canonical: `${domain}/o-nama`, languages: hreflangAlternates("/o-nama") },
      openGraph: {
        title: "O Proteinoteci | Usporedba cijena proteina u Hrvatskoj",
        description:
          "Saznaj zašto je nastala Proteinoteka i kako pokušavamo olakšati usporedbu cijena whey proteina i suplemenata u Hrvatskoj.",
        url: `${domain}/o-nama`,
        siteName: "Proteinoteka",
        locale: "hr_HR",
        type: "website",
        images: [{ url: `${domain}/opengraph-image`, width: 1200, height: 630, alt: "Proteinoteka" }],
      },
    }
  : {
      title: "O Proteinoteci | Poređenje cena proteina u Srbiji",
      description:
        "Saznaj zašto je nastala Proteinoteka i kako pokušavamo da olakšamo poređenje cena whey proteina i suplemenata u Srbiji.",
      alternates: { canonical: `${domain}/o-nama`, languages: hreflangAlternates("/o-nama") },
      openGraph: {
        title: "O Proteinoteci | Poređenje cena proteina u Srbiji",
        description:
          "Saznaj zašto je nastala Proteinoteka i kako pokušavamo da olakšamo poređenje cena whey proteina i suplemenata u Srbiji.",
        url: `${domain}/o-nama`,
        siteName: "Proteinoteka",
        locale: "sr_RS",
        type: "website",
        images: [{ url: `${domain}/opengraph-image`, width: 1200, height: 630, alt: "Proteinoteka" }],
      },
    };

const RS_RELATED_LINKS = [
  { label: "Najbolji whey protein u Srbiji", href: "/najbolji-whey-protein-srbija" },
  { label: "Najjeftiniji whey protein",      href: "/najjeftiniji-whey-protein"    },
  { label: "Whey protein cena",              href: "/whey-protein-cena"            },
  { label: "Vodiči",                         href: "/vodici"                       },
  { label: "Kako računamo Value Score",      href: "/kako-racunamo-value-score"    },
];

const HR_RELATED_LINKS = [
  { label: "Kako računamo Value Score", href: "/kako-racunamo-value-score" },
  { label: "Kontakt",                   href: "/kontakt"                   },
];

const RELATED_LINKS = isHR ? HR_RELATED_LINKS : RS_RELATED_LINKS;

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "O Proteinoteci",
      url: `${domain}/o-nama`,
      description: isHR
        ? "Proteinoteka je platforma za usporedbu cijena proteinskih suplemenata u Hrvatskoj."
        : "Proteinoteka je platforma za poređenje cena proteinskih suplemenata u Srbiji.",
      publisher: { "@type": "Organization", name: "Proteinoteka", url: domain },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: isHR ? "Početna" : "Početna", item: domain },
        { "@type": "ListItem", position: 2, name: "O nama", item: `${domain}/o-nama` },
      ],
    },
  ];

  if (isHR) {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="min-h-screen bg-slate-50">
          <Header />
          <main className="max-w-2xl mx-auto px-4 py-10">
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8">
              <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
              <span>/</span>
              <span className="text-slate-600">O nama</span>
            </nav>

            <div className="mb-10">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-2">
                O Proteinoteci
              </h1>
              <p className="text-lg text-slate-500">Zašto smo napravili ovu stranicu</p>
            </div>

            <section className="mb-10">
              <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
                <p>
                  Svaki put kad smo htjeli kupiti whey protein, završavali smo s osam otvorenih
                  kartica. GymBeam, MyProtein, Polleo Sport, Proteka, Nutrition Shop — i svaki ima
                  drugačiju cijenu, drugačiju veličinu pakiranja, drugačije akcije koje možda nisu
                  ni prave akcije. Jedna trgovina prikaže "–20%" ali od cijene koja je već bila
                  napuhana. Drugdje nema popusta, ali je puna cijena jeftinija od svugdje.
                </p>
                <p>
                  Ručno uspoređivati sve to traje. Moraš otvoriti deklaraciju, preračunati cijenu po
                  gramu proteina, provjeriti koliko pakiranje zapravo ima — i na kraju ionako nisi
                  siguran jesi li napravio pravi izbor ili si samo brže odustao.
                </p>
                <p>
                  Napravili smo Proteinoteku jer smo htjeli alat koji ovo radi umjesto nas. Koji
                  automatski prikuplja cijene, računa koliko EUR plaćaš po gramu proteina i prikazuje
                  sve na jednom mjestu.
                </p>
              </div>

              <blockquote className="mt-7 border-l-4 border-[#FF9900] pl-5 py-1">
                <p className="text-base italic text-slate-600 leading-relaxed">
                  "Htjeli smo jedno mjesto gdje vidimo sve cijene, bez reklama, bez sponzoriranih
                  rangiranja, bez gubljenja vremena."
                </p>
              </blockquote>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Što Proteinoteka radi</h2>
              <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
                <p>
                  Stranica automatski prikuplja cijene proteina iz najvećih hrvatskih trgovina —
                  whey concentrate, whey isolate, kazein i ostale suplemente — i prikazuje ih na
                  jednom mjestu.
                </p>
                <p>
                  Za svaki proizvod računamo{" "}
                  <Link href="/kako-racunamo-value-score" className="font-semibold text-[#FF9900] hover:underline">
                    Value Score
                  </Link>{" "}
                  — pokazatelj koji uzima u obzir cijenu, sadržaj proteina i veličinu pakiranja, i
                  daje ti broj koji govori koliko vrijediš za novac. Nije savršen, ali je bolji od
                  gledanja samo u ukupnu cijenu.
                </p>
                <p>
                  Cilj je jedan: da za manje od minute vidiš koji protein trenutno nudi najviše za
                  tvoj novac, u kojoj trgovini, i koliko košta po gramu proteina.
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Transparentnost</h2>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 text-[15px] leading-relaxed text-slate-700">
                <p>
                  <strong className="text-slate-900">Proteinoteka ne prodaje proizvode.</strong> Nismo
                  trgovina. Prikazujemo cijene i linkamo do trgovina gdje možeš kupiti.
                </p>
                <p>
                  Cijene se mogu promijeniti između posljednjeg automatskog prikupljanja i trenutka
                  kad klikneš — uvijek provjeri aktualnu cijenu direktno na stranici trgovine prije
                  kupnje.
                </p>
                <p>
                  Rangiranja ne mijenjamo ručno i nijedna trgovina ne plaća da bude bolje rangirana.
                  Value Score računa se isključivo na temelju podataka o cijeni i nutritivnom profilu.
                </p>
                <p>
                  Neki linkovi na stranici u budućnosti mogu postati affiliate linkovi — što znači da
                  možemo zaraditi malu proviziju bez ikakvih dodatnih troškova za tebe. Ako do toga
                  dođe, bit će jasno naznačeno.
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Zašto ovo uopće postoji</h2>
              <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
                <p>
                  Suplementi nisu jeftini. Ako kupuješ whey jednom mjesečno, razlika od 5–10 EUR
                  između trgovina znači 60–120 EUR godišnje — za potpuno isti proizvod. To nije sitnica.
                </p>
                <p>
                  U Hrvatskoj nije postojao dobar alat za usporedbu cijena suplemenata koji bi bio
                  ažuran, objektivan i lak za korištenje. Većina usporedbi su stari forumski postovi
                  ili sponzorirani članci koji preporučuju ono za što dobivaju proviziju.
                </p>
                <p>
                  Htjeli smo nešto što zaista funkcionira. Stranica je u razvoju i podaci nisu uvijek
                  savršeni — ali smjer je jasan.
                </p>
              </div>
            </section>

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

  // RS version
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-10">

          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <span className="text-slate-600">O nama</span>
          </nav>

          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-2">
              O Proteinoteci
            </h1>
            <p className="text-lg text-slate-500">Zašto sam napravio ovaj sajt</p>
          </div>

          <section className="mb-10">
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Svaki put kad sam hteo da kupim whey protein, završavao sam sa osam otvorenih tabova.
                Pansport, Supplementshop, Proteini.si, Proteinbox, Ogistrashop, FitLab, GymBeam, MyProtein — i svaki ima drugačiju
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

            <blockquote className="mt-7 border-l-4 border-[#FF9900] pl-5 py-1">
              <p className="text-base italic text-slate-600 leading-relaxed">
                "Hteo sam jedno mesto gde vidim sve cene, bez reklama, bez sponzorisanih rankinga,
                bez gubljenja vremena."
              </p>
            </blockquote>
          </section>

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
