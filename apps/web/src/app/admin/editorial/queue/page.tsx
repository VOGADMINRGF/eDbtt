"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const STATUS_OPTIONS = ["triage", "review", "fact_check", "ready", "rejected", "archived"] as const;

type EditorialItem = {
  id: string;
  orgId?: string | null;
  status: string;
  title?: string | null;
  summary?: string | null;
  topicKey?: string | null;
  regionCode?: string | null;
  ownerUserId?: string | null;
  dueAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type EditorialResponse = {
  items: EditorialItem[];
  total: number;
  page: number;
  pageSize: number;
};

export default function AdminEditorialQueuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string>("triage");
  const [query, setQuery] = useState("");
  const [orgId, setOrgId] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<EditorialResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("review");
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    const qParam = searchParams.get("q") ?? "";
    const statusParam = searchParams.get("status") ?? "";
    const orgParam = searchParams.get("orgId") ?? "";
    if (qParam) setQuery(qParam);
    if (statusParam) setStatus(statusParam);
    if (orgParam) setOrgId(orgParam);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (query) params.set("q", query);
        if (orgId) params.set("orgId", orgId);
        params.set("page", String(page));
        params.set("limit", "20");
        const res = await fetch(`/api/admin/editorial/items?${params.toString()}`, { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login?next=/admin/editorial/queue");
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || res.statusText);
        }
        const body = (await res.json()) as EditorialResponse;
        if (active) setData(body);
      } catch (err: unknown) {
        if (active) setError(getErrorMessage(err, "editorial_load_failed"));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [status, query, orgId, page, router]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  const allSelected = useMemo(() => {
    if (!data?.items?.length) return false;
    return data.items.every((item) => selectedIds.has(item.id));
  }, [data?.items, selectedIds]);

  const toggleAll = (checked: boolean) => {
    if (!data?.items) return;
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(data.items.map((item) => item.id)));
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const applyBulkStatus = async () => {
    if (!selectedIds.size) return;
    setBulkBusy(true);
    setError(null);
    try {
      for (const id of Array.from(selectedIds)) {
        const res = await fetch(`/api/admin/editorial/items/${encodeURIComponent(id)}/status`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: bulkStatus }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "bulk_status_failed");
        }
      }
      setSelectedIds(new Set());
      setPage(1);
      setStatus(bulkStatus);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "bulk_status_failed"));
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin · Redaktion</p>
        <h1 className="text-2xl font-bold text-slate-900">Editorial Queue</h1>
        <p className="text-sm text-slate-600">
          Triage, Review und Freigaben zentral steuern.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
          {STATUS_OPTIONS.map((entry) => (
            <button
              key={entry}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                status === entry ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setStatus(entry)}
            >
              {entry}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche (Titel, Summary)"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
        />
        <input
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          placeholder="Org ID (optional)"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-600">
              {selectedIds.size} ausgewählt
            </span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
            >
              {STATUS_OPTIONS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
            <button
              className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
              onClick={applyBulkStatus}
              disabled={bulkBusy}
            >
              {bulkBusy ? "Wird gesetzt…" : "Status anwenden"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                  aria-label="Alle auswählen"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Titel</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Topic</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Owner</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Laedt Queue...
                </td>
              </tr>
            )}
            {!loading && data?.items?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Keine Items gefunden.
                </td>
              </tr>
            )}
            {!loading &&
              data?.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={(e) => toggleOne(item.id, e.target.checked)}
                      aria-label={`Auswählen ${item.title ?? item.id}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/editorial/items/${item.id}`}
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      {item.title ?? "(ohne Titel)"}
                    </Link>
                    <p className="text-xs text-slate-500">{item.summary ?? ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.topicKey ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{item.ownerUserId ? item.ownerUserId.slice(-6) : "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{item.updatedAt?.slice(0, 10) ?? "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <button
          className="rounded-full border border-slate-200 px-3 py-1 disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        >
          Zurueck
        </button>
        <span>
          Seite {page} / {totalPages}
        </span>
        <button
          className="rounded-full border border-slate-200 px-3 py-1 disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        >
          Weiter
        </button>
      </div>
    </div>
  );
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}
