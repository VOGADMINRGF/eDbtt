"use client";

import type { DossierWorkspaceModel } from "./workspaceModel";

export type DossierFocusTarget = {
  type: "claim" | "source" | "question" | "option" | "perspective";
  id: string;
};

type Props = {
  model: DossierWorkspaceModel;
  focusTarget: DossierFocusTarget | null;
  onNavigate: (mode: "overview" | "positions" | "sources" | "questions", target: DossierFocusTarget) => void;
  focusId: (target: DossierFocusTarget) => string;
};

function Branch({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <h4 className="text-sm font-semibold text-[rgb(var(--fg))]">{title}</h4>
      {children ? (
        <div className="mt-3 space-y-2">{children}</div>
      ) : (
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{empty}</p>
      )}
    </div>
  );
}

function BranchButton({
  children,
  onClick,
  id,
}: {
  children: React.ReactNode;
  onClick: () => void;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className="block min-h-11 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-start text-sm leading-5 text-[rgb(var(--fg))] hover:border-[rgb(var(--grad-from))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))]"
    >
      {children}
    </button>
  );
}

export function DossierConnections({
  model,
  focusTarget,
  onNavigate,
  focusId,
}: Props) {
  if (!model.graphAvailable) {
    return (
      <section
        aria-labelledby="dossier-connections-heading"
        className="rounded-3xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5"
      >
        <h3 id="dossier-connections-heading" className="text-lg font-semibold text-[rgb(var(--fg))]">
          Zusammenhänge
        </h3>
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
          Für diesen Dossierstand sind noch keine belastbaren Beziehungen zwischen Aussagen,
          Quellen, Fragen oder Optionen hinterlegt. Es werden keine Beziehungen ergänzt oder
          geschätzt.
        </p>
      </section>
    );
  }

  const focusedClaimId =
    focusTarget?.type === "claim"
      ? focusTarget.id
      : focusTarget?.type === "source"
        ? model.claims.find((claim) =>
            claim.sourceLinks.some((link) => link.sourceId === focusTarget.id),
          )?.id
        : focusTarget?.type === "question"
          ? model.questions.find((question) => question.id === focusTarget.id)?.claimIds[0]
          : focusTarget?.type === "option"
            ? model.options.find((option) => option.id === focusTarget.id)?.claimIds[0]
            : focusTarget?.type === "perspective"
              ? model.perspectives.find((item) => item.id === focusTarget.id)?.claimIds[0]
              : null;
  const selectedClaim =
    model.claims.find((claim) => claim.id === focusedClaimId) ??
    model.claims.find(
      (claim) =>
        claim.sourceLinks.length > 0 ||
        claim.questionIds.length > 0 ||
        claim.optionIds.length > 0 ||
        claim.opposingClaimIds.length > 0 ||
        claim.missingPerspectiveIds.length > 0,
    ) ??
    model.claims[0] ??
    null;
  const selectedSources = selectedClaim
    ? selectedClaim.sourceLinks
        .map((link) => ({
          link,
          source: model.sources.find((source) => source.id === link.sourceId),
        }))
        .filter((item): item is typeof item & { source: NonNullable<typeof item.source> } =>
          Boolean(item.source),
        )
    : [];
  const selectedQuestions = selectedClaim
    ? selectedClaim.questionIds
        .map((id) => model.questions.find((question) => question.id === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];
  const selectedOptions = selectedClaim
    ? selectedClaim.optionIds
        .map((id) => model.options.find((option) => option.id === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];
  const selectedOppositions = selectedClaim
    ? selectedClaim.opposingClaimIds
        .map((id) => model.claims.find((claim) => claim.id === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];
  const selectedPerspectives =
    focusTarget?.type === "perspective"
      ? model.perspectives.filter((item) => item.id === focusTarget.id)
      : selectedClaim
        ? selectedClaim.missingPerspectiveIds
            .map((id) => model.perspectives.find((item) => item.id === id))
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
        : model.perspectives;

  return (
    <section
      aria-labelledby="dossier-connections-heading"
      className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5"
    >
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Nachvollziehbarkeit
        </p>
        <h3 id="dossier-connections-heading" className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">
          Zusammenhänge
        </h3>
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
          Die Ansicht übersetzt die vorhandenen Beziehungen in lesbare Äste. Eine Auswahl führt
          zum zugrunde liegenden Arbeitsobjekt.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Kernfrage
        </p>
        <p className="mt-2 text-base font-semibold leading-7 text-[rgb(var(--fg))]">
          {model.coreQuestion}
        </p>
      </div>

      {model.claims.length ? (
        <div className="mt-5">
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">
            Kernaussagen – eine Aussage wählen
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {model.claims.slice(0, 8).map((claim) => (
              <BranchButton
                key={claim.id}
                onClick={() => onNavigate("overview", { type: "claim", id: claim.id })}
              >
                <span className="font-semibold">{claim.title}</span>
                <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
                  {claim.sourceLinks.length} Quellenbezug
                  {claim.sourceLinks.length === 1 ? "" : "e"} · {claim.questionIds.length} Frage
                  {claim.questionIds.length === 1 ? "" : "n"} · {claim.optionIds.length} Option
                  {claim.optionIds.length === 1 ? "" : "en"}
                </span>
              </BranchButton>
            ))}
          </div>
        </div>
      ) : null}

      {selectedClaim ? (
        <div className="mt-5">
          <p className="text-sm text-[rgb(var(--muted))]">
            Ausgewählter Ast: <strong className="text-[rgb(var(--fg))]">{selectedClaim.title}</strong>
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Branch
              title="Quellenbezüge"
              empty="Keine Quelle ist dieser Aussage direkt zugeordnet."
            >
              {selectedSources.length
                ? selectedSources.map(({ link, source }) => (
                    <BranchButton
                      key={`${source.id}-${link.relation}`}
                      id={focusId({ type: "source", id: source.id })}
                      onClick={() => onNavigate("sources", { type: "source", id: source.id })}
                    >
                      <span className="font-semibold">{source.title}</span>
                      <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
                        {link.relation === "supports"
                          ? "Stützt diese Aussage"
                          : link.relation === "contradicts"
                            ? "Widerspricht dieser Aussage"
                            : link.relation === "mentions"
                              ? "Ordnet diese Aussage ein"
                              : "Bezug ist noch ungeklärt"}
                      </span>
                    </BranchButton>
                  ))
                : undefined}
            </Branch>
            <Branch
              title="Offene Fragen"
              empty="Keine Frage ist dieser Aussage direkt zugeordnet."
            >
              {selectedQuestions.length
                ? selectedQuestions.map((question) => (
                    <BranchButton
                      key={question.id}
                      id={focusId({ type: "question", id: question.id })}
                      onClick={() => onNavigate("questions", { type: "question", id: question.id })}
                    >
                      <span className="font-semibold">{question.text}</span>
                      <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
                        {question.statusLabel}
                      </span>
                    </BranchButton>
                  ))
                : undefined}
            </Branch>
            <Branch
              title="Entscheidungsoptionen"
              empty="Keine Option ist von dieser Aussage abhängig."
            >
              {selectedOptions.length
                ? selectedOptions.map((option) => (
                    <BranchButton
                      key={option.id}
                      id={focusId({ type: "option", id: option.id })}
                      onClick={() => onNavigate("overview", { type: "option", id: option.id })}
                    >
                      {option.label}
                    </BranchButton>
                  ))
                : undefined}
            </Branch>
            <Branch
              title="Gegenpositionen"
              empty="Keine ausdrückliche Gegenposition ist verknüpft."
            >
              {selectedOppositions.length
                ? selectedOppositions.map((claim) => (
                    <BranchButton
                      key={claim.id}
                      onClick={() => onNavigate("positions", { type: "claim", id: claim.id })}
                    >
                      {claim.title}
                    </BranchButton>
                  ))
                : undefined}
            </Branch>
            <Branch
              title="Fehlende Perspektiven"
              empty="Keine fehlende Perspektive ist diesem Ast direkt zugeordnet."
            >
              {selectedPerspectives.length
                ? selectedPerspectives.map((perspective) => (
                    <BranchButton
                      key={perspective.id}
                      id={focusId({ type: "perspective", id: perspective.id })}
                      onClick={() =>
                        onNavigate("overview", { type: "perspective", id: perspective.id })
                      }
                    >
                      <span className="font-semibold">{perspective.label}</span>
                      {perspective.dimension ? (
                        <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
                          Fachbezug: {perspective.dimension}
                        </span>
                      ) : null}
                    </BranchButton>
                  ))
                : undefined}
            </Branch>
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-[rgb(var(--muted))]">
          Beziehungen sind vorhanden, aber noch keiner öffentlichen Kernaussage zugeordnet.
        </p>
      )}
    </section>
  );
}

export default DossierConnections;
