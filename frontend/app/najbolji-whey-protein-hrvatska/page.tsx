import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import Link from "next/link";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Najbolji Whey Protein u Hrvatskoj 2026 — Top 10 po vrijednosti | Proteinoteka" },
  description:
    "Koji whey protein je vrijednost za novac u Hrvatskoj 2026? Rangiramo proteine po cijeni, čistoći i sastojcima — i kažemo koji odgovara tvom cilju i proračunu.",
  alternates: { canonical: "https://proteinoteka.com.hr/najbolji-whey-protein-hrvatska" },
  openGraph: {
    title: "Najbolji Whey Protein u Hrvatskoj 2026 — Top 10 | Proteinoteka",
    description:
      "Top 10 whey proteina u Hrvatskoj rangirani po value score-u. Cijena, protein/100g i nutritivni profil iz svih trgovina na jednom mjestu.",
    url: "https://proteinoteka.com.hr/najbolji-whey-protein-hrvatska",
    siteName: "Proteinoteka",
    locale: "hr_HR",
    type: "website",
    images: [{ url: "https://proteinoteka.com.hr/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://proteinoteka.com.hr/opengraph-image"],
  },
};

const USE_CASE_ROWS = [
  {
    goal: "Početnik / rekreativac",
    type: "Vodič: najbolji izbori za početnike",
    href: "/hr-vodici/najbolji-protein-za-pocetnike-hrvatska",
    reason: "Odlična vrijednost za novac, visokih 70–80g proteina/100g, lako se nađe u akciji — pogledajte pažljivo odabrane top izbore po proračunu i vrijednosti.",
  },
  {
    goal: "Mršavljenje",
    type: "Whey Isolate",
    href: "/kategorija/whey-isolate",
    reason: "Manje kalorija, masti i šećera nego concentrate. Čistiji protein uz nizak kalorijski unos.",
  },
  {
    goal: "Izgradnja mase",
    type: "Blend",
    href: "/kategorija/blend",
    reason: "Mješavina whey-a i kazeina daje i brzu i produženu apsorpciju tijekom cijelog dana.",
  },
  {
    goal: "Intolerancija na laktozu",
    type: "Whey Isolate",
    href: "/kategorija/whey-isolate",
    reason: "Proces filtracije uklanja gotovo svu laktozu — obično ispod 1g na porciju.",
  },
  {
    goal: "Prije spavanja",
    type: "Kazein",
    href: "/kategorija/kazein",
    reason: "Sporo se vari 6–8 sati, što sprečava katabolizam mišića tijekom noći.",
  },
  {
    goal: "Vegani i biljna prehrana",
    type: "Biljni protein",
    href: "/kategorija/biljni-protein",
    reason: "Kombinacija graška + rižinog proteina pruža kompletan aminokiselinski profil.",
  },
];

function UseCaseSection() {
  return (
    <section>
      <h2 className="text-xl font-extrabold text-slate-900 mb-2">
        Komu koji whey protein odgovara?
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Nema jednog &quot;najboljeg&quot; proteina za sve — ovisi o cilju, proračunu i toleranciji na laktozu.
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
            * Preporuke su zasnovane na nutritivnim profilima i price/protein omjeru iz aktualne baze. Klikni na tip za pregled trenutnih cijena.
          </p>
        </div>
      </div>
    </section>
  );
}

export default async function Page() {
  if (CURRENT_MARKET !== 'hr') notFound();
  const products = await fetchTopProducts({ sortBy: "valueScore", limit: 15 });

  const top = products[0];
  const cheapest = products.length > 0
    ? [...products].sort((a, b) => (a.numericPrice ?? 0) - (b.numericPrice ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Trenutno, ${top.name} (${top.storeName}) ima najviši value score od ${top.valueScore?.toFixed(1)}/10 po cijeni ${top.price} — što ga čini najboljim izborom za odnos cijene i kvalitete. Ako ti je proračun prioritet, ${cheapest?.name ?? top.name} je najjeftinija opcija u listi za ${cheapest?.price ?? top.price}.`
    : "";

  return (
    <SEOLandingPage
      h1="Najbolji Whey Protein u Hrvatskoj 2026"
      intro={`Analizirali smo ${products.length > 0 ? `${products.length}+` : "sve"} whey proteine dostupne u hrvatskim trgovinama. Uspoređujemo cijenu, sadržaj proteina na 100g, šećere, masti i ukupnu vrijednost — i rangiramo koji nudi najviše za tvoj novac u 2026. godini.`}
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Top 10 whey proteina u Hrvatskoj 2026 — rangirani po vrijednosti za novac"
      tableCaption="Whey proteini u Hrvatskoj — rang lista po value score 2026"
      currentSlug="najbolji-whey-protein-hrvatska"
      middleSection={<UseCaseSection />}
      faqs={[
        {
          q: "Koji je whey protein #1 u Hrvatskoj po value score-u trenutno?",
          a: top
            ? `Prema trenutnim podacima, ${top.name} od ${top.brand ?? "odabranog brenda"} vodi rang listu s ocjenom ${top.valueScore?.toFixed(1)}/10 i cijenom ${top.price}. Score se ažurira tjedno kako bi odražavao aktualne cijene — poredak se može promijeniti.`
            : "Value score se ažurira tjedno — pogledaj rang listu iznad za trenutni #1.",
        },
        {
          q: "Koji whey protein je best za početnike?",
          a: "Za početnike je whey concentrate obično optimalan izbor — daje 70–80g proteina na 100g, lako se nađe po pristupačnoj cijeni i razlika u učinkovitosti u usporedbi s skupljim tipovima zanemariva je za rekreativne treninge. Počni s 1kg pakovanjem dok ne pronađeš okus i brend koji ti odgovara.",
        },
        {
          q: "Koji whey protein je best za mršavljenje?",
          a: "Whey isolate je bolji izbor za mršavljenje zbog nižeg sadržaja masti, šećera i kalorija uz visok postotak proteina (85–95g/100g). Proteini općenito pomažu sitosti i očuvanju mišića tijekom kalorijskog deficita. Gledaj na etiketi da nema dodanog šećera ni maltoze.",
        },
        {
          q: "Što točno znači 'najbolji' whey protein?",
          a: "Ovisi o tome što tražiš. Ako je cilj najveća vrijednost za novac — gleda se koliko grama proteina dobivaš po euru, uz nutritivni profil (šećeri, masti, čistoća). Ako je cilj cijena — biraš najjeftiniji u kilogramima. Na Proteinoteci rangiramo po value score koji kombinira oba faktora, plus reputaciju brenda i tip proteina.",
        },
        {
          q: "Što je Value Score i kako se računa?",
          a: "Value Score je ocjena od 0 do 10 koju računamo za svaki protein. Uzima u obzir cijenu po gramu proteina u usporedbi s prosjekom kategorije (40% težine), čistoću proteina na 100g (20%), tip i probavljivost proteina (15%), sastojke poput šećera i aditiva (15%) i reputaciju brenda (10%). Ako nedostaje neki podatak, score se umanjuje.",
        },
        {
          q: "Znači li skuplji protein automatski bolji?",
          a: "Ne. Cijena je samo jedan od faktora. Mnogi skupi proteini imaju visok marketinški budžet, a ne nužno bolji sastav. Gledaj sadržaj proteina na 100g, šećere, masti i cijenu po gramu proteina — to su brojevi koji ne lažu. Na Proteinoteci možeš sortirati po tim parametrima odvojeno.",
        },
        {
          q: "Koliko često se ažurira rang lista?",
          a: "Scraperi prolaze kroz sve trgovine jednom tjedno. Ako se cijena promijeni, value score se automatski preračunava. To znači da rang lista odražava stvarno stanje tržišta, ne zastarjele podatke.",
        },
        {
          q: "Koje su najpouzdanije trgovine za kupnju proteina u Hrvatskoj?",
          a: "GymBeam HR i MyProtein HR nude najveći izbor i redovite akcije. Polleo Sport je domaća specijalizirana trgovina s dobrom uslugom. Proteka i Nutrition Shop HR su alternativne opcije. Proteinoteka prati sve i uvijek prikazuje najnižu dostupnu cijenu na jednom mjestu.",
        },
      ]}
    />
  );
}
