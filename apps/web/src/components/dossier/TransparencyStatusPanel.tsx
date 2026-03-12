import type { DossierDataState, DossierEntry } from "@features/dossier/modes";

type TransparencyStatusPanelProps = {
  entry: DossierEntry;
  dataState: DossierDataState;
  statusLabel: string;
  sourcesCount: number;
  openCount: number;
  inReviewCount: number;
  answeredCount: number;
  delegatedCount: number;
  communityCount: number;
  correctionsCount: number;
  onJump?: (
    target: "sources" | "open" | "inReview" | "answered" | "delegated" | "community" | "corrections",
  ) => void;
};

function statusTone(value: number) {
  if (value >= 6) return "text-emerald-600 dark:text-emerald-300";
  if (value >= 1) return "text-amber-600 dark:text-amber-200";
  return "text-[rgb(var(--muted))]";
}

export function TransparencyStatusPanel({
  entry,
  dataState,
  statusLabel,
  sourcesCount,
  openCount,
  inReviewCount,
  answeredCount,
  delegatedCount,
  communityCount,
  correctionsCount,
  onJump,
}: TransparencyStatusPanelProps) {
  const dataLabel =
    dataState === "live"
      ? "Echtdaten"
      : dataState === "demo"
        ? "Demo-Simulation"
        : dataState === "fallback"
          ? "Fallback"
          : "Lädt …";

  const entryLabel = entry === "demo" ? "Demo-Ansicht" : entry === "public" ? "Öffentliche Vorschau" : "Intern";

  return (
    <section className="vog-card p-5 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        Transparenzspur
      </div>
      <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">{entryLabel}</span>
        <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">{dataLabel}</span>
        <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">
          Status: {statusLabel}
        </span>
      </div>
      <div className="grid gap-2 text-[11px] text-[rgb(var(--fg))] sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onJump?.("sources")}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-left"
        >
          <div className="text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">Gesichert</div>
          <div className={`text-sm font-semibold ${statusTone(sourcesCount)}`}>
            {sourcesCount ? `${sourcesCount} Quellen` : "—"}
          </div>
        </button>
        <button
          type="button"
          onClick={() => onJump?.("open")}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-left"
        >
          <div className="text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">Offen</div>
          <div className={`text-sm font-semibold ${statusTone(openCount)}`}>{openCount}</div>
        </button>
        <button
          type="button"
          onClick={() => onJump?.("inReview")}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-left"
        >
          <div className="text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">In Prüfung</div>
          <div className={`text-sm font-semibold ${statusTone(inReviewCount)}`}>{inReviewCount}</div>
        </button>
        <button
          type="button"
          onClick={() => onJump?.("answered")}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-left"
        >
          <div className="text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">Beantwortet</div>
          <div className={`text-sm font-semibold ${statusTone(answeredCount)}`}>{answeredCount}</div>
        </button>
        <button
          type="button"
          onClick={() => onJump?.("community")}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-left"
        >
          <div className="text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">Community</div>
          <div className={`text-sm font-semibold ${statusTone(communityCount)}`}>{communityCount}</div>
        </button>
        <button
          type="button"
          onClick={() => onJump?.("delegated")}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-left"
        >
          <div className="text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">Delegiert</div>
          <div className={`text-sm font-semibold ${statusTone(delegatedCount)}`}>{delegatedCount}</div>
        </button>
        <button
          type="button"
          onClick={() => onJump?.("corrections")}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-left sm:col-span-2"
        >
          <div className="text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">Einsprüche</div>
          <div className={`text-sm font-semibold ${statusTone(correctionsCount)}`}>{correctionsCount}</div>
        </button>
      </div>
      <p className="text-[11px] text-[rgb(var(--muted))]">
        Beiträge und Änderungen sind versioniert: eingereicht → geprüft → übernommen/archiviert.
      </p>
    </section>
  );
}

export default TransparencyStatusPanel;
