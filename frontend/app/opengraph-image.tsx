import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Proteinoteka — Uporedi cene proteina u Srbiji";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const stores = ["Pansport", "Proteini.si", "FitLab", "Proteinbox", "Ogistrashop", "Supplementshop", "GymBeam", "MyProtein", "Lama", "Shopbuilder", "XSport"];

  const logoData = await readFile(join(process.cwd(), "public/logo.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#1B2B4B",
          padding: "64px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            right: "-120px",
            top: "-120px",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            background: "rgba(255,153,0,0.07)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "120px",
            bottom: "-160px",
            width: "380px",
            height: "380px",
            borderRadius: "50%",
            background: "rgba(255,153,0,0.04)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "-60px",
            bottom: "80px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "rgba(255,153,0,0.03)",
            display: "flex",
          }}
        />

        {/* Logo + badge row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "44px",
          }}
        >
          {/* Logo */}
          <img
            src={logoSrc}
            alt="Proteinoteka logo"
            style={{ width: "52px", height: "52px", objectFit: "contain", borderRadius: "10px" }}
          />

          {/* Domain badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(255,153,0,0.12)",
              border: "1px solid rgba(255,153,0,0.28)",
              borderRadius: "100px",
              padding: "9px 22px",
            }}
          >
            <span style={{ color: "#FF9900", fontSize: "18px", fontWeight: "600" }}>
              proteinoteka.rs
            </span>
          </div>
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: "88px",
            fontWeight: "900",
            lineHeight: 1,
            marginBottom: "18px",
            display: "flex",
            alignItems: "baseline",
          }}
        >
          <span style={{ color: "#ffffff", display: "flex" }}>PROTEIN</span>
          <span style={{ color: "#FF9900", display: "flex", marginLeft: "-6px" }}>OTEKA</span>
        </div>

        {/* Orange accent bar */}
        <div
          style={{
            width: "90px",
            height: "5px",
            background: "#FF9900",
            borderRadius: "3px",
            marginBottom: "28px",
            display: "flex",
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: "34px",
            fontWeight: "700",
            color: "#FF9900",
            marginBottom: "16px",
            display: "flex",
          }}
        >
          Uporedi cene proteina u Srbiji
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: "22px",
            color: "#94a3b8",
            lineHeight: 1.5,
            display: "flex",
          }}
        >
          Pronađi najjeftiniji whey protein, izolat i kreatin.
          Cene iz svih prodavnica na jednom mestu. Besplatno.
        </div>

        {/* Store pills */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "auto",
            flexWrap: "wrap",
          }}
        >
          {stores.map((store) => (
            <div
              key={store}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                padding: "10px 18px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#cbd5e1", fontSize: "16px", fontWeight: "500" }}>
                {store}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
