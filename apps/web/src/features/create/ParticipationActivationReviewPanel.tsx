import type {
  ParticipationActivationReviewModel,
} from "@/features/create/participationActivationReviewContract";

type ParticipationActivationReviewPanelProps = {
  model: ParticipationActivationReviewModel | null;
  title?: string;
  dataTestId?: string;
};

function StatusChip(props: { label: string; subtle?: boolean }) {
  return (
    <span
      className={
        props.subtle
          ? "rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]"
          : "rounded-full border border-amber-300/60 bg-amber-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800"
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

export default function ParticipationActivationReviewPanel({
  model,
  title,
  dataTestId,
}: ParticipationActivationReviewPanelProps) {
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
          <StatusChip label={model.activationStatusLabel} />
          <StatusChip label={model.publicSafeLabel} subtle />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Vorgeschlagenes Beteiligungsformat
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.suggestedFormatLabel}</p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.formatConfidenceLabel} · Vorschlag, keine Entscheidung
          </p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{model.formatReason}</p>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Scope
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.participationScopeLabel}</p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            {model.participationScopeReason}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Vorgeschlagene Beteiligungsfrage
        </p>
        <p className="mt-2 text-sm font-medium leading-6 text-[rgb(var(--fg))]">
          {model.proposedParticipationQuestion ?? "Noch keine belastbare Beteiligungsfrage sichtbar."}
        </p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Zielgruppen"
          items={model.targetGroups}
          emptyLabel="Zielgruppen sollten vor Aktivierung noch klarer benannt werden."
        />
        <TextList
          title="Stakeholder"
          items={model.stakeholderGroups}
          emptyLabel="Stakeholder-Mapping bleibt vor Aktivierung noch offen."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TagList
          title="Readiness-Signale"
          items={model.readinessSignals}
          emptyLabel="Noch keine zusätzlichen Readiness-Signale sichtbar."
        />
        <TagList
          title="Risiken"
          items={model.riskFlags}
          emptyLabel="Noch keine zusätzlichen Risikohinweise sichtbar."
        />
      </div>

      <TextList
        title="Blocker"
        items={model.blockers}
        emptyLabel="Kein zusätzlicher Blocker sichtbar, Review bleibt trotzdem Pflicht."
      />

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
          Nächste Aktivierungsentscheidung
        </p>
        <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">
          {model.nextActivationDecision.label}
        </p>
        <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
          {model.nextActivationDecision.reason}
        </p>
        <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{model.userVisibleReason}</p>
        <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{model.reviewerVisibleReason}</p>
        <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">Nächster Schritt: {model.nextStep}</p>
      </div>
    </section>
  );
}
