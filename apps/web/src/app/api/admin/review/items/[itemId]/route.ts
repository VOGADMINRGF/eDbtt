import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { buildReviewQueueReadModel } from "@features/reviewQueue";
import { applyReviewQueueOperation } from "@features/reviewQueueOperations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z
  .object({
    action: z.enum([
      "assign",
      "unassign",
      "add_note",
      "request_changes",
      "mark_in_review",
      "mark_ready",
      "archive",
      "block",
    ]),
    assignedToUserId: z.string().trim().min(1).optional(),
    note: z.string().trim().min(1).optional(),
  })
  .strict();

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      itemId: string;
    }>;
  },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const userId = gate?._id?.toHexString?.() ?? "";
  if (!userId) {
    return NextResponse.json({ ok: false, error: "admin_user_id_missing" }, { status: 400 });
  }

  try {
    const params = await context.params;
    const itemId = decodeURIComponent(String(params.itemId ?? "").trim());
    const body = BodySchema.parse(await req.json());
    const readModel = await buildReviewQueueReadModel({
      mode: "global_operator",
      userId,
      isAdmin: true,
      visibleRegionIds: gate.requestScope.regionIds,
      organizationIds: gate.requestScope.organizationMembership.organizationIds,
      primaryOrganizationId: gate.requestScope.organizationId,
      canApproveOfficial: true,
      governanceActor: {
        userId,
        role: "admin",
        isAdmin: true,
        scopedOwnerIds: [userId],
        scopedEntityIds: [userId],
        personTrust: null,
      },
    });
    const existingItem = readModel.items.find((item) => item.id === itemId);
    if (!existingItem) {
      return NextResponse.json({ ok: false, error: "review_queue_item_not_found" }, { status: 404 });
    }

    const result = await applyReviewQueueOperation({
      itemId,
      action: body.action,
      requestedByUserId: userId,
      assignedToUserId: body.assignedToUserId ?? null,
      note: body.note ?? null,
    });

    return NextResponse.json(
      {
        ok: true,
        itemId,
        record: result.record,
        auditEvent: result.auditEvent,
        requestScope: {
          isOperatorMode: gate.requestScope.isOperatorMode,
          operatorModeLabel: gate.requestScope.operatorModeLabel,
          sourceOfTruth: gate.requestScope.sourceOfTruth,
          confidence: gate.requestScope.confidence,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "review_queue_operation_failed";
    const status =
      message === "review_queue_item_not_found"
        ? 404
        : message === "review_queue_item_archived"
          ? 409
          : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
