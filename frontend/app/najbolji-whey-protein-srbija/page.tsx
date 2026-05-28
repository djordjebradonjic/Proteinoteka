import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import Link from "next/link";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Najbolji Whey Protein u Srbiji 2025 — Top 10 po vrednosti | Proteinoteka",
  description:
    "Top 10 whey proteina u Srbiji za 2025. rangiranih po value score-u. Poredimo cenu, protein na 100g i nutritivni profil iz svih prodavnica — i odgovaramo kome koji tip odgovara.",
  alternates: { canonical: "https://proteinoteka.rs/najbolji-whey-protein-srbija" },
  openGraph: {
    title: "Najbolji Whey Protein u Srbiji 2025 — Top 10 | Proteinoteka",
    description:
      "Top 10 whey proteina u Srbiji rangirani po value score-u. Cena, protein/100g i nutritivni profil iz svih prodavnica na jednom mestu.",
    url: "https://proteinoteka.rs/najbolji-whey-protein-srbija",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

const USE_CASE_ROWS = [
  {
    goal: "Početnik / rekreativac",
    type: "Whey Concentrate",
    href: "/kategorija/whey-concentrate",
    reason: "Odlična vrednost za novac, visokih 70–80g proteina/100g, lako se nađe u akciji.",
  },
  {
    goal: "Mršavljenje",
    type: "Whey Isolate",
    href: "/kategorija/whey-isolate",
    reason: "Manje kalorija, masti i šećera nego concentrate. Čistiji protein uz nizak kalorijskim unos.",
  },
  {
    goal: "Izgradnja mase",
    type: "Blend",
    href: "/kategorija/blend",
    reason: "Mešavina whey-a i kazeina daje i brzu i produženu apsorpciju tokom celog dana.",
  },
  {
    goal: "Intolerancija na laktozu",
    type: "Whey Isolate",
    href: "/kategorija/whey-isolate",
    reason: "Proces filtracije uklanja gotovo svu laktozu — obično ispod 1g na porciju.",
  },
  {
    goal: "Pre spavanja",
    type: "Kazein",
    href: "/kategorija/kazein",
    reason: "Sporo se vari 6–8 sati, što sprečava katabolizam mišića tokom noći.",
  },
  {
    goal: "Vegani i biljna ishrana",
    type: "Biljni protein",
    href: "/kategorija/biljni-protein",
    reason: "Kombinacija grašak + pirinač proteina pruža kompletan aminokiselinski profil.",
  },
];

function UseCaseSection() {
  return (
    <section>
      <h2 className="text-xl font-extrabold text-slate-900 mb-2">
        Kome koji whey protein odgovara?
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Nema jednog "najboljeg" proteina za sve — zavisi od cilja, budžeta i tolerancije na laktozu.
      </p>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cilj / situacija</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Preporučeni tip</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Zašto</th>
              </tr>
            </thead>
            <tbody>
              {USE_CASE_ROWS.map((row) => (
                <tr key={row.goal} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 active:bg-slate-50 transition-colors">
                  <td className="py-3 px-5 font-semibold text-slate-900 align-top">{row.goal}</td>
                  <td className="py-3 px-4 align-top">
                    <Link
                      href={row.href}
                      className="font-bold text-[#FF9900] hover:underline active:underline whitespace-nowrap"
                    >
                      {row.type}
                    </Link>
                  </td>
                  <td className="py-3 px-5 text-slate-500 text-xs leading-relaxed hidden md:table-cell align-top">
                    {row.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            * Preporuke su zasnovane na nutritivnim profilima i price/protein raciju iz aktuelne baze. Klikni na tip za pregled trenutnih cena.
          </p>
        </div>
      </div>
    </section>
  );
}

export default async function Page() {
  const products = await fetchTopProducts({ sortBy: "valueScore", limit: 15 });

  const top = products[0];
  const cheapest = products.length > 0
    ? [...products].sort((a, b) => (a.numericPrice ?? 0) - (b.numericPrice ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Trenutno, ${top.name} (${top.storeName}) ima najviši value score od ${top.valueScore?.toFixed(1)}/10 po ceni ${top.price} — što ga čini najboljim izborom za odnos cene i kvaliteta. Ako ti je budžet prioritet, ${cheapest?.name ?? top.name} je najjeftinija opcija u listi za ${cheapest?.price ?? top.price}.`
    : "";

  return (
    <SEOLandingPage
      h1="Najbolji Whey Protein u Srbiji 2025"
      intro={`Analizirali smo ${products.length > 0 ? `${products.length}+` : "sve"} whey proteine dostupne u srpskim prodavnicama. Poredimo cenu, sadržaj proteina na 100g, šećere, masti i ukupnu vrednost — i rangiramo koji nudi najviše za tvoj novac u 2025. godini.`}
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Top 10 whey proteina u Srbiji 2025 — rangirani po vrednosti za novac"
      tableCaption="Whey proteini u Srbiji — rang lista po value score 2025"
      currentSlug="najbolji-whey-protein-srbija"
      middleSection={<UseCaseSection />}
      faqs={[
        {
          q: "Koji je whey protein #1 u Srbiji po value score-u trenutno?",
          a: top
            ? `Prema trenutnim podacima, ${top.name} od ${top.brand ?? "odabranog brenda"} vodi rang listu sa score-om ${top.valueScore?.toFixed(1)}/10 i cenom ${top.price}. Score se ažurira nedeljno kako bi odražavao aktuelne cene — redosled se može promeniti.`
            : "Value score se ažurira nedeljno — pogledaj rang listu iznad za trenutni #1.",
        },
        {
          q: "Koji whey protein je best za početnike?",
          a: "Za početnike je whey concentrate obično optimalan izbor — daje 70–80g proteina na 100g, lako se nađe po pristupačnoj ceni (2.500–5.500 RSD/kg) i razlika u efikasnosti u poređenju sa skupljim tipovima je zanemarljiva za rekreativne treninge. Počni sa 1kg pakovanjem dok ne pronađeš ukus i brend koji ti odgovara.",
        },
        {
          q: "Koji whey protein je best za mršavljenje?",
          a: "Whey isolate je bolji izbor za mršavljenje zbog nižeg sadržaja masti, šećera i kalorija uz visok procenat proteina (85–95g/100g). Proteini generalno pomažu sitosti i očuvanju mišića tokom kalorijskog deficita. Gledaj na etiketi da nema dodanog šećera ni maltoze.",
        },
        {
          q: "Šta tačno znači 'najbolji' whey protein?",
          a: "Zavisi od toga šta tražiš. Ako je cilj najveća vrednost za novac — gleda se koliko grama proteina dobijaš po dinaru, uz nutritivni profil (šećeri, masti, čistoća). Ako je cilj cena — biraš najjeftiniji u kilogramima. Na Proteinoteci rangiramo po value score koji kombinuje oba faktora, plus reputaciju brenda i tip proteina.",
        },
        {
          q: "Šta je Value Score i kako se računa?",
          a: "Value Score je ocena od 0 do 10 koju računamo za svaki protein. Uzima u obzir cenu po gramu proteina u poređenju sa prosekom kategorije (40% težine), čistoću proteina na 100g (20%), tip i svarljivost proteina (15%), sastojke poput šećera i aditiva (15%) i reputaciju brenda (10%). Ako nedostaje neki podatak, score se umanjuje.",
        },
        {
          q: "Da li skuplji protein automatski znači bolji?",
          a: "Ne. Cena je samo jedan od faktora. Mnogi skupi proteini imaju visok marketing budget, a ne nužno bolji sastav. Gledaj sadržaj proteina na 100g, šećere, masti i cenu po gramu proteina — to su brojevi koji ne lažu. Na Proteinoteci možeš sortirati po tim parametrima odvojeno.",
        },
        {
          q: "Da li domaći brendovi mogu konkurisati inostranim?",
          a: "Da, i to sve češće. Domaći brendovi poput Fitness Formula, Olimp i sličnih često imaju konkurentan price/protein racio jer nemaju troškove uvoza i carine. S druge strane, međunarodni brendovi (Optimum Nutrition, Dymatize, MyProtein) imaju više nezavisnih laboratorijskih testova koji potvrđuju deklarisani sastav.",
        },
        {
          q: "Koliko često se ažurira rang lista?",
          a: "Scraperi prolaze kroz sve prodavnice jednom nedeljno (ponedeljkom u 3 ujutro). Ako se cena promeni, value score se automatski preračunava. To znači da rang lista odražava stvarno stanje tržišta, ne zastarele podatke.",
        },
      ]}
    />
  );
}
