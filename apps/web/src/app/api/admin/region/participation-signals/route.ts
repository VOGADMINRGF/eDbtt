import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import {
  buildPersistedRegionAccessContext,
  canReviewRegionSignal,
  getOperationalRegionById,
  listOperationalRegions,
  listParticipationSignalsForReviewRuntime,
} from "@features/region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z
  .object({
    regionId: z.string().trim().min(1).optional(),
    reviewStatus: z
      .enum([
        "all",
        "draft",
        "needs_review",
        "needs_region_review",
        "accepted",
        "rejected",
        "archived",
        "revoked",
      ])
      .optional(),
    needsRegionReview: z.enum(["true", "false"]).optional(),
  })
  .strict();

async function buildAccessContext(params: {
  gate: Awaited<ReturnType<typeof requireGovernanceActorOrResponse>>;
  regionId: string;
}) {
  if (params.gate instanceof Response) return null;
  return buildPersistedRegionAccessContext({
    userId: params.gate.actor.userId,
    actorRole: params.gate.actor.role,
    isAdmin: params.gate.actor.isAdmin,
    roles: params.gate.roles,
    organizationIds: params.gate.actor.scopedOwnerIds,
    regionId: params.regionId,
  });
}

export async function GET(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = QuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams.entries()),
  );

  let resolvedRegionId: string | null = null;
  if (parsed.regionId) {
    const region = await getOperationalRegionById(parsed.regionId);
    if (!region) {
      return NextResponse.json({ ok: false, error: "region_not_found" }, { status: 404 });
    }
    resolvedRegionId = region.id;
  }

  if (!gate.actor.isAdmin) {
    if (!resolvedRegionId) {
      return NextResponse.json(
        { ok: false, error: "region_review_forbidden" },
        { status: 403 },
      );
    }
    const accessContext = await buildAccessContext({ gate, regionId: resolvedRegionId });
    if (!accessContext || !canReviewRegionSignal(accessContext, resolvedRegionId)) {
      return NextResponse.json(
        { ok: false, error: "region_review_forbidden" },
        { status: 403 },
      );
    }
  }

  const regions = await listOperationalRegions();
  const signals = await listParticipationSignalsForReviewRuntime({
    regions,
    query: {
      regionId: resolvedRegionId,
      reviewStatus: parsed.reviewStatus ?? "all",
      needsRegionReview:
        parsed.needsRegionReview === "true"
          ? true
          : parsed.needsRegionReview === "false"
            ? false
            : null,
    },
  });

  return NextResponse.json({
    ok: true,
    signals: signals.map((signal) => ({
      id: signal.id,
      regionId: signal.regionId,
      proposedRegionId: signal.proposedRegionId,
      needsRegionReview: signal.needsRegionReview,
      sourceType: signal.sourceType,
      title: signal.publicSafeTitle ?? signal.title,
      summary: signal.publicSafeSummary ?? signal.summary,
      detectedTopics: signal.detectedTopics,
      detectedPlaces: signal.detectedPlaces,
      aggregationMode: signal.aggregationMode,
      privacyMode: signal.privacyMode,
      reviewStatus: signal.reviewStatus,
      confidence: signal.confidence,
      reviewedAt: signal.reviewedAt,
      noPersonalProfiling: signal.noPersonalProfiling,
      noPoliticalScoring: signal.noPoliticalScoring,
      noRepresentativeClaim: signal.noRepresentativeClaim,
    })),
  });
}
