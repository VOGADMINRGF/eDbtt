import Link from "next/link";
import {
  buildRegionalAgentRunsReadModel,
  type RegionalAgentRunListRow,
  type RegionalAgentRunsReadModel,
} from "@/features/marketing/registry/regionalRuns/readModel";
import type { RegionalRunStatus } from "@/features/marketing/registry/regionalRuns/contracts";
import { RegionalAgentRunsEmptyState } from "@/features/marketing/registry/regionalRuns/RegionalAgentRunsEmptyState";

export const metadata = { title: "Regionale Agent Runs · Marketing · Admin · eDebatte" };

type UiLocale = "de" | "en";
type PageProps = { searchParams?: Promise<{ lang?: string | string[] }> };

const COPY = {
  de: {
    eyebrow: "Admin · Marketing · Regional-Agent",
    title: "Regionale Agent Runs",
    intro: "Manuell hinterlegte regionale Run-Fixtures mit Quellenprovenienz, Sprachkontext, Reviewbedarf und nutzersicherer Spur.",
    guardrail: "Nur lesen: keine externe Suche, keine Provider, keine Kampagnenanlage und keine Veröffentlichung.",
    readOnly: "read_only",
    noSearch: "no_external_search",
    total: "Runs gesamt",
    reviewReady: "Zur Prüfung bereit",
    blocked: "Blockiert",
    failed: "Fehlerhaft",
    fixtures: "Repo-Fixtures",
    sourcePacks: "Source Packs",
    sources: "Quellen",
    candidates: "Vorschläge",
    blockers: "Blocker",
    region: "Region & Typ",
    jurisdiction: "Jurisdiktion & Ebene",
    period: "Zeitraum",
    languages: "Original → Lesen · Bedienung · Ausgabe",
    open: "Run ansehen",
    emptyTitle: "Keine Regional Runs vorhanden",
    emptyBody: "Die Oberfläche bleibt leer, bis validierte manuelle Source Packs oder Repo-Fixtures vorliegen.",
    back: "Zum Marketing-Cockpit",
  },
  en: {
    eyebrow: "Admin · Marketing · Regional agent",
    title: "Regional agent runs",
    intro: "Manually maintained regional run fixtures with source provenance, language context, review needs and a user-safe trace.",
    guardrail: "Read only: no external search, providers, campaign creation or publication.",
    readOnly: "read_only",
    noSearch: "no_external_search",
    total: "Total runs",
    reviewReady: "Ready for review",
    blocked: "Blocked",
    failed: "Failed",
    fixtures: "Repository fixtures",
    sourcePacks: "Source packs",
    sources: "Sources",
    candidates: "Suggestions",
    blockers: "Blockers",
    region: "Region & type",
    jurisdiction: "Jurisdiction & level",
    period: "Period",
    languages: "Original → reading · interface · output",
    open: "View run",
    emptyTitle: "No regional runs available",
    emptyBody: "This surface remains empty until validated manual source packs or repository fixtures exist.",
    back: "Back to marketing cockpit",
  },
} as const;

export default async function RegionalAgentRunsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const locale: UiLocale = first(params?.lang) === "en" ? "en" : "de";
  return <RegionalAgentRunsView model={buildRegionalAgentRunsReadModel()} locale={locale} />;
}

function RegionalAgentRunsView({
  model,
  locale,
}: {
  model: RegionalAgentRunsReadModel;
  locale: UiLocale;
}) {
  const copy = COPY[locale];

  return (
    <main className="space-y-6 pb-12" data-testid="admin-marketing-regional-agent-runs">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">{copy.eyebrow}</p>
            <h1 className="mt-1 text-3xl font-bold text-[rgb(var(--fg))]">{copy.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">{copy.intro}</p>
          </div>
          <div className="flex gap-2 text-xs font-semibold">
            <Link href="/admin/marketing/agent/runs?lang=de" className={languageClass(locale === "de")}>Deutsch</Link>
            <Link href="/admin/marketing/agent/runs?lang=en" className={languageClass(locale === "en")}>English</Link>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <BoundaryBadge label={copy.readOnly} tone="emerald" />
          <BoundaryBadge label={copy.noSearch} tone="amber" />
        </div>
        <p className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950 dark:border-amber-300/40 dark:bg-amber-400/10 dark:text-amber-100">{copy.guardrail}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={copy.fixtures} data-layout="responsive-grid">
        <Stat label={copy.total} value={model.summary.totalRuns} />
        <Stat label={copy.reviewReady} value={model.summary.reviewReadyRuns} />
        <Stat label={copy.blocked} value={model.summary.blockedRuns} tone="amber" />
        <Stat label={copy.failed} value={model.summary.failedRuns} tone="rose" />
      </section>

      {model.runs.length ? (
        <section className="grid gap-4 xl:grid-cols-2" aria-label={copy.fixtures}>
          {model.runs.map((row) => <RunCard key={row.run.id} row={row} locale={locale} />)}
        </section>
      ) : (
        <RegionalAgentRunsEmptyState title={copy.emptyTitle} body={copy.emptyBody} />
      )}

      <Link href={`/admin/marketing?lang=${locale}`} className="inline-flex rounded-xl border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-300">{copy.back}</Link>
    </main>
  );
}

function RunCard({ row, locale }: { row: RegionalAgentRunListRow; locale: UiLocale }) {
  const copy = COPY[locale];
  const run = row.run;
  const language = run.configuration.languages;
  const status = statusLabel(run.status, locale);

  return (
    <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5" data-run-status={run.status}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--muted))]">{run.id}</p>
          <h2 className="mt-1 text-xl font-semibold text-[rgb(var(--fg))]">{run.configuration.region.displayName}</h2>
        </div>
        <StatusBadge status={run.status} label={status} />
      </div>
      <dl className="mt-4 grid gap-3 rounded-2xl bg-[rgb(var(--bg))] p-4 text-sm sm:grid-cols-2">
        <Definition label={copy.region} value={`${run.configuration.region.displayName} · ${regionTypeLabel(run.configuration.region.type, locale)}`} />
        <Definition label={copy.jurisdiction} value={`${run.configuration.jurisdiction.displayName} · ${politicalLevelLabel(run.configuration.jurisdiction.politicalLevel, locale)}`} />
        <Definition label={copy.period} value={`${formatDate(run.configuration.period.startsAt, locale)} – ${formatDate(run.configuration.period.endsAt, locale)}`} />
        <Definition label={copy.languages} value={`${language.originalLanguages.join(", ")} → ${language.readingLanguage} · ${language.interfaceLanguage} · ${language.outputLanguages.join(", ")}`} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[rgb(var(--muted))]">
        <Count label={copy.sourcePacks} value={row.sourcePackCount} />
        <Count label={copy.sources} value={row.sourceCount} />
        <Count label={copy.candidates} value={row.opportunityCandidateCount} />
        <Count label={copy.blockers} value={row.openBlockerCount} />
      </div>
      <Link href={`/admin/marketing/agent/runs/${encodeURIComponent(run.id)}?lang=${locale}`} className="mt-5 inline-flex rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800">{copy.open} →</Link>
    </article>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "amber" | "rose" }) {
  const toneClass = tone === "amber" ? "border-amber-300 bg-amber-50/70 dark:bg-amber-400/10" : tone === "rose" ? "border-rose-300 bg-rose-50/70 dark:bg-rose-400/10" : "border-[rgb(var(--border))] bg-[rgb(var(--card))]";
  return <article className={`rounded-2xl border p-4 ${toneClass}`}><p className="text-xs uppercase tracking-[0.1em] text-[rgb(var(--muted))]">{label}</p><p className="mt-2 text-2xl font-bold text-[rgb(var(--fg))]">{value}</p></article>;
}

function BoundaryBadge({ label, tone }: { label: string; tone: "emerald" | "amber" }) {
  const classes = tone === "emerald" ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100" : "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100";
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}

function StatusBadge({ status, label }: { status: RegionalRunStatus; label: string }) {
  const classes = status === "review_ready" ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100" : status === "failed" ? "border-rose-300 bg-rose-50 text-rose-900 dark:bg-rose-400/10 dark:text-rose-100" : status === "blocked" ? "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100" : "border-sky-300 bg-sky-50 text-sky-900 dark:bg-sky-400/10 dark:text-sky-100";
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}

function Definition({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{label}</dt><dd className="mt-1 break-words font-medium leading-6 text-[rgb(var(--fg))]">{value}</dd></div>;
}

function Count({ label, value }: { label: string; value: number }) {
  return <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1">{label}: {value}</span>;
}

function languageClass(active: boolean) {
  return `rounded-full border px-3 py-1 ${active ? "border-sky-400 bg-sky-50 text-sky-900 dark:bg-sky-400/10 dark:text-sky-100" : "border-[rgb(var(--border))] text-[rgb(var(--muted))]"}`;
}

function statusLabel(status: RegionalRunStatus, locale: UiLocale) {
  const labels = locale === "de" ? { configured: "Konfiguriert", review_ready: "Zur Prüfung", blocked: "Blockiert", failed: "Fehlerhaft" } : { configured: "Configured", review_ready: "Review ready", blocked: "Blocked", failed: "Failed" };
  return labels[status];
}

function regionTypeLabel(value: string, locale: UiLocale) {
  const de: Record<string, string> = { country: "Staat", state_region: "Bundesland/Region", county: "Kreis", municipality: "Kommune", district: "Bezirk", neighborhood: "Quartier", cross_region: "regionsübergreifend" };
  const en: Record<string, string> = { country: "Country", state_region: "State/region", county: "County", municipality: "Municipality", district: "District", neighborhood: "Neighbourhood", cross_region: "Cross-region" };
  return (locale === "de" ? de : en)[value] ?? value;
}

function politicalLevelLabel(value: string, locale: UiLocale) {
  const de: Record<string, string> = { international: "international", eu: "EU", federal: "Bund", state_region: "Land", county: "Kreis", municipal: "kommunal", district: "Bezirk", mixed: "gemischt" };
  const en: Record<string, string> = { international: "International", eu: "EU", federal: "Federal", state_region: "State", county: "County", municipal: "Municipal", district: "District", mixed: "Mixed" };
  return (locale === "de" ? de : en)[value] ?? value;
}

function formatDate(value: string, locale: UiLocale) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { dateStyle: "medium" }).format(new Date(value));
}

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}
