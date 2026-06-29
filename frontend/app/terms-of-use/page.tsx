import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { hreflangAlternates } from "@/lib/hreflang";

const isHR = CURRENT_MARKET === "hr";
const domain = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;

export const metadata: Metadata = {
  title: isHR ? "Uvjeti korištenja" : "Uslovi korišćenja",
  description: isHR
    ? "Uvjeti korištenja platforme Proteinoteka — pravila i ograničenja korištenja servisa."
    : "Uslovi korišćenja platforme Proteinoteka — pravila i ograničenja korišćenja servisa.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${domain}/terms-of-use`,
    languages: hreflangAlternates("/terms-of-use"),
  },
  openGraph: {
    title: isHR ? "Uvjeti korištenja | Proteinoteka" : "Uslovi korišćenja | Proteinoteka",
    description: isHR
      ? "Uvjeti korištenja platforme Proteinoteka — pravila i ograničenja korištenja servisa."
      : "Uslovi korišćenja platforme Proteinoteka — pravila i ograničenja korišćenja servisa.",
    url: `${domain}/terms-of-use`,
    siteName: "Proteinoteka",
    locale: isHR ? "hr_HR" : "sr_RS",
    type: "website",
    images: [{ url: `${domain}/opengraph-image`, width: 1200, height: 630, alt: "Proteinoteka" }],
  },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-slate-900 mb-3">{title}</h2>
      <div className="space-y-3 text-slate-600 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermsOfUsePage() {
  if (isHR) {
    return (
      <>
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#FF9900] hover:text-[#e68a00] font-medium mb-6 transition-colors">
              ← Natrag na početnu
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Uvjeti korištenja</h1>
            <p className="text-sm text-slate-400">Posljednje ažuriranje: svibanj 2026.</p>
          </div>

          <Section title="1. Prihvaćanje uvjeta">
            <p>
              Korištenjem platforme Proteinoteka (<strong>proteinoteka.com.hr</strong>) prihvaćate ove Uvjete korištenja u cijelosti. Ako se ne slažete s bilo kojim dijelom ovih uvjeta, molimo vas da prestanete koristiti platformu.
            </p>
          </Section>

          <Section title="2. O servisu">
            <p>
              Proteinoteka je platforma za <strong>usporedbu cijena</strong> proteinskih suplemenata u Hrvatskoj. Mi nismo trgovina i ne prodajemo proizvode. Služimo isključivo kao informativni servis koji agregira i prikazuje javno dostupne informacije o cijenama.
            </p>
            <p>
              Sve veze prema proizvodima vode na web stranice trgovina trećih strana. Kupnjom na tim stranicama ulazite u pravni odnos s trgovinom, a ne s Proteinotekom.
            </p>
          </Section>

          <Section title="3. Točnost informacija">
            <p>
              Cijene i informacije o proizvodima prikupljamo automatski i periodično ažuriramo. Unatoč nastojanjima da prikažemo točne i ažurne podatke, <strong>ne jamčimo</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Točnost prikazanih cijena u stvarnom vremenu</li>
              <li>Dostupnost proizvoda kod trgovina</li>
              <li>Potpunost informacija o nutritivnom sastavu</li>
              <li>Ažurnost svih prikazanih podataka</li>
            </ul>
            <p>
              <strong>Uvijek provjerite aktualnu cijenu izravno na stranici trgovine</strong> prije donošenja odluke o kupnji.
            </p>
          </Section>

          <Section title="4. Ograničenje odgovornosti">
            <p>
              Proteinoteka i njeni autori <strong>ne snose odgovornost</strong> za:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Razliku između prikazane cijene i stvarne cijene kod trgovine</li>
              <li>Gubitke nastale na temelju informacija prikazanih na platformi</li>
              <li>Kvalitetu, sigurnost ili karakteristike prikazanih proizvoda</li>
              <li>Transakcije obavljene na web stranicama trećih trgovina</li>
              <li>Privremenu nedostupnost servisa</li>
            </ul>
          </Section>

          <Section title="5. Affiliate veze i komercijalni odnosi">
            <p>
              Pojedine veze na platformi mogu biti affiliate veze. Proteinoteka može ostvariti proviziju kada korisnik klikne na takvu vezu i obavi kupnju, bez dodatnog troška za korisnika.
            </p>
            <p>
              Affiliate sporazumi ne utječu na objektivnost prikazanih podataka — Value Score i rangiranje cijena su algoritmički i ne ovise o poslovnim odnosima s trgovinama.
            </p>
          </Section>

          <Section title="6. Intelektualno vlasništvo">
            <p>
              Sva prava na brendove, logotipe i nazive proizvoda prikazanih na platformi pripadaju njihovim vlasnicima. Proteinoteka ne polaže pravo na tuđe brendove i koristi ih isključivo u informativne svrhe (nominativna upotreba).
            </p>
            <p>
              Dizajn, kod i originalni sadržaj platforme Proteinoteka zaštićeni su autorskim pravom. Nije dopušteno kopiranje, redistribucija ili komercijalna upotreba bez pisane suglasnosti.
            </p>
          </Section>

          <Section title="7. Prihvatljivo korištenje">
            <p>Zabranjeno je:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Automatizirano prikupljanje podataka (scraping) s Proteinoteke bez pisane suglasnosti</li>
              <li>Korištenje platforme u nezakonite svrhe</li>
              <li>Pokušaj narušavanja rada poslužitelja ili sigurnosti platforme</li>
              <li>Lažno predstavljanje ili dovođenje u zabludu</li>
            </ul>
          </Section>

          <Section title="8. Veze prema trećim stranama">
            <p>
              Platforma sadrži veze prema web stranicama trgovina i drugim vanjskim resursima. Proteinoteka nije odgovorna za sadržaj, politike privatnosti ni prakse tih stranica. Posjet vanjskim stranicama je na vašu vlastitu odgovornost.
            </p>
          </Section>

          <Section title="9. Izmjene uvjeta">
            <p>
              Zadržavamo pravo izmjene ovih Uvjeta korištenja u bilo koje vrijeme bez prethodne najave. Izmijenjeni uvjeti stupaju na snagu objavljivanjem na ovoj stranici. Nastavak korištenja platforme podrazumijeva prihvaćanje izmijenjenih uvjeta.
            </p>
          </Section>

          <Section title="10. Mjerodavno pravo">
            <p>
              Na ove Uvjete korištenja primjenjuje se pravo Republike Hrvatske. Za sve sporove nadležni su sudovi u Republici Hrvatskoj.
            </p>
          </Section>

          <Section title="11. Kontakt">
            <p>
              Za sva pitanja u vezi s Uvjetima korištenja:{" "}
              <a href="mailto:kontakt@proteinoteka.com.hr" className="text-[#FF9900] hover:underline">
                kontakt@proteinoteka.com.hr
              </a>
            </p>
          </Section>

          <div className="mt-10 pt-6 border-t border-slate-100">
            <Link href="/" className="text-sm text-[#FF9900] hover:text-[#e68a00] font-medium transition-colors">
              ← Natrag na početnu
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12">

        <div className="mb-10">
          <Link href="/"
                className="inline-flex items-center gap-1.5 text-sm text-[#FF9900] hover:text-[#e68a00] font-medium mb-6 transition-colors">
            ← Nazad na početnu
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Uslovi korišćenja
          </h1>
          <p className="text-sm text-slate-400">Poslednje ažuriranje: maj 2026.</p>
        </div>

        <Section title="1. Prihvatanje uslova">
          <p>
            Korišćenjem platforme Proteinoteka (<strong>proteinoteka.rs</strong>) prihvatate ove Uslove korišćenja u celosti. Ako se ne slažete sa bilo kojim delom ovih uslova, molimo vas da prekinete korišćenje platforme.
          </p>
        </Section>

        <Section title="2. O servisu">
          <p>
            Proteinoteka je platforma za <strong>poređenje cena</strong> proteinskih suplemenata u Srbiji. Mi nismo prodavnica i ne vršimo prodaju proizvoda. Služimo isključivo kao informativni servis koji agregira i prikazuje javno dostupne informacije o cenama.
          </p>
          <p>
            Svi linkovi ka proizvodima vode na sajtove prodavnica trećih strana. Kupovinom na tim sajtovima ulazite u pravni odnos sa prodavnicom, a ne sa Proteinotekom.
          </p>
        </Section>

        <Section title="3. Tačnost informacija">
          <p>
            Cene i informacije o proizvodima prikupljamo automatski i periodično ažuriramo. Uprkos nastojanjima da prikažemo tačne i ažurne podatke, <strong>ne garantujemo</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Tačnost prikazanih cena u realnom vremenu</li>
            <li>Dostupnost proizvoda kod prodavnica</li>
            <li>Potpunost informacija o nutritivnom sastavu</li>
            <li>Ažurnost svih prikazanih podataka</li>
          </ul>
          <p>
            <strong>Uvek proverite aktuelnu cenu direktno na sajtu prodavnice</strong> pre donošenja odluke o kupovini.
          </p>
        </Section>

        <Section title="4. Ograničenje odgovornosti">
          <p>
            Proteinoteka i njeni autori <strong>ne snose odgovornost</strong> za:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Razliku između prikazane cene i stvarne cene kod prodavnice</li>
            <li>Gubitke nastale na osnovu informacija prikazanih na platformi</li>
            <li>Kvalitet, bezbednost ili karakteristike prikazanih proizvoda</li>
            <li>Transakcije obavljene na sajtovima trećih prodavnica</li>
            <li>Privremenu nedostupnost servisa</li>
          </ul>
        </Section>

        <Section title="5. Affiliate linkovi i komercijalni odnosi">
          <p>
            Pojedini linkovi na platformi mogu biti affiliate linkovi. Proteinoteka može ostvariti proviziju kada korisnik klikne na takav link i obavi kupovinu, bez dodatnog troška za korisnika.
          </p>
          <p>
            Affiliate sporazumi ne utiču na objektivnost prikazanih podataka — Value Score i rangiranje cena su algoritamski i ne zavise od poslovnih odnosa sa prodavnicama.
          </p>
        </Section>

        <Section title="6. Intelektualna svojina">
          <p>
            Sva prava na brendove, logoe i nazive proizvoda prikazanih na platformi pripadaju njihovim vlasnicima. Proteinoteka ne polaže pravo na tuđe brendove i koristi ih isključivo u informativne svrhe (nominativna upotreba).
          </p>
          <p>
            Dizajn, kod i originalni sadržaj platforme Proteinoteka zaštićeni su autorskim pravom. Nije dozvoljeno kopiranje, redistribucija ili komercijalna upotreba bez pisane saglasnosti.
          </p>
        </Section>

        <Section title="7. Prihvatljivo korišćenje">
          <p>Zabranjeno je:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Automatizovano prikupljanje podataka (scraping) sa Proteinoteke bez pisane saglasnosti</li>
            <li>Korišćenje platforme u nezakonite svrhe</li>
            <li>Pokušaj narušavanja rada servera ili sigurnosti platforme</li>
            <li>Lažno predstavljanje ili dovođenje u zabludu</li>
          </ul>
        </Section>

        <Section title="8. Linkovi ka trećim stranama">
          <p>
            Platforma sadrži linkove ka sajtovima prodavnica i drugim eksternim resursima. Proteinoteka nije odgovorna za sadržaj, politike privatnosti ni prakse tih sajtova. Poseta eksternim sajtovima je na vašu sopstvenu odgovornost.
          </p>
        </Section>

        <Section title="9. Izmene uslova">
          <p>
            Zadržavamo pravo izmene ovih Uslova korišćenja u bilo kom trenutku bez prethodne najave. Izmenjeni uslovi stupaju na snagu objavljivanjem na ovoj stranici. Nastavak korišćenja platforme podrazumeva prihvatanje izmenjenih uslova.
          </p>
        </Section>

        <Section title="10. Merodavno pravo">
          <p>
            Na ove Uslove korišćenja primenjuje se pravo Republike Srbije. Za sve sporove nadležni su sudovi u Republici Srbiji.
          </p>
        </Section>

        <Section title="11. Kontakt">
          <p>
            Za sva pitanja u vezi sa Uslovima korišćenja:{" "}
            <a href="mailto:kontakt@proteinoteka.rs" className="text-[#FF9900] hover:underline">
              kontakt@proteinoteka.rs
            </a>
          </p>
        </Section>

        <div className="mt-10 pt-6 border-t border-slate-100">
          <Link href="/"
                className="text-sm text-[#FF9900] hover:text-[#e68a00] font-medium transition-colors">
            ← Nazad na početnu
          </Link>
        </div>

      </main>
    </>
  );
}
