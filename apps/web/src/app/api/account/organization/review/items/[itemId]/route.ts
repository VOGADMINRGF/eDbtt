import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import { hasVerifiedMembershipWriteAccess } from "@/lib/server/auth/membershipDirectoryRepository";
import {
  buildOrganizationDashboardReadModel,
  organizationEntitlementAllowsScope,
} from "@features/region";
import { applyReviewQueueOperation } from "@features/reviewQueueOperations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z
  .object({
    action: z.enum([
      "add_note",
      "request_changes",
      "mark_in_review",
      "mark_ready",
      "archive",
      "block",
    ]),
    note: z.string().trim().min(1).optional(),
  })
  .strict();

function denied(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 403 });
}

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      itemId: string;
    }>;
  },
) {
  const gate = await requireGovernanceActorOrResponse(req, { allowOperatorFallback: false });
  if (gate instanceof Response) return gate;

  try {
    if (
      !hasVerifiedMembershipWriteAccess({
        membershipStatus: gate.requestScope.membershipStatus,
        organizationRole: gate.requestScope.organizationRole,
        isOperatorMode: gate.requestScope.isOperatorMode,
        sourceOfTruth: gate.requestScope.sourceOfTruth,
      })
    ) {
      return denied("organization_membership_write_forbidden");
    }

    const userId = String(gate.actor.userId ?? "").trim();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "governance_user_id_missing" }, { status: 400 });
    }

    const params = await context.params;
    const itemId = decodeURIComponent(String(params.itemId ?? "").trim());
    const body = BodySchema.parse(await req.json());
    const readModel = await buildOrganizationDashboardReadModel({
      userId,
      roles: gate.roles,
      isAdmin: gate.actor.isAdmin,
      actorRole: gate.actor.role,
    });
    const existingItem = readModel.openReviewItems.find((item) => item.id === itemId);
    if (!existingItem) {
      return NextResponse.json({ ok: false, error: "review_queue_item_not_found" }, { status: 404 });
    }
    if (!organizationEntitlementAllowsScope(readModel.entitlementSummary, "review_queue")) {
      return denied("organization_entitlement_scope_forbidden");
    }
    if (
      !existingItem.moderationPermission.canOperateOwnReviewItem ||
      !existingItem.moderationPermission.allowedActions.includes(body.action)
    ) {
      return denied("organization_review_operation_forbidden");
    }

    const result = await applyReviewQueueOperation({
      itemId,
      action: body.action,
      requestedByUserId: userId,
      note: body.note ?? null,
    });

    return NextResponse.json(
      {
        ok: true,
        itemId,
        record: result.record,
        auditEvent: result.auditEvent,
        requestScope: {
          organizationId: gate.requestScope.organizationId,
          membershipStatus: gate.requestScope.membershipStatus,
          organizationRole: gate.requestScope.organizationRole,
          regionIds: gate.requestScope.regionIds,
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
          : message === "organization_review_operation_forbidden" ||
              message === "organization_membership_write_forbidden" ||
              message === "organization_entitlement_scope_forbidden"
            ? 403
            : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
