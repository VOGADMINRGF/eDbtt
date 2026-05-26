import type {
  EDebattePackage,
  SwipeFeedFilter,
  SwipeFeedRequest,
  SwipeFeedResponse,
  SwipeItem,
  EventualitiesRequest,
  EventualitiesResponse,
  Eventuality,
  SwipeVotePayload,
  SwipeDecision,
  SwipeNeutralReason,
} from "./types";
import { filterSwipeSeedItems, getSwipeSeedEventualities } from "./seed";
import { normalizeSwipeVotePayload } from "./variantSelectionContract";
import { recordSwipeVoteInGraph } from "@/features/graph/swipes";
import { getCol } from "@core/db/triMongo";
import { eventualityNodesCol } from "@core/eventualities/db";
import type { EventualityNodeDoc } from "@core/eventualities/types";
import {
  getPersonalizedStartItems,
  getUserPreferenceSnapshot,
} from "@/lib/onboarding/preferenceSnapshot";
import { ObjectId } from "@core/db/triMongo";
import { applySwipeForCredits } from "@features/user/credits";
import { normalizeAccessTier } from "@/config/accessTiers";
import { FEATURE_MATRIX_DEFAULTS } from "@/config/featureMatrix";
import { shouldAllowSwipeSeedFallback } from "@/features/runtimeDataGuardrails";
import { anlassraumCol } from "@features/anlassraum/db";
import { voteDraftsCol } from "@features/feeds/db";
import { resolveFeedRadarStatusFromDraft } from "@features/feeds/statusContract";
import { buildPublicTopicSupplyReadModel } from "./publicTopicSupply";
import type { VoteDraftDoc } from "@features/feeds/types";

type ProposalDoc = {
  _id?: any;
  draftId?: any;
  anlassraumId?: string | null;
  dossierId?: string | null;
  text: string;
  title?: string | null;
  topic?: string | null;
  responsibility?: string | null;
  stance?: string | null;
  importance?: number | null;
  status?: string;
  createdAt?: Date;
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

type SwipeVoteDoc = {
  _id?: any;
  userId: string;
  statementId: string;
  eventualityId: string | null;
  decision: SwipeDecision;
  neutralReason?: SwipeNeutralReason | null;
  variantWeight?: 1 | 3 | 5 | null;
  variantReason?: string | null;
  variantRankedIds?: string[] | null;
  excludedEventualityIds?: string[] | null;
  source: "swipes";
  createdAt: Date;
  updatedAt: Date;
};

type UserUsageDoc = {
  _id: ObjectId;
  accessTier?: string | null;
  b2cPlanId?: string | null;
  usage?: {
    swipeCountTotal?: number;
    swipesThisMonth?: number;
    xp?: number;
    contributionCredits?: number;
  };
};

type SwipeTelemetryDoc = {
  _id?: ObjectId;
  userId: ObjectId;
  statementId: string;
  direction: "pro" | "neutral" | "contra";
  createdAt: Date;
  xpAfter: number;
  contributionCredits: number;
};

function decisionToDirection(decision: SwipeDecision): "pro" | "neutral" | "contra" {
  if (decision === "agree") return "pro";
  if (decision === "disagree") return "contra";
  return "neutral";
}

function deriveScopeLevel(responsibility?: string | null): SwipeItem["level"] {
  const value = (responsibility ?? "").toLowerCase();
  if (value.includes("eu")) return "EU";
  if (value.includes("kommune") || value.includes("stadt") || value.includes("gemeinde")) return "Kommune";
  if (value.includes("land") || value.includes("bundesland")) return "Land";
  return "Bund";
}

function toObjectIdHex(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value.toHexString();
  const raw = String(value).trim();
  if (!ObjectId.isValid(raw)) return null;
  return new ObjectId(raw).toHexString();
}

function mapProposalToSwipe(proposal: ProposalDoc): SwipeItem {
  const responsibility = proposal.responsibility ?? "Zuständigkeit offen";
  const topic = proposal.topic ?? "";
  const title = proposal.title || proposal.text.slice(0, 120);
  const scope = deriveScopeLevel(responsibility);
  const anlassraumId = toObjectIdHex(proposal.anlassraumId);
  const sourceDraftId = toObjectIdHex(proposal.draftId);
  return {
    id: String(proposal._id ?? ""),
    title,
    text: proposal.text,
    category: topic || "Statement",
    level: scope,
    topicTags: topic ? [topic] : [],
    evidenceCount: 0,
    responsibilityLabel: `Zuständigkeit: ${responsibility}`,
    domainLabel: topic || "–",
    hasEventualities: false,
    eventualitiesCount: 0,
    sourceDraftId,
    anlassraumId,
    contextHref: anlassraumId
      ? `/create?mode=source&anlassraumId=${encodeURIComponent(anlassraumId)}`
      : null,
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
      statusLabel: "Quellenhinweis im Dossier-Kontext",
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

  return {
    id: params.draft._id?.toHexString?.() ?? "",
    title: params.draft.title,
    text: params.draft.summary ?? firstClaim?.text ?? params.draft.title,
    category: topic,
    level: deriveScopeLevel(responsibility),
    topicTags: topic ? [topic] : [],
    evidenceCount: 0,
    responsibilityLabel: `${statusCopy.statusLabel} · Zuständigkeit: ${responsibility}`,
    domainLabel: topic,
    hasEventualities: false,
    eventualitiesCount: 0,
    sourceDraftId: params.draft._id?.toHexString?.() ?? null,
    anlassraumId,
    contextHref: anlassraumId ? `/runden?anlassraumId=${encodeURIComponent(anlassraumId)}` : null,
    dossierHref: params.dossierHref,
    statusLabel: statusCopy.statusLabel,
    statusHint: statusCopy.statusHint,
    fromDraftMatch: false,
  };
}

async function loadFeedDraftSwipeFallback(params: {
  fromDraftId: string | null;
  topicQuery: string;
  level: SwipeFeedFilter["level"];
  limit: number;
}): Promise<SwipeItem[]> {
  const drafts = await voteDraftsCol();
  const draftFilter: Record<string, unknown> = {
    status: { $in: ["review", "published"] },
  };
  if (params.fromDraftId) {
    draftFilter._id = new ObjectId(params.fromDraftId);
  }

  const draftDocs = (await drafts
    .find(draftFilter)
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(Math.min(params.limit, 20))
    .toArray()) as FeedDraftSwipeDoc[];

  if (draftDocs.length === 0) return [];

  const roomIds = Array.from(
    new Set(
      draftDocs
        .map((draft) => toObjectIdHex(draft.anlassraumId))
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const roomById = new Map<string, { dossierId?: ObjectId | null }>();
  if (roomIds.length > 0) {
    const rooms = await (await anlassraumCol())
      .find({ _id: { $in: roomIds.map((id) => new ObjectId(id)) } })
      .toArray();
    for (const room of rooms) {
      const id = toObjectIdHex(room?._id);
      if (!id) continue;
      roomById.set(id, { dossierId: room?.dossierId ?? null });
    }
  }

  let items = draftDocs.map((draft) => {
    const anlassraumId = toObjectIdHex(draft.anlassraumId);
    const dossierId = anlassraumId ? toObjectIdHex(roomById.get(anlassraumId)?.dossierId) : null;
    return mapFeedDraftToSwipe({
      draft,
      dossierHref: dossierId ? `/dossier/${encodeURIComponent(dossierId)}` : null,
    });
  });

  if (params.topicQuery) {
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(params.topicQuery) ||
        item.topicTags.some((tag) => tag.toLowerCase().includes(params.topicQuery)),
    );
  }
  if (params.level && params.level !== "ALL") {
    items = items.filter((item) => item.level === params.level);
  }
  if (params.fromDraftId) {
    items = items.map((item) => ({ ...item, fromDraftMatch: true }));
  }
  return items;
}

async function loadEventualityCounts(statementIds: string[]) {
  if (!statementIds.length) return {};
  const col = await eventualityNodesCol();
  const rows = await col
    .aggregate([{ $match: { statementId: { $in: statementIds } } }, { $group: { _id: "$statementId", count: { $sum: 1 } } }])
    .toArray();
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[String(row._id)] = row.count ?? 0;
    return acc;
  }, {});
}

async function swipeVotesCol() {
  return getCol<SwipeVoteDoc>("swipe_votes");
}

async function applySwipeProgressForVote(params: {
  userId: string;
  statementId: string;
  decision: SwipeDecision;
  now: Date;
}) {
  if (!ObjectId.isValid(params.userId)) return;

  const usersCol = await getCol<UserUsageDoc>("users");
  const userObjectId = new ObjectId(params.userId);
  const userDoc = await usersCol.findOne(
    { _id: userObjectId },
    { projection: { usage: 1, accessTier: 1, b2cPlanId: 1 } },
  );
  if (!userDoc) return;

  const accessTier = normalizeAccessTier(userDoc.accessTier ?? userDoc.b2cPlanId ?? null);
  const featureSet = FEATURE_MATRIX_DEFAULTS[accessTier];
  if (!featureSet.canSwipe) return;

  const previous = userDoc.usage ?? {};
  const next = applySwipeForCredits({
    swipeCountTotal: previous.swipeCountTotal,
    xp: previous.xp,
    contributionCredits: previous.contributionCredits,
  });

  const incOps: Record<string, number> = {
    "usage.swipeCountTotal": 1,
    "usage.swipesThisMonth": 1,
    "usage.xp": next.xp - (previous.xp ?? 0),
  };
  if (next.earnedCredits > 0) {
    incOps["usage.contributionCredits"] = next.earnedCredits;
  }

  await usersCol.updateOne(
    { _id: userObjectId },
    {
      $inc: incOps,
      $set: {
        "usage.lastSwipeAt": params.now,
        "stats.swipeCountTotal": next.swipeCountTotal,
        "stats.xp": next.xp,
        "stats.contributionCredits": next.contributionCredits,
      },
    },
  );

  const telemetryCol = await getCol<SwipeTelemetryDoc>("swipe_events");
  await telemetryCol.insertOne({
    userId: userObjectId,
    statementId: params.statementId,
    direction: decisionToDirection(params.decision),
    createdAt: params.now,
    xpAfter: next.xp,
    contributionCredits: next.contributionCredits,
  });
}

export async function getSwipeFeed(req: SwipeFeedRequest): Promise<SwipeFeedResponse> {
  // Filter rudimentär auf Basis der Mock-Daten
  const { filter } = req;
  const topicQuery = filter?.topicQuery?.toLowerCase() ?? "";
  const level = filter?.level;
  const statementId = filter?.statementId;
  const fromDraftId = toObjectIdHex(filter?.fromDraftId);
  const allowSeedFallback = shouldAllowSwipeSeedFallback({
    fromDraftId,
    regionId: filter?.regionId ?? null,
    viewerRegionIds: filter?.viewerRegionIds ?? null,
    organizationId: filter?.organizationId ?? null,
    organizationIds: filter?.organizationIds ?? null,
    adminContext: filter?.adminContext,
    reviewContext: filter?.reviewContext,
  });

  let proposalDocs: ProposalDoc[] = [];
  let supplyLayerItems: SwipeItem[] = [];
  try {
    const Proposals = await getCol<ProposalDoc>("statement_proposals");
    proposalDocs = await Proposals.find({ status: { $in: ["proposed", null] } })
      .sort({ createdAt: -1 })
      .limit(req.limit ?? 20)
      .toArray();
    try {
      const supply = await buildPublicTopicSupplyReadModel({
        userId: req.userId ?? null,
        filter: req.filter,
        limit: req.limit ?? 20,
      });
      supplyLayerItems = supply.items;
    } catch (supplyError) {
      console.error("[swipes] public topic supply unavailable", supplyError);
    }
  } catch (error) {
    try {
      const supply = await buildPublicTopicSupplyReadModel({
        userId: req.userId ?? null,
        filter: req.filter,
        limit: req.limit ?? 20,
      });
      supplyLayerItems = supply.items;
    } catch (supplyError) {
      console.error("[swipes] public topic supply unavailable", supplyError);
    }
    if (fromDraftId) {
      if (supplyLayerItems.length > 0) {
        const counts = await loadEventualityCounts(supplyLayerItems.map((item) => item.id));
        return {
          items: supplyLayerItems.map((item) => ({
            ...item,
            eventualitiesCount: counts[item.id] ?? 0,
            hasEventualities: (counts[item.id] ?? 0) > 0,
          })),
          nextCursor: null,
        };
      }
      try {
        const fallbackItems = await loadFeedDraftSwipeFallback({
          fromDraftId,
          topicQuery,
          level,
          limit: req.limit ?? 20,
        });
        if (fallbackItems.length > 0) {
          const counts = await loadEventualityCounts(fallbackItems.map((item) => item.id));
          return {
            items: fallbackItems.map((item) => ({
              ...item,
              eventualitiesCount: counts[item.id] ?? 0,
              hasEventualities: (counts[item.id] ?? 0) > 0,
            })),
            nextCursor: null,
          };
        }
      } catch (fallbackError) {
        console.error("[swipes] feed draft fallback unavailable", fallbackError);
      }
      console.error("[swipes] proposal feed unavailable, preserving explicit fromDraft no-match", error);
      return { items: [], nextCursor: null };
    }
    if (supplyLayerItems.length > 0) {
      const counts = await loadEventualityCounts(supplyLayerItems.map((item) => item.id));
      return {
        items: supplyLayerItems.map((item) => ({
          ...item,
          eventualitiesCount: counts[item.id] ?? 0,
          hasEventualities: (counts[item.id] ?? 0) > 0,
        })),
        nextCursor: null,
      };
    }
    try {
      const fallbackItems = await loadFeedDraftSwipeFallback({
        fromDraftId: null,
        topicQuery,
        level,
        limit: req.limit ?? 20,
      });
      if (fallbackItems.length > 0) {
        const counts = await loadEventualityCounts(fallbackItems.map((item) => item.id));
        return {
          items: fallbackItems.map((item) => ({
            ...item,
            eventualitiesCount: counts[item.id] ?? 0,
            hasEventualities: (counts[item.id] ?? 0) > 0,
          })),
          nextCursor: null,
        };
      }
    } catch (fallbackError) {
      console.error("[swipes] feed draft fallback unavailable", fallbackError);
    }
    if (!allowSeedFallback) {
      console.error("[swipes] proposal feed unavailable, seed fallback blocked for guarded context", error);
      return { items: [], nextCursor: null };
    }
    console.error("[swipes] proposal feed unavailable, using seed fallback", error);
    return { items: filterSwipeSeedItems(req.filter), nextCursor: null };
  }

  let items = proposalDocs.length > 0 ? proposalDocs.map(mapProposalToSwipe) : [];
  if (supplyLayerItems.length > 0) {
    const itemsById = new Map<string, SwipeItem>();
    for (const item of [...items, ...supplyLayerItems]) {
      const existing = itemsById.get(item.id);
      if (!existing) {
        itemsById.set(item.id, item);
        continue;
      }
      itemsById.set(item.id, {
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
        supplyBuckets: Array.from(
          new Set([...(existing.supplyBuckets ?? []), ...(item.supplyBuckets ?? [])]),
        ),
      });
    }
    items = Array.from(itemsById.values());
  }

  if (items.length === 0) {
    try {
      if (supplyLayerItems.length > 0) {
        items = supplyLayerItems;
      } else {
        items = await loadFeedDraftSwipeFallback({
          fromDraftId,
          topicQuery,
          level,
          limit: req.limit ?? 20,
        });
      }
    } catch (error) {
      console.error("[swipes] feed draft fallback unavailable", error);
    }
  }

  if (statementId) {
    items = items.filter((item) => item.id === statementId);
  }

  if (fromDraftId) {
    items = items
      .filter((item) => item.sourceDraftId === fromDraftId)
      .map((item) => ({ ...item, fromDraftMatch: true }));
  }

  if (topicQuery) {
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(topicQuery) ||
        item.topicTags.some((tag) => tag.toLowerCase().includes(topicQuery)),
    );
  }

  if (level && level !== "ALL") {
    items = items.filter((item) => item.level === level);
  }

  if (items.length > 0) {
    const counts = await loadEventualityCounts(items.map((item) => item.id));
    items = items.map((item) => {
      const count = counts[item.id] ?? 0;
      return {
        ...item,
        hasEventualities: count > 0,
        eventualitiesCount: count,
      };
    });
  }

  if (items.length > 0 && req.userId) {
    try {
      const snapshot = await getUserPreferenceSnapshot(req.userId);
      if (snapshot) {
        const proposalById = new Map(proposalDocs.map((doc) => [String(doc._id ?? ""), doc]));
        const rankingInput = items.map((item) => {
          const proposal = proposalById.get(item.id);
          return {
            id: item.id,
            topic: proposal?.topic ?? item.category,
            topicTags: item.topicTags,
            level: item.level,
            createdAt: proposal?.createdAt ?? null,
            importance: typeof proposal?.importance === "number" ? proposal.importance : null,
            socialSignals: {
              interactions: item.eventualitiesCount,
            },
          };
        });
        const ranked = getPersonalizedStartItems(snapshot, rankingInput, rankingInput.length);
        const scoreById = new Map(ranked.map((entry) => [entry.item.id, entry.score.totalScore]));
        items = [...items].sort((a, b) => (scoreById.get(b.id) ?? 0) - (scoreById.get(a.id) ?? 0));
      }
    } catch (error) {
      console.error("[swipes] personalization ranking failed", error);
    }
  }

  if (fromDraftId && items.length === 0) {
    return { items: [], nextCursor: null };
  }

  if (items.length === 0) {
    if (!allowSeedFallback) {
      return { items: [], nextCursor: null };
    }
    const seed = filterSwipeSeedItems(req.filter);
    return { items: seed, nextCursor: null };
  }

  return { items, nextCursor: null };
}

export async function getEventualitiesForStatement(req: EventualitiesRequest): Promise<EventualitiesResponse> {
  if (req.statementId.startsWith("seed-")) {
    return {
      statementId: req.statementId,
      eventualities: getSwipeSeedEventualities(req.statementId),
    };
  }
  try {
    const col = await eventualityNodesCol();
    const nodes = await col
      .find<EventualityNodeDoc>({ statementId: req.statementId })
      .sort({ createdAt: 1 })
      .toArray();
    const eventualities: Eventuality[] = nodes.map((doc) => ({
      id: doc.nodeId,
      title: doc.payload?.label ?? "Eventualität",
      description: doc.payload?.narrative ?? undefined,
    }));
    return { statementId: req.statementId, eventualities };
  } catch (error) {
    console.error("[swipes] eventualities unavailable", error);
    return { statementId: req.statementId, eventualities: [] };
  }
}

export async function recordSwipeVote(payload: SwipeVotePayload): Promise<void> {
  const normalizedPayload = normalizeSwipeVotePayload(payload);
  const now = new Date();
  const col = await swipeVotesCol();
  const write = await col.updateOne(
    {
      userId: normalizedPayload.userId,
      statementId: normalizedPayload.statementId,
      eventualityId: normalizedPayload.eventualityId ?? null,
      source: normalizedPayload.source,
    },
    {
      $set: {
        decision: normalizedPayload.decision,
        neutralReason: normalizedPayload.decision === "neutral" ? normalizedPayload.neutralReason ?? null : null,
        variantWeight: normalizedPayload.variantWeight ?? null,
        variantReason: normalizedPayload.variantReason?.trim() ? normalizedPayload.variantReason.trim() : null,
        variantRankedIds: normalizedPayload.variantRankedIds?.length ? normalizedPayload.variantRankedIds : null,
        excludedEventualityIds: normalizedPayload.excludedEventualityIds?.length
          ? normalizedPayload.excludedEventualityIds
          : null,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  if (write.upsertedId && normalizedPayload.source === "swipes") {
    try {
      const votesForStatement = await col.countDocuments({
        userId: normalizedPayload.userId,
        statementId: normalizedPayload.statementId,
        source: "swipes",
      });
      if (votesForStatement === 1) {
        await applySwipeProgressForVote({
          userId: normalizedPayload.userId,
          statementId: normalizedPayload.statementId,
          decision: normalizedPayload.decision,
          now,
        });
      }
    } catch {
      console.error("[swipes] progress update failed");
    }
  }
  try {
    await recordSwipeVoteInGraph(normalizedPayload);
  } catch (err) {
    console.error("[swipes] graph integration failed", err);
  }
}

export async function removeSwipeVotesForStatement(userId: string, statementId: string): Promise<void> {
  const col = await swipeVotesCol();
  await col.deleteMany({
    userId,
    statementId,
    source: "swipes",
  });
}
