import type {
  VoxyRenderPreviewReviewFlowPanelModel,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";

type VoxyRenderPreviewReviewFlowPanelProps = {
  model: VoxyRenderPreviewReviewFlowPanelModel | null;
  title?: string;
  dataTestId?: string;
};

function StatusChip(props: { label: string; subtle?: boolean; muted?: boolean }) {
  const className = props.subtle
    ? "rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]"
    : props.muted
      ? "rounded-full border border-amber-300/60 bg-amber-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900"
      : "rounded-full border border-rose-300/60 bg-rose-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-900";
  return <span className={className}>{props.label}</span>;
}

function ListBox(props: { title: string; items: string[]; emptyLabel: string }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        {props.title}
      </p>
      {props.items.length > 0 ? (
        <div className="mt-2 space-y-1 text-sm leading-6 text-[rgb(var(--muted))]">
          {props.items.map((item) => (
            <p key={`${props.title}-${item}`}>{item}</p>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{props.emptyLabel}</p>
      )}
    </div>
  );
}

export default function VoxyRenderPreviewReviewFlowPanel({
  model,
  title,
  dataTestId,
}: VoxyRenderPreviewReviewFlowPanelProps) {
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
            Quelle: {model.preview.sourceLanguage} · Lesefassung: {model.preview.readingLanguage} ·
            Script: {model.preview.scriptLanguage} · Render-Ziel: {model.preview.renderLanguage}
          </p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.preview.subtitleLanguage
              ? `Untertitel: ${model.preview.subtitleLanguage}. `
              : "Untertitel bleiben offen. "}
            {model.preview.rtlRequired ? "RTL bleibt als Review-Punkt sichtbar. " : ""}
            Original bleibt erhalten, Übersetzung ist nur Lesehilfe.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip label={model.previewStatusLabel} muted />
          <StatusChip label={model.overallDecisionLabel} subtle />
          <StatusChip label={model.storeStateLabel} subtle />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-6">
        {[
          {
            title: "Noch kein Preview-Video",
            summary: "Der Flow zeigt nur spätere Review-Wege und erzeugt heute kein Preview.",
          },
          {
            title: "Keine Medien-Datei",
            summary: "Es gibt keine Video-Datei, kein Thumbnail und keine Laufzeitangabe.",
          },
          {
            title: "Kein Render",
            summary: "Kein Renderjob, keine Queue-Ausführung und kein Worker werden gestartet.",
          },
          {
            title: "Kein Providerlauf",
            summary: "Kein Avatar-, Voice- oder sonstiger Provider wird aufgerufen.",
          },
          {
            title: "Keine Kosten",
            summary: "Keine Debit-Buchung, keine Credits und keine Upload-Kosten entstehen.",
          },
          {
            title: "Keine Veröffentlichung",
            summary: "Review-ready ist weder Approval noch Publish noch Social Posting.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              {card.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{card.summary}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Preview-Kandidat
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusChip label={model.candidateStatusLabel} subtle />
            <StatusChip label={model.nextRecommendedActionLabel} subtle />
          </div>
          <p className="mt-3 text-sm font-medium text-[rgb(var(--fg))]">
            {model.preview.previewCandidate.userVisibleReason}
          </p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            {model.preview.previewCandidate.reviewerVisibleReason}
          </p>
          <div className="mt-3 grid gap-2 text-xs leading-5 text-[rgb(var(--muted))] sm:grid-cols-2">
            <p>Media URL: {model.preview.previewCandidate.mediaUrl ?? "keine"}</p>
            <p>Thumbnail: {model.preview.previewCandidate.thumbnailUrl ?? "keines"}</p>
            <p>Dauer: {model.preview.previewCandidate.durationSeconds ?? "unbekannt"}</p>
            <p>Playbar: {model.preview.previewCandidate.playable ? "ja" : "nein"}</p>
          </div>
        </div>

        <ListBox
          title="Nächster Schritt"
          items={[model.nextStep]}
          emptyLabel="Noch kein nächster Schritt sichtbar."
        />
      </div>

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Review-Aktionen
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {model.actionRows.map((action) => (
            <div
              key={action.actionKey}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip label={action.actionLabel} subtle />
                <StatusChip label={action.allowed ? "Nur Dokumentation" : "Nicht freigegeben"} />
              </div>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                {action.reviewerVisibleReason}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Review-Checklist
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {model.checklistRows.map((item) => (
            <div
              key={item.checkKey}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip label={item.checkLabel} subtle />
                <StatusChip label={item.statusLabel} />
              </div>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                {item.userVisibleReason}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ListBox
          title="Top-Blocker"
          items={model.topBlockers}
          emptyLabel="Keine zusätzlichen Blocker sichtbar."
        />
        <ListBox
          title="Audit-Lesart"
          items={model.auditLines}
          emptyLabel="Noch keine Audit-Linien sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Store-Grenze
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.storeStateLabel}</p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.storeStateSummary}
          </p>
          {model.latestRecord ? (
            <>
              <p className="mt-3 text-sm font-medium text-[rgb(var(--fg))]">
                Letzter Preview-Review-Flow
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.statusLabel} · {model.latestRecord.overallDecisionLabel}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.persistedAt
                  ? `Gespeichert: ${model.latestRecord.persistedAt}`
                  : "Noch nicht gespeichert"}
                {model.latestRecord.persistedBy ? ` · ${model.latestRecord.persistedBy}` : ""}
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">
              Noch kein gespeicherter Preview-Review-Flow sichtbar.
            </p>
          )}
        </div>

        <ListBox
          title="Zusammenfassung"
          items={[model.preview.userVisibleSummary]}
          emptyLabel="Noch keine Zusammenfassung sichtbar."
        />
      </div>
    </section>
  );
}
