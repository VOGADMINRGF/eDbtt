"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFactcheckJob } from "@/hooks/useFactcheckJob";
import { buildCreateHref } from "@/features/create/intents";
import { getDemoPersonaConfig, type DemoPersona } from "@/features/demo/personas";
import { DEMO_STATUS_GLOSSARY, getDemoStatusLabel } from "@/features/demo/statusLanguage";
import VerificationStatusPanel from "@/components/ai/VerificationStatusPanel";
import RouteBoundCompanionPanel from "@/components/ai/RouteBoundCompanionPanel";
import type { SurfaceContext } from "@/features/surface";

type Verdict = "LIKELY_TRUE" | "LIKELY_FALSE" | "MIXED" | "UNDETERMINED";
type IntakeChannel = "text" | "link" | "file" | "video";
type FlowStep = "eingang" | "pruefung" | "ergebnis" | "redaktion";

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

const CHANNEL_LABELS: Record<IntakeChannel, string> = {
  text: "Text",
  link: "Link",
  file: "Anlage",
  video: "Video-URL",
};

type FactcheckSurfaceProps = {
  context: SurfaceContext;
  persona: DemoPersona;
};

function withMode(href: string, mode: SurfaceContext["mode"], persona: DemoPersona) {
  const sep = href.includes("?") ? "&" : "?";
  if (mode === "demo") return `${href}${sep}persona=${encodeURIComponent(persona)}`;
  return href;
}

export function FactcheckSurface({ context, persona }: FactcheckSurfaceProps) {
  const personaCfg = getDemoPersonaConfig(persona);

  const [input, setInput] = useState("");
  const [channel, setChannel] = useState<IntakeChannel>("text");
  const [linkInput, setLinkInput] = useState("");
  const [videoInput, setVideoInput] = useState("");
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [demoAiReady, setDemoAiReady] = useState(false);
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
  const [manualStatus, setManualStatus] = useState<string | null>(null);
  const [editorialSent, setEditorialSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [manualClaim, setManualClaim] = useState("");
  const [manualVerdict, setManualVerdict] = useState<Verdict>("LIKELY_TRUE");
  const [manualConfidence, setManualConfidence] = useState(70);
  const [manualNote, setManualNote] = useState("");
  const [manualSources, setManualSources] = useState("");
  const {
    jobId,
    status,
    claims,
    loading,
    error,
    enqueue,
    done,
    verificationMode,
    researchUsed,
    sealEligible,
    sealGranted,
  } =
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
  const effectiveInput = useMemo(() => {
    if (channel === "text") return input.trim();
    if (channel === "link") return `Link-Hinweis: ${linkInput.trim()}`.trim();
    if (channel === "video") return `Video-Hinweis: ${videoInput.trim()}`.trim();
    if (channel === "file") return fileName ? `Anlage: ${fileName}` : "";
    return input.trim();
  }, [channel, fileName, input, linkInput, videoInput]);

  const personaIntents =
    persona === "journalist"
      ? [
          { label: "Quelle nachreichen", href: buildCreateHref({ intent: "source" }) },
          { label: "Widerspruch melden", href: buildCreateHref({ intent: "objection" }) },
        ]
      : persona === "administration"
        ? [
            { label: "Option dokumentieren", href: buildCreateHref({ intent: "option" }) },
            { label: "Frage erfassen", href: buildCreateHref({ intent: "question" }) },
          ]
        : [
            { label: "Perspektive einreichen", href: buildCreateHref({ intent: "perspective" }) },
            { label: "Quelle melden", href: buildCreateHref({ intent: "source" }) },
          ];
  const statusLabels = DEMO_STATUS_GLOSSARY.filter((item) =>
    ["demo", "simulation", "community_submitted", "in_review", "verified"].includes(item.key),
  ).map((item) => item.label);
  const hasResult = mode === "ai" ? Boolean(done || demoAiReady) : manualEntries.length > 0;
  const flowStep: FlowStep = editorialSent
    ? "redaktion"
    : hasResult
      ? "ergebnis"
      : loading
        ? "pruefung"
        : "eingang";
  const stepOrder: FlowStep[] = ["eingang", "pruefung", "ergebnis", "redaktion"];
  const stepIndex = stepOrder.indexOf(flowStep);

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
      setManualStatus(`An Redaktion gesendet (Status: ${getDemoStatusLabel("open")}).`);
      setEditorialSent(true);
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
      setManualStatus(`KI-Ergebnis an Redaktion gesendet (Status: ${getDemoStatusLabel("open")}).`);
      setEditorialSent(true);
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
      <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {context.mode === "demo" ? "Demo - Factcheck" : "Factcheck"} · {personaCfg.label}
        </div>
        <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">
          Schnellprüfung mit Demo-Daten
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Multi-Channel Intake für Text, Link, Anlage und Video-URL. Die Prüfung ist als
          Demo-Simulation markiert, aber der Ablauf folgt dem späteren Produktfluss.
        </p>
        <p className="text-xs text-[rgb(var(--muted))]">
          Statussprache: {statusLabels.join(" · ")}.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {personaIntents.map((item) => (
            <Link
              key={item.label}
              href={withMode(item.href, context.mode, persona)}
              className="vog-tab"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Ablauf</p>
        <div className="grid gap-2 md:grid-cols-4">
          {[
            { id: "eingang", label: "1. Eingang wählen" },
            { id: "pruefung", label: "2. Prüfung läuft" },
            { id: "ergebnis", label: "3. Ergebnis" },
            { id: "redaktion", label: "4. Redaktion" },
          ].map((item, idx) => (
            <div
              key={item.id}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                idx <= stepIndex
                  ? "border-[rgb(var(--grad-from))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))]"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Schritt 1 - Eingang wählen</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {(Object.keys(CHANNEL_LABELS) as IntakeChannel[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setChannel(item)}
              aria-pressed={channel === item}
              className={`vog-tab ${channel === item ? "vog-tab--active" : ""}`}
            >
              {CHANNEL_LABELS[item]}
            </button>
          ))}
        </div>
        {channel === "text" && (
          <textarea
            className="w-full rounded-2xl border border-[rgb(var(--border))] p-3 text-sm"
            rows={5}
            placeholder="Text für Factcheck... (min. 20 Zeichen)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        )}
        {channel === "link" && (
          <input
            className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            placeholder="https://beispiel.de/artikel"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
          />
        )}
        {channel === "video" && (
          <input
            className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            placeholder="https://youtube.com/... oder Mediathek-Link"
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
          />
        )}
        {channel === "file" && (
          <div className="space-y-2">
            <input
              type="file"
              className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
            <p className="text-xs text-[rgb(var(--muted))]">
              {fileName ? `Anlage erkannt: ${fileName}` : "Noch keine Anlage ausgewählt."}
            </p>
          </div>
        )}
        <p className="text-xs text-[rgb(var(--muted))]">
          Eingangsart: <span className="font-semibold">{CHANNEL_LABELS[channel]}</span>
        </p>
        <p className="text-xs text-[rgb(var(--muted))]">Schritt 2 - Prüfung starten</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-[rgb(var(--muted))]">
            <button
              type="button"
              onClick={() => setMode("ai")}
              aria-pressed={mode === "ai"}
              className={`vog-tab ${mode === "ai" ? "vog-tab--active" : ""}`}
            >
              KI
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              aria-pressed={mode === "manual"}
              className={`vog-tab ${mode === "manual" ? "vog-tab--active" : ""}`}
            >
              Manuell
            </button>
          </div>
          {mode === "ai" && (
            <>
              <button
                className="btn btn-primary text-sm disabled:opacity-50"
                disabled={loading || effectiveInput.length < 20}
                onClick={() => {
                  setEditorialSent(false);
                  enqueue({ text: effectiveInput, language: "de", priority: 5 });
                  setDemoAiReady(true);
                  void handleSendAiToEditorial(true);
                }}
              >
                {loading ? "Wird geprüft..." : "Factcheck starten"}
              </button>
              <button
                className="btn-secondary text-sm disabled:opacity-50"
                disabled={sending}
                onClick={() => {
                  void handleSendAiToEditorial();
                }}
              >
                Ergebnis an Redaktion senden
              </button>
            </>
          )}
          {jobId && <div className="text-xs text-[rgb(var(--muted))]">Lauf-ID: {jobId}</div>}
          {status && <div className="text-xs text-[rgb(var(--muted))]">Status: {status}</div>}
        </div>

        {status !== "idle" ? (
          <VerificationStatusPanel
            lane="sealed_factcheck"
            status={status}
            verificationMode={verificationMode}
            researchUsed={researchUsed}
            sealEligible={sealEligible}
            sealGranted={sealGranted}
            showHint
          />
        ) : null}

        <RouteBoundCompanionPanel
          contextKind="factcheck"
          title="Factcheck"
          routePath="/factcheck"
          intro="Companion für Rückfragen im Factcheck-Lane. Kein Siegel ohne abgeschlossenen sealed Workflow."
          placeholder="Welche Aussage oder Quelle soll als Nächstes geprüft werden?"
          parentStatus={{
            status: status === "idle" ? "started" : status,
            lane: "sealed_factcheck",
            verificationMode: verificationMode,
            researchUsed: researchUsed,
            sealEligible: sealEligible,
            sealGranted: sealGranted,
          }}
        />

        {error && <div className="text-sm text-red-600">Fehler: {error}</div>}
        {manualStatus && <div className="text-xs text-[rgb(var(--muted))]">{manualStatus}</div>}
      </div>

      {mode === "ai" && (done || demoAiReady) && aiClaims && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Schritt 3 - KI-Ergebnis (Status Redaktion: {getDemoStatusLabel("open")})
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {aiClaims.map((c: any) => (
              <div
                key={c.id}
                className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm"
              >
                <div className="text-sm font-medium text-[rgb(var(--fg))]">{c.text}</div>
                <div className="mt-2 text-xs text-[rgb(var(--muted))]">
                  Konsens: {VERDICT_LABELS[c.verdict as Verdict] ?? "unklar"} (
                  {Math.round((c.confidence ?? 0) * 100)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "manual" && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              Schritt 3 - Manuelle Eingabe (immer Redaktion prüft)
            </h3>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">Claim</label>
              <textarea
                className="w-full rounded-2xl border border-[rgb(var(--border))] p-3 text-sm"
                rows={3}
                value={manualClaim}
                onChange={(e) => setManualClaim(e.target.value)}
                placeholder="Aussage / Claim"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">Verdict</label>
                <select
                  value={manualVerdict}
                  onChange={(e) => setManualVerdict(e.target.value as Verdict)}
                  className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
                >
                  {Object.entries(VERDICT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">Confidence</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={manualConfidence}
                  onChange={(e) => setManualConfidence(Number(e.target.value))}
                  className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">Hinweis</label>
              <input
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
                placeholder="Notiz für Redaktion"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">Quellen (optional)</label>
              <textarea
                className="w-full rounded-2xl border border-[rgb(var(--border))] p-3 text-sm"
                rows={2}
                value={manualSources}
                onChange={(e) => setManualSources(e.target.value)}
                placeholder="https://... (eine URL pro Zeile oder Komma)"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="btn btn-primary text-sm disabled:opacity-50"
                disabled={!manualCanSubmit}
                onClick={handleManualSubmit}
              >
                {editingId ? "Update an Redaktion senden" : "An Redaktion senden"}
              </button>
              {editingId && (
                <button
                  className="btn-secondary text-sm"
                  onClick={resetManualForm}
                >
                  Abbrechen
                </button>
              )}
              <span className="text-xs text-[rgb(var(--muted))]">
                Status Redaktion: {getDemoStatusLabel("open")}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              Eingereichte manuelle Checks
            </h4>
            {manualEntries.length === 0 ? (
              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
                Noch keine manuellen Einträge.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {manualEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm space-y-2"
                  >
                    <div className="text-sm font-medium text-[rgb(var(--fg))]">{entry.claim}</div>
                    <div className="text-xs text-[rgb(var(--muted))]">
                      Verdict: {VERDICT_LABELS[entry.verdict]} (
                      {Math.round((entry.confidence ?? 0) * 100)}%)
                    </div>
                    {entry.note && (
                      <div className="text-xs text-[rgb(var(--muted))]">Notiz: {entry.note}</div>
                    )}
                    {entry.sources && entry.sources.length > 0 && (
                      <div className="text-xs text-[rgb(var(--muted))]">
                        Quellen: {entry.sources.join(", ")}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
                      <span>Status Redaktion: {getDemoStatusLabel("open")}</span>
                      <button
                        className="font-semibold text-sky-600 underline"
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

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm text-[rgb(var(--muted))]">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Schritt 4 - Redaktion</p>
        <p className="mt-1">
          Nach dem Versand landet der Vorgang im Redaktionsstatus{" "}
          <span className="font-semibold text-[rgb(var(--fg))]">{getDemoStatusLabel("open")}</span> und
          läuft dann über {getDemoStatusLabel("in_review")} bis {getDemoStatusLabel("verified")}.
        </p>
      </section>
    </div>
  );
}
