"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HubItem = {
  title: string;
  description: string;
  href: string;
};

type ContentMetrics = {
  totals: {
    contributions: number;
    contributions30d: number;
    statements: number;
    feedStatements: number;
    evidenceClaims: number;
    evidenceItems: number;
    evidenceLinks: number;
    swipeVotes: number;
    swipeVotes30d: number;
    statementSwipes: number;
  };
  topics: {
    human: Array<{ topic: string; count: number }>;
    ai: Array<{ topic: string; count: number }>;
  };
};

type GraphSummary = {
  totalStatements: number;
  totalEventualities: number;
  totalConsequences: number;
  totalResponsibilities: number;
  totalResponsibilityPaths: number;
};

const SECTIONS: Array<{ title: string; items: HubItem[] }> = [
  {
    title: "Evidence & Graph",
    items: [
      {
        title: "Evidence Claims",
        description: "Claims sichten, bearbeiten und verknuepfen",
        href: "/admin/evidence/claims",
      },
      {
        title: "Evidence Items",
        description: "Quellen und Evidence-Items verwalten",
        href: "/admin/evidence/items",
      },
      {
        title: "Graph Impact",
        description: "Impact-Summary, Verantwortlichkeiten, Pfade",
        href: "/admin/graph/impact",
      },
      {
        title: "Graph Health",
        description: "Health-Checks und Reparaturen",
        href: "/admin/graph/health",
      },
      {
        title: "Graph Repairs",
        description: "Repair-Tickets verwalten",
        href: "/admin/graph/repairs",
      },
      {
        title: "Responsibility Directory",
        description: "Zustaendigkeiten und Pfade pflegen",
        href: "/admin/responsibility",
      },
    ],
  },
  {
    title: "Feeds & Redaktion",
    items: [
      {
        title: "Feed Drafts",
        description: "Entwuerfe aus Feeds sichten und publizieren",
        href: "/admin/feeds/drafts",
      },
      {
        title: "Editorial Queue",
        description: "Triage, Review und Freigaben",
        href: "/admin/editorial/queue",
      },
      {
        title: "Editorial Published",
        description: "Veröffentlichte Items",
        href: "/admin/editorial/published",
      },
      {
        title: "Research Tasks",
        description: "Recherche-Aufgaben verwalten",
        href: "/admin/research/tasks",
      },
      {
        title: "Eventualities",
        description: "Eventualitaeten- und Snapshot-Status",
        href: "/admin/eventualities",
      },
    ],
  },
  {
    title: "Reports & Insights",
    items: [
      {
        title: "Reports",
        description: "Topic- und Region-Reports",
        href: "/admin/reports",
      },
      {
        title: "Report Assets",
        description: "Report-Revisions & Freigaben",
        href: "/admin/reports/assets",
      },
    ],
  },
];

export default function AdminContentHubPage() {
  const [metrics, setMetrics] = useState<ContentMetrics | null>(null);
  const [graph, setGraph] = useState<GraphSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const nf = new Intl.NumberFormat("de-DE");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [metricsRes, graphRes] = await Promise.all([
          fetch("/api/admin/content/metrics", { cache: "no-store" }),
          fetch("/api/admin/graph/impact/summary", { cache: "no-store" }),
        ]);

        const metricsBody = await metricsRes.json().catch(() => ({}));
        if (!metricsRes.ok || !metricsBody?.ok) {
          throw new Error(metricsBody?.error || metricsRes.statusText);
        }

        const graphBody = await graphRes.json().catch(() => ({}));
        const graphSummary = graphRes.ok && graphBody?.ok ? graphBody.summary : null;

        if (active) {
          setMetrics({ totals: metricsBody.totals, topics: metricsBody.topics });
          setGraph(graphSummary);
        }
      } catch (err: any) {
        if (active) {
          setError(err?.message ?? "Content-Metriken konnten nicht geladen werden.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          Admin · Content
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Content Hub</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Zentrale Navigation fuer Evidence, Graph, Feeds und Reports.
        </p>
      </header>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Content-KPIs</h2>
          <span className="text-xs text-[rgb(var(--muted))]">
            {loading ? "laedt" : "aktualisiert"}
          </span>
        </div>
        {error && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Beitraege gesamt" value={metrics?.totals.contributions} loading={loading} href="/admin/contributions" />
          <MetricCard label="Beitraege (30d)" value={metrics?.totals.contributions30d} loading={loading} href="/admin/contributions" />
          <MetricCard label="Statements gesamt" value={metrics?.totals.statements} loading={loading} href="/admin/evidence/claims" />
          <MetricCard label="Feed-Statements (AI)" value={metrics?.totals.feedStatements} loading={loading} href="/admin/feeds/drafts" />
          <MetricCard label="Evidence Claims" value={metrics?.totals.evidenceClaims} loading={loading} href="/admin/evidence/claims" />
          <MetricCard label="Evidence Items" value={metrics?.totals.evidenceItems} loading={loading} href="/admin/evidence/items" />
          <MetricCard label="Evidence Links" value={metrics?.totals.evidenceLinks} loading={loading} href="/admin/evidence/items" />
          <MetricCard label="Swipe Votes" value={metrics?.totals.swipeVotes} loading={loading} href="/admin/swipes" />
          <MetricCard label="Swipe Votes (30d)" value={metrics?.totals.swipeVotes30d} loading={loading} href="/admin/swipes" />
          <MetricCard label="Statement Swipes" value={metrics?.totals.statementSwipes} loading={loading} href="/admin/swipes" />
          <MetricCard
            label="Graph Statements"
            value={graph?.totalStatements}
            loading={loading}
            href="/admin/graph/impact"
          />
        </div>
        {graph && (
          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Eventualitaeten" value={graph.totalEventualities} loading={loading} href="/admin/eventualities" />
            <MetricCard label="Consequences" value={graph.totalConsequences} loading={loading} href="/admin/graph/impact" />
            <MetricCard label="Responsibilities" value={graph.totalResponsibilities} loading={loading} href="/admin/graph/impact" />
            <MetricCard label="Resp. Paths" value={graph.totalResponsibilityPaths} loading={loading} href="/admin/graph/impact" />
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Top Themen (Human)</h2>
          <div className="mt-3 space-y-2 text-sm text-[rgb(var(--muted))]">
            {loading && <SkeletonLines lines={5} />}
            {!loading && metrics?.topics.human?.length === 0 && (
              <p className="text-sm text-[rgb(var(--muted))]">Keine Topics gefunden.</p>
            )}
            {!loading &&
              metrics?.topics.human?.map((entry) => (
                <div key={entry.topic} className="flex items-center justify-between rounded-xl bg-[rgb(var(--bg))] px-3 py-2">
                  <span className="font-medium text-[rgb(var(--fg))]">{entry.topic}</span>
                  <span className="text-[rgb(var(--muted))]">{nf.format(entry.count)}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Top Themen (AI / Feeds)</h2>
          <div className="mt-3 space-y-2 text-sm text-[rgb(var(--muted))]">
            {loading && <SkeletonLines lines={5} />}
            {!loading && metrics?.topics.ai?.length === 0 && (
              <p className="text-sm text-[rgb(var(--muted))]">Keine Topics gefunden.</p>
            )}
            {!loading &&
              metrics?.topics.ai?.map((entry) => (
                <div key={entry.topic} className="flex items-center justify-between rounded-xl bg-[rgb(var(--bg))] px-3 py-2">
                  <span className="font-medium text-[rgb(var(--fg))]">{entry.topic}</span>
                  <span className="text-[rgb(var(--muted))]">{nf.format(entry.count)}</span>
                </div>
              ))}
          </div>
        </div>
      </section>

      {SECTIONS.map((section) => (
        <section
          key={section.title}
          className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{section.title}</h2>
            <span className="text-xs text-[rgb(var(--muted))]">{section.items.length} Bereiche</span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <HubCard key={item.href} {...item} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function HubCard({ title, description, href }: HubItem) {
  return (
    <Link
      href={href}
      className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))] transition hover:-translate-y-0.5 hover:ring-sky-200"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
        {title}
      </p>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">{description}</p>
    </Link>
  );
}

function MetricCard({
  label,
  value,
  loading,
  href,
}: {
  label: string;
  value?: number | null;
  loading: boolean;
  href?: string;
}) {
  const nf = new Intl.NumberFormat("de-DE");
  const content = (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 transition hover:border-sky-200">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
        {label}
      </p>
      {loading ? (
        <div className="mt-2 h-5 w-16 animate-pulse rounded bg-[rgb(var(--bg))]" />
      ) : (
        <p className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">
          {nf.format(value ?? 0)}
        </p>
      )}
    </div>
  );
  if (!href) return content;
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

function SkeletonLines({ lines }: { lines: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-6 animate-pulse rounded bg-[rgb(var(--bg))]" />
      ))}
    </div>
  );
}
