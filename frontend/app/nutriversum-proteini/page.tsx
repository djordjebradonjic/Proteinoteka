import { LiveBrandPage } from "@/components/seo/LiveBrandPage";
import { brandMetadata, type LiveBrandConfig } from "@/lib/live-brand";

export const revalidate = 86400;

const CONFIG: LiveBrandConfig = {
  slug: "nutriversum-proteini",
  brandName: "Nutriversum",
  apiBrands: "Nutriversum",
  h1: "Nutriversum proteini u Srbiji",
  lead: "Nutriversum nudi whey koncentrat (Whey Pro), izolat (ISO Pro), kazein, protein iz jaja i veganski protein od graška i pirinča.",
  // Order matters: first match wins ("Pure Whey Pro" must be tested before the plain "Whey Pro").
  lines: [
    { key: "casein", label: "Casein Pro", blurb: "Kazein — sporo se vari, pa se najčešće pije uveče.", match: /casein|kazein/i },
    { key: "egg", label: "Egg Pro", blurb: "Protein iz belanca jajeta, bez mlečnih sastojaka.", match: /egg/i },
    { key: "vegan", label: "Vegan Pro", blurb: "Biljni protein na bazi graška i pirinča.", match: /vegan/i },
    { key: "iso", label: "ISO Pro", blurb: "Izolat: više proteina na 100 g i manje laktoze od koncentrata.", match: /iso\s*pro/i },
    { key: "purepro", label: "Pure Whey Pro", blurb: "Whey protein za svakodnevnu upotrebu.", match: /pure\s*(whey\s*)?pro/i },
    { key: "whey", label: "Whey Pro", blurb: "Whey protein za svakodnevnu upotrebu.", match: /whey\s*pro/i },
    { key: "blend", label: "Pure 4K Blend", blurb: "Mešavina različitih izvora proteina (blend).", match: /4k|blend/i },
  ],
  focusLineKey: "iso",
  metaDescription:
    "Cene Nutriversum proteina (ISO Pro, Whey Pro, Casein Pro, Vegan Pro) u srpskim prodavnicama: cena po pakovanju i po gramu proteina, uz poređenje prodavnica.",
  ogTitle: "Nutriversum proteini u Srbiji 2026 | Proteinoteka",
  extraGuideLinks: [{ label: "Whey izolat: vodič i cene", href: "/whey-protein-izolat" }],
};

export const generateMetadata = brandMetadata(CONFIG);

export default function Page() {
  return <LiveBrandPage config={CONFIG} />;
}
