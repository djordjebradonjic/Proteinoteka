import { Metadata } from "next";

export const revalidate = 86400;

interface Props {
  params: Promise<{ id: string }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  whey_concentrate: "Whey Concentrate",
  whey_isolate:     "Whey Isolate",
  hydrolysate:      "Hidrolizat",
  casein:           "Kazein",
  vegan:            "Biljni protein",
  blend:            "Blend",
};

const CATEGORY_SLUGS: Record<string, string> = {
  whey_concentrate: "whey-concentrate",
  whey_isolate:     "whey-isolate",
  hydrolysate:      "hidrolizat",
  casein:           "kazein",
  vegan:            "biljni-protein",
  blend:            "blend",
};

const BASE_URL = "https://proteinoteka.rs";

async function fetchProduct(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${id}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error();
  return res.json();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const product = await fetchProduct(id);

    const title = `${product.name} - Cena ${product.price} RSD | Proteinoteka`;
    const description = `Uporedi cene za ${product.name} (${product.brand}). Trenutno najpovoljnije u prodavnici ${product.storeName} za ${product.price} RSD. Proveri istoriju cena i uštedi!`;

    return {
      title,
      description,
      alternates: { canonical: `${BASE_URL}/product/${id}` },
      openGraph: {
        title,
        description,
        url: `${BASE_URL}/product/${id}`,
        siteName: "Proteinoteka",
        images: product.imageUrl ? [{ url: product.imageUrl, width: 800, height: 800 }] : [],
        locale: "sr_RS",
        type: "website",
      },
    };
  } catch {
    return { title: "Proizvod | Proteinoteka" };
  }
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  let jsonLd: object | null = null;

  try {
    const { id } = await params;
    const p = await fetchProduct(id);
    const productUrl = `${BASE_URL}/product/${id}`;

    const catLabel = p.proteinSource ? (CATEGORY_LABELS[p.proteinSource] ?? null) : null;
    const catSlug  = p.proteinSource ? (CATEGORY_SLUGS[p.proteinSource]  ?? null) : null;

    const plainDescription: string | undefined = p.description
      ? (p.description as string).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500)
      : undefined;

    const breadcrumbItems: object[] = [
      { "@type": "ListItem", position: 1, name: "Početna", item: BASE_URL },
    ];
    if (catLabel && catSlug) {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 2,
        name: catLabel,
        item: `${BASE_URL}/kategorija/${catSlug}`,
      });
      breadcrumbItems.push({ "@type": "ListItem", position: 3, name: p.name, item: productUrl });
    } else {
      breadcrumbItems.push({ "@type": "ListItem", position: 2, name: p.name, item: productUrl });
    }

    jsonLd = [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.name,
        ...(p.imageUrl        ? { image: p.imageUrl }                            : {}),
        ...(p.brand           ? { brand: { "@type": "Brand", name: p.brand } }   : {}),
        ...(plainDescription  ? { description: plainDescription }                 : {}),
        offers: {
          "@type": "Offer",
          price: p.numericPrice,
          priceCurrency: "RSD",
          availability: "https://schema.org/InStock",
          url: productUrl,
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems,
      },
    ];
  } catch {
    // JSON-LD is non-critical — skip silently on error
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
