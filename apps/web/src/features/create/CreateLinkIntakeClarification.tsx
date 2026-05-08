"use client";

import {
  CREATE_LINK_INTENT_OPTIONS,
  resolveCreateLinkIntentOptionLabel,
  type CreateLinkIntakeDetection,
  type CreateLinkIntentOptionId,
  type CreateLinkLocale,
} from "@/features/create/linkIntake";

type CreateLinkIntakeClarificationProps = {
  locale: CreateLinkLocale;
  detection: CreateLinkIntakeDetection;
  selectedIntentId: CreateLinkIntentOptionId | null;
  additionalContext: string;
  onSelectIntent: (intentId: CreateLinkIntentOptionId) => void;
  onAdditionalContextChange: (value: string) => void;
};

const COPY = {
  de: {
    title: "Ich habe einen Link erkannt. Was soll damit passieren?",
    lead:
      "Ich nutze den Link zuerst nur als Quellenhinweis (`sourceHints`) oder als Signal für einen späteren Prüfpfad. Eine Auswertung startet erst nach einem passenden nächsten Schritt.",
    youtubeLead:
      "YouTube-Link erkannt. Ich kann daraus erst verlässlich arbeiten, wenn Transkript/Metadaten verfügbar sind oder du kurz beschreibst, was geprüft werden soll.",
    selectedPrefix: "Gewählt:",
    extractionPending:
      "Der ausgewählte Prüfpfad wird vorbereitet. Der Inhalt wurde noch nicht automatisch ausgewertet.",
    sourcePending:
      "Der Link bleibt vorerst ein Quellenhinweis. Es wird noch keine automatische Auswertung behauptet.",
    contextLabel: "Was ist an diesem Link wichtig?",
    contextPlaceholder:
      "Zum Beispiel: Welche Aussage soll geprüft, welche Quelle ergänzt oder welche Abstimmungsfrage vorbereitet werden?",
    factcheckGuardrail:
      "Faktencheck / Deep Search startet erst nach bewusster Bestätigung. Keine automatische Kostenbuchung.",
  },
  en: {
    title: "I detected a link. What should happen with it?",
    lead:
      "I first keep the link as a source hint (`sourceHints`) or as a signal for a later review path. Evaluation only starts after an explicit next step.",
    youtubeLead:
      "YouTube link detected. I can work with it reliably only when transcript or metadata are available, or when you briefly describe what should be checked.",
    selectedPrefix: "Selected:",
    extractionPending:
      "The selected review path is being prepared. The content has not been automatically evaluated yet.",
    sourcePending:
      "The link is currently treated as a source hint only. No automatic evaluation is claimed yet.",
    contextLabel: "What matters about this link?",
    contextPlaceholder:
      "For example: which claim should be checked, which source should be attached, or which vote question should be prepared?",
    factcheckGuardrail:
      "Fact-check / Deep Search starts only after explicit confirmation. No automatic cost booking.",
  },
} as const;

export default function CreateLinkIntakeClarification({
  locale,
  detection,
  selectedIntentId,
  additionalContext,
  onSelectIntent,
  onAdditionalContextChange,
}: CreateLinkIntakeClarificationProps) {
  const copy = COPY[locale];
  const selectedLabel = selectedIntentId
    ? resolveCreateLinkIntentOptionLabel(selectedIntentId, locale)
    : null;
  const showExtractionPending =
    selectedIntentId !== null && selectedIntentId !== "add_source_to_dossier";

  return (
    <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:p-5">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{copy.title}</p>
        <p className="text-sm text-[rgb(var(--muted))]">{copy.lead}</p>
        {detection.linkKind === "youtube" ? (
          <p className="rounded-xl border border-amber-300/45 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            {copy.youtubeLead}
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {CREATE_LINK_INTENT_OPTIONS.map((option) => {
          const isSelected = option.id === selectedIntentId;
          return (
            <button
              key={option.id}
              type="button"
              className={`rounded-xl border px-3 py-3 text-left text-sm ${
                isSelected
                  ? "border-[rgb(var(--grad-from))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]"
                  : "border-[rgb(var(--border))] bg-transparent text-[rgb(var(--fg))] hover:border-[rgb(var(--grad-from))]/40"
              }`}
              onClick={() => onSelectIntent(option.id)}
            >
              {option.label[locale]}
            </button>
          );
        })}
      </div>

      {selectedLabel ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">
            {copy.selectedPrefix} {selectedLabel}
          </p>
          <p className="text-sm text-[rgb(var(--muted))]">
            {showExtractionPending ? copy.extractionPending : copy.sourcePending}
          </p>
          {selectedIntentId === "prepare_factcheck" ? (
            <p className="rounded-xl border border-sky-300/45 bg-sky-500/10 px-3 py-2 text-sm text-sky-900 dark:text-sky-100">
              {copy.factcheckGuardrail}
            </p>
          ) : null}
          <label className="block text-sm font-semibold text-[rgb(var(--fg))]" htmlFor="create-link-extra-context">
            {copy.contextLabel}
          </label>
          <textarea
            id="create-link-extra-context"
            rows={4}
            value={additionalContext}
            onChange={(event) => onAdditionalContextChange(event.target.value)}
            className="w-full resize-y rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder={copy.contextPlaceholder}
          />
        </div>
      ) : null}
    </section>
  );
}
