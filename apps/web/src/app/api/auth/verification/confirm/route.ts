import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "@core/db/triMongo";
import {
  IdentityVerificationError,
  completeIdentityVerification,
} from "@core/auth/identityVerificationService";
import { logIdentityEvent } from "@core/telemetry/identityEvents";
import { readSession } from "@/utils/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  sessionId: z.string().min(10),
  providerProof: z
    .object({
      adapter: z.literal("test"),
      verificationId: z.string().min(6),
      verified: z.literal(true),
      verifiedAt: z.string().optional(),
    })
    .optional(),
});

async function readAuthenticatedUserId() {
  const session = await readSession().catch(() => null);
  const userId = session?.uid ?? null;
  if (!userId || !ObjectId.isValid(userId)) {
    return null;
  }
  return new ObjectId(userId);
}

export async function POST(req: NextRequest) {
  const userId = await readAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  try {
    const result = await completeIdentityVerification({
      sessionId: parsed.data.sessionId,
      userId,
      providerPayload: parsed.data.providerProof,
    });
    const response = NextResponse.json({
      ok: true,
      level: result.verification.level,
      methods: result.verification.methods,
    });
    await logIdentityEvent("identity_otb_confirm", {
      userId: userId.toHexString(),
      meta: { level: result.verification.level },
    });
    return response;
  } catch (error) {
    if (error instanceof IdentityVerificationError) {
      return NextResponse.json({ ok: false, error: error.code }, { status: error.status });
    }
    throw error;
  }
}
