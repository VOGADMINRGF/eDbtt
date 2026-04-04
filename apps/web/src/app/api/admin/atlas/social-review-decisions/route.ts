export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  SOCIAL_REVIEW_PERSISTED_DECISIONS,
  listSocialReviewDecisionEventsByEntryIds,
  upsertSocialReviewDecision,
} from "@features/anlassraum/socialReviewDecisionStore";

const SocialReviewDecisionBodySchema = z.object({
  entryId: z.string().trim().min(1).max(200),
  decision: z.enum(SOCIAL_REVIEW_PERSISTED_DECISIONS),
  note: z.string().trim().max(500).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = SocialReviewDecisionBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const saved = await upsertSocialReviewDecision({
    entryId: parsed.data.entryId,
    decision: parsed.data.decision,
    note: parsed.data.note ?? null,
    updatedByUserId: String(gate._id),
  });

  const historyMap = await listSocialReviewDecisionEventsByEntryIds({
    entryIds: [parsed.data.entryId],
    limitPerEntry: 5,
  }).catch(() => new Map<string, never[]>());

  return NextResponse.json({
    ok: true,
    decision: saved,
    history: historyMap.get(parsed.data.entryId) ?? [],
  });
}
