"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ProjectRow = {
  id: string;
  title: string;
  status: "planned" | "active" | "completed" | "archived";
  regionCode: string | null;
  topicsCount: number;
  proposedOptions: number;
  createdAt: string;
  updatedAt: string;
};

export default function AdminProjectsPage() {
  const [items, setItems] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/projects", { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
        if (!ignore) setItems(Array.isArray(body?.items) ? body.items : []);
      } catch (err: any) {
        if (!ignore) setError(err?.message ?? "Projekte konnten nicht geladen werden.");
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
    if (!term) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(term) || (item.regionCode?.toLowerCase().includes(term) ?? false),
    );
  }, [items, searchTerm]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin · Projekte</p>
        <h1 className="text-2xl font-bold text-slate-900">Projekt-Backbone</h1>
        <p className="text-sm text-slate-600">Themenpakete und Optionen verwalten.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Titel oder Region suchen..."
          aria-label="Projekte durchsuchen"
          className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm sm:max-w-xs"
        />
        <Link
          href="/dashboard/projects/new"
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Neues Projekt
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Projekt</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Themen</th>
              <th className="px-4 py-3">Vorschlaege</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Laedt Projekte ...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Keine Projekte gefunden.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{row.title}</div>
                    <div className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.regionCode ?? "–"}</td>
                  <td className="px-4 py-3 text-slate-700">{row.topicsCount}</td>
                  <td className="px-4 py-3 text-slate-700">{row.proposedOptions}</td>
                  <td className="px-4 py-3 text-slate-700">{row.status}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/projects/${encodeURIComponent(row.id)}`}
                      className="text-sm font-semibold text-slate-700 hover:text-slate-900"
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
