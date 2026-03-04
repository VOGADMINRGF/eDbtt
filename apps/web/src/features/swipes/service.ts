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
import { recordSwipeVoteInGraph } from "@/features/graph/swipes";
import { getCol } from "@core/db/triMongo";
import { eventualityNodesCol } from "@core/eventualities/db";
import type { EventualityNodeDoc } from "@core/eventualities/types";

type ProposalDoc = {
  _id?: any;
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
  source: "swipes";
  createdAt: Date;
  updatedAt: Date;
};

function deriveScopeLevel(responsibility?: string | null): SwipeItem["level"] {
  const value = (responsibility ?? "").toLowerCase();
  if (value.includes("eu")) return "EU";
  if (value.includes("kommune") || value.includes("stadt") || value.includes("gemeinde")) return "Kommune";
  if (value.includes("land") || value.includes("bundesland")) return "Land";
  return "Bund";
}

function mapProposalToSwipe(proposal: ProposalDoc): SwipeItem {
  const responsibility = proposal.responsibility ?? "Zuständigkeit offen";
  const topic = proposal.topic ?? "";
  const title = proposal.title || proposal.text.slice(0, 120);
  const scope = deriveScopeLevel(responsibility);
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

export async function getSwipeFeed(req: SwipeFeedRequest): Promise<SwipeFeedResponse> {
  // Filter rudimentär auf Basis der Mock-Daten
  const { filter } = req;
  const topicQuery = filter?.topicQuery?.toLowerCase() ?? "";
  const level = filter?.level;
  const statementId = filter?.statementId;

  const Proposals = await getCol<ProposalDoc>("statement_proposals");
  const proposalDocs = await Proposals.find({ status: { $in: ["proposed", null] } })
    .sort({ createdAt: -1 })
    .limit(req.limit ?? 20)
    .toArray();

  let items = proposalDocs.length > 0 ? proposalDocs.map(mapProposalToSwipe) : [];

  if (statementId) {
    items = items.filter((item) => item.id === statementId);
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

  return { items, nextCursor: null };
}

export async function getEventualitiesForStatement(req: EventualitiesRequest): Promise<EventualitiesResponse> {
  const col = await eventualityNodesCol();
  const nodes = await col
    .find<EventualityNodeDoc>({ statementId: req.statementId })
    .sort({ createdAt: 1 })
    .toArray();
  const eventualities: Eventuality[] = nodes.map((doc) => ({
    id: doc.nodeId,
    title: doc.payload?.label ?? "Eventualitaet",
    description: doc.payload?.narrative ?? undefined,
  }));
  return { statementId: req.statementId, eventualities };
}

export async function recordSwipeVote(payload: SwipeVotePayload): Promise<{ inserted: boolean }> {
  const now = new Date();
  const col = await swipeVotesCol();
  const result = await col.updateOne(
    {
      userId: payload.userId,
      statementId: payload.statementId,
      eventualityId: payload.eventualityId ?? null,
      source: payload.source,
    },
    {
      $set: {
        decision: payload.decision,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );
  try {
    await recordSwipeVoteInGraph(payload);
  } catch (err) {
    console.error("[swipes] graph integration failed", err);
  }
  return { inserted: Boolean(result.upsertedCount && result.upsertedCount > 0) };
}
