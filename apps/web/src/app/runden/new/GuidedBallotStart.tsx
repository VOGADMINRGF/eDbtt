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

  const configuredOptions = options.filter((option) => option.trim().length > 0).length;
  const canContinueQuestion = question.trim().length >= 8;
  const canFinish = canContinueQuestion && configuredOptions >= 2;

  function updateOption(index: number, value: string) {
    setOptions((current) => current.map((option, optionIndex) => optionIndex === index ? value : option));
  }

  function finish() {
    if (!canFinish) return;
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
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("details", "1");
    window.location.assign(nextUrl.toString());
  }

  return (
    <section className="mx-auto w-full max-w-3xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Deine Abstimmung</p>
        <div className="flex items-center gap-2" aria-label={`Schritt ${step} von 3`}>
          {[1, 2, 3].map((number) => <span key={number} className={`h-2 rounded-full transition-all ${number === step ? "w-10 bg-cyan-500" : number < step ? "w-4 bg-cyan-300" : "w-4 bg-[rgb(var(--border))]"}`} />)}
        </div>
      </div>

      <div className="min-h-[32rem]">
        {step === 1 ? <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm font-semibold text-[rgb(var(--muted))]">Schritt 1 von 3</p>
          <h1 className="mt-3 text-balance text-4xl font-black tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-5xl">Was möchtest du gemeinsam klären?</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[rgb(var(--muted))]">Ein Satz reicht. Keine Beschreibung, kein Formular, kein Setup.</p>
          <textarea autoFocus value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} placeholder="Was sollten wir mit unserem zusätzlichen Budget zuerst umsetzen?" className="mt-10 w-full resize-none border-0 border-b-2 border-[rgb(var(--border))] bg-transparent px-0 py-4 text-2xl font-bold leading-9 text-[rgb(var(--fg))] outline-none transition focus:border-cyan-500" />
          <div className="mt-8 flex justify-end"><button type="button" disabled={!canContinueQuestion} onClick={() => setStep(2)} className="inline-flex min-h-13 items-center rounded-full bg-cyan-500 px-7 py-3 font-black text-slate-950 disabled:opacity-30">Weiter →</button></div>
        </div> : null}

        {step === 2 ? <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm font-semibold text-[rgb(var(--muted))]">Schritt 2 von 3</p>
          <h2 className="mt-3 text-balance text-4xl font-black tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-5xl">Wie offen soll die Antwort sein?</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[rgb(var(--muted))]">Du kannst Antworten vorgeben – oder Raum für bessere Ideen lassen.</p>

          <div className="mt-10 border-y border-[rgb(var(--border))]">
            <button type="button" onClick={() => setAnswerMode("suggestions")} className="flex w-full items-start justify-between gap-5 border-b border-[rgb(var(--border))] py-6 text-left">
              <div><div className="flex items-center gap-3"><span className="text-xl font-black text-[rgb(var(--fg))]">Auswahl + eigene Antwort</span><span className="rounded-full bg-cyan-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-950">Empfohlen</span></div><p className="mt-2 max-w-xl text-sm leading-6 text-[rgb(var(--muted))]">Menschen wählen aus deinen Optionen oder schlagen etwas Besseres vor. Neue Vorschläge prüfst du vor der Sichtbarkeit.</p></div>
              <span aria-hidden="true" className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${answerMode === "suggestions" ? "border-cyan-500 bg-cyan-500 text-slate-950" : "border-[rgb(var(--border))]"}`}>{answerMode === "suggestions" ? "✓" : ""}</span>
            </button>
            <button type="button" onClick={() => setAnswerMode("fixed")} className="flex w-full items-start justify-between gap-5 py-6 text-left">
              <div><span className="text-xl font-black text-[rgb(var(--fg))]">Nur feste Antworten</span><p className="mt-2 max-w-xl text-sm leading-6 text-[rgb(var(--muted))]">Gut, wenn die Auswahl bereits vollständig und klar abgegrenzt ist.</p></div>
              <span aria-hidden="true" className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${answerMode === "fixed" ? "border-cyan-500 bg-cyan-500 text-slate-950" : "border-[rgb(var(--border))]"}`}>{answerMode === "fixed" ? "✓" : ""}</span>
            </button>
          </div>

          <div className="mt-8 flex items-center justify-between"><button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">← Zurück</button><button type="button" onClick={() => setStep(3)} className="inline-flex min-h-13 items-center rounded-full bg-cyan-500 px-7 py-3 font-black text-slate-950">Antworten festlegen →</button></div>
        </div> : null}

        {step === 3 ? <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm font-semibold text-[rgb(var(--muted))]">Schritt 3 von 3</p>
          <h2 className="mt-3 text-balance text-4xl font-black tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-5xl">Welche Antworten sollen zuerst sichtbar sein?</h2>
          <p className="mt-4 text-base leading-7 text-[rgb(var(--muted))]">Zwei reichen. Mehr kannst du jederzeit ergänzen.</p>
          <div className="mt-9 divide-y divide-[rgb(var(--border))] border-y border-[rgb(var(--border))]">
            {options.map((option, index) => <label key={index} className="flex items-center gap-4 py-4"><span className="w-7 text-xs font-black text-cyan-600">0{index + 1}</span><input value={option} onChange={(event) => updateOption(index, event.target.value)} placeholder={`Antwort ${index + 1}`} className="min-w-0 flex-1 bg-transparent py-2 text-lg font-bold text-[rgb(var(--fg))] outline-none placeholder:font-medium placeholder:text-[rgb(var(--muted))]" /></label>)}
          </div>
          <button type="button" onClick={() => setOptions((current) => [...current, ""])} className="mt-4 text-sm font-bold text-cyan-700 hover:underline dark:text-cyan-300">+ Antwort ergänzen</button>
          {answerMode === "suggestions" ? <p className="mt-5 text-sm leading-6 text-[rgb(var(--muted))]"><strong className="text-[rgb(var(--fg))]">Eigene Vorschläge sind an.</strong> Teilnehmende können zusätzliche Antworten einbringen; du prüfst sie, bevor sie sichtbar werden.</p> : null}
          <div className="mt-8 flex items-center justify-between"><button type="button" onClick={() => setStep(2)} className="text-sm font-bold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">← Zurück</button><button type="button" disabled={!canFinish} onClick={finish} className="inline-flex min-h-13 items-center rounded-full bg-cyan-500 px-7 py-3 font-black text-slate-950 disabled:opacity-30">Fertig →</button></div>
        </div> : null}
      </div>
      <p className="mt-5 text-center text-xs text-[rgb(var(--muted))]">Nichts wird automatisch veröffentlicht.</p>
    </section>
  );
}
