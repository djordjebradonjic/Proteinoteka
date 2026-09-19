import { LiveBrandPage } from "@/components/seo/LiveBrandPage";
import { brandMetadata, type LiveBrandConfig } from "@/lib/live-brand";

export const revalidate = 86400;

const CONFIG: LiveBrandConfig = {
  slug: "amix-proteini",
  brandName: "Amix",
  apiBrands: "Amix Nutrition",
  h1: "Amix proteini u Srbiji",
  lead: "Amix Nutrition u našoj bazi ima whey izolate (Gold Whey, IsoPrime CFM), whey mešavine (Whey Pure Fusion), goveđi protein (Monster Beef) i biljni Vegefiit.",
  // Order matters: "Monster Beef" must match before the generic "Monster Whey".
  lines: [
    { key: "beef", label: "Monster Beef", blurb: "Goveđi protein bez mlečnih sastojaka; niži value score jer je izvor proteina govedina, a ne whey.", match: /beef/i },
    { key: "vegan", label: "Vegefiit (biljni)", blurb: "Biljni protein.", match: /vegefiit|greenday|vegan/i },
    { key: "gold", label: "Gold Whey Isolate", blurb: "Izolat: više proteina na 100 g i manje laktoze od koncentrata.", match: /gold\s*whey/i },
    { key: "isoprime", label: "IsoPrime CFM Isolate", blurb: "Izolat: više proteina na 100 g i manje laktoze od koncentrata.", match: /iso\s*prime/i },
    { key: "fusion", label: "Whey Pure Fusion", blurb: "Whey mešavina za svakodnevnu upotrebu.", match: /fusion/i },
    { key: "monsterwhey", label: "Anabolic Monster Whey", blurb: "Whey protein linija.", match: /monster\s*whey/i },
    { key: "gourmet", label: "Gourmet Protein", blurb: "Mešavina proteina (blend).", match: /gourmet/i },
  ],
  focusLineKey: "fusion",
  metaDescription:
    "Cene Amix proteina (Whey Pure Fusion, Gold Whey Isolate, IsoPrime CFM, Monster Beef) u srpskim prodavnicama: cena po pakovanju i po gramu proteina, uz poređenje prodavnica.",
  ogTitle: "Amix proteini u Srbiji 2026 | Proteinoteka",
};

export const generateMetadata = brandMetadata(CONFIG);

export default function Page() {
  return <LiveBrandPage config={CONFIG} />;
}
