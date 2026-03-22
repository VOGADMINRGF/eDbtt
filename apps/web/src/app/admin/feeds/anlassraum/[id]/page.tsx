"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { buildCreateFastPathHref } from "@/features/create/intents";
import {
  formatOriginTypeLabel,
  formatOwnerTypeLabel,
  formatRelevanceScopeLabel,
  formatSourceModeLabel,
} from "@/features/relevanceFraming";

type AnlassraumDetailResponse = {
  ok: boolean;
  item?: Record<string, any>;
  sources?: any[];
  structure?: any;
  outputs?: any[];
  publishGate?: {
    ok: boolean;
    reasons: string[];
    sourceCount: number;
    requiredSourceCount?: number;
    evidence?: Record<string, unknown>;
  };
  error?: string;
};

type OutputSeedItem = {
  id: string;
  outputType: string;
  status: string;
  reviewState: string;
  publishTarget: string | null;
  reviewNote: string | null;
  lastAction: string | null;
  lastActionBy: string | null;
  lastActionAt: string | null;
  updatedAt: string | null;
};

const ACTIONS = [
  { id: "curate", label: "Kurationsstart" },
  { id: "review", label: "In Review führen" },
  { id: "approve", label: "Freigeben" },
  { id: "activate", label: "Aktivieren" },
  { id: "archive", label: "Archivieren" },
] as const;

const OUTPUT_ACTIONS = [
  "queue",
  "send_to_review",
  "approve_prep",
  "reject_prep",
  "mark_ready",
  "publish",
  "discard",
  "reset_draft",
] as const;

type OutputAction = (typeof OUTPUT_ACTIONS)[number];

const OUTPUT_ACTION_LABELS: Record<OutputAction, string> = {
  queue: "In Queue setzen",
  send_to_review: "Zur Review senden",
  approve_prep: "Vorbereitet freigeben",
  reject_prep: "Vorbereitung ablehnen",
  mark_ready: "Als bereit markieren",
  publish: "Manuell publizieren",
  discard: "Verwerfen",
  reset_draft: "Auf Draft zurücksetzen",
};

export default function AdminAnlassraumDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<AnlassraumDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [outputSeeds, setOutputSeeds] = useState<OutputSeedItem[]>([]);
  const [outputLoading, setOutputLoading] = useState(false);
  const [outputError, setOutputError] = useState<string | null>(null);
  const [outputTransitioningSeedId, setOutputTransitioningSeedId] = useState<string | null>(null);
  const [outputActionBySeed, setOutputActionBySeed] = useState<Record<string, OutputAction>>({});
  const [outputPublishTargetBySeed, setOutputPublishTargetBySeed] = useState<Record<string, string>>({});
  const [outputReviewNoteBySeed, setOutputReviewNoteBySeed] = useState<Record<string, string>>({});

  useEffect(() => {
    let ignored = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/feeds/anlassraum/${params.id}`, { cache: "no-store" });
        const body = (await res.json().catch(() => ({}))) as AnlassraumDetailResponse;
        if (!res.ok || !body?.ok) throw new Error(body?.error ?? res.statusText);
        if (!ignored) setData(body);
      } catch (err: any) {
        if (!ignored) {
          setData(null);
          setError(err?.message ?? "anlassraum_detail_load_failed");
        }
      } finally {
        if (!ignored) setLoading(false);
      }
    }
    load();
    return () => {
      ignored = true;
    };
  }, [params.id]);

  useEffect(() => {
    let ignored = false;
    async function loadOutputSeeds() {
      setOutputLoading(true);
      setOutputError(null);
      try {
        const res = await fetch(`/api/admin/feeds/anlassraum/${params.id}/outputs`, { cache: "no-store" });
        const body = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          items?: OutputSeedItem[];
          publishGate?: AnlassraumDetailResponse["publishGate"];
          error?: string;
        };
        if (!res.ok || !body?.ok) {
          throw new Error(body?.error ?? res.statusText);
        }
        const items = Array.isArray(body.items) ? body.items : [];
        if (!ignored) {
          setOutputSeeds(items);
          setOutputActionBySeed((prev) => {
            const next = { ...prev };
            for (const item of items) {
              if (!next[item.id]) next[item.id] = defaultOutputAction(item.status);
            }
            return next;
          });
          setData((prev) => (prev ? { ...prev, publishGate: body.publishGate ?? prev.publishGate } : prev));
        }
      } catch (err: any) {
        if (!ignored) {
          setOutputSeeds([]);
          setOutputError(err?.message ?? "output_seed_load_failed");
        }
      } finally {
        if (!ignored) setOutputLoading(false);
      }
    }
    loadOutputSeeds();
    return () => {
      ignored = true;
    };
  }, [params.id]);

  if (loading) {
    return <main className="p-6 text-sm text-[rgb(var(--muted))]">Lade Anlassraum …</main>;
  }

  if (error || !data?.item) {
    return <main className="p-6 text-sm text-rose-700">{error ?? "Nicht gefunden"}</main>;
  }

  const { item, sources = [], structure } = data;
  const publishGate = data.publishGate ?? { ok: false, reasons: ["missing_gate"], sourceCount: 0 };
  const createFromAnlassraumHref = buildCreateFastPathHref({
    anlassraumId: String(item.id || ""),
    source: "anlassraum_detail",
    signalTitle: typeof item.title === "string" ? item.title : null,
    region: typeof item.regionKey === "string" ? item.regionKey : null,
    scope: typeof item.scope === "string" ? item.scope : null,
    clusterHint: typeof item.clusterKey === "string" ? item.clusterKey : null,
    reason: "manual_fast_path_via_create",
  });
  const operatorFocus = deriveOperatorFocus({
    publishGateOk: publishGate.ok,
    hasDossier: Boolean(item.dossierId),
    publishGateReasons: publishGate.reasons,
    sourceCount: publishGate.sourceCount,
  });

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          Admin · Anlassraum
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">{item.title}</h1>
        <p className="text-sm text-[rgb(var(--fg))]">
          {item.status} · {formatSourceModeLabel(item.sourceMode)} · score {item.relevanceScore}
        </p>
        <p className="text-sm text-[rgb(var(--muted))]">
          Relevanzraum: {formatRelevanceScopeLabel(item.scope)} / {formatRelevanceScopeLabel(item.decisionScope)} · Herkunft:{" "}
          {formatOriginTypeLabel(item.originType)} · Trägerschaft: {formatOwnerTypeLabel(item.ownerType)}
        </p>
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            publishGate.ok
              ? "border-emerald-300/70 bg-emerald-50/70 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/12 dark:text-emerald-100"
              : "border-amber-300/70 bg-amber-50/70 text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/12 dark:text-amber-100"
          }`}
        >
          <p className="font-semibold">{operatorFocus.title}</p>
          <p className="mt-1 text-xs">{operatorFocus.detail}</p>
          <p className="mt-2 text-xs">
            Publish-Gate: {publishGate.ok ? "freigegeben" : "blockiert"} · Quellen {publishGate.sourceCount}
            {typeof publishGate.requiredSourceCount === "number" ? ` / benötigt ${publishGate.requiredSourceCount}` : ""}
          </p>
          {!publishGate.ok && publishGate.reasons.length > 0 ? (
            <p className="mt-1 text-xs">{publishGate.reasons.join(", ")}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href={createFromAnlassraumHref} className="rounded-full bg-slate-900 px-4 py-2 font-semibold text-white">
            Manuell via /create weiterführen
          </Link>
          <Link
            href="/admin/feeds/drafts"
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 font-semibold text-[rgb(var(--fg))] hover:border-sky-300/70 hover:bg-sky-50 dark:hover:border-sky-300/45 dark:hover:bg-sky-500/12"
          >
            Feed-Drafts Queue
          </Link>
          <Link
            href="/admin/feeds/anlassraum"
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 font-semibold text-[rgb(var(--fg))] hover:border-sky-300/70 hover:bg-sky-50 dark:hover:border-sky-300/45 dark:hover:bg-sky-500/12"
          >
            Zur Übersicht
          </Link>
          {item.dossierId ? (
            <Link
              href={`/admin/dossiers/${encodeURIComponent(item.dossierId)}`}
              className="rounded-full border border-[rgb(var(--border))] px-4 py-2 font-semibold text-[rgb(var(--fg))] hover:border-sky-300/70 hover:bg-sky-50 dark:hover:border-sky-300/45 dark:hover:bg-sky-500/12"
            >
              Dossier-Verdichtung öffnen
            </Link>
          ) : null}
        </div>
        <p className="text-xs text-[rgb(var(--muted))]">
          Anlassraum bleibt eigenständiger Arbeitsraum. Dossier-Verdichtung ist ein bewusster, optionaler Folgeschritt.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={Boolean(transitioning)}
              onClick={() => runTransition(action.id)}
              className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {transitioning === action.id ? "..." : action.label}
            </button>
          ))}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Arbeitskontext</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-[rgb(var(--fg))]">
              <span className="font-semibold">Relevanzraum:</span> {formatRelevanceScopeLabel(item.scope)} /{" "}
              {formatRelevanceScopeLabel(item.decisionScope)}
            </p>
            <p className="text-[rgb(var(--fg))]">
              <span className="font-semibold">Herkunft:</span> {formatOriginTypeLabel(item.originType)}
            </p>
            <p className="text-[rgb(var(--fg))]">
              <span className="font-semibold">Trägerschaft:</span> {formatOwnerTypeLabel(item.ownerType)}
            </p>
            <p className="text-[rgb(var(--fg))]">
              <span className="font-semibold">Topic:</span> {item.topicKey ?? "offen"}
            </p>
            <p className="text-[rgb(var(--fg))]">
              <span className="font-semibold">Cluster:</span> {item.clusterKey ?? "offen"}
            </p>
            <p className="text-[rgb(var(--fg))]">
              <span className="font-semibold">Quellenlage:</span> {sources.length} referenzierte Quelle
              {sources.length === 1 ? "" : "n"}
            </p>
            {sources.slice(0, 3).map((source, index) => (
              <p key={`source-preview-${index}`} className="text-xs text-[rgb(var(--muted))]">
                {sourcePreviewLabel(source, index)}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Output-Übergänge</h2>
          {outputError && (
            <p className="mt-2 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
              {outputError}
            </p>
          )}
          <div className="mt-3 overflow-auto rounded border border-[rgb(var(--border))]">
            <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
              <thead className="bg-[rgb(var(--bg))]">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--fg))]">Output-Typ</th>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--fg))]">Status</th>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--fg))]">Review-Status</th>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--fg))]">Publish-Ziel</th>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--fg))]">Letzte Aktion</th>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--fg))]">Nächste Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border))]">
                {outputLoading && (
                  <tr>
                    <td colSpan={6} className="px-2 py-3 text-[rgb(var(--muted))]">
                      Lade Output-Seeds …
                    </td>
                  </tr>
                )}
                {!outputLoading && outputSeeds.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-3 text-[rgb(var(--muted))]">
                      Keine Output-Seeds vorhanden.
                    </td>
                  </tr>
                )}
                {!outputLoading &&
                  outputSeeds.map((seed) => (
                    <tr key={seed.id}>
                      <td className="px-2 py-2 align-top text-[rgb(var(--fg))]">{seed.outputType}</td>
                      <td className="px-2 py-2 align-top text-[rgb(var(--fg))]">{seed.status}</td>
                      <td className="px-2 py-2 align-top text-[rgb(var(--fg))]">{seed.reviewState}</td>
                      <td className="px-2 py-2 align-top text-[rgb(var(--fg))]">{seed.publishTarget ?? "—"}</td>
                      <td className="px-2 py-2 align-top text-[rgb(var(--fg))]">
                        <p>{seed.lastAction ?? "—"}</p>
                        <p className="text-xs text-[rgb(var(--muted))]">{seed.lastActionBy ?? "—"}</p>
                        <p className="text-xs text-[rgb(var(--muted))]">{formatIso(seed.lastActionAt)}</p>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div className="flex min-w-[260px] flex-col gap-1">
                          <select
                            value={outputActionBySeed[seed.id] ?? defaultOutputAction(seed.status)}
                            onChange={(e) =>
                              setOutputActionBySeed((prev) => ({
                                ...prev,
                                [seed.id]: e.target.value as OutputAction,
                              }))
                            }
                            className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-xs"
                          >
                            {OUTPUT_ACTIONS.map((action) => (
                              <option key={action} value={action}>
                                {OUTPUT_ACTION_LABELS[action]}
                              </option>
                            ))}
                          </select>
                          <input
                            value={outputPublishTargetBySeed[seed.id] ?? ""}
                            onChange={(e) =>
                              setOutputPublishTargetBySeed((prev) => ({
                                ...prev,
                                [seed.id]: e.target.value,
                              }))
                            }
                            placeholder="Publish-Ziel (nur bei manueller Publikation)"
                            className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-xs"
                          />
                          <input
                            value={outputReviewNoteBySeed[seed.id] ?? ""}
                            onChange={(e) =>
                              setOutputReviewNoteBySeed((prev) => ({
                                ...prev,
                                [seed.id]: e.target.value,
                              }))
                            }
                            placeholder="Review-Notiz (optional)"
                            className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-xs"
                          />
                          <button
                            type="button"
                            disabled={Boolean(outputTransitioningSeedId)}
                            onClick={() => runOutputTransition(seed.id)}
                            className="rounded border border-[rgb(var(--border))] px-2 py-1 text-xs font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {outputTransitioningSeedId === seed.id ? "..." : "Übernehmen"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <details className="rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-[rgb(var(--muted))]">Diagnose & JSON (nachgeordnet)</summary>
        <p className="mt-2 text-xs text-[rgb(var(--muted))]">
          Audit-Readout für Deep-Dive und Fehlersuche. Der operative Arbeitsfluss bleibt oben.
        </p>
        <section className="mt-3 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 lg:col-span-1">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Meta</h2>
            <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
              {JSON.stringify(item, null, 2)}
            </pre>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 lg:col-span-1">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Quellen-JSON</h2>
            <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
              {JSON.stringify(sources, null, 2)}
            </pre>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 lg:col-span-1">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Struktur-JSON</h2>
            <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
              {JSON.stringify(structure ?? {}, null, 2)}
            </pre>
          </div>
          {publishGate.evidence ? (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 lg:col-span-3">
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Publish-Gate Evidence</h2>
              <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
                {JSON.stringify(publishGate.evidence, null, 2)}
              </pre>
            </div>
          ) : null}
        </section>
      </details>
    </main>
  );

  async function runTransition(action: (typeof ACTIONS)[number]["id"]) {
    setTransitioning(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/feeds/anlassraum/${params.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await res.json().catch(() => ({} as any));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? res.statusText);
      }
      setData((prev) => {
        if (!prev?.item) return prev;
        return {
          ...prev,
          item: {
            ...prev.item,
            ...body.item,
          },
          publishGate: body.publishGate ?? prev.publishGate,
        };
      });
    } catch (err: any) {
      setError(err?.message ?? "transition_failed");
    } finally {
      setTransitioning(null);
    }
  }

  async function runOutputTransition(seedId: string) {
    const action = outputActionBySeed[seedId] ?? "send_to_review";
    setOutputTransitioningSeedId(seedId);
    setOutputError(null);
    try {
      const payload: Record<string, unknown> = { action };
      const publishTarget = String(outputPublishTargetBySeed[seedId] ?? "").trim();
      const reviewNote = String(outputReviewNoteBySeed[seedId] ?? "").trim();
      if (action === "publish") payload.publishTarget = publishTarget;
      if (reviewNote) payload.reviewNote = reviewNote;

      const res = await fetch(`/api/admin/feeds/anlassraum/${params.id}/outputs/${seedId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        seed?: OutputSeedItem;
        publishGate?: AnlassraumDetailResponse["publishGate"];
        error?: string;
      };
      if (!res.ok || !body?.ok || !body.seed) {
        throw new Error(body?.error ?? res.statusText);
      }

      setOutputSeeds((prev) => prev.map((item) => (item.id === seedId ? { ...item, ...body.seed } : item)));
      setData((prev) => (prev ? { ...prev, publishGate: body.publishGate ?? prev.publishGate } : prev));
      setOutputActionBySeed((prev) => ({
        ...prev,
        [seedId]: defaultOutputAction(body.seed?.status ?? "draft"),
      }));
    } catch (err: any) {
      setOutputError(err?.message ?? "output_seed_transition_failed");
    } finally {
      setOutputTransitioningSeedId(null);
    }
  }
}

function deriveOperatorFocus(input: {
  publishGateOk: boolean;
  hasDossier: boolean;
  publishGateReasons: string[];
  sourceCount: number;
}): { title: string; detail: string } {
  if (!input.publishGateOk) {
    const reasonHint = input.publishGateReasons[0] ? ` Hinweis: ${input.publishGateReasons[0]}.` : "";
    return {
      title: "Quellenlage zuerst absichern",
      detail: `Publikation bleibt blockiert (${input.sourceCount} Quelle${
        input.sourceCount === 1 ? "" : "n"
      }). Anlassraum strukturieren und Primärquellen prüfen, bevor Verdichtung/Publish weitergeführt wird.${reasonHint}`,
    };
  }
  if (input.hasDossier) {
    return {
      title: "Anlassraum stabil halten, Verdichtung gezielt fortführen",
      detail: "Dossier ist bereits verbunden. Anlassraum-Kontext weiter pflegen und Verdichtung bewusst steuern.",
    };
  }
  return {
    title: "Anlassraum weiter strukturieren",
    detail:
      "Signal- und Quellenkontext im Anlassraum ausarbeiten; Dossier-Verdichtung bleibt optional als bewusster nächster Schritt.",
  };
}

function sourcePreviewLabel(source: unknown, index: number): string {
  if (!source || typeof source !== "object") return `Quelle ${index + 1}: ohne lesbare Metadaten`;
  const row = source as Record<string, unknown>;
  const title = typeof row.title === "string" && row.title.trim() ? row.title.trim() : null;
  const label = typeof row.label === "string" && row.label.trim() ? row.label.trim() : null;
  const url = typeof row.url === "string" && row.url.trim() ? row.url.trim() : null;
  if (title) return `Quelle ${index + 1}: ${title}`;
  if (label) return `Quelle ${index + 1}: ${label}`;
  if (url) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return `Quelle ${index + 1}: ${host}`;
    } catch {
      return `Quelle ${index + 1}: ${url}`;
    }
  }
  return `Quelle ${index + 1}: ohne Titel/URL`;
}

function defaultOutputAction(status: string): OutputAction {
  if (status === "draft") return "send_to_review";
  if (status === "queued") return "send_to_review";
  if (status === "review") return "approve_prep";
  if (status === "ready") return "publish";
  if (status === "published") return "discard";
  return "reset_draft";
}

function formatIso(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
}
