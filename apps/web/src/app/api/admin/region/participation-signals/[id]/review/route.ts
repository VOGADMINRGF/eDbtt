import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import {
  buildPersistedRegionAccessContext,
  canReviewRegionSignal,
  getOperationalRegionById,
  getParticipationSignalReviewRuntimeRepo,
  listOperationalRegions,
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
  return buildPersistedRegionAccessContext({
    userId: params.gate.actor.userId,
    actorRole: params.gate.actor.role,
    isAdmin: params.gate.actor.isAdmin,
    roles: params.gate.roles,
    organizationIds: params.gate.actor.scopedOwnerIds,
    regionId: params.regionId,
  });
}

function statusForBlockedReason(reason: string | null | undefined) {
  switch (reason) {
    case "signal_not_found":
      return 404;
    case "public_signal_region_unconfirmed":
    case "public_signal_privacy_restricted":
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
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const body = ReviewBodySchema.parse(await req.json());
  const { id } = await params;
  const regions = await listOperationalRegions();
  await syncParticipationSignalRecords(regions);
  const repo = getParticipationSignalReviewRuntimeRepo();
  const existing = await repo.getParticipationSignalRecordById(id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "signal_not_found" }, { status: 404 });
  }

  if (!gate.actor.isAdmin) {
    const targetRegion =
      body.regionId ?? existing.regionId ?? existing.proposedRegionId ?? null;
    if (!targetRegion) {
      return NextResponse.json({ ok: false, error: "region_review_forbidden" }, { status: 403 });
    }
    const region = await getOperationalRegionById(targetRegion);
    if (!region) {
      return NextResponse.json({ ok: false, error: "region_not_found" }, { status: 404 });
    }
    const accessContext = await buildAccessContext({ gate, regionId: region.id });
    if (!accessContext || !canReviewRegionSignal(accessContext, region.id)) {
      return NextResponse.json({ ok: false, error: "region_review_forbidden" }, { status: 403 });
    }
  }

  const regionId = body.regionId
    ? ((await getOperationalRegionById(body.regionId))?.id ?? null)
    : null;
  if (body.regionId && !regionId) {
    return NextResponse.json({ ok: false, error: "region_not_found" }, { status: 404 });
  }

  const result = await repo.reviewParticipationSignal({
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
  });
}
