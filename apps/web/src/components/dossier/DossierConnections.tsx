"use client";

import { useEffect } from "react";
import type { DossierWorkspaceModel } from "./workspaceModel";

export type DossierFocusTarget = {
  type: "claim" | "source" | "question" | "option" | "perspective";
  id: string;
};

type Props = {
  model: DossierWorkspaceModel;
  focusTarget: DossierFocusTarget | null;
  selectedClaimId: string | null;
  onSelectClaim: (claimId: string) => void;
  onNavigate: (mode: "overview" | "positions" | "sources" | "questions", target: DossierFocusTarget) => void;
  focusId: (target: DossierFocusTarget) => string;
};

type RelationshipTone =
  | "positive"
  | "warning"
  | "info"
  | "question"
  | "participation"
  | "danger";

const RELATIONSHIP_TONE_CLASSES: Record<RelationshipTone, string> = {
  positive:
    "border-emerald-400 bg-emerald-50/70 dark:border-emerald-600 dark:bg-emerald-950/30",
  warning:
    "border-amber-400 bg-amber-50/70 dark:border-amber-600 dark:bg-amber-950/30",
  info: "border-blue-400 bg-blue-50/70 dark:border-blue-600 dark:bg-blue-950/30",
  question:
    "border-violet-400 bg-violet-50/70 dark:border-violet-600 dark:bg-violet-950/30",
  participation:
    "border-teal-400 bg-teal-50/70 dark:border-teal-600 dark:bg-teal-950/30",
  danger: "border-red-400 bg-red-50/70 dark:border-red-600 dark:bg-red-950/30",
};

const RELATIONSHIP_MARKERS: Record<RelationshipTone, string> = {
  positive: "✓",
  warning: "!",
  info: "i",
  question: "?",
  participation: "→",
  danger: "!",
};

function RelationshipLane({
  title,
  description,
  empty,
  tone,
  children,
}: {
  title: string;
  description: string;
  empty: string;
  tone: RelationshipTone;
  children?: React.ReactNode;
}) {
  return (
    <section
      data-semantic-tone={tone}
      className={`relative border-s-2 ps-5 transition-[border-color,background-color] duration-150 motion-reduce:transition-none ${RELATIONSHIP_TONE_CLASSES[tone]}`}
    >
      <span
        aria-hidden="true"
        className="absolute -start-[11px] top-4 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-[rgb(var(--card))] bg-[rgb(var(--card))] text-[10px] font-bold text-[rgb(var(--fg))]"
      >
        {RELATIONSHIP_MARKERS[tone]}
      </span>
      <div className="rounded-e-2xl border border-s-0 border-current/30 bg-[rgb(var(--card))]/75 p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--fg))]">
          <span aria-hidden="true">{RELATIONSHIP_MARKERS[tone]}</span>
          {title}
        </h4>
        <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{description}</p>
        {children ? (
          <div className="mt-3 grid gap-2 lg:grid-cols-2">{children}</div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{empty}</p>
        )}
      </div>
    </section>
  );
}

function BranchButton({
  children,
  onClick,
  id,
  pressed,
  dimmed = false,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  id?: string;
  pressed?: boolean;
  dimmed?: boolean;
  tone?: RelationshipTone;
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      data-related={pressed ? "selected" : dimmed ? "unrelated" : "related"}
      data-semantic-tone={tone}
      className={`block min-h-11 w-full scroll-mt-36 rounded-xl border px-3 py-2 text-start text-sm leading-5 text-[rgb(var(--fg))] transition-[opacity,border-color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] motion-reduce:transition-none ${
        pressed
          ? "border-[rgb(var(--fg))] bg-[rgb(var(--card))] shadow-sm"
          : tone
            ? RELATIONSHIP_TONE_CLASSES[tone]
            : "border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:border-[rgb(var(--grad-from))]"
      } ${
        dimmed
          ? "opacity-60 hover:opacity-100 focus-visible:opacity-100"
          : "opacity-100"
      }`}
    >
      {children}
    </button>
  );
}

export function DossierConnections({
  model,
  focusTarget,
  selectedClaimId,
  onSelectClaim,
  onNavigate,
  focusId,
}: Props) {
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
  const defaultClaimId =
    model.claims.find(
      (claim) =>
        claim.sourceLinks.length > 0 ||
        claim.questionIds.length > 0 ||
        claim.optionIds.length > 0 ||
        claim.opposingClaimIds.length > 0 ||
        claim.missingPerspectiveIds.length > 0,
    )?.id ??
    model.claims[0]?.id ??
    null;
  useEffect(() => {
    if (focusedClaimId) {
      onSelectClaim(focusedClaimId);
      return;
    }
    if (!model.claims.some((claim) => claim.id === selectedClaimId)) {
      if (defaultClaimId) onSelectClaim(defaultClaimId);
    }
  }, [defaultClaimId, focusedClaimId, model.claims, onSelectClaim, selectedClaimId]);

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

  const selectedClaim =
    model.claims.find((claim) => claim.id === selectedClaimId) ?? null;
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
  const selectedSourceIds = new Set(selectedSources.map(({ source }) => source.id));
  const relationshipSources = [
    ...selectedSources.map(({ link, source }) => ({
      link,
      source,
      related: true,
      contextClaimTitle: selectedClaim?.title ?? null,
    })),
    ...model.sources
      .filter(
        (source) =>
          !selectedSourceIds.has(source.id) && source.claimLinks.length > 0,
      )
      .map((source) => ({
        link: source.claimLinks[0],
        source,
        related: false,
        contextClaimTitle: source.claimLinks[0]?.claimTitle ?? null,
      })),
  ];
  const selectedQuestions = selectedClaim
    ? selectedClaim.questionIds
        .map((id) => model.questions.find((question) => question.id === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];
  const selectedQuestionIds = new Set(selectedQuestions.map((question) => question.id));
  const relationshipQuestions = [
    ...selectedQuestions.map((question) => ({ question, related: true })),
    ...model.questions
      .filter((question) => !selectedQuestionIds.has(question.id))
      .map((question) => ({ question, related: false })),
  ];
  const selectedOptions = selectedClaim
    ? selectedClaim.optionIds
        .map((id) => model.options.find((option) => option.id === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];
  const selectedOptionIds = new Set(selectedOptions.map((option) => option.id));
  const relationshipOptions = [
    ...selectedOptions.map((option) => ({ option, related: true })),
    ...model.options
      .filter((option) => !selectedOptionIds.has(option.id))
      .map((option) => ({ option, related: false })),
  ];
  const selectedOppositions = selectedClaim
    ? selectedClaim.opposingClaimIds
        .map((id) => model.claims.find((claim) => claim.id === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];
  const selectedOppositionIds = new Set(
    selectedOppositions.map((claim) => claim.id),
  );
  const relationshipOppositions = [
    ...selectedOppositions.map((claim) => ({ claim, related: true })),
    ...model.claims
      .filter(
        (claim) =>
          claim.id !== selectedClaim?.id &&
          !selectedOppositionIds.has(claim.id) &&
          model.claims.some((candidate) =>
            candidate.opposingClaimIds.includes(claim.id),
          ),
      )
      .map((claim) => ({ claim, related: false })),
  ];
  const selectedPerspectives =
    focusTarget?.type === "perspective"
      ? model.perspectives.filter((item) => item.id === focusTarget.id)
      : selectedClaim
        ? selectedClaim.missingPerspectiveIds
            .map((id) => model.perspectives.find((item) => item.id === id))
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
        : model.perspectives;
  const selectedPerspectiveIds = new Set(
    selectedPerspectives.map((perspective) => perspective.id),
  );
  const relationshipPerspectives = [
    ...selectedPerspectives.map((perspective) => ({
      perspective,
      related: true,
    })),
    ...model.perspectives
      .filter((perspective) => !selectedPerspectiveIds.has(perspective.id))
      .map((perspective) => ({ perspective, related: false })),
  ];

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

      <p className="sr-only" role="status" aria-live="polite">
        {selectedClaim
          ? `Aussage ausgewählt: ${selectedClaim.title}. Zugehörige Quellen, Fragen, Optionen, Gegenpositionen und Perspektiven sind hervorgehoben.`
          : "Keine Aussage ausgewählt."}
      </p>

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
                pressed={claim.id === selectedClaim?.id}
                dimmed={Boolean(selectedClaim && claim.id !== selectedClaim.id)}
                onClick={() => onSelectClaim(claim.id)}
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
        <div className="mt-6" aria-label={`Beziehungspfad zu ${selectedClaim.title}`}>
          <div className="rounded-2xl border-2 border-[rgb(var(--fg))] bg-[rgb(var(--card))] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              Ausgewählte Aussage
            </p>
            <p className="mt-2 text-base font-semibold leading-7 text-[rgb(var(--fg))]">
              {selectedClaim.title}
            </p>
            <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
              Die folgenden Abschnitte zeigen ausschließlich dokumentierte Beziehungen dieser
              Aussage.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <RelationshipLane
              tone="info"
              title="Quellen zur Aussage"
              description="Der Beziehungstext zeigt, ob eine Quelle stützt, widerspricht, einordnet oder noch ungeklärt ist."
              empty="Keine Quelle ist dieser Aussage direkt zugeordnet."
            >
              {relationshipSources.length
                ? relationshipSources.map(({ link, source, related, contextClaimTitle }) => (
                    <BranchButton
                      key={`${source.id}-${link.relation}`}
                      dimmed={!related}
                      tone={
                        link.relation === "supports"
                          ? "positive"
                          : link.relation === "contradicts"
                            ? "danger"
                            : link.relation === "mentions"
                              ? "info"
                              : "warning"
                      }
                      onClick={() => onNavigate("sources", { type: "source", id: source.id })}
                    >
                      <span className="font-semibold">{source.title}</span>
                      <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
                        {related
                          ? link.relation === "supports"
                            ? "Stützt diese Aussage"
                            : link.relation === "contradicts"
                              ? "Widerspricht dieser Aussage"
                              : link.relation === "mentions"
                                ? "Ordnet diese Aussage ein"
                                : "Bezug ist noch ungeklärt"
                          : `Anderer Aussagebezug: ${contextClaimTitle ?? "Aussage"} · ${link.relationLabel}`}
                      </span>
                    </BranchButton>
                  ))
                : undefined}
            </RelationshipLane>

            <RelationshipLane
              tone="question"
              title="Fragen aus dieser Aussage"
              description="Offene Annahmen führen in den Fragenbereich; betroffene Optionen bleiben direkt sichtbar."
              empty="Keine Frage ist dieser Aussage direkt zugeordnet."
            >
              {relationshipQuestions.length
                ? relationshipQuestions.map(({ question, related }) => {
                    const affectedOptions = question.optionIds
                      .map((optionId) =>
                        model.options.find((option) => option.id === optionId),
                      )
                      .filter((option): option is NonNullable<typeof option> => Boolean(option));
                    return (
                      <BranchButton
                        key={question.id}
                        dimmed={!related}
                        tone="question"
                        id={focusId({ type: "question", id: question.id })}
                        onClick={() =>
                          onNavigate("questions", { type: "question", id: question.id })
                        }
                      >
                        <span className="font-semibold">{question.text}</span>
                        <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
                          {question.statusLabel}
                          {!related ? " · nicht dieser Aussage zugeordnet" : ""}
                        </span>
                        {affectedOptions.length ? (
                          <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
                            Betrifft: {affectedOptions.map((option) => option.label).join(", ")}
                          </span>
                        ) : null}
                      </BranchButton>
                    );
                  })
                : undefined}
            </RelationshipLane>

            <RelationshipLane
              tone="participation"
              title="Betroffene Entscheidungsoptionen"
              description="Die Hinweise benennen, ob eine dokumentierte offene Frage die Grundlage einer Option berührt."
              empty="Keine Option ist von dieser Aussage abhängig."
            >
              {relationshipOptions.length
                ? relationshipOptions.map(({ option, related }) => {
                    const affectingQuestions = model.questions.filter((question) =>
                      question.optionIds.includes(option.id),
                    );
                    return (
                      <BranchButton
                        key={option.id}
                        dimmed={!related}
                        tone="participation"
                        id={focusId({ type: "option", id: option.id })}
                        onClick={() =>
                          onNavigate("overview", { type: "option", id: option.id })
                        }
                      >
                        <span className="font-semibold">{option.label}</span>
                        <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
                          {affectingQuestions.length
                            ? `${affectingQuestions.length} offene ${
                                affectingQuestions.length === 1 ? "Grundlage" : "Grundlagen"
                              } verknüpft`
                            : "Keine offene Frage direkt verknüpft"}
                          {!related ? " · nicht dieser Aussage zugeordnet" : ""}
                        </span>
                      </BranchButton>
                    );
                  })
                : undefined}
            </RelationshipLane>

            <RelationshipLane
              tone="danger"
              title="Widerspruch und Einschränkungen"
              description="Gegenpositionen und fehlende Perspektiven begrenzen die Aussage, ohne ihren Status zu vermischen."
              empty="Keine Gegenposition oder fehlende Perspektive ist diesem Ast direkt zugeordnet."
            >
              {relationshipOppositions.length || relationshipPerspectives.length ? (
                <>
                  {relationshipOppositions.map(({ claim, related }) => (
                    <BranchButton
                      key={claim.id}
                      dimmed={!related}
                      tone="danger"
                      onClick={() => onNavigate("positions", { type: "claim", id: claim.id })}
                    >
                      <span className="font-semibold">{claim.title}</span>
                      <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
                        Dokumentierte Gegenposition
                        {!related ? " zu einer anderen Aussage" : ""}
                      </span>
                    </BranchButton>
                  ))}
                  {relationshipPerspectives.map(({ perspective, related }) => (
                    <BranchButton
                      key={perspective.id}
                      dimmed={!related}
                      tone="question"
                      id={focusId({ type: "perspective", id: perspective.id })}
                      onClick={() =>
                        onNavigate("overview", { type: "perspective", id: perspective.id })
                      }
                    >
                      <span className="font-semibold">{perspective.label}</span>
                      <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
                        Fehlende Perspektive
                        {perspective.dimension ? ` · Fachbezug: ${perspective.dimension}` : ""}
                        {!related ? " · nicht dieser Aussage zugeordnet" : ""}
                      </span>
                    </BranchButton>
                  ))}
                </>
              ) : undefined}
            </RelationshipLane>
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
