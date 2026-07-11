import type {
  VoxyRenderPreviewReviewDecisionPersistencePanelModel,
} from "@/features/create/voxyRenderPreviewReviewDecisionPersistenceContract";

type VoxyRenderPreviewReviewDecisionPersistencePanelProps = {
  model: VoxyRenderPreviewReviewDecisionPersistencePanelModel | null;
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

export default function VoxyRenderPreviewReviewDecisionPersistencePanel({
  model,
  title,
  dataTestId,
}: VoxyRenderPreviewReviewDecisionPersistencePanelProps) {
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
          <StatusChip label={model.previewFlowStatusLabel} muted />
          <StatusChip label={model.decisionTypeLabel} subtle />
          <StatusChip label={model.decisionStatusLabel} subtle />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-7">
        {[
          {
            title: "Audit-only",
            summary: "Es wird nur eine menschliche Review-Entscheidung gespeichert.",
          },
          {
            title: "Kein Render",
            summary: "Die Entscheidung startet keinen Renderjob und keine Runtime.",
          },
          {
            title: "Kein Re-Render",
            summary: "Revision bleibt Dokumentation und löst keinen Re-Render aus.",
          },
          {
            title: "Keine Medien-Datei",
            summary: "Es entsteht weder Preview-Datei noch Thumbnail noch Laufzeit.",
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
            summary: "Review-ready ist weder Approval noch Publish noch Scheduling.",
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
            Entscheidungsvorschau
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusChip label={model.commandPreview.decisionTypeLabel} subtle />
            <StatusChip label={model.commandPreview.decisionStatusLabel} />
          </div>
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
            Die Vorschau bleibt rein dokumentarisch und nutzt denselben Flow wie spätere
            Audit-Records, ohne Render, Queue, Provider, Kosten oder Publish.
          </p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            Preview-Review-Flow: {model.commandPreview.previewReviewFlowId ?? "noch keiner"}
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

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Sichtbare Aktionen
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
          Checklist-Stand
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
                Letzte persistierte Entscheidung
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.decisionTypeLabel} · {model.latestRecord.decisionStatusLabel}
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
              Noch kein persistierter Preview-Review-Decision-Record sichtbar.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
