export const GUIDES = {
  "whey-isolate-vs-concentrate": {
    path: "/vodici/whey-isolate-vs-concentrate",
    title: "Whey Isolate vs Concentrate",
    description: "Koja je razlika i šta da odabereš?",
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
} as const;

export type GuideSlug = keyof typeof GUIDES;

export const CATEGORY_GUIDES: Record<string, GuideSlug[]> = {
  whey_isolate:     ["whey-isolate-vs-concentrate", "kada-piti-protein", "koliko-proteina-dnevno"],
  whey_concentrate: ["whey-isolate-vs-concentrate", "kada-piti-protein", "koliko-proteina-dnevno"],
  vegan:            ["koliko-proteina-dnevno", "kada-piti-protein"],
  casein:           ["kada-piti-protein", "koliko-proteina-dnevno"],
  hydrolysate:      ["kada-piti-protein", "koliko-proteina-dnevno"],
  blend:            ["koliko-proteina-dnevno", "kada-piti-protein"],
};
