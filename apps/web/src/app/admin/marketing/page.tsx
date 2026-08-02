import Link from "next/link";
import { MarketingAssistantPanel } from "@/features/marketing/assistant/AssistantPanel";
import { buildMarketingAssistantReadModel } from "@/features/marketing/assistant/readModel";
import {
  buildMarketingCampaignControlReadModel,
  type MarketingCampaignControlRow,
  type MarketingPerformanceSourceState,
} from "@/features/marketing/campaignControl/readModel";
import type {
  MarketingControlChannel,
  MarketingDataQuality,
  MarketingMetricKey,
  MarketingPromotion,
  MarketingReachScope,
  MarketingSegment,
} from "@/features/marketing/campaignControl/contracts";
import type { MarketingContentStatus } from "@/features/marketing/contentOperations/contracts";

export const metadata = { title: "Marketing · Admin · eDebatte" };

type UiLocale = "de" | "en";
type SegmentFilter = "all" | MarketingSegment;
type ReachFilter = "all" | MarketingReachScope;
type ContentFilter = "all" | MarketingContentStatus;

type PageProps = {
  searchParams?: Promise<{
    lang?: string | string[];
    segment?: string | string[];
    reach?: string | string[];
    campaign?: string | string[];
    contentStatus?: string | string[];
  }>;
};

const COPY = {
  de: {
    eyebrow: "Admin · Marketing",
    title: "Marketing-Cockpit",
    intro: "Steuere Kampagnen, Beiträge, Freigaben und belegte Ergebnisse für B2C, B2B und B2G.",
    guardrail: "Ergebnisse erscheinen nur mit nachvollziehbarer Quelle und Zeitraum.",
    german: "Deutsch",
    english: "English",
    today: "Heute wichtig",
    campaigns: "Kampagnen",
    concreteContent: "konkrete Beiträge & Videos",
    scheduled: "eingeplant",
    published: "veröffentlicht",
    reviewNow: "Inhalte prüfen",
    allSegments: "Alle Zielmärkte",
    allReach: "Alle Reichweiten",
    allContent: "Alle Inhalte",
    reviewReady: "Zur Freigabe",
    portfolioTitle: "Kampagnen",
    portfolioIntro: "Kompakte Arbeitsliste. Weitere Zielgruppen-, Kanal- und KPI-Details lassen sich je Kampagne öffnen.",
    noCampaigns: "Für diese Filterkombination gibt es keine Kampagne.",
    audiences: "Zielgruppen",
    reach: "Reichweite",
    regions: "Regionen",
    languages: "Sprachen",
    channels: "Kanäle",
    primaryKpi: "Hauptkennzahl",
    content: "Inhalte",
    dataQuality: "Datenlage",
    openCampaign: "Details öffnen",
    openInsights: "Ergebnisse",
    detail: "Kampagnendetails",
    primaryMarket: "Hauptzielmarkt",
    review: "Inhalte prüfen",
    distributionTitle: "Beiträge & Ausspielungen",
    distributionIntro: "Interne und externe Varianten derselben Kampagne bleiben verbunden. Organische und bezahlte Ausspielung werden getrennt ausgewiesen.",
    reviewFilterNote: "Es werden nur Inhalte angezeigt, die auf Prüfung warten.",
    surface: "Bereich",
    internal: "Intern",
    external: "Extern",
    mixed: "Intern & extern",
    schedule: "Termin",
    notScheduled: "Noch nicht terminiert",
    result: "Ergebnis",
    noMetrics: "Noch keine verifizierten Leistungsdaten",
    contentPreview: "Caption und Script ansehen",
    caption: "Caption",
    script: "Script",
    noScript: "Kein separates Script erforderlich.",
    noContent: "Für die gewählten Filter sind noch keine konkreten Beiträge angelegt.",
    sourceTitle: "Messdaten & Datenquellen",
    sourceIntro: "Nicht verbundene Daten sind kein Null-Ergebnis. Details bleiben zunächst eingeklappt.",
    sourceSummary: "Datenquellen verbunden",
    sourceJoin: "von",
    sourceDetails: "Einzelne Datenquellen anzeigen",
    snapshots: "Snapshots",
    latest: "Letzte Erfassung",
    notConnected: "Nicht verbunden / keine verifizierten Daten",
    backAdmin: "Admin-Übersicht",
    participation: "Beteiligungskampagnen",
    regionalRuns: "Regionale Agent Runs",
    more: "Weitere Angaben",
  },
  en: {
    eyebrow: "Admin · Marketing",
    title: "Marketing cockpit",
    intro: "Control campaigns, content, approvals and evidenced outcomes for B2C, B2B and B2G.",
    guardrail: "Results appear only with a traceable source and reporting period.",
    german: "Deutsch",
    english: "English",
    today: "Important today",
    campaigns: "campaigns",
    concreteContent: "concrete posts & videos",
    scheduled: "scheduled",
    published: "published",
    reviewNow: "Review content",
    allSegments: "All market segments",
    allReach: "All reach scopes",
    allContent: "All content",
    reviewReady: "Ready for review",
    portfolioTitle: "Campaigns",
    portfolioIntro: "Compact work list. Additional audience, channel and KPI details open per campaign.",
    noCampaigns: "No campaign matches this filter combination.",
    audiences: "Audiences",
    reach: "Reach",
    regions: "Regions",
    languages: "Languages",
    channels: "Channels",
    primaryKpi: "Primary KPI",
    content: "Content",
    dataQuality: "Data quality",
    openCampaign: "Open details",
    openInsights: "Results",
    detail: "Campaign details",
    primaryMarket: "Primary market",
    review: "Review content",
    distributionTitle: "Content & distribution",
    distributionIntro: "Internal and external variants of the same campaign remain connected. Organic and paid distribution are reported separately.",
    reviewFilterNote: "Only content waiting for review is shown.",
    surface: "Surface",
    internal: "Internal",
    external: "External",
    mixed: "Internal & external",
    schedule: "Schedule",
    notScheduled: "Not scheduled yet",
    result: "Result",
    noMetrics: "No verified performance data yet",
    contentPreview: "View caption and script",
    caption: "Caption",
    script: "Script",
    noScript: "No separate script is required.",
    noContent: "No concrete content exists for the selected filters yet.",
    sourceTitle: "Measurement data & sources",
    sourceIntro: "Unconnected data is not a zero result. Details remain collapsed by default.",
    sourceSummary: "data sources connected",
    sourceJoin: "of",
    sourceDetails: "Show individual data sources",
    snapshots: "Snapshots",
    latest: "Latest capture",
    notConnected: "Not connected / no verified data",
    backAdmin: "Admin overview",
    participation: "Participation campaigns",
    regionalRuns: "Regional agent runs",
    more: "More details",
  },
} as const;

export default async function MarketingAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const locale = normalizeLocale(params?.lang);
  const copy = COPY[locale];
  const segment = normalizeSegment(params?.segment);
  const reach = normalizeReach(params?.reach);
  const contentFilter = normalizeContentFilter(params?.contentStatus);
  const selectedCampaignId = first(params?.campaign);
  const model = buildMarketingCampaignControlReadModel();
  const campaigns = model.campaigns.filter(
    (row) =>
      (segment === "all" || row.profile.segments.includes(segment)) &&
      (reach === "all" || row.profile.reachScopes.includes(reach)),
  );
  const campaignIds = new Set(campaigns.map((row) => row.campaign.id));
  const contentItems = model.contentItems.filter(
    (row) => campaignIds.has(row.campaign.id) && (contentFilter === "all" || row.content.status === contentFilter),
  );
  const selectedCampaign = campaigns.find((row) => row.campaign.id === selectedCampaignId) ?? null;
  const assistant = buildMarketingAssistantReadModel(model, {
    campaignId: selectedCampaign?.campaign.id ?? null,
    surface: "cockpit",
  });
  const reviewCount = model.contentItems.filter((row) => row.content.status === "review_ready").length;
  const scheduledCount = campaigns.reduce((sum, row) => sum + row.scheduledContentCount, 0);
  const publishedCount = campaigns.reduce((sum, row) => sum + row.publishedContentCount, 0);
  const connectedSources = model.sourceStates.filter((source) => source.snapshotCount > 0).length;

  return (
    <main className="space-y-6 pb-12" data-testid="admin-marketing-control-system">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">{copy.eyebrow}</p>
            <h1 className="mt-1 text-3xl font-bold text-[rgb(var(--fg))]">{copy.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">{copy.intro}</p>
          </div>
          <div className="flex gap-2 text-xs font-semibold">
            <Link href={pageHref("de", segment, reach, contentFilter)} className={languageClass(locale === "de")}>{copy.german}</Link>
            <Link href={pageHref("en", segment, reach, contentFilter)} className={languageClass(locale === "en")}>{copy.english}</Link>
          </div>
        </div>
        <p className="mt-4 inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 dark:border-emerald-300/40 dark:bg-emerald-400/10 dark:text-emerald-100">{copy.guardrail}</p>
      </header>

      <section className="rounded-3xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-400/30 dark:bg-sky-400/10" aria-labelledby="today-heading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p id="today-heading" className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700 dark:text-sky-300">{copy.today}</p>
            <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
              {campaigns.length} {copy.campaigns} · {contentItems.length} {copy.concreteContent} · {scheduledCount} {copy.scheduled} · {publishedCount} {copy.published}
            </p>
          </div>
          {reviewCount > 0 ? (
            <Link href={`/admin/marketing/review?lang=${locale}`} className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800">
              {copy.reviewNow} <span className="rounded-full bg-white/20 px-2 py-0.5">{reviewCount}</span>
            </Link>
          ) : null}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4" aria-label="Marketing filters">
        <div className="flex flex-wrap gap-2">
          <Filter href={pageHref(locale, "all", reach, contentFilter)} active={segment === "all"} label={copy.allSegments} />
          {(["b2c", "b2b", "b2g"] as const).map((value) => (
            <Filter key={value} href={pageHref(locale, value, reach, contentFilter)} active={segment === value} label={value.toUpperCase()} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Filter href={pageHref(locale, segment, "all", contentFilter)} active={reach === "all"} label={copy.allReach} />
          {(["local", "regional", "national", "international"] as const).map((value) => (
            <Filter key={value} href={pageHref(locale, segment, value, contentFilter)} active={reach === value} label={reachLabel(value, locale)} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Filter href={pageHref(locale, segment, reach, "all")} active={contentFilter === "all"} label={copy.allContent} />
          <Filter href={pageHref(locale, segment, reach, "review_ready")} active={contentFilter === "review_ready"} label={`${copy.reviewReady} (${reviewCount})`} />
        </div>
      </section>

      <MarketingAssistantPanel model={assistant} locale={locale} />

      <section id="campaigns" className="scroll-mt-24 space-y-4" aria-labelledby="campaigns-heading">
        <div>
          <Heading id="campaigns-heading" title={copy.portfolioTitle} />
          <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{copy.portfolioIntro}</p>
        </div>
        {campaigns.length ? (
          <div className="divide-y divide-[rgb(var(--border))] overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
            {campaigns.map((row) => (
              <CampaignRow key={row.campaign.id} row={row} locale={locale} copy={copy} segment={segment} reach={reach} contentFilter={contentFilter} />
            ))}
          </div>
        ) : <Empty text={copy.noCampaigns} />}
      </section>

      {selectedCampaign ? (
        <section id="campaign-detail" className="scroll-mt-24 rounded-3xl border-2 border-sky-300 bg-sky-50/70 p-5 dark:border-sky-400/40 dark:bg-sky-400/10" aria-labelledby="campaign-detail-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">{copy.detail}</p>
              <h2 id="campaign-detail-heading" className="mt-1 text-2xl font-bold text-[rgb(var(--fg))]">{selectedCampaign.campaign.title}</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-[rgb(var(--muted))]">{selectedCampaign.profile.objective}</p>
            </div>
            <Badge label={campaignStatusLabel(selectedCampaign.campaign.status, locale)} />
          </div>
          <dl className="mt-5 grid gap-x-6 gap-y-4 rounded-2xl bg-white/70 p-4 text-sm dark:bg-slate-950/20 sm:grid-cols-2 lg:grid-cols-3">
            <Definition label={copy.primaryMarket} value={selectedCampaign.profile.primarySegment.toUpperCase()} />
            <Definition label={copy.reach} value={selectedCampaign.profile.reachScopes.map((value) => reachLabel(value, locale)).join(", ")} />
            <Definition label={copy.regions} value={selectedCampaign.profile.regionKeys.join(", ")} />
            <Definition label={copy.languages} value={selectedCampaign.profile.locales.join(", ")} />
            <Definition label={copy.primaryKpi} value={metricLabel(selectedCampaign.profile.primaryKpi, locale)} />
            <Definition label={copy.channels} value={selectedCampaign.profile.plannedChannels.map((value) => channelLabel(value, locale)).join(", ")} />
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            {selectedCampaign.contentItems.some((item) => item.status === "review_ready") ? <Action href={`/admin/marketing/review?lang=${locale}&campaign=${selectedCampaign.campaign.id}`} label={copy.review} /> : null}
            <Action href={`/admin/marketing/insights?lang=${locale}&campaign=${selectedCampaign.campaign.id}`} label={copy.openInsights} secondary />
          </div>
        </section>
      ) : null}

      <section id="distribution" className="scroll-mt-24 space-y-4" aria-labelledby="distribution-heading">
        <div>
          <Heading id="distribution-heading" title={copy.distributionTitle} />
          <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{copy.distributionIntro}</p>
          {contentFilter === "review_ready" ? <p className="mt-2 text-sm font-semibold text-amber-800 dark:text-amber-200">{copy.reviewFilterNote}</p> : null}
        </div>
        {contentItems.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {contentItems.map((row) => (
              <article id={`content-${row.content.id}`} key={row.content.id} className="scroll-mt-24 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700 dark:text-sky-300">{row.profile.primarySegment.toUpperCase()} · {promotionLabel(row.profile.promotion, locale)}</p>
                    <h3 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{row.content.title}</h3>
                    <p className="mt-1 text-sm text-[rgb(var(--muted))]">{row.campaign.title}</p>
                  </div>
                  <Badge label={contentStatusLabel(row.content.status, locale)} />
                </div>
                <dl className="mt-4 grid gap-3 rounded-2xl bg-[rgb(var(--bg))] p-4 text-sm sm:grid-cols-2">
                  <Definition label={copy.channels} value={row.content.channels.map((value) => channelLabel(value as MarketingControlChannel, locale)).join(", ")} />
                  <Definition label={copy.surface} value={scopeLabel(row.internalExternal, copy)} />
                  <Definition label={copy.schedule} value={row.content.scheduledAt ? formatDate(row.content.scheduledAt, locale) : copy.notScheduled} />
                  <Definition label={copy.result} value={row.metricSnapshots.length ? formatPrimaryResult(row.metricSnapshots, row.profile.primaryKpi, locale) : copy.noMetrics} />
                </dl>
                <details className="mt-4 rounded-2xl border border-[rgb(var(--border))] p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">{copy.contentPreview}</summary>
                  <div className="mt-3 space-y-3 text-sm leading-6">
                    <TextBlock label={copy.caption} body={row.content.captionDraft} />
                    <TextBlock label={copy.script} body={row.content.scriptDraft ?? copy.noScript} />
                  </div>
                </details>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Action href={`/admin/marketing?lang=${locale}&segment=${segment}&reach=${reach}&campaign=${row.campaign.id}#campaign-detail`} label={copy.openCampaign} secondary />
                  {row.content.status === "review_ready" ? <Action href={`/admin/marketing/review?lang=${locale}&campaign=${row.campaign.id}#content-${row.content.id}`} label={copy.review} /> : null}
                </div>
              </article>
            ))}
          </div>
        ) : <Empty text={copy.noContent} />}
      </section>

      <section id="performance" className="scroll-mt-24 space-y-4" aria-labelledby="performance-heading">
        <div>
          <Heading id="performance-heading" title={copy.sourceTitle} />
          <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{copy.sourceIntro}</p>
        </div>
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">{connectedSources} {copy.sourceJoin} {model.sourceStates.length} {copy.sourceSummary}</p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{connectedSources ? qualityLabel("partial", locale) : copy.notConnected}</p>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-sky-700 dark:text-sky-300">{copy.sourceDetails}</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {model.sourceStates.map((source) => <SourceCard key={source.sourceKind} source={source} locale={locale} copy={copy} />)}
            </div>
          </details>
        </div>
        <Action href={`/admin/marketing/insights?lang=${locale}`} label={copy.openInsights} />
      </section>

      <footer className="flex flex-wrap gap-2 border-t border-[rgb(var(--border))] pt-5">
        <AdminLink href={`/admin/marketing/agent/runs?lang=${locale}`} label={copy.regionalRuns} />
        <AdminLink href="/admin" label={copy.backAdmin} />
        <AdminLink href="/admin/campaigns" label={copy.participation} />
      </footer>
    </main>
  );
}

function CampaignRow({ row, locale, copy, segment, reach, contentFilter }: { row: MarketingCampaignControlRow; locale: UiLocale; copy: (typeof COPY)[UiLocale]; segment: SegmentFilter; reach: ReachFilter; contentFilter: ContentFilter }) {
  return (
    <article className="p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {row.profile.segments.map((value) => <span key={value} className="rounded-full border border-sky-300 px-2 py-0.5 text-xs font-semibold text-sky-800 dark:text-sky-200">{value.toUpperCase()}</span>)}
            <Badge label={campaignStatusLabel(row.campaign.status, locale)} />
          </div>
          <h3 className="mt-2 text-base font-semibold text-[rgb(var(--fg))] sm:text-lg">{row.campaign.title}</h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">{row.profile.objective}</p>
          <p className="mt-2 text-xs font-medium text-[rgb(var(--muted))]">
            {row.plannedContentCount} {copy.content.toLowerCase()} · {row.profile.reachScopes.map((value) => reachLabel(value, locale)).join(", ")} · {promotionLabel(row.profile.promotion, locale)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Action href={`/admin/marketing?lang=${locale}&segment=${segment}&reach=${reach}&contentStatus=${contentFilter}&campaign=${row.campaign.id}#campaign-detail`} label={copy.openCampaign} secondary />
          <Action href={`/admin/marketing/insights?lang=${locale}&campaign=${row.campaign.id}`} label={copy.openInsights} />
        </div>
      </div>
      <details className="mt-3 rounded-2xl border border-[rgb(var(--border))] px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">{copy.more}</summary>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Definition label={copy.audiences} value={row.profile.audienceLabels.join(", ")} />
          <Definition label={copy.channels} value={row.profile.plannedChannels.map((value) => channelLabel(value, locale)).join(", ")} />
          <Definition label={copy.primaryKpi} value={metricLabel(row.profile.primaryKpi, locale)} />
          <Definition label={copy.dataQuality} value={qualityLabel(row.dataQuality, locale)} />
          <Definition label={copy.languages} value={row.profile.locales.join(", ")} />
          <Definition label={copy.regions} value={row.profile.regionKeys.join(", ")} />
        </dl>
      </details>
    </article>
  );
}

function SourceCard({ source, locale, copy }: { source: MarketingPerformanceSourceState; locale: UiLocale; copy: (typeof COPY)[UiLocale] }) {
  return (
    <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-[rgb(var(--fg))]">{sourceLabel(source.sourceKind, locale)}</h3>
        <Badge label={qualityLabel(source.quality, locale)} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <Definition label={copy.snapshots} value={String(source.snapshotCount)} />
        <Definition label={copy.latest} value={source.latestCapturedAt ? formatDate(source.latestCapturedAt, locale) : copy.notConnected} />
      </dl>
    </article>
  );
}

function normalizeLocale(value: string | string[] | undefined): UiLocale { return first(value) === "en" ? "en" : "de"; }
function normalizeSegment(value: string | string[] | undefined): SegmentFilter { const item = first(value); return item === "b2c" || item === "b2b" || item === "b2g" ? item : "all"; }
function normalizeReach(value: string | string[] | undefined): ReachFilter { const item = first(value); return item === "local" || item === "regional" || item === "national" || item === "international" ? item : "all"; }
function normalizeContentFilter(value: string | string[] | undefined): ContentFilter { const item = first(value); return item === "draft" || item === "review_ready" || item === "approved" || item === "scheduled" || item === "published" || item === "paused" || item === "archived" ? item : "all"; }
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function pageHref(locale: UiLocale, segment: SegmentFilter, reach: ReachFilter, contentStatus: ContentFilter) { return `/admin/marketing?${new URLSearchParams({ lang: locale, segment, reach, contentStatus }).toString()}`; }
function reachLabel(value: MarketingReachScope, locale: UiLocale) { return ({ de: { local: "Lokal", regional: "Regional", national: "National", international: "International" }, en: { local: "Local", regional: "Regional", national: "National", international: "International" } } as const)[locale][value]; }
function promotionLabel(value: MarketingPromotion, locale: UiLocale) { return ({ de: { organic: "Organisch", paid: "Bezahlt", mixed: "Organisch & bezahlt" }, en: { organic: "Organic", paid: "Paid", mixed: "Organic & paid" } } as const)[locale][value]; }
function channelLabel(value: MarketingControlChannel, locale: UiLocale) { const labels: Record<MarketingControlChannel, string> = { edebatte: "eDebatte", website: "Website", download: "Download", email: "E-Mail", newsletter: "Newsletter", instagram: "Instagram", instagram_reels: "Instagram Reels", instagram_story: "Instagram Story", linkedin: "LinkedIn", facebook: "Facebook", facebook_story: "Facebook Story", tiktok: "TikTok", youtube_shorts: "YouTube Shorts", youtube: "YouTube", press: locale === "de" ? "Presse" : "Press", meta_ads: "Meta Ads", linkedin_ads: "LinkedIn Ads", google_ads: "Google Ads" }; return labels[value]; }
function metricLabel(value: MarketingMetricKey, locale: UiLocale) { const de: Partial<Record<MarketingMetricKey, string>> = { reach: "Qualifizierte Reichweite", impressions: "Impressionen", views: "Aufrufe", completion_rate: "Video-Abschlussrate", shares: "Geteilte Beiträge", saves: "Gespeicherte Beiträge", link_clicks: "Link-Klicks", downloads: "Downloads", product_actions_started: "Begonnene Produktaktionen", product_actions_completed: "Abgeschlossene Produktaktionen", qualified_inquiries: "Qualifizierte Anfragen", email_replies: "E-Mail-Antworten", landing_page_views: "Landingpage-Aufrufe" }; const en: Partial<Record<MarketingMetricKey, string>> = { reach: "Qualified reach", impressions: "Impressions", views: "Views", completion_rate: "Video completion rate", shares: "Shares", saves: "Saves", link_clicks: "Link clicks", downloads: "Downloads", product_actions_started: "Product actions started", product_actions_completed: "Product actions completed", qualified_inquiries: "Qualified inquiries", email_replies: "Email replies", landing_page_views: "Landing page views" }; return (locale === "de" ? de[value] : en[value]) ?? value.replaceAll("_", " "); }
function qualityLabel(value: MarketingDataQuality, locale: UiLocale) { return ({ de: { verified: "Verifiziert", partial: "Teilweise", estimated: "Geschätzt", stale: "Veraltet", missing: "Keine Daten", rejected: "Verworfen" }, en: { verified: "Verified", partial: "Partial", estimated: "Estimated", stale: "Stale", missing: "No data", rejected: "Rejected" } } as const)[locale][value]; }
function sourceLabel(value: MarketingPerformanceSourceState["sourceKind"], locale: UiLocale) { return ({ de: { internal: "eDebatte intern", social: "Social Media organisch", email: "E-Mail & Newsletter", download: "Downloads", ads: "Bezahlte Werbung", manual: "Manuell verifiziert" }, en: { internal: "eDebatte internal", social: "Organic social media", email: "Email & newsletter", download: "Downloads", ads: "Paid advertising", manual: "Manually verified" } } as const)[locale][value]; }
function campaignStatusLabel(value: MarketingCampaignControlRow["campaign"]["status"], locale: UiLocale) { const labels = { de: { idea: "Idee", qualified: "Qualifiziert", planned: "Geplant", in_production: "In Produktion", review_ready: "Zur Freigabe", approved: "Freigegeben", scheduled: "Eingeplant", active: "Aktiv", paused: "Pausiert", blocked: "Blockiert", completed: "Abgeschlossen", retired: "Archiviert", cancelled: "Abgebrochen" }, en: { idea: "Idea", qualified: "Qualified", planned: "Planned", in_production: "In production", review_ready: "Ready for review", approved: "Approved", scheduled: "Scheduled", active: "Active", paused: "Paused", blocked: "Blocked", completed: "Completed", retired: "Archived", cancelled: "Cancelled" } } as const; return labels[locale][value]; }
function contentStatusLabel(value: MarketingContentStatus, locale: UiLocale) { return ({ de: { draft: "In Arbeit", review_ready: "Zur Freigabe", approved: "Freigegeben", scheduled: "Eingeplant", published: "Veröffentlicht", paused: "Pausiert", archived: "Archiviert" }, en: { draft: "In progress", review_ready: "Ready for review", approved: "Approved", scheduled: "Scheduled", published: "Published", paused: "Paused", archived: "Archived" } } as const)[locale][value]; }
function scopeLabel(value: "internal" | "external" | "mixed", copy: (typeof COPY)[UiLocale]) { return value === "internal" ? copy.internal : value === "external" ? copy.external : copy.mixed; }
function formatPrimaryResult(snapshots: Array<{ values: Partial<Record<MarketingMetricKey, number>> }>, key: MarketingMetricKey, locale: UiLocale) { const value = snapshots.reduce((sum, snapshot) => sum + (snapshot.values[key] ?? 0), 0); return `${new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB").format(value)} · ${metricLabel(key, locale)}`; }
function formatDate(value: string, locale: UiLocale) { return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function languageClass(active: boolean) { return `rounded-full border px-3 py-1.5 ${active ? "border-sky-400 bg-sky-50 text-sky-800 dark:bg-sky-400/10 dark:text-sky-200" : "border-[rgb(var(--border))] text-[rgb(var(--muted))]"}`; }
function Filter({ href, active, label }: { href: string; active: boolean; label: string }) { return <Link href={href} prefetch className={`rounded-full border px-3 py-2 text-sm font-semibold ${active ? "border-sky-400 bg-sky-50 text-sky-800 dark:bg-sky-400/10 dark:text-sky-200" : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] hover:border-sky-300"}`}>{label}</Link>; }
function Badge({ label }: { label: string }) { return <span className="rounded-full border border-sky-300 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-400/10 dark:text-sky-200">{label}</span>; }
function Definition({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{label}</dt><dd className="mt-1 break-words font-medium leading-6 text-[rgb(var(--fg))]">{value}</dd></div>; }
function TextBlock({ label, body }: { label: string; body: string }) { return <div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{label}</p><p className="mt-1 whitespace-pre-wrap text-[rgb(var(--fg))]">{body}</p></div>; }
function Heading({ id, title }: { id: string; title: string }) { return <h2 id={id} className="text-xl font-bold text-[rgb(var(--fg))] sm:text-2xl">{title}</h2>; }
function Empty({ text }: { text: string }) { return <div className="rounded-3xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-center text-sm text-[rgb(var(--muted))]">{text}</div>; }
function Action({ href, label, secondary = false }: { href: string; label: string; secondary?: boolean }) { return <Link href={href} prefetch className={secondary ? "inline-flex rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-300" : "inline-flex rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800"}>{label}</Link>; }
function AdminLink({ href, label }: { href: string; label: string }) { return <Link href={href} className="rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] hover:border-sky-300">{label}</Link>; }
