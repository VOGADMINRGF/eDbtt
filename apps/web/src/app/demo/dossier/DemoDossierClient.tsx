"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Dossier } from "@features/dossier";
import demoFallback from "@features/dossier/data/demoDossier";
import { DossierViewer } from "@/components/dossier/DossierViewer";
import {
  getDemoPersonaConfig,
  withPersona,
  type DemoPersona,
} from "@/features/demo/personas";
import { getDemoStatusLabel } from "@/features/demo/statusLanguage";

type ApiResponse =
  | { ok: true; serverTimestamp: string; dossier: Dossier }
  | { ok: false; error?: string };

type InlineIntent = "source" | "question" | "perspective" | "option" | "objection";
export type DemoDossierMode = "lesen" | "mitwirken" | "verwalten";

type DraftEntry = {
  id: string;
  intent: InlineIntent;
  text: string;
  link?: string;
  createdAt: string;
};

type FocusState = "offen" | "in_pruefung" | "community" | "einspruch";

const MODE_LABELS: Record<DemoDossierMode, string> = {
  lesen: "Lesen",
  mitwirken: "Mitwirken",
  verwalten: "Verwalten",
};

const INTENT_LABELS: Record<InlineIntent, string> = {
  source: "Quelle einreichen",
  question: "Frage melden",
  perspective: "Perspektive ergänzen",
  option: "Option vorschlagen",
  objection: "Widerspruch melden",
};

const DEFAULT_INTENT_BY_PERSONA: Record<DemoPersona, InlineIntent> = {
  journalist: "source",
  administration: "option",
  citizen: "perspective",
};

function roleLead(persona: DemoPersona, mode: DemoDossierMode) {
  if (mode === "lesen") {
    return "Überblick, Akte, Transparenzspur, Optionen und offene Fragen im Fokus.";
  }
  if (mode === "mitwirken") {
    return "Inline-Einreichung bleibt im Dossier-Kontext. Kein harter Seitensprung.";
  }
  if (persona === "administration") {
    return "Workflow, Zuständigkeit, Snapshot, Delegation und Audit im Fokus.";
  }
  return "Verwalten ist in der Demo für Verwaltung vorgesehen. Persona-Wechsel möglich.";
}

function jumpTo(sectionId: string) {
  const node = document.getElementById(sectionId);
  if (!node) return;
  node.scrollIntoView({ behavior: "smooth", block: "start" });
}

const MODE_FOCUS: Record<DemoDossierMode, string[]> = {
  lesen: ["Überblick", "Akte", "Transparenzspur", "Optionen", "Offene Fragen"],
  mitwirken: ["Inline-Mitwirken", "Eigene Einreichungen", "Beteiligungsstatus", "Relevante CTA"],
  verwalten: ["Workflow", "Zuständigkeit", "Snapshot", "Delegation", "Audit & Wirkung"],
};

export default function DemoDossierClient({
  persona,
  initialMode,
}: {
  persona: DemoPersona;
  initialMode: DemoDossierMode;
}) {
  const personaCfg = getDemoPersonaConfig(persona);
  const [mode, setMode] = useState<DemoDossierMode>(initialMode);
  const [dossier, setDossier] = useState<Dossier>(demoFallback);
  const [serverTimestamp, setServerTimestamp] = useState<string | null>(null);
  const [backendOk, setBackendOk] = useState(false);
  const [intent, setIntent] = useState<InlineIntent>(DEFAULT_INTENT_BY_PERSONA[persona]);
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [entries, setEntries] = useState<DraftEntry[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [focusState, setFocusState] = useState<FocusState>("offen");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/demo/dossier", { cache: "no-store" })
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((data) => {
        if (cancelled) return;
        if (data.ok) {
          setDossier(data.dossier);
          setServerTimestamp(data.serverTimestamp);
          setBackendOk(true);
        } else {
          setBackendOk(false);
        }
      })
      .catch(() => setBackendOk(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const canManage = persona === "administration";
  const manageLocked = mode === "verwalten" && !canManage;
  const submitDisabled = text.trim().length < 8;
  const statusLine = useMemo(
    () =>
      `${getDemoStatusLabel("community_submitted")} -> ${getDemoStatusLabel("in_review")} -> ${getDemoStatusLabel(
        "confirmed",
      )}`,
    [],
  );

  function handleSubmitInline() {
    if (submitDisabled) return;
    const next: DraftEntry = {
      id: `inline-${Date.now()}`,
      intent,
      text: text.trim(),
      link: link.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => [next, ...prev].slice(0, 8));
    setText("");
    setLink("");
    setNotice(`Eingang gespeichert (${getDemoStatusLabel("community_submitted")}).`);
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 py-10 lg:px-10 space-y-5">
      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-soft space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
              Demo - Dossier · {personaCfg.label}
            </p>
            <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">Digitale Entscheidungsakte</h2>
            <p className="text-sm text-[rgb(var(--muted))]">{roleLead(persona, mode)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide">
            <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
              Demo-Backend
            </span>
            <span
              className={`rounded-full border px-2 py-1 font-semibold ${
                backendOk
                  ? "border-emerald-500/40 text-emerald-400"
                  : "border-amber-500/40 text-amber-300"
              }`}
            >
              {backendOk ? "verbunden" : "Fallback (lokal)"}
            </span>
            {serverTimestamp ? (
              <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
                Server-Stand: {serverTimestamp}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(MODE_LABELS) as DemoDossierMode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              aria-pressed={mode === item}
              className={`vog-tab ${mode === item ? "vog-tab--active" : ""}`}
            >
              {MODE_LABELS[item]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          <button type="button" className="vog-chip" onClick={() => jumpTo("akte")}>
            Akte
          </button>
          <button type="button" className="vog-chip" onClick={() => jumpTo("transparenz")}>
            Transparenzspur
          </button>
          <button type="button" className="vog-chip" onClick={() => jumpTo("clusters")}>
            Cluster & Spannungen
          </button>
          <button type="button" className="vog-chip" onClick={() => jumpTo("material")}>
            Material
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          <button
            type="button"
            aria-pressed={focusState === "offen"}
            className={`vog-chip ${focusState === "offen" ? "vog-chip--active" : ""}`}
            onClick={() => {
              setFocusState("offen");
              jumpTo("fragen");
            }}
          >
            Offen
          </button>
          <button
            type="button"
            aria-pressed={focusState === "in_pruefung"}
            className={`vog-chip ${focusState === "in_pruefung" ? "vog-chip--active" : ""}`}
            onClick={() => {
              setFocusState("in_pruefung");
              jumpTo("fragen");
            }}
          >
            In Prüfung
          </button>
          <button
            type="button"
            aria-pressed={focusState === "community"}
            className={`vog-chip ${focusState === "community" ? "vog-chip--active" : ""}`}
            onClick={() => {
              setFocusState("community");
              jumpTo("material");
            }}
          >
            Community
          </button>
          <button
            type="button"
            aria-pressed={focusState === "einspruch"}
            className={`vog-chip ${focusState === "einspruch" ? "vog-chip--active" : ""}`}
            onClick={() => {
              setFocusState("einspruch");
              jumpTo("clusters");
            }}
          >
            Einsprüche
          </button>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
          Aktiver Fokus:{" "}
          <span className="font-semibold text-[rgb(var(--fg))]">
            {focusState === "offen"
              ? "Offene Fragen"
              : focusState === "in_pruefung"
                ? "Fragen in Prüfung"
                : focusState === "community"
                  ? "Community-Eingänge"
                  : "Einsprüche und Spannungen"}
          </span>
        </div>
        <p className="text-xs text-[rgb(var(--muted))]">Statusfluss: {statusLine}</p>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-soft space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Arbeitskontext · {MODE_LABELS[mode]}
        </p>
        <div className="grid gap-2 md:grid-cols-3">
          {MODE_FOCUS[mode].map((item) => (
            <div key={item} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]">
              {item}
            </div>
          ))}
        </div>
      </section>

      {mode === "mitwirken" ? (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-soft space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Inline-Mitwirken (ohne Seitenwechsel)
          </h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {(Object.keys(INTENT_LABELS) as InlineIntent[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setIntent(item)}
                aria-pressed={intent === item}
                className={`vog-tab ${intent === item ? "vog-tab--active" : ""}`}
              >
                {INTENT_LABELS[item]}
              </button>
            ))}
          </div>
          <textarea
            className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
            rows={3}
            placeholder={`${INTENT_LABELS[intent]}...`}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <input
            className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
            placeholder="Link / Referenz (optional)"
            value={link}
            onChange={(event) => setLink(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSubmitInline}
              disabled={submitDisabled}
              className="btn btn-primary text-sm disabled:opacity-50"
            >
              Einreichen
            </button>
            {notice ? <span className="text-xs text-[rgb(var(--muted))]">{notice}</span> : null}
          </div>
          {entries.length ? (
            <div className="grid gap-2 md:grid-cols-2">
              {entries.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-xs">
                  <p className="font-semibold text-[rgb(var(--fg))]">{INTENT_LABELS[entry.intent]}</p>
                  <p className="mt-1 text-[rgb(var(--muted))]">{entry.text}</p>
                  {entry.link ? <p className="mt-1 text-[rgb(var(--muted))]">{entry.link}</p> : null}
                  <p className="mt-1 text-[rgb(var(--muted))]">
                    {getDemoStatusLabel("community_submitted")} ·{" "}
                    {new Date(entry.createdAt).toLocaleDateString("de-DE")}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {manageLocked ? (
        <section className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
          Verwalten ist in der Demo primär für Verwaltung sichtbar.
          <div className="mt-2">
            <Link
              href={withPersona("/demo/dossier?mode=verwalten", "administration")}
              className="inline-flex rounded-full border border-amber-400/50 px-3 py-1 text-xs font-semibold"
            >
              Zur Verwaltungsperspektive wechseln
            </Link>
          </div>
        </section>
      ) : null}

      <DossierViewer dossier={dossier} hideExternalCreateLinks />
    </div>
  );
}
