"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import {
  formatOperatorNumber,
  getOperatorFeedsTexts,
  resolveOperatorLocale,
} from "@/features/i18n/operatorSystemTexts";

type FeedConfigScope = {
  scope: string;
  ok: boolean;
  source?: string | null;
  searched?: string[];
  version?: number | null;
  notes?: string[];
  invalidFeedUrls?: string[];
  feeds?: Array<{
    feedUrl: string;
    regionCode: string | null;
    topicHints: string[];
  }>;
  error?: string;
};

type FeedConfigResponse = {
  ok: boolean;
  scopes: FeedConfigScope[];
};

type FeedRuntimeMetric = {
  key: string;
  label: string;
  value: number;
  status: string;
  description: string;
};

type FeedRuntimeResponse = {
  ok: boolean;
  runtime?: {
    sourceStatus: {
      status: string;
      label: string;
      description: string;
    };
    metrics: Record<string, FeedRuntimeMetric>;
    runs: Array<{
      runType: string;
      status: string;
      requestedAt: string | null;
      completedAt: string | null;
      label: string;
      detail: string;
      error: string | null;
    }>;
    nextAction: {
      action: string;
      label: string;
      description: string;
      href: string;
    };
    publicHandoffs: Array<{
      surface: string;
      href: string;
      label: string;
      description: string;
    }>;
    queue: {
      queuedDrafts: number;
      clusteredCandidates: number;
      attachedAnlassraum: number;
      attachedDossier: number;
    };
    topicSupply: {
      totalVisible: number;
      reviewRequired: number;
      buckets: Array<{
        bucket: string;
        label: string;
        count: number;
      }>;
      sources: Array<{
        source: string;
        label: string;
        count: number;
      }>;
      nextAction: {
        label: string;
        description: string;
        href: string;
      };
    };
    sourceAutomation: {
      generatedAt: string;
      items: Array<{
        sourceId: string;
        organizationId: string | null;
        regionId: string | null;
        sourceType: string;
        sourceLabel: string;
        sourceHref: string | null;
        sourceKind: "feed_ref" | "source_connection";
        healthStatus: string;
        healthLabel: string;
        healthHint: string;
        lastPullAt: string | null;
        nextSuggestedPullAt: string | null;
        errorCount: number;
        backoffUntil: string | null;
        signalCount: number;
        reviewCandidateCount: number;
        automationMode: string;
        reviewRequired: true;
        noAutoPublish: true;
        noDeepSearchAuto: true;
        nextAction: {
          label: string;
          description: string;
          href: string;
        };
      }>;
      summary: {
        totalSources: number;
        healthySources: number;
        noisySources: number;
        failingSources: number;
        quietSources: number;
        backoffSources: number;
        reviewCandidateCount: number;
        cronReadySources: number;
        manualSources: number;
        themenradarReadySources: number;
        nextAction: {
          label: string;
          description: string;
          href: string;
        };
      };
    };
  };
  error?: string;
};

type ActionState = {
  loading: boolean;
  error: string | null;
  result: any;
};

const SAMPLE_BATCH = JSON.stringify(
  {
    items: [
      {
        url: "https://example.org/news/123",
        title: "Beispielmeldung",
        summary: "Kurzer Teasertext",
        sourceName: "Demo Feed",
        sourceType: "rss",
        sourceLocale: "de",
        regionCode: "DE:BE",
        topicHint: "verkehr",
      },
    ],
  },
  null,
  2,
);

const PRIMARY_ACTION_CLASS =
  "rounded-full border border-sky-500/60 bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-70 dark:border-sky-400/45 dark:bg-sky-500/25 dark:text-sky-50 dark:hover:bg-sky-500/35";

const INLINE_LINK_CLASS = "text-sky-700 hover:underline dark:text-sky-300 dark:hover:text-sky-200";

export default function AdminFeedsPage() {
  const { locale } = useLocale();
  const operatorLocale = resolveOperatorLocale(locale);
  const text = getOperatorFeedsTexts(operatorLocale);

  const [config, setConfig] = useState<FeedConfigResponse | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [runtimeData, setRuntimeData] = useState<FeedRuntimeResponse["runtime"] | null>(null);
  const [runtimeLoading, setRuntimeLoading] = useState(true);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const [pullScope, setPullScope] = useState<"de" | "global">("de");
  const [pullRegionCode, setPullRegionCode] = useState("");
  const [maxFeeds, setMaxFeeds] = useState(20);
  const [maxItemsPerFeed, setMaxItemsPerFeed] = useState(12);
  const [pullDryRun, setPullDryRun] = useState(false);
  const [analyzeLimit, setAnalyzeLimit] = useState(10);
  const [batchInput, setBatchInput] = useState(SAMPLE_BATCH);

  const [pullState, setPullState] = useState<ActionState>({ loading: false, error: null, result: null });
  const [analyzeState, setAnalyzeState] = useState<ActionState>({ loading: false, error: null, result: null });
  const [batchState, setBatchState] = useState<ActionState>({ loading: false, error: null, result: null });

  useEffect(() => {
    let ignore = false;
    async function loadConfig() {
      setConfigLoading(true);
      setConfigError(null);
      try {
        const res = await fetch("/api/admin/feeds/config", { cache: "no-store" });
        const body = (await res.json().catch(() => ({}))) as FeedConfigResponse & { error?: string };
        if (!res.ok || !body.ok) throw new Error(body?.error ?? res.statusText);
        if (!ignore) setConfig(body);
      } catch (err: any) {
        if (!ignore) {
          setConfig(null);
          setConfigError(err?.message ?? "feeds_config_load_failed");
        }
      } finally {
        if (!ignore) setConfigLoading(false);
      }
    }
    loadConfig();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadRuntime() {
      setRuntimeLoading(true);
      setRuntimeError(null);
      try {
        const res = await fetch("/api/admin/feeds/runtime", { cache: "no-store" });
        const body = (await res.json().catch(() => ({}))) as FeedRuntimeResponse;
        if (!res.ok || !body.ok || !body.runtime) {
          throw new Error(body?.error ?? res.statusText);
        }
        if (!ignore) setRuntimeData(body.runtime);
      } catch (err: any) {
        if (!ignore) {
          setRuntimeData(null);
          setRuntimeError(err?.message ?? "feed_runtime_unavailable");
        }
      } finally {
        if (!ignore) setRuntimeLoading(false);
      }
    }
    loadRuntime();
    return () => {
      ignore = true;
    };
  }, [pullState.result, analyzeState.result, batchState.result]);

  const feedCount = useMemo(() => {
    if (!config?.scopes?.length) return 0;
    return config.scopes.reduce((sum, scope) => sum + (scope.feeds?.length ?? 0), 0);
  }, [config]);

  async function runPull() {
    setPullState({ loading: true, error: null, result: null });
    try {
      const payload: Record<string, unknown> = {
        scope: pullScope,
        maxFeeds,
        maxItemsPerFeed,
        dryRun: pullDryRun,
      };
      if (pullRegionCode.trim()) payload.regionCode = pullRegionCode.trim();

      const res = await fetch("/api/feeds/pull", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setPullState({ loading: false, error: null, result: data });
    } catch (err: any) {
      setPullState({ loading: false, error: err?.message ?? "pull_failed", result: null });
    }
  }

  async function runAnalyze() {
    setAnalyzeState({ loading: true, error: null, result: null });
    try {
      const res = await fetch("/api/feeds/analyze-pending", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ limit: analyzeLimit }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setAnalyzeState({ loading: false, error: null, result: data });
    } catch (err: any) {
      setAnalyzeState({ loading: false, error: err?.message ?? "analyze_failed", result: null });
    }
  }

  async function runBatch() {
    setBatchState({ loading: true, error: null, result: null });
    try {
      const parsed = JSON.parse(batchInput);
      const items = Array.isArray(parsed) ? parsed : parsed?.items;
      if (!Array.isArray(items)) throw new Error("batch_body_must_contain_items_array");

      const res = await fetch("/api/feeds/batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setBatchState({ loading: false, error: null, result: data });
    } catch (err: any) {
      setBatchState({ loading: false, error: err?.message ?? "batch_failed", result: null });
    }
  }

  return (
    <main className="flex w-full flex-col gap-6 py-4">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{text.headerKicker}</p>
        <h1 className="mt-1 text-2xl font-bold text-[rgb(var(--fg))]">{text.headerTitle}</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          {text.headerLead}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/feeds/drafts" className={PRIMARY_ACTION_CLASS}>
            {text.linkToDrafts}
          </Link>
          <Link
            href="/admin/feeds/anlassraum"
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-300/70 hover:bg-sky-50 dark:hover:border-sky-300/45 dark:hover:bg-sky-500/12"
          >
            {text.linkToAnlassraeume}
          </Link>
          <Link
            href="/admin/acquisition"
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-300/70 hover:bg-sky-50 dark:hover:border-sky-300/45 dark:hover:bg-sky-500/12"
          >
            {text.linkToAcquisition}
          </Link>
        </div>
      </header>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Feed-Radar Runtime</h2>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              Manual-first Leitstand: Abruf, Analyse, Review, Cluster und öffentlicher Anschluss
              bleiben getrennte Schritte. Es gibt hier keinen behaupteten Auto-Publish- oder Scheduler-Pfad.
            </p>
          </div>
          {runtimeData ? (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm">
              <p className="font-semibold text-[rgb(var(--fg))]">{runtimeData.sourceStatus.label}</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">{runtimeData.sourceStatus.description}</p>
            </div>
          ) : null}
        </div>
        {runtimeLoading && <p className="mt-3 text-sm text-[rgb(var(--muted))]">Runtime-Leitstand wird geladen.</p>}
        {runtimeError && <p className="mt-3 text-sm text-rose-700">{runtimeError}</p>}
        {runtimeData ? (
          <>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Object.values(runtimeData.metrics).map((metric) => (
                <article
                  key={metric.key}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[rgb(var(--fg))]">
                    {formatOperatorNumber(metric.value, operatorLocale)}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--fg))]">{humanizeFeedStatus(metric.status)}</p>
                  <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{metric.description}</p>
                </article>
              ))}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <article className="rounded-2xl border border-[rgb(var(--border))] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  Nächste Aktion
                </p>
                <p className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">
                  {runtimeData.nextAction.label}
                </p>
                <p className="mt-1 text-sm text-[rgb(var(--muted))]">{runtimeData.nextAction.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={runtimeData.nextAction.href} className={PRIMARY_ACTION_CLASS}>
                    {runtimeData.nextAction.label}
                  </Link>
                  <Link
                    href="/admin/feeds/drafts"
                    className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-300/70 hover:bg-sky-50 dark:hover:border-sky-300/45 dark:hover:bg-sky-500/12"
                  >
                    Review-Queue öffnen
                  </Link>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
                    <p className="font-semibold text-[rgb(var(--fg))]">Reviewpflichtige Vorschläge</p>
                    <p className="mt-1">
                      {formatOperatorNumber(runtimeData.queue.queuedDrafts, operatorLocale)} neue Statement-,
                      Swipe- oder Hinweisvorschläge.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
                    <p className="font-semibold text-[rgb(var(--fg))]">Themenbündel</p>
                    <p className="mt-1">
                      {formatOperatorNumber(runtimeData.queue.clusteredCandidates, operatorLocale)} Cluster-Kandidaten
                      für den Anlassraum.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
                    <p className="font-semibold text-[rgb(var(--fg))]">Anlassraum-Anschluss</p>
                    <p className="mt-1">
                      {formatOperatorNumber(runtimeData.queue.attachedAnlassraum, operatorLocale)} Vorschläge hängen
                      bereits an einem Anlassraum.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
                    <p className="font-semibold text-[rgb(var(--fg))]">Dossier-Anschluss</p>
                    <p className="mt-1">
                      {formatOperatorNumber(runtimeData.queue.attachedDossier, operatorLocale)} Verknüpfungen laufen
                      bereits in einen Dossier-Kontext.
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-[rgb(var(--border))] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  Öffentlicher Anschluss
                </p>
                <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                  Diese Folgeflächen nutzen freigegebene Updates weiter, ohne Wahrheit oder Amtlichkeit zu behaupten.
                </p>
                <div className="mt-3 space-y-3">
                  {runtimeData.publicHandoffs.length > 0 ? (
                    runtimeData.publicHandoffs.map((handoff) => (
                      <div
                        key={handoff.surface}
                        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[rgb(var(--fg))]">{handoff.label}</p>
                            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                              {handoff.description}
                            </p>
                          </div>
                          <Link href={handoff.href} className={INLINE_LINK_CLASS}>
                            Öffnen
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-[rgb(var(--border))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
                      Noch kein öffentlicher Anschluss vorbereitet. Das ist ein ehrlicher Leerzustand und kein Seed-Fallback.
                    </div>
                  )}
                </div>
              </article>
            </div>

            <article className="mt-4 rounded-2xl border border-[rgb(var(--border))] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Topic Supply
              </p>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Öffentliche, regionale und organisationsbezogene Themen werden auf bestehenden Pfaden gebündelt.
              </p>
              <div className="mt-3 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-3">
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
                    <p className="font-semibold text-[rgb(var(--fg))]">Verfügbare Swipe-Themen</p>
                    <p className="mt-1">
                      {formatOperatorNumber(runtimeData.topicSupply.totalVisible, operatorLocale)} sichtbare Themen im aktuellen Supply-Layer.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
                    <p className="font-semibold text-[rgb(var(--fg))]">Reviewbedarf</p>
                    <p className="mt-1">
                      {formatOperatorNumber(runtimeData.topicSupply.reviewRequired, operatorLocale)} Themenhinweise bleiben bewusst in Prüfung.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
                    <p className="font-semibold text-[rgb(var(--fg))]">{runtimeData.topicSupply.nextAction.label}</p>
                    <p className="mt-1">{runtimeData.topicSupply.nextAction.description}</p>
                    <Link href={runtimeData.topicSupply.nextAction.href} className={`mt-2 inline-flex ${INLINE_LINK_CLASS}`}>
                      Öffnen
                    </Link>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3">
                    <p className="text-xs font-semibold text-[rgb(var(--fg))]">Buckets</p>
                    <div className="mt-2 space-y-2 text-xs text-[rgb(var(--muted))]">
                      {runtimeData.topicSupply.buckets.length > 0 ? (
                        runtimeData.topicSupply.buckets.map((bucket) => (
                          <div key={bucket.bucket} className="flex items-center justify-between gap-2">
                            <span>{bucket.label}</span>
                            <span className="font-semibold text-[rgb(var(--fg))]">
                              {formatOperatorNumber(bucket.count, operatorLocale)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p>Noch keine sichtbaren Bucket-Zähler.</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3">
                    <p className="text-xs font-semibold text-[rgb(var(--fg))]">Quellen</p>
                    <div className="mt-2 space-y-2 text-xs text-[rgb(var(--muted))]">
                      {runtimeData.topicSupply.sources.length > 0 ? (
                        runtimeData.topicSupply.sources.map((source) => (
                          <div key={source.source} className="flex items-center justify-between gap-2">
                            <span>{source.label}</span>
                            <span className="font-semibold text-[rgb(var(--fg))]">
                              {formatOperatorNumber(source.count, operatorLocale)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p>Aktuell keine produktiven Quellen im Supply-Layer.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="mt-4 rounded-2xl border border-[rgb(var(--border))] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Quellen-Health
              </p>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Guarded Automation: cron-ready statt behauptetem Dauer-Scheduler, review-first statt Auto-Publish.
              </p>
              <div className="mt-3 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-3">
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
                    <p className="font-semibold text-[rgb(var(--fg))]">Quellen liefern Signale</p>
                    <p className="mt-1">
                      {formatOperatorNumber(runtimeData.sourceAutomation.summary.healthySources, operatorLocale)} von{" "}
                      {formatOperatorNumber(runtimeData.sourceAutomation.summary.totalSources, operatorLocale)} Quellen liefern aktuell verwertbare review-first Signale.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
                    <p className="font-semibold text-[rgb(var(--fg))]">Rauschen, Stille und Fehler</p>
                    <p className="mt-1">
                      {formatOperatorNumber(runtimeData.sourceAutomation.summary.noisySources, operatorLocale)} rauschen,{" "}
                      {formatOperatorNumber(runtimeData.sourceAutomation.summary.quietSources, operatorLocale)} sind seit Tagen still und{" "}
                      {formatOperatorNumber(runtimeData.sourceAutomation.summary.failingSources + runtimeData.sourceAutomation.summary.backoffSources, operatorLocale)} brauchen Fehler- oder Backoff-Prüfung.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
                    <p className="font-semibold text-[rgb(var(--fg))]">Themenradar-Anschluss</p>
                    <p className="mt-1">
                      {formatOperatorNumber(runtimeData.sourceAutomation.summary.reviewCandidateCount, operatorLocale)} reviewfähige Signale aus{" "}
                      {formatOperatorNumber(runtimeData.sourceAutomation.summary.themenradarReadySources, operatorLocale)} Quellen können in Themenradar und Review weiterlaufen.
                    </p>
                    <Link href="/admin/themenradar?mode=autonomous" className={`mt-2 inline-flex ${INLINE_LINK_CLASS}`}>
                      Themenradar öffnen
                    </Link>
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
                    <p className="font-semibold text-[rgb(var(--fg))]">{runtimeData.sourceAutomation.summary.nextAction.label}</p>
                    <p className="mt-1">{runtimeData.sourceAutomation.summary.nextAction.description}</p>
                    <Link href={runtimeData.sourceAutomation.summary.nextAction.href} className={`mt-2 inline-flex ${INLINE_LINK_CLASS}`}>
                      Öffnen
                    </Link>
                  </div>
                </div>
                <div className="space-y-3">
                  {runtimeData.sourceAutomation.items.length > 0 ? (
                    runtimeData.sourceAutomation.items.map((item) => (
                      <div
                        key={item.sourceId}
                        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[rgb(var(--fg))]">{item.sourceLabel}</p>
                            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                              {item.healthLabel} · {humanizeAutomationMode(item.automationMode)} · {humanizeSourceKind(item.sourceKind)}
                              {item.regionId ? ` · ${item.regionId}` : ""}
                              {item.organizationId ? ` · ${item.organizationId}` : ""}
                            </p>
                          </div>
                          <Link href={item.nextAction.href} className={INLINE_LINK_CLASS}>
                            {item.nextAction.label}
                          </Link>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{item.healthHint}</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs text-[rgb(var(--muted))]">
                          <p>
                            Signale: {formatOperatorNumber(item.signalCount, operatorLocale)} · Reviewfähig:{" "}
                            {formatOperatorNumber(item.reviewCandidateCount, operatorLocale)}
                          </p>
                          <p>
                            Fehler: {formatOperatorNumber(item.errorCount, operatorLocale)}
                            {item.backoffUntil ? ` · Backoff bis ${formatRunDate(item.backoffUntil)}` : ""}
                          </p>
                          <p>Letzter Abruf: {formatRunDate(item.lastPullAt)}</p>
                          <p>Nächster Pull-Vorschlag: {formatRunDate(item.nextSuggestedPullAt)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-[rgb(var(--border))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
                      Noch keine Guarded-Automation-Daten sichtbar. Das ist ein ehrlicher Leerzustand ohne behaupteten Dauer-Scheduler.
                    </div>
                  )}
                </div>
              </div>
            </article>

            <article className="mt-4 rounded-2xl border border-[rgb(var(--border))] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Letzte Läufe
              </p>
              <div className="mt-3 space-y-2">
                {runtimeData.runs.length > 0 ? (
                  runtimeData.runs.map((run) => (
                    <div
                      key={`${run.runType}-${run.completedAt ?? run.requestedAt ?? "na"}`}
                      className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                          {run.label} · {humanizeRunStatus(run.status)}
                        </p>
                        <p className="text-xs text-[rgb(var(--muted))]">
                          {formatRunDate(run.completedAt)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">{run.detail}</p>
                      {run.error ? (
                        <p className="mt-1 text-xs text-rose-700">
                          Fehler: {run.error}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[rgb(var(--muted))]">
                    Noch keine Laufhistorie vorhanden. Pull, Import, Analyse und Cluster werden erst nach manueller Auslösung protokolliert.
                  </p>
                )}
              </div>
              <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                Scheduler-Claim bewusst ausgeschlossen: Der aktuelle Pfad ist manuell auslösbar und cron-ready, aber nicht als laufender Auto-Abruf behauptet.
              </p>
            </article>
          </>
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-2xl border border-[rgb(var(--border))] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Nächste Aktion
              </p>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Der Leitstand lädt noch. Danach erscheinen hier echte Zähler statt Demo- oder Seed-Werte.
              </p>
            </article>
            <article className="rounded-2xl border border-[rgb(var(--border))] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Öffentlicher Anschluss
              </p>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Noch kein öffentlicher Anschluss vorbereitet. Das ist ein ehrlicher Leerzustand und kein Seed-Fallback.
              </p>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Quellen-Health
              </p>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Guarded-Automation-Zustände erscheinen nach dem ersten sichtbaren Feed- oder Snapshot-Lauf. Bis dahin gibt es keinen behaupteten Dauer-Scheduler.
              </p>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Letzte Läufe
              </p>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Laufhistorie wird nach dem ersten erfolgreichen Abruf, Import, Analyse- oder Cluster-Lauf sichtbar.
              </p>
              <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                Scheduler-Claim bewusst ausgeschlossen: Der aktuelle Pfad ist manuell auslösbar und cron-ready, aber nicht als laufender Auto-Abruf behauptet.
              </p>
            </article>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{text.sourceConfigTitle}</h2>
          <span className="text-xs text-[rgb(var(--muted))]">
            {formatOperatorNumber(feedCount, operatorLocale)} {text.dedupFeedsSuffix}
          </span>
        </div>
        {configLoading && <p className="mt-3 text-sm text-[rgb(var(--muted))]">{text.loadingConfig}</p>}
        {configError && <p className="mt-3 text-sm text-rose-700">{configError}</p>}
        {!configLoading && !configError && config?.scopes?.map((scope) => (
          <div key={scope.scope} className="mt-4 rounded-2xl border border-[rgb(var(--border))] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                {text.scopeLabel} `{scope.scope}` {scope.version ? `· v${scope.version}` : ""}
              </p>
              <p className="text-xs text-[rgb(var(--muted))]">
                {formatOperatorNumber(scope.feeds?.length ?? 0, operatorLocale)} {text.feedRowsLabel}
              </p>
            </div>
            {scope.ok ? (
              <>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">{scope.source ?? text.sourceMissing}</p>
                {Boolean(scope.invalidFeedUrls?.length) && (
                  <p className="mt-2 text-xs text-amber-700">
                    {formatOperatorNumber(scope.invalidFeedUrls?.length ?? 0, operatorLocale)} {text.invalidUrlsIgnoredSuffix}
                  </p>
                )}
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
                      <tr>
                        <th className="px-2 py-2">{text.colRegion}</th>
                        <th className="px-2 py-2">{text.colTopic}</th>
                        <th className="px-2 py-2">{text.colSignalSource}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgb(var(--border))]">
                      {(scope.feeds ?? []).map((feed) => (
                        <tr key={`${scope.scope}:${feed.regionCode}:${feed.feedUrl}`}>
                          <td className="px-2 py-2">{feed.regionCode ?? text.globalLabel}</td>
                          <td className="px-2 py-2">{feed.topicHints?.join(", ") || "—"}</td>
                          <td className="px-2 py-2">
                            <a href={feed.feedUrl} className={INLINE_LINK_CLASS} target="_blank" rel="noreferrer">
                              {feed.feedUrl}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-rose-700">{scope.error ?? "feeds_config_missing"}</p>
            )}
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{text.pullAnalyzeTitle}</h2>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            {text.pullAnalyzeLead}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-[rgb(var(--muted))]">
              {text.scopeLabel}
              <select
                className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
                value={pullScope}
                onChange={(e) => setPullScope(e.target.value === "global" ? "global" : "de")}
              >
                <option value="de">de</option>
                <option value="global">global</option>
              </select>
            </label>
            <label className="text-xs text-[rgb(var(--muted))]">
              {text.regionCodeOptional}
              <input
                className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
                placeholder={text.regionCodeExamplePlaceholder}
                value={pullRegionCode}
                onChange={(e) => setPullRegionCode(e.target.value)}
              />
            </label>
            <label className="text-xs text-[rgb(var(--muted))]">
              {text.maxFeeds}
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
                value={maxFeeds}
                min={1}
                max={100}
                onChange={(e) => setMaxFeeds(Number(e.target.value) || 20)}
              />
            </label>
            <label className="text-xs text-[rgb(var(--muted))]">
              {text.maxItemsPerFeed}
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
                value={maxItemsPerFeed}
                min={1}
                max={50}
                onChange={(e) => setMaxItemsPerFeed(Number(e.target.value) || 12)}
              />
            </label>
          </div>

          <label className="mt-3 inline-flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
            <input type="checkbox" checked={pullDryRun} onChange={(e) => setPullDryRun(e.target.checked)} />
            {text.dryRunLabel}
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={runPull}
              disabled={pullState.loading}
              className={PRIMARY_ACTION_CLASS}
            >
              {pullState.loading ? text.pullRunning : text.fetchSignalSources}
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs text-[rgb(var(--muted))]">
              <span>{text.analyzeLimit}</span>
              <input
                type="number"
                className="w-16 rounded border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-xs"
                min={1}
                max={50}
                value={analyzeLimit}
                onChange={(e) => setAnalyzeLimit(Number(e.target.value) || 10)}
              />
            </div>
            <button
              onClick={runAnalyze}
              disabled={analyzeState.loading}
              className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-300/70 hover:bg-sky-50 dark:hover:border-sky-300/45 dark:hover:bg-sky-500/12 disabled:opacity-70"
            >
              {analyzeState.loading ? text.analyzeRunning : text.startAnalyze}
            </button>
          </div>

          {pullState.error && (
            <p className="mt-3 text-sm text-rose-700">
              {text.pullErrorPrefix}: {pullState.error}
            </p>
          )}
          {pullState.result && (
            <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--fg))]">
              {JSON.stringify(pullState.result, null, 2)}
            </pre>
          )}
          {analyzeState.error && (
            <p className="mt-3 text-sm text-rose-700">
              {text.analyzeErrorPrefix}: {analyzeState.error}
            </p>
          )}
          {analyzeState.result && (
            <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--fg))]">
              {JSON.stringify(analyzeState.result, null, 2)}
            </pre>
          )}
        </div>

        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{text.batchTitle}</h2>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            {text.batchLead}
          </p>
          <textarea
            className="mt-3 min-h-[260px] w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 font-mono text-xs text-[rgb(var(--fg))]"
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
          />
          <button
            onClick={runBatch}
            disabled={batchState.loading}
            className={`mt-3 ${PRIMARY_ACTION_CLASS}`}
          >
            {batchState.loading ? text.importRunning : text.startImport}
          </button>
          {batchState.error && <p className="mt-3 text-sm text-rose-700">{batchState.error}</p>}
          {batchState.result && (
            <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--fg))]">
              {JSON.stringify(batchState.result, null, 2)}
            </pre>
          )}
        </div>
      </section>
    </main>
  );
}

function humanizeFeedStatus(status: string): string {
  const map: Record<string, string> = {
    source_registered: "Quelle verbunden",
    pulled: "abgerufen",
    candidate_created: "als Hinweis erfasst",
    analyzing: "in Analyse",
    analyzed: "analysiert",
    draft_created: "als Vorschlag vorbereitet",
    clustered: "gebündelt",
    needs_review: "in Prüfung",
    accepted: "angenommen",
    attached_to_anlassraum: "an Anlassraum angehängt",
    attached_to_dossier: "im Dossier-Kontext",
    published_update: "als Update sichtbar",
    rejected: "abgelehnt",
    error: "Fehler",
  };
  return map[status] ?? status;
}

function humanizeRunStatus(status: string): string {
  if (status === "success") return "erfolgreich";
  if (status === "dry_run") return "Dry Run";
  return "Fehler";
}

function humanizeAutomationMode(mode: string) {
  if (mode === "cron_ready") return "Cron-ready";
  if (mode === "manual") return "manuell";
  if (mode === "paused") return "pausiert";
  if (mode === "disabled") return "deaktiviert";
  return mode;
}

function humanizeSourceKind(kind: string) {
  if (kind === "feed_ref") return "Feed";
  if (kind === "source_connection") return "Quellenverbindung";
  return kind;
}

function formatRunDate(value: string | null) {
  if (!value) return "ohne Zeitstempel";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "ohne Zeitstempel";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
