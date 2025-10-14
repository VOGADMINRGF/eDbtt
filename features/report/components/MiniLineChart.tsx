// features/report/components/MiniLineChart.tsx
"use client";
import React, { useMemo } from "react";

type Props = {
  data: number[];
  color?: string;
  width?: number;   // CSS-Pixel (nur Anzeigegröße)
  height?: number;  // CSS-Pixel
  className?: string;
};

export default function MiniLineChart({
  data,
  color = "#00B3A6",
  width = 112,
  height = 38,
  className = "ml-1",
}: Props) {
  const series = (Array.isArray(data) ? data : []).filter(
    (v) => typeof v === "number" && Number.isFinite(v)
  );
  if (series.length === 0) return null;

  const points: [number, number][] = useMemo(() => {
    const min = Math.min(...series);
    const max = Math.max(...series);
    const span = max - min || 1; // verhindert Division durch 0 bei konstanter Reihe
    const len = Math.max(1, series.length - 1);

    return series.map((v, i) => {
      const x = (i / len) * 100;           // 0..100
      const y = 100 - ((v - min) / span) * 100; // 0..100 (oben=0)
      return [x, y];
    });
  }, [series]);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="Mini Trend Chart"
    >
      <polyline
        points={points.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2} fill={color} />
      ))}
    </svg>
  );
}
