import { LiveBrandPage } from "@/components/seo/LiveBrandPage";
import { brandMetadata, type LiveBrandConfig } from "@/lib/live-brand";

export const revalidate = 86400;

const CONFIG: LiveBrandConfig = {
  slug: "maximalium-proteini",
  brandName: "Maximalium",
  apiBrands: "Maximalium",
  h1: "Maximalium proteini u Srbiji",
  lead: "Maximalium nudi Genesys mešavinu proteina, 100% Whey, izolat i veganski protein, u više veličina pakovanja.",
  // Order matters: "Isolate Whey Protein" contains "whey", so isolate is tested before plain whey.
  lines: [
    { key: "vegan", label: "Vegan Protein", blurb: "Biljni protein za one koji ne konzumiraju mlečne proizvode.", match: /vegan/i },
    { key: "isolate", label: "Isolate Whey Protein", blurb: "Izolat: više proteina na 100 g i manje laktoze od koncentrata.", match: /isolat|izolat/i },
    { key: "genesys", label: "Genesys Protein", blurb: "Mešavina proteina (blend) za redovnu upotrebu.", match: /genesys/i },
    { key: "whey", label: "100% Whey Protein", blurb: "Whey protein za svakodnevnu upotrebu.", match: /whey/i },
  ],
  focusLineKey: "genesys",
  metaDescription:
    "Cene Maximalium proteina (Genesys, 100% Whey, izolat, vegan) u srpskim prodavnicama: cena po pakovanju i po gramu proteina, uz poređenje prodavnica.",
  ogTitle: "Maximalium proteini u Srbiji 2026 | Proteinoteka",
};

export const generateMetadata = brandMetadata(CONFIG);

export default function Page() {
  return <LiveBrandPage config={CONFIG} />;
}
