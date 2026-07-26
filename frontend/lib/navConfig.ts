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

const HR_HEADER_GUIDES: NavLink[] = [
  { label: "Whey protein za početnike", href: "/hr-vodici/whey-protein-za-pocetnike-hrvatska" },
  { label: "Koliko košta protein u HR?", href: "/hr-vodici/koliko-kosta-protein-hrvatska"      },
  { label: "Koliko proteina dnevno?",   href: "/hr-vodici/koliko-proteina-dnevno-hrvatska"     },
  { label: "Protein za mršavljenje",    href: "/hr-vodici/protein-za-mrsavljenje-hrvatska"     },
  { label: "Da li protein goji?",       href: "/hr-vodici/da-li-protein-goji-hrvatska"         },
];

export const HEADER_GUIDES =
  CURRENT_MARKET === "hr" ? HR_HEADER_GUIDES : RS_HEADER_GUIDES;

export const HEADER_NAV_LINKS: NavLink[] =
  CURRENT_MARKET === "hr"
    ? [
        { label: "Cijene",          href: "/" },
        { label: "Top lista",       href: "/?sort=valueScore%2Cdesc" },
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
  { label: "GymBeam",        href: "/gymbeam-proteini"        },
  { label: "MyProtein",      href: "/myprotein-proteini"      },
  { label: "Proteinbox",     href: "/proteinbox-proteini"     },
  { label: "Proteini.si",    href: "/proteini-si-srbija"      },
  { label: "Lama",           href: "/lama-proteini"           },
  { label: "Shopbuilder",    href: "/shopbuilder-proteini"    },
  { label: "XSport",         href: "/xsport-proteini"         },
];

const HR_FOOTER_STORES: NavLink[] = [
  { label: "GymBeam HR",        href: "/?store=GymBeam+HR"          },
  { label: "MyProtein HR",      href: "/?store=MyProtein+HR"        },
  { label: "Polleo Sport",      href: "/?store=Polleo+Sport"        },
  { label: "Proteka",           href: "/?store=Proteka"             },
  { label: "Nutrition Shop HR", href: "/?store=Nutrition+Shop+HR"   },
  { label: "Proteini.si HR",    href: "/proteini-si-hrvatska"       },
  { label: "Proteini Outlet",   href: "/?store=Proteini+Outlet"     },
];

export const FOOTER_STORES =
  CURRENT_MARKET === "hr" ? HR_FOOTER_STORES : RS_FOOTER_STORES;

const RS_FOOTER_GUIDES: NavLink[] = [
  { label: "Protein za početnike",    href: "/vodici/whey-protein-za-pocetnike"   },
  { label: "Kako uzimati whey protein", href: "/vodici/kako-uzimati-whey-protein" },
  { label: "Koliko proteina dnevno?", href: "/vodici/koliko-proteina-dnevno"      },
  { label: "Protein za mršavljenje",  href: "/vodici/protein-za-mrsavljenje"      },
  { label: "Da li protein goji?",     href: "/vodici/da-li-protein-goji"          },
  { label: "Kada piti protein?",      href: "/vodici/kada-piti-protein"           },
  { label: "Isolate vs Concentrate",  href: "/vodici/whey-isolate-vs-concentrate" },
  { label: "Svi vodiči →",            href: "/vodici"                             },
];

const HR_FOOTER_GUIDES: NavLink[] = [
  { label: "Whey protein za početnike", href: "/hr-vodici/whey-protein-za-pocetnike-hrvatska" },
  { label: "Kako uzimati whey protein", href: "/hr-vodici/kako-uzimati-whey-protein-hrvatska" },
  { label: "Koliko košta protein u HR?", href: "/hr-vodici/koliko-kosta-protein-hrvatska"      },
  { label: "Koliko proteina dnevno?",   href: "/hr-vodici/koliko-proteina-dnevno-hrvatska"    },
  { label: "Protein za mršavljenje",    href: "/hr-vodici/protein-za-mrsavljenje-hrvatska"    },
  { label: "Da li protein goji?",       href: "/hr-vodici/da-li-protein-goji-hrvatska"        },
  { label: "Svi vodiči →",              href: "/hr-vodici"                                     },
];

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

export const ALL_GUIDES_HREF =
  CURRENT_MARKET === "hr" ? "/hr-vodici" : "/vodici";
