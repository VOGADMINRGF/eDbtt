import { NextRequest, NextResponse } from "next/server";
import {
  listOutputSeedsAuthorized,
} from "@features/anlassraum/outputPrep";
import {
  OUTPUT_SEED_REVIEW_STATES,
  OUTPUT_SEED_STATUSES,
  OUTPUT_SEED_TYPES,
  type OutputSeedReviewState,
  type OutputSeedStatus,
  type OutputSeedType,
} from "@features/anlassraum/types";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import { statusForOutputPrepError } from "../../outputPrepErrors";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const { id } = await context.params;
  const params = req.nextUrl.searchParams;
  const limit = Number(params.get("limit") ?? 120);
  if (!Number.isFinite(limit) || limit < 1 || limit > 200) {
    return NextResponse.json({ ok: false, error: "invalid_limit" }, { status: 400 });
  }

  const status = normalizeStatus(params.get("status"));
  if (!status) {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }

  const outputType = normalizeOutputType(params.get("outputType"));
  if (!outputType) {
    return NextResponse.json({ ok: false, error: "invalid_output_type" }, { status: 400 });
  }

  const reviewState = normalizeReviewState(params.get("reviewState"));
  if (!reviewState) {
    return NextResponse.json({ ok: false, error: "invalid_review_state" }, { status: 400 });
  }

  try {
    const result = await listOutputSeedsAuthorized({
      anlassraumId: id,
      actor: gate.actor,
      status,
      outputType,
      reviewState,
      limit,
    });

    return NextResponse.json({
      ok: true,
      anlassraum: {
        id: result.anlassraum._id?.toHexString?.() ?? "",
        title: result.anlassraum.title,
        status: result.anlassraum.status,
      },
      items: result.items.map((seed) => ({
        id: seed._id?.toHexString?.() ?? "",
        outputType: seed.outputType,
        status: seed.status,
        reviewState: seed.reviewState,
        targetRegion: seed.targetRegion ?? null,
        targetAudience: seed.targetAudience ?? null,
        publishTarget: seed.publishTarget ?? null,
        reviewNote: seed.reviewNote ?? null,
        lastAction: seed.lastAction ?? null,
        lastActionBy: seed.lastActionBy ?? null,
        lastActionAt: seed.lastActionAt?.toISOString?.() ?? null,
        createdAt: seed.createdAt?.toISOString?.() ?? null,
        updatedAt: seed.updatedAt?.toISOString?.() ?? null,
      })),
      publishGate: result.publishGate,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "output_seed_list_failed";
    return NextResponse.json({ ok: false, error: message }, { status: statusForOutputPrepError(message) });
  }
}

function normalizeStatus(value: string | null): OutputSeedStatus | "all" | null {
  const normalized = String(value || "all").toLowerCase();
  if (normalized === "all") return "all";
  if (OUTPUT_SEED_STATUSES.includes(normalized as OutputSeedStatus)) {
    return normalized as OutputSeedStatus;
  }
  return null;
}

function normalizeOutputType(value: string | null): OutputSeedType | "all" | null {
  const normalized = String(value || "all").toLowerCase();
  if (normalized === "all") return "all";
  if (OUTPUT_SEED_TYPES.includes(normalized as OutputSeedType)) {
    return normalized as OutputSeedType;
  }
  return null;
}

function normalizeReviewState(value: string | null): OutputSeedReviewState | "all" | null {
  const normalized = String(value || "all").toLowerCase();
  if (normalized === "all") return "all";
  if (OUTPUT_SEED_REVIEW_STATES.includes(normalized as OutputSeedReviewState)) {
    return normalized as OutputSeedReviewState;
  }
  return null;
}
