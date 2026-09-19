import { LiveBrandPage } from "@/components/seo/LiveBrandPage";
import { brandMetadata, type LiveBrandConfig } from "@/lib/live-brand";

export const revalidate = 86400;

const CONFIG: LiveBrandConfig = {
  slug: "vitalikum-proteini",
  brandName: "Vitalikum",
  apiBrands: "Vitalikum",
  h1: "Vitalikum proteini u Srbiji",
  lead: "Vitalikum nudi Matrix izolat, Protein Matrix mešavinu i Whey Protein u više veličina pakovanja.",
  lines: [
    { key: "iso", label: "Matrix Isolate", blurb: "Izolat: više proteina na 100 g i manje laktoze od koncentrata.", match: /isolate|izolat/i },
    { key: "matrix", label: "Protein Matrix", blurb: "Mešavina proteina (blend).", match: /matrix/i },
    { key: "whey", label: "Whey Protein", blurb: "Whey protein za svakodnevnu upotrebu.", match: /whey/i },
  ],
  focusLineKey: "iso",
  metaDescription:
    "Cene Vitalikum proteina (Matrix Isolate, Whey Protein, Protein Matrix) u srpskim prodavnicama: cena po pakovanju i po gramu proteina, uz poređenje prodavnica.",
  ogTitle: "Vitalikum proteini u Srbiji 2026 | Proteinoteka",
};

export const generateMetadata = brandMetadata(CONFIG);

export default function Page() {
  return <LiveBrandPage config={CONFIG} />;
}
