import Link from "next/link";
import { buildMarketingContentOperationsReadModel } from "@/features/marketing/contentOperations/readModel";
import type {
  MarketingContentChannel,
  MarketingContentKind,
  MarketingContentStatus,
} from "@/features/marketing/contentOperations/contracts";
import type { MarketingContentOperationsRow } from "@/features/marketing/contentOperations/readModel";
import { buildMarketingRegistryReadModel } from "@/features/marketing/registry/readModel";
import type { MarketingAsset } from "@/features/marketing/registry/contracts";

export const metadata = {
  title: "Marketing · Admin · eDebatte",
};

type UiLocale = "de" | "en";
type ContentView = "all" | MarketingContentStatus;
type Tone = "sky" | "amber" | "emerald" | "violet" | "slate";

type PageProps = {
  searchParams?: Promise<{
    lang?: string | string[];
    view?: string | string[];
    item?: string | string[];
  }>;
};

const COPY = {
  de: {
    eyebrow: "Admin · Marketing",
    title: "Marketing-Zentrale",
    intro:
      "Hier steuerst du konkrete Posts, Videos, Freigaben und Veröffentlichungen. Jeder Inhalt zeigt Text, Kanäle, Verantwortlichkeit und den nächsten Schritt.",
    guardrail: "Veröffentlichungen bleiben immer freigabepflichtig.",
    overview: "Übersicht",
    content: "Beiträge & Videos",
    published: "Veröffentlicht",
    materials: "Weitere Materialien",
    draft: "In Arbeit",
    draftNote: "Entwürfe, die noch fertiggestellt werden",
    review: "Zur Freigabe",
    reviewNote: "Inhalte mit ausstehender fachlicher oder visueller Prüfung",
    approved: "Freigegeben",
    approvedNote: "Geprüfte Inhalte, für die noch Kanal oder Termin fehlt",
    scheduled: "Eingeplant",
    scheduledNote: "Inhalte mit bestätigtem Veröffentlichungstermin",
    publishedNote: "Tatsächlich veröffentlichte Beiträge mit öffentlichem Link",
    contentTitle: "Nächste Beiträge & Videos",
    contentIntro:
      "Die Einträge sind konkrete Content-Entwürfe. Kanäle, Texte und Zuständigkeiten stammen aus dem Content-Operations-Readmodel und werden nicht aus technischen Asset-Typen geraten.",
    all: "Alle",
    format: "Format",
    channels: "Kanäle",
    status: "Status",
    locale: "Sprache",
    schedule: "Termin",
    notScheduled: "Noch nicht terminiert",
    campaign: "Serie / Kampagne",
    responsibility: "Verantwortlich",
    cta: "Zielaktion",
    caption: "Caption-Entwurf",
    script: "Script-Entwurf",
    nextStep: "Nächster Schritt",
    open: "Beitrag öffnen",
    noContentTitle: "Für diesen Filter gibt es noch keine Beiträge",
    noContentBody:
      "Sobald ein realer Post, ein Video oder eine Kanalvariante diesen Status erreicht, erscheint sie hier.",
    selected: "Beitragsdetails",
    reviewState: "Freigabestand",
    publicTarget: "Zielseite öffnen",
    publicationsTitle: "Veröffentlichungen",
    publicationsIntro:
      "Hier stehen nur Beiträge, die über einen realen Kanal ausgespielt und mit öffentlichem Link sowie Veröffentlichungszeit belegt wurden.",
    noPublishedTitle: "Noch nichts veröffentlicht",
    noPublishedBody:
      "Aktuell existiert noch kein belegter veröffentlichter Beitrag. Entwürfe, Freigaben und eingeplante Inhalte werden nicht als veröffentlicht gezählt.",
    channel: "Kanal",
    publishedAt: "Veröffentlicht am",
    openPublished: "Beitrag ansehen",
    materialsTitle: "Weitere Marketingmaterialien",
    materialsIntro:
      "Onepager, Präsentationen, Partner- und Landingpage-Texte bleiben getrennt von der operativen Post- und Videoplanung.",
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
      "Manage concrete posts, videos, approvals and publications here. Every item shows copy, channels, ownership and its next action.",
    guardrail: "Publishing always requires explicit approval.",
    overview: "Overview",
    content: "Posts & videos",
    published: "Published",
    materials: "Other materials",
    draft: "In progress",
    draftNote: "Drafts that still need to be completed",
    review: "Ready for review",
    reviewNote: "Content awaiting professional or visual review",
    approved: "Approved",
    approvedNote: "Reviewed content still missing channel or schedule",
    scheduled: "Scheduled",
    scheduledNote: "Content with a confirmed publishing time",
    publishedNote: "Actually published content with a public link",
    contentTitle: "Next posts & videos",
    contentIntro:
      "These are concrete content drafts. Channels, copy and ownership come from the content operations readmodel and are not guessed from technical asset types.",
    all: "All",
    format: "Format",
    channels: "Channels",
    status: "Status",
    locale: "Language",
    schedule: "Schedule",
    notScheduled: "Not scheduled yet",
    campaign: "Series / campaign",
    responsibility: "Owner",
    cta: "Target action",
    caption: "Caption draft",
    script: "Script draft",
    nextStep: "Next step",
    open: "Open content",
    noContentTitle: "No content for this filter",
    noContentBody:
      "A real post, video or channel variant will appear here once it reaches this status.",
    selected: "Content details",
    reviewState: "Approval state",
    publicTarget: "Open target page",
    publicationsTitle: "Publications",
    publicationsIntro:
      "Only content distributed through a real channel and backed by a public link and publishing time appears here.",
    noPublishedTitle: "Nothing published yet",
    noPublishedBody:
      "There is currently no verified published content. Drafts, approvals and scheduled items are not counted as published.",
    channel: "Channel",
    publishedAt: "Published at",
    openPublished: "Open post",
    materialsTitle: "Other marketing materials",
    materialsIntro:
      "Onepagers, presentations, partner kits and landing copy remain separate from operational post and video planning.",
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
  const selectedItemId = first(params?.item);
  const contentModel = buildMarketingContentOperationsReadModel();
  const registryModel = buildMarketingRegistryReadModel();
  const dateLocale = locale === "en" ? "en-GB" : "de-DE";

  const filteredItems = contentModel.items.filter((item) => contentMatchesView(item, view));
  const selectedItem = contentModel.items.find((item) => item.content.id === selectedItemId) ?? null;
  const usedAssetIds = new Set(contentModel.items.map((item) => item.asset.id));
  const materialAssets = registryModel.assets.filter((asset) => !usedAssetIds.has(asset.id));

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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricLink href={`${hrefFor(locale, "draft")}#content`} label={copy.draft} value={contentModel.summary.draft} note={copy.draftNote} active={view === "draft"} tone="amber" />
          <MetricLink href={`${hrefFor(locale, "review_ready")}#content`} label={copy.review} value={contentModel.summary.reviewReady} note={copy.reviewNote} active={view === "review_ready"} tone="sky" />
          <MetricLink href={`${hrefFor(locale, "approved")}#content`} label={copy.approved} value={contentModel.summary.approved} note={copy.approvedNote} active={view === "approved"} tone="emerald" />
          <MetricLink href={`${hrefFor(locale, "scheduled")}#content`} label={copy.scheduled} value={contentModel.summary.scheduled} note={copy.scheduledNote} active={view === "scheduled"} tone="violet" />
          <MetricLink href={`${hrefFor(locale, "published")}#published`} label={copy.published} value={contentModel.summary.published} note={copy.publishedNote} active={view === "published"} tone="emerald" />
        </div>
      </section>

      <section id="content" className="scroll-mt-6 space-y-5" aria-labelledby="content-heading">
        <div>
          <SectionHeading id="content-heading" title={copy.contentTitle} />
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[rgb(var(--muted))]">{copy.contentIntro}</p>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Content filters">
          <FilterLink locale={locale} value="all" current={view} label={copy.all} count={contentModel.summary.total} />
          <FilterLink locale={locale} value="draft" current={view} label={copy.draft} count={contentModel.summary.draft} />
          <FilterLink locale={locale} value="review_ready" current={view} label={copy.review} count={contentModel.summary.reviewReady} />
          <FilterLink locale={locale} value="approved" current={view} label={copy.approved} count={contentModel.summary.approved} />
          <FilterLink locale={locale} value="scheduled" current={view} label={copy.scheduled} count={contentModel.summary.scheduled} />
          <FilterLink locale={locale} value="published" current={view} label={copy.published} count={contentModel.summary.published} />
        </div>

        {filteredItems.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredItems.map((item) => (
              <ContentCard key={item.content.id} item={item} locale={locale} copy={copy} view={view} />
            ))}
          </div>
        ) : (
          <EmptyState title={copy.noContentTitle} body={copy.noContentBody} />
        )}
      </section>

      {selectedItem && (
        <section id="content-detail" className="scroll-mt-6 space-y-5 rounded-3xl border-2 border-sky-300 bg-sky-50/70 p-5 dark:border-sky-400/40 dark:bg-sky-400/10" aria-labelledby="content-detail-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">{copy.selected}</p>
              <h2 id="content-detail-heading" className="mt-1 text-2xl font-bold text-[rgb(var(--fg))]">{selectedItem.content.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">{selectedItem.campaign.description}</p>
            </div>
            <StatusBadge label={statusLabel(selectedItem.effectiveStatus, locale)} tone={statusTone(selectedItem.effectiveStatus)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DetailPanel title={copy.format} body={kindLabel(selectedItem.content.kind, locale)} />
            <DetailPanel title={copy.channels} body={selectedItem.content.channels.map((channel) => channelLabel(channel, locale)).join(", ")} />
            <DetailPanel title={copy.schedule} body={scheduleLabel(selectedItem, locale, dateLocale)} />
            <DetailPanel title={copy.responsibility} body={selectedItem.content.responsibleLabel} />
          </div>

          {selectedItem.content.captionDraft && <CopyPanel title={copy.caption} body={selectedItem.content.captionDraft} />}
          {selectedItem.content.scriptDraft && <CopyPanel title={copy.script} body={selectedItem.content.scriptDraft} />}

          <div className="grid gap-4 md:grid-cols-2">
            <DetailPanel title={copy.cta} body={selectedItem.content.cta.label} />
            <DetailPanel title={copy.reviewState} body={reviewLabel(selectedItem.content.review.status, locale)} />
          </div>

          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--muted))]">{copy.nextStep}</p>
            <p className="mt-2 text-sm font-medium leading-6 text-[rgb(var(--fg))]">{nextActionLabel(selectedItem, locale)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionLink href={selectedItem.content.nextAction.href} label={nextActionLabel(selectedItem, locale)} />
            {selectedItem.content.cta.url && (
              <a href={selectedItem.content.cta.url} target="_blank" rel="noreferrer" className="inline-flex rounded-xl border border-sky-300 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50 dark:text-sky-200">
                {copy.publicTarget}
              </a>
            )}
          </div>
        </section>
      )}

      <section id="published" className="scroll-mt-6 space-y-4" aria-labelledby="published-heading">
        <div>
          <SectionHeading id="published-heading" title={copy.publicationsTitle} />
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[rgb(var(--muted))]">{copy.publicationsIntro}</p>
        </div>
        {contentModel.publications.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {contentModel.publications.map(({ content, record }) => (
              <article key={record.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
                <h3 className="font-semibold text-[rgb(var(--fg))]">{content.title}</h3>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <Definition label={copy.channel} value={channelLabel(record.channel as MarketingContentChannel, locale)} />
                  <Definition label={copy.publishedAt} value={record.publishedAt ? formatDate(record.publishedAt, dateLocale) : "—"} />
                </dl>
                {record.publicUrl && (
                  <a href={record.publicUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl border border-sky-300 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50 dark:text-sky-200">
                    {copy.openPublished}
                  </a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title={copy.noPublishedTitle} body={copy.noPublishedBody} />
        )}
      </section>

      <section id="materials" className="scroll-mt-6 space-y-4" aria-labelledby="materials-heading">
        <div>
          <SectionHeading id="materials-heading" title={copy.materialsTitle} />
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[rgb(var(--muted))]">{copy.materialsIntro}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {materialAssets.map((asset) => (
            <article key={asset.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
              <h3 className="font-semibold text-[rgb(var(--fg))]">{asset.title}</h3>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <Definition label={copy.materialType} value={assetTypeLabel(asset.assetType, locale)} />
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

function ContentCard({ item, locale, copy, view }: { item: MarketingContentOperationsRow; locale: UiLocale; copy: (typeof COPY)[UiLocale]; view: ContentView }) {
  const preview = item.content.captionDraft ?? item.content.scriptDraft ?? "—";
  return (
    <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700 dark:text-sky-300">{kindLabel(item.content.kind, locale)}</p>
          <h3 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{item.content.title}</h3>
          <p className="mt-2 line-clamp-4 text-sm leading-6 text-[rgb(var(--muted))]">{preview}</p>
        </div>
        <StatusBadge label={statusLabel(item.effectiveStatus, locale)} tone={statusTone(item.effectiveStatus)} />
      </div>
      <dl className="mt-4 grid gap-3 rounded-2xl bg-[rgb(var(--bg))] p-4 text-sm sm:grid-cols-2">
        <Definition label={copy.channels} value={item.content.channels.map((channel) => channelLabel(channel, locale)).join(", ")} />
        <Definition label={copy.schedule} value={scheduleLabel(item, locale, locale === "en" ? "en-GB" : "de-DE")} />
        <Definition label={copy.responsibility} value={item.content.responsibleLabel} />
        <Definition label={copy.campaign} value={item.campaign.title} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`${hrefFor(locale, view, item.content.id)}#content-detail`} className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-400">
          {copy.open}
        </Link>
        <ActionLink href={item.content.nextAction.href} label={nextActionLabel(item, locale)} />
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
  return ["all", "draft", "review_ready", "approved", "scheduled", "published", "paused", "archived"].includes(candidate ?? "")
    ? (candidate as ContentView)
    : "all";
}

function hrefFor(locale: UiLocale, view: ContentView, itemId?: string) {
  const params = new URLSearchParams({ lang: locale, view });
  if (itemId) params.set("item", itemId);
  return `/admin/marketing?${params.toString()}`;
}

function contentMatchesView(item: MarketingContentOperationsRow, view: ContentView) {
  return view === "all" || item.effectiveStatus === view;
}

function nextActionLabel(item: MarketingContentOperationsRow, locale: UiLocale) {
  return locale === "de" ? item.content.nextAction.labelDe : item.content.nextAction.labelEn;
}

function scheduleLabel(item: MarketingContentOperationsRow, locale: UiLocale, dateLocale: string) {
  const publication = item.distributionRecords.find((record) => record.status === "published" && record.publishedAt);
  if (publication?.publishedAt) return formatDate(publication.publishedAt, dateLocale);
  if (item.content.scheduledAt) return formatDate(item.content.scheduledAt, dateLocale);
  return locale === "de" ? "Noch nicht terminiert" : "Not scheduled yet";
}

function statusLabel(status: MarketingContentStatus, locale: UiLocale) {
  const labels: Record<UiLocale, Record<MarketingContentStatus, string>> = {
    de: { draft: "In Arbeit", review_ready: "Zur Freigabe", approved: "Freigegeben", scheduled: "Eingeplant", published: "Veröffentlicht", paused: "Pausiert", archived: "Archiviert" },
    en: { draft: "In progress", review_ready: "Ready for review", approved: "Approved", scheduled: "Scheduled", published: "Published", paused: "Paused", archived: "Archived" },
  };
  return labels[locale][status];
}

function statusTone(status: MarketingContentStatus): Tone {
  if (status === "published" || status === "approved") return "emerald";
  if (status === "scheduled") return "violet";
  if (status === "review_ready") return "sky";
  if (status === "draft") return "amber";
  return "slate";
}

function reviewLabel(status: MarketingContentOperationsRow["content"]["review"]["status"], locale: UiLocale) {
  const labels = {
    de: { pending: "Prüfung offen", changes_requested: "Änderungen angefordert", approved: "Freigegeben" },
    en: { pending: "Review pending", changes_requested: "Changes requested", approved: "Approved" },
  } as const;
  return labels[locale][status];
}

function kindLabel(kind: MarketingContentKind, locale: UiLocale) {
  const labels: Record<UiLocale, Record<MarketingContentKind, string>> = {
    de: { social_post: "Social-Post", carousel: "Carousel-Post", story: "Story", short_video: "Kurzvideo", video: "Video", press_post: "Presse-/LinkedIn-Beitrag", newsletter: "Newsletter" },
    en: { social_post: "Social post", carousel: "Carousel post", story: "Story", short_video: "Short video", video: "Video", press_post: "Press / LinkedIn post", newsletter: "Newsletter" },
  };
  return labels[locale][kind];
}

function channelLabel(channel: MarketingContentChannel, locale: UiLocale) {
  const labels: Record<MarketingContentChannel, string> = {
    instagram: "Instagram",
    instagram_reels: "Instagram Reels",
    instagram_story: "Instagram Story",
    linkedin: "LinkedIn",
    facebook: "Facebook",
    facebook_story: "Facebook Story",
    tiktok: "TikTok",
    youtube_shorts: "YouTube Shorts",
    youtube: "YouTube",
    newsletter: "Newsletter",
    press: locale === "de" ? "Presse" : "Press",
  };
  return labels[channel];
}

function assetTypeLabel(type: MarketingAsset["assetType"], locale: UiLocale) {
  const labels: Record<UiLocale, Record<MarketingAsset["assetType"], string>> = {
    de: { onepager: "Onepager", pitchdeck: "Präsentation", landing_copy: "Landingpage-Text", carousel: "Carousel", social_image: "Social-Bild", story: "Story", reel_cover: "Reel-Cover", video_script: "Video-Script", video_master: "Video-Master", video_variant: "Video-Variante", press_copy: "Pressetext", partner_kit: "Partner-Kit", newsletter: "Newsletter", report: "Bericht", other: "Sonstiges" },
    en: { onepager: "Onepager", pitchdeck: "Presentation", landing_copy: "Landing page copy", carousel: "Carousel", social_image: "Social image", story: "Story", reel_cover: "Reel cover", video_script: "Video script", video_master: "Video master", video_variant: "Video variant", press_copy: "Press copy", partner_kit: "Partner kit", newsletter: "Newsletter", report: "Report", other: "Other" },
  };
  return labels[locale][type];
}

function assetStatusLabel(status: MarketingAsset["status"], locale: UiLocale) {
  const labels = {
    de: { draft: "In Arbeit", review_ready: "Zur Freigabe", approved: "Freigegeben", published: "Veröffentlicht", retired: "Archiviert" },
    en: { draft: "In progress", review_ready: "Ready for review", approved: "Approved", published: "Published", retired: "Archived" },
  } as const;
  return labels[locale][status];
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function MetricLink({ href, label, value, note, active, tone }: { href: string; label: string; value: number; note: string; active: boolean; tone: Tone }) {
  const toneClass = { sky: "border-sky-300 bg-sky-50 dark:bg-sky-400/10", amber: "border-amber-300 bg-amber-50 dark:bg-amber-400/10", emerald: "border-emerald-300 bg-emerald-50 dark:bg-emerald-400/10", violet: "border-violet-300 bg-violet-50 dark:bg-violet-400/10", slate: "border-[rgb(var(--border))] bg-[rgb(var(--card))]" }[tone];
  return <Link href={href} className={`rounded-3xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${active ? toneClass : "border-[rgb(var(--border))] bg-[rgb(var(--card))]"}`}><span className="text-sm font-semibold text-[rgb(var(--fg))]">{label}</span><strong className="mt-3 block text-3xl text-[rgb(var(--fg))]">{value}</strong><span className="mt-2 block text-xs leading-5 text-[rgb(var(--muted))]">{note}</span></Link>;
}

function FilterLink({ locale, value, current, label, count }: { locale: UiLocale; value: ContentView; current: ContentView; label: string; count: number }) {
  return <Link href={`${hrefFor(locale, value)}#content`} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${current === value ? "border-sky-400 bg-sky-50 text-sky-800 dark:bg-sky-400/10 dark:text-sky-200" : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:border-sky-300"}`}>{label} {count}</Link>;
}

function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  const classes = { sky: "border-sky-300 bg-sky-50 text-sky-800 dark:bg-sky-400/10 dark:text-sky-200", amber: "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100", emerald: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100", violet: "border-violet-300 bg-violet-50 text-violet-900 dark:bg-violet-400/10 dark:text-violet-100", slate: "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]" }[tone];
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}

function SectionHeading({ id, title }: { id: string; title: string }) { return <h2 id={id} className="text-xl font-bold text-[rgb(var(--fg))]">{title}</h2>; }
function Definition({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{label}</dt><dd className="mt-1 font-medium text-[rgb(var(--fg))]">{value}</dd></div>; }
function DetailPanel({ title, body }: { title: string; body: string }) { return <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{title}</p><p className="mt-2 text-sm font-medium leading-6 text-[rgb(var(--fg))]">{body}</p></div>; }
function CopyPanel({ title, body }: { title: string; body: string }) { return <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{title}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[rgb(var(--fg))]">{body}</p></div>; }
function EmptyState({ title, body }: { title: string; body: string }) { return <div className="rounded-3xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6"><h3 className="font-semibold text-[rgb(var(--fg))]">{title}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">{body}</p></div>; }
function AnchorLink({ href, label }: { href: string; label: string }) { return <a href={href} className="rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] hover:border-sky-300">{label}</a>; }
function ActionLink({ href, label }: { href: string; label: string }) { return <Link href={href} className="inline-flex rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800">{label}</Link>; }
function AdminLink({ href, label }: { href: string; label: string }) { return <Link href={href} className="rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] hover:border-sky-300">{label}</Link>; }
function languageLinkClass(active: boolean) { return `rounded-full border px-3 py-1.5 ${active ? "border-sky-400 bg-sky-50 text-sky-800 dark:bg-sky-400/10 dark:text-sky-200" : "border-[rgb(var(--border))] text-[rgb(var(--muted))]"}`; }
