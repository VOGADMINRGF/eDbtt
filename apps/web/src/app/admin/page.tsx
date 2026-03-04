"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getEdebatePackageLabel } from "@/config/edebatte";
import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

type Summary = {
  totalUsers: number;
  activeUsers: number;
  newsletterOptIn: number;
  packages: { code: string; count: number }[];
  roles: { role: string; count: number }[];
  registrationsLast30Days: { date: string; count: number }[];
  orgsTotal?: number;
  reportAssetsTotal?: number;
  pendingGraphRepairs?: number;
  editorialCounts?: {
    triage: number;
    review: number;
    fact_check: number;
    ready: number;
    published: number;
    rejected: number;
  };
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const nf = new Intl.NumberFormat("de-DE");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/dashboard/summary", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login?next=/admin");
          return;
        }
        if (res.status === 403) {
          const body = await res.json().catch(() => ({}));
          if (body?.error === "two_factor_required") {
            router.replace("/login?next=/admin");
            return;
          }
          if (body?.error === "two_factor_setup_required") {
            router.replace("/auth/2fa-setup?next=/admin");
            return;
          }
          if (active) setError("Kein Zugriff auf das Admin-Dashboard.");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { data: Summary };
        if (active) setData(body.data);
      } catch (err: unknown) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [router]);

  const newUsers30d = data?.registrationsLast30Days?.reduce((sum, d) => sum + d.count, 0) ?? 0;

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-[rgb(var(--card))] p-5 shadow ring-1 ring-[rgb(var(--border))]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Admin Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">Steuerzentrale</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Überblick über Nutzer, Inhalte, Graph, Telemetrie und operative Warteschlangen.
        </p>
      </header>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Schnellaktionen</h2>
          <span className="text-xs text-[rgb(var(--muted))]">Direkte Wege zu den wichtigsten Warteschlangen</span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Editorial Triage", href: "/admin/editorial/queue?status=triage" },
            { label: "Graph Repairs", href: "/admin/graph/repairs?status=pending" },
            { label: "Report Assets", href: "/admin/reports/assets" },
            { label: "Support Ledger", href: "/admin/support" },
            { label: "Research Tasks", href: "/admin/research/tasks" },
            { label: "Eventualities", href: "/admin/eventualities" },
            { label: "Access Center", href: "/admin/access" },
            { label: "Content Hub", href: "/admin/content" },
          ].map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-xs font-semibold text-[rgb(var(--muted))] transition hover:border-sky-200 hover:text-[rgb(var(--fg))]"
            >
              {entry.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        {renderCard("User gesamt", data?.totalUsers, loading, nf, undefined, "/admin/users")}
        {renderCard("Neue User (30d)", newUsers30d, loading, nf, undefined, "/admin/users?createdDays=30")}
        {renderCard(
          "Aktive User (30d)",
          data?.activeUsers,
          loading,
          nf,
          "Mindestens ein Login oder eine Aktion im Zeitraum",
          "/admin/users?activeDays=30",
        )}
        {renderCard("Newsletter Opt-in", data?.newsletterOptIn, loading, nf, undefined, "/admin/users?newsletter=true")}
        {renderCard(
          "Pakete (aktiv)",
          data?.packages?.reduce((a, b) => a + b.count, 0) ?? 0,
          loading,
          nf,
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Paket-Verteilung</h2>
          <div className="mt-2 space-y-2">
            {loading && <SkeletonLines lines={4} />}
            {!loading &&
              data?.packages?.map((p) => (
                <div key={p.code} className="flex items-center justify-between rounded-xl bg-[rgb(var(--bg))] px-3 py-2 text-sm">
                  <span className="font-medium text-[rgb(var(--fg))]">{getEdebatePackageLabel(p.code || "none")}</span>
                  <span className="text-[rgb(var(--muted))]">{nf.format(p.count)}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Rollen-Verteilung</h2>
          <div className="mt-2 space-y-2">
            {loading && <SkeletonLines lines={4} />}
            {!loading &&
              data?.roles?.map((r) => (
                <div key={r.role} className="flex items-center justify-between rounded-xl bg-[rgb(var(--bg))] px-3 py-2 text-sm">
                  <span className="font-medium text-[rgb(var(--fg))]">{r.role}</span>
                  <span className="text-[rgb(var(--muted))]">{nf.format(r.count)}</span>
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Registrierungen (letzte 30 Tage)</h2>
        <div className="mt-3 flex items-end gap-1 min-h-[80px]">
          {loading && <SkeletonBars />}
          {!loading && data?.registrationsLast30Days?.length === 0 && (
            <p className="text-sm text-[rgb(var(--muted))]">Noch keine Registrierungen im betrachteten Zeitraum.</p>
          )}
          {!loading &&
            data?.registrationsLast30Days &&
            data.registrationsLast30Days.length > 0 &&
            data?.registrationsLast30Days?.map((d) => (
              <div key={d.date} className="flex flex-col items-center gap-1">
                <div
                  className="w-4 rounded-full bg-gradient-to-t from-sky-500 via-cyan-500 to-emerald-500"
                  style={{ height: `${Math.max(6, d.count * 6)}px` }}
                  title={`${d.date}: ${d.count}`}
                />
                <span className="text-[10px] text-[rgb(var(--muted))]">{d.date.slice(5)}</span>
              </div>
            ))}
        </div>
        {error && (
          <div className="mt-3">
            <AdminErrorPanel error={error} title="Fehler beim Laden">
              <button
                type="button"
                className="text-sm font-semibold underline underline-offset-2"
                onClick={() => location.reload()}
              >
                Neu laden
              </button>
            </AdminErrorPanel>
          </div>
        )}
      </section>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        {renderCard("Organisationen", data?.orgsTotal, loading, nf, undefined, "/admin/orgs")}
        {renderCard(
          "Editorial Triage",
          data?.editorialCounts?.triage ?? 0,
          loading,
          nf,
          undefined,
          "/admin/editorial/queue?status=triage",
        )}
        {renderCard(
          "Editorial Review",
          data?.editorialCounts?.review ?? 0,
          loading,
          nf,
          undefined,
          "/admin/editorial/queue?status=review",
        )}
        {renderCard(
          "Report Assets",
          data?.reportAssetsTotal,
          loading,
          nf,
          undefined,
          "/admin/reports/assets",
        )}
        {renderCard(
          "Graph Repairs (pending)",
          data?.pendingGraphRepairs,
          loading,
          nf,
          undefined,
          "/admin/graph/repairs?status=pending",
        )}
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Admin Hubs</p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <LinkCard title="People Hub" href="/admin/people" description="User, Rollen, Newsletter & Regeln" />
          <LinkCard title="Content Hub" href="/admin/content" description="Evidence, Graph, Feeds & Reports" />
          <LinkCard title="Telemetry Hub" href="/admin/telemetry" description="AI Usage, Health & Logs" />
          <LinkCard title="System Hub" href="/admin/system" description="Settings & Analytics" />
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Direktzugriff</p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <LinkCard title="Access Center" href="/admin/access" description="Seitenzugriffe verwalten" />
          <LinkCard title="Editorial Queue" href="/admin/editorial/queue" description="Triage, Review, Publish" />
          <LinkCard title="Graph Health" href="/admin/graph/health" description="Health KPIs & Repairs" />
          <LinkCard title="Report Assets" href="/admin/reports/assets" description="Revisionen & Freigabe" />
          <LinkCard title="Audit Logs" href="/admin/audit" description="Mutationen & Nachvollziehbarkeit" />
          <LinkCard title="Support Ledger" href="/admin/support" description="Pledges, Paid, CSV Export" />
          <LinkCard title="Campaign Desk" href="/admin/campaigns" description="Kampagnenstatus und Sessionfluss" />
          <LinkCard title="Swipe Analytics" href="/admin/swipes" description="Swipe Votes & Top Statements" />
          <LinkCard title="Factcheck Desk" href="/admin/factcheck" description="Editoriale Freigaben und Checks" />
          <LinkCard title="Identity Desk" href="/admin/identity" description="Verification-Level und Abdeckung" />
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Weitere Bereiche</p>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/admin/analytics", label: "Analytics" },
            { href: "/admin/errors", label: "Errors" },
            { href: "/admin/eventualities", label: "Eventualities" },
            { href: "/admin/newsletter", label: "Newsletter" },
            { href: "/admin/orgs", label: "Orgs" },
            { href: "/admin/pitch", label: "Pitch" },
            { href: "/admin/reports", label: "Reports" },
            { href: "/admin/responsibility", label: "Responsibility" },
            { href: "/admin/settings", label: "Settings" },
            { href: "/admin/swipes", label: "Swipes" },
            { href: "/admin/users", label: "Users" },
          ].map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="rounded-full bg-[rgb(var(--card))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--muted))] ring-1 ring-[rgb(var(--border))] transition hover:ring-sky-200"
            >
              {entry.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "load_failed";
}

function renderCard(
  title: string,
  value: number | undefined,
  loading: boolean,
  nf: Intl.NumberFormat,
  subtitle?: string,
  href?: string,
) {
  const content = (
    <div className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))] hover:ring-sky-200">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">{title}</p>
      {loading ? (
        <div className="mt-2 h-6 w-16 animate-pulse rounded bg-[rgb(var(--bg))]" />
      ) : (
        <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">{nf.format(value ?? 0)}</p>
      )}
      {subtitle && <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">{subtitle}</p>}
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block transition hover:-translate-y-0.5">
        {content}
      </Link>
    );
  }
  return content;
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

function SkeletonBars() {
  return (
    <div className="flex items-end gap-1">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="w-4 rounded-full bg-[rgb(var(--bg))]" style={{ height: `${10 + i * 2}px` }} />
      ))}
    </div>
  );
}

function LinkCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))] transition hover:-translate-y-0.5 hover:ring-sky-200"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">{title}</p>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">{description}</p>
    </Link>
  );
}
