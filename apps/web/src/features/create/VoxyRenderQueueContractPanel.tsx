import type {
  VoxyRenderQueuePanelModel,
} from "@/features/create/voxyRenderQueueContract";
import type {
  VoxyRenderRequestDraftRequirementItem,
} from "@/features/create/voxyRenderRequestDraftContract";

type VoxyRenderQueueContractPanelProps = {
  model: VoxyRenderQueuePanelModel | null;
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
    <div className="mt-4 grid gap-3 lg:grid-cols-3">
      {[
        {
          title: "Noch keine Queue",
          summary: "Es wird nichts eingereiht, kein Queue-Job angelegt und kein Worker angesprungen.",
        },
        {
          title: "Kein Worker",
          summary: "Kein Hintergrundlauf und keine asynchrone Ausführung.",
        },
        {
          title: "Kein Providerlauf",
          summary: "Kein Avatar-, Voice- oder Render-Provider wird gestartet.",
        },
        {
          title: "Keine Datei",
          summary: "Keine Video-, Audio- oder Medien-Datei wird erzeugt.",
        },
        {
          title: "Keine Kosten",
          summary: "Kein Credit-, Billing- oder Cost-Debit-Write wird ausgelöst.",
        },
        {
          title: "Keine Veröffentlichung",
          summary: "Kein Upload, kein Publish, kein Social Posting, kein Scheduling.",
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

export default function VoxyRenderQueueContractPanel({
  model,
  title,
  dataTestId,
}: VoxyRenderQueueContractPanelProps) {
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
            {model.preview.rtlRequired ? " RTL-Hinweis bleibt sichtbar." : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip label={model.queueStatusLabel} />
          <StatusChip label={model.storeStateLabel} subtle />
        </div>
      </div>

      <GuardrailCards />

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Queue-Preview
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.videoFormatLabel}</p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.preview.userVisibleReason}
          </p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.preview.reviewerVisibleReason}
          </p>
          <p className="mt-3 text-sm font-medium text-[rgb(var(--fg))]">
            Nächster Schritt: {model.nextStep}
          </p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            Request-Draft: {model.preview.requestDraftId ?? "Noch kein Request-Draft"}
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
              <p className="mt-3 text-sm font-medium text-[rgb(var(--fg))]">Letzter Queue-Preview-Record</p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.statusLabel}
                {model.latestRecord.queueVersion ? ` · Version ${model.latestRecord.queueVersion}` : ""}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.persistedAt
                  ? `Gespeichert: ${model.latestRecord.persistedAt}`
                  : "Noch nicht gespeichert"}
                {model.latestRecord.persistedBy ? ` · ${model.latestRecord.persistedBy}` : ""}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                Request-Draft: {model.latestRecord.requestDraftId ?? "keiner"}
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">
              Noch kein gespeicherter Queue-Preview-Record sichtbar.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <RequirementGrid
          title="Review-Gates"
          items={model.preview.reviewRequirements}
          emptyLabel="Kein zusätzlicher Review-Hinweis sichtbar."
        />
        <RequirementGrid
          title="Provider-Gates"
          items={model.preview.providerRequirements}
          emptyLabel="Noch keine zusätzlichen Provider-Anforderungen sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <RequirementGrid
          title="Asset-Gates"
          items={model.preview.assetRequirements}
          emptyLabel="Noch keine zusätzlichen Asset-Anforderungen sichtbar."
        />
        <RequirementGrid
          title="Cost-Gates"
          items={model.preview.costRequirements}
          emptyLabel="Noch keine zusätzlichen Kosten- oder Credit-Hinweise sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <RequirementGrid
          title="Public-Safety-Hinweise"
          items={model.preview.publicSafetyRequirements}
          emptyLabel="Keine zusätzlichen Public-Safety-Hinweise sichtbar."
        />
        <RequirementGrid
          title="Runtime-Anforderungen"
          items={model.preview.estimatedRuntimeRequirements}
          emptyLabel="Noch keine Runtime-Anforderungen sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Warum die Queue disabled bleibt"
          items={model.blockedReasons}
          emptyLabel="Der Vertrag bleibt trotzdem strikt unterhalb von Queue, Worker, Provider, Datei, Kosten und Veröffentlichung."
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
