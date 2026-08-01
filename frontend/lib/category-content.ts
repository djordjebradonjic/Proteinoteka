export interface CategoryContent {
  h1: string;
  intro: string;
  guides?: { href: string; label: string }[];
  faqs: { q: string; a: string }[];
}

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  whey_concentrate: {
    h1: "Whey Concentrate Proteini — Cene u Srbiji 2026",
    intro:
      "Whey concentrate je najpopularniji tip proteinskog suplementa — visok sadržaj proteina (70–80g/100g), dobar ukus i pristupačna cena čine ga prvim izborom za većinu rekreativaca i sportista. Proteinoteka poredi cene iz svih srpskih prodavnica i računa realnu vrednost: RSD po gramu proteina.",
    guides: [
      { href: "/vodici/whey-protein-za-pocetnike",        label: "📖 Vodič za početnike" },
      { href: "/vodici/koliko-proteina-dnevno",           label: "📊 Koliko proteina dnevno?" },
      { href: "/vodici/whey-isolate-vs-concentrate",      label: "⚗️ Isolate vs Concentrate" },
      { href: "/vodici/kada-piti-protein",                label: "⏰ Kada piti protein" },
      { href: "/vodici/koliko-novca-mesecno-za-proteine", label: "💸 Mesečni trošak proteina" },
    ],
    faqs: [
      {
        q: "Šta je whey concentrate i od čega se pravi?",
        a: "Whey concentrate se dobija filtracijom surutke — nusproizvoda proizvodnje sira. Proces mikro-filtracije uklanja deo masti i laktoze i koncentruje proteine na 70–80g na 100g praška. Zadržava malo masti i laktoze, što mu daje bolji ukus od izolata.",
      },
      {
        q: "Da li je whey concentrate dobra opcija ako nisam intolerantan na laktozu?",
        a: "Da — za većinu sportista i rekreativaca whey concentrate je optimalan izbor. Količina laktoze je mala i ne izaziva probleme kod osoba bez intolerancije. Dobija se više proteina po nižoj ceni u poređenju sa izolat opcijama.",
      },
      {
        q: "Koliko proteina ima whey concentrate na 100g?",
        a: "Tipičan whey concentrate sadrži između 70 i 80g proteina na 100g. Brendovi premium klase dostižu i 82–84g. Za poređenje, izolat kreće od 85g na više. Uvek gledaj deklaraciju — ne ukupnu cenu pakovanja.",
      },
      {
        q: "Kako da znam koji whey concentrate je best value?",
        a: "Gledaj cenu po gramu proteina, ne ukupnu cenu pakovanja. Proteinoteka automatski računa ovaj podatak za svaki proizvod. Veće pakovanje (2kg+) obično daje bolju vrednost. Brands poput Scitec, MyProtein i BioTech redovno nude best value opcije u ovoj kategoriji.",
      },
    ],
  },

  whey_isolate: {
    h1: "Whey Isolate Proteini — Cene u Srbiji 2026",
    intro:
      "Whey isolate prolazi kroz dodatnu filtraciju koja uklanja većinu masti i laktoze, rezultujući u 85–95g proteina na 100g. Idealan je za osobe sa intolerancijom na laktozu, periode definicije ili svakoga ko želi maksimalnu čistoću. Poredimo cene iz svih srpskih prodavnica.",
    guides: [
      { href: "/vodici/whey-isolate-vs-concentrate",      label: "⚗️ Isolate vs Concentrate" },
      { href: "/vodici/protein-za-mrsavljenje",           label: "🔥 Protein za mršavljenje" },
      { href: "/vodici/koliko-proteina-dnevno",           label: "📊 Koliko proteina dnevno?" },
      { href: "/vodici/kada-piti-protein",                label: "⏰ Kada piti protein" },
      { href: "/vodici/koliko-novca-mesecno-za-proteine", label: "💸 Mesečni trošak" },
    ],
    faqs: [
      {
        q: "Koja je razlika između whey isolate i concentrate?",
        a: "Isolate prolazi kroz dodatnu filtraciju (ion-exchange ili kros-filtracija) koja uklanja većinu masti i laktoze. Rezultat: 85–95g proteina na 100g (vs 70–80g za concentrate), manje od 1g laktoze, minimalno masti. Cena je viša — opravdano za osobe sa intolerancijom ili one koji broje svaki gram.",
      },
      {
        q: "Da li je whey isolate bolji za mršavljenje?",
        a: "Nije automatski bolji — ključna je ukupna kalorijska bilansa. Prednost isolate-a je manji sadržaj masti i ugljenih hidrata, što olakšava precizno praćenje makroa. Za mršavljenje važnija je cena po gramu proteina i ukupan kalorijski deficit.",
      },
      {
        q: "Da li je whey isolate bezbedan za osobe sa intolerancijom na laktozu?",
        a: "U većini slučajeva da — quality isolate sadrži manje od 1g laktoze na porciju, što tolerišu i osobe sa umerenom intolerancijom. Ako imaš tešku intoleranciju, potraži izolat sa oznakom 'lactose free' ili pređi na biljni protein.",
      },
      {
        q: "Koji whey isolate je najjeftiniji u Srbiji?",
        a: "Cene variraju između prodavnica i pakovanja. Sortiraj listu iznad po ceni da vidiš trenutno najjeftiniji isolate. Gledaj cenu po gramu proteina — veće pakovanje je obično isplativije po gramu.",
      },
    ],
  },

  hydrolysate: {
    h1: "Hidrolizat Proteina — Cene u Srbiji 2026",
    intro:
      "Hidrolizovani whey protein prolazi kroz enzimsku razgradnju koja deli proteinske lance na manje peptide. Rezultat je najbrža apsorpcija od svih vrsta proteina. Premium segment — idealan za intenzivan post-workout oporavak. Poredimo sve hidrolizate dostupne u Srbiji.",
    guides: [
      { href: "/vodici/kada-piti-protein",                label: "⏰ Kada piti protein" },
      { href: "/vodici/whey-isolate-vs-concentrate",      label: "⚗️ Isolate vs Concentrate" },
      { href: "/vodici/koliko-proteina-dnevno",           label: "📊 Koliko proteina dnevno?" },
      { href: "/vodici/koliko-novca-mesecno-za-proteine", label: "💸 Mesečni trošak proteina" },
    ],
    faqs: [
      {
        q: "Šta je hidrolizat proteina i po čemu se razlikuje od isolate-a?",
        a: "Hidrolizat (ili hidrolizovani whey) je isolate koji je prošao enzimsku hidrolizu — proteinski lanci su razloženi na di- i tri-peptide. Ovo ubrzava apsorpciju u poređenju i sa isolate-om i sa concentrate-om. Cena je viša, a ukus je gorčiji zbog slobodnih aminokiselina.",
      },
      {
        q: "Da li hidrolizat zaista ubrzava oporavak?",
        a: "Istraživanja pokazuju brži rast aminokiselina u krvi u prvih 90 minuta posle treninga u poređenju sa isolate-om. Za elitne sportiste i bodybuildera koji treniraju dva puta dnevno, razlika može biti praktično relevantna. Za rekreativce koji treniraju jednom dnevno, razlika je minimalna.",
      },
      {
        q: "Koji je najpopularniji hidrolizat proteina u Srbiji?",
        a: "Dymatize ISO100 je jedan od najpopularnijih hidrolizata na srpskom tržištu — 25g proteina po porciji, manje od 1g ugljenih hidrata i masti. Optimum Nutrition Platinum Hydrowhey je drugi popularan izbor. Aktuelne cene su prikazane u listi iznad.",
      },
      {
        q: "Koliko košta hidrolizat proteina u Srbiji?",
        a: "Hidrolizati su premium segment — cene za standardna pakovanja kreću se od oko 5.000 do 12.000+ RSD zavisno od brenda, veličine pakovanja i prodavnice. Za realnu procenu vrednosti uvek gledaj cenu po gramu proteina.",
      },
    ],
  },

  casein: {
    h1: "Kazein Protein — Cene u Srbiji 2026",
    intro:
      "Kazein je mlečni protein koji se polako vari — 5 do 7 sati. Za razliku od whey proteina, kazein oslobađa aminokiseline postepeno, što ga čini idealnim za unos pre spavanja ili u periodima dužeg posta između obroka. Poredimo cene kazeina iz srpskih prodavnica.",
    guides: [
      { href: "/vodici/kada-piti-protein",                label: "⏰ Kada piti protein" },
      { href: "/vodici/koliko-proteina-dnevno",           label: "📊 Koliko proteina dnevno?" },
      { href: "/vodici/da-li-protein-goji",               label: "🔬 Da li protein goji?" },
      { href: "/vodici/koliko-novca-mesecno-za-proteine", label: "💸 Mesečni trošak proteina" },
    ],
    faqs: [
      {
        q: "Zašto se kazein uzima pre spavanja?",
        a: "Kazein se u stomaku grudi (koagulira) i vari se sporije — 5 do 7 sati. Uzet pre spavanja, obezbeđuje konstantan dotok aminokiselina tokom noći kada telo regeneriše mišićno tkivo. Istraživanja pokazuju da noćni unos kazeina poboljšava oporavak i sintezu proteina.",
      },
      {
        q: "Može li se kazein kombinovati sa wheyem?",
        a: "Da — mnogi sportisti kombinuju whey posle treninga (brza apsorpcija) i kazein pre spavanja (spora apsorpcija). Ova kombinacija pokriva ceo spektar: brza nadoknada amino kiselina + noćna protekcija mišića.",
      },
      {
        q: "Koliko proteina ima kazein na 100g?",
        a: "Tipičan micellar casein ima 75–85g proteina na 100g, slično concentrate-u ali sa znatno drugačijim profilom apsorpcije. Gušća je konzistencija u mešavini, što ga čini pogodnim i kao gušći shake ili kao dobar izbor za proteinska peciva.",
      },
      {
        q: "Da li je kazein dobar za mršavljenje?",
        a: "Kazein je posebno koristan tokom dijete jer prolongovano osećanje sitosti i noćna protekcija mišića smanjuju katabolizam. Ako jedete u kalorijskom deficitu i želite da sačuvate mišiće, kazein pre spavanja je korisna strategija.",
      },
    ],
  },

  vegan: {
    h1: "Biljni Proteini — Cene u Srbiji 2026",
    intro:
      "Biljni proteini su idealna opcija za vegane, vegetarijance i sve koji žele da izbegnu mlečne derivate. Najčešće baze su grašak, soja, pirinač i konoplja. Sa 65–80g proteina na 100g i sve boljim ukusom, moderan biljni protein je ravnopravan izbor u odnosu na whey. Poredimo sve dostupne opcije u Srbiji.",
    guides: [
      { href: "/biljni-protein-srbija",                   label: "🌱 Vodič: Biljni proteini u Srbiji" },
      { href: "/vodici/koliko-proteina-dnevno",           label: "📊 Koliko proteina dnevno?" },
      { href: "/vodici/da-li-protein-goji",               label: "🔬 Da li protein goji?" },
      { href: "/vodici/protein-za-mrsavljenje",           label: "🔥 Protein za mršavljenje" },
      { href: "/vodici/koliko-novca-mesecno-za-proteine", label: "💸 Mesečni trošak proteina" },
    ],
    faqs: [
      {
        q: "Koji biljni protein ima kompletan aminokiselinski profil?",
        a: "Soyin protein ima kompletan profil svih esencijalnih aminokiselina, sličan whey-u. Grašak protein je bogat BCAA ali mu nedostaje metionin — kombinacija grašak+pirinač proteina nadoknađuje ovaj nedostatak i daje kompletan profil. Moderni blend-ovi biljnih proteina su upravo dizajnirani za ovo.",
      },
      {
        q: "Da li biljni protein ima dovoljno leucina za rast mišića?",
        a: "Leucin je ključan aminokiselina za mTOR signal i sintezu proteina. Biljni proteini generalno imaju nešto manji sadržaj leucina od whey-a, ali se to kompenzuje malo većom porcijom. Istraživanja pokazuju da su efekti na hipertrofiju slični kada se unosi dovoljno leucina.",
      },
      {
        q: "Da li biljni protein ima loš ukus?",
        a: "Stariji biljni proteini su imali karakteristično 'zeleni' ili peskoviti ukus. Moderna generacija proteina (posebno grašak-baze od renomiranih brendova) značajno je poboljšana — čokoladni i vanila ukusi su udobno pijeni. Preporučujemo da pročitaš recenzije za specifičan ukus pre kupovine.",
      },
      {
        q: "Koji je razlika između proteina od graška, soje i pirinča?",
        a: "Proteini od graška: visok BCAA, blagi ukus, nije alergen za većinu. Soja: kompletan aminokiselinski profil, ali potencijalni alergen i fitoestrogenski efekat koji neke brine. Pirinač: hipoalergen, manji sadržaj proteina, kombinuje se sa graškom. U praksi, blendovi od više biljnih izvora su optimalni.",
      },
    ],
  },

  blend: {
    h1: "Protein Blend — Cene u Srbiji 2026",
    intro:
      "Protein blend kombinuje više izvora proteina — najčešće whey concentrate, isolate i kazein. Rezultat je slojevitija apsorpcija: whey daje brzu dozu aminokiselina, kazein produžava efekat satima. Dobar kompromis za svakodnevnu upotrebu. Poredimo sve blend proteine dostupne u Srbiji.",
    guides: [
      { href: "/vodici/koliko-proteina-dnevno",           label: "📊 Koliko proteina dnevno?" },
      { href: "/vodici/kada-piti-protein",                label: "⏰ Kada piti protein" },
      { href: "/vodici/whey-isolate-vs-concentrate",      label: "⚗️ Isolate vs Concentrate" },
      { href: "/vodici/koliko-novca-mesecno-za-proteine", label: "💸 Mesečni trošak proteina" },
    ],
    faqs: [
      {
        q: "Šta je protein blend i zašto se koristi?",
        a: "Protein blend mešavina je dve ili više vrsta proteina — najčešće whey concentrate + isolate + kazein. Svaka vrsta ima drugačiju brzinu apsorpcije: whey concentrate je brz (1–2h), kazein je spor (5–7h). Blend pruža 'sustained release' efekat — aminokiseline su dostupne satima, a ne samo u prvom satu posle unosa.",
      },
      {
        q: "Da li je blend bolji od čistog whey isolate-a?",
        a: "Zavisi od cilja. Za post-workout oporavak kada je brza apsorpcija prioritet, čist isolate ili hidrolizat je bolji. Za meal replacement ili obrok između treninga, blend je praktičniji jer duže sitosi. Blend je kompromis koji dobro funkcioniše za svakodnevnu upotrebu.",
      },
      {
        q: "Koliko proteina ima protein blend na 100g?",
        a: "Tipičan blend sadrži 70–85g proteina na 100g, slično concentrate-u. Sadržaj varira jer svaki brend ima različit odnos komponenti. Uvek gledaj deklaraciju, ne samo marketing.",
      },
      {
        q: "Da li osobe sa intolerancijom na laktozu mogu piti blend?",
        a: "Zavisi od sastava. Blend koji sadrži whey concentrate ima nešto više laktoze od čistog isolate-a. Ako imaš intoleranciju, biraj blend koji sadrži pretežno isolate kao primarnu komponentu, ili pređi na biljni protein.",
      },
    ],
  },

  egg: {
    h1: "Egg Protein — Cene u Srbiji 2026",
    intro:
      "Protein od jajeta (albumin) je jedan od najstarijih proteinskih suplemenata — pre pojave whey-a, bio je standard u bodybuildingu. Bez mlečnih derivata i laktoze, sa kompletnim aminokiselinskim profilom sličnim whey-u. Dobra opcija za osobe koje ne podnose mlečne proteine, a žele nešto brže od biljnog proteina. Poredimo sve egg protein opcije dostupne u Srbiji.",
    guides: [
      { href: "/vodici/koliko-proteina-dnevno",           label: "📊 Koliko proteina dnevno?" },
      { href: "/vodici/kada-piti-protein",                label: "⏰ Kada piti protein" },
      { href: "/vodici/whey-isolate-vs-concentrate",      label: "⚗️ Isolate vs Concentrate" },
      { href: "/vodici/koliko-novca-mesecno-za-proteine", label: "💸 Mesečni trošak proteina" },
    ],
    faqs: [
      {
        q: "Šta je egg protein i od čega se pravi?",
        a: "Egg protein (albumin) se dobija sušenjem i dehidracijom belanceta jajeta, bez žumanceta — zato je gotovo bez masti i ugljenih hidrata. Sadrži kompletan aminokiselinski profil sa svih 9 esencijalnih aminokiselina, po kvalitetu blizu whey proteina.",
      },
      {
        q: "Da li je egg protein bolji izbor od whey-a za osobe sa intolerancijom na laktozu?",
        a: "Da — egg protein je potpuno bez mlečnih derivata i laktoze, pa je bezbedan izbor za osobe koje ne podnose whey ili kazein. Apsorbuje se sporije od whey isolate-a, ali brže od kazeina — negde između ta dva po brzini.",
      },
      {
        q: "Koliko proteina ima egg protein na 100g?",
        a: "Tipičan egg protein prah sadrži 80–90g proteina na 100g, uporedivo sa whey isolate-om. Pošto je žumance uklonjeno, sadržaj masti je minimalan (obično ispod 2g na 100g).",
      },
      {
        q: "Zašto je egg protein manje popularan i skuplji od whey-a?",
        a: "Proizvodnja egg proteina je skuplja i sporija od whey-a (koji je nusproizvod masovne proizvodnje sira), pa je i ponuda manja. Ukus je takođe specifičniji za mnoge korisnike. I dalje je koristan izbor za nišu koja izbegava i mlečne i biljne proteine.",
      },
    ],
  },
};
