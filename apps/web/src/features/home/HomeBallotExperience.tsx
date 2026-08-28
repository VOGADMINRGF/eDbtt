"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useLocale } from "@/context/LocaleContext";
import { buildFreeBallotStartHref } from "@features/pricing/goToMarketPackaging";

const CHOICES = [
  { id: "equipment", de: "Ausstattung verbessern", en: "Improve equipment" },
  { id: "event", de: "Gemeinsames Event", en: "Community event" },
  { id: "members", de: "Neue Mitglieder gewinnen", en: "Attract new members" },
] as const;

export function HomeBallotExperience() {
  const { locale } = useLocale();
  const language = locale === "de" ? "de" : "en";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const resultRef = useRef<globalThis.HTMLDivElement>(null);
  const selected = CHOICES.find((choice) => choice.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId) resultRef.current?.focus();
  }, [selectedId]);

  return (
    <div className="space-y-4">
      <section aria-labelledby="home-ballot-question" className="relative overflow-hidden rounded-[2.25rem] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-5 py-6 shadow-[0_28px_90px_rgba(15,23,42,0.14)] sm:px-8 sm:py-8">
        <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.16em] text-[color:var(--muted)]">
          <span>{language === "de" ? "1 Frage · direkt ausprobieren" : "1 question · try it now"}</span>
          <span className="text-cyan-600">01</span>
        </div>

        <h2 id="home-ballot-question" className="mt-5 max-w-3xl text-balance text-2xl font-black leading-tight tracking-[-0.025em] text-[color:var(--foreground)] sm:text-4xl">
          {language === "de" ? "Wir haben 5.000 € zusätzlich. Was sollten wir zuerst umsetzen?" : "We have an extra €5,000. What should we do first?"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
          {language === "de" ? "Tippe eine Option. Danach siehst du, was eDebatte anders macht." : "Choose one option. Then see what makes eDebatte different."}
        </p>

        <div className="mt-7 flex flex-wrap gap-2.5" role="group" aria-label={language === "de" ? "Antwort auswählen" : "Choose an answer"}>
          {CHOICES.map((choice) => {
            const active = choice.id === selectedId;
            return (
              <button key={choice.id} type="button" aria-pressed={active} onClick={() => setSelectedId(choice.id)} className={`rounded-full border px-5 py-3 text-sm font-bold transition ${active ? "border-cyan-500 bg-cyan-500 text-slate-950 shadow-md" : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)] hover:border-cyan-400 hover:-translate-y-0.5"}`}>
                {choice[language]}
              </button>
            );
          })}
        </div>

        {selected ? (
          <div ref={resultRef} tabIndex={-1} aria-live="polite" className="mt-8 border-t border-[color:var(--border)] pt-6 outline-none">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-600">{language === "de" ? "Jetzt beginnt der Unterschied" : "This is where the difference begins"}</p>
            <p className="mt-3 text-lg font-black text-[color:var(--foreground)]">{language === "de" ? `Deine Position: ${selected.de}` : `Your position: ${selected.en}`}</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
              {language === "de" ? "Eine klassische Umfrage würde jetzt zählen. eDebatte kann danach öffnen: Fehlt eine bessere Antwort? Warum entscheidest du so? Gibt es eine Erfahrung oder Quelle dazu? Was bleibt offen?" : "A classic survey would count now. eDebatte can go further: is a better answer missing? Why did you choose this? Is there an experience or source behind it? What remains open?"}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-[color:var(--foreground)]">
              <span>＋ {language === "de" ? "eigene Antwort" : "own answer"}</span>
              <span>↳ {language === "de" ? "Warum?" : "Why?"}</span>
              <span>↗ {language === "de" ? "Quelle / Erfahrung" : "Source / experience"}</span>
              <span>→ {language === "de" ? "nächster Schritt" : "next step"}</span>
            </div>
          </div>
        ) : null}

        <div className="mt-7 flex items-center justify-between gap-4 border-t border-[color:var(--border)] pt-5">
          <span className="text-xs text-[color:var(--muted)]">{language === "de" ? "Keine Anmeldung zum Ausprobieren" : "No sign-up to try"}</span>
          <Link href={buildFreeBallotStartHref(undefined, "homepage-ballot")} className="text-sm font-black text-cyan-700 hover:underline dark:text-cyan-300">{language === "de" ? "Eigene Frage starten →" : "Start your own question →"}</Link>
        </div>
      </section>

      <section className="grid gap-4 rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-5 text-left sm:grid-cols-[auto_1fr] sm:items-center sm:px-7" aria-label={language === "de" ? "Premium Vorschau" : "Premium preview"}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-xl text-white" aria-hidden="true">↑</div>
        <div>
          <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Premium</span><span className="text-xs font-semibold text-[color:var(--muted)]">{language === "de" ? "Dossier statt Frage für Frage" : "Dossier instead of question by question"}</span></div>
          <p className="mt-1 text-sm leading-6 text-[color:var(--foreground)]">{language === "de" ? "Geplant: Parteiprogramm, Studie, Vereins- oder Unternehmensunterlagen hochladen – eDebatte bereitet daraus mehrere Fragen und mögliche Antworten zur Prüfung vor. Du entscheidest, was davon verwendet wird." : "Planned: upload a party programme, study, club or company documents – eDebatte prepares multiple questions and possible answers for review. You decide what is used."}</p>
        </div>
      </section>
    </div>
  );
}
