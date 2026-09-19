import Link from "next/link";
import { productUrl } from "@/lib/productUrl";
import { formatPrice } from "@/lib/formatPrice";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { formatWeightG, packRows } from "@/lib/brand-line-stats";
import type { Product } from "@/types/product";

const IS_HR = CURRENT_MARKET === "hr";

interface Props {
  title: string;
  products: Product[];
  /** Optional deeper-reading link shown under the table. */
  more?: { href: string; label: string };
}

// One row per pack size and store, so the buyer sees what each size really costs per gram of protein.
export function PackTable({ title, products, more }: Props) {
  const rows = packRows(products);
  if (rows.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h2 className="text-xl font-extrabold text-slate-900 mb-3">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2 pr-4 font-semibold">Pakovanje</th>
              <th className="py-2 pr-4 font-semibold">Cena</th>
              <th className="py-2 pr-4 font-semibold">Po gramu proteina</th>
              <th className="py-2 font-semibold">{IS_HR ? "Trgovina" : "Prodavnica"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ product, weightG, gp }) => (
              <tr key={product.id}>
                <td className="py-2 pr-4 font-bold text-slate-900">{formatWeightG(weightG)}</td>
                <td className="py-2 pr-4">
                  <Link href={productUrl(product)} className="font-semibold text-[#FF9900] hover:underline">
                    {formatPrice(product.numericPrice)}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-slate-700">
                  {gp.toFixed(IS_HR ? 3 : 1).replace(".", ",")} {IS_HR ? "€" : "RSD"}
                </td>
                <td className="py-2 text-slate-600">{product.storeName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {more && (
        <Link href={more.href} className="inline-block mt-3 text-sm font-semibold text-[#FF9900] hover:underline">
          {more.label} →
        </Link>
      )}
    </div>
  );
}
