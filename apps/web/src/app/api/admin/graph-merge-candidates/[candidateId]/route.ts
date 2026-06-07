import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  applyGraphMergeCandidateAction,
  confirmProductiveGraphMerge,
  GRAPH_MERGE_CANDIDATE_ACTIONS,
  prepareProductiveGraphMerge,
  revertProductiveGraphMerge,
} from "@features/graphMergeCandidates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z
  .object({
    action: z.enum(GRAPH_MERGE_CANDIDATE_ACTIONS),
    note: z.string().trim().min(1).optional(),
  })
  .strict();

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      candidateId: string;
    }>;
  },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const requestedByUserId = gate?._id?.toHexString?.() ?? "";
  if (!requestedByUserId) {
    return NextResponse.json({ ok: false, error: "admin_user_id_missing" }, { status: 400 });
  }

  try {
    const body = BodySchema.parse(await req.json());
    const params = await context.params;
    const candidateId = decodeURIComponent(String(params.candidateId ?? "").trim());
    const result =
      body.action === "prepare_productive_merge"
        ? await prepareProductiveGraphMerge({
            candidateId,
            requestedByUserId,
            note: body.note ?? null,
          })
        : body.action === "confirm_productive_merge"
          ? await confirmProductiveGraphMerge(
              candidateId,
              { userId: requestedByUserId, isAdmin: true },
              { overrideReason: body.note ?? null },
            )
          : body.action === "revert_productive_merge"
            ? await revertProductiveGraphMerge(
                candidateId,
                { userId: requestedByUserId, isAdmin: true },
                { note: body.note ?? null },
              )
            : await applyGraphMergeCandidateAction({
                candidateId,
                action: body.action,
                requestedByUserId,
                note: body.note ?? null,
              });
    return NextResponse.json({
      ok: true,
      candidate: result.candidate,
      historyEntry: result.historyEntry,
      auditEntries: result.auditEntries ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "graph_merge_candidate_action_failed";
    const status =
      message === "graph_merge_candidate_not_found"
        ? 404
        : message === "graph_merge_candidate_invalid_transition" ||
            message === "graph_merge_candidate_staging_blocked_by_source_support" ||
            message === "graph_merge_candidate_blocked_source_open" ||
            message === "graph_merge_candidate_blocked_review_required" ||
            message === "graph_merge_candidate_blocked_duplicate_unresolved" ||
            message === "graph_merge_candidate_blocked_missing_admin" ||
            message === "graph_merge_candidate_blocked_truth_guard" ||
            message === "graph_merge_candidate_override_required"
          ? 409
        : message === "graph_merge_candidate_note_required"
          ? 400
          : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
