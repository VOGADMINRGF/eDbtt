"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  buildRundenGuidedCreateHref,
  deriveRundenFlowDraft,
  reorderOptions,
  type RundenFlowDirection,
} from "@/features/surfaces/runden/guidedQuestionBuilder";

type RundenGuidedQuestionBuilderProps = {
  returnTo: string;
  featuredAnlassraumId?: string | null;
  participationHref?: string | null;
  participationAnchorId?: string | null;
};

export default function RundenGuidedQuestionBuilder({
  returnTo,
  featuredAnlassraumId,
  participationHref,
  participationAnchorId,
}: RundenGuidedQuestionBuilderProps) {
  const [direction, setDirection] = useState<RundenFlowDirection>("prepare");
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [questionOverride, setQuestionOverride] = useState("");
  const [optionsOverride, setOptionsOverride] = useState<string[]>([]);

  const draft = useMemo(() => deriveRundenFlowDraft(input), [input]);
  const question = questionOverride.trim() || draft.question;
  const options = optionsOverride.length > 0 ? optionsOverride : draft.options;

  const prepareHref = useMemo(
    () =>
      buildRundenGuidedCreateHref({
        direction: "prepare",
        input,
        returnTo,
        anlassraumId: featuredAnlassraumId,
      }),
    [featuredAnlassraumId, input, returnTo],
  );
  const verifyHref = useMemo(
    () =>
      buildRundenGuidedCreateHref({
        direction: "verify",
        input,
        returnTo,
        anlassraumId: featuredAnlassraumId,
      }),
    [featuredAnlassraumId, input, returnTo],
  );

  const participationTarget =
    participationAnchorId && participationHref
      ? `#${participationAnchorId}`
      : participationHref ?? "/runden?view=active";

  return (
    <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Operativer Schnellstart
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">
            Anlass, Frage und Abstimmungsfähigkeit vorbereiten
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/create?mode=source" className="vog-chip vog-chip--active">
            Anlass starten
          </Link>
          <a href={participationTarget} className="vog-chip">
            Per QR/Link teilnehmen
          </a>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setDirection("prepare")}
          className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
            direction === "prepare"
              ? "border-[rgb(var(--grad-from))]/45 bg-[rgb(var(--bg))] text-[rgb(var(--fg))]"
              : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))]"
          }`}
          aria-pressed={direction === "prepare"}
        >
          <span className="font-semibold">Anlass / Beitrag / Frage vorbereiten</span>
          <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
            Thema konkretisieren und den ersten strukturierten Einstieg bauen.
          </span>
        </button>
        <button
          type="button"
          onClick={() => setDirection("verify")}
          className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
            direction === "verify"
              ? "border-[rgb(var(--grad-from))]/45 bg-[rgb(var(--bg))] text-[rgb(var(--fg))]"
              : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))]"
          }`}
          aria-pressed={direction === "verify"}
        >
          <span className="font-semibold">Prüfen / abstimmungsfähig machen</span>
          <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
            Frage schärfen, Optionen prüfen und Reihenfolge priorisieren.
          </span>
        </button>
      </div>

      <div className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
        <label htmlFor="runden-guided-input" className="text-xs font-semibold text-[rgb(var(--muted))]">
          Ausgangstext
        </label>
        <textarea
          id="runden-guided-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="mt-2 min-h-[96px] w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          placeholder="Beschreibe den Anlass, die offene Frage oder den Konflikt in 2-4 Sätzen."
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setStarted(true);
              setQuestionOverride("");
              setOptionsOverride([]);
            }}
            className="inline-flex items-center justify-center rounded-lg bg-[rgb(var(--grad-from))] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Flow starten
          </button>
          <Link
            href={direction === "verify" ? verifyHref : prepareHref}
            className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--bg))]"
          >
            {direction === "verify"
              ? "Prüfen / abstimmungsfähig machen"
              : "Ersten Beitrag / erste Frage vorbereiten"}
          </Link>
        </div>
      </div>

      {started ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">1) Anlass erkennen</p>
            <p className="mt-1 text-sm text-[rgb(var(--fg))]">{draft.occasion}</p>
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
              Nächster Schritt: Frage so formulieren, dass sie abstimmungsfähig wird.
            </p>
          </article>

          <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              2) Abstimmungsfrage vorschlagen
            </p>
            <input
              value={question}
              onChange={(event) => setQuestionOverride(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </article>

          <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              3) Antwortoptionen priorisieren
            </p>
            <ul className="mt-2 space-y-2">
              {options.map((option, index) => (
                <li
                  key={`${option}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2"
                >
                  <span className="text-sm text-[rgb(var(--fg))]">
                    {index + 1}. {option}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setOptionsOverride((prev) => reorderOptions(prev.length ? prev : options, index, index - 1))}
                      disabled={index === 0}
                      className="rounded border border-[rgb(var(--border))] px-2 py-1 text-xs text-[rgb(var(--muted))] disabled:opacity-50"
                      aria-label="Option nach oben"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => setOptionsOverride((prev) => reorderOptions(prev.length ? prev : options, index, index + 1))}
                      disabled={index === options.length - 1}
                      className="rounded border border-[rgb(var(--border))] px-2 py-1 text-xs text-[rgb(var(--muted))] disabled:opacity-50"
                      aria-label="Option nach unten"
                    >
                      ↓
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
              4) Nächste Schritte: Prüfen, abstimmungsfähig machen, dann Teilnahmelink/QR aktiv teilen.
            </p>
          </article>
        </div>
      ) : null}
    </section>
  );
}
