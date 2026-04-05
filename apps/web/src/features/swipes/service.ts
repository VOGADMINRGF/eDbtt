import type {
  EDebattePackage,
  SwipeFeedRequest,
  SwipeFeedResponse,
  SwipeItem,
  EventualitiesRequest,
  EventualitiesResponse,
  Eventuality,
  SwipeVotePayload,
  SwipeDecision,
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

type SwipeVoteDoc = {
  _id?: any;
  userId: string;
  statementId: string;
  eventualityId: string | null;
  decision: SwipeDecision;
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

  let proposalDocs: ProposalDoc[] = [];
  try {
    const Proposals = await getCol<ProposalDoc>("statement_proposals");
    proposalDocs = await Proposals.find({ status: { $in: ["proposed", null] } })
      .sort({ createdAt: -1 })
      .limit(req.limit ?? 20)
      .toArray();
  } catch (error) {
    if (fromDraftId) {
      // fromDraft arrival must not fabricate unrelated fallback cards.
      console.error("[swipes] proposal feed unavailable, preserving explicit fromDraft no-match", error);
      return { items: [], nextCursor: null };
    }
    console.error("[swipes] proposal feed unavailable, using seed fallback", error);
    return { items: filterSwipeSeedItems(req.filter), nextCursor: null };
  }

  let items = proposalDocs.length > 0 ? proposalDocs.map(mapProposalToSwipe) : [];

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
