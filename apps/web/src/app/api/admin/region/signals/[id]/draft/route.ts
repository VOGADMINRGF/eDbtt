import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import {
  buildPersistedRegionAccessContext,
  createRegionSignalDraft,
} from "@features/region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DraftBodySchema = z
  .object({
    regionId: z.string().trim().min(1),
    target: z.enum(["dossier", "anlassraum"]),
    title: z.string().trim().min(1).optional(),
    summary: z.string().trim().min(1).optional(),
    openQuestions: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

async function buildAccessContextFromRuntime(
  gate: Awaited<ReturnType<typeof requireGovernanceActorOrResponse>>,
) {
  if (gate instanceof Response) return null;
  return buildPersistedRegionAccessContext({
    userId: gate.actor.userId,
    actorRole: gate.actor.role,
    isAdmin: gate.actor.isAdmin,
    roles: gate.roles,
    organizationIds: gate.actor.scopedOwnerIds,
  });
}

function statusForBlockedReason(reason: string | undefined) {
  switch (reason) {
    case "signal_not_found":
      return 404;
    case "missing_permission":
    case "wrong_region":
      return 403;
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

  try {
    const body = DraftBodySchema.parse(await req.json());
    const { id } = await params;
    const accessContext = await buildAccessContextFromRuntime(gate);
    if (!accessContext) {
      return NextResponse.json({ ok: false, error: "missing_access_context" }, { status: 400 });
    }

    const result = await createRegionSignalDraft({
      signalId: id,
      regionId: body.regionId,
      target: body.target,
      accessContext,
      requestedBy: gate.actor.userId,
      title: body.title,
      summary: body.summary,
      openQuestions: body.openQuestions,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          blockedReason: result.blockedReason,
          draftType: result.draftType,
          reviewStatus: result.reviewStatus,
          guardrails: result.guardrails,
        },
        { status: statusForBlockedReason(result.blockedReason) },
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "region_signal_draft_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
