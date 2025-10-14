// VPM25/features/ngo/components/EngagementStats.tsx
"use client";

import React, { useMemo } from "react";

export interface EngagementPoint {
  /** UNIX ms oder ISO */
  t: number | string;
  v: number;
}

export interface Segment {
  label: string;
  value: number; // absolute Anzahl
}

export interface EngagementStatsProps {
  periodLabel?: string; // z. B. "letzte 30 Tage"
  totals: {
    members: number;
    contributions: number; // Beiträge/Statements/Votes summiert oder spezifisch – dein Modell
    activeThisMonth: number;
  };
  kpis?: Array<{ label: string; value: number; deltaPct?: number }>;
  timeseries?: EngagementPoint[]; // für Sparkline
  segments?: Segment[]; // Top-Segmente (z. B. NGOs, Regionen, Themen)
}

/** Zahl hübsch formatiert */
function nf(n: number) {
  return new Intl.NumberFormat("de-DE").format(n);
}

/** Prozent mit Vorzeichen */
function pf(p?: number) {
  if (p === undefined || Number.isNaN(p)) return "";
  const s = (p >= 0 ? "+" : "") + p.toFixed(1) + " %";
  return s;
}

/** Primitive Sparkline (inline SVG, ohne extra Lib) */
function Sparkline({ data, height = 36 }: { data: EngagementPoint[]; height?: number }) {
  const path = useMemo<null | { d: string; w: number; h: number }>(() => {
    if (!data || data.length < 2) return null;
    const xs = data.map((_, i) => i);
    const ys = data.map((d) => d.v);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanY = Math.max(1, maxY - minY);
    const w = Math.max(40, data.length * 8);
    const h = height;
    const scaleX = (i: number) => (i / (data.length - 1)) * (w - 4) + 2;
    const scaleY = (v: number) => h - 2 - ((v - minY) / spanY) * (h - 4);
    let d = `M ${scaleX(xs[0])} ${scaleY(ys[0])}`;
    for (let i = 1; i < data.length; i++) d += ` L ${scaleX(xs[i])} ${scaleY(ys[i])}`;
    return { d, w, h };
  }, [data, height]);

  if (!path) {
    return <div className="h-9 text-xs text-gray-400">keine Zeitreihe</div>;
  }

  return (
    <svg width={path.w} height={path.h} viewBox={`0 0 ${path.w} ${path.h}`} className="overflow-visible">
      <polyline
        points={`2,${path.h - 2} ${path.w - 2},${path.h - 2}`}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="1"
      />
      <path d={path.d} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function EngagementStats({
  periodLabel = "letzte 30 Tage",
  totals,
  kpis = [],
  timeseries = [],
  segments = [],
}: EngagementStatsProps) {
  const maxSeg = useMemo(() => (segments.length ? Math.max(...segments.map((s) => s.value)) : 0), [segments]);

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Engagement</h3>
          <p className="text-xs text-gray-500">{periodLabel}</p>
        </div>
      </div>

      {/* KPI-Zeile */}
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        <KpiCard label="Mitglieder" value={nf(totals.members)} />
        <KpiCard label="Beiträge" value={nf(totals.contributions)} />
        <KpiCard label="Aktiv (Monat)" value={nf(totals.activeThisMonth)} />
      </div>

      {/* optionale KPIs + Sparkline */}
      {(kpis.length > 0 || timeseries.length > 1) && (
        <div className="grid grid-cols-1 gap-4 border-t border-gray-100 p-4 md:grid-cols-3">
          {/* Zusatz-KPIs */}
          <div className="space-y-2">
            {kpis.map((k) => (
              <div key={k.label} className="flex items-baseline justify-between rounded-lg border border-gray-200 p-3">
                <div className="text-sm text-gray-600">{k.label}</div>
                <div className="text-right">
                  <div className="text-base font-semibold">{nf(k.value)}</div>
                  {typeof k.deltaPct === "number" && (
                    <div className={`text-xs ${k.deltaPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {pf(k.deltaPct)} vs. vorher
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Sparkline */}
          <div className="md:col-span-2 flex items-center justify-center rounded-lg border border-gray-200 p-3">
            <Sparkline data={timeseries} />
          </div>
        </div>
      )}

      {/* Segmente */}
      {segments.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 p-4">
          <div className="text-sm font-semibold">Top-Segmente</div>
          <div className="space-y-2">
            {segments.map((s) => {
              const pct = maxSeg > 0 ? Math.round((s.value / maxSeg) * 100) : 0;
              return (
                <div key={s.label}>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span className="truncate">{s.label}</span>
                    <span>{nf(s.value)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded bg-gray-100">
                    <div
                      className="h-2 rounded bg-indigo-600"
                      style={{ width: `${pct}%` }}
                      aria-label={`${s.label}: ${pct}%`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
