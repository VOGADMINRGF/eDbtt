"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type RepairItem = {
  id: string;
  type: string;
  status: string;
  payload: Record<string, unknown>;
  createdAt?: string | null;
};

type RepairResponse = {
  items: RepairItem[];
  total: number;
  page: number;
  pageSize: number;
};

export default function AdminGraphRepairsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<RepairResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mergeA, setMergeA] = useState("");
  const [mergeB, setMergeB] = useState("");
  const [mergeReason, setMergeReason] = useState("");
  const [relinkFrom, setRelinkFrom] = useState("");
  const [relinkTo, setRelinkTo] = useState("");
  const [relinkReason, setRelinkReason] = useState("");

  useEffect(() => {
    const typeParam = searchParams.get("type") ?? "";
    const statusParam = searchParams.get("status") ?? "";
    if (typeParam) setType(typeParam);
    if (statusParam) setStatus(statusParam);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (type !== "all") params.set("type", type);
        if (status !== "all") params.set("status", status);
        params.set("page", String(page));
        params.set("limit", "30");
        const res = await fetch(`/api/admin/graph/repairs?${params.toString()}`, { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login?next=/admin/graph/repairs");
          return;
        }
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.ok) throw new Error(body?.error || res.statusText);
        if (active) setData(body);
      } catch (err: any) {
        if (active) setError(err?.message ?? "repairs_load_failed");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [type, status, page, router]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  const handleMerge = async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/graph/repairs/merge-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aId: mergeA, bId: mergeB, reason: mergeReason || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error(body?.error || "merge_failed");
      setMergeA("");
      setMergeB("");
      setMergeReason("");
      setPage(1);
    } catch (err: any) {
      setError(err?.message ?? "merge_failed");
    }
  };

  const handleRelink = async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/graph/repairs/relink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromId: relinkFrom, toId: relinkTo, reason: relinkReason || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error(body?.error || "relink_failed");
      setRelinkFrom("");
      setRelinkTo("");
      setRelinkReason("");
      setPage(1);
    } catch (err: any) {
      setError(err?.message ?? "relink_failed");
    }
  };

  const handleApply = async (ticketId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/graph/repairs/${ticketId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "apply" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error(body?.error || "apply_failed");
    } catch (err: any) {
      setError(err?.message ?? "apply_failed");
    }
  };

  const handleReject = async (ticketId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/graph/repairs/${ticketId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "reject" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error(body?.error || "reject_failed");
    } catch (err: any) {
      setError(err?.message ?? "reject_failed");
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Admin · Graph</p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Repairs</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Tickets anlegen, pruefen und anwenden.</p>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Merge Suggest</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input
            value={mergeA}
            onChange={(e) => setMergeA(e.target.value)}
            placeholder="Node A ID"
            className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <input
            value={mergeB}
            onChange={(e) => setMergeB(e.target.value)}
            placeholder="Node B ID"
            className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <input
            value={mergeReason}
            onChange={(e) => setMergeReason(e.target.value)}
            placeholder="Reason"
            className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
        </div>
        <button className="mt-3 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={handleMerge}>
          Ticket erstellen
        </button>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Relink</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input
            value={relinkFrom}
            onChange={(e) => setRelinkFrom(e.target.value)}
            placeholder="From ID"
            className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <input
            value={relinkTo}
            onChange={(e) => setRelinkTo(e.target.value)}
            placeholder="To ID"
            className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <input
            value={relinkReason}
            onChange={(e) => setRelinkReason(e.target.value)}
            placeholder="Reason"
            className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
        </div>
        <button className="mt-3 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={handleRelink}>
          Ticket erstellen
        </button>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm"
          >
            <option value="all">Alle Typen</option>
            <option value="merge_suggest">merge_suggest</option>
            <option value="relink">relink</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm"
          >
            <option value="all">Alle Status</option>
            <option value="pending">pending</option>
            <option value="applied">applied</option>
            <option value="rejected">rejected</option>
          </select>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[rgb(var(--border))]">
          <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
            <thead className="bg-[rgb(var(--bg))]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Payload</th>
                <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                    Laedt Repairs...
                  </td>
                </tr>
              )}
              {!loading && data?.items?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                    Keine Tickets.
                  </td>
                </tr>
              )}
              {!loading &&
                data?.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-[rgb(var(--muted))]">{item.type}</td>
                    <td className="px-4 py-3 text-[rgb(var(--muted))]">
                      {JSON.stringify(item.payload)}
                    </td>
                    <td className="px-4 py-3 text-[rgb(var(--muted))]">{item.status}</td>
                    <td className="px-4 py-3">
                      {item.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs"
                            onClick={() => handleApply(item.id)}
                          >
                            Apply
                          </button>
                          <button
                            className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs"
                            onClick={() => handleReject(item.id)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
        <button
          className="rounded-full border border-[rgb(var(--border))] px-3 py-1 disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        >
          Zurueck
        </button>
        <span>
          Seite {page} / {Math.max(1, Math.ceil((data?.total ?? 1) / (data?.pageSize ?? 1)))}
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
