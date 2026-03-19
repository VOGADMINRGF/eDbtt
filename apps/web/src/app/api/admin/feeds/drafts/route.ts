import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { voteDraftsCol } from "@features/feeds/db";
import type { FeedReviewState, VoteDraftDoc } from "@features/feeds/types";
import {
  FEED_REVIEW_QUEUE_SORTS,
  buildFeedQueueMeta,
  type FeedQueueLinkFilter,
  type FeedQueueWeakSignalFilter,
  type FeedReviewQueueSort,
} from "@features/feeds/reviewQueue";
import { anlassraumCol } from "@features/anlassraum/db";
import { canActorAccessAnlassraum } from "@features/anlassraum/governance";
import { getRegionName } from "@core/regions/regionTranslations";
import { formatObjectId } from "../utils";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";

export async function GET(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const params = req.nextUrl.searchParams;
  const status = (params.get("status") || "all").toLowerCase();
  const regionCode = (params.get("regionCode") || "all").toUpperCase();
  const reviewState = (params.get("reviewState") || "all").toLowerCase();
  const hasAnlassraum = normalizeHasAnlassraum(params.get("hasAnlassraum"));
  const weakSignal = normalizeWeakSignalFilter(params.get("weakSignal"));
  const sort = normalizeSort(params.get("sort"));
  const query = String(params.get("q") || "").trim();
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const pageSize = Math.max(1, Math.min(100, Number(params.get("pageSize") ?? 20)));
  const skip = (page - 1) * pageSize;

  const conditions: Record<string, any>[] = [];
  if (status !== "all") {
    conditions.push({ status });
  }
  if (regionCode !== "ALL") {
    if (regionCode === "GLOBAL") {
      conditions.push({
        $or: [
          { regionCode: { $exists: false } },
          { regionCode: null },
          { regionCode: "" },
        ],
      });
    } else {
      conditions.push({ regionCode });
    }
  }
  if (reviewState !== "all" && isFeedReviewState(reviewState)) {
    conditions.push({ feedReviewState: reviewState });
  }
  if (hasAnlassraum === "linked") {
    conditions.push({ anlassraumId: { $exists: true, $ne: null } });
  } else if (hasAnlassraum === "unlinked") {
    conditions.push({
      $or: [
        { anlassraumId: { $exists: false } },
        { anlassraumId: null },
      ],
    });
  }
  if (weakSignal === "flagged") {
    conditions.push({ "weakSignal.flagged": true });
  } else if (weakSignal === "clear") {
    conditions.push({
      $or: [
        { weakSignal: { $exists: false } },
        { weakSignal: null },
        { "weakSignal.flagged": { $ne: true } },
      ],
    });
  }
  if (query) {
    const searchPattern = buildQueryRegex(query);
    conditions.push({
      $or: [
        { title: searchPattern },
        { summary: searchPattern },
        { sourceUrl: searchPattern },
      ],
    });
  }

  const filter: Record<string, any> = conditions.length ? { $and: conditions } : {};
  const drafts = await voteDraftsCol();
  const matchedTotal = await drafts.countDocuments(filter);
  const items = await drafts
    .find(filter)
    .sort(sortToMongo(sort))
    .skip(skip)
    .limit(pageSize)
    .toArray();

  const roomIds = items
    .map((draft) => draft.anlassraumId)
    .filter(Boolean) as ObjectId[];
  const roomMap = new Map<string, any>();
  if (roomIds.length) {
    const rooms = await (await anlassraumCol())
      .find({ _id: { $in: roomIds } })
      .toArray();
    for (const room of rooms) {
      if (!room?._id) continue;
      roomMap.set(room._id.toHexString(), room);
    }
  }

  const visibleItems = items.filter((draft) => {
    const anlassraumId = draft.anlassraumId?.toHexString?.() ?? "";
    if (!anlassraumId) {
      return gate.actor.role !== "institutional_actor";
    }
    const room = roomMap.get(anlassraumId);
    if (!room) return gate.actor.role !== "institutional_actor";
    return canActorAccessAnlassraum(room, gate.actor, "read");
  });

  const summaries = await Promise.all(
    visibleItems.map(async (draft) => {
      const anlassraumId = formatObjectId(draft.anlassraumId ?? null) || null;
      const queueMeta = buildFeedQueueMeta(draft);
      return {
        id: formatObjectId(draft._id),
        anlassraumId,
        title: draft.title,
        status: draft.status,
        regionCode: draft.regionCode ?? null,
        regionName: await resolveRegionName(draft.regionCode),
        sourceUrl: draft.sourceUrl ?? null,
        pipeline: draft.pipeline ?? "feeds_to_statementCandidate",
        feedReviewState: draft.feedReviewState ?? "queued",
        weakSignal: draft.weakSignal
          ? {
              flagged: !!draft.weakSignal.flagged,
              reason: draft.weakSignal.reason ?? null,
            }
          : null,
        reviewNote: draft.reviewNote ?? null,
        lastReviewAction: draft.lastReviewAction ?? null,
        lastReviewActionBy: draft.lastReviewActionBy ?? null,
        lastReviewActionAt: draft.lastReviewActionAt?.toISOString?.() ?? null,
        queueMeta,
        createdAt: draft.createdAt?.toISOString?.() ?? null,
        analyzeCompletedAt: draft.analyzeCompletedAt?.toISOString?.() ?? null,
      };
    }),
  );

  if (sort === "priority_high") {
    summaries.sort((a, b) => {
      const scoreDiff = (b.queueMeta?.priorityScore ?? 0) - (a.queueMeta?.priorityScore ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      const pendingDiff = (b.queueMeta?.pendingHours ?? 0) - (a.queueMeta?.pendingHours ?? 0);
      if (pendingDiff !== 0) return pendingDiff;
      return String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
    });
  }

  return NextResponse.json({
    ok: true,
    items: summaries,
    page,
    pageSize,
    total: summaries.length,
    matchedTotal,
    sort,
    filters: {
      status,
      regionCode,
      reviewState,
      hasAnlassraum,
      weakSignal,
      query: query || null,
    },
    triage: {
      linkedCount: summaries.filter((item) => !!item.anlassraumId).length,
      unlinkedCount: summaries.filter((item) => !item.anlassraumId).length,
      weakSignalCount: summaries.filter((item) => !!item.weakSignal?.flagged).length,
      highPriorityCount: summaries.filter((item) => item.queueMeta?.priorityBucket === "high").length,
    },
  });
}

async function resolveRegionName(regionCode?: VoteDraftDoc["regionCode"]) {
  if (!regionCode) return "Global / Offen";
  try {
    const name = await getRegionName(regionCode, "de");
    return name ?? String(regionCode);
  } catch {
    return String(regionCode);
  }
}

function isFeedReviewState(value: string): value is FeedReviewState {
  return (
    value === "queued" ||
    value === "ignored" ||
    value === "attached" ||
    value === "candidate_created" ||
    value === "weak_signal"
  );
}

function normalizeHasAnlassraum(value: string | null): FeedQueueLinkFilter {
  const normalized = String(value || "all").toLowerCase();
  if (normalized === "linked" || normalized === "unlinked") return normalized;
  return "all";
}

function normalizeWeakSignalFilter(value: string | null): FeedQueueWeakSignalFilter {
  const normalized = String(value || "all").toLowerCase();
  if (normalized === "flagged" || normalized === "clear") return normalized;
  return "all";
}

function normalizeSort(value: string | null): FeedReviewQueueSort {
  const normalized = String(value || "newest").toLowerCase();
  if (FEED_REVIEW_QUEUE_SORTS.includes(normalized as FeedReviewQueueSort)) {
    return normalized as FeedReviewQueueSort;
  }
  return "newest";
}

function sortToMongo(sort: FeedReviewQueueSort): Record<string, 1 | -1> {
  if (sort === "oldest") return { createdAt: 1 };
  if (sort === "review_recent") return { lastReviewActionAt: -1, createdAt: -1 };
  if (sort === "review_stale") return { lastReviewActionAt: 1, createdAt: 1 };
  return { createdAt: -1 };
}

function buildQueryRegex(value: string): RegExp {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 120);
  return new RegExp(escaped, "i");
}
