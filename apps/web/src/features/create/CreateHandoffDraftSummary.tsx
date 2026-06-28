"use client";

import * as React from "react";

import {
  getHandoffDraftCtaLabel,
  getHandoffDraftGuardrailNote,
  getHandoffDraftOpenQuestions,
  type CreateHandoffDraft,
} from "@/features/create/createHandoffDrafts";

export type CreateHandoffDraftSummaryProps = {
  draft: CreateHandoffDraft;
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

export default function CreateHandoffDraftSummary(
  props: CreateHandoffDraftSummaryProps,
) {
  const questions = getHandoffDraftOpenQuestions(props.draft);

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
          {getHandoffDraftCtaLabel(props.draft)}
        </h3>
        <p className="text-sm leading-relaxed text-[rgb(var(--fg))]">
          eDebatte hat daraus einen prüfbaren Entwurf vorbereitet. Noch wurde
          nichts veröffentlicht, zusammengeführt oder als Dossier/Anlassraum
          erstellt.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-400/20 bg-[rgb(var(--bg))] px-4 py-3 dark:border-emerald-300/15">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            Zieltyp
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">
            {getHandoffDraftCtaLabel(props.draft)}
          </p>
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
            Status: {getStatusLabel(props.draft.status)}
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

      {questions.length > 0 ? (
        <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-[rgb(var(--bg))] px-4 py-3 dark:border-emerald-300/15">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            Offene Fragen
          </p>
          <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--fg))]">
            {questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-3 text-xs leading-relaxed text-[rgb(var(--muted))]">
        {getReviewHint(props.draft)}
      </p>
      <p className="mt-2 text-xs font-medium leading-relaxed text-[rgb(var(--muted))]">
        {getHandoffDraftGuardrailNote(props.draft)}
      </p>
    </section>
  );
}
