import { NextResponse, type NextRequest } from "next/server";
import { updateContributionFeedback } from "@core/research";
import { logger } from "@/utils/logger";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const body = await req.json().catch(() => ({}));
  const { contributionId, helpful, note } = body ?? {};

  if (!contributionId || typeof helpful !== "boolean") {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  try {
    const updated = await updateContributionFeedback({
      contributionId,
      feedbackHelpful: helpful,
      feedbackNote: note,
      feedbackBy: gate?._id ? String(gate._id) : null,
    });

    if (!updated) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    logger.info({ msg: "admin.research.contribution.feedback", contributionId, helpful });
    return NextResponse.json({ ok: true, contribution: updated });
  } catch (err: any) {
    logger.error({ msg: "admin.research.contribution.feedback_failed", contributionId, err: err?.message });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
