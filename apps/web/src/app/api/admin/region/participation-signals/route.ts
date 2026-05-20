import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import {
  canReviewRegionSignal,
  canViewRegionResource,
  getOperationalRegionById,
  listOperationalRegions,
  listParticipationSignalsForReviewRuntime,
  regionScopeFromRegionAccessContext,
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
  regionId?: string | null;
}) {
  if (params.gate instanceof Response) return null;
  const accessContext = params.gate.requestScope.regionAccess;
  return {
    accessContext,
    scope: regionScopeFromRegionAccessContext({ accessContext }),
  };
}

export async function GET(req: NextRequest) {
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
  const gate = await requireGovernanceActorOrResponse(req, { regionId: resolvedRegionId });
  if (gate instanceof Response) return gate;

  if (!gate.actor.isAdmin) {
    if (!resolvedRegionId) {
      return NextResponse.json(
        { ok: false, error: "region_review_forbidden" },
        { status: 403 },
      );
    }
    const scoped = await buildAccessContext({ gate, regionId: resolvedRegionId });
    if (
      !scoped ||
      !canViewRegionResource(scoped.scope, { regionId: resolvedRegionId }) ||
      !canReviewRegionSignal(scoped.accessContext, resolvedRegionId)
    ) {
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
  const scoped = gate.actor.isAdmin ? null : await buildAccessContext({ gate, regionId: resolvedRegionId });
  const filteredSignals = signals.filter((signal) =>
    gate.actor.isAdmin ||
    (scoped &&
      canViewRegionResource(scoped.scope, {
        regionId: signal.regionId ?? signal.proposedRegionId ?? null,
      })),
  );

  return NextResponse.json({
    ok: true,
    requestScope: {
      isOperatorMode: gate.requestScope.isOperatorMode,
      operatorModeLabel: gate.requestScope.operatorModeLabel,
      organizationId: gate.requestScope.organizationId,
      regionIds: gate.requestScope.regionIds,
    },
    signals: filteredSignals.map((signal) => ({
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
      visibilityState: signal.visibilityState,
      confidence: signal.confidence,
      reviewedAt: signal.reviewedAt,
      noPersonalProfiling: signal.noPersonalProfiling,
      noPoliticalScoring: signal.noPoliticalScoring,
      noRepresentativeClaim: signal.noRepresentativeClaim,
    })),
  });
}
