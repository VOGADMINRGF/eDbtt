import type {
  VoxyRenderRuntimeEnablementBacklogPanelModel,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogContract";

type VoxyRenderRuntimeEnablementBacklogPanelProps = {
  model: VoxyRenderRuntimeEnablementBacklogPanelModel | null;
  title?: string;
  dataTestId?: string;
};

function StatusChip(props: { label: string; subtle?: boolean }) {
  return (
    <span
      className={
        props.subtle
          ? "rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]"
          : "rounded-full border border-amber-300/60 bg-amber-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900"
      }
    >
      {props.label}
    </span>
  );
}

function TextList(props: { title: string; items: string[]; emptyLabel: string }) {
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

function GuardrailCards() {
  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-5">
      {[
        {
          title: "Noch keine Runtime",
          summary: "Der Backlog schaltet keine Runtime frei und behauptet keine Betriebswahrheit.",
        },
        {
          title: "Kein Render",
          summary: "Es entsteht kein Renderjob, keine Medien-Datei und kein Export.",
        },
        {
          title: "Keine Queue",
          summary: "Keine Queue-Aktivierung, kein Worker und kein Scheduling.",
        },
        {
          title: "Kein Providerlauf",
          summary: "Keine Avatar-, Voice- oder Render-Provider werden gestartet.",
        },
        {
          title: "Keine Kosten",
          summary: "Keine Debit-Buchung, keine Credits und keine Veröffentlichung.",
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
  );
}

export default function VoxyRenderRuntimeEnablementBacklogPanel({
  model,
  title,
  dataTestId,
}: VoxyRenderRuntimeEnablementBacklogPanelProps) {
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
            Original bleibt erhalten. Übersetzung ist Lesehilfe und kein Beleg.
            {model.preview.subtitleLanguage
              ? ` Untertitel: ${model.preview.subtitleLanguage}.`
              : " Untertitel bleiben noch offen."}
            {model.preview.rtlRequired ? " RTL-Hinweis bleibt sichtbar." : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip label={model.backlogStatusLabel} />
          <StatusChip label={model.nextRecommendedActionLabel} />
          <StatusChip label={model.storeStateLabel} subtle />
        </div>
      </div>

      <GuardrailCards />

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Enablement-Kategorien
        </p>
        <div className="mt-3 space-y-3">
          {model.categorySections.map((section) => (
            <div
              key={section.key}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3"
            >
              <p className="text-sm font-medium text-[rgb(var(--fg))]">{section.title}</p>
              <div className="mt-3 space-y-2">
                {section.items.map((item) => (
                  <div
                    key={item.itemId}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip label={item.priorityLabel} />
                      <StatusChip label={item.statusLabel} subtle />
                      <StatusChip label={item.categoryLabel} subtle />
                    </div>
                    <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                      {item.userVisibleReason}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                      Quelle: {item.sourceGateLabel} · Runtime-Impact: {item.runtimeImpactLabel}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Top-P0"
          items={model.topP0Items}
          emptyLabel="Noch keine P0-Enablement-Aufgaben sichtbar."
        />
        <TextList
          title="Nächste Aktion"
          items={[model.nextStep]}
          emptyLabel="Noch keine nächste Aktion sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Blocker"
          items={model.blockedReasons}
          emptyLabel="Keine zusätzlichen Blocker sichtbar."
        />
        <TextList
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
                Letzter Enablement-Backlog
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.statusLabel}
                {model.latestRecord.backlogVersion
                  ? ` · Version ${model.latestRecord.backlogVersion}`
                  : ""}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.persistedAt
                  ? `Gespeichert: ${model.latestRecord.persistedAt}`
                  : "Noch nicht gespeichert"}
                {model.latestRecord.persistedBy ? ` · ${model.latestRecord.persistedBy}` : ""}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                Matrix: {model.latestRecord.matrixId ?? "keine"}
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">
              Noch kein gespeicherter Enablement-Backlog sichtbar.
            </p>
          )}
        </div>
        <TextList
          title="Zusammenfassung"
          items={[model.preview.reviewerVisibleSummary]}
          emptyLabel="Noch keine Zusammenfassung sichtbar."
        />
      </div>
    </section>
  );
}
