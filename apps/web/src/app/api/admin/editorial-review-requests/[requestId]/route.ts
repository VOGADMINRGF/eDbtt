import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  applyEditorialReviewRequestAction,
  EDITORIAL_REVIEW_REQUEST_ACTIONS,
} from "@features/editorialReviewQueue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z
  .object({
    action: z.enum(EDITORIAL_REVIEW_REQUEST_ACTIONS),
    assignedToUserId: z.string().trim().min(1).optional(),
    note: z.string().trim().min(1).optional(),
  })
  .strict();

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      requestId: string;
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
    const requestId = decodeURIComponent(String(params.requestId ?? "").trim());
    const result = await applyEditorialReviewRequestAction({
      requestId,
      action: body.action,
      requestedByUserId,
      assignedToUserId: body.assignedToUserId ?? null,
      note: body.note ?? null,
    });

    return NextResponse.json({
      ok: true,
      reviewRequest: result.reviewRequest,
      historyEntry: result.historyEntry,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "editorial_review_action_failed";
    const status =
      message === "editorial_review_request_not_found"
        ? 404
        : message === "editorial_review_request_archived"
          ? 409
          : message === "editorial_review_invalid_transition"
          ? 409
          : message === "editorial_review_note_required"
            ? 400
            : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
