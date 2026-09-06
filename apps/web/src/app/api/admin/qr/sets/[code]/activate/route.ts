export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { coreCol } from "@core/db/triMongo";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { isQrQuestionSetReadyForActivation } from "@/features/create/qrQuestionSetGuard";

const BodySchema = z
  .object({
    confirmActivation: z.literal(true),
  })
  .strict();

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  try {
    const body = BodySchema.safeParse(await req.json().catch(() => null));
    if (!body.success) {
      return NextResponse.json(
        { ok: false, error: "qr_question_set_activation_confirmation_required" },
        { status: 400 },
      );
    }
    const { code } = await context.params;
    const sets = await coreCol("qr_question_sets");
    const set = await sets.findOne({ code });
    if (!set) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    if (!isQrQuestionSetReadyForActivation(set)) {
      return NextResponse.json(
        { ok: false, error: "qr_question_set_not_ready_for_activation" },
        { status: 409 },
      );
    }

    const currentVersion = Number.isSafeInteger(set.version) ? Number(set.version) : 0;
    const actorUserId = gate?._id?.toHexString?.() ?? "";
    const reservedAt = new Date();
    const reservation = await sets.updateOne(
      {
        _id: set._id,
        status: "ready_for_activation",
        questionGuardReviewState: "reviewed",
        version: currentVersion,
      },
      {
        $set: {
          activationState: "activation_in_progress",
          activationRequestedAt: reservedAt,
          activationRequestedBy: actorUserId,
          updatedAt: reservedAt,
        },
        $inc: { version: 1 },
      },
    );
    if (reservation.matchedCount !== 1) {
      return NextResponse.json(
        { ok: false, error: "qr_question_set_activation_state_conflict" },
        { status: 409 },
      );
    }

    const auditId = `qr-question-set-activation:${crypto.randomUUID()}`;
    await (await coreCol("qr_question_set_guard_audits")).insertOne({
      id: auditId,
      code,
      setId: String(set._id),
      actorUserId,
      action: "qr_question_set_activation_approved",
      previousStatus: "ready_for_activation",
      requestedStatus: "active",
      questionGuardReviewAuditId:
        typeof set.lastQuestionGuardReviewAuditId === "string"
          ? set.lastQuestionGuardReviewAuditId
          : null,
      questionResults: (Array.isArray(set.questions) ? set.questions : []).map(
        (question: Record<string, any>) => ({
          questionId: question.id,
          releaseState: question.questionGuard?.releaseState,
          outcome: question.questionGuard?.outcome,
          actorExtraction: question.questionGuard?.actorExtraction,
        }),
      ),
      explicitAdminAction: true,
      noAutoApproval: true,
      noAutoPublish: true,
      createdAt: reservedAt,
    });

    const activatedAt = new Date();
    const activation = await sets.updateOne(
      {
        _id: set._id,
        status: "ready_for_activation",
        questionGuardReviewState: "reviewed",
        activationState: "activation_in_progress",
        version: currentVersion + 1,
      },
      {
        $set: {
          status: "active",
          activationState: "active",
          activatedAt,
          activatedBy: actorUserId,
          lastActivationAuditId: auditId,
          updatedAt: activatedAt,
          noAutoApproval: true,
          noAutoPublish: true,
        },
        $inc: { version: 1 },
      },
    );
    if (activation.matchedCount !== 1) {
      return NextResponse.json(
        { ok: false, error: "qr_question_set_activation_state_conflict" },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      code,
      status: "active",
      activationState: "active",
      activationAuditId: auditId,
      noAutoApproval: true,
      noAutoPublish: true,
    });
  } catch {
    console.error("QR question-set activation failed");
    return NextResponse.json(
      { ok: false, error: "qr_question_set_activation_failed" },
      { status: 500 },
    );
  }
}
