import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import {
  canApprovePublication,
  canReviewRegionSignal,
  canViewRegionResource,
  getOperationalRegionById,
  getParticipationSignalReviewRuntimeRepo,
  listOperationalRegions,
  regionScopeFromRegionAccessContext,
  syncParticipationSignalRecords,
} from "@features/region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ReviewBodySchema = z
  .object({
    decision: z.enum([
      "accept",
      "reject",
      "archive",
      "request_region_review",
      "confirm_region",
      "revoke",
      "restore_to_review",
      "approve_official",
      "revoke_official",
    ]),
    regionId: z.string().trim().min(1).optional(),
    note: z.string().trim().min(1).optional(),
  })
  .strict();

async function buildAccessContext(params: {
  gate: Awaited<ReturnType<typeof requireGovernanceActorOrResponse>>;
  regionId: string;
}) {
  if (params.gate instanceof Response) return null;
  const accessContext = params.gate.requestScope.regionAccess;
  return {
    accessContext,
    scope: regionScopeFromRegionAccessContext({ accessContext }),
  };
}

function statusForBlockedReason(reason: string | null | undefined) {
  switch (reason) {
    case "signal_not_found":
      return 404;
    case "public_signal_region_unconfirmed":
    case "public_signal_privacy_restricted":
    case "official_publication_requires_accepted_review":
    case "invalid_decision":
      return 400;
    default:
      return 400;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = ReviewBodySchema.parse(await req.json());
  const { id } = await params;
  const regions = await listOperationalRegions();
  await syncParticipationSignalRecords(regions);
  const repo = getParticipationSignalReviewRuntimeRepo();
  const existing = await repo.getParticipationSignalRecordById(id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "signal_not_found" }, { status: 404 });
  }
  const targetRegionId = body.regionId ?? existing.regionId ?? existing.proposedRegionId ?? null;
  const resolvedTargetRegion = targetRegionId ? await getOperationalRegionById(targetRegionId) : null;
  if (targetRegionId && !resolvedTargetRegion) {
    return NextResponse.json({ ok: false, error: "region_not_found" }, { status: 404 });
  }
  const gate = await requireGovernanceActorOrResponse(req, {
    regionId: resolvedTargetRegion?.id ?? null,
  });
  if (gate instanceof Response) return gate;

  if (!gate.actor.isAdmin) {
    if (!resolvedTargetRegion?.id) {
      return NextResponse.json({ ok: false, error: "region_review_forbidden" }, { status: 403 });
    }
    const scoped = await buildAccessContext({ gate, regionId: resolvedTargetRegion.id });
    const hasReviewAccess =
      scoped &&
      canViewRegionResource(scoped.scope, { regionId: resolvedTargetRegion.id }) &&
      canReviewRegionSignal(scoped.accessContext, resolvedTargetRegion.id);
    const hasPublicationApprovalAccess =
      scoped &&
      canViewRegionResource(scoped.scope, { regionId: resolvedTargetRegion.id }) &&
      canApprovePublication(scoped.accessContext, resolvedTargetRegion.id);
    const requiresPublicationApproval =
      body.decision === "approve_official" || body.decision === "revoke_official";
    if (
      !scoped ||
      (requiresPublicationApproval
        ? !hasPublicationApprovalAccess
        : !hasReviewAccess)
    ) {
      return NextResponse.json({ ok: false, error: "region_review_forbidden" }, { status: 403 });
    }
  }

  const regionId = body.regionId ? resolvedTargetRegion?.id ?? null : null;

  const result =
    body.decision === "approve_official"
      ? await repo.approveParticipationSignalOfficialPublication({
          signalId: id,
          approvedBy: gate.actor.userId,
          authority: gate.actor.isAdmin ? "admin_fallback" : "publication_approved",
          note: body.note ?? null,
        })
      : body.decision === "revoke_official"
        ? await repo.revokeParticipationSignalOfficialPublication(
            id,
            gate.actor.userId,
            body.note ?? null,
          )
        : await repo.reviewParticipationSignal({
            signalId: id,
            decision: body.decision,
            regionId,
            reviewedBy: gate.actor.userId,
            note: body.note ?? null,
          });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, blockedReason: result.blockedReason },
      { status: statusForBlockedReason(result.blockedReason) },
    );
  }

  return NextResponse.json({
    ok: true,
    record: result.record,
    review: result.review,
    requestScope: {
      isOperatorMode: gate.requestScope.isOperatorMode,
      operatorModeLabel: gate.requestScope.operatorModeLabel,
      organizationId: gate.requestScope.organizationId,
      regionIds: gate.requestScope.regionIds,
    },
  });
}
