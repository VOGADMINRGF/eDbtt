"use client";

import * as React from "react";

import {
  getHandoffDraftCtaLabel,
  getHandoffDraftGuardrailNote,
  getHandoffDraftOpenQuestions,
  type CreateHandoffDraft,
} from "@/features/create/createHandoffDrafts";
import {
  canQueueHandoffDraftForReview,
  getReviewQueueItemGuardrailNote,
  getReviewQueueItemKindLabel,
  getReviewQueueItemOpenQuestions,
  getReviewQueueItemStatusLabel,
  type CreateHandoffReviewQueueItem,
} from "@/features/create/createHandoffReviewQueue";

export type CreateHandoffDraftSummaryProps = {
  draft: CreateHandoffDraft;
  reviewQueueItem?: CreateHandoffReviewQueueItem | null;
  onQueueForReview?: () => void;
  runtimeSubmissionState?: "idle" | "submitting" | "submitted" | "blocked" | "error";
  runtimeSubmissionMessage?: string | null;
};

function getStatusLabel(status: CreateHandoffDraft["status"]): string {
  if (status === "prepared") return "vorbereitet";
  if (status === "submitted_for_review") return "zur Prüfung eingereicht";
  if (status === "needs_clarification") return "Klärung nötig";
  if (status === "approved_for_setup") return "für nächsten Schritt freigegeben";
  if (status === "rejected") return "verworfen";
  return "Entwurf";
}

function getReviewHint(draft: CreateHandoffDraft): string {
  if (draft.requiresFactcheck) {
    return "Factcheck bleibt hier nur eine Anfrage oder Vormerkung, keine bestätigte Wahrheit.";
  }
  if (draft.requiresEditorialReview) {
    return "Dieser Entwurf bleibt review-first und braucht bewusste Prüfung vor jedem weiteren Schritt.";
  }
  if (draft.target === "opinion_count") {
    return "Meinung zählen bleibt eine Erfassungsabsicht und keine repräsentative Statistik.";
  }
  if (draft.target === "existing_branch_connection") {
    return "Der Anschluss bleibt ein Verbindungsvorschlag und ist kein Merge.";
  }
  return "Der nächste Schritt bleibt ein lokaler, prüfbarer Entwurf.";
}

function getReviewQueueHint(item: CreateHandoffReviewQueueItem): string {
  if (item.requiresFactcheck) {
    return "Factcheck bleibt auch in der Queue nur eine Anfrage oder Vormerkung, keine bestätigte Wahrheit.";
  }
  if (item.requiresEditorialReview) {
    return "Dieses Review-Item bleibt redaktionell prüfpflichtig und erzeugt noch keine finale Einrichtung.";
  }
  if (item.target === "opinion_count") {
    return "Meinung zählen bleibt in der Queue eine Erfassungsabsicht und keine repräsentative Statistik.";
  }
  if (item.target === "existing_branch_connection") {
    return "Der Anschluss bleibt auch in der Queue nur ein Vorschlag und kein Merge.";
  }
  return "Dieses Review-Item bleibt vorbereitend und löst noch keine Runtime-Entität aus.";
}

function showsCommunitySourceReviewCopy(
  draft: CreateHandoffDraft,
  reviewQueueItem?: CreateHandoffReviewQueueItem | null,
): boolean {
  if (reviewQueueItem?.target === "factcheck_request") return true;
  return draft.target === "factcheck_request" || draft.requiresFactcheck;
}

export default function CreateHandoffDraftSummary(
  props: CreateHandoffDraftSummaryProps,
) {
  const runtimeSubmissionState = props.runtimeSubmissionState ?? "idle";
  const submittedToRuntime = runtimeSubmissionState === "submitted";
  const factcheckSubmission = props.draft.requiresFactcheck;
  const questions = getHandoffDraftOpenQuestions(props.draft);
  const queueQuestions = props.reviewQueueItem
    ? getReviewQueueItemOpenQuestions(props.reviewQueueItem)
    : [];
  const showQueueButton =
    !props.reviewQueueItem &&
    props.onQueueForReview &&
    canQueueHandoffDraftForReview(props.draft);
  const queueButtonLabel =
    runtimeSubmissionState === "submitting"
      ? "Wird übergeben …"
      : "Zur Prüfung vormerken";
  const showCommunitySourceReview = showsCommunitySourceReviewCopy(
    props.draft,
    props.reviewQueueItem,
  );

  return (
    <section
      className="rounded-[24px] border border-emerald-300/35 bg-emerald-500/[0.08] px-4 py-4 text-sm dark:border-emerald-300/20 dark:bg-emerald-500/[0.1]"
      aria-label="Vorbereiteter Handoff-Entwurf"
      data-create-handoff-draft-summary
    >
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-900 dark:text-emerald-100">
          Vorbereitung gespeichert
        </p>
        <h3 className="text-base font-semibold text-[rgb(var(--fg))]">
          {submittedToRuntime
            ? factcheckSubmission
              ? "Zur Quellenprüfung übergeben"
              : "Zur redaktionellen Prüfung übergeben"
            : props.reviewQueueItem
            ? "Zur Prüfung vorgemerkt"
            : getHandoffDraftCtaLabel(props.draft)}
        </h3>
        <p className="text-sm leading-relaxed text-[rgb(var(--fg))]">
          {submittedToRuntime
            ? factcheckSubmission
              ? "Die Aussage wurde zur Prüfung vorgemerkt. Es wurde noch keine Wahrheit bestätigt und keine Quelle automatisch bewertet."
              : "Der Entwurf wurde an die Review Queue übergeben. Noch wurde nichts veröffentlicht, zusammengeführt oder als Dossier/Anlassraum/Beteiligungsraum erstellt."
            : props.reviewQueueItem
            ? "Der Entwurf wurde als Review-Item vorbereitet. Noch wurde nichts veröffentlicht, zusammengeführt oder als Dossier/Anlassraum/Beteiligungsraum erstellt."
            : "eDebatte hat daraus einen prüfbaren Entwurf vorbereitet. Noch wurde nichts veröffentlicht, zusammengeführt oder als Dossier/Anlassraum erstellt."}
        </p>
      </div>

      {showQueueButton ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={props.onQueueForReview}
            disabled={runtimeSubmissionState === "submitting"}
            className="rounded-full border border-emerald-500/40 bg-emerald-500/[0.12] px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-500/[0.18] dark:border-emerald-300/30 dark:bg-emerald-500/[0.18] dark:text-emerald-50"
          >
            {queueButtonLabel}
          </button>
          <p className="text-xs text-[rgb(var(--muted))]">
            Review-first: keine automatische Veröffentlichung, Erstellung oder Zusammenführung.
          </p>
        </div>
      ) : null}

      {props.runtimeSubmissionMessage &&
      runtimeSubmissionState !== "idle" &&
      runtimeSubmissionState !== "submitted" ? (
        <p className="mt-3 rounded-2xl border border-amber-400/25 bg-amber-500/[0.08] px-3 py-2 text-xs leading-relaxed text-amber-950 dark:border-amber-300/20 dark:bg-amber-500/[0.12] dark:text-amber-50">
          {props.runtimeSubmissionMessage}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-400/20 bg-[rgb(var(--bg))] px-4 py-3 dark:border-emerald-300/15">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            Zieltyp
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">
            {props.reviewQueueItem
              ? getReviewQueueItemKindLabel(props.reviewQueueItem)
              : getHandoffDraftCtaLabel(props.draft)}
          </p>
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
            Status:{" "}
            {props.reviewQueueItem
              ? getReviewQueueItemStatusLabel(props.reviewQueueItem)
              : getStatusLabel(props.draft.status)}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-400/20 bg-[rgb(var(--bg))] px-4 py-3 dark:border-emerald-300/15">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            Titel
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">
            {props.draft.title}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-[rgb(var(--bg))] px-4 py-3 dark:border-emerald-300/15">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          Zusammenfassung
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--fg))]">
          {props.draft.summary}
        </p>
      </div>

      {showCommunitySourceReview ? (
        <div className="mt-3 rounded-2xl border border-sky-400/20 bg-[rgb(var(--bg))] px-4 py-3 dark:border-sky-300/15">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            Community Source Review
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--fg))]">
            Diese Aussage ist zur Quellenprüfung vorgemerkt. Andere können Hinweise,
            Quellen oder Gegenbeispiele beitragen. Diese Hinweise werden geprüft und
            bestätigen noch keine Wahrheit.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[rgb(var(--muted))]">
            <span className="rounded-full border border-sky-500/20 px-3 py-1">
              Community kann Quellenhinweise beitragen
            </span>
            <span className="rounded-full border border-sky-500/20 px-3 py-1">
              Quelle vorschlagen
            </span>
            <span className="rounded-full border border-sky-500/20 px-3 py-1">
              Gegenbeleg vorschlagen
            </span>
            <span className="rounded-full border border-sky-500/20 px-3 py-1">
              Kontext ergänzen
            </span>
          </div>
        </div>
      ) : null}

      {(props.reviewQueueItem ? queueQuestions.length : questions.length) > 0 ? (
        <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-[rgb(var(--bg))] px-4 py-3 dark:border-emerald-300/15">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            Offene Fragen
          </p>
          <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--fg))]">
            {(props.reviewQueueItem ? queueQuestions : questions).map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-3 text-xs leading-relaxed text-[rgb(var(--muted))]">
        {props.reviewQueueItem
          ? getReviewQueueHint(props.reviewQueueItem)
          : getReviewHint(props.draft)}
      </p>
      <p className="mt-2 text-xs font-medium leading-relaxed text-[rgb(var(--muted))]">
        {props.reviewQueueItem
          ? getReviewQueueItemGuardrailNote(props.reviewQueueItem)
          : getHandoffDraftGuardrailNote(props.draft)}
      </p>

      {props.reviewQueueItem ? (
        <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-[rgb(var(--bg))] px-4 py-3 dark:border-emerald-300/15">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            Audit-Trail
          </p>
          <ul className="mt-2 space-y-2 text-xs text-[rgb(var(--muted))]">
            {props.reviewQueueItem.auditTrail.map((entry) => (
              <li key={`${entry.at}-${entry.action}`}>
                {entry.action}: {entry.note}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {props.reviewQueueItem ? (
        <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--muted))]">
          approved_for_setup bleibt ein Review-Status und erstellt noch keine
          finale Runtime-Entität.
        </p>
      ) : null}
    </section>
  );
}
