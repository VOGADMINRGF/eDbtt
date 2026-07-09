import type {
  VoxyRenderRequestDraftPanelModel,
  VoxyRenderRequestDraftRequirementItem,
} from "@/features/create/voxyRenderRequestDraftContract";

type VoxyRenderRequestDraftPanelProps = {
  model: VoxyRenderRequestDraftPanelModel | null;
  title?: string;
  dataTestId?: string;
};

function StatusChip(props: { label: string; subtle?: boolean }) {
  return (
    <span
      className={
        props.subtle
          ? "rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]"
          : "rounded-full border border-emerald-300/60 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-900"
      }
    >
      {props.label}
    </span>
  );
}

function RequirementGrid(props: {
  title: string;
  items: VoxyRenderRequestDraftRequirementItem[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        {props.title}
      </p>
      {props.items.length > 0 ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {props.items.map((item) => (
            <div key={`${props.title}-${item.id}`} className="rounded-2xl border border-[rgb(var(--border))] px-3 py-3">
              <p className="text-sm font-medium text-[rgb(var(--fg))]">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {item.statusLabel} · {item.reason}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{props.emptyLabel}</p>
      )}
    </div>
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
    <div className="mt-4 grid gap-3 lg:grid-cols-4">
      {[
        {
          title: "Noch kein Renderjob",
          summary: "Dieser Draft erzeugt keinen Job und belegt keine Runtime-Wahrheit.",
        },
        {
          title: "Kein Providerlauf",
          summary: "Kein Adapter, kein Secret und kein Provider werden ausgeführt.",
        },
        {
          title: "Keine Kostenbuchung",
          summary: "Kein Credit- oder Billing-Write wird vorbereitet oder ausgelöst.",
        },
        {
          title: "Keine Veröffentlichung",
          summary: "Kein Upload, kein Publish, kein Social Posting und kein Scheduling.",
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

export default function VoxyRenderRequestDraftPanel({
  model,
  title,
  dataTestId,
}: VoxyRenderRequestDraftPanelProps) {
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
            Quelle: {model.draft.sourceLanguage} · Lesefassung: {model.draft.readingLanguage} ·
            Script: {model.draft.scriptLanguage} · Render-Ziel: {model.draft.renderLanguage}
          </p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            Original bleibt erhalten. Übersetzung ist Lesehilfe und kein Beleg.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip label={model.requestStatusLabel} />
          <StatusChip label={model.storeStateLabel} subtle />
        </div>
      </div>

      <GuardrailCards />

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Request-Draft
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.videoFormatLabel}</p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.draft.userVisibleReason}
          </p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.draft.reviewerVisibleReason}
          </p>
          <p className="mt-3 text-sm font-medium text-[rgb(var(--fg))]">
            Nächster Schritt: {model.nextStep}
          </p>
        </div>
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
              <p className="mt-3 text-sm font-medium text-[rgb(var(--fg))]">Letzter Draft-Record</p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.statusLabel}
                {model.latestRecord.requestVersion
                  ? ` · Version ${model.latestRecord.requestVersion}`
                  : ""}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.persistedAt
                  ? `Gespeichert: ${model.latestRecord.persistedAt}`
                  : "Noch nicht gespeichert"}
                {model.latestRecord.persistedBy
                  ? ` · ${model.latestRecord.persistedBy}`
                  : ""}
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">
              Noch kein gespeicherter Request-Draft-Record sichtbar.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <RequirementGrid
          title="Review-Anforderungen"
          items={model.draft.reviewRequirements}
          emptyLabel="Kein zusätzlicher Review-Hinweis sichtbar."
        />
        <RequirementGrid
          title="Provider-Anforderungen"
          items={model.draft.providerRequirements}
          emptyLabel="Noch keine zusätzlichen Provider-Anforderungen sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <RequirementGrid
          title="Asset-Anforderungen"
          items={model.draft.assetRequirements}
          emptyLabel="Noch keine zusätzlichen Asset-Anforderungen sichtbar."
        />
        <RequirementGrid
          title="Kosten- und Credit-Anforderungen"
          items={model.draft.costRequirements}
          emptyLabel="Noch keine zusätzlichen Kosten- oder Credit-Hinweise sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <RequirementGrid
          title="Public-Safety-Hinweise"
          items={model.draft.publicSafetyRequirements}
          emptyLabel="Keine zusätzlichen Public-Safety-Hinweise sichtbar."
        />
        <RequirementGrid
          title="Quellen- und Factcheck-Hinweise"
          items={model.draft.sourceFactcheckRequirements}
          emptyLabel="Keine zusätzlichen Quellen- oder Factcheck-Hinweise sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Warum das weiter nur Draft bleibt"
          items={model.blockedReasons}
          emptyLabel="Der Draft bleibt trotzdem strikt unterhalb von Queue, Provider, Datei, Kosten und Veröffentlichung."
        />
        <TextList
          title="Audit-Lesart"
          items={model.auditLines}
          emptyLabel="Noch keine Audit-Linien sichtbar."
        />
      </div>
    </section>
  );
}
