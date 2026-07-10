import type {
  VoxyRenderCostCreditPolicyPanelModel,
} from "@/features/create/voxyRenderCostCreditPolicyContract";

type VoxyRenderCostCreditPolicyPanelProps = {
  model: VoxyRenderCostCreditPolicyPanelModel | null;
  title?: string;
  dataTestId?: string;
};

function StatusChip(props: { label: string; subtle?: boolean }) {
  return (
    <span
      className={
        props.subtle
          ? "rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]"
          : "rounded-full border border-sky-300/60 bg-sky-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-900"
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
          title: "Noch keine Buchung",
          summary: "Kein Cost-Debit, keine Invoice und kein Payment-Write werden ausgelöst.",
        },
        {
          title: "Keine Credit-Abbuchung",
          summary: "Credits werden weder gelesen noch abgezogen, wenn dafür keine sichere Wahrheit existiert.",
        },
        {
          title: "Keine Providerkosten behauptet",
          summary: "Ohne belastbare Preisquelle bleibt jeder Betrag bewusst leer.",
        },
        {
          title: "Keine Queue-Ausführung",
          summary: "Kein Queue-Job, kein Worker, kein Providerlauf, kein Upload und kein Publish.",
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

function PolicyStatusCard(props: {
  title: string;
  label: string;
  summary: string;
  detail?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        {props.title}
      </p>
      <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{props.label}</p>
      <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{props.summary}</p>
      {props.detail ? (
        <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{props.detail}</p>
      ) : null}
    </div>
  );
}

export default function VoxyRenderCostCreditPolicyPanel({
  model,
  title,
  dataTestId,
}: VoxyRenderCostCreditPolicyPanelProps) {
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
          <StatusChip label={model.policyStatusLabel} />
          <StatusChip label={model.storeStateLabel} subtle />
        </div>
      </div>

      <GuardrailCards />

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <PolicyStatusCard
          title="Kosten-Policy"
          label={model.costStatusLabel}
          summary={model.preview.providerPricingLabel}
          detail={
            model.preview.estimatedCostAmount !== null && model.preview.currency
              ? `${model.preview.estimatedCostAmount} ${model.preview.currency} wären nur Readmodel-Hinweis und keine Buchung.`
              : "Kein Betrag wird behauptet, solange keine belastbare Preisquelle existiert."
          }
        />
        <PolicyStatusCard
          title="Credit-Policy"
          label={model.creditStatusLabel}
          summary={model.preview.accountContext.label}
          detail={
            model.preview.creditsRequired !== null || model.preview.creditsAvailable !== null
              ? `Erforderlich: ${model.preview.creditsRequired ?? "offen"} · Verfügbar: ${model.preview.creditsAvailable ?? "offen"}`
              : "Keine Credits werden behauptet oder abgezogen."
          }
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <PolicyStatusCard
          title="Limit-Policy"
          label={model.limitStatusLabel}
          summary={model.preview.runtimeMeteringLabel}
          detail={
            [
              model.preview.perAccountLimit !== null
                ? `pro Account ${model.preview.perAccountLimit}`
                : null,
              model.preview.perDayLimit !== null ? `pro Tag ${model.preview.perDayLimit}` : null,
              model.preview.perDossierLimit !== null
                ? `pro Dossier ${model.preview.perDossierLimit}`
                : null,
              model.preview.perProviderLimit !== null
                ? `pro Provider ${model.preview.perProviderLimit}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Keine Live-Limits werden behauptet."
          }
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
                Letzter Policy-Preview-Record
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.statusLabel}
                {model.latestRecord.policyVersion
                  ? ` · Version ${model.latestRecord.policyVersion}`
                  : ""}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.persistedAt
                  ? `Gespeichert: ${model.latestRecord.persistedAt}`
                  : "Noch nicht gespeichert"}
                {model.latestRecord.persistedBy ? ` · ${model.latestRecord.persistedBy}` : ""}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                Queue-Preview: {model.latestRecord.queuePreviewId ?? "keines"}
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">
              Noch kein gespeicherter Cost-/Credit-Policy-Record sichtbar.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Blocker"
          items={model.blockedReasons}
          emptyLabel="Keine zusätzlichen Blocker sichtbar."
        />
        <TextList
          title="Policy-Evidence"
          items={model.evidenceLines}
          emptyLabel="Noch keine Evidence-Linien sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Audit-Lesart"
          items={model.auditLines}
          emptyLabel="Noch keine Audit-Linien sichtbar."
        />
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Nächste Aktion
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.nextStep}</p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            Dieser Schritt ist rein review-first und erzeugt weder Billing noch Render-Lauf.
          </p>
        </div>
      </div>
    </section>
  );
}
