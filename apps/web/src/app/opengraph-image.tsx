import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "linear-gradient(135deg, rgb(14, 116, 144) 0%, rgb(15, 23, 42) 55%, rgb(8, 47, 73) 100%)",
          color: "white",
          padding: "64px",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: "36px",
            padding: "48px",
            background: "rgba(255,255,255,0.06)",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              fontSize: "26px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              opacity: 0.92,
            }}
          >
            <span
              style={{
                display: "flex",
                width: "14px",
                height: "14px",
                borderRadius: "999px",
                background: "rgb(103, 232, 249)",
              }}
            />
            {BRAND.name}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "860px" }}>
            <div style={{ fontSize: "70px", lineHeight: 1.04, fontWeight: 700 }}>
              Verstehen, was sich verändert. Mitreden, wo es zählt.
            </div>
            <div style={{ fontSize: "30px", lineHeight: 1.35, color: "rgba(255,255,255,0.86)" }}>
              Entwicklungen, Quellen, Positionen und Beteiligungsmöglichkeiten nachvollziehbar verbinden.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "24px",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            <span>eDebatte.org</span>
            <span>Öffentliche Orientierung · review-first</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
