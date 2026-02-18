// features/analyze/E150Workbench.tsx
"use client";

import { useState } from "react";
import type { AnalyzeResult } from "@features/analyze/schemas";
import { CitizenView } from "./views/CitizenView";
import { EditorView } from "./views/EditorView";
import { ReportView } from "./views/ReportView";
import { AnalyzeForm } from "./components/AnalyzeForm";

type Mode = "citizen" | "editor" | "report";

export function E150Workbench() {
  // *** EIN gemeinsamer State für den Beitrag ***
  const [text, setText] = useState("");
  const [locale, setLocale] = useState<"de" | "en">("de");

  // Ergebnis der Analyse – wird von allen drei Levels genutzt
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const [mode, setMode] = useState<Mode>("citizen");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleAnalyze() {
    const trimmed = text.trim();
    if (!trimmed) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/contributions/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: trimmed, locale }),
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.detail || json.error || "Analyse fehlgeschlagen");
      }
      setResult(json.result as AnalyzeResult);
    } catch (e: any) {
      console.error("analyze error", e);
      setErrorMsg(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-emerald-50 to-emerald-100">
      {/* Kopf + Mode-Switch */}
      <header className="border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-[rgb(var(--fg))]">
            Neuen Beitrag analysieren (E150)
          </h1>
          <div className="inline-flex rounded-full bg-[rgb(var(--bg))] p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode("citizen")}
              className={`px-3 py-1 rounded-full ${
                mode === "citizen"
                  ? "bg-[rgb(var(--card))] shadow text-[rgb(var(--fg))]"
                  : "text-[rgb(var(--muted))]"
              }`}
            >
              Bürger-Ansicht
            </button>
            <button
              type="button"
              onClick={() => setMode("editor")}
              className={`px-3 py-1 rounded-full ${
                mode === "editor"
                  ? "bg-[rgb(var(--card))] shadow text-[rgb(var(--fg))]"
                  : "text-[rgb(var(--muted))]"
              }`}
            >
              Redaktion
            </button>
            <button
              type="button"
              onClick={() => setMode("report")}
              className={`px-3 py-1 rounded-full ${
                mode === "report"
                  ? "bg-[rgb(var(--card))] shadow text-[rgb(var(--fg))]"
                  : "text-[rgb(var(--muted))]"
              }`}
            >
              Themen-Report
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        {/* Gemeinsame Eingabe – wird NICHT zurückgesetzt beim Moduswechsel */}
        <AnalyzeForm
          text={text}
          locale={locale}
          loading={loading}
          onChangeText={setText}
          onChangeLocale={setLocale}
          onAnalyze={handleAnalyze}
        />

        {errorMsg && (
          <p className="text-xs text-red-600">
            Analyse-Fehler: {errorMsg}
          </p>
        )}

        {result && mode === "citizen" && (
          <CitizenView result={result} />
        )}

        {result && mode === "editor" && (
          <EditorView result={result} />
        )}

        {result && mode === "report" && (
          <ReportView result={result} />
        )}

        {!result && (
          <p className="text-xs text-[rgb(var(--muted))]">
            Hinweis: Nach der Analyse erscheinen hier Statements,
            Evidenz-Slots, Fragen & Themenknoten – je nach gewählter Ansicht.
          </p>
        )}
      </main>
    </div>
  );
}
