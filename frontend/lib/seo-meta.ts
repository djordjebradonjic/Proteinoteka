import type { Metadata } from "next";

// SERP-friendly metadata for the RS-only landing pages. Google cuts titles near 60 characters
// and descriptions near 155, so both are fitted here instead of trusting hand-typed lengths.

const SITE = "https://proteinoteka.rs";
const SUFFIX = " | Proteinoteka";
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;

/** Appends the site name only if the whole title still fits in the SERP. */
export function fitTitle(base: string): string {
  return base.length + SUFFIX.length <= TITLE_MAX ? base + SUFFIX : base;
}

/** Cuts at a word boundary and never exceeds the SERP limit. */
export function fitDescription(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= DESCRIPTION_MAX) return clean;
  const cut = clean.slice(0, DESCRIPTION_MAX - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s]+$/, "") + "…";
}

export function rsPageMetadata(opts: {
  path: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
}): Metadata {
  const url = `${SITE}${opts.path}`;
  const title = fitTitle(opts.title);
  const description = fitDescription(opts.description);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.ogTitle ?? title,
      description: fitDescription(opts.ogDescription ?? opts.description),
      url,
      siteName: "Proteinoteka",
      locale: "sr_RS",
      type: "website",
      images: [{ url: `${SITE}/opengraph-image`, width: 1200, height: 630, alt: "Proteinoteka" }],
    },
    twitter: { card: "summary_large_image", images: [`${SITE}/opengraph-image`] },
  };
}
