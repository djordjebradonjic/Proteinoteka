import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import Header from "@/components/Header";
import Link from "next/link";
import { ProteinCalculator } from "@/components/seo/ProteinCalculator";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: { absolute: "Protein Kalkulator — Koliko Proteina Treba | Proteinoteka" },
  description:
    "Unesi kilažu i nivo aktivnosti — dobij dnevni cilj u gramima i top 5 najjeftinijih proteina iz srpske ponude koji ga pokrivaju. Besplatan alat, live podaci.",
  alternates: {
    canonical: "https://proteinoteka.rs/protein-kalkulator",
    languages: {
      sr: "https://proteinoteka.rs/protein-kalkulator",
      hr: "https://proteinoteka.com.hr/protein-kalkulator-hrvatska",
      "x-default": "https://proteinoteka.rs/protein-kalkulator",
    },
  },
  openGraph: {
    title: "Protein Kalkulator — Koliko Proteina Treba i Koji da Kupiš | Proteinoteka",
    description: "Personalizovani cilj u gramima + preporuka iz live baze proteina u Srbiji. Sortirano po ceni po gramu proteina.",
    url: "https://proteinoteka.rs/protein-kalkulator",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
    images: [{ url: "https://proteinoteka.rs/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: { card: "summary_large_image", images: ["https://proteinoteka.rs/opengraph-image"] },
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Kako izračunati dnevne potrebe za proteinima",
  step: [
    { "@type": "HowToStep", name: "Unesi telesnu masu", text: "Upiši svoju telesnu masu u kilogramima." },
    { "@type": "HowToStep", name: "Odaberi nivo aktivnosti", text: "Sedentarni (bez treninga), umjeren (2–3×/nedeljno), aktivan (4–5×) ili veoma aktivan (6×+)." },
    { "@type": "HowToStep", name: "Odredi cilj", text: "Mršavljenje, održavanje forme ili povećanje mišićne mase." },
    { "@type": "HowToStep", name: "Pogledaj preporuku", text: "Kalkulator prikazuje dnevni cilj u gramima i top 5 najjeftinijih proteina u Srbiji koji ga pokrivaju." },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Koliko grama proteina treba dnevno?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Opšta preporuka za aktivne osobe je 1.6–2.2g proteina po kilogramu telesne mase. Za mršavljenje, gornja granica (2.0–2.4g/kg) pomaže da se sačuva mišićna masa u kalorijskom deficitu. Za rekreativce bez specifičnog cilja, 1.2–1.4g/kg je dovoljna osnova.",
      },
    },
    {
      "@type": "Question",
      name: "Da li morate uzimati protein u prahu?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ne. Proteinski prah je samo praktičan način da uneseš protein bez kuhanja. Pileća prsa, jaja, sir, leguminoze — svi su validni izvori. Protein u prahu je koristan ako ti je teško da dnevni cilj pokriješ hranom.",
      },
    },
    {
      "@type": "Question",
      name: "Koliko košta mesečno protein u Srbiji?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Zavisi od cilja i tipa. Za dnevni unos od 120g iz najjeftinijeg whey koncentrata, mesečni trošak se kreće između 1.500 i 2.500 RSD. Izolat je 20–40% skuplji. Kalkulator iznad prikazuje tačan mesečni trošak za svaki preporučeni proizvod.",
      },
    },
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Početna", item: "https://proteinoteka.rs" },
    { "@type": "ListItem", position: 2, name: "Protein Kalkulator", item: "https://proteinoteka.rs/protein-kalkulator" },
  ],
};

export default function Page() {
  if (CURRENT_MARKET !== "rs") notFound();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Header />

      {/* Hero */}
      <div className="bg-[#131921] text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-5" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <span className="text-slate-300">Protein Kalkulator</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
            Protein Kalkulator
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
            Unesi kilažu i cilj — dobijaš dnevni cilj u gramima i top 5 najjeftinijih proteina
            iz srpske ponude koji ga pokrivaju, sortirano po ceni po gramu proteina.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* Calculator — client component */}
        <ProteinCalculator />

        {/* Context section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Kako se računa dnevni cilj</h2>
            <p className="text-[15px] leading-relaxed text-slate-700 mb-3">
              Kalkulator koristi preporučene vrednosti iz sportske nutricionistike: unos proteina po kilogramu telesne
              mase, korigovan za nivo aktivnosti i cilj. Nije arbitrarna vrednost — opsezi su potkrepljeni
              meta-analizama (Morton i sar. 2018, Stokes i sar. 2018) koje pregledaju efekte na mišićnu
              sintezu kod različitih populacija.
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm bg-white">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Aktivnost</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mršavljenje</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Održavanje</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Masa</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Sedentarni",    "1.8 g/kg", "1.2 g/kg", "1.6 g/kg"],
                    ["Umjeren",       "2.0 g/kg", "1.4 g/kg", "1.8 g/kg"],
                    ["Aktivan",       "2.2 g/kg", "1.6 g/kg", "2.0 g/kg"],
                    ["Veoma aktivan", "2.4 g/kg", "1.8 g/kg", "2.2 g/kg"],
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-800">{row[0]}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{row[1]}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{row[2]}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Vrednosti su okvirne. Individualni faktori (starost, pol, nivo treniranosti, genetika) mogu uticati
              na optimalne vrednosti za tvoj slučaj.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Treba li mi protein u prahu?</h2>
            <p className="text-[15px] leading-relaxed text-slate-700 mb-3">
              Ne mora. Proteinski prah je alatka za popunjavanje razlike između onoga što jedeš i cilja — ništa više.
              Ako pokrivač 150g proteina dnevno iz hrane (pileća prsa, jaja, sir, leguminoze) nije problem,
              suplement ti nije potreban.
            </p>
            <p className="text-[15px] leading-relaxed text-slate-700">
              Kada ima smisla: aktivan raspored koji ostavlja malo vremena za kuvanje, ekonomičnost
              (protein u prahu po gramu često je jeftiniji od mesa), period odmah posle treninga kada
              tečni obrok ima prednost. Proteinoteka poredi opcije po ceni — da ne plaćaš više nego što treba.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Česta pitanja</h2>
          {[
            {
              q: "Zašto je unos veći za mršavljenje nego za održavanje?",
              a: "U kalorijskom deficitu telo poseže za mišićnom masom kao izvorom energije. Viši unos proteina signalizira telu da sačuva mišiće — mehanizam koji se zove &ldquo;protein sparing effect&rdquo;. Meta-anliza Helms i sar. (2014) potvrđuje da 2.3–3.1g/kg LBM sprečava gubitak mišića tokom agresivnog deficita.",
            },
            {
              q: "Koliko porcija proteina dnevno je optimalno?",
              a: "Istraživanja sugerišu da je raspored od 3–4 obroka koji sadrže protein (20–40g po obroku) bolji od jednog ili dva velika unosa. Razlog: mišićna sinteza ima &ldquo;prag leucina&rdquo; koji se aktivira po obroku, a ne akumulira se tokom dana.",
            },
            {
              q: "Da li previše proteina škodi bubrezima?",
              a: "Kod zdravih osoba bez preegzistirajuće bubrežne bolesti, visok unos proteina (do 2.5g/kg) nije pokazao štetne efekte u longitudinalnim studijama. Ako imaš hroničnu bubrežnu bolest, konsultuj se sa lekarom pre bilo kakve promene u ishrani.",
            },
            {
              q: "Šta ako mi kalkulator pokaže 200g dnevno — to je previše?",
              a: "Za osobu od 90kg sa visokim treningom i ciljem mase, 180–200g proteina dnevno je realistica. Na primer: 300g pilećih prsa = 90g proteina, 4 jajeta = 24g, 200g skute = 20g, 2 šejkera = 50g. Ukupno: 184g. Nije nemoguće, ali zahteva planiranje.",
            },
            {
              q: "Zašto mesečni trošak nije isti za sve proteine iste gramature?",
              a: "Ključna razlika je u sadržaju proteina. Dva praška od 1kg — jedan sa 70g proteina/100g, drugi sa 85g — daju različit broj grama proteina ukupno. Onaj sa višim procentom traje duže za isti dnevni cilj, čak i ako je skuplji na etiketi.",
            },
          ].map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 text-[15px] mb-2">{faq.q}</h3>
              <p
                className="text-[14px] text-slate-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: faq.a }}
              />
            </div>
          ))}
        </section>

        {/* Cross links */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: "/vodici/koliko-proteina-dnevno",    label: "Koliko proteina dnevno?" },
            { href: "/proteini-srbija",                  label: "Svi proteini u Srbiji" },
            { href: "/whey-protein-izolat",              label: "Izolat — rang lista" },
            { href: "/najjeftiniji-whey-protein",        label: "Najjeftiniji whey protein" },
            { href: "/vodici/koji-whey-protein-kupiti",  label: "Koji protein kupiti?" },
            { href: "/whey-protein-cena",                label: "Whey protein cena" },
          ].map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="text-center text-sm font-medium bg-white border border-slate-200 rounded-xl py-3 px-4 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors text-slate-700"
            >
              {l.label}
            </Link>
          ))}
        </section>

        <p className="text-xs text-slate-400 text-center leading-relaxed">
          Kalkulator je informativne prirode i ne zamenjuje savet nutricioniste ili lekara.
          Preporuke proizvoda dolaze iz live baze — cene se ažuriraju redovno iz srpskih prodavnica.
        </p>
      </div>
    </>
  );
}
