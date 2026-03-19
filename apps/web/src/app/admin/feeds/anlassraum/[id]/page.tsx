"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  { id: "curate", label: "Curate" },
  { id: "review", label: "Review" },
  { id: "approve", label: "Approve" },
  { id: "activate", label: "Activate" },
  { id: "archive", label: "Archive" },
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

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          Admin · Anlassraum
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">{item.title}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          {item.status} · {item.sourceMode} · score {item.relevanceScore}
        </p>
        <p className="text-xs text-[rgb(var(--muted))]">
          Publish gate: {publishGate.ok ? "ok" : "blocked"} · sources {publishGate.sourceCount}
          {typeof publishGate.requiredSourceCount === "number" ? ` / required ${publishGate.requiredSourceCount}` : ""}
        </p>
        {!publishGate.ok && publishGate.reasons.length > 0 && (
          <p className="text-xs text-rose-700">{publishGate.reasons.join(", ")}</p>
        )}
        {publishGate.evidence && (
          <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-2 text-[11px] text-[rgb(var(--muted))]">
            {JSON.stringify(publishGate.evidence, null, 2)}
          </pre>
        )}
        <p className="flex gap-3 text-sm">
          <Link href="/admin/feeds/anlassraum" className="text-sky-700 hover:underline">
            Zur Übersicht
          </Link>
          <Link href="/admin/feeds/drafts" className="text-sky-700 hover:underline">
            Zu Feed-Drafts
          </Link>
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

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Meta</h2>
          <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
            {JSON.stringify(item, null, 2)}
          </pre>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Output Seeds</h2>
          {outputError && (
            <p className="mt-2 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
              {outputError}
            </p>
          )}
          <div className="mt-3 overflow-auto rounded border border-[rgb(var(--border))]">
            <table className="min-w-full divide-y divide-[rgb(var(--border))] text-xs">
              <thead className="bg-[rgb(var(--bg))]">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--muted))]">Type</th>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--muted))]">Status</th>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--muted))]">Review</th>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--muted))]">Publish Target</th>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--muted))]">Last Action</th>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--muted))]">Transition</th>
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
                      <td className="px-2 py-2 align-top text-[rgb(var(--muted))]">{seed.status}</td>
                      <td className="px-2 py-2 align-top text-[rgb(var(--muted))]">{seed.reviewState}</td>
                      <td className="px-2 py-2 align-top text-[rgb(var(--muted))]">{seed.publishTarget ?? "—"}</td>
                      <td className="px-2 py-2 align-top text-[rgb(var(--muted))]">
                        <p>{seed.lastAction ?? "—"}</p>
                        <p>{seed.lastActionBy ?? "—"}</p>
                        <p>{formatIso(seed.lastActionAt)}</p>
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
                                {action}
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
                            placeholder="publishTarget (nur fuer publish)"
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
                            placeholder="reviewNote (optional)"
                            className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-xs"
                          />
                          <button
                            type="button"
                            disabled={Boolean(outputTransitioningSeedId)}
                            onClick={() => runOutputTransition(seed.id)}
                            className="rounded border border-[rgb(var(--border))] px-2 py-1 text-xs font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {outputTransitioningSeedId === seed.id ? "..." : "Apply"}
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

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Sources</h2>
          <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
            {JSON.stringify(sources, null, 2)}
          </pre>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Structure</h2>
          <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
            {JSON.stringify(structure ?? {}, null, 2)}
          </pre>
        </div>
      </section>
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
