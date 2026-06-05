import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Politika privatnosti",
  description: "Politika privatnosti platforme Proteinoteka — kako prikupljamo, koristimo i štitimo vaše podatke.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/privacy-policy" },
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
