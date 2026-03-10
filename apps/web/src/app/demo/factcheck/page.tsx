// apps/web/src/app/demo/factcheck/page.tsx
"use client";
import { useMemo, useState } from "react";
import { useFactcheckJob } from "@/hooks/useFactcheckJob";
import { INPUT, SELECT, TEXTAREA } from "@/lib/ui/inputs";
import { DEMO_CARD, DEMO_MUTED, DEMO_PRIMARY_BUTTON, DEMO_SECONDARY_BUTTON, DEMO_SUBTLE } from "@/lib/ui/demoUi";

type Verdict = "LIKELY_TRUE" | "LIKELY_FALSE" | "MIXED" | "UNDETERMINED";

type ManualEntry = {
  id: string;
  claim: string;
  verdict: Verdict;
  confidence?: number;
  note?: string;
  sources?: string[];
  status: "pending";
  updatedAt: string;
};

const DEMO_AI_CLAIMS = [
  {
    id: "demo-ai-1",
    text: "Radwege mit baulicher Trennung senken Unfallrisiken messbar.",
    verdict: "LIKELY_TRUE",
    confidence: 0.74,
  },
  {
    id: "demo-ai-2",
    text: "Tempo 30 reduziert Lärm in Wohnstraßen deutlich.",
    verdict: "LIKELY_TRUE",
    confidence: 0.68,
  },
  {
    id: "demo-ai-3",
    text: "Schulhöfe ohne Versiegelung verringern Hitzespitzen.",
    verdict: "MIXED",
    confidence: 0.52,
  },
];

const VERDICT_LABELS: Record<Verdict, string> = {
  LIKELY_TRUE: "wahrscheinlich richtig",
  LIKELY_FALSE: "wahrscheinlich falsch",
  MIXED: "gemischt",
  UNDETERMINED: "unklar",
};

export default function DemoFactcheckPage() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [demoAiReady, setDemoAiReady] = useState(false);
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
  const [manualStatus, setManualStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [manualClaim, setManualClaim] = useState("");
  const [manualVerdict, setManualVerdict] = useState<Verdict>("LIKELY_TRUE");
  const [manualConfidence, setManualConfidence] = useState(70);
  const [manualNote, setManualNote] = useState("");
  const [manualSources, setManualSources] = useState("");
  const { jobId, status, claims, loading, error, enqueue, done } =
    useFactcheckJob();

  const aiClaims = useMemo(() => {
    if (claims && claims.length > 0) {
      return claims.map((c: any, idx: number) => ({
        id: c.id ?? `claim-${idx + 1}`,
        text: c.text,
        verdict: (c.consensus?.verdict ?? "UNDETERMINED") as Verdict,
        confidence: c.consensus?.confidence ?? 0,
      }));
    }
    return DEMO_AI_CLAIMS;
  }, [claims]);

  const manualCanSubmit = manualClaim.trim().length >= 5 && !sending;

  function resetManualForm() {
    setEditingId(null);
    setManualClaim("");
    setManualVerdict("LIKELY_TRUE");
    setManualConfidence(70);
    setManualNote("");
    setManualSources("");
  }

  async function postEditorialFeedback(action: any) {
    const res = await fetch("/api/editorial/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ts: new Date().toISOString(),
        context: { url: "/demo/factcheck" },
        action,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error ?? "editorial_feedback_failed");
    }
    return String(data.id ?? "");
  }

  async function handleManualSubmit() {
    if (!manualCanSubmit) return;
    setSending(true);
    setManualStatus(null);
    const sources = manualSources
      .split(/[\n,]+/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);
    const confidence = Math.max(0, Math.min(100, manualConfidence)) / 100;
    try {
      const action = editingId
        ? {
            type: "manual_factcheck_update",
            entryId: editingId,
            claim: manualClaim.trim(),
            verdict: manualVerdict,
            confidence,
            note: manualNote.trim() || undefined,
            sources: sources.length ? sources : undefined,
            origin: "community",
          }
        : {
            type: "manual_factcheck_submit",
            claim: manualClaim.trim(),
            verdict: manualVerdict,
            confidence,
            note: manualNote.trim() || undefined,
            sources: sources.length ? sources : undefined,
            origin: "community",
          };
      const id = await postEditorialFeedback(action);
      const now = new Date().toISOString();
      const entry: ManualEntry = {
        id: editingId ?? id,
        claim: manualClaim.trim(),
        verdict: manualVerdict,
        confidence,
        note: manualNote.trim() || undefined,
        sources: sources.length ? sources : undefined,
        status: "pending",
        updatedAt: now,
      };
      setManualEntries((prev) => {
        if (editingId) {
          return prev.map((item) => (item.id === editingId ? entry : item));
        }
        return [entry, ...prev];
      });
      setManualStatus("An Redaktion gesendet (Status: offen).");
      resetManualForm();
    } catch (err: any) {
      setManualStatus(`Fehler: ${String(err?.message ?? err)}`);
    } finally {
      setSending(false);
    }
  }

  async function handleSendAiToEditorial(force?: boolean) {
    if (!force && !demoAiReady && !done) {
      setManualStatus("Bitte zuerst einen Check starten.");
      return;
    }
    setSending(true);
    setManualStatus(null);
    try {
      for (const claim of aiClaims) {
        await postEditorialFeedback({
          type: "manual_factcheck_submit",
          claim: claim.text,
          verdict: claim.verdict,
          confidence: claim.confidence,
          origin: "ai",
        });
      }
      setManualStatus("KI-Ergebnis an Redaktion gesendet (Status: offen).");
    } catch (err: any) {
      setManualStatus(`Fehler: ${String(err?.message ?? err)}`);
    } finally {
      setSending(false);
    }
  }

  function handleEdit(entry: ManualEntry) {
    setEditingId(entry.id);
    setManualClaim(entry.claim);
    setManualVerdict(entry.verdict);
    setManualConfidence(Math.round((entry.confidence ?? 0) * 100));
    setManualNote(entry.note ?? "");
    setManualSources(entry.sources?.join("\n") ?? "");
    setMode("manual");
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <div className={`${DEMO_CARD} p-5 space-y-3`}>
        <div className={`text-xs font-semibold uppercase tracking-wide ${DEMO_SUBTLE}`}>
          Demo · Factcheck
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Schnellprüfung mit Demo-Daten
        </h1>
        <p className={`text-sm ${DEMO_MUTED}`}>
          Für Screenshots: stabiler Flow ohne echte Inhalte. Ergebnisdaten sind
          reproduzierbar.
        </p>
      </div>

      <div className={`${DEMO_CARD} p-5 space-y-3`}>
        <textarea
          className={TEXTAREA}
          rows={5}
          placeholder="Text für Factcheck... (min. 20 Zeichen)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
            <button
              type="button"
              onClick={() => setMode("ai")}
              className={`rounded-full px-3 py-1 ${mode === "ai" ? "bg-white text-slate-900 dark:bg-slate-950/80 dark:text-slate-100" : ""}`}
            >
              KI
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`rounded-full px-3 py-1 ${mode === "manual" ? "bg-white text-slate-900 dark:bg-slate-950/80 dark:text-slate-100" : ""}`}
            >
              Manuell
            </button>
          </div>
          {mode === "ai" && (
            <>
              <button
                className={`${DEMO_PRIMARY_BUTTON} px-5 disabled:opacity-50`}
                disabled={loading || input.length < 20}
                onClick={() => {
                  enqueue({ text: input, language: "de", priority: 5 });
                  setDemoAiReady(true);
                  void handleSendAiToEditorial(true);
                }}
              >
                {loading ? "Wird geprüft..." : "Factcheck starten"}
              </button>
              <button
                className={`${DEMO_SECONDARY_BUTTON} px-4 disabled:opacity-50`}
                disabled={sending}
                onClick={() => {
                  void handleSendAiToEditorial();
                }}
              >
                Ergebnis an Redaktion senden
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
                onClick={() => setInput("Tempo 30 reduziert Lärm in Wohnstraßen und erhöht die Verkehrssicherheit in Wohnquartieren.")}
              >
                Beispiel-Claim einsetzen
              </button>
            </>
          )}
          {jobId && <div className={`text-xs ${DEMO_SUBTLE}`}>JobID: {jobId}</div>}
          {status && <div className={`text-xs ${DEMO_SUBTLE}`}>Status: {status}</div>}
        </div>

        {error && <div className="text-sm text-red-600">Fehler: {error}</div>}
        {manualStatus && <div className={`text-xs ${DEMO_SUBTLE}`}>{manualStatus}</div>}
      </div>

      {mode === "ai" && (done || demoAiReady) && aiClaims && (
        <div className="space-y-3">
          <h3 className={`text-sm font-semibold uppercase tracking-wide ${DEMO_SUBTLE}`}>
            KI-Ergebnis · Status Redaktion: offen
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {aiClaims.map((c: any) => (
              <div
                key={c.id}
                className={`${DEMO_CARD} p-4`}
              >
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{c.text}</div>
                <div className={`mt-2 text-xs ${DEMO_MUTED}`}>
                  Konsens: {VERDICT_LABELS[c.verdict as Verdict] ?? "unklar"} ·{" "}
                  {Math.round((c.confidence ?? 0) * 100)}% Confidence
                </div>
                <div className={`mt-2 text-xs ${DEMO_SUBTLE}`}>
                  Warum? Demo-Quellen + konsistentes Bewertungsprofil, Prüfung durch Redaktion.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "manual" && (
        <div className="space-y-4">
          <div className={`${DEMO_CARD} p-5 space-y-3`}>
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${DEMO_SUBTLE}`}>
              Manuelle Eingabe (Redaktion prüft)
            </h3>
            <div className="space-y-2">
              <label className={`text-xs font-semibold uppercase ${DEMO_SUBTLE}`}>Claim</label>
              <textarea
                className={TEXTAREA}
                rows={3}
                value={manualClaim}
                onChange={(e) => setManualClaim(e.target.value)}
                placeholder="Aussage / Claim"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className={`text-xs font-semibold uppercase ${DEMO_SUBTLE}`}>Verdict</label>
                <select
                  value={manualVerdict}
                  onChange={(e) => setManualVerdict(e.target.value as Verdict)}
                  className={SELECT}
                >
                  {Object.entries(VERDICT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={`text-xs font-semibold uppercase ${DEMO_SUBTLE}`}>Confidence</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={manualConfidence}
                  onChange={(e) => setManualConfidence(Number(e.target.value))}
                  className={INPUT}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className={`text-xs font-semibold uppercase ${DEMO_SUBTLE}`}>Hinweis</label>
              <input
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                className={INPUT}
                placeholder="Notiz für Redaktion"
              />
            </div>
            <div className="space-y-2">
              <label className={`text-xs font-semibold uppercase ${DEMO_SUBTLE}`}>Quellen (optional)</label>
              <textarea
                className={TEXTAREA}
                rows={2}
                value={manualSources}
                onChange={(e) => setManualSources(e.target.value)}
                placeholder="https://... (eine URL pro Zeile oder Komma)"
              />
              <p className={`text-[11px] ${DEMO_SUBTLE}`}>Eine URL pro Zeile, Komma getrennt.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className={`${DEMO_PRIMARY_BUTTON} px-5 disabled:opacity-50`}
                disabled={!manualCanSubmit}
                onClick={handleManualSubmit}
              >
                {editingId ? "Update an Redaktion senden" : "An Redaktion senden"}
              </button>
              {editingId && (
                <button
                  className={`${DEMO_SECONDARY_BUTTON} px-4`}
                  onClick={resetManualForm}
                >
                  Abbrechen
                </button>
              )}
              <span className={`text-xs ${DEMO_SUBTLE}`}>Status Redaktion: offen</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className={`text-xs font-semibold uppercase tracking-wide ${DEMO_SUBTLE}`}>
              Eingereichte manuelle Checks
            </h4>
            {manualEntries.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                Noch keine manuellen Einträge.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {manualEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`${DEMO_CARD} p-4 space-y-2`}
                  >
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{entry.claim}</div>
                    <div className={`text-xs ${DEMO_MUTED}`}>
                      Verdict: {VERDICT_LABELS[entry.verdict]} ·{" "}
                      {Math.round((entry.confidence ?? 0) * 100)}%
                    </div>
                    {entry.note && (
                      <div className={`text-xs ${DEMO_MUTED}`}>Notiz: {entry.note}</div>
                    )}
                    {entry.sources && entry.sources.length > 0 && (
                      <div className={`text-xs ${DEMO_MUTED}`}>
                        Quellen: {entry.sources.join(", ")}
                      </div>
                    )}
                    <div className={`flex items-center justify-between text-xs ${DEMO_SUBTLE}`}>
                      <span>Status Redaktion: offen</span>
                      <button
                        className="font-semibold text-sky-600 underline dark:text-sky-400"
                        onClick={() => handleEdit(entry)}
                      >
                        Bearbeiten
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
