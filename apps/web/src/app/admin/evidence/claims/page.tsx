"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CORE_LOCALES, EXTENDED_LOCALES } from "@/config/locales";

const REGION_FILTERS = [
  { value: "all", label: "Alle Regionen" },
  { value: "global", label: "Global / offen" },
  { value: "EU", label: "EU" },
  { value: "DE", label: "Deutschland" },
  { value: "AT", label: "Österreich" },
  { value: "CH", label: "Schweiz" },
];

const LOCALE_FILTERS = ["all", ...CORE_LOCALES, ...EXTENDED_LOCALES];

const SOURCE_TYPES = [
  { value: "all", label: "Alle Quellen" },
  { value: "feed", label: "Feed" },
  { value: "contribution", label: "Contribution" },
  { value: "admin", label: "Admin" },
];

export default function EvidenceClaimsAdminPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState("all");
  const [locale, setLocale] = useState("all");
  const [sourceType, setSourceType] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let aborted = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (region !== "all") params.set("regionCode", region);
        if (locale !== "all") params.set("locale", locale);
        if (sourceType !== "all") params.set("sourceType", sourceType);
        if (query.trim()) params.set("q", query.trim());
        const res = await fetch(`/api/admin/evidence/claims?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || res.statusText);
        }
        const body = await res.json();
        if (!aborted) setItems(body.items ?? []);
      } catch (err: any) {
        if (!aborted) setError(err?.message ?? "Fehler beim Laden der Claims");
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    load();
    return () => {
      aborted = true;
    };
  }, [region, locale, sourceType, query]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Admin · Evidence</p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Aussagen im Evidence-Graph</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Filtere Claims aus allen Pipelines und öffne die Details zur Überprüfung oder Korrektur.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm text-[rgb(var(--muted))] shadow-sm"
        >
          {REGION_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm text-[rgb(var(--muted))] shadow-sm"
        >
          {LOCALE_FILTERS.map((loc) => (
            <option key={loc} value={loc}>
              {loc === "all" ? "Alle Sprachen" : loc}
            </option>
          ))}
        </select>

        <select
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm text-[rgb(var(--muted))] shadow-sm"
        >
          {SOURCE_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche im Claim-Text"
          className="flex-1 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm text-[rgb(var(--muted))] shadow-sm"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
        <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
          <thead className="bg-[rgb(var(--bg))]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Claim</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Region</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Locale</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Quelle</th>
              <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Decisions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                  Lädt …
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                  Keine Claims gefunden.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((row) => (
                <tr key={row.id} className="hover:bg-[rgb(var(--bg))]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/evidence/claims/${row.id}`} className="font-semibold text-[rgb(var(--fg))] hover:underline">
                      {row.claimText?.slice(0, 120) ?? "(ohne Text)"}
                    </Link>
                    <p className="text-xs text-[rgb(var(--muted))]">
                      {row.pipeline ?? "—"} · {formatDate(row.createdAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[rgb(var(--fg))]">{row.regionName ?? "Global"}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{row.regionCode ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold uppercase text-[rgb(var(--muted))]">{row.locale}</td>
                  <td className="px-4 py-3 capitalize text-[rgb(var(--muted))]">{row.sourceType}</td>
                  <td className="px-4 py-3 text-xs text-[rgb(var(--muted))]">
                    {row.decisionsSummary?.total || 0} · {row.decisionsSummary?.latestOutcome ?? "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "–";
  try {
    return new Date(value).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return value;
  }
}
