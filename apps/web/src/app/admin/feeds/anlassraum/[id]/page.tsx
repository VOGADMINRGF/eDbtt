"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { buildCreateFastPathHref } from "@/features/create/intents";
import { useLocale } from "@/context/LocaleContext";
import {
  formatOriginTypeLabel,
  formatOwnerTypeLabel,
  formatRelevanceScopeLabel,
  formatSourceModeLabel,
} from "@/features/relevanceFraming";
import {
  formatOperatorDateTime,
  formatOperatorNumber,
  formatOperatorTokenLabel,
  formatOutputActionLabel,
  formatOutputSeedReviewStateLabel,
  formatOutputSeedStatusLabel,
  formatOpenLabel,
  getOperatorAnlassraumDetailTexts,
  resolveOperatorLocale,
  type OperatorAnlassraumDetailTexts,
  type OperatorLocale,
} from "@/features/i18n/operatorSystemTexts";

export type AnlassraumDetailResponse = {
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

const ACTIONS = ["curate", "review", "approve", "activate", "archive"] as const;

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
type AnlassraumDetailTexts = OperatorAnlassraumDetailTexts;

export default function AdminAnlassraumDetailPage({
  initialDataForTest,
}: {
  initialDataForTest?: AnlassraumDetailResponse | null;
} = {}) {
  const { locale } = useLocale();
  const operatorLocale = resolveOperatorLocale(locale);
  const text = getOperatorAnlassraumDetailTexts(operatorLocale);

  const params = useParams<{ id: string }>();
  const [data, setData] = useState<AnlassraumDetailResponse | null>(initialDataForTest ?? null);
  const [loading, setLoading] = useState(!initialDataForTest);
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
    if (initialDataForTest) return;
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
  }, [params.id, initialDataForTest]);

  useEffect(() => {
    if (initialDataForTest) return;
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
  }, [params.id, initialDataForTest]);

  if (loading) {
    return <main className="p-6 text-sm text-[rgb(var(--muted))]">{text.loading}</main>;
  }

  if (error || !data?.item) {
    return <main className="p-6 text-sm text-rose-700">{error ?? text.notFound}</main>;
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
    text,
    locale: operatorLocale,
    publishGateOk: publishGate.ok,
    hasDossier: Boolean(item.dossierId),
    publishGateReasons: publishGate.reasons,
    sourceCount: publishGate.sourceCount,
  });

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          {text.headerKicker}
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">{item.title}</h1>
        <p className="text-sm text-[rgb(var(--fg))]">
          {formatOutputSeedStatusLabel(String(item.status ?? ""), operatorLocale)} ·{" "}
          {formatSourceModeLabel(item.sourceMode)} · {text.scoreLabel} {formatOperatorNumber(item.relevanceScore, operatorLocale)}
        </p>
        <p className="text-sm text-[rgb(var(--muted))]">
          {text.relevanceLabel}: {formatRelevanceScopeLabel(item.scope)} / {formatRelevanceScopeLabel(item.decisionScope)} ·{" "}
          {text.originLabel}: {formatOriginTypeLabel(item.originType)} · {text.ownerLabel}:{" "}
          {formatOwnerTypeLabel(item.ownerType)}
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
            {text.publishGateLabel}: {publishGate.ok ? text.publishGateReleased : text.publishGateBlocked} ·{" "}
            {text.sourcesLabel} {formatOperatorNumber(publishGate.sourceCount, operatorLocale)}
            {typeof publishGate.requiredSourceCount === "number"
              ? ` / ${text.requiredLabel} ${formatOperatorNumber(publishGate.requiredSourceCount, operatorLocale)}`
              : ""}
          </p>
          {!publishGate.ok && publishGate.reasons.length > 0 ? (
            <p className="mt-1 text-xs">
              {text.hintLabel}: {publishGate.reasons.join(", ")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href={createFromAnlassraumHref} className="rounded-full bg-slate-900 px-4 py-2 font-semibold text-white">
            {text.linkToCreate}
          </Link>
          <Link
            href="/admin/feeds/drafts"
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 font-semibold text-[rgb(var(--fg))] hover:border-sky-300/70 hover:bg-sky-50 dark:hover:border-sky-300/45 dark:hover:bg-sky-500/12"
          >
            {text.linkToDraftQueue}
          </Link>
          <Link
            href="/admin/feeds/anlassraum"
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 font-semibold text-[rgb(var(--fg))] hover:border-sky-300/70 hover:bg-sky-50 dark:hover:border-sky-300/45 dark:hover:bg-sky-500/12"
          >
            {text.linkToOverview}
          </Link>
          {item.dossierId ? (
            <Link
              href={`/admin/dossiers/${encodeURIComponent(item.dossierId)}`}
              className="rounded-full border border-[rgb(var(--border))] px-4 py-2 font-semibold text-[rgb(var(--fg))] hover:border-sky-300/70 hover:bg-sky-50 dark:hover:border-sky-300/45 dark:hover:bg-sky-500/12"
            >
              {text.linkToDossier}
            </Link>
          ) : null}
        </div>
        <p className="text-xs text-[rgb(var(--muted))]">
          {text.optionalDossierLead}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              disabled={Boolean(transitioning)}
              onClick={() => runTransition(action)}
              className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {transitioning === action ? "..." : formatAnlassraumActionLabel(action, text)}
            </button>
          ))}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{text.workspaceContext}</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-[rgb(var(--fg))]">
              <span className="font-semibold">{text.relevanceLabel}:</span> {formatRelevanceScopeLabel(item.scope)} /{" "}
              {formatRelevanceScopeLabel(item.decisionScope)}
            </p>
            <p className="text-[rgb(var(--fg))]">
              <span className="font-semibold">{text.originLabel}:</span> {formatOriginTypeLabel(item.originType)}
            </p>
            <p className="text-[rgb(var(--fg))]">
              <span className="font-semibold">{text.ownerLabel}:</span> {formatOwnerTypeLabel(item.ownerType)}
            </p>
            <p className="text-[rgb(var(--fg))]">
              <span className="font-semibold">{text.topicLabel}:</span> {item.topicKey ?? formatOpenLabel(operatorLocale)}
            </p>
            <p className="text-[rgb(var(--fg))]">
              <span className="font-semibold">{text.clusterLabel}:</span> {item.clusterKey ?? formatOpenLabel(operatorLocale)}
            </p>
            <p className="text-[rgb(var(--fg))]">
              <span className="font-semibold">{text.sourceSituationLabel}:</span> {formatOperatorNumber(sources.length, operatorLocale)}{" "}
              {text.sourcesLabel}
            </p>
            {sources.slice(0, 3).map((source, index) => (
              <p key={`source-preview-${index}`} className="text-xs text-[rgb(var(--muted))]">
                {sourcePreviewLabel(source, index, text)}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{text.outputTransitions}</h2>
          {outputError && (
            <p className="mt-2 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
              {outputError}
            </p>
          )}
          <div className="mt-3 overflow-auto rounded border border-[rgb(var(--border))]">
            <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
              <thead className="bg-[rgb(var(--bg))]">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--fg))]">{text.colOutputType}</th>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--fg))]">{text.colStatus}</th>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--fg))]">{text.colReviewState}</th>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--fg))]">{text.colPublishTarget}</th>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--fg))]">{text.colLastAction}</th>
                  <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--fg))]">{text.colNextAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border))]">
                {outputLoading && (
                  <tr>
                    <td colSpan={6} className="px-2 py-3 text-[rgb(var(--muted))]">
                      {text.loadingOutputSeeds}
                    </td>
                  </tr>
                )}
                {!outputLoading && outputSeeds.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-3 text-[rgb(var(--muted))]">
                      {text.emptyOutputSeeds}
                    </td>
                  </tr>
                )}
                {!outputLoading &&
                  outputSeeds.map((seed) => (
                    <tr key={seed.id}>
                      <td className="px-2 py-2 align-top text-[rgb(var(--fg))]">{seed.outputType}</td>
                      <td className="px-2 py-2 align-top text-[rgb(var(--fg))]">
                        {formatOutputSeedStatusLabel(seed.status, operatorLocale)}
                      </td>
                      <td className="px-2 py-2 align-top text-[rgb(var(--fg))]">
                        {formatOutputSeedReviewStateLabel(seed.reviewState, operatorLocale)}
                      </td>
                      <td className="px-2 py-2 align-top text-[rgb(var(--fg))]">{seed.publishTarget ?? "—"}</td>
                      <td className="px-2 py-2 align-top text-[rgb(var(--fg))]">
                        <p>{formatOperatorTokenLabel(seed.lastAction)}</p>
                        <p className="text-xs text-[rgb(var(--muted))]">{seed.lastActionBy ?? "—"}</p>
                        <p className="text-xs text-[rgb(var(--muted))]">
                          {formatOperatorDateTime(seed.lastActionAt, operatorLocale)}
                        </p>
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
                                {formatOutputActionLabel(action, operatorLocale)}
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
                            placeholder={text.publishTargetPlaceholder}
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
                            placeholder={text.reviewNotePlaceholder}
                            className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-xs"
                          />
                          <button
                            type="button"
                            disabled={Boolean(outputTransitioningSeedId)}
                            onClick={() => runOutputTransition(seed.id)}
                            className="rounded border border-[rgb(var(--border))] px-2 py-1 text-xs font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {outputTransitioningSeedId === seed.id ? "..." : text.apply}
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
        <summary className="cursor-pointer text-sm font-medium text-[rgb(var(--muted))]">{text.diagnosticsTitle}</summary>
        <p className="mt-2 text-xs text-[rgb(var(--muted))]">
          {text.diagnosticsLead}
        </p>
        <section className="mt-3 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 lg:col-span-1">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{text.metaJsonTitle}</h2>
            <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
              {JSON.stringify(item, null, 2)}
            </pre>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 lg:col-span-1">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{text.sourcesJsonTitle}</h2>
            <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
              {JSON.stringify(sources, null, 2)}
            </pre>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 lg:col-span-1">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{text.structureJsonTitle}</h2>
            <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
              {JSON.stringify(structure ?? {}, null, 2)}
            </pre>
          </div>
          {publishGate.evidence ? (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 lg:col-span-3">
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{text.publishGateEvidenceTitle}</h2>
              <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
                {JSON.stringify(publishGate.evidence, null, 2)}
              </pre>
            </div>
          ) : null}
        </section>
      </details>
    </main>
  );

  async function runTransition(action: (typeof ACTIONS)[number]) {
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
      setError(err?.message ?? text.transitionFailed);
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
      setOutputError(err?.message ?? text.outputTransitionFailed);
    } finally {
      setOutputTransitioningSeedId(null);
    }
  }
}

function deriveOperatorFocus(input: {
  text: AnlassraumDetailTexts;
  locale: OperatorLocale;
  publishGateOk: boolean;
  hasDossier: boolean;
  publishGateReasons: string[];
  sourceCount: number;
}): { title: string; detail: string } {
  const { text, locale } = input;
  if (!input.publishGateOk) {
    const reasonHint = input.publishGateReasons[0] ? ` ${text.hintLabel}: ${input.publishGateReasons[0]}.` : "";
    const sourceWord = input.sourceCount === 1 ? text.operatorFocusNeedsSourcesMiddle : text.sourcesLabel;
    const formattedSourceCount = formatOperatorNumber(input.sourceCount, locale);
    return {
      title: text.operatorFocusNeedsSourcesTitle,
      detail: `${text.operatorFocusNeedsSourcesPrefix} (${formattedSourceCount} ${sourceWord}). ${text.operatorFocusNeedsSourcesSuffix}${reasonHint}`,
    };
  }
  if (input.hasDossier) {
    return {
      title: text.operatorFocusHasDossierTitle,
      detail: text.operatorFocusHasDossierDetail,
    };
  }
  return {
    title: text.operatorFocusContinueTitle,
    detail: text.operatorFocusContinueDetail,
  };
}

function sourcePreviewLabel(source: unknown, index: number, text: AnlassraumDetailTexts): string {
  if (!source || typeof source !== "object") return `${text.sourcePrefix} ${index + 1}: ${text.sourceNoMetaSuffix}`;
  const row = source as Record<string, unknown>;
  const title = typeof row.title === "string" && row.title.trim() ? row.title.trim() : null;
  const label = typeof row.label === "string" && row.label.trim() ? row.label.trim() : null;
  const url = typeof row.url === "string" && row.url.trim() ? row.url.trim() : null;
  if (title) return `${text.sourcePrefix} ${index + 1}: ${title}`;
  if (label) return `${text.sourcePrefix} ${index + 1}: ${label}`;
  if (url) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return `${text.sourcePrefix} ${index + 1}: ${host}`;
    } catch {
      return `${text.sourcePrefix} ${index + 1}: ${url}`;
    }
  }
  return `${text.sourcePrefix} ${index + 1}: ${text.sourceNoTitleOrUrlSuffix}`;
}

function defaultOutputAction(status: string): OutputAction {
  if (status === "draft") return "send_to_review";
  if (status === "queued") return "send_to_review";
  if (status === "review") return "approve_prep";
  if (status === "ready") return "publish";
  if (status === "published") return "discard";
  return "reset_draft";
}

function formatAnlassraumActionLabel(action: (typeof ACTIONS)[number], text: AnlassraumDetailTexts): string {
  if (action === "curate") return text.actionCurate;
  if (action === "review") return text.actionReview;
  if (action === "approve") return text.actionApprove;
  if (action === "activate") return text.actionActivate;
  return text.actionArchive;
}
