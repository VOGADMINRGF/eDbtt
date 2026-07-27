"use client";

import { useEffect, useState } from "react";
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

function RelationshipLane({
  title,
  description,
  empty,
  children,
}: {
  title: string;
  description: string;
  empty: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative border-s-2 border-[rgb(var(--border))] ps-5">
      <span
        aria-hidden="true"
        className="absolute -start-[7px] top-5 h-3 w-3 rounded-full border-2 border-[rgb(var(--card))] bg-[rgb(var(--fg))]"
      />
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
        <h4 className="text-sm font-semibold text-[rgb(var(--fg))]">{title}</h4>
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
}: {
  children: React.ReactNode;
  onClick: () => void;
  id?: string;
  pressed?: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`block min-h-11 w-full rounded-xl border px-3 py-2 text-start text-sm leading-5 text-[rgb(var(--fg))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] ${
        pressed
          ? "border-[rgb(var(--fg))] bg-[rgb(var(--card))] shadow-sm"
          : "border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:border-[rgb(var(--grad-from))]"
      }`}
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
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(
    focusedClaimId ?? defaultClaimId,
  );

  useEffect(() => {
    if (focusedClaimId) {
      setSelectedClaimId(focusedClaimId);
      return;
    }
    if (!model.claims.some((claim) => claim.id === selectedClaimId)) {
      setSelectedClaimId(defaultClaimId);
    }
  }, [defaultClaimId, focusedClaimId, model.claims, selectedClaimId]);

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
                pressed={claim.id === selectedClaim?.id}
                onClick={() => setSelectedClaimId(claim.id)}
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
              title="Quellen zur Aussage"
              description="Der Beziehungstext zeigt, ob eine Quelle stützt, widerspricht, einordnet oder noch ungeklärt ist."
              empty="Keine Quelle ist dieser Aussage direkt zugeordnet."
            >
              {selectedSources.length
                ? selectedSources.map(({ link, source }) => (
                    <BranchButton
                      key={`${source.id}-${link.relation}`}
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
            </RelationshipLane>

            <RelationshipLane
              title="Fragen aus dieser Aussage"
              description="Offene Annahmen führen in den Fragenbereich; betroffene Optionen bleiben direkt sichtbar."
              empty="Keine Frage ist dieser Aussage direkt zugeordnet."
            >
              {selectedQuestions.length
                ? selectedQuestions.map((question) => {
                    const affectedOptions = question.optionIds
                      .map((optionId) =>
                        model.options.find((option) => option.id === optionId),
                      )
                      .filter((option): option is NonNullable<typeof option> => Boolean(option));
                    return (
                      <BranchButton
                        key={question.id}
                        id={focusId({ type: "question", id: question.id })}
                        onClick={() =>
                          onNavigate("questions", { type: "question", id: question.id })
                        }
                      >
                        <span className="font-semibold">{question.text}</span>
                        <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
                          {question.statusLabel}
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
              title="Betroffene Entscheidungsoptionen"
              description="Die Hinweise benennen, ob eine dokumentierte offene Frage die Grundlage einer Option berührt."
              empty="Keine Option ist von dieser Aussage abhängig."
            >
              {selectedOptions.length
                ? selectedOptions.map((option) => {
                    const affectingQuestions = model.questions.filter((question) =>
                      question.optionIds.includes(option.id),
                    );
                    return (
                      <BranchButton
                        key={option.id}
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
                        </span>
                      </BranchButton>
                    );
                  })
                : undefined}
            </RelationshipLane>

            <RelationshipLane
              title="Widerspruch und Einschränkungen"
              description="Gegenpositionen und fehlende Perspektiven begrenzen die Aussage, ohne ihren Status zu vermischen."
              empty="Keine Gegenposition oder fehlende Perspektive ist diesem Ast direkt zugeordnet."
            >
              {selectedOppositions.length || selectedPerspectives.length ? (
                <>
                  {selectedOppositions.map((claim) => (
                    <BranchButton
                      key={claim.id}
                      onClick={() => onNavigate("positions", { type: "claim", id: claim.id })}
                    >
                      <span className="font-semibold">{claim.title}</span>
                      <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
                        Dokumentierte Gegenposition
                      </span>
                    </BranchButton>
                  ))}
                  {selectedPerspectives.map((perspective) => (
                    <BranchButton
                      key={perspective.id}
                      id={focusId({ type: "perspective", id: perspective.id })}
                      onClick={() =>
                        onNavigate("overview", { type: "perspective", id: perspective.id })
                      }
                    >
                      <span className="font-semibold">{perspective.label}</span>
                      <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
                        Fehlende Perspektive
                        {perspective.dimension ? ` · Fachbezug: ${perspective.dimension}` : ""}
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
