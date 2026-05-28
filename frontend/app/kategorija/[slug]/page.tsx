import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Metadata } from "next";
import HomeContent from "@/components/HomeContent";
import { CATEGORIES, getCategoryBySlug } from "@/lib/categories";
import { CATEGORY_CONTENT } from "@/lib/category-content";

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

const META: Record<string, { title: string; description: string }> = {
  whey_concentrate: {
    title: "Whey Concentrate – Uporedi cene u Srbiji 2026",
    description:
      "Pronađi najisplativiji whey concentrate protein u Srbiji. Poredimo cene iz svih prodavnica i računamo RSD po gramu proteina.",
  },
  whey_isolate: {
    title: "Whey Isolate – Uporedi cene u Srbiji 2026",
    description:
      "Pronađi najisplativiji whey isolate protein u Srbiji. Čist protein, minimalno masti i laktoze – po najboljoj ceni.",
  },
  hydrolysate: {
    title: "Hidrolizat proteina – Uporedi cene u Srbiji 2026",
    description:
      "Pronađi najisplativiji hidrolizovani whey protein u Srbiji. Brza apsorpcija, visoka čistoća – po najboljoj ceni.",
  },
  casein: {
    title: "Kazein protein – Uporedi cene u Srbiji 2026",
    description:
      "Pronađi najisplativiji kazein protein u Srbiji. Sporo varenje za noćni oporavak – po najboljoj ceni.",
  },
  vegan: {
    title: "Biljni protein – Uporedi cene u Srbiji 2026",
    description:
      "Pronađi najisplativiji biljni (vegan) protein u Srbiji. Poredimo sve prodavnice i računamo RSD po gramu proteina.",
  },
  blend: {
    title: "Protein blend – Uporedi cene u Srbiji 2026",
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
      { next: { revalidate: 86400 } },
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
  const content = CATEGORY_CONTENT[cat.value];
  const m = META[cat.value];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Početna", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: m?.title.replace(" – Uporedi cene u Srbiji 2026", "") ?? cat.label,
        item: `${BASE_URL}/kategorija/${slug}`,
      },
    ],
  };

  const faqJsonLd = content ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  } : null;

  const categoryHero = content ? (
    <div className="bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 leading-tight">
          {content.h1}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          {content.intro}
        </p>
      </div>
    </div>
  ) : null;

  const categoryFaq = content ? (
    <div className="max-w-7xl mx-auto px-4 pb-10">
      <h2 className="text-xl font-extrabold text-slate-900 mb-4">Česta pitanja</h2>
      <div className="space-y-3">
        {content.faqs.map((faq, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-2">{faq.q}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <Suspense fallback={<div>Loading...</div>}>
        <HomeContent
          initialProducts={initialData.content}
          initialTotalPages={initialData.totalPages}
          initialCategory={cat.value}
          categoryHero={categoryHero}
          categoryFaq={categoryFaq}
        />
      </Suspense>
    </>
  );
}
