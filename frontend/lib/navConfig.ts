import { CURRENT_MARKET } from "@/lib/marketConfig";

export type NavLink = { label: string; href: string };

const RS_HEADER_GUIDES: NavLink[] = [
  { label: "Whey protein cena",          href: "/whey-protein-cena"                  },
  { label: "Najjeftiniji whey protein",  href: "/najjeftiniji-whey-protein"          },
  { label: "Najbolji whey protein",      href: "/najbolji-whey-protein-srbija"       },
  { label: "Whey izolat Srbija",         href: "/whey-isolate-srbija"                },
  { label: "Biljni protein Srbija",      href: "/biljni-protein-srbija"              },
  { label: "Protein za masu",            href: "/protein-za-masu"                    },
  { label: "Protein za mršavljenje",     href: "/vodici/protein-za-mrsavljenje"      },
  { label: "Koliko proteina dnevno?",    href: "/vodici/koliko-proteina-dnevno"      },
  { label: "Isolate vs Concentrate",     href: "/vodici/whey-isolate-vs-concentrate" },
  { label: "Da li protein goji?",        href: "/vodici/da-li-protein-goji"          },
  { label: "Kada piti protein?",         href: "/vodici/kada-piti-protein"           },
  { label: "Kako računamo Value Score",  href: "/kako-racunamo-value-score"          },
  { label: "O Proteinoteci",             href: "/o-nama"                             },
];

// HR guides will be added in Faza 3 (blog/MDX phase)
const HR_HEADER_GUIDES: NavLink[] = [];

export const HEADER_GUIDES =
  CURRENT_MARKET === "hr" ? HR_HEADER_GUIDES : RS_HEADER_GUIDES;

export const HEADER_NAV_LINKS: NavLink[] =
  CURRENT_MARKET === "hr"
    ? [
        { label: "Cijene",          href: "/" },
        { label: "Top lista",       href: "/?sort=valueScore%2Cdesc" },
        { label: "Baza podataka",   href: "/baza-podataka" },
      ]
    : [
        { label: "Cene",            href: "/whey-protein-cena" },
        { label: "Top lista",       href: "/najbolji-whey-protein-srbija" },
        { label: "Baza podataka",   href: "/baza-podataka" },
      ];

// ── Footer ──────────────────────────────────────────────────────────────────

const RS_FOOTER_STORES: NavLink[] = [
  { label: "Ogistrashop",    href: "/ogistrashop-proteini"    },
  { label: "Supplementshop", href: "/supplementshop-proteini" },
  { label: "Pansport",       href: "/pansport-proteini"       },
  { label: "FitLab",         href: "/fitlab-proteini"         },
  { label: "Proteinbox",     href: "/proteinbox-proteini"     },
  { label: "Proteini.si",    href: "/proteini-si-srbija"      },
  { label: "Lama",           href: "/lama-proteini"           },
  { label: "Shopbuilder",    href: "/shopbuilder-proteini"    },
  { label: "XSport",         href: "/xsport-proteini"         },
];

const HR_FOOTER_STORES: NavLink[] = [
  { label: "GymBeam HR",        href: "/?store=GymBeam+HR"        },
  { label: "MyProtein HR",      href: "/?store=MyProtein+HR"      },
  { label: "Polleo Sport",      href: "/?store=Polleo+Sport"      },
  { label: "Proteka",           href: "/?store=Proteka"           },
  { label: "Nutrition Shop HR", href: "/?store=Nutrition+Shop+HR" },
];

export const FOOTER_STORES =
  CURRENT_MARKET === "hr" ? HR_FOOTER_STORES : RS_FOOTER_STORES;

const RS_FOOTER_GUIDES: NavLink[] = [
  { label: "Protein za početnike",    href: "/vodici/whey-protein-za-pocetnike"   },
  { label: "Koliko proteina dnevno?", href: "/vodici/koliko-proteina-dnevno"      },
  { label: "Protein za mršavljenje",  href: "/vodici/protein-za-mrsavljenje"      },
  { label: "Da li protein goji?",     href: "/vodici/da-li-protein-goji"          },
  { label: "Kada piti protein?",      href: "/vodici/kada-piti-protein"           },
  { label: "Isolate vs Concentrate",  href: "/vodici/whey-isolate-vs-concentrate" },
  { label: "Svi vodiči →",            href: "/vodici"                             },
];

// HR guides will be added in Faza 3
const HR_FOOTER_GUIDES: NavLink[] = [];

export const FOOTER_GUIDES =
  CURRENT_MARKET === "hr" ? HR_FOOTER_GUIDES : RS_FOOTER_GUIDES;

const RS_FOOTER_POPULAR: NavLink[] = [
  { label: "Whey protein cena",         href: "/whey-protein-cena"            },
  { label: "Najjeftiniji whey protein", href: "/najjeftiniji-whey-protein"    },
  { label: "Najbolji whey protein",     href: "/najbolji-whey-protein-srbija" },
  { label: "Whey izolat Srbija",        href: "/whey-isolate-srbija"          },
  { label: "Početna",                   href: "/"                             },
  { label: "O nama",                    href: "/o-nama"                       },
  { label: "Kontakt",                   href: "/#kontakt"                     },
  { label: "Kako računamo score",       href: "/kako-racunamo-value-score"    },
  { label: "Politika privatnosti",      href: "/privacy-policy"               },
  { label: "Uslovi korišćenja",         href: "/terms-of-use"                 },
];

const HR_FOOTER_POPULAR: NavLink[] = [
  { label: "Početna",              href: "/"               },
  { label: "O nama",               href: "/o-nama"         },
  { label: "Kontakt",              href: "/#kontakt"       },
  { label: "Politika privatnosti", href: "/privacy-policy" },
];

export const FOOTER_POPULAR =
  CURRENT_MARKET === "hr" ? HR_FOOTER_POPULAR : RS_FOOTER_POPULAR;
