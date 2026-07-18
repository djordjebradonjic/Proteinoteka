export const GUIDES = {
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

export type GuideSlug = keyof typeof GUIDES;

export const CATEGORY_GUIDES: Record<string, GuideSlug[]> = {
  whey_isolate:     ["najbolji-protein-za-pocetnike", "whey-isolate-vs-concentrate", "kako-uzimati-whey-protein", "protein-za-mrsavljenje"],
  whey_concentrate: ["najbolji-protein-za-pocetnike", "whey-isolate-vs-concentrate", "kako-uzimati-whey-protein", "kada-piti-protein"],
  vegan:            ["najbolji-protein-za-pocetnike", "koliko-proteina-dnevno",       "protein-za-mrsavljenje"],
  casein:           ["najbolji-protein-za-pocetnike", "kada-piti-protein",            "koliko-proteina-dnevno"],
  hydrolysate:      ["kada-piti-protein",            "protein-za-mrsavljenje", "koliko-proteina-dnevno"],
  blend:            ["koliko-proteina-dnevno",       "kada-piti-protein",      "da-li-protein-goji"],
};
