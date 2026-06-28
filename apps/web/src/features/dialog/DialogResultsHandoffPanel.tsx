"use client";

import * as React from "react";

import {
  canCountOpinion,
  getDialogHandoffCandidates,
  getDialogNextQuestions,
  getNewBranchSuggestions,
  getPerspectivePrompts,
  summarizeRecognizedStandpoint,
  type DialogHandoffTarget,
  type DialogOutcome,
} from "@/features/dialog/dialogIntelligenceContract";

export type DialogResultsHandoffPanelProps = {
  outcome: DialogOutcome;
  onSelectHandoff?: (target: DialogHandoffTarget) => void;
  onSelectPerspective?: (perspectiveId: string) => void;
  onSelectBranch?: (branchId: string) => void;
  onConfirmStandpoint?: () => void;
};

const HANDOFF_LABELS: Record<DialogHandoffTarget, string> = {
  count_opinion: "Meinung zählen",
  dossier_candidate: "Dossier vorbereiten",
  anlassraum_candidate: "Anlassraum vorbereiten",
  participation_space_candidate: "Beteiligungsraum vorbereiten",
  editorial_review: "Redaktionelle Prüfung vorbereiten",
  factcheck_request: "Quellenprüfung vorbereiten",
};

function getStatusHint(outcome: DialogOutcome): string {
  if (outcome.resultStatus === "needs_user_confirmation") {
    return "Bitte bestätige, ob wir deinen Standpunkt richtig verstanden haben.";
  }
  if (outcome.resultStatus === "confirmed_by_user") {
    return "Standpunkt bestätigt.";
  }
  if (outcome.resultStatus === "review_ready") {
    return "Bereit für redaktionelle Prüfung.";
  }
  if (outcome.resultStatus === "rejected") {
    return "Dieses Ergebnis wurde verworfen.";
  }
  if (outcome.resultStatus === "needs_review") {
    return "Dieses Ergebnis braucht vor jeder Weitergabe eine bewusste Prüfung.";
  }
  return "Dieser Ergebnisstand ist noch ein Entwurf.";
}

function getIntentActions(outcome: DialogOutcome): Array<{
  id: string;
  label: string;
  disabled: boolean;
}> {
  const actions = [
    {
      id: "count_opinion_intent",
      label: "Meinung zählen",
      disabled: !canCountOpinion(outcome),
    },
    {
      id: "clarify_standpoint_intent",
      label: "Standpunkt klären",
      disabled:
        outcome.resultStatus !== "needs_user_confirmation" &&
        outcome.resultStatus !== "draft",
    },
    {
      id: "perspective_review_intent",
      label: "Perspektiven prüfen",
      disabled: getPerspectivePrompts(outcome).length === 0,
    },
    {
      id: "argumentation_intent",
      label: "Argumentation ausarbeiten",
      disabled:
        outcome.engagementMode === "count_only" &&
        outcome.arguments.length === 0 &&
        outcome.branches.length === 0,
    },
  ];

  return actions;
}

function renderBlockedReasons(reasons: string[]): string {
  if (reasons.includes("result_rejected")) {
    return "Der Ergebnisstand wurde verworfen.";
  }
  if (reasons.includes("standpoint_confirmation_required")) {
    return "Zuerst muss der Standpunkt bestätigt werden.";
  }
  if (reasons.includes("fact_claim_needs_source")) {
    return "Vorher ist Quellenprüfung nötig.";
  }
  if (reasons.includes("count_only_mode_limits_handoff")) {
    return "Dieser Dialog bleibt vorerst beim Meinungsstand.";
  }
  if (reasons.includes("low_openness_limits_anlassraum")) {
    return "Für Anlassraum-Vorbereitung braucht es mehr Klärung oder Offenheit.";
  }
  if (reasons.includes("count_only_mode_limits_participation_space")) {
    return "Für einen Beteiligungsraum fehlt noch ein vertiefter Arbeitsstand.";
  }
  if (reasons.includes("reviewable_substance_required")) {
    return "Es fehlt noch genug reviewbare Substanz.";
  }
  if (reasons.includes("recognized_standpoint_missing")) {
    return "Es fehlt noch ein erkennbarer Standpunkt.";
  }
  if (reasons.includes("no_factcheck_blocker")) {
    return "Aktuell ist keine separate Quellenprüfung nötig.";
  }
  if (reasons.includes("nothing_to_review")) {
    return "Aktuell gibt es noch keinen belastbaren Review-Gegenstand.";
  }
  return "Dieser Schritt bleibt vorerst nur vorbereitend.";
}

export default function DialogResultsHandoffPanel({
  outcome,
  onSelectHandoff,
  onSelectPerspective,
  onSelectBranch,
  onConfirmStandpoint,
}: DialogResultsHandoffPanelProps) {
  const standpoint = summarizeRecognizedStandpoint(outcome);
  const nextQuestions = getDialogNextQuestions(outcome);
  const perspectivePrompts = getPerspectivePrompts(outcome);
  const branchSuggestions = getNewBranchSuggestions(outcome);
  const handoffCandidates = getDialogHandoffCandidates(outcome);
  const intentActions = getIntentActions(outcome);
  const hasNeedsSourceClaim = outcome.arguments.some(
    (argument) => argument.verificationStatus === "needs_source",
  );

  return (
    <section
      className="rounded-[24px] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_95%,rgb(var(--bg))_5%)] px-4 py-4 text-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
      aria-label="Dialog-Ergebnisse"
      data-dialog-results-panel
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(var(--muted))]">
            Dialog Intelligence
          </p>
          <h3 className="text-base font-semibold text-[rgb(var(--fg))]">
            Was eDebatte bisher aus deinem Beitrag erkennt
          </h3>
        </div>
        <span className="rounded-full border border-slate-200/80 px-3 py-1 text-xs font-medium text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          review-first
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-slate-200/80 bg-[rgb(var(--bg))] px-4 py-3 dark:border-[rgb(var(--border))]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            Erkannter Standpunkt
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--fg))]">
            {standpoint || "Noch kein belastbarer Standpunkt erkennbar."}
          </p>
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">{getStatusHint(outcome)}</p>
          {outcome.resultStatus === "needs_user_confirmation" ? (
            <button
              type="button"
              className="mt-3 inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-[rgb(var(--fg))] transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[rgb(var(--border))]"
              onClick={() => onConfirmStandpoint?.()}
            >
              Standpunkt bestätigen
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-[rgb(var(--border))]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
              Offene Rückfragen
            </p>
            {nextQuestions.length > 0 ? (
              <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--fg))]">
                {nextQuestions.map((question) => (
                  <li key={question} className="leading-relaxed">
                    {question}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Keine zusätzliche Rückfrage erzwungen.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-[rgb(var(--border))]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
              Mögliche nächste Schritte
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {intentActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  disabled={action.disabled}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-[rgb(var(--fg))] disabled:cursor-not-allowed disabled:opacity-55 dark:border-[rgb(var(--border))]"
                >
                  {action.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-[rgb(var(--muted))]">
              Diese Schritte sind nur vorbereitend. Nichts wird automatisch erstellt oder veröffentlicht.
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-[rgb(var(--border))]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
              Perspektiven
            </p>
            {perspectivePrompts.length > 0 ? (
              <div className="mt-2 space-y-2">
                {perspectivePrompts.map((prompt) => (
                  <button
                    key={prompt.perspectiveId}
                    type="button"
                    className="block w-full rounded-2xl border border-slate-200/80 px-3 py-3 text-left text-sm text-[rgb(var(--fg))] transition hover:border-slate-300 dark:border-[rgb(var(--border))]"
                    onClick={() => onSelectPerspective?.(prompt.perspectiveId)}
                  >
                    <span className="block font-medium">{prompt.label}</span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-[rgb(var(--muted))]">
                      {prompt.prompt}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Kein Perspektivenzwang. Dieser Stand kann auch ohne Gegenperspektiven nur als Meinung weitergeführt werden.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-[rgb(var(--border))]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
              Neue Zweige
            </p>
            {branchSuggestions.length > 0 ? (
              <div className="mt-2 space-y-2">
                {branchSuggestions.map((branch) => (
                  <button
                    key={branch.id}
                    type="button"
                    className="block w-full rounded-2xl border border-slate-200/80 px-3 py-3 text-left text-sm text-[rgb(var(--fg))] transition hover:border-slate-300 dark:border-[rgb(var(--border))]"
                    onClick={() => onSelectBranch?.(branch.id)}
                  >
                    <span className="block font-medium">{branch.title}</span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-[rgb(var(--muted))]">
                      {branch.reason}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Keine neuen Zweige werden automatisch erstellt. Zusätzliche Themenäste bleiben nur Vorschlag oder Parkzustand.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-[rgb(var(--border))]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            Review-first Handoffs
          </p>
          <div className="mt-2 grid gap-2 lg:grid-cols-2">
            {handoffCandidates.map((candidate) => {
              const disabled = !candidate.eligible;
              return (
                <button
                  key={candidate.target}
                  type="button"
                  disabled={disabled}
                  className="rounded-2xl border border-slate-200/80 px-3 py-3 text-left disabled:cursor-not-allowed disabled:opacity-55 dark:border-[rgb(var(--border))]"
                  onClick={() => onSelectHandoff?.(candidate.target)}
                >
                  <span className="block text-sm font-medium text-[rgb(var(--fg))]">
                    {HANDOFF_LABELS[candidate.target]}
                  </span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-[rgb(var(--muted))]">
                    {candidate.eligible
                      ? "Nur vorbereitend. Kein Auto-Create, kein Auto-Publish."
                      : renderBlockedReasons(candidate.blockedReasons)}
                  </span>
                </button>
              );
            })}
          </div>
          {hasNeedsSourceClaim ? (
            <p className="mt-3 text-xs text-[rgb(var(--muted))]">
              Faktische Claims bleiben bis zur Quellenprüfung reviewpflichtig.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
