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

type Props = { initialTemplateId?: string | null };
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

  const visibleOptions = options.filter((option) => option.trim().length > 0);
  const configuredOptions = visibleOptions.length;
  const canContinueQuestion = question.trim().length >= 8;
  const canFinish = canContinueQuestion && configuredOptions >= 2;

  function updateOption(index: number, value: string) {
    setOptions((current) => current.map((option, optionIndex) => optionIndex === index ? value : option));
  }

  function persistCurrentSetup() {
    const communityOptionsMode: ManualAnlassraumCommunityOptionsMode = answerMode === "suggestions" ? "review_required" : "disabled";
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
  }

  function finish() {
    if (!canFinish) return;
    persistCurrentSetup();
    setStep(4);
  }

  function openDetails() {
    persistCurrentSetup();
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("details", "1");
    window.location.assign(nextUrl.toString());
  }

  return (
    <section className="mx-auto w-full max-w-3xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Eine Frage starten</p>
        {step <= 3 ? (
          <div className="flex items-center gap-2" aria-label={`Schritt ${step} von 3`}>
            {[1, 2, 3].map((number) => <span key={number} className={`h-2 rounded-full transition-all ${number === step ? "w-10 bg-cyan-500" : number < step ? "w-4 bg-cyan-300" : "w-4 bg-[rgb(var(--border))]"}`} />)}
          </div>
        ) : <span className="text-xs font-black uppercase tracking-[0.14em] text-cyan-600">Vorschau</span>}
      </div>

      <div className="min-h-[32rem]">
        {step === 1 ? <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm font-semibold text-[rgb(var(--muted))]">Schritt 1 von 3</p>
          <h1 className="mt-3 text-balance text-4xl font-black tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-5xl">Was möchtest du herausfinden oder gemeinsam klären?</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[rgb(var(--muted))]">Ein Satz reicht – egal ob Entscheidung, Feedback, Leserfrage oder neue Idee.</p>
          <textarea autoFocus value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} placeholder="Zum Beispiel: Welchen Aspekt sollten wir als Nächstes genauer untersuchen?" className="mt-10 w-full resize-none border-0 border-b-2 border-[rgb(var(--border))] bg-transparent px-0 py-4 text-2xl font-bold leading-9 text-[rgb(var(--fg))] outline-none transition focus:border-cyan-500" />
          <div className="mt-8 flex justify-end"><button type="button" disabled={!canContinueQuestion} onClick={() => setStep(2)} className="inline-flex min-h-13 items-center rounded-full bg-cyan-500 px-7 py-3 font-black text-slate-950 disabled:opacity-30">Weiter →</button></div>
        </div> : null}

        {step === 2 ? <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm font-semibold text-[rgb(var(--muted))]">Schritt 2 von 3</p>
          <h2 className="mt-3 text-balance text-4xl font-black tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-5xl">Wie sollen Menschen antworten?</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[rgb(var(--muted))]">Du kannst Orientierung geben – und trotzdem offen bleiben für das, was du noch nicht bedacht hast.</p>

          <div className="mt-10 border-y border-[rgb(var(--border))]">
            <button type="button" onClick={() => setAnswerMode("suggestions")} className="flex w-full items-start justify-between gap-5 border-b border-[rgb(var(--border))] py-6 text-left">
              <div><div className="flex flex-wrap items-center gap-3"><span className="text-xl font-black text-[rgb(var(--fg))]">Auswahl + eigene Beiträge</span><span className="rounded-full bg-cyan-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-950">Empfohlen</span></div><p className="mt-2 max-w-xl text-sm leading-6 text-[rgb(var(--muted))]">Menschen wählen aus deinen Startoptionen oder ergänzen eine Perspektive, Idee oder Alternative. Neue Vorschläge prüfst du vor der Sichtbarkeit.</p></div>
              <span aria-hidden="true" className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${answerMode === "suggestions" ? "border-cyan-500 bg-cyan-500 text-slate-950" : "border-[rgb(var(--border))]"}`}>{answerMode === "suggestions" ? "✓" : ""}</span>
            </button>
            <button type="button" onClick={() => setAnswerMode("fixed")} className="flex w-full items-start justify-between gap-5 py-6 text-left">
              <div><span className="text-xl font-black text-[rgb(var(--fg))]">Nur feste Antworten</span><p className="mt-2 max-w-xl text-sm leading-6 text-[rgb(var(--muted))]">Gut, wenn die Auswahl bereits vollständig und klar abgegrenzt ist.</p></div>
              <span aria-hidden="true" className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${answerMode === "fixed" ? "border-cyan-500 bg-cyan-500 text-slate-950" : "border-[rgb(var(--border))]"}`}>{answerMode === "fixed" ? "✓" : ""}</span>
            </button>
          </div>

          <div className="mt-8 flex items-center justify-between"><button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">← Zurück</button><button type="button" onClick={() => setStep(3)} className="inline-flex min-h-13 items-center rounded-full bg-cyan-500 px-7 py-3 font-black text-slate-950">Startantworten →</button></div>
        </div> : null}

        {step === 3 ? <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm font-semibold text-[rgb(var(--muted))]">Schritt 3 von 3</p>
          <h2 className="mt-3 text-balance text-4xl font-black tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-5xl">Womit sollen Menschen anfangen?</h2>
          <p className="mt-4 text-base leading-7 text-[rgb(var(--muted))]">Zwei Startoptionen reichen. Wenn du eigene Beiträge erlaubst, kann die Gruppe das Bild danach erweitern.</p>
          <div className="mt-9 divide-y divide-[rgb(var(--border))] border-y border-[rgb(var(--border))]">
            {options.map((option, index) => <label key={index} className="flex items-center gap-4 py-4"><span className="w-7 text-xs font-black text-cyan-600">0{index + 1}</span><input value={option} onChange={(event) => updateOption(index, event.target.value)} placeholder={`Startoption ${index + 1}`} className="min-w-0 flex-1 bg-transparent py-2 text-lg font-bold text-[rgb(var(--fg))] outline-none placeholder:font-medium placeholder:text-[rgb(var(--muted))]" /></label>)}
          </div>
          <button type="button" onClick={() => setOptions((current) => [...current, ""])} className="mt-4 text-sm font-bold text-cyan-700 hover:underline dark:text-cyan-300">+ Startoption ergänzen</button>
          {answerMode === "suggestions" ? <p className="mt-5 text-sm leading-6 text-[rgb(var(--muted))]"><strong className="text-[rgb(var(--fg))]">Eigene Beiträge sind an.</strong> Die Startoptionen geben Orientierung, ohne andere Perspektiven auszuschließen.</p> : null}
          <div className="mt-8 flex items-center justify-between"><button type="button" onClick={() => setStep(2)} className="text-sm font-bold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">← Zurück</button><button type="button" disabled={!canFinish} onClick={finish} className="inline-flex min-h-13 items-center rounded-full bg-cyan-500 px-7 py-3 font-black text-slate-950 disabled:opacity-30">Vorschau ansehen →</button></div>
        </div> : null}

        {step === 4 ? <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
          <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">Das war's.</p>
          <h1 className="mt-3 text-balance text-4xl font-black tracking-[-0.04em] text-[rgb(var(--fg))] sm:text-5xl">Deine Frage steht.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[rgb(var(--muted))]">So beginnt die Erfahrung für deine Teilnehmenden. Du musst jetzt nichts weiter ausfüllen.</p>

          <div className="mt-9 overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.2)] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Vorschau</p>
            <h2 className="mt-4 text-balance text-2xl font-black leading-tight sm:text-3xl">{question}</h2>
            <div className="mt-7 divide-y divide-white/15 border-y border-white/15">
              {visibleOptions.map((option, index) => <div key={`${option}-${index}`} className="flex items-center justify-between gap-4 py-4"><span className="text-base font-bold">{option}</span><span className="text-sm text-cyan-300">Auswählen →</span></div>)}
              {answerMode === "suggestions" ? <div className="flex items-center justify-between gap-4 py-4"><span className="text-base font-bold">Etwas fehlt?</span><span className="text-sm text-cyan-300">Eigene Perspektive ergänzen +</span></div> : null}
            </div>
            {answerMode === "suggestions" ? <p className="mt-5 text-sm leading-6 text-slate-300">Nach der ersten Position kann eDebatte weitere Vorschläge, Gründe, Erfahrungen und Quellen aufnehmen – statt nur einen Prozentwert zurückzugeben.</p> : null}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">Frage noch ändern</button>
            <div className="flex flex-col gap-2 sm:items-end">
              <button type="button" onClick={openDetails} className="inline-flex min-h-13 items-center justify-center rounded-full bg-cyan-500 px-7 py-3 font-black text-slate-950">Freigabe & Teilen →</button>
              <span className="text-xs text-[rgb(var(--muted))]">Sichtbarkeit oder KI nur ändern, wenn du es möchtest.</span>
            </div>
          </div>
        </div> : null}
      </div>
      <p className="mt-5 text-center text-xs text-[rgb(var(--muted))]">Nichts wird automatisch veröffentlicht.</p>
    </section>
  );
}
