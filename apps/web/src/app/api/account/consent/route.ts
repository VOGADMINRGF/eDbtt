import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId, piiCol } from "@core/db/triMongo";
import {
  PRIVACY_NOTICE_VERSION,
  buildDefaultConsent,
  normalizeConsent,
  type Consent,
} from "@/lib/privacy/consent";
import { readSession } from "@/utils/session";

export const runtime = "nodejs";

const CONSENT_COLLECTION = "user_consent_preferences" as const;

type ConsentDoc = {
  _id?: ObjectId;
  userId: ObjectId;
  privacyNoticeVersion: string;
  requiredNoticeAcknowledged: boolean;
  optional: {
    comfort: boolean;
    analytics: boolean;
    externalMedia: boolean;
    productImprovement: boolean;
  };
  source?: string | null;
  updatedAt: Date;
  createdAt: Date;
};

const currentPatchSchema = z.object({
  privacyNoticeVersion: z.string().min(1).max(64).optional(),
  requiredNoticeAcknowledged: z.boolean(),
  optional: z.object({
    comfort: z.boolean(),
    analytics: z.boolean(),
    externalMedia: z.boolean(),
    productImprovement: z.boolean(),
  }),
  source: z.string().max(64).optional(),
  timestamp: z.string().optional(),
});

const legacyPatchSchema = z.object({
  essential: z.literal(true).optional(),
  analytics: z.boolean(),
  source: z.string().max(40).optional(),
});

function serializeConsentForResponse(consent: Consent, updatedAt: Date) {
  return {
    privacyNoticeVersion: consent.privacyNoticeVersion,
    requiredNoticeAcknowledged: consent.requiredNoticeAcknowledged,
    optional: consent.optional,
    source: consent.source,
    timestamp: consent.timestamp,
    updatedAt,
  };
}

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
  const consent = doc
    ? normalizeConsent({
        privacyNoticeVersion: doc.privacyNoticeVersion,
        requiredNoticeAcknowledged: doc.requiredNoticeAcknowledged,
        optional: doc.optional,
        timestamp: doc.updatedAt.toISOString(),
        source: doc.source ?? "account-settings",
      })
    : null;

  return NextResponse.json({
    ok: true,
    consent: consent ? serializeConsentForResponse(consent, doc!.updatedAt) : null,
  });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const current = currentPatchSchema.safeParse(body);
  const legacy = current.success ? null : legacyPatchSchema.safeParse(body);
  if (!current.success && !legacy?.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const consent = current.success
    ? buildDefaultConsent({
        privacyNoticeVersion: current.data.privacyNoticeVersion ?? PRIVACY_NOTICE_VERSION,
        requiredNoticeAcknowledged: current.data.requiredNoticeAcknowledged,
        optional: current.data.optional,
        source: current.data.source ?? "privacy-gate",
        timestamp: current.data.timestamp ?? new Date().toISOString(),
      })
    : buildDefaultConsent({
        requiredNoticeAcknowledged: false,
        optional: {
          comfort: false,
          analytics: Boolean(legacy!.data.analytics),
          externalMedia: false,
          productImprovement: false,
        },
        source: legacy!.data.source ?? "cookie-banner-migrated",
        timestamp: new Date().toISOString(),
      });

  const now = new Date();
  const col = await piiCol<ConsentDoc>(CONSENT_COLLECTION);

  await col.updateOne(
    { userId },
    {
      $set: {
        privacyNoticeVersion: consent.privacyNoticeVersion,
        requiredNoticeAcknowledged: consent.requiredNoticeAcknowledged,
        optional: consent.optional,
        source: consent.source ?? null,
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
    consent: serializeConsentForResponse(consent, now),
  });
}
