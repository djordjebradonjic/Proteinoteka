import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Metadata } from "next";
import HomeContent from "@/components/HomeContent";
import { CATEGORIES, getCategoryBySlug } from "@/lib/categories";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

const META: Record<string, { title: string; description: string }> = {
  whey_concentrate: {
    title: "Whey Concentrate – Uporedi cene u Srbiji",
    description:
      "Pronađi najisplativiji whey concentrate protein u Srbiji. Poredimo cene iz svih prodavnica i računamo RSD po gramu proteina.",
  },
  whey_isolate: {
    title: "Whey Isolate – Uporedi cene u Srbiji",
    description:
      "Pronađi najisplativiji whey isolate protein u Srbiji. Čist protein, minimalno masti i laktoze – po najboljoj ceni.",
  },
  hydrolysate: {
    title: "Hidrolizat proteina – Uporedi cene u Srbiji",
    description:
      "Pronađi najisplativiji hidrolizovani whey protein u Srbiji. Brza apsorpcija, visoka čistoća – po najboljoj ceni.",
  },
  casein: {
    title: "Kazein protein – Uporedi cene u Srbiji",
    description:
      "Pronađi najisplativiji kazein protein u Srbiji. Sporo varenje za noćni oporavak – po najboljoj ceni.",
  },
  vegan: {
    title: "Biljni protein – Uporedi cene u Srbiji",
    description:
      "Pronađi najisplativiji biljni (vegan) protein u Srbiji. Poredimo sve prodavnice i računamo RSD po gramu proteina.",
  },
  blend: {
    title: "Protein blend – Uporedi cene u Srbiji",
    description:
      "Pronađi najisplativiji protein blend u Srbiji. Mešavina whey i kazeina za dugotrajan efekat – po najboljoj ceni.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return {};

  const m = META[cat.value];
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `https://proteinoteka.rs/kategorija/${slug}`,
      languages: { "sr-RS": `https://proteinoteka.rs/kategorija/${slug}` },
    },
    openGraph: {
      title: m.title,
      description: m.description,
      url: `https://proteinoteka.rs/kategorija/${slug}`,
      siteName: "Proteinoteka",
      locale: "sr_RS",
      type: "website",
    },
  };
}

async function getCategoryProducts(categoryValue: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?page=0&size=12&sort=id,desc&category=${categoryValue}`,
      { next: { revalidate: 3600 } },
    );
    const data = await res.json();
    return {
      content: data.content ?? [],
      totalPages: data.page?.totalPages ?? 0,
    };
  } catch {
    return { content: [], totalPages: 0 };
  }
}

const BASE_URL = "https://proteinoteka.rs";

export default async function KategorijaPage({ params }: Props) {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();

  const initialData = await getCategoryProducts(cat.value);

  const m = META[cat.value];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Početna", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: m?.title.replace(" – Uporedi cene u Srbiji", "") ?? cat.label,
        item: `${BASE_URL}/kategorija/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense fallback={<div>Loading...</div>}>
        <HomeContent
          initialProducts={initialData.content}
          initialTotalPages={initialData.totalPages}
          initialCategory={cat.value}
        />
      </Suspense>
    </>
  );
}
