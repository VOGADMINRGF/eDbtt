import Link from "next/link";
import { MarketingAssistantPanel } from "@/features/marketing/assistant/AssistantPanel";
import { buildMarketingAssistantReadModel } from "@/features/marketing/assistant/readModel";
import { buildMarketingCampaignControlReadModel } from "@/features/marketing/campaignControl/readModel";
import type { MarketingDataQuality, MarketingMetricKey } from "@/features/marketing/campaignControl/contracts";

export const metadata = { title: "Marketing Performance · Admin · eDebatte" };

type UiLocale = "de" | "en";
type PageProps = { searchParams?: Promise<{ lang?: string | string[]; campaign?: string | string[] }> };

const COPY = {
  de: {
    eyebrow: "Admin · Marketing · Performance",
    title: "Kampagnenergebnisse",
    intro: "Vergleiche interne Nutzung, externe Plattformen, E-Mail, Downloads und Werbung. Kennzahlen erscheinen nur mit Quelle, Zeitraum und Datenqualität.",
    all: "Alle Kampagnen",
    withData: "Kampagnen mit Daten",
    connected: "Verbundene Datenarten",
    snapshots: "Mess-Snapshots",
    published: "Veröffentlichte Inhalte",
    sources: "Datenquellen",
    sourcesIntro: "Fehlende Datenquellen werden als nicht verbunden dargestellt und nicht als Null-Ergebnis interpretiert.",
    scorecards: "Kampagnen-Scorecards",
    scorecardsIntro: "Jede Scorecard zeigt Zielmarkt, Reichweitenraum, Hauptkennzahl und Datenlage.",
    segment: "Zielmarkt",
    reach: "Reichweite",
    primaryKpi: "Hauptkennzahl",
    result: "Ergebnis",
    noResult: "Noch keine verifizierten Daten",
    dataQuality: "Datenqualität",
    channels: "Kanäle",
    openCampaign: "Kampagne in der Steuerung öffnen",
    platformTitle: "Plattform- & Reichweitenintelligenz",
    platformBody: "Ein belastbarer Vergleich nach Plattform, Zielgruppe, Region, Sprache oder organisch/bezahlt beginnt erst mit realen Veröffentlichungs- und Performance-Snapshots.",
    platformNext: "Dann werden Reichweite, Shares, Saves, Klicks, Produktaktionen, E-Mail-Öffnungen, Downloads, Werbekosten und Conversions getrennt verglichen.",
    back: "Zur Marketing-Steuerung",
    notConnected: "Nicht verbunden",
    latest: "Letzte Erfassung",
  },
  en: {
    eyebrow: "Admin · Marketing · Performance",
    title: "Campaign results",
    intro: "Compare internal usage, external platforms, email, downloads and advertising. Metrics appear only with source, reporting period and data quality.",
    all: "All campaigns",
    withData: "Campaigns with data",
    connected: "Connected source types",
    snapshots: "Metric snapshots",
    published: "Published content",
    sources: "Data sources",
    sourcesIntro: "Missing data sources are shown as not connected and are not interpreted as zero results.",
    scorecards: "Campaign scorecards",
    scorecardsIntro: "Each scorecard shows market segment, reach scope, primary KPI and data quality.",
    segment: "Market segment",
    reach: "Reach",
    primaryKpi: "Primary KPI",
    result: "Result",
    noResult: "No verified data yet",
    dataQuality: "Data quality",
    channels: "Channels",
    openCampaign: "Open campaign control",
    platformTitle: "Platform & reach intelligence",
    platformBody: "A reliable comparison by platform, audience, region, language or organic/paid starts only with real publication and performance snapshots.",
    platformNext: "Qualified reach, shares, saves, clicks, product actions, email opens, downloads, advertising costs and conversions will then be compared separately.",
    back: "Back to marketing control",
    notConnected: "Not connected",
    latest: "Latest capture",
  },
} as const;

export default async function MarketingInsightsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const locale: UiLocale = first(params?.lang) === "en" ? "en" : "de";
  const copy = COPY[locale];
  const selectedCampaignId = first(params?.campaign);
  const model = buildMarketingCampaignControlReadModel();
  const campaigns = selectedCampaignId
    ? model.campaigns.filter((row) => row.campaign.id === selectedCampaignId)
    : model.campaigns;
  const snapshotCount = campaigns.reduce((sum, row) => sum + row.metricSnapshots.length, 0);
  const assistant = buildMarketingAssistantReadModel(model, {
    campaignId: campaigns.length === 1 ? campaigns[0].campaign.id : null,
    surface: "insights",
  });

  return (
    <main className="space-y-8 pb-12" data-testid="admin-marketing-insights">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">{copy.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold text-[rgb(var(--fg))] sm:text-4xl">{copy.title}</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-[rgb(var(--muted))] sm:text-base">{copy.intro}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/admin/marketing/insights?lang=${locale}`} className="rounded-full border border-[rgb(var(--border))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-300">{copy.all}</Link>
          {selectedCampaignId && <span className="rounded-full border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 dark:bg-sky-400/10 dark:text-sky-200">{campaigns[0]?.campaign.title ?? selectedCampaignId}</span>}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Performance summary">
        <Metric label={copy.withData} value={campaigns.filter((row) => row.hasPerformanceData).length} />
        <Metric label={copy.connected} value={model.summary.connectedSourceKinds} />
        <Metric label={copy.snapshots} value={snapshotCount} />
        <Metric label={copy.published} value={campaigns.reduce((sum, row) => sum + row.publishedContentCount, 0)} />
      </section>

      <MarketingAssistantPanel model={assistant} locale={locale} id="insights-assistant" />

      <section className="space-y-5" aria-labelledby="sources-heading">
        <div>
          <Heading id="sources-heading" title={copy.sources} />
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[rgb(var(--muted))]">{copy.sourcesIntro}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {model.sourceStates.map((source) => (
            <article key={source.sourceKind} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-[rgb(var(--fg))]">{sourceLabel(source.sourceKind, locale)}</h3>
                <Badge label={qualityLabel(source.quality, locale)} />
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
          <Heading id="scorecards-heading" title={copy.scorecards} />
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[rgb(var(--muted))]">{copy.scorecardsIntro}</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {campaigns.map((row) => (
            <article key={row.campaign.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700 dark:text-sky-300">{row.profile.primarySegment.toUpperCase()}</p>
                  <h3 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{row.campaign.title}</h3>
                </div>
                <Badge label={qualityLabel(row.dataQuality, locale)} />
              </div>
              <dl className="mt-4 grid gap-3 rounded-2xl bg-[rgb(var(--bg))] p-4 text-sm sm:grid-cols-2">
                <Definition label={copy.segment} value={row.profile.segments.map((value) => value.toUpperCase()).join(", ")} />
                <Definition label={copy.reach} value={row.profile.reachScopes.map((value) => reachLabel(value, locale)).join(", ")} />
                <Definition label={copy.primaryKpi} value={metricLabel(row.profile.primaryKpi, locale)} />
                <Definition label={copy.result} value={row.hasPerformanceData ? formatMetric(row.metrics[row.profile.primaryKpi], row.profile.primaryKpi, locale) : copy.noResult} />
                <Definition label={copy.channels} value={row.profile.plannedChannels.map((value) => channelLabel(value, locale)).join(", ")} />
                <Definition label={copy.dataQuality} value={qualityLabel(row.dataQuality, locale)} />
              </dl>
              <Link href={`/admin/marketing?lang=${locale}&campaign=${row.campaign.id}#campaign-detail`} className="mt-4 inline-flex rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800">{copy.openCampaign}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 sm:p-6" aria-labelledby="platform-heading">
        <Heading id="platform-heading" title={copy.platformTitle} />
        <p className="mt-3 max-w-5xl text-sm leading-6 text-[rgb(var(--muted))]">{copy.platformBody}</p>
        <p className="mt-3 max-w-5xl text-sm font-medium leading-6 text-[rgb(var(--fg))]">{copy.platformNext}</p>
      </section>

      <footer className="border-t border-[rgb(var(--border))] pt-5">
        <Link href={`/admin/marketing?lang=${locale}`} className="rounded-full border border-[rgb(var(--border))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-300">{copy.back}</Link>
      </footer>
    </main>
  );
}

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function sourceLabel(value: "internal" | "social" | "email" | "download" | "ads" | "manual", locale: UiLocale) { return ({ de: { internal: "eDebatte intern", social: "Social Media organisch", email: "E-Mail & Newsletter", download: "Downloads", ads: "Bezahlte Werbung", manual: "Manuell verifiziert" }, en: { internal: "eDebatte internal", social: "Organic social media", email: "Email & newsletter", download: "Downloads", ads: "Paid advertising", manual: "Manually verified" } } as const)[locale][value]; }
function reachLabel(value: "local" | "regional" | "national" | "international", locale: UiLocale) { return ({ de: { local: "Lokal", regional: "Regional", national: "National", international: "International" }, en: { local: "Local", regional: "Regional", national: "National", international: "International" } } as const)[locale][value]; }
function channelLabel(value: string, locale: UiLocale) { const labels: Record<string, string> = { edebatte: "eDebatte", website: "Website", download: "Download", email: "E-Mail", newsletter: "Newsletter", instagram: "Instagram", instagram_reels: "Instagram Reels", instagram_story: "Instagram Story", linkedin: "LinkedIn", facebook: "Facebook", facebook_story: "Facebook Story", tiktok: "TikTok", youtube_shorts: "YouTube Shorts", youtube: "YouTube", press: locale === "de" ? "Presse" : "Press", meta_ads: "Meta Ads", linkedin_ads: "LinkedIn Ads", google_ads: "Google Ads" }; return labels[value] ?? value.replaceAll("_", " "); }
function metricLabel(value: MarketingMetricKey, locale: UiLocale) { const labels: Record<UiLocale, Partial<Record<MarketingMetricKey, string>>> = { de: { reach: "Qualifizierte Reichweite", completion_rate: "Video-Abschlussrate", shares: "Geteilte Beiträge", saves: "Gespeicherte Beiträge", link_clicks: "Link-Klicks", downloads: "Downloads", product_actions_started: "Begonnene Produktaktionen", product_actions_completed: "Abgeschlossene Produktaktionen", qualified_inquiries: "Qualifizierte Anfragen", email_opens: "E-Mail-Öffnungen", email_replies: "E-Mail-Antworten" }, en: { reach: "Qualified reach", completion_rate: "Video completion rate", shares: "Shares", saves: "Saves", link_clicks: "Link clicks", downloads: "Downloads", product_actions_started: "Product actions started", product_actions_completed: "Product actions completed", qualified_inquiries: "Qualified inquiries", email_opens: "Email opens", email_replies: "Email replies" } }; return labels[locale][value] ?? value.replaceAll("_", " "); }
function qualityLabel(value: MarketingDataQuality, locale: UiLocale) { return ({ de: { verified: "Verifiziert", partial: "Teilweise", estimated: "Geschätzt", stale: "Veraltet", missing: "Keine Daten", rejected: "Verworfen" }, en: { verified: "Verified", partial: "Partial", estimated: "Estimated", stale: "Stale", missing: "No data", rejected: "Rejected" } } as const)[locale][value]; }
function formatMetric(value: number | undefined, key: MarketingMetricKey, locale: UiLocale) { if (value === undefined) return locale === "de" ? "Keine" : "None"; const percent = key === "completion_rate" || key === "ctr"; return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", percent ? { style: "percent", maximumFractionDigits: 1 } : { maximumFractionDigits: 1 }).format(value); }
function formatDate(value: string, locale: UiLocale) { return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function Metric({ label, value }: { label: string; value: number }) { return <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"><p className="text-sm font-semibold text-[rgb(var(--fg))]">{label}</p><strong className="mt-3 block text-3xl text-[rgb(var(--fg))]">{value}</strong></article>; }
function Badge({ label }: { label: string }) { return <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))]">{label}</span>; }
function Definition({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{label}</dt><dd className="mt-1 break-words font-medium leading-6 text-[rgb(var(--fg))]">{value}</dd></div>; }
function Heading({ id, title }: { id: string; title: string }) { return <h2 id={id} className="text-xl font-bold text-[rgb(var(--fg))] sm:text-2xl">{title}</h2>; }
