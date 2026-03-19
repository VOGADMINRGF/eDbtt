import { NextRequest, NextResponse } from "next/server";
import type { FeedReviewState, VoteDraftStatus } from "@features/feeds/types";
import { listLegacyVoteDraftsWithoutAnlassraumAuthorized } from "@features/feeds/reviewQueue";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import { statusForFeedReviewError } from "../reviewErrors";

export async function GET(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const params = req.nextUrl.searchParams;
  const limit = Number(params.get("limit") ?? 100);
  const status = normalizeStatus(params.get("status"));
  const reviewState = normalizeReviewState(params.get("reviewState"));

  if (!Number.isFinite(limit) || limit < 1 || limit > 200) {
    return NextResponse.json({ ok: false, error: "invalid_limit" }, { status: 400 });
  }

  try {
    const items = await listLegacyVoteDraftsWithoutAnlassraumAuthorized({
      actor: gate.actor,
      limit,
      status,
      reviewState,
    });

    return NextResponse.json({
      ok: true,
      items,
      total: items.length,
      filters: {
        status,
        reviewState,
        limit,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "legacy_list_failed";
    return NextResponse.json({ ok: false, error: message }, { status: statusForFeedReviewError(message) });
  }
}

function normalizeStatus(value: string | null): VoteDraftStatus | "all" {
  const normalized = String(value || "all").toLowerCase();
  if (normalized === "draft" || normalized === "review" || normalized === "published" || normalized === "discarded") {
    return normalized;
  }
  return "all";
}

function normalizeReviewState(value: string | null): FeedReviewState | "all" {
  const normalized = String(value || "all").toLowerCase();
  if (
    normalized === "queued" ||
    normalized === "ignored" ||
    normalized === "attached" ||
    normalized === "candidate_created" ||
    normalized === "weak_signal"
  ) {
    return normalized;
  }
  return "all";
}
