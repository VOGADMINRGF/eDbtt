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
  count_opinion: "Meine Meinung so erfassen",
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
      label: "Meine Meinung so erfassen",
      disabled: !canCountOpinion(outcome),
    },
    {
      id: "clarify_standpoint_intent",
      label: "Standpunkt präzisieren",
      disabled:
        outcome.resultStatus !== "needs_user_confirmation" &&
        outcome.resultStatus !== "draft",
    },
    {
      id: "perspective_review_intent",
      label: "Weitere Blickwinkel prüfen",
      disabled: getPerspectivePrompts(outcome).length === 0,
    },
    {
      id: "argumentation_intent",
      label: "Argumentation gemeinsam ausbauen",
      disabled:
        outcome.engagementMode === "count_only" &&
        outcome.arguments.length === 0 &&
        outcome.branches.length === 0,
    },
    {
      id: "enrich_sources_intent",
      label: "Quellen, Beispiele oder neue Aspekte ergänzen",
      disabled: outcome.resultStatus === "rejected",
    },
    {
      id: "branch_intent",
      label: "Neuen Themenzweig vormerken",
      disabled:
        outcome.resultStatus === "rejected" ||
        (getNewBranchSuggestions(outcome).length === 0 &&
          outcome.engagementMode === "count_only"),
    },
    {
      id: "handoff_intent",
      label: "Dossier oder Anlassraum vorbereiten",
      disabled:
        outcome.resultStatus === "rejected" ||
        !getDialogHandoffCandidates(outcome).some(
          (candidate) =>
            candidate.eligible &&
            (candidate.target === "dossier_candidate" ||
              candidate.target === "anlassraum_candidate"),
        ),
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
    return "Bevor daraus mehr wird, sollten erst Quellen oder Beispiele ergänzt werden.";
  }
  if (reasons.includes("count_only_mode_limits_handoff")) {
    return "Dieser Stand bleibt vorerst beim Meinungsbild und lässt sich später weiter ausbauen.";
  }
  if (reasons.includes("low_openness_limits_anlassraum")) {
    return "Für einen Anlassraum braucht es vorher noch mehr Klärung oder zusätzliche Bausteine.";
  }
  if (reasons.includes("count_only_mode_limits_participation_space")) {
    return "Für einen Beteiligungsraum fehlt noch ein weiter ausgearbeiteter Arbeitsstand.";
  }
  if (reasons.includes("reviewable_substance_required")) {
    return "Hier fehlen noch nachvollziehbare Bausteine für einen belastbaren Review-Stand.";
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
          <p className="text-sm leading-relaxed text-[rgb(var(--fg))]">
            Wir versuchen deinen Standpunkt so zu verstehen, wie du ihn meinst.
            Du kannst ihn einfach zählen lassen - oder gemeinsam mit eDebatte
            weiter ausbauen.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--muted))]">
            Dabei geht es nicht darum, dich von einer anderen Meinung zu
            überzeugen. Es geht darum, deinen Beitrag stärker zu machen: durch
            klare Argumente, nachvollziehbare Beispiele, mögliche Gegenfragen,
            weitere Blickwinkel und Hinweise auf Quellen oder Erfahrungen, die
            du selbst einbringen möchtest.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--muted))]">
            Die Community entscheidet - und das stärkste Argument setzt sich
            durch.
          </p>
          <p className="mt-2 text-xs font-medium text-[rgb(var(--muted))]">
            eDebatte - lass das stärkste Argument gewinnen.
          </p>
        </div>

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
                Aktuell braucht es keine zusätzliche Rückfrage. Du kannst deine
                Meinung auch einfach so erfassen lassen.
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
              Weitere Blickwinkel
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
                Weitere Blickwinkel sind ein Angebot, keine Pflicht. Du kannst
                deine Meinung auch einfach so erfassen lassen oder später eigene
                Beispiele, Quellen und Erfahrungen ergänzen.
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
                Neue Themenzweige werden nicht automatisch erstellt. Zusätzliche
                Aspekte bleiben nur als Vorschlag oder Vormerkung sichtbar.
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
                      ? "Nur vorbereitend. Kein Auto-Create, kein Auto-Publish, kein stiller Handoff."
                      : renderBlockedReasons(candidate.blockedReasons)}
                  </span>
                </button>
              );
            })}
          </div>
          {hasNeedsSourceClaim ? (
            <p className="mt-3 text-xs text-[rgb(var(--muted))]">
              Faktische Claims bleiben reviewpflichtig, bis du passende Quellen,
              Beispiele oder weitere Nachweise ergänzt hast.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
