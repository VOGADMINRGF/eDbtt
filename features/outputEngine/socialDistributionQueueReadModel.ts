import {
  buildDossierUpdateReadModel,
  type DossierUpdateSuggestion,
} from "@features/dossier/updateReadModel";
import {
  buildFeedRadarRuntimeReadModel,
} from "@features/feeds/runtimeReadModel";
import {
  listRundenEntryItems,
  type RundenEntryItem,
} from "@features/topicRound/entrySource";
import {
  getSocialDistributionRepo,
  type SocialDistributionPost,
} from "./socialDistributionRuntime";
import type {
  SocialChannelConnection,
  SocialSchedulerEntry,
} from "./socialConnectorScheduler";
import {
  getSocialDistributionStatusMeta,
  type SocialDistributionV1Status,
} from "./socialDistributionStatusContract";

export const SOCIAL_DISTRIBUTION_QUEUE_ORIGINS = [
  "dossier_update",
  "anlassraum_update",
  "feed_radar_update",
  "dossier_masterpost",
  "qr_event_hint",
  "newsletter_block",
  "short_post",
  "manual",
] as const;

export type SocialDistributionQueueOrigin =
  (typeof SOCIAL_DISTRIBUTION_QUEUE_ORIGINS)[number];

export type SocialDistributionQueueEntry = {
  id: string;
  title: string;
  summary: string;
  origin: SocialDistributionQueueOrigin;
  originLabel: string;
  status: SocialDistributionV1Status;
  statusLabel: string;
  statusDescription: string;
  targetType: "dossier" | "anlassraum" | "topic" | "review_queue";
  targetLabel: string;
  targetHref: string;
  dossierId: string | null;
  sourceHref: string | null;
  anlassraumHref: string | null;
  swipesHref: string | null;
  channels: string[];
  reviewRequired: boolean;
  reviewHint: string;
  riskHint: string;
  nextAction: string;
  exportReady: boolean;
  schedulingReady: boolean;
  copyReady: boolean;
  payloadAvailable: boolean;
  derived: boolean;
  channelConnections: SocialChannelConnection[];
  scheduler: SocialSchedulerEntry[];
  updatedAt: string | null;
};

export type SocialDistributionQueueReadModel = {
  generatedAt: string;
  summary: {
    total: number;
    reviewOpen: number;
    queued: number;
    scheduledReady: number;
    exported: number;
    blocked: number;
  };
  guardrails: {
    noAutoPublish: true;
    noOauthConnectors: true;
    noOfficialClaim: true;
    derivedQueue: true;
  };
  items: SocialDistributionQueueEntry[];
};

function originLabel(origin: SocialDistributionQueueOrigin): string {
  switch (origin) {
    case "dossier_update":
      return "Dossier-Update";
    case "anlassraum_update":
      return "Anlassraum-Update";
    case "feed_radar_update":
      return "Feed-Radar-Update";
    case "dossier_masterpost":
      return "Dossier-Masterpost";
    case "qr_event_hint":
      return "QR-/Event-Hinweis";
    case "newsletter_block":
      return "Newsletter-Block";
    case "short_post":
      return "Kurzpost / Carousel";
    case "manual":
    default:
      return "Manueller Entwurf";
  }
}

function normalizeDate(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  return raw.length > 0 ? raw : null;
}

function buildQueueItem(input: Omit<SocialDistributionQueueEntry, "statusLabel" | "statusDescription">) {
  const meta = getSocialDistributionStatusMeta(input.status);
  return {
    ...input,
    statusLabel: meta.label,
    statusDescription: meta.description,
  } satisfies SocialDistributionQueueEntry;
}

function socialChannelsToHint(channels: string[]) {
  if (channels.includes("newsletter_draft")) return "Newsletter-Block vorbereitet oder vorgeschlagen.";
  if (channels.includes("qr_asset")) return "QR-/Print-Kontext vorbereitet oder vorgeschlagen.";
  if (
    channels.includes("linkedin_draft") ||
    channels.includes("x_draft") ||
    channels.includes("mastodon_draft") ||
    channels.includes("instagram_asset")
  ) {
    return "Kurzpost- oder Carousel-Variante vorbereitet oder vorgeschlagen.";
  }
  return "Masterpost oder Website-Ausgabe vorbereitet oder vorgeschlagen.";
}

function itemsFromPost(post: SocialDistributionPost): SocialDistributionQueueEntry[] {
  const shared = {
    dossierId: post.dossierId ?? null,
    sourceHref: post.assets.find((asset) => asset.kind === "share_reference")?.href ?? null,
    anlassraumHref: null,
    swipesHref: null,
    targetType: "dossier" as const,
    targetLabel: post.dossierId ? "Dossier-Studio" : "Review-Queue",
    targetHref: post.dossierId
      ? `/dossier/${encodeURIComponent(post.dossierId)}/studio`
      : "/atlas/social-review",
    channels: [...post.channels],
    reviewRequired: post.approval.reviewRequired,
    reviewHint:
      post.approval.note ??
      "Review-first-Verteilung ohne Auto-Publish und ohne Plattform-Connector.",
    riskHint: post.limitations[0] ?? "Keine externe Veröffentlichung im V1-Pfad.",
    nextAction: getSocialDistributionStatusMeta(post.status).nextAction,
    exportReady:
      post.status === "approved" ||
      post.status === "queued" ||
      post.status === "scheduled_ready" ||
      post.status === "exported" ||
      post.status === "copied",
    schedulingReady:
      post.status === "queued" ||
      post.status === "scheduled_ready" ||
      post.status === "exported",
    copyReady: true,
    payloadAvailable: true,
    derived: false,
    channelConnections: post.channelConnections,
    scheduler: post.scheduler,
    updatedAt: post.updatedAt,
  };

  const items: SocialDistributionQueueEntry[] = [
    buildQueueItem({
      id: `${post.id}:masterpost`,
      title: post.title,
      summary: `${post.sourceSummary} ${socialChannelsToHint(post.channels)}`.trim(),
      origin: post.sourceContextType === "dossier" ? "dossier_masterpost" : "manual",
      originLabel: originLabel(post.sourceContextType === "dossier" ? "dossier_masterpost" : "manual"),
      status: post.status,
      ...shared,
    }),
  ];

  if (post.channels.includes("newsletter_draft")) {
    items.push(
      buildQueueItem({
        id: `${post.id}:newsletter`,
        title: `${post.title} · Newsletter`,
        summary: "Newsletter-Block mit Dossier-Link und Review-Hinweis.",
        origin: "newsletter_block",
        originLabel: originLabel("newsletter_block"),
        status: post.status,
        channels: ["newsletter_draft"],
        ...shared,
      }),
    );
  }

  if (post.channels.includes("qr_asset")) {
    items.push(
      buildQueueItem({
        id: `${post.id}:qr`,
        title: `${post.title} · QR / Print`,
        summary: "QR-/Print-Ausgabe mit Beteiligungslink und sichtbarem Review-Status.",
        origin: "qr_event_hint",
        originLabel: originLabel("qr_event_hint"),
        status: post.status,
        channels: ["qr_asset"],
        ...shared,
      }),
    );
  }

  if (
    post.channels.some((channel) =>
      ["linkedin_draft", "x_draft", "mastodon_draft", "instagram_asset"].includes(channel),
    )
  ) {
    items.push(
      buildQueueItem({
        id: `${post.id}:social`,
        title: `${post.title} · Kurzpost / Carousel`,
        summary: "Sachliche Kurzform für Social-Kanäle, weiterhin review-first und exportbasiert.",
        origin: "short_post",
        originLabel: originLabel("short_post"),
        status: post.status,
        channels: post.channels.filter((channel) =>
          ["linkedin_draft", "x_draft", "mastodon_draft", "instagram_asset"].includes(channel),
        ),
        ...shared,
      }),
    );
  }

  return items;
}

function itemFromDossierSuggestion(item: DossierUpdateSuggestion): SocialDistributionQueueEntry {
  const status: SocialDistributionV1Status =
    item.moderationStatus === "accepted" ? "approved" : "needs_review";
  return buildQueueItem({
    id: `dossier-update:${item.id}`,
    title: item.title,
    summary: item.summary,
    origin: "dossier_update",
    originLabel: originLabel("dossier_update"),
    status,
    targetType: "dossier",
    targetLabel: "Dossier-Kontext",
    targetHref: item.dossierHref,
    dossierId: item.dossierId,
    sourceHref: item.sourceHref,
    anlassraumHref: item.anlassraumHref,
    swipesHref: item.swipesHref,
    channels:
      item.section === "question"
        ? ["newsletter_draft", "website_update"]
        : item.section === "sources"
          ? ["website_update", "newsletter_draft", "qr_asset"]
          : ["website_update", "linkedin_draft", "newsletter_draft"],
    reviewRequired: item.reviewRequired,
    reviewHint: item.reviewHint,
    riskHint: item.riskHint,
    nextAction: item.nextAction,
    exportReady: item.moderationStatus === "accepted",
    schedulingReady: false,
    copyReady: true,
    payloadAvailable: true,
    derived: true,
    channelConnections: [],
    scheduler: [],
    updatedAt: item.updatedAt,
  });
}

function itemFromRundenEntry(item: RundenEntryItem): SocialDistributionQueueEntry | null {
  if (!item.shareActions?.socialCandidate) return null;
  return buildQueueItem({
    id: `runden:${item.id}`,
    title: item.title,
    summary: item.summary,
    origin: "anlassraum_update",
    originLabel: originLabel("anlassraum_update"),
    status: item.shareActions.needsReviewBeforeOfficialSocial ? "needs_review" : "approved",
    targetType: "anlassraum",
    targetLabel: "Anlassraum",
    targetHref: item.entryHref || item.operatingHref || "/runden",
    dossierId: item.relatedDossierHref?.split("/").filter(Boolean).at(-1) ?? null,
    sourceHref: item.shareActions.canonicalTarget,
    anlassraumHref: item.entryHref || item.operatingHref || null,
    swipesHref: null,
    channels: ["website_update", "newsletter_draft", "qr_asset"],
    reviewRequired: item.shareActions.needsReviewBeforeOfficialSocial,
    reviewHint:
      item.shareActions.existingContextHint ??
      "Öffentliche Beteiligung bleibt reviewpflichtig, bevor daraus offizielle Kommunikationsausgaben werden.",
    riskHint: "Kein Auto-Posting und keine offizielle Verbreitungsbehauptung.",
    nextAction: "Kontext prüfen und geeignete Ausgabeform wählen.",
    exportReady: false,
    schedulingReady: false,
    copyReady: true,
    payloadAvailable: true,
    derived: true,
    channelConnections: [],
    scheduler: [],
    updatedAt: item.updatedAt,
  });
}

function itemFromFeedRuntime(input: Awaited<ReturnType<typeof buildFeedRadarRuntimeReadModel>>): SocialDistributionQueueEntry | null {
  const queueCount =
    input.queue.queuedDrafts + input.queue.clusteredCandidates + input.queue.attachedAnlassraum;
  if (queueCount === 0) return null;
  const status: SocialDistributionV1Status =
    input.queue.queuedDrafts > 0 ? "needs_review" : input.queue.clusteredCandidates > 0 ? "queued" : "approved";
  return buildQueueItem({
    id: "feed-radar-runtime",
    title: "Feed-Radar-Updatepfad",
    summary: "Abrufte Hinweise wurden analysiert und stehen als reviewpflichtige Folge-Ausgaben bereit.",
    origin: "feed_radar_update",
    originLabel: originLabel("feed_radar_update"),
    status,
    targetType: "review_queue",
    targetLabel: "Feed-Leitstand",
    targetHref: "/admin/feeds",
    dossierId: null,
    sourceHref: null,
    anlassraumHref: input.publicHandoffs.find((entry) => entry.surface === "runden")?.href ?? null,
    swipesHref: input.publicHandoffs.find((entry) => entry.surface === "swipes")?.href ?? null,
    channels: ["website_update", "newsletter_draft", "linkedin_draft"],
    reviewRequired: status === "needs_review",
    reviewHint: input.nextAction.description,
    riskHint: "Feed-Signale werden nicht automatisch veröffentlicht oder als Wahrheit ausgegeben.",
    nextAction: input.nextAction.label,
    exportReady: input.queue.queuedDrafts === 0,
    schedulingReady: input.queue.clusteredCandidates > 0,
    copyReady: false,
    payloadAvailable: true,
    derived: true,
    channelConnections: [],
    scheduler: [],
    updatedAt: input.runs[0]?.completedAt ?? input.runs[0]?.requestedAt ?? null,
  });
}

function sortItems(items: SocialDistributionQueueEntry[]) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(normalizeDate(left.updatedAt) ?? 0).getTime();
    const rightTime = new Date(normalizeDate(right.updatedAt) ?? 0).getTime();
    return rightTime - leftTime;
  });
}

export async function loadSocialDistributionQueueReadModel(input: {
  dossierId?: string | null;
  limit?: number;
} = {}): Promise<SocialDistributionQueueReadModel> {
  const limit = Math.max(1, Math.min(120, input.limit ?? 40));
  const [posts, rundenEntries, feedRuntime] = await Promise.all([
    input.dossierId
      ? getSocialDistributionRepo().listPostsBySourceContext({
          sourceContextType: "dossier",
          sourceContextId: input.dossierId,
        })
      : getSocialDistributionRepo().listAllPosts(limit),
    listRundenEntryItems({ limit }).catch(() => []),
    buildFeedRadarRuntimeReadModel().catch(() => null),
  ]);

  const items: SocialDistributionQueueEntry[] = [];
  for (const post of posts) {
    items.push(...itemsFromPost(post));
  }

  if (input.dossierId) {
    const dossierUpdates = await buildDossierUpdateReadModel({ dossierId: input.dossierId }).catch(() => null);
    for (const item of dossierUpdates?.items ?? []) {
      items.push(itemFromDossierSuggestion(item));
    }
  }

  for (const entry of rundenEntries) {
    const mapped = itemFromRundenEntry(entry);
    if (!mapped) continue;
    if (input.dossierId && mapped.dossierId !== input.dossierId) continue;
    items.push(mapped);
  }

  if (!input.dossierId && feedRuntime) {
    const feedItem = itemFromFeedRuntime(feedRuntime);
    if (feedItem) items.push(feedItem);
  }

  const sorted = sortItems(items).slice(0, limit);
  const summary = {
    total: sorted.length,
    reviewOpen: sorted.filter((item) => item.status === "needs_review" || item.status === "review_requested").length,
    queued: sorted.filter((item) => item.status === "queued").length,
    scheduledReady: sorted.filter((item) => item.status === "scheduled_ready").length,
    exported: sorted.filter((item) => item.status === "exported" || item.status === "copied").length,
    blocked: sorted.filter((item) => item.status === "blocked" || item.status === "error").length,
  };

  return {
    generatedAt: new Date().toISOString(),
    summary,
    guardrails: {
      noAutoPublish: true,
      noOauthConnectors: true,
      noOfficialClaim: true,
      derivedQueue: true,
    },
    items: sorted,
  };
}

export function buildEmptySocialDistributionQueueReadModel(): SocialDistributionQueueReadModel {
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      total: 0,
      reviewOpen: 0,
      queued: 0,
      scheduledReady: 0,
      exported: 0,
      blocked: 0,
    },
    guardrails: {
      noAutoPublish: true,
      noOauthConnectors: true,
      noOfficialClaim: true,
      derivedQueue: true,
    },
    items: [],
  };
}
