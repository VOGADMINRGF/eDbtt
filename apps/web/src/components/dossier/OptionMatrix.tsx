import Link from "next/link";
import { OPTION_TYPE_LABELS } from "./labels";

type Dimension = {
  key: string;
  label: string;
  value: number;
};

type OptionCard = {
  id: string;
  label: string;
  type?: string;
  narrative: string;
  touches: string[];
  dimensions: Dimension[];
  chips: string[];
  statementCount: number;
  evidenceCount: number;
  evidenceDensity: number;
  budgetRange: string;
  riskProfile: string;
  clusterLabel?: string;
  majorityPct?: number;
};

type OptionMatrixProps = {
  options: OptionCard[];
  ctaHref?: string;
};

const RADAR_SIZE = 72;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RADIUS = 28;

function polarPoint(angle: number, radius: number) {
  return {
    x: RADAR_CENTER + Math.cos(angle) * radius,
    y: RADAR_CENTER + Math.sin(angle) * radius,
  };
}

function renderRadarPoints(dimensions: Dimension[]) {
  const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
  const points = dimensions.map((dim, index) => {
    const radius = RADAR_RADIUS * dim.value;
    const { x, y } = polarPoint(angles[index], radius);
    return `${x},${y}`;
  });
  return points.join(" ");
}

export function OptionMatrix({ options, ctaHref = "#vote" }: OptionMatrixProps) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4">
        {options.map((option) => (
          <article
            key={option.id}
            className="vog-card p-5 shadow-soft transition hover:-translate-y-0.5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
                  <span className="vog-chip">{OPTION_TYPE_LABELS[option.type ?? "custom"] ?? "Maßnahme"}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">{option.label}</h3>
                  <p className="text-sm text-[rgb(var(--muted))]">{option.narrative}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-[rgb(var(--muted))]">
                  {option.chips.length ? (
                    option.chips.map((label) => (
                      <span key={label} className="vog-chip">
                        {label}
                      </span>
                    ))
                  ) : (
                    <span className="vog-chip">Ohne dominante Dimension</span>
                  )}
                </div>
                <div className="text-[11px] text-[rgb(var(--muted))]">
                  Berührt Statements: {option.touches.length ? option.touches.join(", ") : "-"}
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-[rgb(var(--muted))]">
                  <span>Statements: {option.statementCount}</span>
                  <span>Evidenz: {option.evidenceCount}</span>
                  <span>Budget: {option.budgetRange}</span>
                  <span>Risiko: {option.riskProfile}</span>
                  {option.clusterLabel ? <span>Cluster: {option.clusterLabel}</span> : null}
                  {typeof option.majorityPct === "number" ? (
                    <span>Tendenz: {option.majorityPct}%</span>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[rgb(var(--muted))]">
                    <span>Evidenzdichte</span>
                    <span>{Math.round(option.evidenceDensity * 100)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[rgb(var(--border))]">
                    <div
                      className="h-2 rounded-full bg-brand-grad transition-all duration-500"
                      style={{ width: `${option.evidenceDensity * 100}%` }}
                    />
                  </div>
                </div>
                <Link
                  href={ctaHref}
                  className="text-xs font-semibold text-[rgb(var(--fg))] underline"
                >
                  Diese Option wählen
                </Link>
              </div>
              <div className="flex items-center justify-start md:justify-end">
                <svg
                  width={RADAR_SIZE}
                  height={RADAR_SIZE}
                  viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
                >
                  <circle
                    cx={RADAR_CENTER}
                    cy={RADAR_CENTER}
                    r={RADAR_RADIUS}
                    fill="none"
                    stroke="rgba(148,163,184,0.35)"
                    strokeWidth="1"
                  />
                  {option.dimensions.map((_, index) => {
                    const angle = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][index];
                    const { x, y } = polarPoint(angle, RADAR_RADIUS);
                    return (
                      <line
                        key={`axis-${option.id}-${index}`}
                        x1={RADAR_CENTER}
                        y1={RADAR_CENTER}
                        x2={x}
                        y2={y}
                        stroke="rgba(148,163,184,0.4)"
                        strokeWidth="1"
                      />
                    );
                  })}
                  <polygon
                    points={renderRadarPoints(option.dimensions)}
                    fill="rgba(56,189,248,0.18)"
                    stroke="rgba(56,189,248,0.6)"
                    strokeWidth="1.2"
                  />
                </svg>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default OptionMatrix;
