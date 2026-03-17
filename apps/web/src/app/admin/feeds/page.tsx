"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

export default function AdminFeedsPage() {
  const [config, setConfig] = useState<FeedConfigResponse | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

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
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Admin · Feeds</p>
        <h1 className="mt-1 text-2xl font-bold text-[rgb(var(--fg))]">Feed Control Plane</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Konfiguration einsehen, Pull/Analyse manuell ausführen und Batch-Imports als JSON starten.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/feeds/drafts" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Zu Feed-Drafts
          </Link>
          <Link
            href="/admin/feeds/anlassraum"
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))]"
          >
            Zu Anlassräumen
          </Link>
          <Link
            href="/admin/acquisition"
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))]"
          >
            Zu Akquise Dashboard
          </Link>
        </div>
      </header>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Feed-Konfiguration</h2>
          <span className="text-xs text-[rgb(var(--muted))]">{feedCount} deduplizierte Feeds</span>
        </div>
        {configLoading && <p className="mt-3 text-sm text-[rgb(var(--muted))]">Lade Konfiguration …</p>}
        {configError && <p className="mt-3 text-sm text-rose-700">{configError}</p>}
        {!configLoading && !configError && config?.scopes?.map((scope) => (
          <div key={scope.scope} className="mt-4 rounded-2xl border border-[rgb(var(--border))] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                Scope `{scope.scope}` {scope.version ? `· v${scope.version}` : ""}
              </p>
              <p className="text-xs text-[rgb(var(--muted))]">{scope.feeds?.length ?? 0} Feeds</p>
            </div>
            {scope.ok ? (
              <>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">{scope.source ?? "keine Quelle gefunden"}</p>
                {Boolean(scope.invalidFeedUrls?.length) && (
                  <p className="mt-2 text-xs text-amber-700">
                    {scope.invalidFeedUrls?.length} ungültige Feed-URLs wurden ignoriert.
                  </p>
                )}
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
                      <tr>
                        <th className="px-2 py-2">Region</th>
                        <th className="px-2 py-2">Topic</th>
                        <th className="px-2 py-2">Feed URL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgb(var(--border))]">
                      {(scope.feeds ?? []).map((feed) => (
                        <tr key={`${scope.scope}:${feed.regionCode}:${feed.feedUrl}`}>
                          <td className="px-2 py-2">{feed.regionCode ?? "GLOBAL"}</td>
                          <td className="px-2 py-2">{feed.topicHints?.join(", ") || "—"}</td>
                          <td className="px-2 py-2">
                            <a href={feed.feedUrl} className="text-sky-700 hover:underline" target="_blank" rel="noreferrer">
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
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Pull + Analyze</h2>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            Pull lädt Feed-Artikel in `statement_candidates`; Analyze erzeugt `vote_drafts`.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-[rgb(var(--muted))]">
              Scope
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
              RegionCode (optional)
              <input
                className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
                placeholder="z.B. DE:BE"
                value={pullRegionCode}
                onChange={(e) => setPullRegionCode(e.target.value)}
              />
            </label>
            <label className="text-xs text-[rgb(var(--muted))]">
              Max Feeds
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
              Max Items pro Feed
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
            Dry-Run (nur zählen, nicht schreiben)
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={runPull}
              disabled={pullState.loading}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              {pullState.loading ? "Pull läuft …" : "Feeds abrufen"}
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs text-[rgb(var(--muted))]">
              <span>Analyze limit</span>
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
              className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] disabled:opacity-70"
            >
              {analyzeState.loading ? "Analyze läuft …" : "Analyse starten"}
            </button>
          </div>

          {pullState.error && <p className="mt-3 text-sm text-rose-700">Pull: {pullState.error}</p>}
          {pullState.result && (
            <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--fg))]">
              {JSON.stringify(pullState.result, null, 2)}
            </pre>
          )}
          {analyzeState.error && <p className="mt-3 text-sm text-rose-700">Analyze: {analyzeState.error}</p>}
          {analyzeState.result && (
            <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--fg))]">
              {JSON.stringify(analyzeState.result, null, 2)}
            </pre>
          )}
        </div>

        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Batch Import</h2>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            JSON im Format <code className="font-mono">{"{\"items\":[...]}"}</code> oder direkt{" "}
            <code className="font-mono">[...]</code> einfügen und an{" "}
            <code className="font-mono">/api/feeds/batch</code> senden.
          </p>
          <textarea
            className="mt-3 min-h-[260px] w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 font-mono text-xs text-[rgb(var(--fg))]"
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
          />
          <button
            onClick={runBatch}
            disabled={batchState.loading}
            className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {batchState.loading ? "Import läuft …" : "Import starten"}
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
