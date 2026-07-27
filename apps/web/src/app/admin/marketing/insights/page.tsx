import Link from "next/link";
import { buildMarketingCampaignControlReadModel } from "@/features/marketing/campaignControl/readModel";
import type {
  MarketingDataQuality,
  MarketingMetricKey,
} from "@/features/marketing/campaignControl/contracts";

export const metadata = {
  title: "Marketing Performance · Admin · eDebatte",
};

type UiLocale = "de" | "en";

type PageProps = {
  searchParams?: Promise<{
    lang?: string | string[];
    campaign?: string | string[];
  }>;
};

const COPY = {
  de: {
    eyebrow: "Admin · Marketing · Performance",
    title: "Kampagnenergebnisse",
    intro:
      "Vergleiche interne Nutzung, externe Plattformen, E-Mail, Downloads und Werbung. Kennzahlen werden nur mit Quelle, Zeitraum und Datenqualität ausgewiesen.",
    allCampaigns: "Alle Kampagnen",
    campaignsWithData: "Kampagnen mit Daten",
    connectedSources: "Verbundene Datenarten",
    snapshots: "Mess-Snapshots",
    published: "Veröffentlichte Inhalte",
    sourceCoverage: "Datenquellen",
    sourceCoverageIntro:
      "Fehlende Datenquellen werden als nicht verbunden dargestellt und nicht als Null-Ergebnis interpretiert.",
    campaignScorecards: "Kampagnen-Scorecards",
    campaignScorecardsIntro:
      "Jede Scorecard zeigt Zielmarkt, Reichweitenraum, Hauptkennzahl und Datenlage. Ergebnisse bleiben leer, solange keine verifizierte Messung vorliegt.",
    segment: "Zielmarkt",
    reach: "Reichweite",
    primaryKpi: "Hauptkennzahl",
    result: "Ergebnis",
    noResult: "Noch keine verifizierten Daten",
    dataQuality: "Datenqualität",
    channels: "Kanäle",
    openCampaign: "Kampagne in der Steuerung öffnen",
    platformIntelligence: "Plattform- & Reichweitenintelligenz",
    platformBody:
      "Noch ist kein belastbarer Vergleich nach Plattform, B2C/B2B/B2G, Region, Sprache, national/international oder organisch/bezahlt möglich. Dafür fehlen reale Veröffentlichungs- und Performance-Snapshots.",
    platformNext:
      "Sobald Daten vorliegen, werden hier qualifizierte Reichweite, Shares, Saves, Klicks, Produktaktionen, E-Mail-Öffnungen, Downloads, Werbekosten und Conversions getrennt verglichen.",
    back: "Zur Marketing-Steuerung",
    notConnected: "Nicht verbunden",
    latest: "Letzte Erfassung",
    none: "Keine",
  },
  en: {
    eyebrow: "Admin · Marketing · Performance",
    title: "Campaign results",
    intro:
      "Compare internal usage, external platforms, email, downloads and advertising. Metrics appear only with source, reporting period and data quality.",
    allCampaigns: "All campaigns",
    campaignsWithData: "Campaigns with data",
    connectedSources: "Connected source types",
    snapshots: "Metric snapshots",
    published: "Published content",
    sourceCoverage: "Data sources",
    sourceCoverageIntro:
      "Missing data sources are shown as not connected and are not interpreted as zero results.",
    campaignScorecards: "Campaign scorecards",
    campaignScorecardsIntro:
      "Each scorecard shows market segment, reach scope, primary KPI and data quality. Results stay empty until verified measurements exist.",
    segment: "Market segment",
    reach: "Reach",
    primaryKpi: "Primary KPI",
    result: "Result",
    noResult: "No verified data yet",
    dataQuality: "Data quality",
    channels: "Channels",
    openCampaign: "Open campaign control",
    platformIntelligence: "Platform & reach intelligence",
    platformBody:
      "No reliable comparison by platform, B2C/B2B/B2G, region, language, national/international or organic/paid is possible yet. Real distribution and performance snapshots are missing.",
    platformNext:
      "Once data exists, qualified reach, shares, saves, clicks, product actions, email opens, downloads, advertising costs and conversions will be compared separately here.",
    back: "Back to marketing control",
    notConnected: "Not connected",
    latest: "Latest capture",
    none: "None",
  },
} as const;

export default async function MarketingInsightsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const locale = first(params?.lang) === "en" ? "en" : "de";
  const copy = COPY[locale];
  const selectedCampaignId = first(params?.campaign);
  const model = buildMarketingCampaignControlReadModel();
  const campaigns = selectedCampaignId
    ? model.campaigns.filter((row) => row.campaign.id === selectedCampaignId)
    : model.campaigns;
  const snapshotCount = campaigns.reduce((sum, row) => sum + row.metricSnapshots.length, 0);

  return (
    <main className="space-y-8 pb-12" data-testid="admin-marketing-insights">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">{copy.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold text-[rgb(var(--fg))] sm:text-4xl">{copy.title}</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-[rgb(var(--muted))] sm:text-base">{copy.intro}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/admin/marketing/insights?lang=${locale}`} className="rounded-full border border-[rgb(var(--border))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-300">{copy.allCampaigns}</Link>
          {selectedCampaignId && <span className="rounded-full border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 dark:bg-sky-400/10 dark:text-sky-200">{campaigns[0]?.campaign.title ?? selectedCampaignId}</span>}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Performance summary">
        <MetricCard label={copy.campaignsWithData} value={campaigns.filter((row) => row.hasPerformanceData).length} />
        <MetricCard label={copy.connectedSources} value={model.summary.connectedSourceKinds} />
        <MetricCard label={copy.snapshots} value={snapshotCount} />
        <MetricCard label={copy.published} value={campaigns.reduce((sum, row) => sum + row.publishedContentCount, 0)} />
      </section>

      <section className="space-y-5" aria-labelledby="sources-heading">
        <div>
          <SectionHeading id="sources-heading" title={copy.sourceCoverage} />
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[rgb(var(--muted))]">{copy.sourceCoverageIntro}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {model.sourceStates.map((source) => (
            <article key={source.sourceKind} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-[rgb(var(--fg))]">{sourceLabel(source.sourceKind, locale)}</h3>
                <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))]">{dataQualityLabel(source.quality, locale)}</span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <Definition label={copy.snapshots} value={String(source.snapshotCount)} />
                <Definition label={copy.latest} value={source.latestCapturedAt ? formatDate(source.latestCapturedAt, locale) : copy.notConnected} />
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5" aria-labelledby="scorecards-heading">
        <div>
          <SectionHeading id="scorecards-heading" title={copy.campaignScorecards} />
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[rgb(var(--muted))]">{copy.campaignScorecardsIntro}</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {campaigns.map((row) => (
            <article key={row.campaign.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700 dark:text-sky-300">{row.profile.primarySegment.toUpperCase()}</p>
                  <h3 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{row.campaign.title}</h3>
                </div>
                <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))]">{dataQualityLabel(row.dataQuality, locale)}</span>
              </div>
              <dl className="mt-4 grid gap-3 rounded-2xl bg-[rgb(var(--bg))] p-4 text-sm sm:grid-cols-2">
                <Definition label={copy.segment} value={row.profile.segments.map((value) => value.toUpperCase()).join(", ")} />
                <Definition label={copy.reach} value={row.profile.reachScopes.map((value) => reachLabel(value, locale)).join(", ")} />
                <Definition label={copy.primaryKpi} value={metricLabel(row.profile.primaryKpi, locale)} />
                <Definition label={copy.result} value={row.hasPerformanceData ? formatMetric(row.metrics[row.profile.primaryKpi], row.profile.primaryKpi, locale) : copy.noResult} />
                <Definition label={copy.channels} value={row.profile.plannedChannels.map((value) => channelLabel(value, locale)).join(", ")} />
                <Definition label={copy.dataQuality} value={dataQualityLabel(row.dataQuality, locale)} />
              </dl>
              <Link href={`/admin/marketing?lang=${locale}&campaign=${row.campaign.id}#campaign-detail`} className="mt-4 inline-flex rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800">{copy.openCampaign}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 sm:p-6" aria-labelledby="platform-heading">
        <SectionHeading id="platform-heading" title={copy.platformIntelligence} />
        <p className="mt-3 max-w-5xl text-sm leading-6 text-[rgb(var(--muted))]">{copy.platformBody}</p>
        <p className="mt-3 max-w-5xl text-sm font-medium leading-6 text-[rgb(var(--fg))]">{copy.platformNext}</p>
      </section>

      <footer className="border-t border-[rgb(var(--border))] pt-5">
        <Link href={`/admin/marketing?lang=${locale}`} className="rounded-full border border-[rgb(var(--border))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-300">{copy.back}</Link>
      </footer>
    </main>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function sourceLabel(value: "internal" | "social" | "email" | "download" | "ads" | "manual", locale: UiLocale) {
  const labels = {
    de: { internal: "eDebatte intern", social: "Social Media organisch", email: "E-Mail & Newsletter", download: "Downloads", ads: "Bezahlte Werbung", manual: "Manuell verifiziert" },
    en: { internal: "eDebatte internal", social: "Organic social media", email: "Email & newsletter", download: "Downloads", ads: "Paid advertising", manual: "Manually verified" },
  } as const;
  return labels[locale][value];
}

function reachLabel(value: "local" | "regional" | "national" | "international", locale: UiLocale) {
  const labels = {
    de: { local: "Lokal", regional: "Regional", national: "National", international: "International" },
    en: { local: "Local", regional: "Regional", national: "National", international: "International" },
  } as const;
  return labels[locale][value];
}

function channelLabel(value: string, locale: UiLocale) {
  const known: Record<string, string> = {
    edebatte: "eDebatte",
    website: "Website",
    download: "Download",
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
  return known[value] ?? value.replaceAll("_", " ");
}

function metricLabel(value: MarketingMetricKey, locale: UiLocale) {
  const labels: Record<UiLocale, Partial<Record<MarketingMetricKey, string>>> = {
    de: {
      reach: "Qualifizierte Reichweite",
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
    },
    en: {
      reach: "Qualified reach",
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
    },
  };
  return labels[locale][value] ?? value.replaceAll("_", " ");
}

function dataQualityLabel(value: MarketingDataQuality, locale: UiLocale) {
  const labels = {
    de: { verified: "Verifiziert", partial: "Teilweise", estimated: "Geschätzt", stale: "Veraltet", missing: "Keine Daten", rejected: "Verworfen" },
    en: { verified: "Verified", partial: "Partial", estimated: "Estimated", stale: "Stale", missing: "No data", rejected: "Rejected" },
  } as const;
  return labels[locale][value];
}

function formatMetric(value: number | undefined, key: MarketingMetricKey, locale: UiLocale) {
  if (value === undefined) return locale === "de" ? "Keine" : "None";
  const formatted = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB").format(value);
  return `${formatted} · ${metricLabel(key, locale)}`;
}

function formatDate(value: string, locale: UiLocale) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"><p className="text-sm font-semibold text-[rgb(var(--fg))]">{label}</p><strong className="mt-3 block text-3xl text-[rgb(var(--fg))]">{value}</strong></article>;
}

function Definition({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{label}</dt><dd className="mt-1 break-words font-medium leading-6 text-[rgb(var(--fg))]">{value}</dd></div>;
}

function SectionHeading({ id, title }: { id: string; title: string }) {
  return <h2 id={id} className="text-xl font-bold text-[rgb(var(--fg))] sm:text-2xl">{title}</h2>;
}
