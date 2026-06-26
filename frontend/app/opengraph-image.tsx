import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";

const IS_HR = CURRENT_MARKET === "hr";
const DOMAIN = MARKET_CONFIG[CURRENT_MARKET].domain;

export const alt = IS_HR
  ? "Proteinoteka — Usporedi cijene proteina u Hrvatskoj"
  : "Proteinoteka — Uporedi cene proteina u Srbiji";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const RS_ROWS = [
  { name: "Gold Standard Whey 2.27kg", store: "Proteini.si", price: "11.990", score: 9.1, pct: 80 },
  { name: "Scitec 100% Whey Pro 2.35kg", store: "Pansport", price: "8.120", score: 8.4, pct: 73 },
  { name: "Prostar 100% Whey 2.39kg", store: "FitLab", price: "8.950", score: 7.9, pct: 83 },
  { name: "BioTech 100% Pure Whey 2.27kg", store: "Ogistrashop", price: "7.990", score: 7.2, pct: 79 },
];

const HR_ROWS = [
  { name: "Anabolic Monster Beef 2.2kg", store: "GymBeam HR", price: "59,95", score: 8.8, pct: 90 },
  { name: "Pure IsoWhey 2.5kg", store: "GymBeam HR", price: "100,95", score: 8.7, pct: 86 },
  { name: "Impact Whey Izolat 2.5kg", store: "MyProtein HR", price: "159,99", score: 8.7, pct: 82 },
  { name: "100% Casein 1.81kg", store: "MyProtein HR", price: "79,95", score: 8.1, pct: 78 },
];

const rows = IS_HR ? HR_ROWS : RS_ROWS;

function scoreColor(s: number) {
  if (s >= 8.5) return "#22c55e";
  if (s >= 7.0) return "#f59e0b";
  return "#ef4444";
}

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), "public/logo.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0f1e35",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── LEFT PANEL ─────────────────────────────────── */}
        <div style={{
          width: "420px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 48px",
          position: "relative",
          zIndex: 1,
          flexShrink: 0,
        }}>
          {/* Logo + domain */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src={logoSrc} style={{ width: "38px", height: "38px", objectFit: "contain" }} />
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "17px", fontWeight: "500" }}>
              {DOMAIN}
            </span>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px",
            }}>
              <div style={{ width: "28px", height: "3px", background: "#FF9900", borderRadius: "2px", display: "flex" }} />
              <span style={{ color: "#FF9900", fontSize: "14px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", display: "flex" }}>
                {IS_HR ? "Hrvatska · 2026" : "Srbija · 2026"}
              </span>
            </div>
            <div style={{ color: "#ffffff", fontSize: "52px", fontWeight: "900", lineHeight: 1.05, letterSpacing: "-0.02em", display: "flex", flexDirection: "column" }}>
              <span style={{ display: "flex" }}>{IS_HR ? "Gdje je" : "Gde je"}</span>
              <span style={{ color: "#FF9900", display: "flex" }}>najjeftiniji</span>
              <span style={{ display: "flex" }}>protein?</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "20px" }}>
            {(IS_HR ? [["103+", "proteina"], ["5", "trgovina"]] : [["550+", "proteina"], ["11", "prodavnica"]]).map(([val, lbl]) => (
              <div key={lbl} style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#FF9900", fontSize: "28px", fontWeight: "800", lineHeight: 1, display: "flex" }}>{val}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", fontWeight: "500", marginTop: "3px", display: "flex" }}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── DIVIDER ────────────────────────────────────── */}
        <div style={{
          width: "1px",
          background: "rgba(255,255,255,0.08)",
          alignSelf: "stretch",
          display: "flex",
          margin: "0",
        }} />

        {/* ── RIGHT PANEL — product table ────────────────── */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "44px 48px",
          gap: "0",
          position: "relative",
        }}>
          {/* Glow */}
          <div style={{
            position: "absolute", top: "-120px", right: "-120px",
            width: "500px", height: "500px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,153,0,0.12) 0%, transparent 65%)",
            display: "flex",
          }} />

          {/* Table header */}
          <div style={{
            display: "flex", alignItems: "center",
            paddingBottom: "14px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            marginBottom: "8px",
          }}>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", flex: 1, display: "flex" }}>Proizvod</span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", width: "90px", display: "flex", justifyContent: "flex-end" }}>{IS_HR ? "Cijena" : "Cena"}</span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", width: "70px", display: "flex", justifyContent: "flex-end" }}>Score</span>
          </div>

          {/* Rows */}
          {rows.map((r, i) => (
            <div
              key={r.name}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "16px 0",
                borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                background: i === 0 ? "rgba(255,153,0,0.05)" : "transparent",
                borderRadius: i === 0 ? "8px" : "0",
                paddingLeft: i === 0 ? "10px" : "0",
                paddingRight: i === 0 ? "10px" : "0",
                marginLeft: i === 0 ? "-10px" : "0",
                marginRight: i === 0 ? "-10px" : "0",
              }}
            >
              {/* Rank */}
              <span style={{
                color: i === 0 ? "#FF9900" : "rgba(255,255,255,0.2)",
                fontSize: "13px", fontWeight: "800",
                width: "22px", flexShrink: 0, display: "flex",
              }}>
                {i + 1}
              </span>

              {/* Name + store + bar */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px", marginRight: "16px" }}>
                <span style={{
                  color: i === 0 ? "#ffffff" : "rgba(255,255,255,0.7)",
                  fontSize: i === 0 ? "15px" : "14px",
                  fontWeight: i === 0 ? "700" : "500",
                  display: "flex",
                  lineHeight: 1,
                }}>
                  {r.name}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", display: "flex" }}>{r.store}</span>
                  {/* protein bar */}
                  <div style={{ flex: 1, height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", display: "flex" }}>
                    <div style={{ width: `${r.pct}%`, height: "100%", background: i === 0 ? "#FF9900" : "rgba(255,153,0,0.4)", borderRadius: "2px", display: "flex" }} />
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", display: "flex" }}>{r.pct}g/100g</span>
                </div>
              </div>

              {/* Price */}
              <span style={{
                color: i === 0 ? "#ffffff" : "rgba(255,255,255,0.5)",
                fontSize: "14px", fontWeight: "700",
                width: "90px", display: "flex", justifyContent: "flex-end",
              }}>
                {r.price} {IS_HR ? "EUR" : "RSD"}
              </span>

              {/* Score badge */}
              <div style={{
                width: "70px", display: "flex", justifyContent: "flex-end",
              }}>
                <div style={{
                  background: `${scoreColor(r.score)}20`,
                  border: `1px solid ${scoreColor(r.score)}50`,
                  borderRadius: "6px",
                  padding: "3px 8px",
                  display: "flex",
                  alignItems: "center",
                }}>
                  <span style={{ color: scoreColor(r.score), fontSize: "13px", fontWeight: "800", display: "flex" }}>
                    {r.score}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Bottom hint */}
          <div style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "flex" }} />
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "13px", display: "flex" }}>
              {IS_HR
                ? "Cijene se ažuriraju tjedno iz svih hrvatskih trgovina"
                : "Cene se ažuriraju nedeljno iz svih srpskih prodavnica"}
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
