import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId, getCol } from "@core/db/triMongo";
import {
  IdentityVerificationError,
  startIdentityVerification,
} from "@core/auth/identityVerificationService";
import { logIdentityEvent } from "@core/telemetry/identityEvents";
import { readSession } from "@/utils/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  method: z.enum(["otb_app", "eid_scan"]),
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

  const Users = await getCol("users");
  const user = await Users.findOne(
    { _id: userId },
    { projection: { verifiedEmail: 1, emailVerified: 1 } },
  );
  if (!user || !(user.verifiedEmail || user.emailVerified)) {
    return NextResponse.json({ ok: false, error: "email_not_verified" }, { status: 403 });
  }

  try {
    const session = await startIdentityVerification({ userId, method: parsed.data.method });
    await logIdentityEvent("identity_otb_start", {
      userId: userId.toHexString(),
      meta: { method: parsed.data.method, provider: session.provider },
    });
    return NextResponse.json({
      ok: true,
      sessionId: session._id.toString(),
      status: session.status,
    });
  } catch (error) {
    if (error instanceof IdentityVerificationError) {
      return NextResponse.json({ ok: false, error: error.code }, { status: error.status });
    }
    throw error;
  }
}
