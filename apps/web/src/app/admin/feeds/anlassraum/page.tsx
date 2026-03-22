"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AnlassraumListItem = {
  id: string;
  title: string;
  type: string | null;
  kind: string;
  sourceMode: string;
  status: string;
  scope: string | null;
  decisionScope: string | null;
  maturity: string | null;
  topicKey: string | null;
  clusterKey: string | null;
  regionKey: string | null;
  regionCode: any;
  dossierId: string | null;
  dossierType: string | null;
  isPublic: boolean;
  reviewedBy: string | null;
  approvedBy: string | null;
  relevanceScore: number;
  reviewMode: string;
  riskFlags: string[];
  sourceCount: number;
  outputs: Array<{ outputType: string; status: string }>;
  createdAt: string | null;
  updatedAt: string | null;
};

const STATUS_OPTIONS = [
  "all",
  "draft",
  "curated",
  "reviewed",
  "approved",
  "active",
  "archived",
  "auto_ingested",
  "auto_clustered",
  "needs_editor_review",
  "ready_for_round",
  "published",
] as const;

const SOURCE_MODE_OPTIONS = [
  "all",
  "feed",
  "manual",
  "single_source",
  "cluster",
  "ai_assist",
] as const;

export default function AdminAnlassraumPage() {
  const [items, setItems] = useState<AnlassraumListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [sourceModeFilter, setSourceModeFilter] = useState<(typeof SOURCE_MODE_OPTIONS)[number]>("all");

  useEffect(() => {
    let ignored = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (sourceModeFilter !== "all") params.set("sourceMode", sourceModeFilter);
        const res = await fetch(`/api/admin/feeds/anlassraum?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error ?? res.statusText);
        }
        if (!ignored) {
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (err: any) {
        if (!ignored) {
          setItems([]);
          setError(err?.message ?? "anlassraum_load_failed");
        }
      } finally {
        if (!ignored) setLoading(false);
      }
    }
    load();
    return () => {
      ignored = true;
    };
  }, [statusFilter, sourceModeFilter]);

  return (
    <main className="flex w-full flex-col gap-6 py-4">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          Admin · Feed Pipeline
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Anlassräume</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Semantische Zwischenebene zwischen Ingest-Items und Outputs (Runde, Dossier, Embed, Social).
        </p>
        <p>
          <Link href="/admin/feeds" className="text-sm font-semibold text-sky-700 hover:underline">
            Zur Feed Control Plane
          </Link>
        </p>
      </header>

      <section className="flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              status: {status}
            </option>
          ))}
        </select>
        <select
          value={sourceModeFilter}
          onChange={(e) => setSourceModeFilter(e.target.value as (typeof SOURCE_MODE_OPTIONS)[number])}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm"
        >
          {SOURCE_MODE_OPTIONS.map((mode) => (
            <option key={mode} value={mode}>
              sourceMode: {mode}
            </option>
          ))}
        </select>
      </section>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
        <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
          <thead className="bg-[rgb(var(--bg))]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Anlassraum</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Region/Topic</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Outputs</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Risiko</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                  Lädt Anlassräume …
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                  Keine Anlassräume gefunden.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/feeds/anlassraum/${item.id}`} className="font-semibold text-[rgb(var(--fg))] hover:underline">
                      {item.title}
                    </Link>
                    <p className="text-xs text-[rgb(var(--muted))]">
                      {(item.type ?? item.kind) || "anlassraum"} · {item.sourceMode} · score {item.relevanceScore}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="font-semibold text-[rgb(var(--fg))]">{item.status}</p>
                    <p className="text-[rgb(var(--muted))]">
                      {item.maturity ?? "—"} · {item.reviewMode}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[rgb(var(--muted))]">
                    <p>{formatRegion(item.regionCode) || "Global"}</p>
                    <p>{item.scope ?? "—"} / {item.decisionScope ?? "—"}</p>
                    <p>{item.topicKey ?? "—"}</p>
                    <p>{item.clusterKey ?? "—"}</p>
                    <p>dossier: {item.dossierType ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[rgb(var(--muted))]">
                    <p>{item.sourceCount} Quellen</p>
                    <p>{item.outputs.map((out) => out.outputType).join(", ") || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[rgb(var(--muted))]">
                    {item.riskFlags.length ? item.riskFlags.join(", ") : "ok"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function formatRegion(regionCode: any): string {
  if (!regionCode) return "";
  if (typeof regionCode === "string") return regionCode;
  if (typeof regionCode === "object") {
    const country = regionCode.countryCode ?? "";
    const sub = regionCode.subRegionCode ? `:${regionCode.subRegionCode}` : "";
    const muni = regionCode.municipalityCode ? `:${regionCode.municipalityCode}` : "";
    return `${country}${sub}${muni}`;
  }
  return String(regionCode);
}
