"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type CampaignRow = {
  id: string;
  title: string;
  description: string | null;
  regionCode: string | null;
  topicKey: string | null;
  status: "draft" | "active" | "paused" | "ended";
  participants: number;
  createdAt: string;
  updatedAt: string;
};

type Filter = "all" | "draft" | "active" | "paused" | "ended";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "Alle", value: "all" },
  { label: "Aktiv", value: "active" },
  { label: "Draft", value: "draft" },
  { label: "Paused", value: "paused" },
  { label: "Ended", value: "ended" },
];

export default function AdminCampaignsPage() {
  const [items, setItems] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/campaigns", { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
        if (!ignore) {
          setItems(Array.isArray(body?.items) ? body.items : []);
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err?.message ?? "Kampagnen konnten nicht geladen werden.");
          setItems([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items
      .filter((row) => (filter === "all" ? true : row.status === filter))
      .filter((row) => {
        if (!term) return true;
        return (
          row.title.toLowerCase().includes(term) ||
          (row.regionCode?.toLowerCase().includes(term) ?? false) ||
          (row.topicKey?.toLowerCase().includes(term) ?? false)
        );
      })
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }, [items, filter, searchTerm]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Admin · Campaigns</p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Campaign Hub</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Kampagnen verwalten, Status checken und Teilnehmerzahlen verfolgen.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm">
          {FILTERS.map((entry) => (
            <button
              key={entry.value}
              onClick={() => setFilter(entry.value)}
              className={`rounded-full px-3 py-1 font-semibold transition ${
                filter === entry.value ? "bg-slate-900 text-white" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Titel, Region oder Topic suchen…"
          aria-label="Kampagnen durchsuchen"
          className="flex-1 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm text-[rgb(var(--muted))] shadow-sm sm:max-w-xs"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
        <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
          <thead className="bg-[rgb(var(--bg))] text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            <tr>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Region · Topic</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Teilnehmer</th>
              <th className="px-4 py-3 text-right">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                  Lädt Kampagnen …
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                  Keine Kampagnen gefunden.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[rgb(var(--fg))]">{row.title}</div>
                    <div className="text-xs text-[rgb(var(--muted))]">{row.description ?? "Ohne Beschreibung"}</div>
                  </td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">
                    {row.regionCode ?? "–"} · {row.topicKey ?? "–"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{row.participants}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/campaigns/${encodeURIComponent(row.id)}`}
                      className="text-sm font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: CampaignRow["status"] }) {
  const map: Record<CampaignRow["status"], string> = {
    draft: "bg-[rgb(var(--bg))] text-[rgb(var(--muted))]",
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    ended: "bg-[rgb(var(--bg))] text-[rgb(var(--muted))]",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status]}`}>{status}</span>;
}
