"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type OrgItem = {
  id: string;
  slug: string;
  name: string;
  archivedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type OrgResponse = {
  items: OrgItem[];
  total: number;
  page: number;
  pageSize: number;
};

export default function AdminOrgsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<OrgResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    const qParam = searchParams.get("q") ?? "";
    if (qParam) setQuery(qParam);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        params.set("page", String(page));
        params.set("limit", "20");
        const res = await fetch(`/api/admin/orgs?${params.toString()}`, { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login?next=/admin/orgs");
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || res.statusText);
        }
        const body = (await res.json()) as OrgResponse;
        if (active) setData(body);
      } catch (err: any) {
        if (active) setError(err?.message ?? "orgs_load_failed");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [query, page, router]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreateLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName, slug: createSlug || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || "create_failed");
      }
      setCreateOpen(false);
      setCreateName("");
      setCreateSlug("");
      setPage(1);
    } catch (err: any) {
      setError(err?.message ?? "create_failed");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Admin · Organisationen
          </p>
          <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Orgs & Teams</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Organisationen anlegen, verwalten und Teams steuern.</p>
        </div>
        <button
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setCreateOpen((prev) => !prev)}
        >
          {createOpen ? "Abbrechen" : "Neue Org"}
        </button>
      </header>

      {createOpen && (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Neue Organisation</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Name"
              className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            />
            <input
              value={createSlug}
              onChange={(e) => setCreateSlug(e.target.value)}
              placeholder="Slug (optional)"
              className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            />
            <button
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              onClick={handleCreate}
              disabled={createLoading}
            >
              {createLoading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suche nach Name oder Slug"
            className="w-64 bg-transparent text-sm text-[rgb(var(--muted))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
          />
        </div>
        <span className="text-xs text-[rgb(var(--muted))]">{data?.total ?? 0} Orgs</span>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
        <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
          <thead className="bg-[rgb(var(--bg))]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Organisation</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Slug</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Aktualisiert</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]">
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                  Lädt Organisationen...
                </td>
              </tr>
            )}
            {!loading && data?.items?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                  Keine Organisationen gefunden.
                </td>
              </tr>
            )}
            {!loading &&
              data?.items?.map((org) => (
                <tr key={org.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orgs/${org.id}`}
                      className="font-semibold text-[rgb(var(--fg))] hover:underline"
                    >
                      {org.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{org.slug || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        org.archivedAt ? "bg-[rgb(var(--bg))] text-[rgb(var(--muted))]" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {org.archivedAt ? "archiviert" : "aktiv"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{org.updatedAt?.slice(0, 10) ?? "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
        <button
          className="rounded-full border border-[rgb(var(--border))] px-3 py-1 disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        >
          Zurück
        </button>
        <span>
          Seite {page} / {totalPages}
        </span>
        <button
          className="rounded-full border border-[rgb(var(--border))] px-3 py-1 disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        >
          Weiter
        </button>
      </div>
    </div>
  );
}
