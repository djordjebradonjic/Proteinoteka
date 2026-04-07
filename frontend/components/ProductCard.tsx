import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
}


export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow bg-white">

      {/* Slika */}
      <div className="p-4 flex items-center justify-center h-44 bg-white rounded-t-lg">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="h-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 rounded flex items-center justify-center text-slate-400">
            Nema slike
          </div>
        )}
      </div>

      <CardContent className="flex-1 px-4 pb-2">
        {product.brand && (
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
            {product.brand}
          </p>
        )}
        <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-2 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-xl font-bold text-green-600">
          {product.price} RSD
        </p>
        <Badge variant="outline" className="mt-2 text-xs">
          {product.storeName}
        </Badge>
      </CardContent>

      <CardFooter className="px-4 pb-4 gap-2 flex flex-col">
        <Button asChild className="w-full" size="sm">
         <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
             Kupi →
        </a>
        </Button>
        <Button variant="outline" asChild className="w-full" size="sm">
          <Link href={`/product/${product.id}`}>
            Detalji
          </Link>
        </Button>
      </CardFooter>

    </Card>
  );
}