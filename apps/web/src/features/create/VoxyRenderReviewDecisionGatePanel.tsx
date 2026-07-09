import type {
  VoxyRenderReviewDecisionGateModel,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import type {
  VoxyRenderDecisionPersistencePanelModel,
} from "@/features/create/voxyRenderDecisionPersistenceContract";

type VoxyRenderReviewDecisionGatePanelProps = {
  model: VoxyRenderReviewDecisionGateModel | null;
  persistenceModel?: VoxyRenderDecisionPersistencePanelModel | null;
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

function DecisionOptionGrid(props: {
  items: VoxyRenderReviewDecisionGateModel["decisionOptions"];
  recommendedId: string;
}) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        Was müsste zuerst geprüft werden?
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {props.items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-[rgb(var(--border))] px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-[rgb(var(--fg))]">{item.label}</p>
              <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {item.enabled ? "Review-first relevant" : "Noch nicht vorrangig"}
              </span>
              {item.id === props.recommendedId ? (
                <span className="rounded-full border border-sky-300/60 bg-sky-50/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-900">
                  Empfohlen
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
              {item.userVisibleReason}
            </p>
            <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
              {item.reviewerVisibleReason}
            </p>
            <p className="mt-2 text-[11px] font-medium text-[rgb(var(--fg))]">
              Keine Ausführung: kein Renderjob, kein Providerlauf, keine Datei, keine Kosten, kein Publish.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewGateGrid(props: { items: VoxyRenderReviewDecisionGateModel["reviewGates"] }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        Review-Gates
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {props.items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-[rgb(var(--border))] px-3 py-3">
            <p className="text-sm font-medium text-[rgb(var(--fg))]">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
              {item.statusLabel} · {item.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VoxyRenderReviewDecisionGatePanel({
  model,
  persistenceModel,
  title,
  dataTestId,
}: VoxyRenderReviewDecisionGatePanelProps) {
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
          {model.rtlDecisionHint ? (
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{model.rtlDecisionHint}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip label={model.decisionStatusLabel} />
          <StatusChip label={model.publicSafeLabel} subtle />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Render-Entscheidung
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.decisionStatusLabel}</p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            `review_decision` ist nicht `execution`. `decision_ready` ist nicht `approved`.
          </p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            Auch `prepare_provider`, `prepare_assets` oder `define_cost_policy` lösen nichts aus.
          </p>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Warum weiter nichts passiert
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">
            Kein Renderjob, kein Providerlauf, keine Datei, keine Kostenbuchung, keine Veröffentlichung.
          </p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            Dieser Layer erklärt nur die nächste menschliche Review-Entscheidung.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <DecisionOptionGrid
          items={model.decisionOptions}
          recommendedId={model.recommendedDecision.id}
        />
      </div>

      <div className="mt-4">
        <ReviewGateGrid items={model.reviewGates} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Warum wird weiterhin nichts ausgeführt?"
          items={model.blockedReasons}
          emptyLabel="Kein zusätzlicher Blocker sichtbar. Der Layer bleibt trotzdem nur Entscheidungs-Vorschau."
        />
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Nächste empfohlene Entscheidung
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">
            {model.recommendedDecision.label}
          </p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.recommendedDecision.userVisibleReason}
          </p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.recommendedDecision.reviewerVisibleReason}
          </p>
          <p className="mt-3 text-sm font-medium text-[rgb(var(--fg))]">
            {model.decisionResultPreview.resultKindLabel}
          </p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            no render · no provider execution · no media creation · no cost debit · no publish
          </p>
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{model.userVisibleReason}</p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{model.reviewerVisibleReason}</p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">Nächster Schritt: {model.nextStep}</p>
        </div>
      </div>

      {persistenceModel ? (
        <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                {persistenceModel.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                {persistenceModel.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusChip label={persistenceModel.persistenceStatusLabel} />
              <StatusChip label={persistenceModel.storeStateLabel} subtle />
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--border))] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Decision-Command
              </p>
              <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">
                {persistenceModel.selectedDecisionLabel}
              </p>
              <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                {persistenceModel.userVisibleReason}
              </p>
              <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                {persistenceModel.reviewerVisibleReason}
              </p>
              <p className="mt-2 text-[11px] font-medium text-[rgb(var(--fg))]">
                Keine Ausführung: kein Renderjob, kein Providerlauf, keine Queue, keine Datei, keine Kosten, kein Publish.
              </p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Store-Grenze
              </p>
              <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">
                {persistenceModel.storeStateLabel}
              </p>
              <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                {persistenceModel.storeStateSummary}
              </p>
              <p className="mt-3 text-sm font-medium text-[rgb(var(--fg))]">
                Nächster Schritt: {persistenceModel.nextStep}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <TextList
              title="Audit-Lesart"
              items={persistenceModel.auditLines}
              emptyLabel="Noch keine Audit-Lesart sichtbar."
            />
            <div className="rounded-2xl border border-[rgb(var(--border))] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Letzter Record
              </p>
              {persistenceModel.latestRecord ? (
                <div className="mt-2 space-y-2 text-xs leading-5 text-[rgb(var(--muted))]">
                  <p className="text-sm font-medium text-[rgb(var(--fg))]">
                    {persistenceModel.latestRecord.selectedDecisionLabel}
                  </p>
                  <p>Status: {persistenceModel.latestRecord.statusLabel}</p>
                  <p>
                    Version: {persistenceModel.latestRecord.decisionVersion ?? "1"} · ID:{" "}
                    {persistenceModel.latestRecord.decisionId}
                  </p>
                  <p>
                    Zeitpunkt: {persistenceModel.latestRecord.persistedAt ?? "offen"} · Von:{" "}
                    {persistenceModel.latestRecord.persistedBy ?? "offen"}
                  </p>
                  <p>{persistenceModel.latestRecord.auditReason}</p>
                  {persistenceModel.latestRecord.reviewerNote ? (
                    <p>Notiz: {persistenceModel.latestRecord.reviewerNote}</p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                  Noch kein persistierter Decision Record sichtbar.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
