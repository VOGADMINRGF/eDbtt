import Link from "next/link";
import type { MarketingContentStatus } from "@/features/marketing/contentOperations/contracts";
import { buildMarketingCampaignControlReadModel } from "@/features/marketing/campaignControl/readModel";
import type {
  MarketingCampaignControlRow,
  MarketingPerformanceSourceState,
} from "@/features/marketing/campaignControl/readModel";
import type {
  MarketingControlChannel,
  MarketingDataQuality,
  MarketingMetricKey,
  MarketingPromotion,
  MarketingReachScope,
  MarketingSegment,
} from "@/features/marketing/campaignControl/contracts";

export const metadata = {
  title: "Marketing · Admin · eDebatte",
};

type UiLocale = "de" | "en";
type SegmentFilter = "all" | MarketingSegment;
type ReachFilter = "all" | MarketingReachScope;

type PageProps = {
  searchParams?: Promise<{
    lang?: string | string[];
    segment?: string | string[];
    reach?: string | string[];
    campaign?: string | string[];
  }>;
};

const COPY = {
  de: {
    eyebrow: "Admin · Marketing",
    title: "Kampagnen- & Posting-Steuerung",
    intro:
      "Hier siehst du, welche Maßnahmen für B2C, B2B und B2G geplant sind, wo Beiträge ausgespielt werden und welche Wirkung tatsächlich belegt ist.",
    guardrail: "Keine Fantasiezahlen: Ergebnisse erscheinen nur mit verifizierter Quelle und Zeitraum.",
    campaigns: "Kampagnen",
    distribution: "Beiträge & Ausspielungen",
    performance: "Performance",
    recommendations: "Empfehlungen",
    allSegments: "Alle Zielmärkte",
    allReach: "Alle Reichweiten",
    plannedCampaigns: "Kampagnen",
    plannedCampaignsNote: "im gewählten Betrachtungsrahmen",
    contentItems: "Beiträge & Videos",
    contentItemsNote: "konkrete Content-Varianten",
    scheduled: "Eingeplant",
    scheduledNote: "mit bestätigtem Termin",
    published: "Veröffentlicht",
    publishedNote: "mit realem Ausspielbeleg",
    performanceCoverage: "Mit Messdaten",
    performanceCoverageNote: "Kampagnen mit verifizierten oder gekennzeichneten Snapshots",
    portfolioTitle: "Kampagnenportfolio",
    portfolioIntro:
      "Kampagnen werden nach Zielmarkt, Zielgruppe, Region, Reichweite, Sprache, Kanälen und Hauptziel gesteuert. Materialien sind nur Unterelemente der jeweiligen Kampagne.",
    noCampaigns: "Für diese Filterkombination gibt es keine Kampagne.",
    primaryAudience: "Hauptzielmarkt",
    audiences: "Zielgruppen",
    reach: "Reichweite",
    regions: "Regionen",
    languages: "Sprachen",
    promotion: "Ausspielung",
    channels: "Geplante Kanäle",
    objective: "Kampagnenziel",
    primaryKpi: "Hauptkennzahl",
    contentCount: "Inhalte",
    publishedCount: "veröffentlicht",
    dataQuality: "Datenlage",
    openCampaign: "Kampagne öffnen",
    openInsights: "Ergebnisse ansehen",
    campaignDetail: "Kampagnendetails",
    contentTitle: "Gestreute Beiträge und Varianten",
    contentIntro:
      "Hier werden interne und externe Varianten derselben Kampagne zusammengeführt. Organische und bezahlte Ausspielung bleiben getrennt.",
    contentStatus: "Status",
    surface: "Bereich",
    internal: "Intern",
    external: "Extern",
    mixed: "Intern & extern",
    schedule: "Termin",
    notScheduled: "Noch nicht terminiert",
    result: "Ergebnis",
    noMetrics: "Noch keine verifizierten Leistungsdaten",
    openContent: "Beitrag öffnen",
    noContent: "Für die gewählten Filter sind noch keine konkreten Beiträge angelegt.",
    sourceTitle: "Messdaten und Datenquellen",
    sourceIntro:
      "Interne Nutzung, Social Media, E-Mail, Downloads und Werbung werden getrennt erfasst. Fehlende Verbindungen gelten nicht als Null-Performance.",
    snapshots: "Snapshots",
    latest: "Letzte Erfassung",
    notConnected: "Nicht verbunden / keine verifizierten Daten",
    recommendationTitle: "Aktuelle Empfehlung",
    recommendationBody:
      "Noch ist keine belastbare Plattform- oder Reichweitenempfehlung möglich. Zuerst müssen Beiträge veröffentlicht und interne beziehungsweise externe Messdaten mit Kampagne, Zielgruppe, Region und Zeitraum verbunden werden.",
    recommendationNext:
      "Nächster sinnvoller Schritt: die zwei reviewfähigen Inhalte freigeben, terminieren und anschließend reale Ausspiel- und Performancebelege erfassen.",
    toReview: "Zur Inhaltsprüfung",
    toInsights: "Performance-Ansicht öffnen",
    backAdmin: "Admin-Übersicht",
    participationCampaigns: "Beteiligungskampagnen",
    german: "Deutsch",
    english: "English",
  },
  en: {
    eyebrow: "Admin · Marketing",
    title: "Campaign & posting control",
    intro:
      "See which B2C, B2B and B2G measures are planned, where content is distributed and which outcomes are actually evidenced.",
    guardrail: "No invented numbers: results appear only with a verified source and reporting period.",
    campaigns: "Campaigns",
    distribution: "Content & distribution",
    performance: "Performance",
    recommendations: "Recommendations",
    allSegments: "All market segments",
    allReach: "All reach scopes",
    plannedCampaigns: "Campaigns",
    plannedCampaignsNote: "in the selected scope",
    contentItems: "Posts & videos",
    contentItemsNote: "concrete content variants",
    scheduled: "Scheduled",
    scheduledNote: "with a confirmed time",
    published: "Published",
    publishedNote: "with verified distribution evidence",
    performanceCoverage: "With performance data",
    performanceCoverageNote: "campaigns with verified or explicitly qualified snapshots",
    portfolioTitle: "Campaign portfolio",
    portfolioIntro:
      "Campaigns are controlled by market segment, audience, region, reach, language, channels and primary outcome. Materials are subordinate campaign elements.",
    noCampaigns: "No campaign matches this filter combination.",
    primaryAudience: "Primary market",
    audiences: "Audiences",
    reach: "Reach",
    regions: "Regions",
    languages: "Languages",
    promotion: "Distribution type",
    channels: "Planned channels",
    objective: "Campaign objective",
    primaryKpi: "Primary KPI",
    contentCount: "Content",
    publishedCount: "published",
    dataQuality: "Data quality",
    openCampaign: "Open campaign",
    openInsights: "Open results",
    campaignDetail: "Campaign details",
    contentTitle: "Distributed content and variants",
    contentIntro:
      "Internal and external variants of the same campaign are connected here. Organic and paid distribution remain separate.",
    contentStatus: "Status",
    surface: "Surface",
    internal: "Internal",
    external: "External",
    mixed: "Internal & external",
    schedule: "Schedule",
    notScheduled: "Not scheduled yet",
    result: "Result",
    noMetrics: "No verified performance data yet",
    openContent: "Open content",
    noContent: "No concrete content exists for the selected filters yet.",
    sourceTitle: "Measurement data and sources",
    sourceIntro:
      "Internal usage, social media, email, downloads and advertising are measured separately. Missing connections are not interpreted as zero performance.",
    snapshots: "Snapshots",
    latest: "Latest capture",
    notConnected: "Not connected / no verified data",
    recommendationTitle: "Current recommendation",
    recommendationBody:
      "No reliable platform or reach recommendation is possible yet. Content must first be published and internal and external measurements must be linked to campaign, audience, region and reporting period.",
    recommendationNext:
      "Next useful step: approve and schedule the two review-ready items, then capture real distribution and performance evidence.",
    toReview: "Open content review",
    toInsights: "Open performance view",
    backAdmin: "Admin overview",
    participationCampaigns: "Participation campaigns",
    german: "Deutsch",
    english: "English",
  },
} as const;

export default async function MarketingAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const locale = normalizeLocale(params?.lang);
  const copy = COPY[locale];
  const segment = normalizeSegment(params?.segment);
  const reach = normalizeReach(params?.reach);
  const selectedCampaignId = first(params?.campaign);
  const model = buildMarketingCampaignControlReadModel();
  const campaigns = model.campaigns.filter(
    (row) =>
      (segment === "all" || row.profile.segments.includes(segment)) &&
      (reach === "all" || row.profile.reachScopes.includes(reach)),
  );
  const campaignIds = new Set(campaigns.map((row) => row.campaign.id));
  const contentItems = model.contentItems.filter((row) => campaignIds.has(row.campaign.id));
  const selectedCampaign = campaigns.find((row) => row.campaign.id === selectedCampaignId) ?? null;
  const summary = {
    campaigns: campaigns.length,
    contentItems: contentItems.length,
    scheduled: campaigns.reduce((sum, row) => sum + row.scheduledContentCount, 0),
    published: campaigns.reduce((sum, row) => sum + row.publishedContentCount, 0),
    withPerformance: campaigns.filter((row) => row.hasPerformanceData).length,
  };

  return (
    <main className="space-y-8 pb-12" data-testid="admin-marketing-control-system">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-4xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
              {copy.eyebrow}
            </p>
            <h1 className="text-3xl font-bold text-[rgb(var(--fg))] sm:text-4xl">{copy.title}</h1>
            <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))] sm:text-base">{copy.intro}</p>
            <p className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 dark:border-emerald-300/40 dark:bg-emerald-400/10 dark:text-emerald-100">
              {copy.guardrail}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <Link href={pageHref("de", segment, reach)} className={languageLinkClass(locale === "de")}>{copy.german}</Link>
            <Link href={pageHref("en", segment, reach)} className={languageLinkClass(locale === "en")}>{copy.english}</Link>
          </div>
        </div>
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Marketing navigation">
          <AnchorLink href="#campaigns" label={copy.campaigns} />
          <AnchorLink href="#distribution" label={copy.distribution} />
          <AnchorLink href="#performance" label={copy.performance} />
          <AnchorLink href="#recommendations" label={copy.recommendations} />
        </nav>
      </header>

      <section className="space-y-4" aria-label="Marketing filters">
        <div className="flex flex-wrap gap-2">
          <FilterLink href={pageHref(locale, "all", reach)} active={segment === "all"} label={copy.allSegments} />
          {(["b2c", "b2b", "b2g"] as const).map((value) => (
            <FilterLink key={value} href={pageHref(locale, value, reach)} active={segment === value} label={value.toUpperCase()} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterLink href={pageHref(locale, segment, "all")} active={reach === "all"} label={copy.allReach} />
          {(["local", "regional", "national", "international"] as const).map((value) => (
            <FilterLink key={value} href={pageHref(locale, segment, value)} active={reach === value} label={reachLabel(value, locale)} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Marketing summary">
        <MetricCard label={copy.plannedCampaigns} value={summary.campaigns} note={copy.plannedCampaignsNote} />
        <MetricCard label={copy.contentItems} value={summary.contentItems} note={copy.contentItemsNote} />
        <MetricCard label={copy.scheduled} value={summary.scheduled} note={copy.scheduledNote} />
        <MetricCard label={copy.published} value={summary.published} note={copy.publishedNote} />
        <MetricCard label={copy.performanceCoverage} value={summary.withPerformance} note={copy.performanceCoverageNote} />
      </section>

      <section id="campaigns" className="scroll-mt-6 space-y-5" aria-labelledby="campaigns-heading">
        <div>
          <SectionHeading id="campaigns-heading" title={copy.portfolioTitle} />
          <p className="mt-1 max-w-5xl text-sm leading-6 text-[rgb(var(--muted))]">{copy.portfolioIntro}</p>
        </div>
        {campaigns.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {campaigns.map((row) => (
              <CampaignCard key={row.campaign.id} row={row} locale={locale} copy={copy} segment={segment} reach={reach} />
            ))}
          </div>
        ) : (
          <EmptyState title={copy.noCampaigns} />
        )}
      </section>

      {selectedCampaign && (
        <section id="campaign-detail" className="scroll-mt-6 space-y-5 rounded-3xl border-2 border-sky-300 bg-sky-50/70 p-5 dark:border-sky-400/40 dark:bg-sky-400/10" aria-labelledby="campaign-detail-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">{copy.campaignDetail}</p>
              <h2 id="campaign-detail-heading" className="mt-1 text-2xl font-bold text-[rgb(var(--fg))]">{selectedCampaign.campaign.title}</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-[rgb(var(--muted))]">{selectedCampaign.profile.objective}</p>
            </div>
            <StatusBadge label={campaignStatusLabel(selectedCampaign.campaign.status, locale)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DetailPanel title={copy.primaryAudience} body={selectedCampaign.profile.primarySegment.toUpperCase()} />
            <DetailPanel title={copy.reach} body={selectedCampaign.profile.reachScopes.map((value) => reachLabel(value, locale)).join(", ")} />
            <DetailPanel title={copy.primaryKpi} body={metricLabel(selectedCampaign.profile.primaryKpi, locale)} />
            <DetailPanel title={copy.dataQuality} body={dataQualityLabel(selectedCampaign.dataQuality, locale)} />
          </div>
          <DetailPanel title={copy.channels} body={selectedCampaign.profile.plannedChannels.map((value) => channelLabel(value, locale)).join(", ")} />
          <div className="flex flex-wrap gap-2">
            {selectedCampaign.contentItems.some((item) => item.status === "review_ready") && <ActionLink href="/admin/editorial/queue" label={copy.toReview} />}
            <ActionLink href={`/admin/marketing/insights?lang=${locale}&campaign=${selectedCampaign.campaign.id}`} label={copy.openInsights} secondary />
          </div>
        </section>
      )}

      <section id="distribution" className="scroll-mt-6 space-y-5" aria-labelledby="distribution-heading">
        <div>
          <SectionHeading id="distribution-heading" title={copy.contentTitle} />
          <p className="mt-1 max-w-5xl text-sm leading-6 text-[rgb(var(--muted))]">{copy.contentIntro}</p>
        </div>
        {contentItems.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {contentItems.map((row) => (
              <article key={row.content.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700 dark:text-sky-300">{row.profile.primarySegment.toUpperCase()} · {promotionLabel(row.profile.promotion, locale)}</p>
                    <h3 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{row.content.title}</h3>
                    <p className="mt-1 text-sm text-[rgb(var(--muted))]">{row.campaign.title}</p>
                  </div>
                  <StatusBadge label={contentStatusLabel(row.content.status, locale)} />
                </div>
                <dl className="mt-4 grid gap-3 rounded-2xl bg-[rgb(var(--bg))] p-4 text-sm sm:grid-cols-2">
                  <Definition label={copy.channels} value={row.content.channels.map((value) => channelLabel(value as MarketingControlChannel, locale)).join(", ")} />
                  <Definition label={copy.surface} value={scopeLabel(row.internalExternal, copy)} />
                  <Definition label={copy.schedule} value={row.content.scheduledAt ? formatDate(row.content.scheduledAt, locale) : copy.notScheduled} />
                  <Definition label={copy.result} value={row.metricSnapshots.length ? formatPrimaryResult(row.metricSnapshots, row.profile.primaryKpi, locale) : copy.noMetrics} />
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionLink href={`/admin/marketing?lang=${locale}&segment=${segment}&reach=${reach}&campaign=${row.campaign.id}#campaign-detail`} label={copy.openContent} secondary />
                  {row.content.status === "review_ready" && <ActionLink href="/admin/editorial/queue" label={copy.toReview} />}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title={copy.noContent} />
        )}
      </section>

      <section id="performance" className="scroll-mt-6 space-y-5" aria-labelledby="performance-heading">
        <div>
          <SectionHeading id="performance-heading" title={copy.sourceTitle} />
          <p className="mt-1 max-w-5xl text-sm leading-6 text-[rgb(var(--muted))]">{copy.sourceIntro}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {model.sourceStates.map((source) => (
            <SourceCard key={source.sourceKind} source={source} locale={locale} copy={copy} />
          ))}
        </div>
      </section>

      <section id="recommendations" className="scroll-mt-6 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 sm:p-6" aria-labelledby="recommendations-heading">
        <SectionHeading id="recommendations-heading" title={copy.recommendationTitle} />
        <p className="mt-3 max-w-5xl text-sm leading-6 text-[rgb(var(--muted))]">{copy.recommendationBody}</p>
        <p className="mt-3 max-w-5xl text-sm font-medium leading-6 text-[rgb(var(--fg))]">{copy.recommendationNext}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <ActionLink href="/admin/editorial/queue" label={copy.toReview} />
          <ActionLink href={`/admin/marketing/insights?lang=${locale}`} label={copy.toInsights} secondary />
        </div>
      </section>

      <footer className="flex flex-wrap gap-2 border-t border-[rgb(var(--border))] pt-5">
        <AdminLink href="/admin" label={copy.backAdmin} />
        <AdminLink href="/admin/campaigns" label={copy.participationCampaigns} />
      </footer>
    </main>
  );
}

function CampaignCard({ row, locale, copy, segment, reach }: { row: MarketingCampaignControlRow; locale: UiLocale; copy: (typeof COPY)[UiLocale]; segment: SegmentFilter; reach: ReachFilter }) {
  return (
    <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="flex flex-wrap gap-2">
            {row.profile.segments.map((value) => <span key={value} className="rounded-full border border-sky-300 px-2.5 py-1 text-xs font-semibold text-sky-800 dark:text-sky-200">{value.toUpperCase()}</span>)}
            <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))]">{promotionLabel(row.profile.promotion, locale)}</span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-[rgb(var(--fg))]">{row.campaign.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{row.profile.objective}</p>
        </div>
        <StatusBadge label={campaignStatusLabel(row.campaign.status, locale)} />
      </div>
      <dl className="mt-4 grid gap-3 rounded-2xl bg-[rgb(var(--bg))] p-4 text-sm sm:grid-cols-2">
        <Definition label={copy.audiences} value={row.profile.audienceLabels.join(", ")} />
        <Definition label={copy.reach} value={row.profile.reachScopes.map((value) => reachLabel(value, locale)).join(", ")} />
        <Definition label={copy.channels} value={row.profile.plannedChannels.slice(0, 5).map((value) => channelLabel(value, locale)).join(", ") + (row.profile.plannedChannels.length > 5 ? " …" : "")} />
        <Definition label={copy.primaryKpi} value={metricLabel(row.profile.primaryKpi, locale)} />
        <Definition label={copy.contentCount} value={`${row.plannedContentCount} · ${row.publishedContentCount} ${copy.publishedCount}`} />
        <Definition label={copy.dataQuality} value={dataQualityLabel(row.dataQuality, locale)} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <ActionLink href={`/admin/marketing?lang=${locale}&segment=${segment}&reach=${reach}&campaign=${row.campaign.id}#campaign-detail`} label={copy.openCampaign} secondary />
        <ActionLink href={`/admin/marketing/insights?lang=${locale}&campaign=${row.campaign.id}`} label={copy.openInsights} />
      </div>
    </article>
  );
}

function SourceCard({ source, locale, copy }: { source: MarketingPerformanceSourceState; locale: UiLocale; copy: (typeof COPY)[UiLocale] }) {
  return (
    <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-[rgb(var(--fg))]">{sourceLabel(source.sourceKind, locale)}</h3>
        <StatusBadge label={dataQualityLabel(source.quality, locale)} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <Definition label={copy.snapshots} value={String(source.snapshotCount)} />
        <Definition label={copy.latest} value={source.latestCapturedAt ? formatDate(source.latestCapturedAt, locale) : copy.notConnected} />
      </dl>
    </article>
  );
}

function normalizeLocale(value: string | string[] | undefined): UiLocale {
  return first(value) === "en" ? "en" : "de";
}

function normalizeSegment(value: string | string[] | undefined): SegmentFilter {
  const candidate = first(value);
  return candidate === "b2c" || candidate === "b2b" || candidate === "b2g" ? candidate : "all";
}

function normalizeReach(value: string | string[] | undefined): ReachFilter {
  const candidate = first(value);
  return candidate === "local" || candidate === "regional" || candidate === "national" || candidate === "international" ? candidate : "all";
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pageHref(locale: UiLocale, segment: SegmentFilter, reach: ReachFilter) {
  const params = new URLSearchParams({ lang: locale, segment, reach });
  return `/admin/marketing?${params.toString()}`;
}

function reachLabel(value: MarketingReachScope, locale: UiLocale) {
  const labels = {
    de: { local: "Lokal", regional: "Regional", national: "National", international: "International" },
    en: { local: "Local", regional: "Regional", national: "National", international: "International" },
  } as const;
  return labels[locale][value];
}

function promotionLabel(value: MarketingPromotion, locale: UiLocale) {
  const labels = {
    de: { organic: "Organisch", paid: "Bezahlt", mixed: "Organisch & bezahlt" },
    en: { organic: "Organic", paid: "Paid", mixed: "Organic & paid" },
  } as const;
  return labels[locale][value];
}

function channelLabel(value: MarketingControlChannel, locale: UiLocale) {
  const labels: Record<MarketingControlChannel, string> = {
    edebatte: "eDebatte",
    website: "Website",
    download: locale === "de" ? "Download" : "Download",
    email: "E-Mail",
    newsletter: "Newsletter",
    instagram: "Instagram",
    instagram_reels: "Instagram Reels",
    instagram_story: "Instagram Story",
    linkedin: "LinkedIn",
    facebook: "Facebook",
    facebook_story: "Facebook Story",
    tiktok: "TikTok",
    youtube_shorts: "YouTube Shorts",
    youtube: "YouTube",
    press: locale === "de" ? "Presse" : "Press",
    meta_ads: "Meta Ads",
    linkedin_ads: "LinkedIn Ads",
    google_ads: "Google Ads",
  };
  return labels[value];
}

function metricLabel(value: MarketingMetricKey, locale: UiLocale) {
  const de: Partial<Record<MarketingMetricKey, string>> = {
    reach: "Qualifizierte Reichweite",
    impressions: "Impressionen",
    views: "Aufrufe",
    completion_rate: "Video-Abschlussrate",
    shares: "Geteilte Beiträge",
    saves: "Gespeicherte Beiträge",
    link_clicks: "Link-Klicks",
    downloads: "Downloads",
    product_actions_started: "Begonnene Produktaktionen",
    product_actions_completed: "Abgeschlossene Produktaktionen",
    qualified_inquiries: "Qualifizierte Anfragen",
    email_replies: "E-Mail-Antworten",
    landing_page_views: "Landingpage-Aufrufe",
  };
  const en: Partial<Record<MarketingMetricKey, string>> = {
    reach: "Qualified reach",
    impressions: "Impressions",
    views: "Views",
    completion_rate: "Video completion rate",
    shares: "Shares",
    saves: "Saves",
    link_clicks: "Link clicks",
    downloads: "Downloads",
    product_actions_started: "Product actions started",
    product_actions_completed: "Product actions completed",
    qualified_inquiries: "Qualified inquiries",
    email_replies: "Email replies",
    landing_page_views: "Landing page views",
  };
  return (locale === "de" ? de[value] : en[value]) ?? value.replaceAll("_", " ");
}

function dataQualityLabel(value: MarketingDataQuality, locale: UiLocale) {
  const labels = {
    de: { verified: "Verifiziert", partial: "Teilweise", estimated: "Geschätzt", stale: "Veraltet", missing: "Keine Daten", rejected: "Verworfen" },
    en: { verified: "Verified", partial: "Partial", estimated: "Estimated", stale: "Stale", missing: "No data", rejected: "Rejected" },
  } as const;
  return labels[locale][value];
}

function sourceLabel(value: MarketingPerformanceSourceState["sourceKind"], locale: UiLocale) {
  const labels = {
    de: { internal: "eDebatte intern", social: "Social Media organisch", email: "E-Mail & Newsletter", download: "Downloads", ads: "Bezahlte Werbung", manual: "Manuell verifiziert" },
    en: { internal: "eDebatte internal", social: "Organic social media", email: "Email & newsletter", download: "Downloads", ads: "Paid advertising", manual: "Manually verified" },
  } as const;
  return labels[locale][value];
}

function campaignStatusLabel(value: MarketingCampaignControlRow["campaign"]["status"], locale: UiLocale) {
  const de: Record<MarketingCampaignControlRow["campaign"]["status"], string> = {
    idea: "Idee", qualified: "Qualifiziert", planned: "Geplant", in_production: "In Produktion", review_ready: "Zur Freigabe", approved: "Freigegeben", scheduled: "Eingeplant", active: "Aktiv", paused: "Pausiert", blocked: "Blockiert", completed: "Abgeschlossen", retired: "Archiviert", cancelled: "Abgebrochen",
  };
  const en: Record<MarketingCampaignControlRow["campaign"]["status"], string> = {
    idea: "Idea", qualified: "Qualified", planned: "Planned", in_production: "In production", review_ready: "Ready for review", approved: "Approved", scheduled: "Scheduled", active: "Active", paused: "Paused", blocked: "Blocked", completed: "Completed", retired: "Archived", cancelled: "Cancelled",
  };
  return (locale === "de" ? de : en)[value];
}

function contentStatusLabel(value: MarketingContentStatus, locale: UiLocale) {
  const labels = {
    de: { draft: "In Arbeit", review_ready: "Zur Freigabe", approved: "Freigegeben", scheduled: "Eingeplant", published: "Veröffentlicht", paused: "Pausiert", archived: "Archiviert" },
    en: { draft: "In progress", review_ready: "Ready for review", approved: "Approved", scheduled: "Scheduled", published: "Published", paused: "Paused", archived: "Archived" },
  } as const;
  return labels[locale][value];
}

function scopeLabel(value: "internal" | "external" | "mixed", copy: (typeof COPY)[UiLocale]) {
  return value === "internal" ? copy.internal : value === "external" ? copy.external : copy.mixed;
}

function formatPrimaryResult(snapshots: Array<{ values: Partial<Record<MarketingMetricKey, number>> }>, primaryKpi: MarketingMetricKey, locale: UiLocale) {
  const value = snapshots.reduce((sum, snapshot) => sum + (snapshot.values[primaryKpi] ?? 0), 0);
  return `${new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB").format(value)} · ${metricLabel(primaryKpi, locale)}`;
}

function formatDate(value: string, locale: UiLocale) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function languageLinkClass(active: boolean) {
  return `rounded-full border px-3 py-1.5 ${active ? "border-sky-400 bg-sky-50 text-sky-800 dark:bg-sky-400/10 dark:text-sky-200" : "border-[rgb(var(--border))] text-[rgb(var(--muted))]"}`;
}

function MetricCard({ label, value, note }: { label: string; value: number; note: string }) {
  return <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"><p className="text-sm font-semibold text-[rgb(var(--fg))]">{label}</p><strong className="mt-3 block text-3xl text-[rgb(var(--fg))]">{value}</strong><p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{note}</p></article>;
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return <Link href={href} className={`rounded-full border px-3 py-2 text-sm font-semibold ${active ? "border-sky-400 bg-sky-50 text-sky-800 dark:bg-sky-400/10 dark:text-sky-200" : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] hover:border-sky-300"}`}>{label}</Link>;
}

function StatusBadge({ label }: { label: string }) {
  return <span className="rounded-full border border-sky-300 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-400/10 dark:text-sky-200">{label}</span>;
}

function Definition({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{label}</dt><dd className="mt-1 break-words font-medium leading-6 text-[rgb(var(--fg))]">{value}</dd></div>;
}

function DetailPanel({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{title}</p><p className="mt-2 text-sm font-medium leading-6 text-[rgb(var(--fg))]">{body}</p></div>;
}

function SectionHeading({ id, title }: { id: string; title: string }) {
  return <h2 id={id} className="text-xl font-bold text-[rgb(var(--fg))] sm:text-2xl">{title}</h2>;
}

function EmptyState({ title }: { title: string }) {
  return <div className="rounded-3xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-center text-sm text-[rgb(var(--muted))]">{title}</div>;
}

function AnchorLink({ href, label }: { href: string; label: string }) {
  return <a href={href} className="rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] hover:border-sky-300">{label}</a>;
}

function ActionLink({ href, label, secondary = false }: { href: string; label: string; secondary?: boolean }) {
  return <Link href={href} className={secondary ? "inline-flex rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-300" : "inline-flex rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800"}>{label}</Link>;
}

function AdminLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] hover:border-sky-300">{label}</Link>;
}
