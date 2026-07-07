import type { DossierWorkspaceDecisionModel } from "@/features/create/dossierWorkspaceDecisionContract";

type DossierWorkspaceDecisionPanelProps = {
  model: DossierWorkspaceDecisionModel | null;
  title?: string;
  dataTestId?: string;
};

function SectionList(props: { title: string; items: string[]; emptyLabel?: string }) {
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
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
          {props.emptyLabel ?? "Noch kein zusätzlicher Eintrag sichtbar."}
        </p>
      )}
    </div>
  );
}

export default function DossierWorkspaceDecisionPanel({
  model,
  title,
  dataTestId,
}: DossierWorkspaceDecisionPanelProps) {
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
            Übersetzung bleibt getrennte Lesefassung und ist kein Beleg.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-amber-300/60 bg-amber-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
            {model.workspaceStatusLabel}
          </span>
          <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            {model.publicSafeLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            These / Kernposition
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.thesis.label}</p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.thesis.confidenceLabel} · Review erforderlich
          </p>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Gegenposition
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.counterposition.statusLabel}</p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{model.counterposition.summary}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Claims
        </p>
        {model.claimItems.length > 0 ? (
          <div className="mt-2 space-y-3">
            {model.claimItems.map((claim) => (
              <div key={claim.id}>
                <p className="text-sm font-medium text-[rgb(var(--fg))]">{claim.text}</p>
                <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                  {claim.claimTypeLabel} · {claim.reviewNeed}
                </p>
                {claim.sourceNeed ? (
                  <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                    Quellenbedarf: {claim.sourceNeed}
                  </p>
                ) : null}
                {claim.factcheckQuestion ? (
                  <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                    Factcheck-Frage: {claim.factcheckQuestion}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Noch keine belastbaren Claim-Items sichtbar.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <SectionList
          title="Offene Fragen"
          items={model.openQuestions}
          emptyLabel="Noch keine offene Dossier-Frage sichtbar."
        />
        <SectionList
          title="Quellenbedarf"
          items={model.sourceNeeds}
          emptyLabel="Kein zusätzlicher Quellenbedarf sichtbar."
        />
        <SectionList
          title="Factcheck-Fragen"
          items={model.factcheckQuestions}
          emptyLabel="Noch keine vorbereitete Factcheck-Frage sichtbar."
        />
        <SectionList
          title="Betroffenengruppen"
          items={model.affectedGroups}
          emptyLabel="Noch keine zusätzliche Betroffenengruppe sichtbar."
        />
        <SectionList
          title="Gemeinwohlkonflikte"
          items={model.commonGoodTensions}
          emptyLabel="Noch kein zusätzlicher Gemeinwohlkonflikt sichtbar."
        />
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Referenzräume
          </p>
          {model.referenceScopes.length > 0 ? (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-2">
                {model.referenceScopes.map((scope) => (
                  <span
                    key={scope.id}
                    className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs font-medium text-[rgb(var(--fg))]"
                  >
                    {scope.label}
                  </span>
                ))}
              </div>
              {model.referenceScopes.slice(0, 3).map((scope) => (
                <p key={`${scope.id}-reason`} className="text-xs leading-5 text-[rgb(var(--muted))]">
                  {scope.reason}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
              Noch kein klarer Referenzraum sichtbar.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Human-Loop-Bedarf
        </p>
        {model.humanLoopNeeds.length > 0 ? (
          <div className="mt-2 space-y-1 text-sm leading-6 text-[rgb(var(--muted))]">
            {model.humanLoopNeeds.map((item) => (
              <p key={`human-loop-${item}`}>{item}</p>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Keine zusätzliche Human-Loop-Frage offen.
          </p>
        )}
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
          Nächste Entscheidung
        </p>
        <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.nextDecision.label}</p>
        <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{model.nextDecision.reason}</p>
        <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{model.userVisibleReason}</p>
        <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{model.reviewerVisibleReason}</p>
        <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">Nächster Schritt: {model.nextStep}</p>
      </div>
    </section>
  );
}
