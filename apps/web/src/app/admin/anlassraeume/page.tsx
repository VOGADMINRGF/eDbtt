"use client";

import { useEffect, useState } from "react";
import {
  ANLASSRAUM_OPERATIONS_DEFAULT_LIMIT,
  normalizeAnlassraumOperationsQuery,
  type AnlassraumOperationsQuery,
} from "@/features/anlassraumOperationsContract";
import type { AnlassraumOperationsResult } from "@/features/anlassraumOperationsRead";
import { AnlassraumOperationsPanel } from "@/features/anlassraumOperationsUi";

const DEFAULT_QUERY: AnlassraumOperationsQuery = {
  q: "",
  status: "all",
  scope: "all",
  page: 1,
  limit: ANLASSRAUM_OPERATIONS_DEFAULT_LIMIT,
};

export default function AdminAnlassraumOperationsPage() {
  const [query, setQuery] = useState<AnlassraumOperationsQuery>(DEFAULT_QUERY);
  const [data, setData] = useState<AnlassraumOperationsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    try {
      const next = normalizeAnlassraumOperationsQuery(new URLSearchParams(window.location.search));
      setQuery(next);
    } catch {
      setQuery(DEFAULT_QUERY);
    }
  }, []);

  useEffect(() => {
    let ignored = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (query.q.trim()) params.set("q", query.q.trim());
        if (query.status !== "all") params.set("status", query.status);
        if (query.scope !== "all") params.set("scope", query.scope);
        params.set("page", String(query.page));
        params.set("limit", String(query.limit));

        const res = await fetch(`/api/admin/anlassraeume?${params.toString()}`, { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.ok) {
          throw new Error(body?.error || res.statusText);
        }

        if (ignored) return;
        setData(body as AnlassraumOperationsResult);
      } catch (loadError: unknown) {
        if (ignored) return;
        setData(null);
        setError(loadError instanceof Error ? loadError.message : "anlassraum_operations_load_failed");
      } finally {
        if (!ignored) setLoading(false);
      }
    }

    void load();

    return () => {
      ignored = true;
    };
  }, [query, reloadToken]);

  return (
    <main>
      <h1 className="sr-only">Anlassraeume verwalten</h1>
      <AnlassraumOperationsPanel
        data={data}
        loading={loading}
        error={error}
        query={query}
        onQueryChange={(patch) => {
          setQuery((prev) => {
            const next = { ...prev, ...patch };
            return {
              ...next,
              page: Math.max(1, Number(next.page) || 1),
              limit: Math.max(1, Math.min(100, Number(next.limit) || ANLASSRAUM_OPERATIONS_DEFAULT_LIMIT)),
            };
          });
        }}
        onReload={() => setReloadToken((prev) => prev + 1)}
      />
    </main>
  );
}
