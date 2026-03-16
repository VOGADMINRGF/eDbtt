"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type {
  Round,
  RoundAssistReviewDecision,
  RoundAssistRunSnapshot,
  RoundAssistSuggestion,
  RoundAssistSuggestionKind,
  Topic,
} from "@features/topicRound";

const KIND_LABELS: Record<RoundAssistSuggestionKind, string> = {
  suggestedClaims: "Suggested Claims",
  suggestedQuestions: "Suggested Questions",
  suggestedSourceLinks: "Suggested Source Links",
  suggestedOptionRefinements: "Suggested Option Refinements",
  suggestedRoadmapItems: "Suggested Roadmap Items",
  duplicateAndClusterHints: "Duplicate & Cluster Hints",
  personaSummaries: "Persona Summaries",
};

const CONFIDENCE_LABELS = {
  low: "niedrig",
  medium: "mittel",
  high: "hoch",
} as const;

type Props = {
  round: Round;
  topic: Topic;
  initialSnapshot: RoundAssistRunSnapshot | null;
  canManage: boolean;
};

export default function MergeWorkspaceClient({
  round,
  topic,
  initialSnapshot,
  canManage,
}: Props) {
  const [snapshot, setSnapshot] = useState<RoundAssistRunSnapshot | null>(initialSnapshot);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editedTextById, setEditedTextById] = useState<Record<string, string>>({});
  const [linkedEntityById, setLinkedEntityById] = useState<Record<string, string>>({});
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const grouped = useMemo(() => {
    const buckets: Record<RoundAssistSuggestionKind, RoundAssistSuggestion[]> = {
      suggestedClaims: [],
      suggestedQuestions: [],
      suggestedSourceLinks: [],
      suggestedOptionRefinements: [],
      suggestedRoadmapItems: [],
      duplicateAndClusterHints: [],
      personaSummaries: [],
    };
    for (const item of snapshot?.suggestions ?? []) {
      buckets[item.kind].push(item);
    }
    return buckets;
  }, [snapshot]);

  async function refreshSnapshot() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rounds/${encodeURIComponent(round.slug)}/assist-runs`, {
        cache: "no-store",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? "snapshot_fetch_failed");
      }
      setSnapshot(body.snapshot ?? null);
    } catch (err: any) {
      setError(err?.message ?? "snapshot_fetch_failed");
    } finally {
      setBusy(false);
    }
  }

  async function triggerAssistRun() {
    if (!canManage) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/rounds/${encodeURIComponent(round.slug)}/assist-runs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "assistive_mock",
          model: "structured_v1",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? "assist_trigger_failed");
      }
      setSnapshot(body.snapshot ?? null);
      setMessage("Assist suggestions vorbereitet. Es wurde nichts automatisch veröffentlicht.");
    } catch (err: any) {
      setError(err?.message ?? "assist_trigger_failed");
    } finally {
      setBusy(false);
    }
  }

  async function reviewSuggestion(suggestion: RoundAssistSuggestion, decision: RoundAssistReviewDecision) {
    if (!snapshot || !canManage) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/rounds/${encodeURIComponent(round.slug)}/assist-runs/${encodeURIComponent(snapshot.run.runId)}/suggestions/${encodeURIComponent(suggestion.suggestionId)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            decision,
            editedText: editedTextById[suggestion.suggestionId],
            linkedEntityId: linkedEntityById[suggestion.suggestionId],
            reviewNote: noteById[suggestion.suggestionId],
          }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? "review_update_failed");
      }
      setSnapshot(body.snapshot ?? null);
      setMessage(`Suggestion ${suggestion.suggestionId} wurde aktualisiert (${decision}).`);
    } catch (err: any) {
      setError(err?.message ?? "review_update_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 space-y-6">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Round Manage · Merge Assist
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">{round.title}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Optionaler KI-Assist zur Round-zu-Topic-Synthese. Alle Vorschläge bleiben bis zur Review-Aktion unverbindlich.
        </p>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="vog-chip">Round: {round.slug}</span>
          <span className="vog-chip">Topic: {topic.slug}</span>
          <span className="vog-chip">AI ist assistiv, nie auto-publish</span>
          <span className="vog-chip">{canManage ? "Management-Modus" : "Read-only"}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/round/${round.slug}`} className="btn-secondary text-xs">
            Zur Round
          </Link>
          <Link href={`/topic/${topic.slug}`} className="btn-secondary text-xs">
            Zum Topic
          </Link>
          <button type="button" className="btn-secondary text-xs" onClick={() => refreshSnapshot()} disabled={busy}>
            Neu laden
          </button>
          <button
            type="button"
            className="btn btn-primary text-xs"
            onClick={() => triggerAssistRun()}
            disabled={busy || !canManage}
          >
            AI-Assist vorbereiten
          </button>
        </div>
        {!canManage ? (
          <p className="text-xs text-[rgb(var(--muted))]">
            Review-Aktionen sind im Management-Bereich verfügbar (editor/moderation/admin/journalism).
          </p>
        ) : null}
      </header>

      {message ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm text-[rgb(var(--fg))]">
          {message}
        </section>
      ) : null}
      {error ? (
        <section className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          Fehler: {error}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Source Round Overview</h2>
          <p className="text-sm text-[rgb(var(--muted))]">{round.summary}</p>
          <ul className="space-y-2 text-sm">
            {round.openPoints.map((point) => (
              <li key={point} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-[rgb(var(--muted))]">
                {point}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Linked Topic Overview</h2>
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">{topic.title}</p>
          <p className="text-sm text-[rgb(var(--muted))]">{topic.framingQuestion}</p>
          <p className="text-sm text-[rgb(var(--muted))]">
            Claims: {topic.claims.length} · Questions: {topic.openQuestions.length} · Roadmap: {topic.roadmap.length}
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Review State</h2>
        {!snapshot ? (
          <p className="text-sm text-[rgb(var(--muted))]">
            Noch kein Assist-Run vorhanden. Manual-first Workflow bleibt aktiv; du kannst Topic und Round weiterhin ohne KI
            pflegen.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="vog-chip">Run: {snapshot.run.runId}</span>
            <span className="vog-chip">Status: {snapshot.run.status}</span>
            <span className="vog-chip">Pending: {snapshot.reviewState.pending}</span>
            <span className="vog-chip">Accepted: {snapshot.reviewState.accepted}</span>
            <span className="vog-chip">Edited: {snapshot.reviewState.edited}</span>
            <span className="vog-chip">Linked: {snapshot.reviewState.linked}</span>
            <span className="vog-chip">Deferred: {snapshot.reviewState.deferred}</span>
            <span className="vog-chip">Rejected: {snapshot.reviewState.rejected}</span>
            <span className="vog-chip">Duplicate: {snapshot.reviewState.duplicate}</span>
            <span className="vog-chip">
              Apply to topic: {snapshot.reviewState.canApplyToTopic ? "manuell möglich" : "noch keine apply-Aktionen"}
            </span>
          </div>
        )}
      </section>

      {snapshot ? (
        <section className="space-y-4">
          {Object.entries(grouped).map(([kind, items]) => (
            <article
              key={kind}
              className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3"
            >
              <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">
                {KIND_LABELS[kind as RoundAssistSuggestionKind]} ({items.length})
              </h3>
              {items.length === 0 ? (
                <p className="text-sm text-[rgb(var(--muted))]">Keine Vorschläge in dieser Gruppe.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <article
                      key={item.suggestionId}
                      className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 space-y-2"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="vog-chip">{item.status}</span>
                        <span className="vog-chip">Confidence: {CONFIDENCE_LABELS[item.confidence]}</span>
                        {item.targetHint ? <span className="vog-chip">Target: {item.targetHint}</span> : null}
                      </div>
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</p>
                      <p className="text-sm text-[rgb(var(--muted))]">{item.editedText ?? item.text}</p>

                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          type="text"
                          value={linkedEntityById[item.suggestionId] ?? ""}
                          onChange={(event) =>
                            setLinkedEntityById((prev) => ({
                              ...prev,
                              [item.suggestionId]: event.target.value,
                            }))
                          }
                          placeholder="Existing target id (optional)"
                          className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs"
                          disabled={busy || !canManage}
                        />
                        <input
                          type="text"
                          value={noteById[item.suggestionId] ?? ""}
                          onChange={(event) =>
                            setNoteById((prev) => ({
                              ...prev,
                              [item.suggestionId]: event.target.value,
                            }))
                          }
                          placeholder="Review note (optional)"
                          className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs"
                          disabled={busy || !canManage}
                        />
                      </div>
                      <textarea
                        value={editedTextById[item.suggestionId] ?? ""}
                        onChange={(event) =>
                          setEditedTextById((prev) => ({
                            ...prev,
                            [item.suggestionId]: event.target.value,
                          }))
                        }
                        placeholder="Edit text before accept (optional)"
                        className="min-h-20 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs"
                        disabled={busy || !canManage}
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-secondary text-xs"
                          onClick={() => reviewSuggestion(item, "accept")}
                          disabled={busy || !canManage}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="btn-secondary text-xs"
                          onClick={() => reviewSuggestion(item, "edit_accept")}
                          disabled={busy || !canManage}
                        >
                          Edit + Accept
                        </button>
                        <button
                          type="button"
                          className="btn-secondary text-xs"
                          onClick={() => reviewSuggestion(item, "link_existing")}
                          disabled={busy || !canManage}
                        >
                          Link Existing
                        </button>
                        <button
                          type="button"
                          className="btn-secondary text-xs"
                          onClick={() => reviewSuggestion(item, "mark_duplicate")}
                          disabled={busy || !canManage}
                        >
                          Mark Duplicate
                        </button>
                        <button
                          type="button"
                          className="btn-secondary text-xs"
                          onClick={() => reviewSuggestion(item, "defer")}
                          disabled={busy || !canManage}
                        >
                          Defer
                        </button>
                        <button
                          type="button"
                          className="btn-secondary text-xs"
                          onClick={() => reviewSuggestion(item, "reject")}
                          disabled={busy || !canManage}
                        >
                          Reject
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
