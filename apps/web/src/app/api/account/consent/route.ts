import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId, piiCol } from "@core/db/triMongo";
import { readSession } from "@/utils/session";

export const runtime = "nodejs";

const CONSENT_COLLECTION = "user_consent_preferences" as const;

type ConsentDoc = {
  _id?: ObjectId;
  userId: ObjectId;
  essential: true;
  analytics: boolean;
  source?: string | null;
  updatedAt: Date;
  createdAt: Date;
};

const patchSchema = z.object({
  essential: z.literal(true).optional(),
  analytics: z.boolean(),
  source: z.string().max(40).optional(),
});

async function requireUserId() {
  const session = await readSession();
  const uid = session?.uid ?? null;
  if (!uid || !ObjectId.isValid(uid)) return null;
  return new ObjectId(uid);
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const col = await piiCol<ConsentDoc>(CONSENT_COLLECTION);
  const doc = await col.findOne({ userId });

  return NextResponse.json({
    ok: true,
    consent: doc
      ? {
          essential: true,
          analytics: Boolean(doc.analytics),
          source: doc.source ?? null,
          updatedAt: doc.updatedAt,
        }
      : null,
  });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const now = new Date();
  const col = await piiCol<ConsentDoc>(CONSENT_COLLECTION);

  await col.updateOne(
    { userId },
    {
      $set: {
        essential: true,
        analytics: parsed.data.analytics,
        source: parsed.data.source ?? null,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  return NextResponse.json({
    ok: true,
    consent: {
      essential: true,
      analytics: parsed.data.analytics,
      source: parsed.data.source ?? null,
      updatedAt: now,
    },
  });
}
