import type { SourceFactcheckFeedEnrichmentModel } from "@/features/create/sourceFactcheckFeedEnrichmentContract";

type SourceFactcheckFeedEnrichmentPanelProps = {
  model: SourceFactcheckFeedEnrichmentModel | null;
  title?: string;
  dataTestId?: string;
};

function StatusChip(props: { label: string }) {
  return (
    <span className="rounded-full border border-amber-300/60 bg-amber-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
      {props.label}
    </span>
  );
}

function NeedList(props: { title: string; items: Array<{ id: string; label: string; reason: string }> }) {
  if (props.items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        {props.title}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {props.items.map((item) => (
          <span
            key={`${props.title}-${item.id}`}
            className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs font-medium text-[rgb(var(--fg))]"
            title={item.reason}
          >
            {item.label}
          </span>
        ))}
      </div>
      <div className="mt-3 space-y-1">
        {props.items.slice(0, 3).map((item) => (
          <p key={`${props.title}-reason-${item.id}`} className="text-xs leading-5 text-[rgb(var(--muted))]">
            {item.reason}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function SourceFactcheckFeedEnrichmentPanel({
  model,
  title,
  dataTestId,
}: SourceFactcheckFeedEnrichmentPanelProps) {
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
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{model.languageLabel}</p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.translationAvailable
              ? "Übersetzung bleibt getrennte Lesefassung und ist kein Beleg."
              : "Originalsprache bleibt maßgeblich; es wird keine Ersatzquelle behauptet."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip label={model.statusLabel} />
          <StatusChip label={model.publicSafeLabel} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <NeedList title="Quellenbedarf" items={model.sourceNeeds} />
        <NeedList title="Claim-Prüfbedarf" items={model.claimReviewNeeds} />
        <NeedList title="Vergleichsräume" items={model.referenceScopes} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Faktencheck-Fragen
          </p>
          {model.factcheckQuestions.length > 0 ? (
            <div className="mt-2 space-y-2">
              {model.factcheckQuestions.map((question) => (
                <div key={question.id}>
                  <p className="text-sm font-medium text-[rgb(var(--fg))]">{question.question}</p>
                  <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{question.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
              Noch keine zusätzliche Faktencheck-Frage vorbereitet.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Feed- und Research-Hinweise
          </p>
          <div className="mt-2 space-y-2">
            {model.feedHints.map((hint) => (
              <div key={hint.id}>
                <p className="text-sm font-medium text-[rgb(var(--fg))]">
                  {hint.label}
                  {hint.blockerLabel ? ` · ${hint.blockerLabel}` : ""}
                </p>
                <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{hint.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {model.counterpositionNeeds.length > 0 ||
      model.affectedGroupEvidenceNeeds.length > 0 ||
      model.commonGoodEvidenceNeeds.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Offene Ergänzungen
          </p>
          <div className="mt-2 space-y-1 text-sm leading-6 text-[rgb(var(--muted))]">
            {model.counterpositionNeeds.map((line) => (
              <p key={`counter-${line}`}>{line}</p>
            ))}
            {model.affectedGroupEvidenceNeeds.map((line) => (
              <p key={`groups-${line}`}>{line}</p>
            ))}
            {model.commonGoodEvidenceNeeds.map((line) => (
              <p key={`common-good-${line}`}>{line}</p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Guardrails
        </p>
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{model.userVisibleReason}</p>
        <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{model.reviewerVisibleReason}</p>
        <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">Nächster Schritt: {model.nextStep}</p>
      </div>
    </section>
  );
}
