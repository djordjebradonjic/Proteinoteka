import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";

const IS_HR = CURRENT_MARKET === "hr";
const DOMAIN = MARKET_CONFIG[CURRENT_MARKET].domain;
const YEAR = new Date().getFullYear();

export const alt = IS_HR
  ? `Black Friday ${YEAR} — najveći popusti na proteine`
  : `Crni petak ${YEAR} — najveći popusti na proteine`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          flexDirection: "column",
          background: "#131921",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "-160px",
            right: "-120px",
            width: "560px",
            height: "560px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(239,68,68,0.22) 0%, transparent 65%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-180px",
            left: "-120px",
            width: "480px",
            height: "480px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,153,0,0.14) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        {/* Logo + domain */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "48px 56px 0", zIndex: 1 }}>
          <img src={logoSrc} alt="" style={{ width: "38px", height: "38px", objectFit: "contain" }} />
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "17px", fontWeight: "500", display: "flex" }}>
            {DOMAIN}
          </span>
        </div>

        {/* Main content */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 56px",
          zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: "100px",
              padding: "8px 18px",
            }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", display: "flex" }} />
              <span style={{ color: "#f87171", fontSize: "16px", fontWeight: "700", letterSpacing: "0.02em", display: "flex" }}>
                {IS_HR ? `BLACK FRIDAY ${YEAR}` : `CRNI PETAK ${YEAR}`}
              </span>
            </div>
          </div>

          <div style={{ color: "#ffffff", fontSize: "62px", fontWeight: "900", lineHeight: 1.08, letterSpacing: "-0.02em", display: "flex", flexDirection: "column" }}>
            <span style={{ display: "flex" }}>{IS_HR ? "Najveći popusti" : "Najveći popusti"}</span>
            <span style={{ color: "#FF9900", display: "flex" }}>{IS_HR ? "na proteine" : "na proteine"}</span>
          </div>

          <div style={{ display: "flex", marginTop: "28px" }}>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "22px", fontWeight: "500", display: "flex", maxWidth: "760px" }}>
              {IS_HR
                ? "Popust vs. prosječna cijena zadnjih 90 dana — ne lažno naduvana cijena"
                : "Popust vs. prosečna cena poslednjih 90 dana — ne lažno naduvana cena"}
            </span>
          </div>
        </div>

        {/* Bottom hint */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "0 56px 44px",
          zIndex: 1,
        }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "flex" }} />
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "15px", display: "flex" }}>
            {IS_HR ? "Cijene se ažuriraju tijekom cijele godine" : "Cene se ažuriraju tokom cele godine"}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
