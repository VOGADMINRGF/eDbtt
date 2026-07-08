import type {
  PollQuestionOptionsReviewModel,
} from "@/features/create/pollQuestionOptionsReviewContract";

type PollQuestionOptionsReviewPanelProps = {
  model: PollQuestionOptionsReviewModel | null;
  title?: string;
  dataTestId?: string;
};

function StatusChip(props: { label: string; subtle?: boolean }) {
  return (
    <span
      className={
        props.subtle
          ? "rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]"
          : "rounded-full border border-sky-300/60 bg-sky-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-800"
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

function TagList(props: {
  title: string;
  items: Array<{ id: string; label: string; reason: string }>;
  emptyLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        {props.title}
      </p>
      {props.items.length > 0 ? (
        <>
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
        </>
      ) : (
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{props.emptyLabel}</p>
      )}
    </div>
  );
}

export default function PollQuestionOptionsReviewPanel({
  model,
  title,
  dataTestId,
}: PollQuestionOptionsReviewPanelProps) {
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
            Original bleibt erhalten. Übersetzung ist Lesehilfe und kein Beleg.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip label={model.pollStatusLabel} />
          <StatusChip label={model.publicSafeLabel} subtle />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Frage-Typ
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.questionTypeLabel}</p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.questionConfidenceLabel} · Vorschlag, kein Poll
          </p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{model.questionReason}</p>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Scope
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.participationScopeLabel}</p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Zielgruppen: {model.targetGroups.length > 0 ? model.targetGroups.join(", ") : "noch offen"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Vorgeschlagene Frage
        </p>
        <p className="mt-2 text-sm font-medium leading-6 text-[rgb(var(--fg))]">
          {model.proposedQuestion ?? "Noch keine belastbare Poll-Frage sichtbar."}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Mögliche Antwortoptionen
        </p>
        {model.optionItems.length > 0 ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {model.optionItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[rgb(var(--border))] px-3 py-3">
                <p className="text-sm font-medium text-[rgb(var(--fg))]">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{item.optionTypeLabel}</p>
                {item.biasRisk ? (
                  <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{item.biasRisk}</p>
                ) : null}
                {item.sourceNeed ? (
                  <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{item.sourceNeed}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Noch keine belastbaren Antwortoptionen sichtbar.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Was noch fehlt"
          items={model.missingOptionNeeds}
          emptyLabel="Keine zusätzlichen Optionslücken sichtbar, Review bleibt trotzdem Pflicht."
        />
        <TextList
          title="Blocker"
          items={model.reviewBlockers}
          emptyLabel="Kein zusätzlicher Blocker sichtbar, Review bleibt trotzdem Pflicht."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TagList
          title="Bias- & Review-Hinweise"
          items={model.biasReviewNeeds}
          emptyLabel="Noch keine zusätzlichen Bias-Hinweise sichtbar."
        />
        <TagList
          title="Eligibility-Signale"
          items={model.eligibilitySignals}
          emptyLabel="Noch keine zusätzlichen Poll-Signale sichtbar."
        />
      </div>

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Downstream Readiness
        </p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {model.downstreamReadiness.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[rgb(var(--border))] px-3 py-3">
              <p className="text-sm font-medium text-[rgb(var(--fg))]">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {item.statusLabel} · {item.reason}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Nächste Poll-Entscheidung
        </p>
        <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.nextPollDecision.label}</p>
        <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
          {model.nextPollDecision.reason}
        </p>
        <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{model.userVisibleReason}</p>
        <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{model.reviewerVisibleReason}</p>
        <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">Nächster Schritt: {model.nextStep}</p>
      </div>
    </section>
  );
}
