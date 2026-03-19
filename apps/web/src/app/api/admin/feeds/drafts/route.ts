import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { voteDraftsCol } from "@features/feeds/db";
import type { FeedReviewState, VoteDraftDoc } from "@features/feeds/types";
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
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const pageSize = Math.max(1, Math.min(100, Number(params.get("pageSize") ?? 20)));
  const skip = (page - 1) * pageSize;

  const filter: Record<string, any> = {};
  if (status !== "all") {
    filter.status = status;
  }
  if (regionCode !== "ALL") {
    if (regionCode === "GLOBAL") {
      filter.$or = [
        { regionCode: { $exists: false } },
        { regionCode: null },
        { regionCode: "" },
      ];
    } else {
      filter.regionCode = regionCode;
    }
  }
  if (reviewState !== "all" && isFeedReviewState(reviewState)) {
    filter.feedReviewState = reviewState;
  }

  const drafts = await voteDraftsCol();
  const items = await drafts.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).toArray();

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
        createdAt: draft.createdAt?.toISOString?.() ?? null,
        analyzeCompletedAt: draft.analyzeCompletedAt?.toISOString?.() ?? null,
      };
    }),
  );

  return NextResponse.json({
    ok: true,
    items: summaries,
    page,
    pageSize,
    total: summaries.length,
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
