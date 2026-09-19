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
    "Unesi tjelesnu masu i razinu aktivnosti — dobij dnevni cilj u gramima i top 5 najjeftinijih proteina iz ponude u Hrvatskoj. Besplatan alat, live podaci.",
  alternates: {
    canonical: "https://proteinoteka.com.hr/protein-kalkulator-hrvatska",
    languages: {
      hr: "https://proteinoteka.com.hr/protein-kalkulator-hrvatska",
      sr: "https://proteinoteka.rs/protein-kalkulator",
      "x-default": "https://proteinoteka.rs/protein-kalkulator",
    },
  },
  openGraph: {
    title: "Protein Kalkulator — Koliko Proteina Treba i Koji Kupiti | Proteinoteka",
    description: "Personalizirani cilj u gramima + preporuka iz live baze proteina u Hrvatskoj. Sortirano po cijeni po gramu proteina.",
    url: "https://proteinoteka.com.hr/protein-kalkulator-hrvatska",
    siteName: "Proteinoteka",
    locale: "hr_HR",
    type: "website",
    images: [{ url: "https://proteinoteka.com.hr/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: { card: "summary_large_image", images: ["https://proteinoteka.com.hr/opengraph-image"] },
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Kako izračunati dnevne potrebe za proteinima",
  step: [
    { "@type": "HowToStep", name: "Unesi tjelesnu masu", text: "Upiši svoju tjelesnu masu u kilogramima." },
    { "@type": "HowToStep", name: "Odaberi razinu aktivnosti", text: "Sjedilački (bez treninga), umjeren (2–3×/tjedno), aktivan (4–5×) ili veoma aktivan (6×+)." },
    { "@type": "HowToStep", name: "Odredi cilj", text: "Mršavljenje, održavanje forme ili povećanje mišićne mase." },
    { "@type": "HowToStep", name: "Pogledaj preporuku", text: "Kalkulator prikazuje dnevni cilj u gramima i top 5 najjeftinijih proteina u Hrvatskoj koji ga pokrivaju." },
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
        text: "Opća preporuka za aktivne osobe je 1,6–2,2g proteina po kilogramu tjelesne mase. Za mršavljenje, gornja granica (2,0–2,4g/kg) pomaže da se sačuva mišićna masa u kalorijskom deficitu.",
      },
    },
    {
      "@type": "Question",
      name: "Moram li uzimati protein u prahu?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ne. Proteinski prah je samo praktičan način da uneseš protein bez kuhanja. Pileća prsa, jaja, sir, mahunarke — svi su valjani izvori. Protein u prahu je koristan ako ti je teško da dnevni cilj pokriješ hranom.",
      },
    },
    {
      "@type": "Question",
      name: "Koliko košta protein mjesečno u Hrvatskoj?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ovisi o cilju i tipu. Za dnevni unos od 120g iz najjeftinijeg whey koncentrata, mjesečni trošak se kreće između 15 i 25 €. Izolat je 20–40% skuplji. Kalkulator iznad prikazuje točan mjesečni trošak za svaki preporučeni proizvod.",
      },
    },
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Početna", item: "https://proteinoteka.com.hr" },
    { "@type": "ListItem", position: 2, name: "Protein Kalkulator", item: "https://proteinoteka.com.hr/protein-kalkulator-hrvatska" },
  ],
};

export default function Page() {
  if (CURRENT_MARKET !== "hr") notFound();

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
            Unesi tjelesnu masu i cilj — dobiješ dnevni cilj u gramima i top 5 najjeftinijih proteina
            iz ponude u Hrvatskoj, sortirano po cijeni po gramu proteina.
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
              Kalkulator koristi preporučene vrijednosti iz sportske nutricionistike: unos proteina po kilogramu tjelesne
              mase, korigiran za razinu aktivnosti i cilj. Rasponi su potkrijepljeni meta-analizama (Morton i sur. 2018,
              Stokes i sur. 2018) koje pregledaju učinke na mišićnu sintezu kod različitih populacija.
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
                    ["Sjedilački",    "1,8 g/kg", "1,2 g/kg", "1,6 g/kg"],
                    ["Umjeren",       "2,0 g/kg", "1,4 g/kg", "1,8 g/kg"],
                    ["Aktivan",       "2,2 g/kg", "1,6 g/kg", "2,0 g/kg"],
                    ["Veoma aktivan", "2,4 g/kg", "1,8 g/kg", "2,2 g/kg"],
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
              Vrijednosti su okvirne. Individualni čimbenici (dob, spol, razina utreniranosti, genetika) mogu
              utjecati na optimalne vrijednosti.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Trebam li protein u prahu?</h2>
            <p className="text-[15px] leading-relaxed text-slate-700 mb-3">
              Ne mora. Proteinski prah je alat za popunjavanje razlike između onoga što jedeš i cilja.
              Ako pokriti 150g proteina dnevno hranom (pileća prsa, jaja, sir, mahunarke) nije problem,
              suplement ti nije potreban.
            </p>
            <p className="text-[15px] leading-relaxed text-slate-700">
              Kada ima smisla: aktivan raspored koji ostavlja malo vremena za kuhanje, ekonomičnost
              (protein u prahu po gramu često je jeftiniji od mesa), period odmah poslije treninga.
              Proteinoteka uspoređuje opcije po cijeni — da ne platiš više nego što treba.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Česta pitanja</h2>
          {[
            {
              q: "Zašto je unos veći za mršavljenje nego za održavanje?",
              a: "U kalorijskom deficitu tijelo poseže za mišićnom masom kao izvorom energije. Viši unos proteina signalizira tijelu da sačuva mišiće — mehanizam poznat kao &lsquo;protein sparing effect&rsquo;. Meta-analiza Helms i sur. (2014) potvrđuje da 2,3–3,1g/kg LBM sprječava gubitak mišića during agresivnog deficita.",
            },
            {
              q: "Koliko obroka s proteinima dnevno je optimalno?",
              a: "Istraživanja sugeriraju da je raspored od 3–4 obroka koji sadrže protein (20–40g po obroku) bolji od jednog ili dva velika unosa. Razlog: mišićna sinteza ima &lsquo;prag leucina&rsquo; koji se aktivira po obroku, a ne akumulira se kroz dan.",
            },
            {
              q: "Šteti li previše proteina bubrezima?",
              a: "Kod zdravih osoba bez prethodno postojeće bubrežne bolesti, visoki unos proteina (do 2,5g/kg) nije pokazao štetne učinke u longitudinalnim studijama. Ako imaš kroničnu bubrežnu bolest, posavjetuj se s liječnikom.",
            },
            {
              q: "Zašto miesečni trošak nije isti za sve proteine iste gramature?",
              a: "Ključna razlika je u sadržaju proteina. Dva praha od 1kg — jedan s 70g proteina/100g, drugi s 85g — daju različit broj grama proteina ukupno. Onaj s višim postotkom traje dulje za isti dnevni cilj, čak i ako je skuplji na etiketi.",
            },
            {
              q: "Kalkulator pokazuje 180g — to je previše?",
              a: "Za osobu od 80kg s visokim treningom i ciljem mase, 160–180g proteina dnevno je realistično. Na primjer: 300g pilećih prsa = 90g proteina, 4 jaja = 24g, 200g skute = 20g, 2 obroka proteinskog praha = 50g. Ukupno: 184g. Zahtijeva planiranje, ali nije nemoguće.",
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
            { href: "/hr-vodici/koliko-proteina-dnevno-hrvatska",    label: "Koliko proteina dnevno?" },
            { href: "/proteini-hrvatska",                            label: "Svi proteini u Hrvatskoj" },
            { href: "/whey-protein-izolat-hrvatska",                 label: "Izolat — rang lista" },
            { href: "/najjeftiniji-whey-protein-hrvatska",           label: "Najjeftiniji whey protein" },
            { href: "/hr-vodici/najbolji-protein-za-pocetnike-hrvatska", label: "Koji protein kupiti?" },
            { href: "/whey-protein-cijena",                          label: "Whey protein cijena" },
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
          Kalkulator je informativne prirode i ne zamjenjuje savjet nutricionista ili liječnika.
          Preporuke proizvoda dolaze iz live baze — cijene se ažuriraju redovito iz hrvatskih trgovina.
        </p>
      </div>
    </>
  );
}
