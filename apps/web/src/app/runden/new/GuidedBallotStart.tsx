"use client";

import { useEffect, useMemo, useState } from "react";

import { getGoToMarketTemplate } from "@features/pricing/goToMarketPackaging";
import {
  createEmptyManualAnlassraumSetup,
  sanitizeManualAnlassraumSetup,
  type ManualAnlassraumCommunityOptionsMode,
  type ManualAnlassraumSetup,
} from "@/features/surfaces/runden/manualAnlassraumSetup";

const STORAGE_KEY = "manual-anlassraum-setup.v1";

type Props = {
  initialTemplateId?: string | null;
};

type AnswerMode = "fixed" | "suggestions";

function saveSetup(setup: ManualAnlassraumSetup) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeManualAnlassraumSetup(setup)));
}

export default function GuidedBallotStart({ initialTemplateId = null }: Props) {
  const template = useMemo(() => getGoToMarketTemplate(initialTemplateId), [initialTemplateId]);
  const [step, setStep] = useState(1);
  const [question, setQuestion] = useState(template?.question.de ?? "");
  const [options, setOptions] = useState<string[]>(template ? [...template.options.de] : ["", "", ""]);
  const [answerMode, setAnswerMode] = useState<AnswerMode>("suggestions");

  useEffect(() => {
    if (!template) return;
    setQuestion(template.question.de);
    setOptions([...template.options.de]);
  }, [template]);

  const configuredOptions = options.filter((option) => option.trim().length > 0).length;
  const canContinueQuestion = question.trim().length >= 8;
  const canFinish = canContinueQuestion && configuredOptions >= 2;

  function updateOption(index: number, value: string) {
    setOptions((current) => current.map((option, optionIndex) => optionIndex === index ? value : option));
  }

  function finish() {
    if (!canFinish) return;
    const communityOptionsMode: ManualAnlassraumCommunityOptionsMode =
      answerMode === "suggestions" ? "review_required" : "disabled";
    const setup = sanitizeManualAnlassraumSetup({
      ...createEmptyManualAnlassraumSetup(),
      title: question.trim().replace(/[?.!]$/, "").slice(0, 120),
      votingQuestion: question,
      description: "",
      options,
      communityOptionsMode,
      visibility: "private_draft",
      scope: "public",
      nextStep: "save_draft",
    });
    saveSetup(setup);

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("details", "1");
    window.location.assign(nextUrl.toString());
  }

  return (
    <section className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
            Abstimmung erstellen · Schritt {step} von 3
          </p>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">Nur das Nötigste. Weitere Einstellungen kommen später.</p>
        </div>
        <div className="flex gap-1" aria-label={`Schritt ${step} von 3`}>
          {[1, 2, 3].map((number) => (
            <span key={number} className={`h-2 w-10 rounded-full ${number <= step ? "bg-cyan-500" : "bg-[rgb(var(--border))]"}`} />
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm sm:p-8">
        {step === 1 ? (
          <div>
            <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">1 · Deine Frage</span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[rgb(var(--fg))] sm:text-4xl">Was möchtest du gemeinsam klären?</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[rgb(var(--muted))]">
              Schreib die Frage so, wie du sie später an Freunde, Mitglieder oder Teilnehmende schicken würdest.
            </p>
            <label className="mt-7 block">
              <span className="sr-only">Abstimmungsfrage</span>
              <textarea
                autoFocus
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={3}
                placeholder="Zum Beispiel: Was sollten wir mit unserem zusätzlichen Budget zuerst umsetzen?"
                className="w-full resize-none rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-5 py-4 text-lg font-semibold leading-7 text-[rgb(var(--fg))] outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>
            <div className="mt-6 flex justify-end">
              <button type="button" disabled={!canContinueQuestion} onClick={() => setStep(2)} className="vog-btn-brand disabled:cursor-not-allowed disabled:opacity-40">
                Weiter →
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">2 · So können Menschen antworten</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[rgb(var(--fg))]">Wie offen soll die Abstimmung sein?</h2>
            <p className="mt-3 text-base leading-7 text-[rgb(var(--muted))]">Unsere Empfehlung: Gib Antworten vor und lass zusätzlich eigene Vorschläge zu. So erhältst du ein klareres Bild, ohne gute Ideen zu verlieren.</p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <button type="button" onClick={() => setAnswerMode("suggestions")} className={`relative rounded-3xl border p-5 text-left transition ${answerMode === "suggestions" ? "border-cyan-500 bg-cyan-50 ring-2 ring-cyan-500/15 dark:bg-cyan-950/25" : "border-[rgb(var(--border))] bg-[rgb(var(--bg))]"}`}>
                <span className="absolute right-4 top-4 rounded-full bg-cyan-500 px-3 py-1 text-xs font-bold text-slate-950">Empfohlen</span>
                <span className="text-lg font-bold text-[rgb(var(--fg))]">Auswahl + eigene Antwort</span>
                <p className="mt-2 pr-12 text-sm leading-6 text-[rgb(var(--muted))]">Teilnehmende wählen aus deinen Optionen oder schlagen eine eigene Antwort vor. Neue Vorschläge werden erst nach deiner Prüfung sichtbar.</p>
              </button>
              <button type="button" onClick={() => setAnswerMode("fixed")} className={`rounded-3xl border p-5 text-left transition ${answerMode === "fixed" ? "border-cyan-500 bg-cyan-50 ring-2 ring-cyan-500/15 dark:bg-cyan-950/25" : "border-[rgb(var(--border))] bg-[rgb(var(--bg))]"}`}>
                <span className="text-lg font-bold text-[rgb(var(--fg))]">Nur feste Antworten</span>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">Du gibst alle möglichen Antworten vor. Gut für einfache Ja/Nein- oder klar abgegrenzte Entscheidungen.</p>
              </button>
            </div>

            <div className="mt-7 flex items-center justify-between gap-3">
              <button type="button" onClick={() => setStep(1)} className="vog-btn-secondary">← Zurück</button>
              <button type="button" onClick={() => setStep(3)} className="vog-btn-brand">Antworten festlegen →</button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">3 · Deine Antwortmöglichkeiten</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[rgb(var(--fg))]">Welche Antworten sollen zuerst zur Auswahl stehen?</h2>
            <p className="mt-3 text-base leading-7 text-[rgb(var(--muted))]">Zwei reichen zum Start. Du kannst später jederzeit ergänzen oder ändern.</p>

            <div className="mt-7 space-y-3">
              {options.map((option, index) => (
                <label key={index} className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 focus-within:border-cyan-500">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--card))] text-sm font-bold text-[rgb(var(--muted))]">{index + 1}</span>
                  <input
                    value={option}
                    onChange={(event) => updateOption(index, event.target.value)}
                    placeholder={`Antwort ${index + 1}`}
                    className="min-w-0 flex-1 bg-transparent py-2 text-base font-semibold text-[rgb(var(--fg))] outline-none"
                  />
                </label>
              ))}
              <button type="button" onClick={() => setOptions((current) => [...current, ""])} className="text-sm font-semibold text-cyan-700 hover:underline dark:text-cyan-300">+ Weitere Antwort hinzufügen</button>
            </div>

            {answerMode === "suggestions" ? (
              <div className="mt-5 rounded-2xl border border-cyan-300 bg-cyan-50 px-4 py-3 text-sm leading-6 text-cyan-950 dark:border-cyan-400/30 dark:bg-cyan-950/25 dark:text-cyan-50">
                <strong>Eigene Antworten sind aktiviert.</strong> Teilnehmende können zusätzliche Vorschläge einbringen; du prüfst sie, bevor sie sichtbar werden.
              </div>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => setStep(2)} className="vog-btn-secondary">← Zurück</button>
              <button type="button" disabled={!canFinish} onClick={finish} className="vog-btn-brand disabled:cursor-not-allowed disabled:opacity-40">Abstimmung vorbereiten →</button>
            </div>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-center text-xs leading-5 text-[rgb(var(--muted))]">Nichts wird automatisch veröffentlicht. Nach dem Schnellstart kannst du Sichtbarkeit, KI-Unterstützung und weitere Details bewusst festlegen.</p>
    </section>
  );
}
