export interface PriceHistory {
  price: string;
  numericPrice: number | null;
  timestamp: string;
}

export interface Product {
  id: number;
  name: string;
  brand: string | null;
  price: string;
  imageUrl: string;
  productUrl: string;
  storeName: string;
  weights: string[];
  flavours: string[];
  priceHistory: PriceHistory[];
  description: string | null;
  numericPrice: number;
  valueScore: number | null;
  proteinPer100g: number | null;
  sugarPer100g: number | null;
  fatPer100g: number | null;
  caloriePer100g: number | null;
  proteinSource: string | null;
  primaryWeightGrams: number | null;
  aiDescription?: string;
  previousPrice?: number | null;
  percentileRank?: number | null;
  lastUpdated?: string | null;
  canonicalSlug?: string | null;
}
