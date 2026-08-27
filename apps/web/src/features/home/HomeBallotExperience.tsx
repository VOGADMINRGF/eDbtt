"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { useLocale } from "@/context/LocaleContext";
import { usePrivacyGate } from "@/components/privacy/PrivacyGateProvider";
import type { SwipeDecision, SwipeItem } from "@/features/swipes/types";
import { buildFreeBallotStartHref } from "@features/pricing/goToMarketPackaging";

type Choice = {
  id: string;
  label: string;
  decision?: SwipeDecision;
};

const SAMPLE = {
  id: "gtm-product-example",
  title: {
    de: "Was sollte bei einer gemeinsamen Entscheidung zuerst zählen?",
    en: "What should matter first in a shared decision?",
  },
  choices: {
    de: ["Betroffene hören", "Folgen prüfen", "Gemeinsam priorisieren"],
    en: ["Hear those affected", "Check the impact", "Set priorities together"],
  },
} as const;

export function HomeBallotExperience() {
  const { locale } = useLocale();
  const { ensureActiveProcessingAllowed } = usePrivacyGate();
  const language = locale === "de" ? "de" : "en";
  const [liveItem, setLiveItem] = useState<SwipeItem | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "local" | "error">(
    "idle",
  );
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/swipes/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filter: {}, limit: 1 }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = (await response.json()) as { items?: SwipeItem[] };
        const candidate = payload.items?.[0] ?? null;
        if (!candidate || candidate.id.startsWith("seed-")) return null;
        return candidate;
      })
      .then((candidate) => {
        if (candidate) setLiveItem(candidate);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (selectedId) resultRef.current?.focus();
  }, [selectedId]);

  const choices = useMemo<Choice[]>(() => {
    if (!liveItem) {
      return SAMPLE.choices[language].map((label, index) => ({
        id: `sample-${index}`,
        label,
      }));
    }

    return [
      { id: "agree", label: language === "de" ? "Dafür" : "In favour", decision: "agree" },
      { id: "neutral", label: language === "de" ? "Noch offen" : "Still open", decision: "neutral" },
      { id: "disagree", label: language === "de" ? "Dagegen" : "Against", decision: "disagree" },
    ];
  }, [language, liveItem]);

  const selectedChoice = choices.find((choice) => choice.id === selectedId) ?? null;
  const question = liveItem?.title ?? SAMPLE.title[language];

  async function selectChoice(choice: Choice) {
    setSelectedId(choice.id);

    if (!liveItem || !choice.decision) {
      setSaveState("local");
      return;
    }

    const acknowledged = ensureActiveProcessingAllowed("homepage-ballot");
    if (!acknowledged) {
      setSaveState("local");
      return;
    }

    setSaveState("saving");
    try {
      const response = await fetch("/api/swipes/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementId: liveItem.id, decision: choice.decision }),
      });
      setSaveState(response.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  }

  return (
    <section
      aria-labelledby="home-ballot-question"
      className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-7"
      data-home-ballot-source={liveItem ? "runtime" : "product-example"}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
        <span>{language === "de" ? "Direkt ausprobieren" : "Try it now"}</span>
        <span className="rounded-full bg-[color:var(--surface-muted)] px-3 py-1 normal-case tracking-normal">
          {liveItem
            ? language === "de"
              ? "Aktuelle Frage"
              : "Current question"
            : language === "de"
              ? "Interaktives Beispiel"
              : "Interactive example"}
        </span>
      </div>

      <h2
        id="home-ballot-question"
        className="mt-5 text-balance text-2xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-3xl"
      >
        {question}
      </h2>

      <div className="mt-6 grid gap-3" role="group" aria-label={language === "de" ? "Antwort auswählen" : "Choose an answer"}>
        {choices.map((choice) => {
          const active = selectedId === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              aria-pressed={active}
              onClick={() => void selectChoice(choice)}
              className={`min-h-12 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ${
                active
                  ? "border-cyan-500 bg-cyan-500 text-slate-950"
                  : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)] hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
              }`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>

      {selectedChoice ? (
        <div
          ref={resultRef}
          tabIndex={-1}
          aria-live="polite"
          className="mt-5 rounded-2xl border border-cyan-400/50 bg-cyan-50 p-4 text-sm text-slate-800 outline-none dark:bg-cyan-950/30 dark:text-cyan-50"
        >
          <p className="font-semibold">
            {language === "de" ? "Deine Position:" : "Your position:"} {selectedChoice.label}
          </p>
          <p className="mt-1 text-xs leading-relaxed">
            {!liveItem || saveState === "local"
              ? language === "de"
                ? "Das ist deine Auswahl in diesem Beispiel – kein erfundenes Gruppenergebnis."
                : "This is your choice in the example—not an invented group result."
              : saveState === "saving"
                ? language === "de"
                  ? "Deine Position wird gespeichert …"
                  : "Saving your position …"
                : saveState === "saved"
                  ? language === "de"
                    ? "Deine Position wurde gespeichert. Ergebnisse entstehen aus den abgegebenen Positionen."
                    : "Your position was saved. Results emerge from submitted positions."
                  : language === "de"
                    ? "Deine Auswahl ist sichtbar; das Speichern ist gerade nicht verfügbar."
                    : "Your choice is visible; saving is currently unavailable."}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-xs leading-relaxed text-[color:var(--muted)]">
          {language === "de"
            ? "Eine Auswahl genügt. Bei echten Fragen werden Ergebnisse nur aus tatsächlich abgegebenen Positionen gebildet."
            : "One choice is enough. For real questions, results only use positions that people actually submit."}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <Link
          href={buildFreeBallotStartHref(undefined, "homepage-ballot")}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:bg-white dark:text-slate-950"
        >
          {language === "de" ? "Eigene Abstimmung kostenlos starten" : "Start your own ballot for free"}
        </Link>
        <Link href="/swipes" className="text-center text-sm font-semibold text-cyan-700 underline-offset-4 hover:underline dark:text-cyan-300">
          {language === "de" ? "Weitere Fragen" : "More questions"}
        </Link>
      </div>
    </section>
  );
}
