import type {
  VoxyRenderProviderSelectionDraftPanelModel,
} from "@/features/create/voxyRenderProviderSelectionDraftContract";

type VoxyRenderProviderSelectionDraftPanelProps = {
  model: VoxyRenderProviderSelectionDraftPanelModel | null;
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
          title: "Noch kein Providerlauf",
          summary: "Es wird kein Avatar-, Voice- oder Render-Provider gestartet.",
        },
        {
          title: "Keine Secrets",
          summary: "Keine Secret- oder Env-Freigaben werden gelesen oder vorausgesetzt.",
        },
        {
          title: "Keine API-Aufrufe",
          summary: "Keine HTTP- oder Provider-Calls, keine Queue und kein Worker.",
        },
        {
          title: "Keine Kosten",
          summary: "Keine Pricing-Behauptung, keine Debit-Buchung und kein Publish.",
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

export default function VoxyRenderProviderSelectionDraftPanel({
  model,
  title,
  dataTestId,
}: VoxyRenderProviderSelectionDraftPanelProps) {
  if (!model) return null;

  const candidateLines = model.preview.candidates.map(
    (candidate) => `${candidate.label}: ${candidate.statusLabel} · ${candidate.userVisibleReason}`,
  );
  const missingCapabilityLines = model.preview.candidates
    .flatMap((candidate) =>
      candidate.missingCapabilities.map(
        (capability) => `${candidate.label}: ${capability.replaceAll("_", " ")}`,
      ),
    );

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
          <StatusChip label={model.providerSelectionStatusLabel} />
          <StatusChip label={model.storeStateLabel} subtle />
        </div>
      </div>

      <GuardrailCards />

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Provider-Kandidaten"
          items={candidateLines}
          emptyLabel="Noch keine Provider-Kandidaten sichtbar."
        />
        <TextList
          title="Fehlende Fähigkeiten"
          items={missingCapabilityLines}
          emptyLabel="Keine zusätzlichen Fähigkeitslücken sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Repo-Wahrheit"
          items={model.preview.inventoryFindings}
          emptyLabel="Noch keine Repo-Wahrheit sichtbar."
        />
        <TextList
          title="Gate-Hinweise"
          items={model.preview.gateHints}
          emptyLabel="Noch keine zusätzlichen Gate-Hinweise sichtbar."
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
                Letzter Provider-Selection-Draft
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.statusLabel}
                {model.latestRecord.providerSelectionVersion
                  ? ` · Version ${model.latestRecord.providerSelectionVersion}`
                  : ""}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.persistedAt
                  ? `Gespeichert: ${model.latestRecord.persistedAt}`
                  : "Noch nicht gespeichert"}
                {model.latestRecord.persistedBy ? ` · ${model.latestRecord.persistedBy}` : ""}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                Asset-Pack: {model.latestRecord.assetPackDraftId ?? "keins"}
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">
              Noch kein gespeicherter Provider-Selection-Draft sichtbar.
            </p>
          )}
        </div>
        <TextList
          title="Blocker"
          items={model.blockedReasons}
          emptyLabel="Keine zusätzlichen Blocker sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Audit-Lesart"
          items={model.auditLines}
          emptyLabel="Noch keine Audit-Linien sichtbar."
        />
        <TextList
          title="Nächste Aktion"
          items={[model.nextStep]}
          emptyLabel="Noch keine nächste Aktion sichtbar."
        />
      </div>
    </section>
  );
}
