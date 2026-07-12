import type {
  EditorialSeriesModel,
  EditorialSeriesStage,
} from "@/features/editorialSeries/editorialSeriesContract";

type EditorialSeriesPanelProps = {
  model: EditorialSeriesModel | null;
  title?: string;
  dataTestId?: string;
};

function stageClass(stage: EditorialSeriesStage): string {
  if (stage.status === "completed") {
    return "border-emerald-300/60 bg-emerald-50/80 text-emerald-800";
  }
  if (stage.status === "current") {
    return "border-sky-300/60 bg-sky-50/80 text-sky-800";
  }
  return "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))]";
}

export default function EditorialSeriesPanel({
  model,
  title,
  dataTestId,
}: EditorialSeriesPanelProps) {
  if (!model) return null;

  return (
    <section
      data-testid={dataTestId}
      className="mt-5 rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            {title ?? model.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{model.summary}</p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.clusterLabel} · {model.cadenceLabel}
          </p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            Review-ready ist nicht approved. Approved ist nicht published.
          </p>
        </div>
        <div className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {model.currentStageLabel}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Zielgruppe
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.audienceLabel}</p>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Nächste CTA
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">
            {model.callToActionLabel}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {model.stages.map((stage) => (
          <div
            key={stage.id}
            className={`rounded-2xl border px-3 py-3 ${stageClass(stage)}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">
              {stage.label}
            </p>
            <p className="mt-2 text-xs leading-5">{stage.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Review-Gates
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {model.reviewGates.map((item) => (
            <span
              key={item}
              className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs font-medium text-[rgb(var(--fg))]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {model.episodes.map((episode) => (
          <div
            key={episode.id}
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              {episode.label}
            </p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
              {episode.windowLabel}
            </p>
            <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{episode.focus}</p>
            <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
              Zielgruppe: {episode.targetAudience}
            </p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
              CTA: {episode.callToAction}
            </p>
            <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
              Quellenkontext:{" "}
              {episode.sourceContext.length > 0
                ? episode.sourceContext.join(" · ")
                : "bleibt im Review sichtbar"}
            </p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
              Claim-Kontext:{" "}
              {episode.claimContext.length > 0
                ? episode.claimContext.join(" · ")
                : "bleibt im Review sichtbar"}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Export-Hinweise
          </p>
          <p className="mt-2 text-sm text-[rgb(var(--fg))]">
            {model.exportFormats.length > 0
              ? model.exportFormats.join(" · ")
              : "Nur Review-Entwurf, kein aktiver Exportpfad."}
          </p>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Route-Hints
          </p>
          <p className="mt-2 text-sm text-[rgb(var(--fg))]">
            {model.routeHints.length > 0
              ? model.routeHints.join(" · ")
              : "Keine zusätzliche Route neben dem bestehenden Review-Pfad nötig."}
          </p>
        </div>
      </div>
    </section>
  );
}
