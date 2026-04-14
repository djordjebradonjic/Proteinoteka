import { Metadata } from "next";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${params.id}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error();
    const product = await res.json();

    const title = `${product.name} - Cena ${product.price} RSD | Proteinoteka`;
    const description = `Uporedi cene za ${product.name} (${product.brand}). Trenutno najpovoljnije u prodavnici ${product.storeName} za ${product.price} RSD. Proveri istoriju cena i uštedi!`;

    return {
      title,
      description,
      alternates: { canonical: `https://proteinoteka.vercel.app/product/${params.id}` },
      openGraph: {
        title,
        description,
        url: `https://proteinoteka.vercel.app/product/${params.id}`,
        siteName: "Proteinoteka",
        images: product.imageUrl ? [{ url: product.imageUrl, width: 800, height: 800 }] : [],
        locale: "sr_RS",
        type: "website",
      },
    };
  } catch {
    return { title: "Proizvod | Proteinoteka" };
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}