type EvidenceLevel = "none" | "linked" | "multi";

type EvidenceStatusProps = {
  level: EvidenceLevel;
  density: number;
};

const LEVEL_LABELS: Record<EvidenceLevel, string> = {
  none: "Keine direkte Quellenverknüpfung",
  linked: "Direkt belegt",
  multi: "Mehrfach belegt",
};

const LEVEL_DESCRIPTIONS: Record<EvidenceLevel, string> = {
  none:
    "Für diese Option liegt derzeit keine direkte Quellenverknüpfung im Dossier vor. Sie basiert auf Struktur- oder Prozessüberlegungen.",
  linked: "Diese Option ist mit mindestens einer Quelle im Dossier verknüpft.",
  multi: "Mehrere Quellen stützen diese Option im Dossier.",
};

function levelClass(level: EvidenceLevel) {
  if (level === "none") return "border-slate-400/40 bg-slate-400/10";
  if (level === "linked") return "border-sky-400/40 bg-sky-400/10";
  return "border-emerald-400/40 bg-emerald-400/10";
}

export function EvidenceStatus({ level, density }: EvidenceStatusProps) {
  return (
    <div className="space-y-2">
      <span
        className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--fg))] ${levelClass(level)}`}
      >
        {LEVEL_LABELS[level]}
      </span>
      <p className="text-[11px] text-[rgb(var(--muted))]">{LEVEL_DESCRIPTIONS[level]}</p>
      <p className="text-[10px] text-[rgb(var(--muted))]">
        Evidenzdichte beschreibt, wie viele Quellen direkt mit dieser Option verknüpft sind.
      </p>
      <p className="text-[10px] text-[rgb(var(--muted))]">Evidenzdichte: {Math.round(density * 100)}%</p>
    </div>
  );
}

export default EvidenceStatus;
