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
    title: "Ich habe einen Quellenhinweis erkannt. Was soll ich daraus vorbereiten?",
    lead:
      "Der Link wird noch nicht automatisch ausgewertet. Du kannst per Auswahl weitermachen oder einfach im Chat dazuschreiben, was wichtig ist.",
    youtubeLead:
      "YouTube-Link erkannt. Wenn du magst, schreib kurz dazu, welche Aussage oder welcher Teil wichtig ist.",
    selectedPrefix: "Ausgewählt:",
    extractionPending:
      "Ich bereite diesen nächsten Schritt vor. Der Inhalt wurde noch nicht automatisch ausgewertet.",
    sourcePending:
      "Der Link bleibt vorerst als Quellenhinweis vorgemerkt.",
    freeTextHint:
      "Schreib einfach weiter, wenn du genauer sagen willst, welche Aussage geprüft oder welcher nächste Schritt vorbereitet werden soll.",
    contextLabel: "Was ist daran wichtig?",
    contextPlaceholder:
      "Zum Beispiel: Welche Aussage soll geprüft werden, worum geht es genau oder was soll ich daraus vorbereiten?",
    factcheckGuardrail:
      "Faktencheck / Deep Search startet erst nach bewusster Bestätigung. Keine automatische Kostenbuchung.",
  },
  en: {
    title: "I detected a link. What should happen with it?",
    lead:
      "The link is not automatically evaluated yet. You can choose the next step or keep typing in chat.",
    youtubeLead:
      "YouTube link detected. I can work with it reliably only when transcript or metadata are available, or when you briefly describe what should be checked.",
    selectedPrefix: "Selected:",
    extractionPending:
      "The selected review path is being prepared. The content has not been automatically evaluated yet.",
    sourcePending:
      "The link is currently treated as a source hint only. No automatic evaluation is claimed yet.",
    freeTextHint:
      "You can also keep typing if you want to explain what matters about the link or what should happen next.",
    contextLabel: "What matters about this link?",
    contextPlaceholder:
      "For example: which statement should be checked, which source should be attached, or which vote question should be prepared?",
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
    <div className="create-chat-message flex gap-3">
      <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-600 ring-4 ring-white dark:bg-cyan-300 dark:ring-[rgb(var(--bg))]" />
      <div className="max-w-5xl flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-[rgb(var(--muted))]">eDebatte</p>
        <section className="mt-2 rounded-2xl rounded-tl-sm border border-cyan-500/25 bg-white px-4 py-4 shadow-sm md:px-5 md:py-5 dark:border-cyan-300/30 dark:bg-[rgb(var(--card))] dark:shadow-none">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[rgb(var(--fg))]">{copy.title}</p>
            <p className="text-sm text-[rgb(var(--muted))]">{copy.lead}</p>
            {detection.linkKind === "youtube" ? (
              <p className="rounded-xl border border-amber-300/45 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                {copy.youtubeLead}
              </p>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3">
            {CREATE_LINK_INTENT_OPTIONS.map((option) => {
              const isSelected = option.id === selectedIntentId;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`min-h-[52px] rounded-2xl border px-4 py-3 text-left text-sm ${
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
              <p className="text-sm text-[rgb(var(--muted))]">{copy.freeTextHint}</p>
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
      </div>
    </div>
  );
}
