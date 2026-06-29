import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Biljni Protein u Srbiji 2026 — Veganski Proteini, Cene i Poređenje | Proteinoteka" },
  description:
    "Biljni i veganski proteini u Srbiji — grašak, soja, pirinač. Aktuelne cene, poređenje sa wheyem, kompletan aminokiselinski profil i šta je best value za novac.",
  alternates: { canonical: "https://proteinoteka.rs/biljni-protein-srbija" },
  openGraph: {
    title: "Biljni Protein u Srbiji 2026 — Veganski Proteini, Cene i Poređenje | Proteinoteka",
    description:
      "Grašak, soja, pirinač protein — aktuelne cene iz srpskih prodavnica, poređenje sa wheyem i saveti za kompletan aminokiselinski profil.",
    url: "https://proteinoteka.rs/biljni-protein-srbija",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
    images: [{ url: "https://proteinoteka.rs/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
};

const middleSection = (
  <div className="space-y-8">

    {/* Types comparison */}
    <section>
      <h2 className="text-xl font-bold text-slate-900 mb-4">Grašak, soja ili pirinač — koja baza i zašto</h2>
      <p className="text-[15px] leading-relaxed text-slate-700 mb-4">
        Svaka biljna baza donosi drugačiji aminokiselinski profil i cenu. Razlika nije zanemarljiva — soja protein
        ima potpuno kompletan profil kao whey, dok grašak i pirinač imaju komplementarne slabosti koje se međusobno
        poništavaju kada se kombinuju. Ovo je razlog zašto su <strong className="text-slate-800">blendovi grašak + pirinač</strong> postali
        industrijski standard za veganske proteine.
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm bg-white">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Baza</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Protein/100g</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Leucin</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Kompletnost</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Beleška</th>
            </tr>
          </thead>
          <tbody>
            {[
              { base: "Soja izolat", prot: "~90g", leucin: "~7.6%", complete: "Kompletan", note: "Jedini biljni koji sam pokriva sve aminokiseline" },
              { base: "Grašak izolat", prot: "~80g", leucin: "~8.0%", complete: "Nekompletan", note: "Visok leucin, nema dovoljno metionina" },
              { base: "Pirinač", prot: "~70–80g", leucin: "~6.9%", complete: "Nekompletan", note: "Ima metionin koji grašku nedostaje" },
              { base: "Grašak + pirinač blend", prot: "~75–85g", leucin: "~7.5%", complete: "Gotovo kompletan", note: "Industrijski standard za vegane" },
              { base: "Konoplja", prot: "~50–60g", leucin: "~5.5%", complete: "Delimičan", note: "Bogata omega-3, ali manje proteina" },
            ].map((row, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 font-semibold text-slate-800">{row.base}</td>
                <td className="py-3 px-4 text-right text-slate-700">{row.prot}</td>
                <td className="py-3 px-4 text-right text-slate-700 hidden sm:table-cell">{row.leucin}</td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${row.complete === "Kompletan" ? "bg-green-100 text-green-700" : row.complete === "Gotovo kompletan" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                    {row.complete}
                  </span>
                </td>
                <td className="py-3 px-4 text-[13px] text-slate-500">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-2">Vrednosti su okvirne i zavise od konkretnog proizvoda. Leucin % je od ukupnih proteina.</p>
    </section>

    {/* Performance vs whey */}
    <section>
      <h2 className="text-xl font-bold text-slate-900 mb-4">Da li biljni protein može da zameni whey za trening?</h2>
      <p className="text-[15px] leading-relaxed text-slate-700 mb-4">
        Kratki odgovor: <strong className="text-slate-800">da, uz blago veću porciju</strong>. Studija Tang i sar. (2009, <em>Journal of Applied Physiology</em>)
        pokazala je da soja protein stimuliše sintezu mišićnih proteina nešto slabije od whey-a odmah posle treninga —
        ali razlika se drastično smanjuje kada se gleda <strong className="text-slate-800">24-časovni oporavak</strong>, a ne samo period odmah posle
        šejka. Morton i sar. (2018) u meta-analizi 49 studija zaključuju da je ukupan dnevni unos proteina
        važniji od izvora.
      </p>
      <p className="text-[15px] leading-relaxed text-slate-700 mb-4">
        Ključna razlika je leucin — aminokiselina koja direktno aktivira sintezu mišića. Whey izolat ima ~10–11% leucina,
        grašak ~8%, soja ~7.6%. Ovo znači da za isti anabolički signal treba <strong className="text-slate-800">uzeti 5–10g više</strong> biljnog proteina
        po porciji. Ako uzimas 30g whey-a, uzmi 35–40g biljnog blenda — to je cela priča.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="font-bold text-green-800 text-sm mb-2">Prednosti biljnih proteina</h3>
          <ul className="text-sm text-green-700 space-y-1.5 leading-relaxed">
            <li>• Bez laktoze i mlečnih alergena</li>
            <li>• Pogodan za vegane i vegetarijance</li>
            <li>• Bolji za probavu kod osetljivih stomaka</li>
            <li>• Soja ima fitonutrijente i omega profile</li>
            <li>• Konoplja donosi korisne omega-3 masne kiseline</li>
          </ul>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-bold text-amber-800 text-sm mb-2">Na šta treba paziti</h3>
          <ul className="text-sm text-amber-700 space-y-1.5 leading-relaxed">
            <li>• Potrebna je veća porcija za isti leucin signal</li>
            <li>• Nekompletni profili — biraj blend ili kombiniraj izvore</li>
            <li>• Ukus — stariji biljni proteini imaju "zemljani" prizvuk</li>
            <li>• Teže se rastvaraju od whey-a</li>
            <li>• Soja — potencijalni alergen za neke osobe</li>
          </ul>
        </div>
      </div>
    </section>

    {/* Who should use */}
    <section>
      <h2 className="text-xl font-bold text-slate-900 mb-4">Ko treba da uzima biljni protein?</h2>
      <p className="text-[15px] leading-relaxed text-slate-700 mb-3">
        Biljni protein nije samo za vegane — ima smisal za svakoga ko ima <strong className="text-slate-800">intoleranciju na laktozu</strong>,
        alergiju na mlečne derivate, ili jednostavno želi da diversifikuje izvore proteina. Konzumenti koji
        prate anti-inflamatorne dijete često biraju biljne izvore zbog manjeg sadržaja zasićenih masti i
        odsustva hormona koji se mogu naći u nekim whey brendovima lošijeg kvaliteta.
      </p>
      <p className="text-[15px] leading-relaxed text-slate-700">
        Za ljude koji <strong className="text-slate-800">nisu vegani ali žele dobar ukupni unos proteina</strong>, optimalna strategija je
        kombinovanje — whey ujutro i posle treninga, biljni protein pre spavanja ili između obroka.
        Raznolikost izvora daje širi spektar aminokiselina i mikronutrijenata nego oslanjanje na jedan tip.
      </p>
    </section>

    {/* Cost context */}
    <section>
      <h2 className="text-xl font-bold text-slate-900 mb-4">Cena biljnih proteina u Srbiji 2026</h2>
      <p className="text-[15px] leading-relaxed text-slate-700 mb-4">
        Biljni proteini su istorijski bili skuplji od whey concentrate-a zbog skuplje sirovine i manjeg
        obima proizvodnje. U 2026. godini taj jaz se <strong className="text-slate-800">smanjio</strong> — dobri brendovi grašak proteina dostupni su
        u Srbiji po cenama od <strong className="text-slate-800">3.500–5.500 RSD/kg</strong>, što je poredivo sa mid-range whey concentrate opcijama.
        Soja protein izolat premium kvaliteta ide do 6.500–7.500 RSD/kg.
      </p>
      <p className="text-[15px] leading-relaxed text-slate-700">
        Za izračunavanje mesečnog troška i poređenja sa wheyem, pogledaj naš vodič o tome{" "}
        <a href="/vodici/koliko-novca-mesecno-za-proteine" className="text-[#FF9900] hover:underline font-medium">
          koliko novca mesečno treba za proteine
        </a>
        . Za ukupni dnevni unos i broj porcija, koristi{" "}
        <a href="/vodici/koliko-proteina-dnevno" className="text-[#FF9900] hover:underline font-medium">
          kalkulator proteina
        </a>
        .
      </p>
    </section>

  </div>
);

export default async function Page() {
  if (CURRENT_MARKET !== 'rs') notFound();
  const products = await fetchTopProducts({ category: "vegan", sortBy: "valueScore", limit: 20 });

  const top = products[0];

  const quickAnswer = top
    ? `Biljni proteini su odlična opcija za vegane, osobe sa intolerancijom na laktozu i sve koji žele raznovrsne izvore proteina. Trenutno best value u bazi je ${top.name}. Cene se kreću od ~3.500 do ~7.500 RSD/kg — grašak+pirinač blend pruža gotovo kompletan aminokiselinski profil uz dobru vrednost za novac.`
    : "Biljni proteini su odlična opcija za vegane i osobe sa intolerancijom na laktozu. Grašak+pirinač blend pruža gotovo kompletan aminokiselinski profil. Cene u Srbiji kreću se od ~3.500 do ~7.500 RSD/kg.";

  return (
    <SEOLandingPage
      h1="Biljni Protein u Srbiji 2026"
      intro="Grašak, soja, pirinač, konoplja — biljni proteini su sazreli do tačke gde mogu da zamene whey za većinu ciljeva. Uz blago veću porciju, efekti na mišiće su gotovo identični. Proteinoteka poredi sve dostupne biljne proteine u Srbiji sa aktuelnim cenama."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Biljni proteini — sortirani po vrednosti za novac"
      tableCaption="Pregled cena biljnih proteina u Srbiji 2026"
      currentSlug="biljni-protein-srbija"
      middleSection={middleSection}
      extraLinks={[
        { href: "/vodici/koliko-proteina-dnevno",           label: "📊 Koliko proteina dnevno?" },
        { href: "/vodici/da-li-protein-goji",               label: "🔬 Da li protein goji?" },
        { href: "/vodici/protein-za-mrsavljenje",           label: "🔥 Protein za mršavljenje" },
        { href: "/vodici/whey-isolate-vs-concentrate",      label: "⚗️ Izolat vs Concentrate" },
        { href: "/vodici/koliko-novca-mesecno-za-proteine", label: "💸 Mesečni trošak proteina" },
        { href: "/kategorija/vegan",                        label: "🌱 Svi biljni proteini" },
      ]}
      disclaimer="Napomena: Ovaj tekst je isključivo informativnog karaktera i ne predstavlja medicinski savet. Podaci o proteinskom sadržaju su okvirni. Cene se ažuriraju svakodnevno iz srpskih prodavnica."
      faqs={[
        {
          q: "Da li biljni proteini imaju kompletan aminokiselinski profil?",
          a: "Soja protein ima kompletan profil svih esencijalnih aminokiselina, sličan whey-u. Grašak protein je bogat BCAA ali mu nedostaje metionin — kombinacija grašak+pirinač protein nadoknađuje ovaj nedostatak. Moderni blendovi biljnih proteina su upravo dizajnirani za kompletan profil.",
        },
        {
          q: "Da li je biljni protein dovoljno dobar za izgradnju mišića?",
          a: "Da — meta-analiza Morton i sar. (2018) potvrđuje da su efekti na hipertrofiju slični kada se unosi dovoljno proteina ukupno. Uzmi 5–10g veću porciju od whey-a da kompenzuješ manji sadržaj leucina, i dnevni ukupni unos ostaje isti.",
        },
        {
          q: "Koji biljni protein ima najbolji ukus u Srbiji?",
          a: "Ukus je subjektivan, ali moderni grašak izolati premium brendova u čokoladnom ili vanila ukusu su značajno poboljšani. Stariji ili jeftiniji biljni proteini imaju karakteristički 'zemljani' ukus. Preporučujemo čitanje recenzija pre kupovine.",
        },
        {
          q: "Koja je razlika između proteina od graška, soje i pirinča?",
          a: "Grašak: visok BCAA, nije alergen za većinu, blagi ukus, nema dovoljno metionina. Soja: kompletan aminokiselinski profil, potencijalni alergen, sadrži fitoestrogene. Pirinač: hipoalergen, manje proteina, ali ima metionin koji grašku nedostaje. Blendovi od grašak+pirinač nude najkompletniji profil.",
        },
        {
          q: "Koliko košta biljni protein u Srbiji?",
          a: "Cene biljnih proteina u Srbiji kreću se od ~3.500 do ~7.500 RSD/kg. Grašak protein je generalno jeftiniji od soja protein izolata. Uvek gledaj cenu po gramu proteina — veće pakovanje je obično isplativije.",
        },
        {
          q: "Mogu li osobe sa alergijom na gluten piti biljni protein?",
          a: "Većina proteina od graška, soje i pirinča je prirodno bez glutena. Ako imaš celijakiju, pažljivo čitaj deklaraciju i traži oznaku 'certified gluten-free' — unakrsna kontaminacija u postrojenjima je moguća.",
        },
      ]}
    />
  );
}
