import { getCol, ObjectId } from "@core/db/triMongo";
import { anlassraumCol } from "@features/anlassraum/db";
import { dossierSuggestionsCol } from "@features/dossier/db";
import type { DossierSuggestionDoc } from "@features/dossier/schemas";
import { getDossierStudioWorkspaceRepo } from "@features/dossier/server/studioPersistence";
import { voteDraftsCol } from "@features/feeds/db";
import { resolveFeedRadarStatusFromDraft } from "@features/feeds/statusContract";
import type { VoteDraftDoc } from "@features/feeds/types";
import {
  buildPersistedCreateHandoffSummary,
  listPersistedCreateHandoffRecords,
  persistedCreateHandoffStatementId,
  type PersistedCreateHandoffRecord,
} from "@/features/create/persistedHandoffReviewQueue";
import type {
  PublicTopicSupplyBucket,
  SwipeFeedFilter,
  SwipeItem,
  SwipeScopeLevel,
} from "./types";

type ProposalDoc = {
  _id?: ObjectId | string | null;
  draftId?: ObjectId | string | null;
  anlassraumId?: ObjectId | string | null;
  dossierId?: string | null;
  text?: string | null;
  title?: string | null;
  topic?: string | null;
  responsibility?: string | null;
  status?: string | null;
  createdAt?: Date | null;
};

type AnlassraumSupplyDoc = {
  _id?: ObjectId;
  title?: string | null;
  summary?: string | null;
  status?: string | null;
  sourceMode?: string | null;
  isPublic?: boolean | null;
  dossierId?: ObjectId | null;
  regionKey?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

type FeedDraftSwipeDoc = Pick<
  VoteDraftDoc,
  | "_id"
  | "anlassraumId"
  | "title"
  | "summary"
  | "claims"
  | "status"
  | "feedReviewState"
  | "sourceUrl"
  | "regionCode"
  | "createdAt"
  | "publishedAt"
>;

export type PublicTopicSupplySummaryBucket = {
  bucket: PublicTopicSupplyBucket;
  label: string;
  count: number;
};

export type PublicTopicSupplySummarySource = {
  source: NonNullable<SwipeItem["sourceType"]>;
  label: string;
  count: number;
};

export type PublicTopicSupplySummary = {
  totalVisible: number;
  reviewRequired: number;
  buckets: PublicTopicSupplySummaryBucket[];
  sources: PublicTopicSupplySummarySource[];
  nextAction: {
    label: string;
    description: string;
    href: string;
  };
};

export type PublicTopicSupplyReadModel = {
  items: SwipeItem[];
  summary: PublicTopicSupplySummary;
};

type PublicTopicSupplyScope = {
  userId?: string | null;
  regionId?: string | null;
  viewerRegionIds?: string[];
  organizationId?: string | null;
  organizationIds?: string[];
  adminContext?: boolean;
  reviewContext?: boolean;
};

type DossierWorkspaceMeta = {
  regionId: string | null;
  organizationId: string | null;
};

function normalizeString(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function toObjectIdHex(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value.toHexString();
  const raw = normalizeString(value);
  if (!raw || !ObjectId.isValid(raw)) return null;
  return new ObjectId(raw).toHexString();
}

function normalizeScopeIds(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeString(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function deriveScopeLevel(responsibility?: string | null): SwipeScopeLevel {
  const value = (responsibility ?? "").toLowerCase();
  if (value.includes("eu")) return "EU";
  if (value.includes("kommune") || value.includes("stadt") || value.includes("gemeinde")) return "Kommune";
  if (value.includes("land") || value.includes("bundesland")) return "Land";
  return "Bund";
}

function isRecentDate(value: Date | string | null | undefined): boolean {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= 1000 * 60 * 60 * 24 * 14;
}

function buildScope(filter?: SwipeFeedFilter, userId?: string | null): PublicTopicSupplyScope {
  return {
    userId: normalizeString(userId),
    regionId: normalizeString(filter?.regionId),
    viewerRegionIds: normalizeScopeIds([
      filter?.regionId,
      ...(filter?.viewerRegionIds ?? []),
    ]),
    organizationId: normalizeString(filter?.organizationId),
    organizationIds: normalizeScopeIds([
      filter?.organizationId,
      ...(filter?.organizationIds ?? []),
    ]),
    adminContext: filter?.adminContext === true,
    reviewContext: filter?.reviewContext === true,
  };
}

function mergeBuckets(
  base: PublicTopicSupplyBucket[] | null | undefined,
  next: PublicTopicSupplyBucket[] | null | undefined,
) {
  return Array.from(new Set([...(base ?? []), ...(next ?? [])]));
}

function supplyBucketLabel(bucket: PublicTopicSupplyBucket): string {
  if (bucket === "public_general") return "Allgemein sichtbar";
  if (bucket === "public_recent") return "Neu im öffentlichen Themenraum";
  if (bucket === "regional") return "Regionaler Kontext";
  if (bucket === "organization") return "Organisationskontext";
  if (bucket === "from_create") return "Aus einem Beitrag";
  if (bucket === "from_feed") return "Aus dem Feed-Radar";
  if (bucket === "from_dossier") return "Im Dossier-Kontext";
  return "Prüfung nötig";
}

function sourceKindLabel(source: NonNullable<SwipeItem["sourceType"]>): string {
  if (source === "proposal") return "Öffentliche Vorschläge";
  if (source === "feed") return "Feed-Radar";
  if (source === "dossier") return "Dossier-Updates";
  if (source === "anlassraum") return "Anlassräume";
  if (source === "create") return "Create-Handoffs";
  return "Seeds";
}

function buildReviewBuckets(reviewRequired: boolean): PublicTopicSupplyBucket[] {
  return reviewRequired ? ["needs_review"] : [];
}

function normalizeSafeHref(value: unknown): string | null {
  const href = normalizeString(value);
  if (!href || !href.startsWith("/") || href.startsWith("//")) return null;
  return href;
}

async function loadDossierWorkspaceMeta(dossierIds: string[]): Promise<Map<string, DossierWorkspaceMeta>> {
  const repo = getDossierStudioWorkspaceRepo();
  const entries = await Promise.all(
    dossierIds.map(async (dossierId) => {
      const workspace = await repo.getDossierStudioWorkspace(dossierId).catch(() => null);
      return [
        dossierId,
        {
          regionId: normalizeString(workspace?.regionId),
          organizationId: normalizeString(workspace?.organizationId),
        },
      ] as const;
    }),
  );
  return new Map(entries);
}

function matchesRestrictedScope(params: {
  itemRegionId?: string | null;
  itemOrganizationId?: string | null;
  scope: PublicTopicSupplyScope;
}): boolean {
  const itemOrganizationId = normalizeString(params.itemOrganizationId);
  if (itemOrganizationId) {
    return params.scope.organizationIds?.includes(itemOrganizationId) ?? false;
  }
  const itemRegionId = normalizeString(params.itemRegionId);
  if (itemRegionId) {
    return params.scope.viewerRegionIds?.includes(itemRegionId) ?? false;
  }
  return true;
}

function filterVisibleItems(items: SwipeItem[], scope: PublicTopicSupplyScope): SwipeItem[] {
  return items.filter((item) =>
    matchesRestrictedScope({
      itemRegionId: null,
      itemOrganizationId: null,
      scope,
    }),
  );
}

function addScopedBuckets(input: {
  item: SwipeItem;
  scope: PublicTopicSupplyScope;
  itemRegionId?: string | null;
  itemOrganizationId?: string | null;
  restrictToScope?: boolean;
}): SwipeItem | null {
  const itemOrganizationId = normalizeString(input.itemOrganizationId);
  const itemRegionId = normalizeString(input.itemRegionId);
  const restrictToScope = input.restrictToScope === true;

  if (restrictToScope && !matchesRestrictedScope({ itemRegionId, itemOrganizationId, scope: input.scope })) {
    return null;
  }

  const buckets = [...(input.item.supplyBuckets ?? [])];
  if (itemOrganizationId && (input.scope.organizationIds?.includes(itemOrganizationId) ?? false)) {
    buckets.push("organization");
  } else if (itemRegionId && (input.scope.viewerRegionIds?.includes(itemRegionId) ?? false)) {
    buckets.push("regional");
  }

  if (buckets.length === 0) return input.item;
  return {
    ...input.item,
    supplyBuckets: mergeBuckets(input.item.supplyBuckets, buckets),
  };
}

function mapProposalToSwipe(proposal: ProposalDoc): SwipeItem {
  const responsibility = proposal.responsibility ?? "Zuständigkeit offen";
  const topic = proposal.topic ?? "";
  const title = proposal.title || String(proposal.text ?? "").slice(0, 120) || "Öffentlicher Themenvorschlag";
  const anlassraumId = toObjectIdHex(proposal.anlassraumId);
  const dossierId = normalizeString(proposal.dossierId);
  const sourceDraftId = toObjectIdHex(proposal.draftId);
  const recent = isRecentDate(proposal.createdAt);
  const supplyBuckets = mergeBuckets(
    [recent ? "public_recent" : "public_general"],
    dossierId ? ["from_dossier"] : null,
  );

  return {
    id: toObjectIdHex(proposal._id) ?? normalizeString(proposal._id) ?? "",
    title,
    text: normalizeString(proposal.text) ?? title,
    category: topic || "Statement",
    level: deriveScopeLevel(responsibility),
    topicTags: topic ? [topic] : [],
    evidenceCount: 0,
    responsibilityLabel: `Zuständigkeit: ${responsibility}`,
    domainLabel: topic || "Themenvorschlag",
    hasEventualities: false,
    eventualitiesCount: 0,
    sourceType: "proposal",
    sourceLabel: "Öffentlicher Vorschlag",
    sourceDraftId,
    anlassraumId,
    contextHref: anlassraumId ? `/runden?anlassraumId=${encodeURIComponent(anlassraumId)}` : null,
    dossierHref: dossierId ? `/dossier/${encodeURIComponent(dossierId)}` : null,
    statusLabel: dossierId ? "Im Dossier-Kontext" : "Als Vorschlag sichtbar",
    statusHint: dossierId
      ? "Das Thema ist mit einem Dossier verknüpft und bleibt review-first."
      : "Der Vorschlag ist öffentlich lesbar, aber keine automatische Wahrheit.",
    supplyBuckets,
    supplyLabel: dossierId ? "Aus dem Dossier-Kontext" : "Allgemein sichtbares Thema",
    supplyHint: dossierId
      ? "Der Vorschlag kommt aus einem bestehenden Dossier oder verweist dorthin."
      : recent
        ? "Dieses Thema ist neu im öffentlichen Beteiligungsfluss."
        : "Dieses Thema ist allgemein sichtbar und nicht an einen geschützten Bereich gebunden.",
    fromDraftMatch: false,
  };
}

function buildFeedSwipeStatus(params: {
  draftStatus?: string | null;
  feedReviewState?: string | null;
  hasAnlassraum: boolean;
  hasDossier: boolean;
}): Pick<SwipeItem, "statusLabel" | "statusHint"> {
  const status = resolveFeedRadarStatusFromDraft({
    draftStatus:
      params.draftStatus === "review" || params.draftStatus === "published" || params.draftStatus === "discarded"
        ? params.draftStatus
        : "draft",
    feedReviewState:
      params.feedReviewState === "queued" ||
      params.feedReviewState === "ignored" ||
      params.feedReviewState === "attached" ||
      params.feedReviewState === "candidate_created" ||
      params.feedReviewState === "weak_signal"
        ? params.feedReviewState
        : null,
    hasAnlassraum: params.hasAnlassraum,
    hasDossier: params.hasDossier,
    hasPublishedStatement: params.draftStatus === "published",
  });

  if (status === "published_update") {
    return {
      statusLabel: "Update aus dem Feed-Radar",
      statusHint: "Bewusst freigegebenes Update. Sichtbar heißt nicht automatisch amtlich.",
    };
  }
  if (status === "attached_to_dossier") {
    return {
      statusLabel: "Im Dossier-Kontext",
      statusHint: "Dieser Vorschlag ist an ein Dossier gekoppelt und bleibt als Kontextfläche lesbar.",
    };
  }
  return {
    statusLabel: "Vorschlag aus dem Feed-Radar",
    statusHint: "Dieser Vorschlag ist review-first vorbereitet und noch keine behauptete Wahrheit.",
  };
}

function mapFeedDraftToSwipe(params: {
  draft: FeedDraftSwipeDoc;
  dossierHref: string | null;
  scope: PublicTopicSupplyScope;
}): SwipeItem {
  const firstClaim = params.draft.claims?.[0] ?? null;
  const responsibility = firstClaim?.responsibility ?? "Zuständigkeit offen";
  const topic = firstClaim?.topic ?? "Feed-Radar";
  const anlassraumId = toObjectIdHex(params.draft.anlassraumId);
  const statusCopy = buildFeedSwipeStatus({
    draftStatus: params.draft.status ?? null,
    feedReviewState: params.draft.feedReviewState ?? null,
    hasAnlassraum: Boolean(anlassraumId),
    hasDossier: Boolean(params.dossierHref),
  });
  const regionKey = normalizeString(params.draft.regionCode);
  const reviewRequired =
    params.draft.status !== "published" ||
    params.draft.feedReviewState === "queued" ||
    params.draft.feedReviewState === "candidate_created" ||
    params.draft.feedReviewState === "weak_signal";

  const item: SwipeItem = {
    id: params.draft._id?.toHexString?.() ?? "",
    title: params.draft.title,
    text: params.draft.summary ?? firstClaim?.text ?? params.draft.title,
    category: topic,
    level: deriveScopeLevel(responsibility),
    topicTags: topic ? [topic] : [],
    evidenceCount: 0,
    responsibilityLabel: `Zuständigkeit: ${responsibility}`,
    domainLabel: topic,
    hasEventualities: false,
    eventualitiesCount: 0,
    sourceType: "feed",
    sourceLabel: "Feed-Radar",
    sourceDraftId: params.draft._id?.toHexString?.() ?? null,
    anlassraumId,
    contextHref: anlassraumId ? `/runden?anlassraumId=${encodeURIComponent(anlassraumId)}` : null,
    dossierHref: params.dossierHref,
    statusLabel: statusCopy.statusLabel,
    statusHint: statusCopy.statusHint,
    supplyBuckets: mergeBuckets(
      ["from_feed", isRecentDate(params.draft.publishedAt ?? params.draft.createdAt) ? "public_recent" : "public_general"],
      buildReviewBuckets(reviewRequired),
    ),
    supplyLabel:
      regionKey && (params.scope.viewerRegionIds?.includes(regionKey) ?? false)
        ? "Regionaler Hinweis aus dem Feed"
        : "Aus dem Feed-Radar",
    supplyHint:
      regionKey && (params.scope.viewerRegionIds?.includes(regionKey) ?? false)
        ? "Dieses Thema passt zu deinem Regionalkontext und bleibt review-first."
        : "Der Vorschlag stammt aus dem Feed-Radar und wurde noch nicht automatisch veröffentlicht.",
    fromDraftMatch: false,
  };

  return addScopedBuckets({
    item,
    scope: params.scope,
    itemRegionId: regionKey,
    restrictToScope: false,
  }) ?? item;
}

function mapDossierSuggestionToSwipe(params: {
  suggestion: DossierSuggestionDoc;
  workspaceMeta: DossierWorkspaceMeta | null;
  scope: PublicTopicSupplyScope;
}): SwipeItem | null {
  const payload = (params.suggestion.payload ?? {}) as Record<string, unknown>;
  const title =
    normalizeString(payload.title) ??
    normalizeString(payload.text) ??
    "Dossier-Update";
  const summary =
    normalizeString(payload.summary) ??
    normalizeString(payload.text) ??
    "Im Dossier-Kontext liegt ein neuer Hinweis vor.";
  const swipesHref = normalizeSafeHref(payload.swipesHref);
  const anlassraumHref = normalizeSafeHref(payload.anlassraumHref);
  const sourceHref = normalizeSafeHref(payload.sourceHref);
  const reviewRequired = params.suggestion.status !== "accepted";

  const item: SwipeItem = {
    id: normalizeString(payload.statementId) ?? `dossier-suggestion:${params.suggestion.suggestionId}`,
    title,
    text: summary,
    category: "Dossier",
    level: "Bund",
    topicTags: normalizeString(payload.section) ? [String(payload.section)] : ["Dossier"],
    evidenceCount: 0,
    responsibilityLabel: "Zuständigkeit: Dossier-Kontext",
    domainLabel: "Dossier",
    hasEventualities: false,
    eventualitiesCount: 0,
    sourceType: "dossier",
    sourceLabel: "Dossier-Update",
    contextHref: anlassraumHref ?? sourceHref,
    dossierHref: `/dossier/${encodeURIComponent(params.suggestion.dossierId)}`,
    statusLabel: reviewRequired ? "Update im Dossier-Kontext" : "Veröffentlicht im Dossier",
    statusHint: reviewRequired
      ? "Das Update ist als Vorschlag sichtbar und bleibt bis zur Prüfung ein Hinweis."
      : "Das Thema ist in den öffentlichen Dossier-Kontext übernommen worden.",
    supplyBuckets: mergeBuckets(["from_dossier"], buildReviewBuckets(reviewRequired)),
    supplyLabel:
      params.workspaceMeta?.organizationId && (params.scope.organizationIds?.includes(params.workspaceMeta.organizationId) ?? false)
        ? "Dossier aus deinem Organisationskontext"
        : params.workspaceMeta?.regionId && (params.scope.viewerRegionIds?.includes(params.workspaceMeta.regionId) ?? false)
          ? "Dossier aus deinem Regionalkontext"
          : "Aus dem Dossier-Kontext",
    supplyHint:
      reviewRequired
        ? "Dieses Thema kommt aus einem Dossier-Update-Vorschlag und bleibt review-first."
        : "Dieses Thema ist aus dem Dossier lesbar verknüpft.",
    fromDraftMatch: false,
  };

  return addScopedBuckets({
    item,
    scope: params.scope,
    itemRegionId: params.workspaceMeta?.regionId ?? null,
    itemOrganizationId: params.workspaceMeta?.organizationId ?? null,
    restrictToScope: Boolean(params.workspaceMeta?.organizationId || params.workspaceMeta?.regionId),
  });
}

function mapCreateHandoffToSwipe(params: {
  record: PersistedCreateHandoffRecord;
  scope: PublicTopicSupplyScope;
}): SwipeItem | null {
  const recordOrganizationId = normalizeString(params.record.organizationId);
  const recordRegionId = normalizeString(params.record.regionId);
  const reviewRequired = params.record.reviewRequired === true;
  const ownContribution = normalizeString(params.scope.userId) === normalizeString(params.record.createdByUserId);
  const title =
    normalizeString(params.record.topicSeed.topicLabel) ??
    normalizeString(params.record.claims[0]?.text) ??
    "Beitragsvorschlag";

  const item: SwipeItem = {
    id: persistedCreateHandoffStatementId(params.record.id),
    title,
    text: buildPersistedCreateHandoffSummary(params.record),
    category: params.record.topicSeed.topicLabel || "Beitrag",
    level:
      params.record.topicSeed.jurisdiction === "kommune"
        ? "Kommune"
        : params.record.topicSeed.jurisdiction === "land"
          ? "Land"
          : "Bund",
    topicTags: normalizeString(params.record.topicSeed.topicLabel)
      ? [params.record.topicSeed.topicLabel]
      : [],
    evidenceCount: params.record.sourceGrounding.length,
    responsibilityLabel: "Zuständigkeit: Beitrag in Prüfung",
    domainLabel: params.record.topicSeed.topicLabel || "Beitrag",
    hasEventualities: false,
    eventualitiesCount: 0,
    sourceType: "create",
    sourceLabel: ownContribution ? "Dein Beitrag" : "Create-Handoff",
    anlassraumId: normalizeString(params.record.anlassraumId),
    contextHref: normalizeSafeHref(params.record.resumeHref),
    dossierHref: normalizeString(params.record.dossierId)
      ? `/dossier/${encodeURIComponent(String(params.record.dossierId))}`
      : null,
    statusLabel: "Beitrag in Prüfung",
    statusHint: "Aus Beiträgen werden Vorschläge review-first weitergeführt. Es gibt keinen Auto-Publish.",
    supplyBuckets: mergeBuckets(["from_create"], buildReviewBuckets(reviewRequired)),
    supplyLabel: ownContribution ? "Aus deinem Beitrag" : "Aus einem Beitrag",
    supplyHint: ownContribution
      ? "Dieses Thema wurde aus deinem eingereichten Beitrag vorbereitet."
      : "Dieses Thema wurde aus einem eingereichten Beitrag vorbereitet und bleibt review-first.",
    fromDraftMatch: false,
  };

  return addScopedBuckets({
    item,
    scope: params.scope,
    itemRegionId: recordRegionId,
    itemOrganizationId: recordOrganizationId,
    restrictToScope: Boolean(recordOrganizationId || recordRegionId),
  });
}

function mapAnlassraumToSwipe(params: {
  room: AnlassraumSupplyDoc;
  scope: PublicTopicSupplyScope;
}): SwipeItem | null {
  const roomId = toObjectIdHex(params.room._id);
  if (!roomId) return null;
  const isPublic = params.room.isPublic === true;
  const reviewRequired = !isPublic || String(params.room.status ?? "").toLowerCase().includes("review");
  const item: SwipeItem = {
    id: `anlassraum:${roomId}`,
    title: normalizeString(params.room.title) ?? "Anlassraum-Thema",
    text: normalizeString(params.room.summary) ?? "Öffentlicher Kontext aus einem Anlassraum.",
    category: "Anlassraum",
    level: "Kommune",
    topicTags: normalizeString(params.room.sourceMode) ? [String(params.room.sourceMode)] : ["Anlassraum"],
    evidenceCount: 0,
    responsibilityLabel: "Zuständigkeit: Anlassraum",
    domainLabel: "Anlassraum",
    hasEventualities: false,
    eventualitiesCount: 0,
    sourceType: "anlassraum",
    sourceLabel: "Anlassraum",
    anlassraumId: roomId,
    contextHref: `/runden?anlassraumId=${encodeURIComponent(roomId)}`,
    dossierHref: toObjectIdHex(params.room.dossierId)
      ? `/dossier/${encodeURIComponent(toObjectIdHex(params.room.dossierId) as string)}`
      : null,
    statusLabel: isPublic ? "Anlassraum sichtbar" : "Anlassraum in Prüfung",
    statusHint: isPublic
      ? "Der Anlassraum ist öffentlich lesbar. Beiträge und Folgepfade bleiben review-first."
      : "Der Anlassraum ist noch nicht öffentlich freigegeben und bleibt im Review-Kontext.",
    supplyBuckets: mergeBuckets(
      [isRecentDate(params.room.updatedAt ?? params.room.createdAt) ? "public_recent" : "public_general"],
      buildReviewBuckets(reviewRequired),
    ),
    supplyLabel: "Aus dem Anlassraum",
    supplyHint: isPublic
      ? "Dieses Thema ist mit einem öffentlichen Anlassraum verknüpft."
      : "Dieses Thema stammt aus einem Anlassraum-Signal und wartet noch auf Prüfung.",
    fromDraftMatch: false,
  };

  return addScopedBuckets({
    item,
    scope: params.scope,
    itemRegionId: normalizeString(params.room.regionKey),
    restrictToScope: false,
  });
}

function mergeItems(items: SwipeItem[]): SwipeItem[] {
  const merged = new Map<string, SwipeItem>();
  for (const item of items) {
    if (!item.id) continue;
    const existing = merged.get(item.id);
    if (!existing) {
      merged.set(item.id, item);
      continue;
    }
    merged.set(item.id, {
      ...existing,
      ...item,
      text: existing.text ?? item.text,
      contextHref: existing.contextHref ?? item.contextHref,
      dossierHref: existing.dossierHref ?? item.dossierHref,
      sourceDraftId: existing.sourceDraftId ?? item.sourceDraftId,
      statusLabel: existing.statusLabel ?? item.statusLabel,
      statusHint: existing.statusHint ?? item.statusHint,
      sourceLabel: existing.sourceLabel ?? item.sourceLabel,
      supplyLabel: existing.supplyLabel ?? item.supplyLabel,
      supplyHint: existing.supplyHint ?? item.supplyHint,
      supplyBuckets: mergeBuckets(existing.supplyBuckets, item.supplyBuckets),
    });
  }
  return Array.from(merged.values());
}

function filterItemsBySwipeFilter(items: SwipeItem[], filter?: SwipeFeedFilter): SwipeItem[] {
  const statementId = normalizeString(filter?.statementId);
  const fromDraftId = toObjectIdHex(filter?.fromDraftId);
  const topicQuery = String(filter?.topicQuery ?? "").trim().toLowerCase();
  const level = filter?.level;

  let next = [...items];
  if (statementId) {
    next = next.filter((item) => item.id === statementId);
  }
  if (fromDraftId) {
    next = next
      .filter((item) => item.sourceDraftId === fromDraftId)
      .map((item) => ({ ...item, fromDraftMatch: true }));
  }
  if (topicQuery) {
    next = next.filter((item) => {
      const haystack = [
        item.title,
        item.text,
        item.category,
        item.domainLabel,
        ...(item.topicTags ?? []),
        item.supplyLabel,
        item.sourceLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(topicQuery);
    });
  }
  if (level && level !== "ALL") {
    next = next.filter((item) => item.level === level);
  }
  return next;
}

function buildSupplySummary(items: SwipeItem[]): PublicTopicSupplySummary {
  const bucketCounts = new Map<PublicTopicSupplyBucket, number>();
  const sourceCounts = new Map<NonNullable<SwipeItem["sourceType"]>, number>();

  for (const item of items) {
    for (const bucket of item.supplyBuckets ?? []) {
      bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
    }
    if (item.sourceType) {
      sourceCounts.set(item.sourceType, (sourceCounts.get(item.sourceType) ?? 0) + 1);
    }
  }

  const reviewRequired = bucketCounts.get("needs_review") ?? 0;
  const buckets = Array.from(bucketCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([bucket, count]) => ({
      bucket,
      label: supplyBucketLabel(bucket),
      count,
    }));
  const sources = Array.from(sourceCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([source, count]) => ({
      source,
      label: sourceKindLabel(source),
      count,
    }));

  let nextAction = {
    label: "Feed- und Review-Queue prüfen",
    description: "Öffentliche Themen sind vorhanden. Prüfe offene Hinweise und Freigaben im Leitstand.",
    href: "/admin/feeds",
  };
  if (reviewRequired > 0) {
    nextAction = {
      label: "Reviewbedarf abbauen",
      description: "Ein Teil der Themen bleibt bewusst in Prüfung und braucht eine nächste Entscheidung.",
      href: "/admin/review",
    };
  } else if ((bucketCounts.get("organization") ?? 0) > 0 || (bucketCounts.get("regional") ?? 0) > 0) {
    nextAction = {
      label: "Scope-Angebote prüfen",
      description: "Regionale oder organisationsbezogene Themen sind sichtbar und sollten im Kontext gespiegelt werden.",
      href: "/account/organization/dashboard",
    };
  }

  return {
    totalVisible: items.length,
    reviewRequired,
    buckets,
    sources,
    nextAction,
  };
}

export async function buildPublicTopicSupplyReadModel(params: {
  userId?: string | null;
  filter?: SwipeFeedFilter;
  limit?: number;
}): Promise<PublicTopicSupplyReadModel> {
  const limit = Math.max(1, Math.min(params.limit ?? 20, 80));
  const scope = buildScope(params.filter, params.userId);

  const [
    proposalDocs,
    feedDraftDocs,
    suggestionDocs,
    createHandoffs,
    rooms,
  ] = await Promise.all([
    (await getCol<ProposalDoc>("statement_proposals"))
      .find({ status: { $in: ["proposed", null] } })
      .sort({ createdAt: -1 })
      .limit(limit * 3)
      .toArray()
      .catch(() => []),
    (await voteDraftsCol())
      .find({ status: { $in: ["review", "published"] } })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit * 3)
      .toArray()
      .catch(() => []) as Promise<FeedDraftSwipeDoc[]>,
    (await dossierSuggestionsCol())
      .find({ status: { $in: ["pending", "accepted"] } })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(limit * 3)
      .toArray()
      .catch(() => []) as Promise<DossierSuggestionDoc[]>,
    listPersistedCreateHandoffRecords().catch(() => []),
    (await anlassraumCol())
      .find({})
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(limit * 3)
      .toArray()
      .catch(() => []) as Promise<AnlassraumSupplyDoc[]>,
  ]);

  const roomIds = Array.from(
    new Set(
      feedDraftDocs
        .map((draft) => toObjectIdHex(draft.anlassraumId))
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const roomById = new Map<string, AnlassraumSupplyDoc>();
  if (roomIds.length > 0) {
    const linkedRooms = await (await anlassraumCol())
      .find({ _id: { $in: roomIds.map((id) => new ObjectId(id)) } })
      .toArray()
      .catch(() => []);
    for (const room of linkedRooms) {
      const roomId = toObjectIdHex(room?._id);
      if (roomId) roomById.set(roomId, room as AnlassraumSupplyDoc);
    }
  }

  const dossierWorkspaceMeta = await loadDossierWorkspaceMeta(
    Array.from(new Set(suggestionDocs.map((doc) => doc.dossierId))).filter(Boolean),
  );

  const items = mergeItems([
    ...proposalDocs.map((proposal) => mapProposalToSwipe(proposal)),
    ...feedDraftDocs.map((draft) => {
      const anlassraumId = toObjectIdHex(draft.anlassraumId);
      const room = anlassraumId ? roomById.get(anlassraumId) : null;
      const dossierId = toObjectIdHex(room?.dossierId);
      return mapFeedDraftToSwipe({
        draft,
        dossierHref: dossierId ? `/dossier/${encodeURIComponent(dossierId)}` : null,
        scope,
      });
    }),
    ...suggestionDocs
      .map((suggestion) =>
        mapDossierSuggestionToSwipe({
          suggestion,
          workspaceMeta: dossierWorkspaceMeta.get(suggestion.dossierId) ?? null,
          scope,
        }),
      )
      .filter((item): item is SwipeItem => Boolean(item)),
    ...createHandoffs
      .map((record) => mapCreateHandoffToSwipe({ record, scope }))
      .filter((item): item is SwipeItem => Boolean(item)),
    ...rooms
      .map((room) => mapAnlassraumToSwipe({ room, scope }))
      .filter((item): item is SwipeItem => Boolean(item)),
  ]);

  const filteredItems = filterItemsBySwipeFilter(filterVisibleItems(items, scope), params.filter)
    .sort((left, right) => {
      const leftPriority =
        (left.supplyBuckets?.includes("organization") ? 4 : 0) +
        (left.supplyBuckets?.includes("regional") ? 3 : 0) +
        (left.supplyBuckets?.includes("from_create") ? 2 : 0) +
        (left.supplyBuckets?.includes("from_feed") ? 1 : 0);
      const rightPriority =
        (right.supplyBuckets?.includes("organization") ? 4 : 0) +
        (right.supplyBuckets?.includes("regional") ? 3 : 0) +
        (right.supplyBuckets?.includes("from_create") ? 2 : 0) +
        (right.supplyBuckets?.includes("from_feed") ? 1 : 0);
      return rightPriority - leftPriority;
    })
    .slice(0, limit);

  return {
    items: filteredItems,
    summary: buildSupplySummary(filteredItems),
  };
}
