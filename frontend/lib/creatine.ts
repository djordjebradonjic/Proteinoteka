import { CURRENT_MARKET } from "@/lib/marketConfig";

// Everything the creatine pages share: URL parts, form/type vocabulary, how a pack is described and what a
// serving costs. Pure and market-aware (RS ekavica / HR ijekavica); no React, no fetching.

const HR = CURRENT_MARKET === "hr";

export const CREATINE_PATH = "/kreatin";
export const CREATINE_TYPE = "creatine";

export interface CreatineLike {
  productType?: string | null;
  productForm?: string | null;
  unitCount?: number | null;
  primaryWeightGrams?: number | null;
  numericPrice: number;
  servingsPerContainer?: number | null;
  weights?: string[] | null;
}

export function isCreatine(p: { productType?: string | null }): boolean {
  return p.productType === CREATINE_TYPE;
}

// ── Forms ────────────────────────────────────────────────────────────────────────

export interface FormTab {
  /** value of the `oblik` URL parameter */
  key: string;
  label: string;
  /** value of the API's `productForm` filter; empty = every form */
  forms: string;
}

export const FORM_TABS: FormTab[] = [
  { key: "prah",    label: "Prah",                               forms: "powder"  },
  { key: "kapsule", label: "Kapsule",                            forms: "capsule" },
  { key: "tablete", label: "Tablete",                            forms: "tablet"  },
  { key: "gumice",  label: HR ? "Gumeni bomboni" : "Gumene bombone", forms: "gummy"   },
  { key: "sve",     label: "Sve",                                forms: ""        },
];

export const DEFAULT_FORM_TAB = "prah";

export function formTab(key: string | null | undefined): FormTab {
  return FORM_TABS.find((t) => t.key === key) ?? FORM_TABS[0];
}

export const FORM_LABELS: Record<string, string> = {
  powder:  "Prah",
  capsule: "Kapsule",
  tablet:  "Tablete",
  gummy:   HR ? "Gumeni bomboni" : "Gumene bombone",
  liquid:  HR ? "Tekućina" : "Tečnost",
  other:   HR ? "Ostalo" : "Ostalo",
};

/** Sold by the piece: the pack is a count, not a weight, and it is not scored (see the value score guide). */
export function isCountedForm(form: string | null | undefined): boolean {
  return form === "capsule" || form === "tablet" || form === "gummy";
}

// ── Types (chemistry) ────────────────────────────────────────────────────────────

export const TYPE_LABELS: Record<string, string> = {
  monohydrate: "Monohidrat",
  creapure:    "Creapure®",
  hcl:         "HCl",
  buffered:    "Kre-Alkalyn (puferovani)",
  malate:      "Malat",
  ethyl_ester: "Etil-estar",
  nitrate:     "Nitrat",
  blend:       HR ? "Mješavina" : "Mešavina",
};

export const TYPE_OPTIONS = Object.keys(TYPE_LABELS);

// ── Stores that carry creatine (names as stored: the API filters by them) ─────────

export const CREATINE_STORES: string[] = HR
  ? ["GymBeam HR", "MyProtein HR", "Proteka", "Nutrition Shop HR", "Proteini.si HR", "Proteini Outlet"]
  : ["Pansport", "GymBeam", "MyProtein", "Lama", "SupplementStore", "XSport", "FitLab", "Ogistrashop", "Proteini.si", "Supplementshop", "Proteinbox"];

// ── Packs and prices ─────────────────────────────────────────────────────────────

const PIECE_WORDS: Record<string, string> = {
  capsule: "kapsula",
  tablet:  "tableta",
  gummy:   "gumenih bombona",
};

function decimal(n: number): string {
  return String(Math.round(n * 100) / 100).replace(".", ",");
}

/** "500 g", "1,5 kg", "120 kapsula" — how the pack is written on the card and on the page. */
export function packLabel(p: CreatineLike): string | null {
  if (isCountedForm(p.productForm) && p.unitCount && p.unitCount > 0) {
    return `${p.unitCount} ${PIECE_WORDS[p.productForm as string]}`;
  }
  const g = p.primaryWeightGrams;
  if (g && g > 0) return g >= 1000 ? `${decimal(g / 1000)} kg` : `${Math.round(g)} g`;
  return p.weights && p.weights.length > 0 ? p.weights[0] : null;
}

/** Price of 100 g of the pack; only for packs with a gram weight (powders). */
export function pricePer100g(p: CreatineLike): number | null {
  const g = p.primaryWeightGrams;
  if (isCountedForm(p.productForm) || !g || g <= 0 || !p.numericPrice || p.numericPrice <= 0) return null;
  return (p.numericPrice / g) * 100;
}

/** Price of one serving, when the pack's number of servings is known and believable. */
export function pricePerServing(p: CreatineLike): number | null {
  const n = p.servingsPerContainer;
  if (!n || n < 5 || n > 1000 || !p.numericPrice || p.numericPrice <= 0) return null;
  return p.numericPrice / n;
}

// ── Copy ─────────────────────────────────────────────────────────────────────────

export const CREATINE_COPY = HR
  ? {
      navLabel: "Kreatin",
      store: "Trgovina",
      stores: "trgovine",
      storesMany: "trgovina",
      breadcrumbHome: "Početna",
      page: {
        title: "Kreatin cijena Hrvatska – usporedi trgovine | Proteinoteka",
        description:
          "Usporedi cijene kreatina u hrvatskim trgovinama: monohidrat, Creapure®, kapsule i tablete. Cijena po 100 g za svaki kreatin na jednom mjestu.",
        keywords: ["kreatin cijena", "kreatin hrvatska", "kreatin monohidrat cijena", "najjeftiniji kreatin", "creapure cijena", "kreatin kapsule cijena", "gdje kupiti kreatin"],
        ogTitle: "Proteinoteka – Koji kreatin je najisplativiji?",
        h1: "Kreatin: usporedi cijene i pronađi najisplativiji",
        eyebrow: "Kreatin – usporedba cijena",
        lead:
          "Kreatin monohidrat jedan je od rijetkih dodataka prehrani čiji je učinak potvrđen u desecima studija. Isti se proizvod u različitim trgovinama ne prodaje po istoj cijeni, pa za svaki kreatin prikazujemo cijenu po 100 g i cijenu po dozi.",
        chips: ["Cijena po 100 g za svaki prah", "Prati pad cijene", "Samo hrvatske trgovine"],
        schemaName: "Najisplativiji kreatin u Hrvatskoj",
      },
      hero: { cta: "Najveći pad cijene →" },
      featured: {
        title: "Izdvojeno",
        subtitle: "Kreatin s najvećim padom cijene",
        tabDrops: "🔥 Najveći pad cijene",
        emptyDrops: "Trenutno nema kreatina s padom cijene.",
      },
      listing: {
        sort: { priceAsc: "Najniža cijena", priceDesc: "Najviša cijena", nameAz: "Naziv A–Ž" },
        type: "Vrsta", brand: "Brend", store: "Trgovina", weight: "Pakiranje", price: "Cijena", search: "Traži kreatin…",
        reset: "Poništi filtre", from: "od", to: "do", results: (from: number, to: number, total: number) => `Prikazano ${from}–${to} od ${total}`,
        none: "Nema kreatina za odabrane filtre",
      },
      product: {
        titleSuffix: " – Cijena u Hrvatskoj | Proteinoteka",
        descSuffix: "Cijene u hrvatskim trgovinama i cijena po 100 g.",
        buy: (store: string) => `Kupi u trgovini ${store}`,
        track: "Prati cijenu",
        tracking: "Praćenje uključeno",
        whereCheapest: "Gdje je najjeftinije",
        specs: "Što piše na pakiranju",
        history: "Povijest cijene",
        similar: "Slični kreatini",
        form: "Oblik", type: "Vrsta kreatina", pack: "Pakiranje", servings: "Broj doza",
        dose: "Doza po porciji", perServing: "Cijena po dozi", per100: "Cijena po 100 g",
        cheapest: "Najjeftinije",
        lastUpdated: "Cijena provjerena",
        disclaimer: "Cijene i dostupnost mogu se promijeniti; provjeri ih u trgovini prije kupnje.",
      },
      guide: {
        title: "Kako odabrati kreatin",
        disclaimer: "Tekst je informativan i ne zamjenjuje savjet liječnika. Ako imaš zdravstvenih tegoba, posebno problema s bubrezima, ili uzimaš lijekove, prije uzimanja kreatina posavjetuj se s liječnikom.",
        sections: [
          {
            h: "Koji kreatin odabrati",
            p: "Monohidrat je standard: najbolje je istražen i po učinku ne zaostaje za skupljim oblicima. Kreatin HCl, puferirani Kre-Alkalyn i slični oblici reklamiraju se boljom topljivošću ili blažim djelovanjem na želudac, ali dokaza da rade bolje od monohidrata nema. Creapure® oznaka je za monohidrat njemačke proizvodnje (AlzChem) uz provjerenu čistoću. Ako je razlika u cijeni mala, razuman je izbor; ako je velika, običan monohidrat provjerenog brenda posve je dovoljan.",
          },
          {
            h: "Koliko kreatina uzimati",
            p: "Uobičajena doza je 3 do 5 g dnevno, svaki dan, i onda kad ne treniraš. Faza punjenja (oko 20 g dnevno tijekom tjedan dana) nije obavezna: do iste razine u mišićima stiže se i bez nje, samo za otprilike mjesec dana.",
          },
          {
            h: "Prah, kapsule ili tablete",
            p: "Prah je najjeftiniji po gramu kreatina i lako se dozira. Kapsule i tablete praktičnije su za put, ali je gram kreatina u njima obično nekoliko puta skuplji, a mnogi proizvođači ne navode koliko kreatina pakiranje stvarno sadrži.",
          },
        ],
        faq: [
          { q: "Koji je kreatin najbolji?", a: "Kreatin monohidrat. Najbolje je istražen, a skuplji oblici (HCl, puferirani, ethyl-ester) nemaju dokazanu prednost. Creapure® je monohidrat njemačke proizvodnje s provjerenom čistoćom." },
          { q: "Koliko kreatina dnevno?", a: "3 do 5 g dnevno, svaki dan. Faza punjenja s oko 20 g dnevno nije obavezna." },
          { q: "Je li kreatin u prahu isplativiji od kapsula?", a: "Da. Prah je obično nekoliko puta jeftiniji po gramu kreatina, a kapsule i tablete opravdava samo praktičnost." },
        ],
      },
    }
  : {
      navLabel: "Kreatin",
      store: "Prodavnica",
      stores: "prodavnice",
      storesMany: "prodavnica",
      breadcrumbHome: "Početna",
      page: {
        title: "Kreatin cena Srbija – uporedi prodavnice | Proteinoteka",
        description:
          "Uporedi cene kreatina u srpskim prodavnicama: monohidrat, Creapure®, kapsule i tablete. Cena po 100 g za svaki kreatin na jednom mestu.",
        keywords: ["kreatin cena", "kreatin srbija", "kreatin monohidrat cena", "najjeftiniji kreatin", "creapure cena", "kreatin kapsule cena", "gde kupiti kreatin"],
        ogTitle: "Proteinoteka – Koji kreatin je najisplativiji?",
        h1: "Kreatin: uporedi cene i pronađi najisplativiji",
        eyebrow: "Kreatin – poređenje cena",
        lead:
          "Kreatin monohidrat je jedan od retkih suplemenata čiji je učinak potvrđen u desetinama studija. Isti proizvod se u različitim prodavnicama ne prodaje po istoj ceni, pa za svaki kreatin prikazujemo cenu po 100 g i cenu po dozi.",
        chips: ["Cena po 100 g za svaki prah", "Prati pad cene", "Samo prodavnice iz Srbije"],
        schemaName: "Najisplativiji kreatin u Srbiji",
      },
      hero: { cta: "Najveći pad cene →" },
      featured: {
        title: "Izdvojeno",
        subtitle: "Kreatin sa najvećim padom cene",
        tabDrops: "🔥 Najveći pad cene",
        emptyDrops: "Trenutno nema kreatina sa padom cene.",
      },
      listing: {
        sort: { priceAsc: "Najniža cena", priceDesc: "Najviša cena", nameAz: "Naziv A–Š" },
        type: "Vrsta", brand: "Brend", store: "Prodavnica", weight: "Pakovanje", price: "Cena", search: "Traži kreatin…",
        reset: "Poništi filtere", from: "od", to: "do", results: (from: number, to: number, total: number) => `Prikazano ${from}–${to} od ${total}`,
        none: "Nema kreatina za izabrane filtere",
      },
      product: {
        titleSuffix: " – Cena u Srbiji | Proteinoteka",
        descSuffix: "Cene u srpskim prodavnicama i cena po 100 g.",
        buy: (store: string) => `Kupi u prodavnici ${store}`,
        track: "Prati cenu",
        tracking: "Praćenje uključeno",
        whereCheapest: "Gde je najjeftinije",
        specs: "Šta piše na pakovanju",
        history: "Istorija cene",
        similar: "Slični kreatini",
        form: "Oblik", type: "Vrsta kreatina", pack: "Pakovanje", servings: "Broj doza",
        dose: "Doza po porciji", perServing: "Cena po dozi", per100: "Cena po 100 g",
        cheapest: "Najjeftinije",
        lastUpdated: "Cena proverena",
        disclaimer: "Cene i dostupnost se menjaju; proveri ih u prodavnici pre kupovine.",
      },
      guide: {
        title: "Kako izabrati kreatin",
        disclaimer: "Tekst je informativan i ne zamenjuje savet lekara. Ako imaš zdravstvenih tegoba, posebno problema sa bubrezima, ili uzimaš lekove, pre uzimanja kreatina posavetuj se sa lekarom.",
        sections: [
          {
            h: "Koji kreatin izabrati",
            p: "Monohidrat je standard: najbolje je istražen i po učinku ne zaostaje za skupljim oblicima. Kreatin HCl, puferovani Kre-Alkalyn i slični oblici reklamiraju se boljom rastvorljivošću ili blažim dejstvom na stomak, ali dokaza da rade bolje od monohidrata nema. Creapure® je oznaka za monohidrat nemačke proizvodnje (AlzChem) sa proverenom čistoćom. Ako je razlika u ceni mala, razuman je izbor; ako je velika, običan monohidrat proverenog brenda sasvim je dovoljan.",
          },
          {
            h: "Koliko kreatina uzimati",
            p: "Uobičajena doza je 3 do 5 g dnevno, svaki dan, i kad ne treniraš. Faza punjenja (oko 20 g dnevno tokom nedelju dana) nije obavezna: do istog nivoa u mišićima se stiže i bez nje, samo za otprilike mesec dana.",
          },
          {
            h: "Prah, kapsule ili tablete",
            p: "Prah je najjeftiniji po gramu kreatina i lako se dozira. Kapsule i tablete su praktičnije za put, ali je gram kreatina u njima obično nekoliko puta skuplji, a mnogi proizvođači ne navode koliko kreatina pakovanje zaista sadrži.",
          },
        ],
        faq: [
          { q: "Koji je kreatin najbolji?", a: "Kreatin monohidrat. Najbolje je istražen, a skuplji oblici (HCl, puferovani, etil-estar) nemaju dokazanu prednost. Creapure® je monohidrat nemačke proizvodnje sa proverenom čistoćom." },
          { q: "Koliko kreatina dnevno?", a: "3 do 5 g dnevno, svaki dan. Faza punjenja sa oko 20 g dnevno nije obavezna." },
          { q: "Da li je kreatin u prahu isplativiji od kapsula?", a: "Da. Prah je obično nekoliko puta jeftiniji po gramu kreatina, a kapsule i tablete opravdava samo praktičnost." },
        ],
      },
    };

/** "1 prodavnica", "3 prodavnice", "7 prodavnica": the noun agrees with the number (same rule in sr and hr). */
export function storeCount(n: number): string {
  const few = n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14);
  return `${n} ${few ? CREATINE_COPY.stores : CREATINE_COPY.storesMany}`;
}
