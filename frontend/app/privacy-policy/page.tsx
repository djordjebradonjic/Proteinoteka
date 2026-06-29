import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { hreflangAlternates } from "@/lib/hreflang";

const isHR = CURRENT_MARKET === "hr";
const domain = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;

export const metadata: Metadata = {
  title: isHR ? "Politika privatnosti | Proteinoteka HR" : "Politika privatnosti | Proteinoteka",
  description: isHR
    ? "Politika privatnosti platforme Proteinoteka — kako prikupljamo, koristimo i štitimo vaše podatke u skladu s GDPR-om."
    : "Politika privatnosti platforme Proteinoteka — kako prikupljamo, koristimo i štitimo vaše podatke.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${domain}/privacy-policy`,
    languages: hreflangAlternates("/privacy-policy"),
  },
  openGraph: {
    title: isHR ? "Politika privatnosti | Proteinoteka HR" : "Politika privatnosti | Proteinoteka",
    description: isHR
      ? "Politika privatnosti platforme Proteinoteka — kako prikupljamo, koristimo i štitimo vaše podatke u skladu s GDPR-om."
      : "Politika privatnosti platforme Proteinoteka — kako prikupljamo, koristimo i štitimo vaše podatke.",
    url: `${domain}/privacy-policy`,
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

export default function PrivacyPolicyPage() {
  if (isHR) {
    return (
      <>
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#FF9900] hover:text-[#e68a00] font-medium mb-6 transition-colors">
              ← Natrag na početnu
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Politika privatnosti</h1>
            <p className="text-sm text-slate-400">Posljednje ažuriranje: lipanj 2026.</p>
          </div>

          <Section title="1. Tko smo i tko je voditelj obrade podataka">
            <p>
              Proteinoteka (<strong>proteinoteka.com.hr</strong>) je platforma za usporedbu cijena proteinskih suplemenata u Hrvatskoj. Nismo trgovina — uspoređujemo javno dostupne cijene i informacije o proizvodima s web-mjesta partnerskih trgovina.
            </p>
            <p>
              <strong>Voditelj obrade osobnih podataka:</strong><br />
              Đorđe Bradonjić<br />
              Email:{" "}
              <a href="mailto:kontakt@proteinoteka.com.hr" className="text-[#FF9900] hover:underline">
                kontakt@proteinoteka.com.hr
              </a>
            </p>
          </Section>

          <Section title="2. Podatci koje prikupljamo">
            <p>
              <strong>Podatci o korištenju stranice:</strong> Koristimo Google Analytics za anonimnu analitiku posjeta (broj posjetitelja, najpregledanije stranice, uređaji). Ovi podatci ne sadrže osobne informacije.
            </p>
            <p>
              <strong>Kontakt obrazac:</strong> Kada nam pošaljete poruku putem kontakt obrasca, prikupljamo vaše ime, email adresu i tekst poruke isključivo radi odgovora na vaš upit. Ovi podatci ne dijele se s trećim stranama.
            </p>
            <p>
              <strong>Lokalno pohranivanje (localStorage):</strong> Koristimo browser localStorage za čuvanje liste željenih proizvoda (wishlist) i listi za usporedbu. Ovi podatci ostaju samo na vašem uređaju i ne šaljemo ih na naše poslužitelje.
            </p>
            <p>
              <strong>Kolačići (cookies):</strong> Koristimo neophodne kolačiće za funkcioniranje stranice i analitičke kolačiće (Google Analytics) koji su anonimizirani. Možete upravljati kolačićima putem bannera koji se prikazuje pri prvom posjetu.
            </p>
          </Section>

          <Section title="3. Pravna osnova za obradu (GDPR)">
            <p>
              Budući da je Hrvatska članica Europske unije, na obradu vaših osobnih podataka primjenjuje se Uredba (EU) 2016/679 (GDPR).
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Analitika:</strong> privola (članak 6. stavak 1. točka a GDPR-a)</li>
              <li><strong>Kontakt upiti:</strong> legitimni interes ili izvršenje ugovora (članak 6. stavak 1. točke b i f)</li>
              <li><strong>localStorage:</strong> tehnički nužno za funkcioniranje usluge — privola nije potrebna</li>
            </ul>
          </Section>

          <Section title="4. Prikupljanje podataka o proizvodima (web scraping)">
            <p>
              Proteinoteka automatski prikuplja javno dostupne podatke s web-mjesta trgovina (cijene, nazive proizvoda, slike) radi pružanja usluge usporedbe cijena. Prikupljamo isključivo podatke o proizvodima i cijenama — ne prikupljamo nikakve osobne podatke korisnika trgovina.
            </p>
          </Section>

          <Section title="5. Kako koristimo podatke">
            <ul className="list-disc pl-5 space-y-1">
              <li>Prikaz i usporedba cijena proizvoda</li>
              <li>Poboljšanje funkcioniranja platforme</li>
              <li>Odgovaranje na korisničke upite</li>
              <li>Anonimna web analitika za poboljšanje korisničkog iskustva</li>
            </ul>
            <p>Vaše osobne podatke <strong>nikada ne prodajemo</strong> trećim stranama.</p>
          </Section>

          <Section title="6. Affiliate linkovi">
            <p>
              Neki linkovi na Proteinoteci mogu biti affiliate linkovi. To znači da kada kliknete na link i obavite kupnju, možemo ostvariti malu proviziju bez ikakvih dodatnih troškova za vas. Affiliate status ne utječe na rangiranje ili preporuke.
            </p>
          </Section>

          <Section title="7. Treće strane">
            <p>Koristimo sljedeće treće strane koje mogu imati pristup anonimnim podatcima:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google Analytics</strong> — anonimna analitika posjeta</li>
              <li><strong>Vercel</strong> — hosting platforme (EU region dostupan)</li>
              <li><strong>Resend</strong> — slanje emailova putem kontakt obrasca</li>
            </ul>
          </Section>

          <Section title="8. Vaša prava (GDPR)">
            <p>Kao stanovnik EU-a imate pravo:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Pristupa osobnim podatcima koje čuvamo o vama (čl. 15.)</li>
              <li>Ispravka netočnih podataka (čl. 16.)</li>
              <li>Brisanja podataka ("pravo na zaborav") (čl. 17.)</li>
              <li>Ograničenja obrade (čl. 18.)</li>
              <li>Prenosivosti podataka (čl. 20.)</li>
              <li>Prigovora na obradu (čl. 21.)</li>
              <li>Povlačenja privole u bilo kojem trenutku</li>
            </ul>
            <p>
              Za sve zahtjeve kontaktirajte nas putem emaila:{" "}
              <a href="mailto:kontakt@proteinoteka.com.hr" className="text-[#FF9900] hover:underline">
                kontakt@proteinoteka.com.hr
              </a>
            </p>
            <p>
              Imate pravo podnijeti pritužbu nadzornom tijelu — u Hrvatskoj je to{" "}
              <strong>Agencija za zaštitu osobnih podataka (AZOP)</strong>,{" "}
              <a href="https://azop.hr" className="text-[#FF9900] hover:underline" target="_blank" rel="noopener noreferrer">azop.hr</a>.
            </p>
          </Section>

          <Section title="9. Sigurnost">
            <p>
              Poduzimamo tehničke i organizacijske mjere zaštite podataka. Stranica koristi HTTPS enkripciju za sve komunikacije.
            </p>
          </Section>

          <Section title="10. Izmjene politike">
            <p>
              Zadržavamo pravo izmjene ove politike. Sve promjene bit će objavljene na ovoj stranici s datumom posljednjeg ažuriranja. Nastavak korištenja platforme nakon izmjena podrazumijeva prihvaćanje novih uvjeta.
            </p>
          </Section>

          <Section title="11. Kontakt">
            <p>
              Za sva pitanja u vezi s privatnošću:{" "}
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

  // RS version
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
            Politika privatnosti
          </h1>
          <p className="text-sm text-slate-400">Poslednje ažuriranje: maj 2026.</p>
        </div>

        <Section title="1. Ko smo mi i ko je rukovalac podacima">
          <p>
            Proteinoteka (<strong>proteinoteka.rs</strong>) je platforma za poređenje cena proteinskih suplemenata u Srbiji. Nismo prodavnica — poredimo javno dostupne cene i informacije o proizvodima sa sajtova partnerskih prodavnica.
          </p>
          <p>
            <strong>Rukovalac podacima o ličnosti:</strong><br />
            Đorđe Bradonjić<br />
            Email:{" "}
            <a href="mailto:kontakt@proteinoteka.rs" className="text-[#FF9900] hover:underline">
              kontakt@proteinoteka.rs
            </a>
          </p>
        </Section>

        <Section title="2. Podaci koje prikupljamo">
          <p>
            <strong>Podaci o korišćenju sajta:</strong> Koristimo Google Analytics za anonimnu analitiku poseta (broj posetilaca, najpregledanije stranice, uređaji). Ovi podaci ne sadrže lične informacije.
          </p>
          <p>
            <strong>Kontakt forma:</strong> Kada nam pošaljete poruku putem kontakt forme, prikupljamo vaše ime, email adresu i tekst poruke isključivo radi odgovora na vaš upit. Ovi podaci se ne dele sa trećim stranama.
          </p>
          <p>
            <strong>Price alert sistem:</strong> Ako aktivirate praćenje cene za neki proizvod, prikupljamo vašu email adresu i ciljnu cenu koju ste uneli. Ovi podaci se čuvaju na našim serverima isključivo radi slanja notifikacije kada cena padne ispod željene vrednosti. <strong>Email adresa se briše najkasnije 12 meseci od aktivacije alerta</strong>, ili odmah nakon što ga vi uklonite. Email se ne koristi u marketinške svrhe i ne deli se sa trećim stranama osim servisa za slanje emailova (Resend). Možete ukloniti alert u svakom trenutku putem linka u poslatom emailu ili direktno na stranici proizvoda.
          </p>
          <p>
            <strong>Lokalno skladištenje (localStorage):</strong> Koristimo browser localStorage za čuvanje liste željenih proizvoda (wishlist) i lista za poređenje. Ovi podaci ostaju samo na vašem uređaju i ne šaljemo ih na naše servere.
          </p>
          <p>
            <strong>Kolačići (cookies):</strong> Koristimo neophodne kolačiće za funkcionisanje sajta i analitičke kolačiće (Google Analytics) koji su anonimizovani.
          </p>
        </Section>

        <Section title="3. Prikupljanje podataka o proizvodima (scraping)">
          <p>
            Proteinoteka automatski prikuplja javno dostupne podatke sa sajtova prodavnica (cene, nazive proizvoda, slike) u cilju pružanja usluge poređenja cena. Ovi podaci su javno dostupni i namenjeni korisnicima tih prodavnica.
          </p>
          <p>
            Prikupljamo isključivo podatke o proizvodima i cenama — ne prikupljamo nikakve lične podatke korisnika prodavnica.
          </p>
        </Section>

        <Section title="4. Kako koristimo podatke">
          <ul className="list-disc pl-5 space-y-1">
            <li>Prikaz i poređenje cena proizvoda</li>
            <li>Poboljšanje funkcionisanja platforme</li>
            <li>Odgovaranje na korisničke upite</li>
            <li>Anonimna web analitika za poboljšanje korisničkog iskustva</li>
          </ul>
          <p>Vaše lične podatke <strong>nikada ne prodajemo</strong> trećim stranama.</p>
        </Section>

        <Section title="5. Affiliate linkovi">
          <p>
            Neki linkovi na Proteinoteki mogu biti affiliate linkovi. To znači da kada kliknete na link i obavite kupovinu, možemo ostvariti malu proviziju bez ikakvih dodatnih troškova za vas. Ovo nam pomaže u finansiranju platforme i održavanju besplatnog servisa.
          </p>
          <p>
            Affiliate status ne utiče na rangiranje ili preporuke — prikazujemo objektivne podatke o cenama i Value Score-u bez obzira na affiliate sporazume.
          </p>
        </Section>

        <Section title="6. Treće strane">
          <p>Koristimo sledeće treće strane koji mogu imati pristup anonimnim podacima:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Google Analytics</strong> — anonimna analitika poseta</li>
            <li><strong>Vercel</strong> — hosting platforme</li>
            <li><strong>Resend</strong> — slanje emailova putem kontakt forme i price alert notifikacija</li>
          </ul>
        </Section>

        <Section title="7. Vaša prava">
          <p>U skladu sa važećim propisima o zaštiti podataka, imate pravo da:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Zatražite uvid u podatke koje čuvamo o vama</li>
            <li>Zatražite ispravku netačnih podataka</li>
            <li>Zatražite brisanje vaših podataka</li>
            <li>Povučete saglasnost za obradu podataka</li>
          </ul>
          <p>
            Za sve zahteve kontaktirajte nas putem emaila:{" "}
            <a href="mailto:kontakt@proteinoteka.rs" className="text-[#FF9900] hover:underline">
              kontakt@proteinoteka.rs
            </a>
          </p>
        </Section>

        <Section title="8. Bezbednost">
          <p>
            Preduzimamo tehničke i organizacione mere zaštite podataka. Sajt koristi HTTPS enkripciju za sve komunikacije.
          </p>
        </Section>

        <Section title="9. Izmene politike">
          <p>
            Zadržavamo pravo izmene ove politike. Sve promene biće objavljene na ovoj stranici sa datumom poslednjeg ažuriranja. Nastavak korišćenja platforme posle izmena podrazumeva prihvatanje novih uslova.
          </p>
        </Section>

        <Section title="10. Kontakt">
          <p>
            Za sva pitanja u vezi sa privatnošću:{" "}
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
