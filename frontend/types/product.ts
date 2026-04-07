export interface PriceHistory {
  price: string;
  timestamp: string;
}

export interface Product {
  id: number
  name: string;
  brand: string | null;
  price: string;
  imageUrl: string;
  productUrl: string;
  storeName: string;
  weights: string[];
  flavours: string[];
  priceHistory: PriceHistory[];
  description: string;
  numericPrice: number;
  
}