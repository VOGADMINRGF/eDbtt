import Link from "next/link";
import EvidenceStatus from "./EvidenceStatus";
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
  evidenceLevel: "none" | "linked" | "multi";
  evidenceScore: number;
  dimensionLine: string;
  clarifiedCount: number;
  questionTotal: number;
  budgetRange: string;
  riskProfile: string;
  clusterLabel?: string;
  majorityPct?: number;
  dimensionNote?: string;
};

type OptionMatrixProps = {
  options: OptionCard[];
  ctaHref?: string;
  selectedOptionId?: string | null;
  onSelect?: (optionId: string) => void;
  optionRanking?: Map<string, number>;
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

export function OptionMatrix({
  options,
  ctaHref = "#vote",
  selectedOptionId,
  onSelect,
  optionRanking,
}: OptionMatrixProps) {
  const hasRanking =
    optionRanking && Array.from(optionRanking.values()).some((value) => value > 0);
  const rankedOptions = hasRanking
    ? [...options].sort(
        (a, b) => (optionRanking?.get(b.id) ?? 0) - (optionRanking?.get(a.id) ?? 0),
      )
    : options;

  return (
    <section className="space-y-4">
      <div className="grid gap-4">
        {rankedOptions.map((option, index) => {
          const rank = hasRanking ? index : null;
          const rankClass =
            rank === 0
              ? "border-teal-700/45"
              : rank === 1
                ? "border-teal-700/35"
                : rank === 2
                  ? "border-teal-700/25"
                  : "";
          return (
          <article
            key={option.id}
            className={`vog-card rounded-xl p-5 shadow-soft transition ${rankClass} ${
              selectedOptionId === option.id
                ? "border-[rgb(var(--grad-from))] ring-1 ring-[rgb(var(--grad-from))]"
                : ""
            }`}
            role="button"
            tabIndex={0}
            aria-pressed={selectedOptionId === option.id}
            onClick={() => onSelect?.(option.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect?.(option.id);
              }
            }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
                  <span className="vog-chip">{OPTION_TYPE_LABELS[option.type ?? "custom"] ?? "Maßnahme"}</span>
                  {selectedOptionId === option.id ? <span className="vog-chip">Vorauswahl</span> : null}
                  {rank !== null ? <span className="vog-chip">Rang {rank + 1}</span> : null}
                </div>
                <div className="min-h-[64px]">
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
                    <span className="vog-chip">Keine dominante Dimension</span>
                  )}
                </div>
                {option.dimensionNote ? (
                  <p className="text-[11px] text-[rgb(var(--muted))]">{option.dimensionNote}</p>
                ) : null}
                <div className="text-[11px] text-[rgb(var(--muted))]">
                  Berührt Kernaussagen: {option.touches.length ? option.touches.join(", ") : "-"}
                </div>
                <div className="min-h-[72px] space-y-1 text-[11px] text-[rgb(var(--muted))]">
                  <p>Wirkungsdimensionen: {option.dimensionLine}</p>
                  <p>Evidenzdichte: {option.evidenceScore}</p>
                  <p>Verknüpfte Aussagen: {option.statementCount}</p>
                  <p>Offene Fragen geklärt: {option.clarifiedCount} / {option.questionTotal || 0}</p>
                </div>
                <div className="min-h-[96px]">
                  <EvidenceStatus level={option.evidenceLevel} density={option.evidenceDensity} />
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
                  <defs>
                    <linearGradient id={`radar-grad-${option.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(var(--grad-from),0.28)" />
                      <stop offset="100%" stopColor="rgba(var(--grad-to),0.18)" />
                    </linearGradient>
                  </defs>
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
                    fill={`url(#radar-grad-${option.id})`}
                    stroke="rgba(var(--grad-from),0.45)"
                    strokeWidth="1"
                  />
                </svg>
              </div>
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}

export default OptionMatrix;
