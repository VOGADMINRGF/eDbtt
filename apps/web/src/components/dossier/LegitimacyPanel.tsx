import type { ReactNode } from "react";

export type LegitimacyMetric = {
  key: string;
  label: string;
  value: number;
  description: string;
};

export type LegitimacyStatus = {
  label: string;
  text: string;
  tone?: "neutral" | "positive" | "warning";
};

type LegitimacyPanelProps = {
  metrics: LegitimacyMetric[];
  status: LegitimacyStatus;
  footnote?: ReactNode;
};

function toneClass(tone?: LegitimacyStatus["tone"]) {
  if (tone === "positive") return "border-emerald-400/40 bg-emerald-400/10";
  if (tone === "warning") return "border-amber-400/40 bg-amber-400/10";
  return "border-[rgb(var(--border))] bg-[rgb(var(--card))]";
}

export function LegitimacyPanel({ metrics, status, footnote }: LegitimacyPanelProps) {
  return (
    <section className="vog-card p-5 space-y-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Legitimitäts-Panel
        </p>
        <p className="text-sm text-[rgb(var(--muted))]">
          Übersicht über Beleglage, Klärungsstand, Perspektiven und Transparenz.
        </p>
      </div>

      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.key} className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[rgb(var(--muted))]">
              <span className="font-semibold text-[rgb(var(--fg))]">{metric.label}</span>
              <span>{Math.round(metric.value)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[rgb(var(--border))]">
              <div
                className="h-2 rounded-full bg-brand-grad transition-all duration-700"
                style={{ width: `${Math.round(metric.value)}%` }}
              />
            </div>
            <p className="text-[11px] text-[rgb(var(--muted))]">{metric.description}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border p-4 ${toneClass(status.tone)}`}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Dokumentationsstand
        </p>
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{status.label}</p>
        <p className="text-[11px] text-[rgb(var(--muted))]">{status.text}</p>
      </div>

      <details className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
          Was bedeutet das?
        </summary>
        <div className="mt-3 space-y-2 text-[11px] text-[rgb(var(--muted))]">
          <p>Evidenz: Wie viele Aussagen sind mit Quellen verknüpft?</p>
          <p>Klärung: Welche Fragen sind noch offen und in Bearbeitung?</p>
          <p>Perspektiven: Welche Gruppen sollten mitreden oder eingebunden werden?</p>
          <p>Transparenz: Ist nachvollziehbar, wie das Ergebnis entstanden ist?</p>
          {footnote ? <div>{footnote}</div> : null}
        </div>
      </details>
    </section>
  );
}

export default LegitimacyPanel;
