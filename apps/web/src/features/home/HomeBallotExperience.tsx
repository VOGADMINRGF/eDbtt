"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useLocale } from "@/context/LocaleContext";
import { buildFreeBallotStartHref } from "@features/pricing/goToMarketPackaging";

type Choice = {
  id: string;
  de: string;
  en: string;
};

const SAMPLE = {
  title: {
    de: "Wir haben 5.000 € zusätzliches Budget. Was sollten wir zuerst umsetzen?",
    en: "We have an extra €5,000 budget. What should we do first?",
  },
  choices: [
    { id: "equipment", de: "Ausstattung verbessern", en: "Improve equipment" },
    { id: "event", de: "Gemeinsames Event", en: "Community event" },
    { id: "members", de: "Neue Mitglieder gewinnen", en: "Attract new members" },
  ] satisfies Choice[],
};

export function HomeBallotExperience() {
  const { locale } = useLocale();
  const language = locale === "de" ? "de" : "en";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const resultRef = useRef<globalThis.HTMLDivElement>(null);
  const selectedChoice = SAMPLE.choices.find((choice) => choice.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId) resultRef.current?.focus();
  }, [selectedId]);

  return (
    <section
      aria-labelledby="home-ballot-question"
      className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-7"
      data-home-ballot-source="product-example"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
          {language === "de" ? "Probier es direkt aus" : "Try it now"}
        </span>
        <span className="rounded-full bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
          {language === "de" ? "Interaktives Beispiel" : "Interactive example"}
        </span>
      </div>

      <h2 id="home-ballot-question" className="mt-5 text-balance text-2xl font-bold leading-tight text-[color:var(--foreground)] sm:text-3xl">
        {SAMPLE.title[language]}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
        {language === "de" ? "Wähle spontan eine Antwort." : "Choose an answer spontaneously."}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3" role="group" aria-label={language === "de" ? "Antwort auswählen" : "Choose an answer"}>
        {SAMPLE.choices.map((choice) => {
          const active = selectedId === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSelectedId(choice.id)}
              className={`min-h-24 rounded-2xl border px-4 py-4 text-left text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ${
                active
                  ? "border-cyan-500 bg-cyan-500 text-slate-950 shadow-md"
                  : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)] hover:-translate-y-0.5 hover:border-cyan-400"
              }`}
            >
              <span className="block text-lg">{choice[language]}</span>
              <span className="mt-3 block text-xs font-medium opacity-70">{active ? (language === "de" ? "Deine Auswahl ✓" : "Your choice ✓") : (language === "de" ? "Auswählen →" : "Choose →")}</span>
            </button>
          );
        })}
      </div>

      {selectedChoice ? (
        <div ref={resultRef} tabIndex={-1} aria-live="polite" className="mt-5 rounded-2xl border border-cyan-300 bg-cyan-50 p-4 text-cyan-950 outline-none dark:border-cyan-400/30 dark:bg-cyan-950/25 dark:text-cyan-50">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
            {language === "de" ? "Jetzt beginnt der Unterschied" : "This is where the difference begins"}
          </p>
          <p className="mt-2 font-bold">{language === "de" ? `Deine Position: ${selectedChoice.de}` : `Your position: ${selectedChoice.en}`}</p>
          <p className="mt-2 text-sm leading-6">
            {language === "de"
              ? "Eine klassische Umfrage würde hier im Wesentlichen zählen. eDebatte ist dafür gebaut, danach weiterzugehen: Was fehlt? Warum wählen Menschen so? Welche Quelle oder Erfahrung gehört dazu? Welche neue Option entsteht?"
              : "A traditional survey would mostly count from here. eDebatte is designed to continue: What is missing? Why do people choose this? Which source or experience matters? Which new option emerges?"}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-white/70 px-3 py-3 text-sm text-slate-800 dark:bg-white/10 dark:text-cyan-50">
              <strong className="block">{language === "de" ? "+ Eigene Antwort" : "+ Own answer"}</strong>
              <span className="mt-1 block text-xs leading-5 opacity-80">{language === "de" ? "Menschen können ergänzen, wenn deine Auswahl nicht reicht." : "People can add an option when your choices are not enough."}</span>
            </div>
            <div className="rounded-xl bg-white/70 px-3 py-3 text-sm text-slate-800 dark:bg-white/10 dark:text-cyan-50">
              <strong className="block">{language === "de" ? "+ Warum & wodurch belegt?" : "+ Why & supported by what?"}</strong>
              <span className="mt-1 block text-xs leading-5 opacity-80">{language === "de" ? "Begründungen, Quellen und offene Punkte können zum Ergebnis gehören." : "Reasons, sources and open questions can become part of the result."}</span>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 opacity-80">
            {language === "de" ? "Dieses Beispiel zeigt bewusst kein erfundenes Gruppenergebnis." : "This example deliberately does not show a fabricated group result."}
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-[color:var(--muted)]">
          {language === "de" ? "Du hast selbst etwas zu klären?" : "Have something to decide yourself?"}
        </p>
        <Link href={buildFreeBallotStartHref(undefined, "homepage-ballot")} className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:bg-white dark:text-slate-950">
          {language === "de" ? "Eigene Abstimmung kostenlos starten" : "Start your own ballot for free"}
        </Link>
      </div>
    </section>
  );
}
