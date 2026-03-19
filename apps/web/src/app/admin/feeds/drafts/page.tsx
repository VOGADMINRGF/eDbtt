"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { VoteDraftSummary, VoteDraftStatus } from "@features/feeds/types";

type RegionOption = { value: string; label: string };

const STATUS_FILTERS: { label: string; value: VoteDraftStatus | "all" }[] = [
  { label: "Alle", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Review", value: "review" },
  { label: "Veröffentlicht", value: "published" },
  { label: "Verworfen", value: "discarded" },
];

const REGION_FILTERS: RegionOption[] = [
  { value: "all", label: "Alle Regionen" },
  { value: "global", label: "Global / offen" },
  { value: "EU", label: "EU / Europa" },
  { value: "DE", label: "Deutschland" },
  { value: "AT", label: "Österreich" },
  { value: "CH", label: "Schweiz" },
];

export default function AdminFeedDraftsPage() {
  const [statusFilter, setStatusFilter] = useState<VoteDraftStatus | "all">("draft");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [items, setItems] = useState<VoteDraftSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignored = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        if (statusFilter !== "all") qs.set("status", statusFilter);
        if (regionFilter !== "all") qs.set("regionCode", regionFilter);
        const res = await fetch(`/api/admin/feeds/drafts?${qs.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || res.statusText);
        }
        const data = await res.json();
        if (!ignored) {
          setItems(data.items ?? []);
        }
      } catch (err: any) {
        if (!ignored) {
          setItems([]);
          setError(err?.message ?? "Unbekannter Fehler beim Laden der Drafts");
        }
      } finally {
        if (!ignored) setLoading(false);
      }
    }
    load();
    return () => {
      ignored = true;
    };
  }, [statusFilter, regionFilter]);

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Admin · Feed-Pipeline
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Drafts aus Feeds</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Übersicht über alle automatisch erzeugten Drafts. Filtere nach Status oder Region und öffne die
          Detailansicht für Reviews & Veröffentlichung.
        </p>
        <p>
          <Link href="/admin/feeds" className="text-sm font-semibold text-sky-700 hover:underline">
            Zur Feed Control Plane
          </Link>
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2">
          {STATUS_FILTERS.map((entry) => (
            <button
              key={entry.value}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                statusFilter === entry.value
                  ? "bg-slate-900 text-white"
                  : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              }`}
              onClick={() => setStatusFilter(entry.value)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm text-[rgb(var(--muted))] shadow-sm"
        >
          {REGION_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
        <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
          <thead className="bg-[rgb(var(--bg))]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Titel</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Region</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Anlassraum</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Quelle</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Analyse</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Pipeline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                  Lädt Drafts …
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                  Keine Drafts für die aktuellen Filter gefunden.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((draft) => (
                <tr key={draft.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/feeds/drafts/${draft.id}`}
                      className="font-semibold text-[rgb(var(--fg))] hover:underline"
                    >
                      {draft.title}
                    </Link>
                    <p className="text-xs text-[rgb(var(--muted))]">
                      {formatDate(draft.createdAt)} · ID {draft.id.slice(-6)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={draft.status} />
                    <p className="text-[11px] text-[rgb(var(--muted))]">
                      queue: {draft.feedReviewState ?? "queued"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[rgb(var(--fg))]">{draft.regionName ?? "–"}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{draft.regionCode ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {draft.anlassraumId ? (
                      <Link href={`/admin/feeds/anlassraum/${draft.anlassraumId}`} className="text-sky-700 hover:underline">
                        {draft.anlassraumId.slice(-8)}
                      </Link>
                    ) : (
                      <span className="text-[rgb(var(--muted))]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {draft.sourceUrl ? (
                      <a
                        href={draft.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-600 hover:underline"
                      >
                        {extractDomain(draft.sourceUrl)}
                      </a>
                    ) : (
                      <span className="text-[rgb(var(--muted))]">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[rgb(var(--muted))]">
                    {draft.analyzeCompletedAt ? formatDate(draft.analyzeCompletedAt) : "offen"}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    {draft.pipeline}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: VoteDraftStatus }) {
  const colors: Record<VoteDraftStatus, string> = {
    draft: "bg-[rgb(var(--bg))] text-[rgb(var(--fg))]",
    review: "bg-amber-100 text-amber-800",
    published: "bg-emerald-100 text-emerald-800",
    discarded: "bg-rose-100 text-rose-800",
  };
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors[status]}`}>
      {status}
    </span>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "–";
  try {
    return new Date(value).toLocaleString("de-DE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function extractDomain(url?: string | null) {
  if (!url) return "–";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
