import Link from "next/link";
import type { RegionalAgentRunDetailReadModel } from "@/features/marketing/registry/regionalRuns/readModel";
import { buildRegionalAgentRunDetailReadModel } from "@/features/marketing/registry/regionalRuns/readModel";

type UiLocale = "de" | "en";
type PageProps = {
  params: Promise<{ runId: string }>;
  searchParams?: Promise<{ lang?: string | string[] }>;
};

const COPY = {
  de: {
    eyebrow: "Admin · Marketing · Regional-Agent",
    title: "Regional Run",
    readOnly: "read_only",
    noSearch: "no_external_search",
    guardrail: "Dieser Run ist ein repo-backed Lesemodell. Er hat keine Recherche-, Provider-, Kampagnen-, Publishing- oder Nachrichtenfähigkeit.",
    configuration: "Run-Konfiguration",
    region: "Region",
    regionType: "Regionstyp",
    jurisdiction: "Jurisdiktion",
    politicalLevel: "Politische Ebene",
    period: "Zeitraum",
    topics: "Themenrahmen",
    depth: "Ausgabetiefe",
    status: "Run-Status",
    review: "Reviewstatus",
    languages: "Vier getrennte Sprachrollen",
    original: "Originalsprachen",
    reading: "Lesesprache",
    interface: "Bedienungssprache",
    output: "Ausgabesprachen",
    translationRule: "Übersetzung ist Lesehilfe, keine Evidenz. Originale bleiben erhalten.",
    sourcePacks: "Manuelle Source Packs",
    sourceClass: "Quellklasse",
    publisher: "Herausgeber",
    retrieved: "Abgerufen",
    published: "Veröffentlicht",
    provenance: "Provenienz",
    coverage: "Abdeckung",
    limitations: "Einschränkungen",
    noPublishedDate: "Kein Veröffentlichungszeitpunkt im Fixture",
    evidence: "Evidence",
    blockers: "Blocker",
    noBlockers: "Keine offenen Blocker in diesem Fixture.",
    candidates: "Opportunity-Kandidaten",
    suggestionsOnly: "Nur Vorschläge",
    humanReview: "Menschliche Entscheidung erforderlich",
    noCandidates: "Der Run wurde ohne Opportunity-Vorschlag beendet.",
    safeTrace: "User-sichere Spur",
    safeTraceIntro: "Sichtbar sind Arbeitsstand, Artefakte, Evidence und Reviewbedarf – keine private Gedankenkette, Prompt-Rohdaten, Secrets oder Providerdiagnostik.",
    input: "Eingang",
    outputArtifact: "Ausgang",
    action: "Menschlicher Schritt",
    notFound: "Regional Run nicht gefunden",
    notFoundBody: "Für diese Run-ID existiert kein validiertes Repo-Fixture. Es wurde kein Fallback und keine externe Suche ausgeführt.",
    back: "Zur Run-Übersicht",
  },
  en: {
    eyebrow: "Admin · Marketing · Regional agent",
    title: "Regional run",
    readOnly: "read_only",
    noSearch: "no_external_search",
    guardrail: "This run is a repository-backed read model. It has no research, provider, campaign, publishing or messaging capability.",
    configuration: "Run configuration",
    region: "Region",
    regionType: "Region type",
    jurisdiction: "Jurisdiction",
    politicalLevel: "Political level",
    period: "Period",
    topics: "Topic frame",
    depth: "Output depth",
    status: "Run status",
    review: "Review status",
    languages: "Four separate language roles",
    original: "Original languages",
    reading: "Reading language",
    interface: "Interface language",
    output: "Output languages",
    translationRule: "Translation is reading support, not evidence. Originals remain preserved.",
    sourcePacks: "Manual source packs",
    sourceClass: "Source class",
    publisher: "Issuer",
    retrieved: "Retrieved",
    published: "Published",
    provenance: "Provenance",
    coverage: "Coverage",
    limitations: "Limitations",
    noPublishedDate: "No publication date in the fixture",
    evidence: "Evidence",
    blockers: "Blockers",
    noBlockers: "No open blockers in this fixture.",
    candidates: "Opportunity candidates",
    suggestionsOnly: "Suggestions only",
    humanReview: "Human decision required",
    noCandidates: "The run ended without an opportunity suggestion.",
    safeTrace: "User-safe trace",
    safeTraceIntro: "Visible fields cover work status, artifacts, evidence and review needs — never private reasoning, raw prompts, secrets or provider diagnostics.",
    input: "Input",
    outputArtifact: "Output",
    action: "Human action",
    notFound: "Regional run not found",
    notFoundBody: "No validated repository fixture exists for this run ID. No fallback or external search was executed.",
    back: "Back to run overview",
  },
} as const;

export default async function RegionalAgentRunDetailPage({ params, searchParams }: PageProps) {
  const [{ runId }, query] = await Promise.all([params, searchParams]);
  const locale: UiLocale = first(query?.lang) === "en" ? "en" : "de";
  return <RegionalAgentRunDetailView model={buildRegionalAgentRunDetailReadModel(runId)} locale={locale} />;
}

function RegionalAgentRunDetailView({
  model,
  locale,
}: {
  model: RegionalAgentRunDetailReadModel | null;
  locale: UiLocale;
}) {
  const copy = COPY[locale];

  if (!model) {
    return (
      <main className="space-y-5 pb-12" data-testid="regional-agent-run-error-state">
        <section className="rounded-3xl border border-rose-300 bg-rose-50/70 p-6 dark:border-rose-300/40 dark:bg-rose-400/10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-800 dark:text-rose-200">{copy.noSearch}</p>
          <h1 className="mt-2 text-2xl font-bold text-[rgb(var(--fg))]">{copy.notFound}</h1>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{copy.notFoundBody}</p>
        </section>
        <BackLink locale={locale} label={copy.back} />
      </main>
    );
  }

  const { run } = model;
  const language = run.configuration.languages;

  return (
    <main className="space-y-6 pb-12" data-testid="admin-marketing-regional-agent-run-detail" data-run-status={run.status}>
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">{copy.eyebrow}</p>
            <h1 className="mt-1 text-3xl font-bold text-[rgb(var(--fg))]">{copy.title}</h1>
            <p className="mt-2 break-all text-sm font-semibold text-[rgb(var(--muted))]">{run.id}</p>
          </div>
          <div className="flex gap-2 text-xs font-semibold">
            <Link href={`/admin/marketing/agent/runs/${encodeURIComponent(run.id)}?lang=de`} className={languageClass(locale === "de")}>Deutsch</Link>
            <Link href={`/admin/marketing/agent/runs/${encodeURIComponent(run.id)}?lang=en`} className={languageClass(locale === "en")}>English</Link>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><Badge label={copy.readOnly} tone="emerald" /><Badge label={copy.noSearch} tone="amber" /><Badge label={run.status} tone={run.status === "failed" ? "rose" : run.status === "blocked" ? "amber" : "sky"} /></div>
        <p className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950 dark:border-amber-300/40 dark:bg-amber-400/10 dark:text-amber-100">{copy.guardrail}</p>
      </header>

      <section className="space-y-4" aria-labelledby="run-configuration-heading">
        <Heading id="run-configuration-heading" title={copy.configuration} />
        <dl className="grid gap-3 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 sm:grid-cols-2 xl:grid-cols-3" data-layout="responsive-grid">
          <Definition label={copy.region} value={run.configuration.region.displayName} />
          <Definition label={copy.regionType} value={run.configuration.region.type} />
          <Definition label={copy.jurisdiction} value={run.configuration.jurisdiction.displayName} />
          <Definition label={copy.politicalLevel} value={run.configuration.jurisdiction.politicalLevel} />
          <Definition label={copy.period} value={`${formatDate(run.configuration.period.startsAt, locale)} – ${formatDate(run.configuration.period.endsAt, locale)}`} />
          <Definition label={copy.topics} value={run.configuration.topicFrame.topicKeys.join(", ")} />
          <Definition label={copy.depth} value={run.configuration.outputDepth} />
          <Definition label={copy.status} value={run.status} />
          <Definition label={copy.review} value={run.reviewState} />
        </dl>
      </section>

      <section className="space-y-4" aria-labelledby="run-languages-heading">
        <Heading id="run-languages-heading" title={copy.languages} />
        <dl className="grid gap-3 rounded-3xl border border-sky-200 bg-sky-50/60 p-5 sm:grid-cols-2 xl:grid-cols-4 dark:border-sky-400/30 dark:bg-sky-400/10">
          <Definition label={copy.original} value={language.originalLanguages.join(", ")} />
          <Definition label={copy.reading} value={language.readingLanguage} />
          <Definition label={copy.interface} value={language.interfaceLanguage} />
          <Definition label={copy.output} value={language.outputLanguages.join(", ")} />
        </dl>
        <p className="text-sm font-semibold text-[rgb(var(--muted))]">{copy.translationRule}</p>
      </section>

      <section className="space-y-4" aria-labelledby="run-sources-heading">
        <Heading id="run-sources-heading" title={`${copy.sourcePacks} · ${model.sourceCount}`} />
        {run.sourcePacks.map((pack) => (
          <article key={pack.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--muted))]">{pack.id}</p><h3 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{pack.label}</h3></div>
              <Badge label={`${copy.coverage}: ${pack.coverageStatus}`} tone={pack.coverageStatus === "sufficient_for_fixture" ? "sky" : "amber"} />
            </div>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {pack.sources.map((source) => (
                <section key={source.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                  <p className="text-xs font-semibold text-[rgb(var(--muted))]">{source.id}</p>
                  <h4 className="mt-1 font-semibold text-[rgb(var(--fg))]" lang={source.originalLanguage} dir={source.originalLanguage.startsWith("ar") ? "rtl" : "ltr"}>{source.title}</h4>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <Definition label={copy.publisher} value={source.issuer} />
                    <Definition label={copy.sourceClass} value={source.sourceClass} />
                    <Definition label={copy.original} value={source.originalLanguage} />
                    <Definition label={copy.retrieved} value={formatDateTime(source.retrievedAt, locale)} />
                    <Definition label={copy.published} value={source.publishedAt ? formatDateTime(source.publishedAt, locale) : copy.noPublishedDate} />
                    <Definition label={copy.provenance} value={`${source.provenance.mode} · ${source.provenance.recordedBy}`} />
                  </dl>
                  <p className="mt-3 break-all text-xs text-[rgb(var(--muted))]">{source.stableRef}</p>
                  <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]"><strong>{copy.limitations}:</strong> {source.limitations.join(" · ")}</p>
                </section>
              ))}
            </div>
            {pack.missingCoverage.length ? <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-amber-900 dark:text-amber-100">{pack.missingCoverage.map((gap) => <li key={gap}>{gap}</li>)}</ul> : null}
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3"><Heading id="run-evidence-heading" title={copy.evidence} />{run.evidenceRefs.map((evidence) => <article key={evidence.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-[rgb(var(--fg))]">{evidence.id}</h3><Badge label={evidence.status} tone="sky" /></div><p className="mt-2 break-all text-xs text-[rgb(var(--muted))]">{evidence.ref}</p><p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{evidence.note}</p></article>)}</div>
        <div className="space-y-3"><Heading id="run-blockers-heading" title={copy.blockers} />{model.openBlockers.length ? model.openBlockers.map((blocker) => <article key={blocker.id} className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-300/40 dark:bg-amber-400/10"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-[rgb(var(--fg))]">{blocker.code}</h3><Badge label={blocker.status} tone="amber" /></div><p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{blocker.summary}</p></article>) : <p className="rounded-2xl border border-dashed border-[rgb(var(--border))] p-5 text-sm text-[rgb(var(--muted))]">{copy.noBlockers}</p>}</div>
      </section>

      <section className="space-y-4" aria-labelledby="run-candidates-heading">
        <div className="flex flex-wrap items-center justify-between gap-3"><Heading id="run-candidates-heading" title={copy.candidates} /><Badge label={copy.suggestionsOnly} tone="amber" /></div>
        {run.opportunityCandidates.length ? <div className="grid gap-4 xl:grid-cols-2">{run.opportunityCandidates.map((candidate) => <article key={candidate.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"><div className="flex flex-wrap justify-between gap-2"><h3 className="text-lg font-semibold text-[rgb(var(--fg))]">{candidate.title}</h3><Badge label={candidate.candidateStatus} tone="amber" /></div><p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{candidate.summary}</p><p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950 dark:bg-amber-400/10 dark:text-amber-100">{copy.humanReview} · {candidate.disposition}</p><p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{candidate.rationale}</p></article>)}</div> : <p className="rounded-2xl border border-dashed border-[rgb(var(--border))] p-5 text-sm text-[rgb(var(--muted))]">{copy.noCandidates}</p>}
      </section>

      <section className="space-y-4" aria-labelledby="run-trace-heading">
        <div><Heading id="run-trace-heading" title={copy.safeTrace} /><p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{copy.safeTraceIntro}</p></div>
        <ol className="space-y-3">{run.safeTrace.steps.map((step, index) => <li key={step.stepId} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-sky-700 dark:text-sky-300">{index + 1} · {step.roleId}</p><h3 className="mt-1 font-semibold text-[rgb(var(--fg))]">{step.userSafeLabel}</h3></div><Badge label={step.status} tone={step.status === "blocked" ? "amber" : "sky"} /></div><dl className="mt-4 grid gap-3 rounded-2xl bg-[rgb(var(--bg))] p-4 text-sm sm:grid-cols-3"><Definition label={copy.input} value={step.inputArtifacts.map((artifact) => artifact.label).join(", ")} /><Definition label={copy.outputArtifact} value={step.outputArtifacts.map((artifact) => artifact.label).join(", ")} /><Definition label={copy.action} value={step.requiredHumanAction} /></dl><p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">{step.traceScopeLine}</p></li>)}</ol>
      </section>

      <BackLink locale={locale} label={copy.back} />
    </main>
  );
}

function Heading({ id, title }: { id: string; title: string }) { return <h2 id={id} className="text-2xl font-semibold text-[rgb(var(--fg))]">{title}</h2>; }
function Definition({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{label}</dt><dd className="mt-1 break-words font-medium leading-6 text-[rgb(var(--fg))]">{value}</dd></div>; }
function Badge({ label, tone }: { label: string; tone: "emerald" | "amber" | "rose" | "sky" }) { const classes = { emerald: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100", amber: "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100", rose: "border-rose-300 bg-rose-50 text-rose-900 dark:bg-rose-400/10 dark:text-rose-100", sky: "border-sky-300 bg-sky-50 text-sky-900 dark:bg-sky-400/10 dark:text-sky-100" }[tone]; return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>{label}</span>; }
function BackLink({ locale, label }: { locale: UiLocale; label: string }) { return <Link href={`/admin/marketing/agent/runs?lang=${locale}`} className="inline-flex rounded-xl border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-300">{label}</Link>; }
function languageClass(active: boolean) { return `rounded-full border px-3 py-1 ${active ? "border-sky-400 bg-sky-50 text-sky-900 dark:bg-sky-400/10 dark:text-sky-100" : "border-[rgb(var(--border))] text-[rgb(var(--muted))]"}`; }
function formatDate(value: string, locale: UiLocale) { return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { dateStyle: "medium" }).format(new Date(value)); }
function formatDateTime(value: string, locale: UiLocale) { return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" }).format(new Date(value)); }
function first(value?: string | string[]) { return Array.isArray(value) ? value[0] : value; }
