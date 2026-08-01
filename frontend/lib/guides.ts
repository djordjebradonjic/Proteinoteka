import { CURRENT_MARKET } from "@/lib/marketConfig";

// Same topic set, two markets — keys MUST match 1:1 so CATEGORY_GUIDES below
// (topic → guide slug) works unchanged regardless of which market is deployed.
const GUIDES_RS = {
  "najbolji-protein-za-pocetnike": {
    path: "/vodici/najbolji-protein-za-pocetnike",
    title: "Najbolji protein za početnike",
    description: "Top izbori po budžetu, vrednosti i svarljivosti",
  },
  "kako-uzimati-whey-protein": {
    path: "/vodici/kako-uzimati-whey-protein",
    title: "Kako uzimati whey protein",
    description: "Doza, tajming, mešanje i najčešće greške",
  },
  "whey-isolate-vs-concentrate": {
    path: "/vodici/whey-isolate-vs-concentrate",
    title: "Whey Isolate vs Concentrate",
    description: "Koja je razlika i što da odabereš?",
  },
  "kada-piti-protein": {
    path: "/vodici/kada-piti-protein",
    title: "Kada piti protein",
    description: "Pre, posle treninga ili ujutru?",
  },
  "koliko-proteina-dnevno": {
    path: "/vodici/koliko-proteina-dnevno",
    title: "Koliko proteina dnevno",
    description: "Konkretan odgovor za aktivne ljude",
  },
  "da-li-protein-goji": {
    path: "/vodici/da-li-protein-goji",
    title: "Da li protein goji?",
    description: "Istina o proteinima i telesnoj masi",
  },
  "protein-za-mrsavljenje": {
    path: "/vodici/protein-za-mrsavljenje",
    title: "Protein za mršavljenje",
    description: "Koji protein odabrati i kako ga koristiti",
  },
} as const;

const GUIDES_HR: Record<keyof typeof GUIDES_RS, { path: string; title: string; description: string }> = {
  "najbolji-protein-za-pocetnike": {
    path: "/hr-vodici/najbolji-protein-za-pocetnike-hrvatska",
    title: "Najbolji protein za početnike",
    description: "Top izbori po budžetu, vrijednosti i probavljivosti",
  },
  "kako-uzimati-whey-protein": {
    path: "/hr-vodici/kako-uzimati-whey-protein-hrvatska",
    title: "Kako uzimati whey protein",
    description: "Doza, tajming, miješanje i najčešće pogreške",
  },
  "whey-isolate-vs-concentrate": {
    path: "/hr-vodici/whey-isolate-vs-concentrate-hrvatska",
    title: "Whey Isolate vs Concentrate",
    description: "Koja je razlika i što odabrati?",
  },
  "kada-piti-protein": {
    path: "/hr-vodici/kada-piti-protein-hrvatska",
    title: "Kada piti protein",
    description: "Prije, poslije treninga ili ujutro?",
  },
  "koliko-proteina-dnevno": {
    path: "/hr-vodici/koliko-proteina-dnevno-hrvatska",
    title: "Koliko proteina dnevno",
    description: "Konkretan odgovor za aktivne osobe",
  },
  "da-li-protein-goji": {
    path: "/hr-vodici/da-li-protein-goji-hrvatska",
    title: "Goji li protein?",
    description: "Istina o proteinima i tjelesnoj masi",
  },
  "protein-za-mrsavljenje": {
    path: "/hr-vodici/protein-za-mrsavljenje-hrvatska",
    title: "Protein za mršavljenje",
    description: "Koji protein odabrati i kako ga koristiti",
  },
};

export const GUIDES = CURRENT_MARKET === "hr" ? GUIDES_HR : GUIDES_RS;

export type GuideSlug = keyof typeof GUIDES_RS;

export const CATEGORY_GUIDES: Record<string, GuideSlug[]> = {
  whey_isolate:     ["najbolji-protein-za-pocetnike", "whey-isolate-vs-concentrate", "kako-uzimati-whey-protein", "protein-za-mrsavljenje"],
  whey_concentrate: ["najbolji-protein-za-pocetnike", "whey-isolate-vs-concentrate", "kako-uzimati-whey-protein", "kada-piti-protein"],
  vegan:            ["najbolji-protein-za-pocetnike", "koliko-proteina-dnevno",       "protein-za-mrsavljenje"],
  casein:           ["najbolji-protein-za-pocetnike", "kada-piti-protein",            "koliko-proteina-dnevno"],
  hydrolysate:      ["kada-piti-protein",            "protein-za-mrsavljenje", "koliko-proteina-dnevno"],
  blend:            ["koliko-proteina-dnevno",       "kada-piti-protein",      "da-li-protein-goji"],
};
