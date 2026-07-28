import Link from "next/link";
import {
  buildMarketingSourceDecisionReadModel,
  type MarketingSourceDecisionState,
} from "@/features/marketing/sources/readModel";

export const metadata = { title: "Quellen & Themen · Marketing · Admin · eDebatte" };

type UiLocale = "de" | "en";

type PageProps = {
  searchParams?: Promise<{ lang?: string | string[] }>;
};

const COPY = {
  de: {
    eyebrow: "Admin · Marketing",
    title: "Quellen & Themen",
    intro:
      "Hier findest du den tatsächlichen Stand der Source-Allowlist, regionalen Abdeckung und Providerentscheidung. Noch nicht freigegebene Live-Daten werden nicht simuliert.",
    guardrail:
      "Live-Erfassung ist deaktiviert. Es werden keine Demo-Themen oder Fake-Synchronisationen angezeigt.",
    contract: "Verbindlicher Entscheidungsstand",
    sourceStatusTitle: "Source- und Providerstatus",
    liveIngestion: "Live-Erfassung",
    disabled: "Aus",
    coverageAreas: "definierte Bereiche",
    candidateCapacity: "Rohkandidaten im Zielbild",
    topLimit: "Top-Auswahl je Bereich",
    phase1: "Phase 1",
    phase1Value: "Amtliche und öffentliche maschinenlesbare Quellen",
    phase2: "Phase 2",
    phase2Value: "GDELT Cloud ist nur Kandidat",
    coverageTitle: "Geplante Abdeckung",
    coverageIntro:
      "Das Zielbild sammelt bis zu 20 Kandidaten je Einzelbereich und zeigt später höchstens die priorisierten Top 20. Gleiche Ereignisse werden vor der Anzeige geclustert.",
    areas: "Bereiche",
    rawCandidates: "max. Rohkandidaten",
    operatorTop: "Operator-Ansicht",
    decisionsTitle: "Was ist entschieden – und was noch offen?",
    decided: "Entschieden",
    open: "Offen",
    manualGate: "Freigabe erforderlich",
    workTitle: "Reale Arbeitswege",
    workIntro:
      "Regionale Quellen können bereits im bestehenden Regionenbereich gepflegt werden. Globale Providerverbindungen und das Live-Themenradar bleiben sichtbar abgegrenzt, bis sie wirklich nutzbar sind.",
    regionalSources: "Regionale Quellen verwalten",
    regionalSourcesDetail:
      "Region auswählen und dort konkrete Quellen kontrolliert ergänzen oder prüfen.",
    connections: "Konten & Datenquellen",
    connectionsDetail:
      "API-, CSV-, Secret- und Account-Verbindungen sind noch nicht produktiv freigegeben.",
    topicRadar: "Live-Themenradar",
    topicRadarDetail:
      "Startet erst nach konkreter Allowlist, Providerentscheidung und Betriebsfreigabe.",
    available: "Verfügbar",
    notAvailable: "Noch gesperrt",
    openAction: "Öffnen →",
    nextTitle: "Nächste sinnvolle Entscheidung",
    nextDetail:
      "Zuerst die amtlichen Phase-1-Quellen je Gebiet freigeben. Danach Abrufintervalle, Lizenz, Speicherung und Fehlerbetrieb bestätigen. Erst anschließend einen breiteren Provider bewerten.",
    backCockpit: "Zum Marketing-Cockpit",
  },
  en: {
    eyebrow: "Admin · Marketing",
    title: "Sources & topics",
    intro:
      "This page shows the actual source allowlist, regional coverage and provider decision status. Unapproved live data is never simulated.",
    guardrail:
      "Live ingestion is disabled. No demo topics or fake synchronisation is shown.",
    contract: "Binding decision status",
    sourceStatusTitle: "Source and provider status",
    liveIngestion: "Live ingestion",
    disabled: "Off",
    coverageAreas: "defined areas",
    candidateCapacity: "raw candidates in the target model",
    topLimit: "top selection per area",
    phase1: "Phase 1",
    phase1Value: "Official and public machine-readable sources",
    phase2: "Phase 2",
    phase2Value: "GDELT Cloud is only a candidate",
    coverageTitle: "Planned coverage",
    coverageIntro:
      "The target model collects up to 20 candidates per individual area and later shows at most the prioritised top 20. Duplicate events are clustered before display.",
    areas: "Areas",
    rawCandidates: "max. raw candidates",
    operatorTop: "Operator view",
    decisionsTitle: "What is decided – and what remains open?",
    decided: "Decided",
    open: "Open",
    manualGate: "Approval required",
    workTitle: "Real work paths",
    workIntro:
      "Regional sources can already be maintained in the existing regions area. Global provider connections and the live topic radar remain visibly separated until they are genuinely usable.",
    regionalSources: "Manage regional sources",
    regionalSourcesDetail:
      "Select a region and add or check concrete sources in a controlled workflow.",
    connections: "Accounts & data sources",
    connectionsDetail:
      "API, CSV, secret and account connections are not yet approved for production use.",
    topicRadar: "Live topic radar",
    topicRadarDetail:
      "Starts only after a concrete allowlist, provider decision and operating approval.",
    available: "Available",
    notAvailable: "Still gated",
    openAction: "Open →",
    nextTitle: "Next useful decision",
    nextDetail:
      "Approve the official Phase 1 sources per area first. Then confirm cadence, licensing, storage and failure operation. Only after that should a broader provider be evaluated.",
    backCockpit: "Back to marketing cockpit",
  },
} as const;

type SourceCopy = (typeof COPY)[UiLocale];

export default async function MarketingSourcesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const locale: UiLocale = first(params?.lang) === "en" ? "en" : "de";
  const copy = COPY[locale];
  const model = buildMarketingSourceDecisionReadModel();

  return (
    <main className="space-y-6 pb-12" data-testid="admin-marketing-sources-page">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
              {copy.eyebrow}
            </p>
            <h1 className="mt-1 text-3xl font-bold text-[rgb(var(--fg))]">{copy.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
              {copy.intro}
            </p>
          </div>
          <div className="flex gap-2 text-xs font-semibold">
            <Link
              href="/admin/marketing/sources?lang=de"
              className={languageClass(locale === "de")}
            >
              Deutsch
            </Link>
            <Link
              href="/admin/marketing/sources?lang=en"
              className={languageClass(locale === "en")}
            >
              English
            </Link>
          </div>
        </div>
        <p className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950 dark:border-amber-300/40 dark:bg-amber-400/10 dark:text-amber-100">
          {copy.guardrail}
        </p>
      </header>

      <section className="space-y-4" aria-labelledby="source-contract-heading">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            {copy.contract}
          </p>
          <h2
            id="source-contract-heading"
            className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]"
          >
            {copy.sourceStatusTitle}
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label={copy.liveIngestion} value={copy.disabled} tone="amber" />
          <Stat label={copy.coverageAreas} value={String(model.coverageAreaCount)} />
          <Stat label={copy.candidateCapacity} value={String(model.rawCandidateCapacity)} />
          <Stat label={copy.topLimit} value={String(model.operatorTopLimitPerArea)} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <article className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 dark:border-emerald-300/40 dark:bg-emerald-400/10">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-200">
              {copy.phase1}
            </p>
            <p className="mt-2 font-semibold text-[rgb(var(--fg))]">{copy.phase1Value}</p>
          </article>
          <article className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-300/40 dark:bg-amber-400/10">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-800 dark:text-amber-200">
              {copy.phase2}
            </p>
            <p className="mt-2 font-semibold text-[rgb(var(--fg))]">{copy.phase2Value}</p>
          </article>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="coverage-heading">
        <div>
          <h2 id="coverage-heading" className="text-2xl font-semibold text-[rgb(var(--fg))]">
            {copy.coverageTitle}
          </h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[rgb(var(--muted))]">
            {copy.coverageIntro}
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
          <div className="hidden grid-cols-[1.5fr_0.55fr_0.8fr_0.8fr] gap-3 border-b border-[rgb(var(--border))] px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--muted))] md:grid">
            <span>{copy.coverageTitle}</span>
            <span>{copy.areas}</span>
            <span>{copy.rawCandidates}</span>
            <span>{copy.operatorTop}</span>
          </div>
          <div className="divide-y divide-[rgb(var(--border))]">
            {model.coverage.map((group) => (
              <article
                key={group.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[1.5fr_0.55fr_0.8fr_0.8fr] md:items-center"
              >
                <h3 className="font-semibold text-[rgb(var(--fg))]">
                  {locale === "de" ? group.labelDe : group.labelEn}
                </h3>
                <Data label={copy.areas} value={String(group.areaCount)} />
                <Data label={copy.rawCandidates} value={String(group.rawCandidateLimit)} />
                <Data label={copy.operatorTop} value={`Top ${group.operatorTopLimit}`} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="decisions-heading">
        <h2 id="decisions-heading" className="text-2xl font-semibold text-[rgb(var(--fg))]">
          {copy.decisionsTitle}
        </h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {model.decisions.map((decision) => (
            <article
              key={decision.id}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-[rgb(var(--fg))]">
                  {locale === "de" ? decision.titleDe : decision.titleEn}
                </h3>
                <DecisionBadge state={decision.state} labels={copy} />
              </div>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                {locale === "de" ? decision.detailDe : decision.detailEn}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="space-y-4 rounded-3xl border border-sky-200 bg-sky-50/60 p-5 dark:border-sky-400/30 dark:bg-sky-400/10"
        aria-labelledby="work-heading"
      >
        <div>
          <h2 id="work-heading" className="text-2xl font-semibold text-[rgb(var(--fg))]">
            {copy.workTitle}
          </h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[rgb(var(--muted))]">
            {copy.workIntro}
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <WorkCard
            title={copy.regionalSources}
            detail={copy.regionalSourcesDetail}
            status={copy.available}
            openLabel={copy.openAction}
            href={model.regionalSourceRoute}
          />
          <WorkCard
            title={copy.connections}
            detail={copy.connectionsDetail}
            status={copy.notAvailable}
            openLabel={copy.openAction}
          />
          <WorkCard
            title={copy.topicRadar}
            detail={copy.topicRadarDetail}
            status={copy.notAvailable}
            openLabel={copy.openAction}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-violet-200 bg-violet-50/60 p-5 dark:border-violet-400/30 dark:bg-violet-400/10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-800 dark:text-violet-200">
          {copy.nextTitle}
        </p>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-[rgb(var(--fg))]">
          {copy.nextDetail}
        </p>
      </section>

      <Link
        href={`/admin/marketing?lang=${locale}`}
        className="inline-flex rounded-xl border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-300"
      >
        {copy.backCockpit}
      </Link>
    </main>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "amber";
}) {
  const classes =
    tone === "amber"
      ? "border-amber-300 bg-amber-50/70 dark:border-amber-300/40 dark:bg-amber-400/10"
      : "border-[rgb(var(--border))] bg-[rgb(var(--card))]";

  return (
    <article className={`rounded-2xl border p-4 ${classes}`}>
      <p className="text-xs uppercase tracking-[0.1em] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[rgb(var(--fg))]">{value}</p>
    </article>
  );
}

function Data({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-[rgb(var(--fg))]">
      <span className="mr-2 text-xs text-[rgb(var(--muted))] md:hidden">{label}:</span>
      {value}
    </p>
  );
}

function DecisionBadge({
  state,
  labels,
}: {
  state: MarketingSourceDecisionState;
  labels: SourceCopy;
}) {
  const label =
    state === "decided" ? labels.decided : state === "open" ? labels.open : labels.manualGate;
  const classes =
    state === "decided"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100"
      : state === "open"
        ? "border-sky-300 bg-sky-50 text-sky-900 dark:bg-sky-400/10 dark:text-sky-100"
        : "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}

function WorkCard({
  title,
  detail,
  status,
  openLabel,
  href,
}: {
  title: string;
  detail: string;
  status: string;
  openLabel: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-[rgb(var(--fg))]">{title}</h3>
        <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-xs text-[rgb(var(--muted))]">
          {status}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{detail}</p>
      {href ? (
        <p className="mt-3 text-sm font-semibold text-sky-700 dark:text-sky-300">{openLabel}</p>
      ) : null}
    </>
  );

  return href ? (
    <Link
      href={href}
      className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 hover:border-sky-300"
    >
      {content}
    </Link>
  ) : (
    <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 opacity-80">
      {content}
    </article>
  );
}

function languageClass(active: boolean) {
  return `rounded-full border px-3 py-1 ${
    active
      ? "border-sky-400 bg-sky-50 text-sky-900 dark:bg-sky-400/10 dark:text-sky-100"
      : "border-[rgb(var(--border))] text-[rgb(var(--muted))]"
  }`;
}

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}
