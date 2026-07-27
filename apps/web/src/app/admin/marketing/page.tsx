import Link from "next/link";
import { buildMarketingRegistryReadModel } from "@/features/marketing/registry/readModel";
import type {
  MarketingAsset,
  MarketingCampaign,
  MarketingDistributionRecord,
} from "@/features/marketing/registry/contracts";

export const metadata = {
  title: "Marketing · Admin · eDebatte",
};

type UiLocale = "de" | "en";
type ContentView = "all" | "review" | "draft" | "scheduled" | "published";

type PageProps = {
  searchParams?: Promise<{
    lang?: string | string[];
    view?: string | string[];
    asset?: string | string[];
  }>;
};

type ContentRow = {
  asset: MarketingAsset;
  campaign: MarketingCampaign | null;
  records: MarketingDistributionRecord[];
};

const CONTENT_ASSET_TYPES = new Set<MarketingAsset["assetType"]>([
  "carousel",
  "social_image",
  "story",
  "reel_cover",
  "video_script",
  "video_master",
  "video_variant",
  "press_copy",
  "newsletter",
]);

const COPY = {
  de: {
    eyebrow: "Admin · Marketing",
    title: "Marketing-Zentrale",
    intro:
      "Hier steuerst du konkrete Beiträge, Videos und Veröffentlichungen – nicht Produktentwicklung oder interne Programmieraufgaben.",
    guardrail: "Veröffentlichungen bleiben immer freigabepflichtig.",
    overview: "Übersicht",
    content: "Beiträge & Videos",
    published: "Veröffentlicht",
    materials: "Weitere Materialien",
    review: "Zur Freigabe",
    reviewNote: "Inhalte, die fachlich und visuell geprüft werden müssen",
    draft: "In Arbeit",
    draftNote: "Beiträge und Videos, die noch fertiggestellt werden",
    scheduled: "Eingeplant",
    scheduledNote: "Beiträge mit realem Kanal und Veröffentlichungstermin",
    publishedNote: "Tatsächlich veröffentlichte Beiträge mit öffentlichem Link",
    contentTitle: "Nächste Beiträge & Videos",
    contentIntro:
      "Das sind die derzeit im Repository vorhandenen Social-Inhalte. Es werden keine Entwicklungsoptionen oder erfundenen Veröffentlichungen angezeigt.",
    all: "Alle",
    format: "Format",
    channels: "Kanäle",
    status: "Status",
    schedule: "Termin",
    notScheduled: "Noch nicht terminiert",
    campaign: "Serie / Kampagne",
    cta: "Zielaktion",
    contentPreview: "Inhaltsvorschau",
    nextStep: "Nächster Schritt",
    open: "Beitrag öffnen",
    handoff: "Zur Inhaltsprüfung",
    noContentTitle: "Für diesen Filter gibt es noch keine Beiträge",
    noContentBody:
      "Sobald ein realer Post, ein Video oder eine Kanalvariante angelegt ist, erscheint sie hier.",
    selected: "Beitragsdetails",
    publicTarget: "Zielseite öffnen",
    publicationsTitle: "Veröffentlichungen",
    publicationsIntro:
      "Hier stehen nur Beiträge, die über einen realen Kanal ausgespielt und mit einem öffentlichen Link belegt wurden.",
    noPublishedTitle: "Noch nichts veröffentlicht",
    noPublishedBody:
      "Aktuell existiert noch kein belegter veröffentlichter Beitrag. Entwürfe und freigegebene Inhalte werden deshalb nicht als veröffentlicht gezählt.",
    channel: "Kanal",
    publishedAt: "Veröffentlicht am",
    openPublished: "Beitrag ansehen",
    materialsTitle: "Weitere Marketingmaterialien",
    materialsIntro:
      "Onepager, Präsentationen, Partner- und Landingpage-Texte bleiben sichtbar, aber getrennt von Posts und Videos.",
    materialType: "Material",
    materialStatus: "Bearbeitungsstand",
    backAdmin: "Admin-Übersicht",
    toCampaigns: "Beteiligungskampagnen",
    german: "Deutsch",
    english: "English",
  },
  en: {
    eyebrow: "Admin · Marketing",
    title: "Marketing centre",
    intro:
      "Manage concrete posts, videos and publications here – not product development or programming tasks.",
    guardrail: "Publishing always requires explicit approval.",
    overview: "Overview",
    content: "Posts & videos",
    published: "Published",
    materials: "Other materials",
    review: "Ready for review",
    reviewNote: "Content requiring professional and visual review",
    draft: "In progress",
    draftNote: "Posts and videos that still need to be completed",
    scheduled: "Scheduled",
    scheduledNote: "Content with a real channel and publishing date",
    publishedNote: "Actually published content with a public link",
    contentTitle: "Next posts & videos",
    contentIntro:
      "These are the social assets currently present in the repository. Development options and invented publications are not shown.",
    all: "All",
    format: "Format",
    channels: "Channels",
    status: "Status",
    schedule: "Schedule",
    notScheduled: "Not scheduled yet",
    campaign: "Series / campaign",
    cta: "Target action",
    contentPreview: "Content preview",
    nextStep: "Next step",
    open: "Open content",
    handoff: "Open content review",
    noContentTitle: "No content for this filter",
    noContentBody:
      "A real post, video or channel variant will appear here once it has been created.",
    selected: "Content details",
    publicTarget: "Open target page",
    publicationsTitle: "Publications",
    publicationsIntro:
      "Only content distributed through a real channel and backed by a public link appears here.",
    noPublishedTitle: "Nothing published yet",
    noPublishedBody:
      "There is currently no verified published content. Draft and approved assets are therefore not counted as published.",
    channel: "Channel",
    publishedAt: "Published at",
    openPublished: "Open post",
    materialsTitle: "Other marketing materials",
    materialsIntro:
      "Onepagers, presentations, partner kits and landing copy remain visible, but separate from posts and videos.",
    materialType: "Material",
    materialStatus: "Status",
    backAdmin: "Admin overview",
    toCampaigns: "Participation campaigns",
    german: "Deutsch",
    english: "English",
  },
} as const;

export default async function MarketingAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const locale = normalizeLocale(params?.lang);
  const copy = COPY[locale];
  const view = normalizeView(params?.view);
  const selectedAssetId = first(params?.asset);
  const readModel = buildMarketingRegistryReadModel();
  const dateLocale = locale === "en" ? "en-GB" : "de-DE";

  const contentRows = readModel.assets
    .filter((asset) => CONTENT_ASSET_TYPES.has(asset.assetType))
    .map((asset): ContentRow => ({
      asset,
      campaign: readModel.campaigns.find((campaign) => campaign.id === asset.campaignId) ?? null,
      records: readModel.distributionRecords.filter((record) => record.assetId === asset.id),
    }));

  const materialAssets = readModel.assets.filter(
    (asset) => !CONTENT_ASSET_TYPES.has(asset.assetType),
  );
  const reviewCount = contentRows.filter((row) => row.asset.status === "review_ready").length;
  const draftCount = contentRows.filter((row) => row.asset.status === "draft").length;
  const scheduledCount = contentRows.filter((row) => hasScheduledRecord(row.records)).length;
  const publishedCount = contentRows.filter((row) => hasPublishedRecord(row.records)).length;
  const filteredRows = contentRows.filter((row) => contentMatchesView(row, view));
  const selectedRow = contentRows.find((row) => row.asset.id === selectedAssetId) ?? null;
  const publishedRecords = readModel.distributionRecords.filter(
    (record) => record.status === "published",
  );

  return (
    <main className="space-y-8 pb-12" data-testid="admin-marketing-content-board">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-4xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
              {copy.eyebrow}
            </p>
            <h1 className="text-3xl font-bold text-[rgb(var(--fg))] sm:text-4xl">{copy.title}</h1>
            <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))] sm:text-base">
              {copy.intro}
            </p>
            <p className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 dark:border-emerald-300/40 dark:bg-emerald-400/10 dark:text-emerald-100">
              {copy.guardrail}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <Link href={hrefFor("de", view)} className={languageLinkClass(locale === "de")}>
              {copy.german}
            </Link>
            <Link href={hrefFor("en", view)} className={languageLinkClass(locale === "en")}>
              {copy.english}
            </Link>
          </div>
        </div>
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Marketing navigation">
          <AnchorLink href="#overview" label={copy.overview} />
          <AnchorLink href="#content" label={copy.content} />
          <AnchorLink href="#published" label={copy.published} />
          <AnchorLink href="#materials" label={copy.materials} />
        </nav>
      </header>

      <section id="overview" className="scroll-mt-6 space-y-5" aria-labelledby="overview-heading">
        <SectionHeading id="overview-heading" title={copy.overview} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricLink
            href={`${hrefFor(locale, "review")}#content`}
            label={copy.review}
            value={reviewCount}
            note={copy.reviewNote}
            active={view === "review"}
            tone="sky"
          />
          <MetricLink
            href={`${hrefFor(locale, "draft")}#content`}
            label={copy.draft}
            value={draftCount}
            note={copy.draftNote}
            active={view === "draft"}
            tone="amber"
          />
          <MetricLink
            href={`${hrefFor(locale, "scheduled")}#content`}
            label={copy.scheduled}
            value={scheduledCount}
            note={copy.scheduledNote}
            active={view === "scheduled"}
            tone="violet"
          />
          <MetricLink
            href={`${hrefFor(locale, "published")}#published`}
            label={copy.published}
            value={publishedCount}
            note={copy.publishedNote}
            active={view === "published"}
            tone="emerald"
          />
        </div>
      </section>

      <section id="content" className="scroll-mt-6 space-y-5" aria-labelledby="content-heading">
        <div>
          <SectionHeading id="content-heading" title={copy.contentTitle} />
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[rgb(var(--muted))]">
            {copy.contentIntro}
          </p>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Content filters">
          <FilterLink locale={locale} value="all" current={view} label={copy.all} count={contentRows.length} />
          <FilterLink locale={locale} value="review" current={view} label={copy.review} count={reviewCount} />
          <FilterLink locale={locale} value="draft" current={view} label={copy.draft} count={draftCount} />
          <FilterLink locale={locale} value="scheduled" current={view} label={copy.scheduled} count={scheduledCount} />
          <FilterLink locale={locale} value="published" current={view} label={copy.published} count={publishedCount} />
        </div>

        {filteredRows.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredRows.map((row) => (
              <ContentCard key={row.asset.id} row={row} locale={locale} copy={copy} view={view} />
            ))}
          </div>
        ) : (
          <EmptyState title={copy.noContentTitle} body={copy.noContentBody} />
        )}
      </section>

      {selectedRow && (
        <section
          id="content-detail"
          className="scroll-mt-6 space-y-5 rounded-3xl border-2 border-sky-300 bg-sky-50/70 p-5 dark:border-sky-400/40 dark:bg-sky-400/10"
          aria-labelledby="content-detail-heading"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">
                {copy.selected}
              </p>
              <h2 id="content-detail-heading" className="mt-1 text-2xl font-bold text-[rgb(var(--fg))]">
                {selectedRow.asset.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
                {selectedRow.campaign?.description ?? selectedRow.asset.title}
              </p>
            </div>
            <StatusBadge label={contentStatusLabel(selectedRow, locale)} tone={contentTone(selectedRow)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DetailPanel title={copy.format} body={formatLabel(selectedRow.asset.assetType, locale)} />
            <DetailPanel title={copy.channels} body={channelsForAsset(selectedRow.asset, locale).join(", ")} />
            <DetailPanel title={copy.schedule} body={scheduleLabel(selectedRow.records, locale, dateLocale)} />
            <DetailPanel title={copy.cta} body={selectedRow.campaign?.primaryCta.label ?? "—"} />
          </div>

          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--muted))]">
              {copy.nextStep}
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-[rgb(var(--fg))]">
              {nextStepForContent(selectedRow, locale)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionLink href="/admin/editorial/queue" label={copy.handoff} />
            {selectedRow.campaign?.primaryCta.url && (
              <a
                href={selectedRow.campaign.primaryCta.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-xl border border-sky-300 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50 dark:text-sky-200"
              >
                {copy.publicTarget}
              </a>
            )}
          </div>
        </section>
      )}

      <section id="published" className="scroll-mt-6 space-y-4" aria-labelledby="published-heading">
        <div>
          <SectionHeading id="published-heading" title={copy.publicationsTitle} />
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[rgb(var(--muted))]">
            {copy.publicationsIntro}
          </p>
        </div>
        {publishedRecords.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {publishedRecords.map((record) => {
              const asset = readModel.assets.find((item) => item.id === record.assetId);
              const campaign = readModel.campaigns.find((item) => item.id === record.campaignId);
              return (
                <article key={record.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
                  <h3 className="font-semibold text-[rgb(var(--fg))]">{asset?.title ?? campaign?.title ?? record.assetId}</h3>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <Definition label={copy.channel} value={humanize(record.channel)} />
                    <Definition
                      label={copy.publishedAt}
                      value={record.publishedAt ? formatDate(record.publishedAt, dateLocale) : "—"}
                    />
                  </dl>
                  {record.publicUrl && (
                    <a
                      href={record.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex rounded-xl border border-sky-300 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50 dark:text-sky-200"
                    >
                      {copy.openPublished}
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState title={copy.noPublishedTitle} body={copy.noPublishedBody} />
        )}
      </section>

      <section id="materials" className="scroll-mt-6 space-y-4" aria-labelledby="materials-heading">
        <div>
          <SectionHeading id="materials-heading" title={copy.materialsTitle} />
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[rgb(var(--muted))]">
            {copy.materialsIntro}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {materialAssets.map((asset) => (
            <article key={asset.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
              <h3 className="font-semibold text-[rgb(var(--fg))]">{asset.title}</h3>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <Definition label={copy.materialType} value={formatLabel(asset.assetType, locale)} />
                <Definition label={copy.materialStatus} value={assetStatusLabel(asset.status, locale)} />
              </dl>
            </article>
          ))}
        </div>
      </section>

      <footer className="flex flex-wrap gap-2 border-t border-[rgb(var(--border))] pt-5">
        <AdminLink href="/admin" label={copy.backAdmin} />
        <AdminLink href="/admin/campaigns" label={copy.toCampaigns} />
      </footer>
    </main>
  );
}

function ContentCard({
  row,
  locale,
  copy,
  view,
}: {
  row: ContentRow;
  locale: UiLocale;
  copy: (typeof COPY)[UiLocale];
  view: ContentView;
}) {
  return (
    <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700 dark:text-sky-300">
            {formatLabel(row.asset.assetType, locale)}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{row.asset.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            {row.campaign?.description ?? row.asset.title}
          </p>
        </div>
        <StatusBadge label={contentStatusLabel(row, locale)} tone={contentTone(row)} />
      </div>

      <dl className="mt-4 grid gap-3 rounded-2xl bg-[rgb(var(--bg))] p-4 text-sm sm:grid-cols-2">
        <Definition label={copy.channels} value={channelsForAsset(row.asset, locale).join(", ")} />
        <Definition label={copy.schedule} value={scheduleLabel(row.records, locale, locale === "en" ? "en-GB" : "de-DE")} />
        <Definition label={copy.campaign} value={row.campaign?.title ?? "—"} />
        <Definition label={copy.cta} value={row.campaign?.primaryCta.label ?? "—"} />
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`${hrefFor(locale, view, row.asset.id)}#content-detail`}
          className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-400"
        >
          {copy.open}
        </Link>
        <ActionLink href="/admin/editorial/queue" label={copy.handoff} />
      </div>
    </article>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeLocale(value: string | string[] | undefined): UiLocale {
  return first(value)?.toLowerCase().startsWith("en") ? "en" : "de";
}

function normalizeView(value: string | string[] | undefined): ContentView {
  const candidate = first(value);
  return ["all", "review", "draft", "scheduled", "published"].includes(candidate ?? "")
    ? (candidate as ContentView)
    : "all";
}

function hrefFor(locale: UiLocale, view: ContentView, assetId?: string) {
  const params = new URLSearchParams({ lang: locale, view });
  if (assetId) params.set("asset", assetId);
  return `/admin/marketing?${params.toString()}`;
}

function contentMatchesView(row: ContentRow, view: ContentView) {
  switch (view) {
    case "review":
      return row.asset.status === "review_ready";
    case "draft":
      return row.asset.status === "draft";
    case "scheduled":
      return hasScheduledRecord(row.records);
    case "published":
      return hasPublishedRecord(row.records);
    case "all":
    default:
      return true;
  }
}

function hasScheduledRecord(records: MarketingDistributionRecord[]) {
  return records.some((record) => record.status === "planned" || record.status === "scheduled");
}

function hasPublishedRecord(records: MarketingDistributionRecord[]) {
  return records.some((record) => record.status === "published");
}

function contentStatusLabel(row: ContentRow, locale: UiLocale) {
  if (hasPublishedRecord(row.records)) return locale === "de" ? "Veröffentlicht" : "Published";
  if (hasScheduledRecord(row.records)) return locale === "de" ? "Eingeplant" : "Scheduled";
  return assetStatusLabel(row.asset.status, locale);
}

function contentTone(row: ContentRow): Tone {
  if (hasPublishedRecord(row.records)) return "emerald";
  if (hasScheduledRecord(row.records)) return "violet";
  if (row.asset.status === "review_ready" || row.asset.status === "approved") return "sky";
  if (row.asset.status === "draft") return "amber";
  return "slate";
}

function channelsForAsset(asset: MarketingAsset, locale: UiLocale) {
  const channels: Record<MarketingAsset["assetType"], string[]> = {
    carousel: ["Instagram", "LinkedIn", "Facebook"],
    social_image: ["Instagram", "Facebook", "LinkedIn"],
    story: ["Instagram Story", "Facebook Story"],
    reel_cover: ["Instagram Reels", "TikTok", "YouTube Shorts"],
    video_script: ["TikTok", "Instagram Reels", "YouTube Shorts"],
    video_master: ["TikTok", "Instagram Reels", "YouTube Shorts"],
    video_variant: ["TikTok", "Instagram Reels", "YouTube Shorts"],
    press_copy: ["LinkedIn", locale === "de" ? "Presse" : "Press"],
    newsletter: ["Newsletter"],
    onepager: [locale === "de" ? "Direktversand" : "Direct outreach"],
    pitchdeck: [locale === "de" ? "Präsentation" : "Presentation"],
    landing_copy: ["Website"],
    partner_kit: [locale === "de" ? "Partneransprache" : "Partner outreach"],
    report: [locale === "de" ? "Bericht" : "Report"],
    other: [locale === "de" ? "Noch offen" : "To be decided"],
  };
  return channels[asset.assetType];
}

function scheduleLabel(records: MarketingDistributionRecord[], locale: UiLocale, dateLocale: string) {
  const published = records.find((record) => record.status === "published" && record.publishedAt);
  if (published?.publishedAt) return formatDate(published.publishedAt, dateLocale);
  const scheduled = records.find((record) => record.status === "scheduled" || record.status === "planned");
  if (scheduled) return locale === "de" ? "Eingeplant, Termin noch offen" : "Scheduled, date still open";
  return locale === "de" ? "Noch nicht terminiert" : "Not scheduled yet";
}

function nextStepForContent(row: ContentRow, locale: UiLocale) {
  if (hasPublishedRecord(row.records)) {
    return locale === "de"
      ? "Reale Ergebnisse und Rückmeldungen prüfen und das Learning dokumentieren."
      : "Review real results and feedback and document the learning.";
  }
  if (hasScheduledRecord(row.records)) {
    return locale === "de"
      ? "Finale Kanalvariante und Veröffentlichungszeit kontrollieren."
      : "Check the final channel variant and publishing time.";
  }
  if (row.asset.status === "review_ready") {
    return locale === "de"
      ? "Text, Visual, Quellenbezug und CTA prüfen und danach freigeben."
      : "Review copy, visual, source reference and CTA, then approve.";
  }
  if (row.asset.status === "approved") {
    return locale === "de"
      ? "Kanal und Veröffentlichungstermin festlegen."
      : "Set channel and publishing date.";
  }
  return locale === "de"
    ? "Text, Visual und Kanalvarianten fertigstellen und zur Prüfung vorlegen."
    : "Complete copy, visual and channel variants and submit for review.";
}

function formatLabel(type: MarketingAsset["assetType"], locale: UiLocale) {
  const labels: Record<UiLocale, Record<MarketingAsset["assetType"], string>> = {
    de: {
      onepager: "Onepager",
      pitchdeck: "Präsentation",
      landing_copy: "Landingpage-Text",
      carousel: "Carousel-Post",
      social_image: "Social-Post",
      story: "Story",
      reel_cover: "Reel-Cover",
      video_script: "Kurzvideo / Script",
      video_master: "Video",
      video_variant: "Video-Variante",
      press_copy: "Pressebeitrag",
      partner_kit: "Partner-Kit",
      newsletter: "Newsletter",
      report: "Bericht",
      other: "Sonstiges Material",
    },
    en: {
      onepager: "Onepager",
      pitchdeck: "Presentation",
      landing_copy: "Landing page copy",
      carousel: "Carousel post",
      social_image: "Social post",
      story: "Story",
      reel_cover: "Reel cover",
      video_script: "Short video / script",
      video_master: "Video",
      video_variant: "Video variant",
      press_copy: "Press post",
      partner_kit: "Partner kit",
      newsletter: "Newsletter",
      report: "Report",
      other: "Other material",
    },
  };
  return labels[locale][type];
}

function assetStatusLabel(status: MarketingAsset["status"], locale: UiLocale) {
  const labels: Record<UiLocale, Record<MarketingAsset["status"], string>> = {
    de: {
      draft: "Entwurf",
      review_ready: "Zur Freigabe",
      approved: "Freigegeben",
      published: "Veröffentlicht",
      retired: "Archiviert",
    },
    en: {
      draft: "Draft",
      review_ready: "Ready for review",
      approved: "Approved",
      published: "Published",
      retired: "Archived",
    },
  };
  return labels[locale][status];
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function languageLinkClass(active: boolean) {
  return `rounded-full border px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
    active
      ? "border-sky-400 bg-sky-100 text-sky-950 dark:bg-sky-400/20 dark:text-sky-50"
      : "border-[rgb(var(--border))] text-[rgb(var(--fg))] hover:border-sky-400"
  }`;
}

type Tone = "emerald" | "amber" | "sky" | "violet" | "slate";

function toneClass(tone: Tone) {
  const tones: Record<Tone, string> = {
    emerald:
      "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-300/40 dark:bg-emerald-400/10 dark:text-emerald-100",
    amber:
      "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-300/40 dark:bg-amber-400/10 dark:text-amber-100",
    sky:
      "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-300/40 dark:bg-sky-400/10 dark:text-sky-100",
    violet:
      "border-violet-300 bg-violet-50 text-violet-950 dark:border-violet-300/40 dark:bg-violet-400/10 dark:text-violet-100",
    slate:
      "border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-500 dark:bg-slate-700/30 dark:text-slate-100",
  };
  return tones[tone];
}

function SectionHeading({ id, title }: { id: string; title: string }) {
  return <h2 id={id} className="text-xl font-bold text-[rgb(var(--fg))] sm:text-2xl">{title}</h2>;
}

function AnchorLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] hover:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
    >
      {label}
    </Link>
  );
}

function MetricLink({
  href,
  label,
  value,
  note,
  active,
  tone,
}: {
  href: string;
  label: string;
  value: number;
  note: string;
  active: boolean;
  tone: Tone;
}) {
  return (
    <Link
      href={href}
      className={`rounded-3xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
        active
          ? toneClass(tone)
          : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
      }`}
    >
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-3 text-4xl font-bold">{value}</p>
      <p className={`mt-2 text-xs leading-5 ${active ? "opacity-80" : "text-[rgb(var(--muted))]"}`}>
        {note}
      </p>
    </Link>
  );
}

function FilterLink({
  locale,
  value,
  current,
  label,
  count,
}: {
  locale: UiLocale;
  value: ContentView;
  current: ContentView;
  label: string;
  count: number;
}) {
  const active = value === current;
  return (
    <Link
      href={`${hrefFor(locale, value)}#content`}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-3 py-2 text-sm font-semibold ${
        active
          ? "border-sky-500 bg-sky-100 text-sky-950 dark:bg-sky-400/20 dark:text-sky-50"
          : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] hover:border-sky-400"
      }`}
    >
      {label} <span className="ml-1 opacity-70">{count}</span>
    </Link>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
    >
      {label}
    </Link>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass(tone)}`}>{label}</span>;
}

function Definition({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--muted))]">{label}</dt>
      <dd className="mt-1 break-words font-medium leading-6 text-[rgb(var(--fg))]">{value}</dd>
    </div>
  );
}

function DetailPanel({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--muted))]">{title}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-[rgb(var(--fg))]">{body}</p>
    </article>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-center">
      <h3 className="font-semibold text-[rgb(var(--fg))]">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">{body}</p>
    </div>
  );
}

function AdminLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
    >
      {label}
    </Link>
  );
}
