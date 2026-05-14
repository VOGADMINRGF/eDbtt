"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type ThemenradarItem = {
  id: string;
  title: string;
  rawSignal: string;
  sourceType: "manual" | "news" | "community" | "create_intake";
  heatScore: number;
  everydayRelevanceScore: number;
  polarizationScore: number;
  membershipPotentialScore: number;
  jurisdiction: "bund" | "land" | "kommune" | "mixed";
  lifecycleStatus:
    | "raw"
    | "qualified"
    | "content_ready"
    | "review_ready"
    | "published"
    | "archived";
  campaignKey?: string | null;
  reviewRequired: true;
  autoPostEligible: false;
  officialSocialRequiresReview: true;
  createdAt: string;
  updatedAt: string;
};

const STATUS_OPTIONS = [
  "all",
  "raw",
  "qualified",
  "content_ready",
  "review_ready",
  "published",
  "archived",
] as const;
const SOURCE_OPTIONS = [
  "all",
  "manual",
  "news",
  "community",
  "create_intake",
] as const;

export default function ThemenradarAdminPage() {
  const searchParams = useSearchParams();
  const prefillSignal = searchParams.get("signal") ?? "";
  const prefillTitle = searchParams.get("title") ?? "";
  const prefillIntent = searchParams.get("entryIntent") ?? "";

  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [sourceFilter, setSourceFilter] =
    useState<(typeof SOURCE_OPTIONS)[number]>("all");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ThemenradarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(prefillTitle);
  const [rawSignal, setRawSignal] = useState(prefillSignal);
  const [sourceType, setSourceType] = useState<ThemenradarItem["sourceType"]>(
    prefillIntent.toLowerCase() === "issue_signal" ? "create_intake" : "manual",
  );
  const [jurisdiction, setJurisdiction] =
    useState<ThemenradarItem["jurisdiction"]>("mixed");
  const [saving, setSaving] = useState(false);

  async function loadList() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sourceFilter !== "all") params.set("sourceType", sourceFilter);
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/admin/themenradar?${params.toString()}`, {
        cache: "no-store",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? "themenradar_list_failed");
      }
      setItems(Array.isArray(body.items) ? body.items : []);
    } catch (loadError: any) {
      setItems([]);
      setError(loadError?.message ?? "themenradar_list_failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sourceFilter, query]);

  const counts = useMemo(() => {
    const result: Record<string, number> = {
      raw: 0,
      qualified: 0,
      content_ready: 0,
      review_ready: 0,
      published: 0,
      archived: 0,
    };
    for (const item of items) {
      result[item.lifecycleStatus] = (result[item.lifecycleStatus] ?? 0) + 1;
    }
    return result;
  }, [items]);

  async function createItem() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/themenradar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          rawSignal,
          sourceType,
          jurisdiction,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? "themenradar_create_failed");
      }
      setTitle("");
      setRawSignal("");
      setSourceType("manual");
      await loadList();
    } catch (saveError: any) {
      setError(saveError?.message ?? "themenradar_create_failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      className="flex w-full max-w-full flex-col gap-6 overflow-x-hidden py-4"
      data-testid="themenradar-admin-page"
    >
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Admin · VOG Themenradar
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">
          Themenradar
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Operator-Fläche für Themenqualifizierung, Content-Vorbereitung und
          review-first Share-ready-Pfade.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" data-testid="themenradar-metrics">
        <MetricCard label="Raw" value={counts.raw ?? 0} />
        <MetricCard label="Content ready" value={counts.content_ready ?? 0} />
        <MetricCard label="Review ready" value={counts.review_ready ?? 0} />
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
        <h2 className="text-base font-semibold text-[rgb(var(--fg))]">
          Neues Thema anlegen
        </h2>
        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
          Assistiv und review-first: kein Auto-Publish, keine automatische
          Priorisierung.
        </p>
        {prefillIntent.toLowerCase() === "issue_signal" && prefillSignal ? (
          <p className="mt-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-200">
            Import aus <code>/create</code> erkannt (issue_signal). Quelle bleibt
            sichtbar und unverändert.
          </p>
        ) : null}
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Titel
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="z. B. Schulgesundheit und Hitze"
              className="rounded-xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Quelle
            <select
              value={sourceType}
              onChange={(event) =>
                setSourceType(event.target.value as ThemenradarItem["sourceType"])
              }
              className="rounded-xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            >
              <option value="manual">Manuell</option>
              <option value="news">News</option>
              <option value="community">Community</option>
              <option value="create_intake">Create Intake</option>
            </select>
          </label>
          <label className="md:col-span-2 flex flex-col gap-1 text-sm">
            Rohsignal
            <textarea
              value={rawSignal}
              onChange={(event) => setRawSignal(event.target.value)}
              placeholder="Beobachtung, Hinweis oder Ausgangstext"
              rows={4}
              className="rounded-xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Zuständigkeitsraum
            <select
              value={jurisdiction}
              onChange={(event) =>
                setJurisdiction(event.target.value as ThemenradarItem["jurisdiction"])
              }
              className="rounded-xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            >
              <option value="mixed">Gemischt</option>
              <option value="bund">Bund</option>
              <option value="land">Land</option>
              <option value="kommune">Kommune</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={createItem}
              disabled={saving}
              className="inline-flex items-center rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
            >
              {saving ? "Speichert …" : "Thema anlegen"}
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-2" data-testid="themenradar-filters">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Suche nach Titel, ID, Status, Quelle oder Verknüpfung"
          data-testid="themenradar-query-filter"
          className="min-w-[18rem] rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as (typeof STATUS_OPTIONS)[number])
          }
          data-testid="themenradar-status-filter"
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              Status: {status}
            </option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(event) =>
            setSourceFilter(event.target.value as (typeof SOURCE_OPTIONS)[number])
          }
          data-testid="themenradar-source-filter"
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm"
        >
          {SOURCE_OPTIONS.map((sourceTypeOption) => (
            <option key={sourceTypeOption} value={sourceTypeOption}>
              Quelle: {sourceTypeOption}
            </option>
          ))}
        </select>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="space-y-3" data-testid="themenradar-list">
        {loading ? (
          <p className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-4 text-sm text-[rgb(var(--muted))]">
            Lade Themenradar …
          </p>
        ) : null}
        {!loading && items.length === 0 ? (
          <p className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-4 text-sm text-[rgb(var(--muted))]">
            Keine Einträge für den aktuellen Filter.
          </p>
        ) : null}

        {!loading &&
          items.map((item) => (
            <article
              key={item.id}
              data-testid="themenradar-list-item"
              className="min-w-0 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-[rgb(var(--fg))]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {item.sourceType} · {item.jurisdiction} · {item.lifecycleStatus}
                  </p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    Kampagne: {item.campaignKey ?? "—"}
                  </p>
                </div>
                <Link
                  href={`/admin/themenradar/${encodeURIComponent(item.id)}`}
                  className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-300 hover:text-sky-700 dark:hover:text-sky-200"
                >
                  Details öffnen
                </Link>
              </div>
              <p className="mt-3 line-clamp-2 break-words text-sm text-[rgb(var(--muted))]">
                {item.rawSignal}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                <ScorePill label="Hitze" value={item.heatScore} />
                <ScorePill
                  label="Alltagsrelevanz"
                  value={item.everydayRelevanceScore}
                />
                <ScorePill
                  label="Polarisierung"
                  value={item.polarizationScore}
                />
                <ScorePill
                  label="Membership"
                  value={item.membershipPotentialScore}
                />
              </div>
              <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                Guardrails: reviewRequired={String(item.reviewRequired)} ·
                autoPostEligible={String(item.autoPostEligible)} ·
                officialSocialRequiresReview=
                {String(item.officialSocialRequiresReview)}
              </p>
            </article>
          ))}
      </section>
    </main>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-xs">
      <p className="font-semibold text-[rgb(var(--fg))]">{label}</p>
      <p className="text-[rgb(var(--muted))]">{value}/100</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">{value}</p>
    </div>
  );
}
