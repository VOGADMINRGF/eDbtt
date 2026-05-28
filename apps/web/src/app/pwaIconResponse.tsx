import { ImageResponse } from "next/og";

function iconMarkup(size: number) {
  const accentSize = Math.round(size * 0.14);
  const titleSize = Math.round(size * 0.36);
  const subtitleSize = Math.round(size * 0.12);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(160deg, rgb(8,47,73) 0%, rgb(14,116,144) 48%, rgb(34,211,238) 100%)",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: accentSize,
          borderRadius: Math.round(size * 0.24),
          border: "2px solid rgba(255,255,255,0.24)",
          background: "rgba(8,15,32,0.18)",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: Math.max(4, Math.round(size * 0.03)),
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          eD
        </div>
        <div
          style={{
            fontSize: subtitleSize,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            opacity: 0.9,
          }}
        >
          review-first
        </div>
      </div>
    </div>
  );
}

export function createPwaIconResponse(size: number) {
  return new ImageResponse(iconMarkup(size), {
    width: size,
    height: size,
  });
}
