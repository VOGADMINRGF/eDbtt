"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { getGoToMarketTemplate } from "@features/pricing/goToMarketPackaging";
import {
  createEmptyManualAnlassraumSetup,
  sanitizeManualAnlassraumSetup,
  type ManualAnlassraumAiSupportMode,
  type ManualAnlassraumCommunityOptionsMode,
  type ManualAnlassraumSetup,
} from "@/features/surfaces/runden/manualAnlassraumSetup";

const STORAGE_KEY = "manual-anlassraum-setup.v1";

type Props = { initialTemplateId?: string | null };
type AnswerMode = "fixed" | "suggestions";
type VoxyMode = "shared_intelligence" | "manual_only";

function saveSetup(setup: ManualAnlassraumSetup) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeManualAnlassraumSetup(setup)));
}

export default function GuidedBallotStart({ initialTemplateId = null }: Props) {
  const template = useMemo(() => getGoToMarketTemplate(initialTemplateId), [initialTemplateId]);
  const [step, setStep] = useState(1);
  const [question, setQuestion] = useState(template?.question.de ?? "");
  const [options, setOptions] = useState<string[]>(template ? [...template.options.de] : ["", "", ""]);
  const [answerMode, setAnswerMode] = useState<AnswerMode>("suggestions");
  const [voxyMode, setVoxyMode] = useState<VoxyMode>("shared_intelligence");

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
    const aiSupportMode: ManualAnlassraumAiSupportMode = voxyMode === "shared_intelligence" ? "optional_suggestions" : "disabled";
    const setup = sanitizeManualAnlassraumSetup({
      ...createEmptyManualAnlassraumSetup(),
      title: question.trim().replace(/[?.!]$/, "").slice(0, 120),
      votingQuestion: question,
      description: "",
      options,
      communityOptionsMode,
      aiSupportMode,
      visibility: "private_draft",
      scope: "public",
      nextStep: "save_draft",
    });
    saveSetup(setup);
  }

  function finishQuestionSetup() {
    if (!canFinish) return;
    setStep(4);
  }

  function finishVoxyChoice() {
    persistCurrentSetup();
    setStep(5);
  }

  function openDetails() {
    persistCurrentSetup();
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("details", "1");
    window.location.assign(nextUrl.toString());
  }

  const loginNext = "/runden/new?gtm=1&details=1&source=guided-share";

  return (
    <section className="mx-auto w-full max-w-3xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Eine Frage starten</p>
        {step <= 4 ? (
          <div className="flex items-center gap-2" aria-label={`Schritt ${step} von 4`}>
            {[1, 2, 3, 4].map((number) => <span key={number} className={`h-2 rounded-full transition-all ${number === step ? "w-10 bg-cyan-500" : number < step ? "w-4 bg-cyan-300" : "w-4 bg-[rgb(var(--border))]"}`} />)}
          </div>
        ) : <span className="text-xs font-black uppercase tracking-[0.14em] text-cyan-600">Bereit</span>}
      </div>

      <div className="min-h-[32rem]">
        {step === 1 ? <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm font-semibold text-[rgb(var(--muted))]">Schritt 1 von 4</p>
          <h1 className="mt-3 text-balance text-4xl font-black tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-5xl">Was möchtest du herausfinden oder gemeinsam klären?</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[rgb(var(--muted))]">Ein Satz reicht – egal ob Entscheidung, Feedback, Leserfrage oder neue Idee.</p>
          <textarea autoFocus value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} placeholder="Zum Beispiel: Welchen Aspekt sollten wir als Nächstes genauer untersuchen?" className="mt-10 w-full resize-none border-0 border-b-2 border-[rgb(var(--border))] bg-transparent px-0 py-4 text-2xl font-bold leading-9 text-[rgb(var(--fg))] outline-none transition focus:border-cyan-500" />
          <div className="mt-8 flex justify-end"><button type="button" disabled={!canContinueQuestion} onClick={() => setStep(2)} className="inline-flex min-h-13 items-center rounded-full bg-cyan-500 px-7 py-3 font-black text-slate-950 disabled:opacity-30">Weiter →</button></div>
        </div> : null}

        {step === 2 ? <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm font-semibold text-[rgb(var(--muted))]">Schritt 2 von 4</p>
          <h2 className="mt-3 text-balance text-4xl font-black tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-5xl">Wie sollen Menschen antworten?</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[rgb(var(--muted))]">Du gibst Orientierung. Die Teilnehmenden können trotzdem ergänzen, was du noch nicht bedacht hast.</p>
          <div className="mt-10 border-y border-[rgb(var(--border))]">
            <button type="button" onClick={() => setAnswerMode("suggestions")} className="flex w-full items-start justify-between gap-5 border-b border-[rgb(var(--border))] py-6 text-left">
              <div><div className="flex flex-wrap items-center gap-3"><span className="text-xl font-black text-[rgb(var(--fg))]">Auswahl + eigene Beiträge</span><span className="rounded-full bg-cyan-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-950">Empfohlen</span></div><p className="mt-2 max-w-xl text-sm leading-6 text-[rgb(var(--muted))]">Startoptionen wählen und zusätzlich Perspektiven, Ideen oder Alternativen ergänzen.</p></div>
              <span aria-hidden="true" className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${answerMode === "suggestions" ? "border-cyan-500 bg-cyan-500 text-slate-950" : "border-[rgb(var(--border))]"}`}>{answerMode === "suggestions" ? "✓" : ""}</span>
            </button>
            <button type="button" onClick={() => setAnswerMode("fixed")} className="flex w-full items-start justify-between gap-5 py-6 text-left">
              <div><span className="text-xl font-black text-[rgb(var(--fg))]">Nur feste Antworten</span><p className="mt-2 max-w-xl text-sm leading-6 text-[rgb(var(--muted))]">Wenn deine Auswahl bereits vollständig und klar abgegrenzt ist.</p></div>
              <span aria-hidden="true" className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${answerMode === "fixed" ? "border-cyan-500 bg-cyan-500 text-slate-950" : "border-[rgb(var(--border))]"}`}>{answerMode === "fixed" ? "✓" : ""}</span>
            </button>
          </div>
          <div className="mt-8 flex items-center justify-between"><button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">← Zurück</button><button type="button" onClick={() => setStep(3)} className="inline-flex min-h-13 items-center rounded-full bg-cyan-500 px-7 py-3 font-black text-slate-950">Startantworten →</button></div>
        </div> : null}

        {step === 3 ? <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm font-semibold text-[rgb(var(--muted))]">Schritt 3 von 4</p>
          <h2 className="mt-3 text-balance text-4xl font-black tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-5xl">Womit sollen Menschen anfangen?</h2>
          <p className="mt-4 text-base leading-7 text-[rgb(var(--muted))]">Zwei Startoptionen reichen. Mehr ist für den Start nicht nötig.</p>
          <div className="mt-9 divide-y divide-[rgb(var(--border))] border-y border-[rgb(var(--border))]">
            {options.map((option, index) => <label key={index} className="flex items-center gap-4 py-4"><span className="w-7 text-xs font-black text-cyan-600">0{index + 1}</span><input value={option} onChange={(event) => updateOption(index, event.target.value)} placeholder={`Startoption ${index + 1}`} className="min-w-0 flex-1 bg-transparent py-2 text-lg font-bold text-[rgb(var(--fg))] outline-none placeholder:font-medium placeholder:text-[rgb(var(--muted))]" /></label>)}
          </div>
          <button type="button" onClick={() => setOptions((current) => [...current, ""])} className="mt-4 text-sm font-bold text-cyan-700 hover:underline dark:text-cyan-300">+ Startoption ergänzen</button>
          <div className="mt-8 flex items-center justify-between"><button type="button" onClick={() => setStep(2)} className="text-sm font-bold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">← Zurück</button><button type="button" disabled={!canFinish} onClick={finishQuestionSetup} className="inline-flex min-h-13 items-center rounded-full bg-cyan-500 px-7 py-3 font-black text-slate-950 disabled:opacity-30">Weiter →</button></div>
        </div> : null}

        {step === 4 ? <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm font-semibold text-[rgb(var(--muted))]">Schritt 4 von 4</p>
          <h2 className="mt-3 text-balance text-4xl font-black tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-5xl">Soll Voxy aus bisherigen Befragungen mitdenken?</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[rgb(var(--muted))]">Du entscheidest, ob Voxy dir passende Hinweise aus der gemeinsamen, anonymisierten Wissensbasis anbietet. Deine Kontrolle über Frage, Antworten und Veröffentlichung bleibt gleich.</p>
          <div className="mt-10 border-y border-[rgb(var(--border))]">
            <button type="button" onClick={() => setVoxyMode("shared_intelligence")} className="flex w-full items-start justify-between gap-5 border-b border-[rgb(var(--border))] py-6 text-left">
              <div><div className="flex flex-wrap items-center gap-3"><span className="text-xl font-black text-[rgb(var(--fg))]">Ja – von bisherigen Befragungen profitieren</span><span className="rounded-full bg-cyan-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-950">Mit Voxy</span></div><p className="mt-2 max-w-xl text-sm leading-6 text-[rgb(var(--muted))]">Voxy darf dir aus bereits vorhandenen, anonymisierten und aggregierten Erkenntnissen passende Fragen, Antwortideen oder offene Punkte vorschlagen. Du entscheidest, was du übernimmst.</p></div>
              <span aria-hidden="true" className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${voxyMode === "shared_intelligence" ? "border-cyan-500 bg-cyan-500 text-slate-950" : "border-[rgb(var(--border))]"}`}>{voxyMode === "shared_intelligence" ? "✓" : ""}</span>
            </button>
            <button type="button" onClick={() => setVoxyMode("manual_only")} className="flex w-full items-start justify-between gap-5 py-6 text-left">
              <div><span className="text-xl font-black text-[rgb(var(--fg))]">Nein – nur meine eigene Befragung</span><p className="mt-2 max-w-xl text-sm leading-6 text-[rgb(var(--muted))]">Voxy macht keine Vorschläge aus früheren Befragungen. Du stellst deine Fragen und legst deine Antworten vollständig selbst fest.</p></div>
              <span aria-hidden="true" className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${voxyMode === "manual_only" ? "border-cyan-500 bg-cyan-500 text-slate-950" : "border-[rgb(var(--border))]"}`}>{voxyMode === "manual_only" ? "✓" : ""}</span>
            </button>
          </div>
          <div className="mt-6 border-l-2 border-cyan-400 pl-5"><p className="text-sm font-black text-[rgb(var(--fg))]">Beide Wege tragen zum gemeinsamen Bild bei.</p><p className="mt-1 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">Geeignete Ergebnisse sollen unabhängig von der Voxy-Auswahl nur anonymisiert bzw. aggregiert in die gemeinsame Wissensbasis einfließen. Keine persönlichen Profile, kein politisches Scoring und kein automatischer Anspruch auf Repräsentativität.</p></div>
          <div className="mt-8 flex items-center justify-between"><button type="button" onClick={() => setStep(3)} className="text-sm font-bold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">← Zurück</button><button type="button" onClick={finishVoxyChoice} className="inline-flex min-h-13 items-center rounded-full bg-cyan-500 px-7 py-3 font-black text-slate-950">Vorschau & Teilen →</button></div>
        </div> : null}

        {step === 5 ? <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
          <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">Fertig.</p>
          <h1 className="mt-3 text-balance text-4xl font-black tracking-[-0.04em] text-[rgb(var(--fg))] sm:text-5xl">Deine Frage kann raus.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[rgb(var(--muted))]">So sehen Teilnehmende den Einstieg. Zum dauerhaften Erstellen und Teilen meldest du dich einmal an.</p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-bold text-[rgb(var(--muted))]">{voxyMode === "shared_intelligence" ? "Voxy: gemeinsame Wissensbasis nutzen" : "Voxy: aus"}</div>
          <div className="mt-7 overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.2)] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Teilnehmeransicht</p>
            <h2 className="mt-4 text-balance text-2xl font-black leading-tight sm:text-3xl">{question}</h2>
            <div className="mt-7 divide-y divide-white/15 border-y border-white/15">
              {visibleOptions.map((option, index) => <div key={`${option}-${index}`} className="flex items-center justify-between gap-4 py-4"><span className="text-base font-bold">{option}</span><span className="text-sm text-cyan-300">Auswählen →</span></div>)}
              {answerMode === "suggestions" ? <div className="flex items-center justify-between gap-4 py-4"><span className="text-base font-bold">Etwas fehlt?</span><span className="text-sm text-cyan-300">Eigene Perspektive +</span></div> : null}
            </div>
          </div>
          <div className="mt-7 grid gap-4 rounded-[1.75rem] border border-cyan-500/30 bg-cyan-500/5 p-5 sm:grid-cols-[8rem_1fr] sm:items-center sm:p-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-white p-3 shadow-sm" aria-hidden="true"><div className="grid h-full w-full grid-cols-5 grid-rows-5 gap-1">{[0,1,2,4,6,8,10,12,14,16,18,20,21,22,24].map((cell) => <span key={cell} className="rounded-[2px] bg-slate-950" />)}</div></div>
            <div><p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Link + QR-Code</p><h3 className="mt-1 text-xl font-black text-[rgb(var(--fg))]">Einmal anmelden. Dann direkt teilen.</h3><p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">Nach dem Speichern erzeugt eDebatte den Teilnahmelink und den echten QR-Code für Plakat, Veranstaltung, Artikel, Newsletter oder Social Media.</p><Link href={`/login?next=${encodeURIComponent(loginNext)}`} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-black text-slate-950">Anmelden & QR-Code erstellen →</Link></div>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4"><button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">Frage ändern</button><button type="button" onClick={openDetails} className="text-sm font-bold text-[rgb(var(--muted))] hover:text-cyan-700 dark:hover:text-cyan-300">Optionale Einstellungen →</button></div>
        </div> : null}
      </div>
      <p className="mt-5 text-center text-xs text-[rgb(var(--muted))]">Nichts wird automatisch veröffentlicht.</p>
    </section>
  );
}
