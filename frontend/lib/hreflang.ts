const DOMAINS = {
  rs: "https://proteinoteka.rs",
  hr: "https://proteinoteka.com.hr",
} as const;

/**
 * Generates hreflang alternates for Next.js metadata.
 * Only include markets where the page actually exists.
 *
 * @param path - URL path including leading slash, e.g. "/" or "/kategorija/whey-isolate"
 * @param markets - which markets this page exists on (default: both)
 */
export function hreflangAlternates(
  path: string,
  markets: ("rs" | "hr")[] = ["rs", "hr"]
): Record<string, string> {
  const languages: Record<string, string> = {};
  if (markets.includes("rs")) languages["sr"] = `${DOMAINS.rs}${path}`;
  if (markets.includes("hr")) languages["hr"] = `${DOMAINS.hr}${path}`;
  const defaultDomain = markets.includes("rs") ? DOMAINS.rs : DOMAINS.hr;
  languages["x-default"] = `${defaultDomain}${path}`;
  return languages;
}
