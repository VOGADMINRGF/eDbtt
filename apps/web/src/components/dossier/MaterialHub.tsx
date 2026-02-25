"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Dossier } from "@features/dossier";
import type { PresentationContribution, PresentationStream } from "./presentation";
import MaterialLinksPanel from "./MaterialLinksPanel";

type ClaimItem = {
  id: string;
  title?: string | null;
  text: string;
  stance?: string | null;
  importance?: number | null;
  responsibility?: string | null;
};

type MaterialHubProps = {
  sources: Dossier["sourceSet"];
  contributions: PresentationContribution[];
  streams: PresentationStream[];
  claims: ClaimItem[];
  dossierId?: string | null;
  viewerRole?: string | null;
  materialLinks?: Array<{
    linkId: string;
    dossierId: string;
    kind: "statement" | "contribution";
    itemId: string;
    createdAt: string;
    createdByRole: string;
    createdByUserId?: string;
    note?: string;
    edgeType?: "supports" | "mentions" | "contradicts" | "unknown";
    itemTitle?: string;
    itemExcerpt?: string;
    itemSource?: string;
  }> | null;
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  gov: "Behörde/Verwaltung",
  research: "Forschung",
  media: "Medien",
  community: "Community",
  other: "Sonstiges",
};

const TABS = [
  { id: "sources", label: "Quellen" },
  { id: "contributions", label: "Beiträge" },
  { id: "claims", label: "Kernaussagen" },
  { id: "streams", label: "Themenstrom" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function formatDate(value?: string | null) {
  if (!value) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "2-digit" });
}

export default function MaterialHub({
  sources,
  contributions,
  streams,
  claims,
  dossierId,
  viewerRole,
  materialLinks,
}: MaterialHubProps) {
  const [tab, setTab] = useState<TabId>("sources");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "alpha">("recent");
  const [visible, setVisible] = useState<Record<TabId, number>>({
    sources: 12,
    contributions: 12,
    claims: 12,
    streams: 12,
  });

  const qNorm = useMemo(() => q.trim().toLowerCase(), [q]);
  const qDeferred = useDeferredValue(qNorm);

  useEffect(() => {
    setVisible({ sources: 12, contributions: 12, claims: 12, streams: 12 });
  }, [qDeferred, sort]);

  const filteredSources = useMemo(() => {
    const base = sources ?? [];
    const filtered = qDeferred
      ? base.filter((src) => {
          const hay = `${src.title ?? ""} ${src.publisher ?? ""} ${src.canonicalUrl ?? ""} ${src.sourceType ?? ""}`.toLowerCase();
          return hay.includes(qDeferred);
        })
      : base;
    if (sort === "alpha") {
      return [...filtered].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    }
    return filtered;
  }, [sources, qDeferred, sort]);

  const filteredContributions = useMemo(() => {
    const base = contributions ?? [];
    const filtered = qDeferred
      ? base.filter((item) => {
          const hay = `${item.title ?? ""} ${item.id ?? ""}`.toLowerCase();
          return hay.includes(qDeferred);
        })
      : base;
    if (sort === "alpha") {
      return [...filtered].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    }
    return [...filtered].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  }, [contributions, qDeferred, sort]);

  const filteredClaims = useMemo(() => {
    const base = claims ?? [];
    const filtered = qDeferred
      ? base.filter((item) => {
          const hay = `${item.title ?? ""} ${item.text ?? ""} ${item.responsibility ?? ""}`.toLowerCase();
          return hay.includes(qDeferred);
        })
      : base;
    if (sort === "alpha") {
      return [...filtered].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    }
    return filtered;
  }, [claims, qDeferred, sort]);

  const filteredStreams = useMemo(() => {
    const base = streams ?? [];
    const filtered = qDeferred
      ? base.filter((item) => {
          const hay = `${item.title ?? ""} ${item.id ?? ""}`.toLowerCase();
          return hay.includes(qDeferred);
        })
      : base;
    if (sort === "alpha") {
      return [...filtered].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    }
    return [...filtered].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  }, [streams, qDeferred, sort]);

  const visibleSources = filteredSources.slice(0, visible.sources);
  const visibleContributions = filteredContributions.slice(0, visible.contributions);
  const visibleClaims = filteredClaims.slice(0, visible.claims);
  const visibleStreams = filteredStreams.slice(0, visible.streams);

  const hasMore = {
    sources: filteredSources.length > visible.sources,
    contributions: filteredContributions.length > visible.contributions,
    claims: filteredClaims.length > visible.claims,
    streams: filteredStreams.length > visible.streams,
  };

  function loadMore(which: TabId) {
    setVisible((prev) => ({ ...prev, [which]: prev[which] + 12 }));
  }

  return (
    <section id="material" className="space-y-6">
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:sticky md:top-0 md:z-10 md:shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                Material-Hub
              </p>
              <p className="text-sm text-[rgb(var(--fg))]">
                Quellen, Beiträge und Kernaussagen in einer durchsuchbaren Übersicht.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Suchen (Titel, Quelle, ID …)"
                className="w-full sm:w-[320px] rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
              />
              <select
                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
                value={sort}
                onChange={(e) => setSort(e.target.value as "recent" | "alpha")}
              >
                <option value="recent">Neu</option>
                <option value="alpha">A–Z</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`vog-chip ${tab === item.id ? "border-[rgb(var(--fg))] text-[rgb(var(--fg))]" : ""}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {tab === "sources" ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {filteredSources.length ? (
                  visibleSources.map((src, idx) => (
                <article
                  key={`${src.canonicalUrl ?? src.title ?? "source"}-${idx}`}
                  className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 space-y-2"
                >
                  <div className="text-sm font-semibold text-[rgb(var(--fg))]">
                    {src.canonicalUrl ? (
                      <a href={src.canonicalUrl} target="_blank" rel="noreferrer" className="underline">
                        {src.title ?? src.canonicalUrl}
                      </a>
                    ) : (
                      src.title ?? "Quelle"
                    )}
                  </div>
                  <div className="text-[11px] text-[rgb(var(--muted))]">
                    {src.publisher ?? "—"} · {src.sourceType ? SOURCE_TYPE_LABELS[src.sourceType] ?? src.sourceType : "—"}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] text-[rgb(var(--muted))]">
                    {src.timeRange ? <span className="vog-chip">Zeitraum: {src.timeRange}</span> : null}
                    {src.location ? <span className="vog-chip">Ort: {src.location}</span> : null}
                    {src.audience ? <span className="vog-chip">Zielgruppe: {src.audience}</span> : null}
                    {src.conflicts ? (
                      <span className="vog-chip border-rose-400/50 bg-rose-500/10 text-rose-200">Konflikt</span>
                    ) : null}
                  </div>
                  {src.assumptions?.length ? (
                    <div className="text-[10px] text-[rgb(var(--muted))]">
                      Annahmen: {src.assumptions.join(", ")}
                    </div>
                  ) : null}
                </article>
                  ))
                ) : (
                  <p className="text-sm text-[rgb(var(--muted))]">Keine Quellen hinterlegt.</p>
                )}
              </div>
              {hasMore.sources ? (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    className="btn btn-ghost text-xs"
                    onClick={() => loadMore("sources")}
                  >
                    Mehr laden
                  </button>
                </div>
              ) : null}
            </>
          ) : null}

          {tab === "contributions" ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {filteredContributions.length ? (
                  visibleContributions.map((item) => (
                    <Link
                      key={item.id}
                      href={`/beitraege/${item.id}`}
                      className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 space-y-1"
                    >
                      <div className="text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</div>
                      <div className="text-[11px] text-[rgb(var(--muted))]">Stand: {formatDate(item.date)}</div>
                      {item.streamId ? (
                        <div className="text-[11px] text-[rgb(var(--muted))]">Stream: {item.streamId}</div>
                      ) : null}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-[rgb(var(--muted))]">Keine Beiträge hinterlegt.</p>
                )}
              </div>
              {hasMore.contributions ? (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    className="btn btn-ghost text-xs"
                    onClick={() => loadMore("contributions")}
                  >
                    Mehr laden
                  </button>
                </div>
              ) : null}
            </>
          ) : null}

          {tab === "claims" ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {filteredClaims.length ? (
                  visibleClaims.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 space-y-2"
                    >
                      <div className="text-sm font-semibold text-[rgb(var(--fg))]">
                        {item.title ?? "Kernaussage"}
                      </div>
                      <div className="text-[11px] text-[rgb(var(--muted))]">{item.text}</div>
                      <div className="flex flex-wrap gap-2 text-[10px] text-[rgb(var(--muted))]">
                        {item.stance ? <span className="vog-chip">Position: {item.stance}</span> : null}
                        {item.importance ? <span className="vog-chip">Wichtigkeit: {item.importance}</span> : null}
                        {item.responsibility ? (
                          <span className="vog-chip">Zuständigkeit: {item.responsibility}</span>
                        ) : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-[rgb(var(--muted))]">Keine Kernaussagen vorhanden.</p>
                )}
              </div>
              {hasMore.claims ? (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    className="btn btn-ghost text-xs"
                    onClick={() => loadMore("claims")}
                  >
                    Mehr laden
                  </button>
                </div>
              ) : null}
            </>
          ) : null}

          {tab === "streams" ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {filteredStreams.length ? (
                  visibleStreams.map((item) => (
                    <Link
                      key={item.id}
                      href={`/streams/${item.id}`}
                      className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 space-y-1"
                    >
                      <div className="text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</div>
                      <div className="text-[11px] text-[rgb(var(--muted))]">Stand: {formatDate(item.date)}</div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-[rgb(var(--muted))]">Keine Themenströme hinterlegt.</p>
                )}
              </div>
              {hasMore.streams ? (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    className="btn btn-ghost text-xs"
                    onClick={() => loadMore("streams")}
                  >
                    Mehr laden
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <MaterialLinksPanel
        links={materialLinks ?? undefined}
        dossierId={dossierId ?? undefined}
        viewerRole={viewerRole ?? undefined}
      />
    </section>
  );
}
