import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  backfillFounderWelcomeForExistingUsers,
  ensureFounderWelcomeForUser,
} from "@/lib/onboarding/founderWelcome";
import { logOnboardingEvent } from "@/lib/onboarding/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  userId: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  includeAlreadyMarked: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "validation_error" },
      { status: 400 },
    );
  }

  if (parsed.data.userId) {
    const result = await ensureFounderWelcomeForUser(parsed.data.userId, {
      source: "admin_api",
    });
    if (result.friendRequestCreated) {
      await logOnboardingEvent("founder_friend_request_created", {
        userId: result.targetUserId,
        meta: { founderUserId: result.founderUserId, source: "admin_backfill_single" },
      });
    }
    if (result.welcomeMessageCreated) {
      await logOnboardingEvent("founder_welcome_message_created", {
        userId: result.targetUserId,
        meta: { founderUserId: result.founderUserId, source: "admin_backfill_single" },
      });
    }
    return NextResponse.json({ ok: true, mode: "single_user", result });
  }

  const summary = await backfillFounderWelcomeForExistingUsers({
    limit: parsed.data.limit,
    includeAlreadyMarked: parsed.data.includeAlreadyMarked,
    source: "admin_api",
  });

  await Promise.all(
    summary.users.map(async (result) => {
      if (result.friendRequestCreated) {
        await logOnboardingEvent("founder_friend_request_created", {
          userId: result.targetUserId,
          meta: { founderUserId: result.founderUserId, source: "admin_backfill_batch" },
        });
      }
      if (result.welcomeMessageCreated) {
        await logOnboardingEvent("founder_welcome_message_created", {
          userId: result.targetUserId,
          meta: { founderUserId: result.founderUserId, source: "admin_backfill_batch" },
        });
      }
    }),
  );

  return NextResponse.json({ ok: true, mode: "batch", summary });
}

