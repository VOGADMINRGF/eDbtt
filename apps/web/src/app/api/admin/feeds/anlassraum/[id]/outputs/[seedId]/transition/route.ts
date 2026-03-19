import { NextRequest, NextResponse } from "next/server";
import {
  OUTPUT_PREP_ACTIONS,
  transitionOutputSeedAuthorized,
  type OutputPrepAction,
} from "@features/anlassraum/outputPrep";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import { statusForOutputPrepError } from "../../../../outputPrepErrors";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; seedId: string }> },
) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const { id, seedId } = await context.params;
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    publishTarget?: string;
    reviewNote?: string;
  };

  const action = String(body.action || "").toLowerCase();
  if (!isOutputPrepAction(action)) {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  try {
    const result = await transitionOutputSeedAuthorized({
      anlassraumId: id,
      seedId,
      action,
      actor: gate.actor,
      publishTarget: body.publishTarget,
      reviewNote: body.reviewNote,
    });

    return NextResponse.json({
      ok: true,
      seed: {
        id: result.seed._id?.toHexString?.() ?? "",
        anlassraumId: result.seed.anlassraumId?.toHexString?.() ?? "",
        outputType: result.seed.outputType,
        status: result.seed.status,
        reviewState: result.seed.reviewState,
        publishTarget: result.seed.publishTarget ?? null,
        reviewNote: result.seed.reviewNote ?? null,
        lastAction: result.seed.lastAction ?? null,
        lastActionBy: result.seed.lastActionBy ?? null,
        lastActionAt: result.seed.lastActionAt?.toISOString?.() ?? null,
        updatedAt: result.seed.updatedAt?.toISOString?.() ?? null,
      },
      publishGate: result.publishGate,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "output_seed_transition_failed";
    return NextResponse.json({ ok: false, error: message }, { status: statusForOutputPrepError(message) });
  }
}

function isOutputPrepAction(value: string): value is OutputPrepAction {
  return OUTPUT_PREP_ACTIONS.includes(value as OutputPrepAction);
}
