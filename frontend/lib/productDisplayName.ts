// Many stores list a product without its brand ("ISO-100 Hydrolyzed Protein", "THE Whey",
// "Gold Standard 100% Whey, 2,27kg"). Title and H1 are what people search for ("dymatize iso 100",
// "myprotein impact whey"), so the brand is prefixed when the store's own name leaves it out.
// Display only: the URL slug is frozen at creation and structured-data names stay as scraped.

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

export function displayName(product: { name: string; brand?: string | null }): string {
  const brand = product.brand?.trim();
  if (!brand || brand.length < 3) return product.name;

  const name = normalize(product.name);
  const fullBrand = normalize(brand);
  if (fullBrand && name.includes(fullBrand)) return product.name;

  // "Scitec Nutrition" is already present as "SCITEC 100% Whey": the distinctive first word counts.
  const firstWord = normalize(brand.split(/\s+/)[0]);
  if (firstWord.length >= 4 && firstWord !== "the" && name.includes(firstWord)) return product.name;

  return `${brand} ${product.name}`;
}
