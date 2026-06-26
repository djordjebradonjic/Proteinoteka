import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import HomeContent from "@/components/HomeContent";
import { CATEGORIES, getCategoryBySlug } from "@/lib/categories";
import { CATEGORY_CONTENT } from "@/lib/category-content";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

const META: Record<string, { rs: { title: string; description: string }; hr: { title: string; description: string } }> = {
  whey_concentrate: {
    rs: {
      title: "Whey Concentrate – Uporedi cene u Srbiji 2026",
      description:
        "Poredi cene whey concentrate proteina iz 8 srpskih prodavnica. Vidi koliko košta gram proteina u svakom paketu — nađi najboljу vrednost za novac.",
    },
    hr: {
      title: "Whey Concentrate – Usporedi cijene u Hrvatskoj 2026",
      description:
        "Usporedi cijene whey concentrate proteina iz hrvatskih trgovina. Vidi koliko košta gram proteina u svakom pakiranju — pronađi najbolju vrijednost za novac.",
    },
  },
  whey_isolate: {
    rs: {
      title: "Whey Isolate – Uporedi cene u Srbiji 2026",
      description:
        "Poredi cene whey izolata iz 8 srpskih prodavnica. Filtriraj po ceni ili gramu proteina — nađi najisplativiji izolat odmah.",
    },
    hr: {
      title: "Whey Isolate – Usporedi cijene u Hrvatskoj 2026",
      description:
        "Usporedi cijene whey izolata iz hrvatskih trgovina. Filtriraj po cijeni ili gramu proteina — pronađi najisplativiji izolat odmah.",
    },
  },
  hydrolysate: {
    rs: {
      title: "Hidrolizat proteina – Uporedi cene u Srbiji 2026",
      description:
        "Pronađi najisplativiji hidrolizovani whey protein u Srbiji. Brza apsorpcija, visoka čistoća – po najboljoj ceni.",
    },
    hr: {
      title: "Hidrolizat proteina – Usporedi cijene u Hrvatskoj 2026",
      description:
        "Pronađi najisplativiji hidroliziran whey protein u Hrvatskoj. Brza apsorpcija, visoka čistoća – po najboljoj cijeni.",
    },
  },
  casein: {
    rs: {
      title: "Kazein protein – Uporedi cene u Srbiji 2026",
      description:
        "Pronađi najisplativiji kazein protein u Srbiji. Sporo varenje za noćni oporavak – po najboljoj ceni.",
    },
    hr: {
      title: "Kazein protein – Usporedi cijene u Hrvatskoj 2026",
      description:
        "Pronađi najisplativiji kazein protein u Hrvatskoj. Sporo varenje za noćni oporavak – po najboljoj cijeni.",
    },
  },
  vegan: {
    rs: {
      title: "Biljni protein – Uporedi cene u Srbiji 2026",
      description:
        "Pronađi najisplativiji biljni (vegan) protein u Srbiji. Poredimo sve prodavnice i računamo RSD po gramu proteina.",
    },
    hr: {
      title: "Biljni protein – Usporedi cijene u Hrvatskoj 2026",
      description:
        "Pronađi najisplativiji biljni (vegan) protein u Hrvatskoj. Uspoređujemo sve trgovine i računamo EUR po gramu proteina.",
    },
  },
  blend: {
    rs: {
      title: "Protein blend – Uporedi cene u Srbiji 2026",
      description:
        "Pronađi najisplativiji protein blend u Srbiji. Mešavina whey i kazeina za dugotrajan efekat – po najboljoj ceni.",
    },
    hr: {
      title: "Protein blend – Usporedi cijene u Hrvatskoj 2026",
      description:
        "Pronađi najisplativiji protein blend u Hrvatskoj. Mješavina wheya i kazeina za dugotrajan učinak – po najboljoj cijeni.",
    },
  },
  egg: {
    rs: {
      title: "Egg protein – Uporedi cene u Srbiji 2026",
      description:
        "Pronađi najisplativiji egg protein (albumin) u Srbiji. Visok sadržaj proteina bez laktoze – poredimo cene iz svih prodavnica.",
    },
    hr: {
      title: "Egg protein – Usporedi cijene u Hrvatskoj 2026",
      description:
        "Pronađi najisplativiji egg protein (albumin) u Hrvatskoj. Visok sadržaj proteina bez laktoze – uspoređujemo cijene iz svih trgovina.",
    },
  },
};

const BASE_URL = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return {};

  const m = META[cat.value][CURRENT_MARKET];
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `${BASE_URL}/kategorija/${slug}`,
      languages: {
        "sr": `https://proteinoteka.rs/kategorija/${slug}`,
        "hr": `https://proteinoteka.com.hr/kategorija/${slug}`,
        "x-default": `https://proteinoteka.rs/kategorija/${slug}`,
      },
    },
    openGraph: {
      title: m.title,
      description: m.description,
      url: `${BASE_URL}/kategorija/${slug}`,
      siteName: "Proteinoteka",
      locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
      type: "website",
      images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630, alt: m.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: m.title,
      description: m.description,
      images: [`${BASE_URL}/opengraph-image`],
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

export default async function KategorijaPage({ params }: Props) {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();

  const initialData = await getCategoryProducts(cat.value);
  const content = CATEGORY_CONTENT[cat.value];
  const m = META[cat.value][CURRENT_MARKET];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Početna", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: cat.label,
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
    <div className="max-w-7xl mx-auto px-4 pb-10 space-y-8">
      {content.guides && content.guides.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-3">Relevantni vodiči</h2>
          <div className="flex flex-wrap gap-2">
            {content.guides.map(guide => (
              <Link
                key={guide.href}
                href={guide.href}
                className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-all"
              >
                {guide.label}
              </Link>
            ))}
          </div>
        </div>
      )}
      <div>
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
