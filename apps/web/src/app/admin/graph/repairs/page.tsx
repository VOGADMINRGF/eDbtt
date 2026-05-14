"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type RepairItem = {
  id: string;
  type: string;
  status: string;
  severity: "low" | "medium" | "high" | "critical";
  entityId: string | null;
  entityLabel: string | null;
  cause: string | null;
  proposedAction: string | null;
  nextActions: string[];
  systemGenerated: boolean;
  payload: Record<string, unknown>;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type RepairResponse = {
  status: "ok" | "degraded" | "unavailable";
  source: "real_graph" | "system_health" | "mock" | "seed";
  isMock: boolean;
  items: RepairItem[];
  total: number;
  page: number;
  pageSize: number;
  filters: {
    type: string | null;
    status: string | null;
  };
  message: string | null;
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
  const [actionState, setActionState] = useState<string | null>(null);

  useEffect(() => {
    const typeParam = searchParams.get("type") ?? "";
    const statusParam = searchParams.get("status") ?? "";
    if (typeParam) setType(typeParam);
    if (statusParam) setStatus(statusParam);
  }, [searchParams]);

  const loadRepairs = useCallback(async () => {
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
      setData(body);
    } catch (err: any) {
      setError(err?.message ?? "repairs_load_failed");
    } finally {
      setLoading(false);
    }
  }, [page, router, status, type]);

  useEffect(() => {
    void loadRepairs();
  }, [loadRepairs]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  async function handleRunDiagnostics() {
    setActionState("Diagnose wird aktualisiert …");
    setError(null);
    try {
      const res = await fetch("/api/admin/graph/repairs/run-diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error(body?.error || "diagnostics_failed");
      await loadRepairs();
      setActionState("Diagnose aktualisiert.");
    } catch (err: any) {
      setError(err?.message ?? "diagnostics_failed");
      setActionState(null);
    }
  }

  async function handleApply(ticketId: string) {
    setActionState("Aktion wird ausgeführt …");
    setError(null);
    try {
      const res = await fetch(`/api/admin/graph/repairs/${ticketId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "apply" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error(body?.error || "apply_failed");
      await loadRepairs();
      setActionState("Ticket aktualisiert.");
    } catch (err: any) {
      setError(err?.message ?? "apply_failed");
      setActionState(null);
    }
  }

  async function handleReject(ticketId: string) {
    setActionState("Ticket wird zurückgestellt …");
    setError(null);
    try {
      const res = await fetch(`/api/admin/graph/repairs/${ticketId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "manuell zurückgestellt" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error(body?.error || "reject_failed");
      await loadRepairs();
      setActionState("Ticket aktualisiert.");
    } catch (err: any) {
      setError(err?.message ?? "reject_failed");
      setActionState(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Admin · Graph</p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Graph Repairs</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Diagnose-Tickets, Systemblocker und sichere Review-Aktionen für den Graph.
        </p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {actionState ? (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-700">{actionState}</div>
      ) : null}

      <section
        className={`rounded-3xl border px-4 py-4 shadow-sm ${
          data?.status === "unavailable"
            ? "border-rose-300 bg-rose-50/80"
            : data?.status === "degraded"
              ? "border-amber-300 bg-amber-50/80"
              : "border-[rgb(var(--border))] bg-[rgb(var(--card))]"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Status</p>
            <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">
              {data?.status === "unavailable"
                ? "Graph nicht verfügbar"
                : data?.status === "degraded"
                  ? "Graph eingeschränkt"
                  : "Graph-Reparaturen"}
            </h2>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">{data?.message ?? "Offene und geschlossene Tickets."}</p>
          </div>
          <button
            type="button"
            onClick={handleRunDiagnostics}
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
          >
            Diagnose aktualisieren
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm"
          >
            <option value="all">Alle Typen</option>
            <option value="graph_unavailable">graph_unavailable</option>
            <option value="missing_env">missing_env</option>
            <option value="merge_suggest">merge_suggest</option>
            <option value="relink">relink</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm"
          >
            <option value="all">Alle Status</option>
            <option value="blocked">blocked</option>
            <option value="pending">pending</option>
            <option value="applied">applied</option>
            <option value="rejected">rejected</option>
          </select>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-[rgb(var(--border))]">
          <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
            <thead className="bg-[rgb(var(--bg))]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Ticket</th>
                <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Typ</th>
                <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Ursache</th>
                <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Nächste Aktion</th>
                <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                    Lädt Repairs...
                  </td>
                </tr>
              ) : null}
              {!loading && data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                    Keine offenen Graph-Reparaturen.
                  </td>
                </tr>
              ) : null}
              {!loading &&
                data?.items?.map((item) => {
                  const manualOnly = item.type === "graph_unavailable" || item.type === "missing_env";
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-[rgb(var(--fg))]">
                        <div className="font-medium">{item.entityLabel ?? item.entityId ?? item.id}</div>
                        <div className="text-xs text-[rgb(var(--muted))]">{item.id}</div>
                      </td>
                      <td className="px-4 py-3 text-[rgb(var(--muted))]">{item.type}</td>
                      <td className="px-4 py-3 text-[rgb(var(--muted))]">
                        <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-xs">{item.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[rgb(var(--muted))]">{item.cause ?? "—"}</td>
                      <td className="px-4 py-3 text-[rgb(var(--muted))]">
                        <div>{item.proposedAction ?? "—"}</div>
                        {item.nextActions.length ? (
                          <div className="mt-2 text-xs">
                            {item.nextActions.slice(0, 2).map((action) => (
                              <div key={action}>• {action}</div>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {item.status === "pending" ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs"
                              onClick={() => handleApply(item.id)}
                              disabled={manualOnly}
                            >
                              {manualOnly ? "Review nötig" : "Anwenden"}
                            </button>
                            <button
                              className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs"
                              onClick={() => handleReject(item.id)}
                            >
                              Zurückstellen
                            </button>
                          </div>
                        ) : item.status === "blocked" ? (
                          <button
                            className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs"
                            onClick={handleRunDiagnostics}
                          >
                            Erneut prüfen
                          </button>
                        ) : (
                          <span className="text-xs text-[rgb(var(--muted))]">Keine Aktion</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
          Zurück
        </button>
        <span>
          Seite {page} / {Math.max(1, totalPages)}
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
