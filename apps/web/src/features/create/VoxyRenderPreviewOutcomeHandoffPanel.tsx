import type { VoxyRenderPreviewOutcomeHandoffPanelModel } from "@/features/create/voxyRenderPreviewOutcomeHandoffContract";

type VoxyRenderPreviewOutcomeHandoffPanelProps = {
  model: VoxyRenderPreviewOutcomeHandoffPanelModel | null;
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

export default function VoxyRenderPreviewOutcomeHandoffPanel({
  model,
  title,
  dataTestId,
}: VoxyRenderPreviewOutcomeHandoffPanelProps) {
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
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip label={model.previewDecisionLabel} muted />
          <StatusChip label={model.handoffStatusLabel} subtle />
          <StatusChip label={model.downstreamTargetLabel} subtle />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-7">
        {[
          {
            title: "Audit-only",
            summary: "Es entsteht nur ein auditierbarer Outcome-Handoff-Record.",
          },
          {
            title: "Kein Render",
            summary: "Der Handoff startet keinen Renderjob und keine Runtime.",
          },
          {
            title: "Kein Re-Render",
            summary: "Revision bleibt Handoff-Kandidat und startet keinen Re-Render.",
          },
          {
            title: "Keine Medien-Datei",
            summary: "Es entsteht weder Preview-Datei noch Thumbnail noch Export.",
          },
          {
            title: "Kein Providerlauf",
            summary: "Kein Avatar-, Voice- oder sonstiger Provider wird aufgerufen.",
          },
          {
            title: "Keine Kosten",
            summary: "Es gibt keine Abbuchung, keine Credits und keinen Upload.",
          },
          {
            title: "Keine Veröffentlichung",
            summary: "Review-ready bleibt nicht approved, nicht published und nicht geplant.",
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

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Handoff-Vorschau
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusChip label={model.commandPreview.outcomeTypeLabel} subtle />
            <StatusChip label={model.commandPreview.handoffStatusLabel} />
            <StatusChip label={model.commandPreview.downstreamTargetLabel} subtle />
          </div>
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
            Die Vorschau bleibt `preview_outcome_handoff_only / noop_downstream_handoff`: kein
            Render, kein Re-Render, kein Provider, keine Kosten, kein Publish.
          </p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            Preview-Review-Decision:{" "}
            {model.commandPreview.previewReviewDecisionRecordId ?? "noch keine Persistenz"}
          </p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            Erzeugt am: {model.commandPreview.createdAt ?? "nur als Readmodel-Vorschau"}
          </p>
        </div>

        <ListBox
          title="Nächster Schritt"
          items={[model.nextStep]}
          emptyLabel="Noch kein nächster Schritt sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ListBox
          title="Outcome-Mapping"
          items={model.mappingLines}
          emptyLabel="Noch kein Mapping sichtbar."
        />
        <ListBox
          title="Wirkung ohne Ausführung"
          items={model.effectLines}
          emptyLabel="Noch keine Wirkungslinien sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ListBox
          title="Payload & Hinweise"
          items={model.payloadLines}
          emptyLabel="Noch keine Zusatzhinweise sichtbar."
        />
        <ListBox
          title="Top-Blocker"
          items={model.topBlockers}
          emptyLabel="Keine zusätzlichen Blocker sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ListBox
          title="Audit-Lesart"
          items={model.auditLines}
          emptyLabel="Noch keine Audit-Linien sichtbar."
        />
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
                Letzter persistierter Outcome-Handoff
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.outcomeTypeLabel} · {model.latestRecord.handoffStatusLabel}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                Ziel: {model.latestRecord.downstreamTargetLabel}
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
              Noch kein persistierter Preview-Outcome-Handoff sichtbar.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
