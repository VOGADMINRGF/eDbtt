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
  const status = parseStatusFilter(params.get("status"));
  const reviewState = parseReviewStateFilter(params.get("reviewState"));

  if (!Number.isFinite(limit) || limit < 1 || limit > 200) {
    return NextResponse.json({ ok: false, error: "invalid_limit" }, { status: 400 });
  }
  if (!status.ok) {
    return NextResponse.json({ ok: false, error: "invalid_status_filter" }, { status: 400 });
  }
  if (!reviewState.ok) {
    return NextResponse.json({ ok: false, error: "invalid_review_state_filter" }, { status: 400 });
  }

  try {
    const items = await listLegacyVoteDraftsWithoutAnlassraumAuthorized({
      actor: gate.actor,
      limit,
      status: status.value,
      reviewState: reviewState.value,
    });

    return NextResponse.json({
      ok: true,
      items,
      total: items.length,
      filters: {
        status: status.value,
        reviewState: reviewState.value,
        limit,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "legacy_list_failed";
    return NextResponse.json({ ok: false, error: message }, { status: statusForFeedReviewError(message) });
  }
}

function parseStatusFilter(
  value: string | null,
): { ok: true; value: VoteDraftStatus | "all" } | { ok: false } {
  if (value === null || !String(value).trim()) return { ok: true, value: "all" };
  const normalized = String(value).toLowerCase();
  if (normalized === "draft" || normalized === "review" || normalized === "published" || normalized === "discarded") {
    return { ok: true, value: normalized };
  }
  return { ok: false };
}

function parseReviewStateFilter(
  value: string | null,
): { ok: true; value: FeedReviewState | "all" } | { ok: false } {
  if (value === null || !String(value).trim()) return { ok: true, value: "all" };
  const normalized = String(value).toLowerCase();
  if (
    normalized === "queued" ||
    normalized === "ignored" ||
    normalized === "attached" ||
    normalized === "candidate_created" ||
    normalized === "weak_signal"
  ) {
    return { ok: true, value: normalized };
  }
  return { ok: false };
}
