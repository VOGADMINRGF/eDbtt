import { deriveTruthSignalBadges, type TruthSignalBadge } from "@features/factcheck";
import type { Dossier, TruthGuardrails } from "@features/dossier";

const BADGE_LABELS: Record<TruthSignalBadge, string> = {
  kritisch: "Kritisch",
  in_pruefung: "In Prüfung",
  bestaetigt: "Bestätigt",
  widerspruechlich: "Widersprüchlich",
  korrigiert: "Korrigiert",
};

const BADGE_STYLES: Record<TruthSignalBadge, string> = {
  kritisch: "border-rose-500/50 bg-rose-500/15 text-[rgb(var(--fg))]",
  in_pruefung: "border-amber-500/50 bg-amber-500/15 text-[rgb(var(--fg))]",
  bestaetigt: "border-emerald-500/50 bg-emerald-500/15 text-[rgb(var(--fg))]",
  widerspruechlich: "border-sky-500/50 bg-sky-500/15 text-[rgb(var(--fg))]",
  korrigiert: "border-teal-500/50 bg-teal-500/15 text-[rgb(var(--fg))]",
};

function classifyClaimTypes(claims: Dossier["analyze"]["claims"]) {
  const summary = {
    tatsache: 0,
    interpretation: 0,
    bewertung: 0,
    offeneBehauptung: 0,
  };
  for (const claim of claims) {
    const type = (claim as { statementType?: string | null }).statementType;
    if (type === "fact") summary.tatsache += 1;
    else if (type === "interpretation") summary.interpretation += 1;
    else if (type === "value") summary.bewertung += 1;
    else summary.offeneBehauptung += 1;
  }
  return summary;
}

export function TruthStatusPanel({
  guardrails,
  claims,
  corrections = [],
}: {
  guardrails: TruthGuardrails;
  claims: Dossier["analyze"]["claims"];
  corrections?: Dossier["corrections"];
}) {
  const hasAcceptedCorrection = corrections.some((item) => item.status === "accepted");
  const hasOpenObjection = corrections.some(
    (item) => item.kind === "objection" && item.status === "open",
  );
  const badges = deriveTruthSignalBadges({
    guardrails,
    hasAcceptedCorrection,
    hasOpenObjection,
  });
  const typeSummary = classifyClaimTypes(claims);

  return (
    <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-soft space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Truth-Status
        </p>
        <div className="flex flex-wrap gap-1">
          {badges.map((badge) => (
            <span
              key={badge}
              className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${BADGE_STYLES[badge]}`}
            >
              {BADGE_LABELS[badge]}
            </span>
          ))}
        </div>
      </div>
      <p className="text-xs text-[rgb(var(--muted))]">
        {guardrails.summary ??
          "Wenn Quellenlage, Factcheck und Erstframing auseinanderlaufen, relativiert das Dossier die Erstdeutung sichtbar."}
      </p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
          <p className="uppercase tracking-wide text-[rgb(var(--muted))]">Tatsache</p>
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">{typeSummary.tatsache}</p>
        </div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
          <p className="uppercase tracking-wide text-[rgb(var(--muted))]">Interpretation</p>
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">{typeSummary.interpretation}</p>
        </div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
          <p className="uppercase tracking-wide text-[rgb(var(--muted))]">Bewertung</p>
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">{typeSummary.bewertung}</p>
        </div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
          <p className="uppercase tracking-wide text-[rgb(var(--muted))]">Offene Behauptung</p>
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">
            {typeSummary.offeneBehauptung}
          </p>
        </div>
      </div>
    </section>
  );
}

export default TruthStatusPanel;
