import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  approveParticipationSpaceCreation,
  createApprovedParticipationSpace,
  rejectParticipationSpaceCreation,
} from "@/features/create/participationSpaceRuntimeServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z
  .object({
    action: z.enum([
      "approveParticipationSpaceCreation",
      "rejectParticipationSpaceCreation",
      "createApprovedParticipationSpace",
    ]),
  })
  .strict();

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      sourceHandoffId: string;
    }>;
  },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const actorUserId = gate?._id?.toHexString?.() ?? "";
  if (!actorUserId) {
    return NextResponse.json(
      { ok: false, error: "admin_user_id_missing" },
      { status: 400 },
    );
  }

  try {
    const { sourceHandoffId } = await context.params;
    const body = BodySchema.parse(await req.json());

    const result =
      body.action === "approveParticipationSpaceCreation"
        ? await approveParticipationSpaceCreation({
            sourceHandoffId,
            actorUserId,
          })
        : body.action === "rejectParticipationSpaceCreation"
          ? await rejectParticipationSpaceCreation({
              sourceHandoffId,
              actorUserId,
            })
          : await createApprovedParticipationSpace({
              sourceHandoffId,
              actorUserId,
            });

    return NextResponse.json({ ok: true, record: result });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "participation_space_runtime_action_failed";
    const status =
      message === "participation_space_runtime_record_not_found"
        ? 404
        : message === "source_handoff_missing"
          ? 409
          : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
