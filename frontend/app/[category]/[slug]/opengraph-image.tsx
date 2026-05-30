import { ImageResponse } from "next/og";
import { extractProductId } from "@/lib/productUrl";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.proteinoteka.rs";

interface Product {
  id: number;
  name: string;
  price: string;
  numericPrice: number | null;
  storeName: string | null;
  brand: string | null;
  valueScore: number | null;
  imageUrl: string | null;
  proteinSource: string | null;
}

async function fetchProduct(id: number): Promise<Product | null> {
  try {
    const res = await fetch(`${API}/api/v1/products/${id}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function scoreColor(score: number): string {
  if (score >= 8.5) return "#22c55e";
  if (score >= 7) return "#84cc16";
  if (score >= 5.5) return "#FF9900";
  return "#ef4444";
}

function scoreLabel(score: number): string {
  if (score >= 9) return "Izvanredan";
  if (score >= 8) return "Odličan";
  if (score >= 7) return "Dobar";
  if (score >= 5.5) return "Prosečan";
  return "Slab";
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

const FALLBACK = (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#1B2B4B",
      flexDirection: "column",
      gap: "16px",
    }}
  >
    <div style={{ fontSize: "72px", fontWeight: "900", color: "#ffffff", display: "flex" }}>
      Proteinoteka
    </div>
    <div style={{ fontSize: "28px", color: "#FF9900", display: "flex" }}>
      Uporedi cene proteina u Srbiji
    </div>
  </div>
);

export default async function Image({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { slug } = await params;
  const id = extractProductId(slug);
  const product = id ? await fetchProduct(id) : null;

  if (!product) {
    return new ImageResponse(FALLBACK, { ...size });
  }

  const name = product.name;
  // Determine font size based on name length
  const nameFontSize = name.length > 60 ? 36 : name.length > 45 ? 42 : name.length > 30 ? 48 : 54;
  const displayName = truncate(name, 80);

  const score = product.valueScore;
  const sColor = score != null ? scoreColor(score) : null;
  const sLabel = score != null ? scoreLabel(score) : null;

  // Try to fetch product image as base64
  let imgData: string | null = null;
  if (product.imageUrl) {
    try {
      const imgRes = await fetch(product.imageUrl, { signal: AbortSignal.timeout(3000) });
      const mime = imgRes.headers.get("content-type") ?? "";
      if (imgRes.ok && mime.startsWith("image/")) {
        const buf = await imgRes.arrayBuffer();
        if (buf.byteLength <= 2 * 1024 * 1024) {
          imgData = `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
        }
      }
    } catch {
      // image unavailable — skip
    }
  }

  const hasImage = imgData !== null;

  try { return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#1B2B4B",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative background circles */}
        <div
          style={{
            position: "absolute",
            right: "-100px",
            top: "-100px",
            width: "480px",
            height: "480px",
            borderRadius: "50%",
            background: "rgba(255,153,0,0.06)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "80px",
            bottom: "-140px",
            width: "360px",
            height: "360px",
            borderRadius: "50%",
            background: "rgba(255,153,0,0.04)",
            display: "flex",
          }}
        />

        {/* Left content area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "52px 56px 52px 68px",
            flex: 1,
            minWidth: 0,
            justifyContent: "center",
          }}
        >
          {/* Top badges */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "32px", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                background: "rgba(255,153,0,0.12)",
                border: "1px solid rgba(255,153,0,0.28)",
                borderRadius: "100px",
                padding: "7px 18px",
              }}
            >
              <span style={{ color: "#FF9900", fontSize: "15px", fontWeight: "600" }}>
                proteinoteka.rs
              </span>
            </div>
            {product.brand && (
              <div
                style={{
                  display: "flex",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "100px",
                  padding: "7px 18px",
                }}
              >
                <span style={{ color: "#cbd5e1", fontSize: "15px" }}>{product.brand}</span>
              </div>
            )}
          </div>

          {/* Product name */}
          <div
            style={{
              fontSize: `${nameFontSize}px`,
              fontWeight: "800",
              color: "#ffffff",
              lineHeight: 1.2,
              marginBottom: "20px",
              display: "flex",
            }}
          >
            {displayName}
          </div>

          {/* Orange accent bar */}
          <div
            style={{
              width: "64px",
              height: "4px",
              background: "#FF9900",
              borderRadius: "2px",
              marginBottom: "20px",
              display: "flex",
            }}
          />

          {/* Price */}
          <div
            style={{
              fontSize: "56px",
              fontWeight: "900",
              color: "#FF9900",
              lineHeight: 1,
              marginBottom: "14px",
              display: "flex",
            }}
          >
            {product.price}
          </div>

          {/* Store */}
          {product.storeName && (
            <div
              style={{
                fontSize: "20px",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ display: "flex" }}>dostupno u</span>
              <span style={{ color: "#cbd5e1", fontWeight: "600", display: "flex" }}>
                {product.storeName}
              </span>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 48px 40px 20px",
            gap: "20px",
            minWidth: hasImage ? "320px" : score != null ? "200px" : "0px",
          }}
        >
          {/* Product image */}
          {imgData && (
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px",
                padding: "16px",
                width: "220px",
                height: "220px",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgData}
                alt={name}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            </div>
          )}

          {/* Value score badge */}
          {score != null && sColor && sLabel && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                background: sColor,
                boxShadow: `0 0 32px ${sColor}55`,
              }}
            >
              <span
                style={{
                  color: "white",
                  fontSize: "34px",
                  fontWeight: "900",
                  lineHeight: 1,
                  display: "flex",
                }}
              >
                {score.toFixed(1)}
              </span>
              <span
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "12px",
                  marginTop: "3px",
                  display: "flex",
                }}
              >
                {sLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  ); } catch {
    return new ImageResponse(FALLBACK, { ...size });
  }
}
