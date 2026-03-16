import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { getCol, ObjectId } from "@core/db/triMongo";
import { piiCol } from "@core/db/db/triMongo";
import { CREDENTIAL_COLLECTION } from "../sharedAuth";
import { createEmailVerificationToken } from "@core/auth/emailVerificationService";
import { DEFAULT_LOCALE, isSupportedLocale } from "@core/locale/locales";
import { hashPassword } from "@/utils/password";
import { logIdentityEvent } from "@core/telemetry/identityEvents";
import { sendMail } from "@/utils/mailer";
import { buildVerificationMail } from "@/utils/emailTemplates";
import { publicOrigin } from "@/utils/publicOrigin";
import { ensureBasicPiiProfile } from "@core/pii/userProfileService";
import { incrementRateLimit } from "@/lib/security/rate-limit";
import { verifyHumanTokenDetailed } from "@/lib/security/human-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2).max(120),
  firstName: z.string().min(2).max(120).optional(),
  lastName: z.string().min(2).max(160).optional(),
  birthDate: z.string().optional(), // Sanitizing unten
  email: z.string().email(),
  password: z.string().min(12),
  preferredLocale: z.string().optional(),
  newsletterOptIn: z.boolean().optional(),
  title: z.string().trim().max(80).optional(),
  pronouns: z.string().trim().max(80).optional(),
  humanToken: z.string().min(10).max(1024),
  formStartedAt: z.coerce.number().optional(),
  hp_register: z.string().optional(),
  inviteCode: z.string().trim().max(128).optional(),
});

const RATE_LIMIT_MAX = 6;
const RATE_LIMIT_WINDOW = 15 * 60; // 15 minutes
const MIN_FILL_MS = 3000;
const MAX_FILL_MS = 2 * 60 * 60 * 1000;
const REFERRAL_REWARD_ANALYSIS_STARTS = 1;
const REFERRAL_CODE_RE = /^[a-zA-Z0-9_-]{6,128}$/;

type UserProfileDoc = {
  _id: ObjectId;
  name?: string | null;
  email?: string | null;
  profile?: {
    inviteToken?: string | null;
    publicShareId?: string | null;
  };
};

type ReferralDoc = {
  _id?: ObjectId;
  inviteCode: string;
  inviterUserId: string;
  invitedUserId: string;
  status: "linked";
  createdAt: Date;
  updatedAt: Date;
  connectedAt?: Date;
  notifiedAt?: Date;
  rewardGrantedAt?: Date;
  rewardAnalysisStarts?: number;
};

function sanitizeInviteCode(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || !REFERRAL_CODE_RE.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

async function applyReferralFlow({
  users,
  invitedUserId,
  inviteCode,
}: {
  users: Awaited<ReturnType<typeof getCol>>;
  invitedUserId: ObjectId;
  inviteCode: string;
}) {
  const invitedUserIdStr = String(invitedUserId);

  const inviter = await users.findOne(
    {
      _id: { $ne: invitedUserId },
      $or: [
        { "profile.inviteToken": inviteCode },
        { "profile.publicShareId": inviteCode },
      ],
    },
    { projection: { _id: 1, name: 1, email: 1 } },
  ) as UserProfileDoc | null;
  if (!inviter?._id) return { linked: false as const, reason: "inviter_not_found" as const };

  const inviterUserId = String(inviter._id);
  const now = new Date();
  const referralsCol = await getCol<ReferralDoc>("user_referrals");
  const existingReferral = await referralsCol.findOne(
    { invitedUserId: invitedUserIdStr },
    { projection: { inviterUserId: 1, rewardGrantedAt: 1 } },
  );
  if (existingReferral?.inviterUserId && existingReferral.inviterUserId !== inviterUserId) {
    return {
      linked: true as const,
      inviterUserId: existingReferral.inviterUserId,
      rewardGranted: Boolean(existingReferral.rewardGrantedAt),
    };
  }

  const upsert = await referralsCol.updateOne(
    { invitedUserId: invitedUserIdStr },
    {
      $setOnInsert: {
        inviteCode,
        inviterUserId,
        invitedUserId: invitedUserIdStr,
        status: "linked",
        createdAt: now,
      },
      $set: {
        updatedAt: now,
      },
    },
    { upsert: true },
  );

  const referralDoc = await referralsCol.findOne(
    { invitedUserId: invitedUserIdStr },
    { projection: { rewardGrantedAt: 1 } },
  );
  if (!upsert.upsertedId && referralDoc?.rewardGrantedAt) {
    return { linked: true as const, inviterUserId, rewardGranted: false as const };
  }

  await users.updateOne(
    { _id: invitedUserId },
    {
      $set: {
        "profile.referral.inviterUserId": inviterUserId,
        "profile.referral.inviteCode": inviteCode,
        "profile.referral.attributedAt": now,
        updatedAt: now,
      },
    },
  );

  const friendRequestsCol = await getCol("social_friend_requests");
  await Promise.all([
    friendRequestsCol.updateOne(
      { fromUserId: inviterUserId, toUserId: invitedUserIdStr },
      {
        $set: {
          status: "accepted",
          source: "referral",
          acceptedAt: now,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
          message: "Verbunden über Einladungslink",
        },
      },
      { upsert: true },
    ),
    friendRequestsCol.updateOne(
      { fromUserId: invitedUserIdStr, toUserId: inviterUserId },
      {
        $set: {
          status: "accepted",
          source: "referral",
          acceptedAt: now,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
          message: "Verbunden über Einladungslink",
        },
      },
      { upsert: true },
    ),
  ]);

  const messagesCol = await getCol("social_messages");
  await messagesCol.updateOne(
    { fromUserId: invitedUserIdStr, toUserId: inviterUserId, kind: "referral_signup" },
    {
      $setOnInsert: {
        text: "hat sich über deinen Einladungslink registriert.",
        readAt: null,
        createdAt: now,
      },
      $set: {
        updatedAt: now,
      },
    },
    { upsert: true },
  );

  await users.updateOne(
    { _id: inviter._id },
    {
      $inc: {
        "usage.contributionCredits": REFERRAL_REWARD_ANALYSIS_STARTS,
        "stats.contributionCredits": REFERRAL_REWARD_ANALYSIS_STARTS,
        "profile.referrals.successfulInvites": 1,
        "profile.referrals.rewardAnalysisStarts": REFERRAL_REWARD_ANALYSIS_STARTS,
      },
      $set: {
        "profile.referrals.lastSuccessAt": now,
        updatedAt: now,
      },
    },
  );

  await referralsCol.updateOne(
    { invitedUserId: invitedUserIdStr },
    {
      $set: {
        connectedAt: now,
        notifiedAt: now,
        rewardGrantedAt: now,
        rewardAnalysisStarts: REFERRAL_REWARD_ANALYSIS_STARTS,
        updatedAt: now,
      },
    },
  );

  return { linked: true as const, inviterUserId, rewardGranted: true as const };
}

function hashedClientKey(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ua = req.headers.get("user-agent") || "unknown";
  return createHash("sha256").update(`${ip}|${ua}`).digest("hex").slice(0, 32);
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const body = parsed.data;
  if (body.hp_register && body.hp_register.trim().length > 0) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const rateKey = hashedClientKey(req);
  const attempts = await incrementRateLimit(`register:${rateKey}`, RATE_LIMIT_WINDOW);
  if (attempts > RATE_LIMIT_MAX) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const startedAt = body.formStartedAt;
  const durationMs = typeof startedAt === "number" ? Date.now() - startedAt : null;
  if (durationMs !== null) {
    if (durationMs < MIN_FILL_MS || durationMs > MAX_FILL_MS) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
  }

  const humanCheck = await verifyHumanTokenDetailed(body.humanToken);
  if (!humanCheck.ok) {
    const reason = "code" in humanCheck ? humanCheck.code : "invalid";
    return NextResponse.json(
      { error: reason === "expired" ? "human_token_expired" : "human_token_invalid" },
      { status: 400 },
    );
  }
  if (humanCheck.payload.formId !== "register") {
    return NextResponse.json({ error: "human_token_invalid" }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const locale = normalizeLocale(body.preferredLocale);
  const givenName = body.firstName?.trim() || undefined;
  const familyName = body.lastName?.trim() || undefined;
  const birthDate = normalizeBirthDate(body.birthDate);
  const title = body.title?.trim() || undefined;
  const pronouns = body.pronouns?.trim() || undefined;
  const displayName = body.name.trim();
  const inviteFromQuery = sanitizeInviteCode(req.nextUrl.searchParams.get("invite"));
  const inviteCode = sanitizeInviteCode(body.inviteCode) ?? inviteFromQuery;

  if (!isPasswordStrong(body.password)) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }

  const url = new URL(req.url);
  const householdSizeRaw = url.searchParams.get("householdSize");
  const householdSize = householdSizeRaw
    ? Math.max(1, Math.min(10, Number(householdSizeRaw) || 1))
    : 1;

  const Users = await getCol("users");
  const existing = await Users.findOne(
    { email },
    { projection: { _id: 1, verifiedEmail: 1, createdAt: 1 } },
  );

  if (existing && existing.verifiedEmail) {
    return NextResponse.json({ error: "email_in_use" }, { status: 409 });
  }

  const now = new Date();
  const passwordHash = await hashPassword(body.password);
  const baseDoc = {
    email,
    name: displayName,
    passwordHash,
    role: "user",
    verifiedEmail: false,
    emailVerified: false,
    accessTier: "citizenBasic",
    profile: {
      displayName,
      locale,
    },
    settings: {
      preferredLocale: locale,
      newsletterOptIn: body.newsletterOptIn ?? false,
    },
    verification: {
      level: "none",
      methods: [],
      lastVerifiedAt: null,
      preferredRegionCode: null,
    },
    createdAt: now,
    updatedAt: now,
  };

  let userId: ObjectId;
  if (!existing) {
    const insert = await Users.insertOne(baseDoc);
    userId = insert.insertedId;
  } else {
    userId = existing._id as ObjectId;
    await Users.updateOne(
      { _id: userId },
      {
        $set: {
          ...baseDoc,
          createdAt: existing.createdAt ?? now,
        },
      },
    );
  }

  let referralResult:
    | { linked: false; reason: "inviter_not_found" | "flow_failed" }
    | { linked: true; inviterUserId: string; rewardGranted: boolean }
    | null = null;
  if (inviteCode) {
    try {
      referralResult = await applyReferralFlow({
        users: Users,
        invitedUserId: userId,
        inviteCode,
      });
    } catch (referralErr) {
      console.error("[register] applyReferralFlow failed", referralErr);
      referralResult = { linked: false, reason: "flow_failed" };
    }
  }

  const credentials = await piiCol(CREDENTIAL_COLLECTION);
  await credentials.updateOne(
    { coreUserId: userId },
    {
      $set: {
        coreUserId: userId,
        email,
        passwordHash,
        twoFactorEnabled: false,
      },
    },
    { upsert: true },
  );

  const { rawToken } = await createEmailVerificationToken(userId, email);

  let piiProfileError: string | null = null;
  try {
    await ensureBasicPiiProfile(userId, {
      email,
      displayName,
      givenName,
      familyName,
      birthDate: birthDate ?? null,
      title: title ?? null,
      pronouns: pronouns ?? null,
      householdSize: householdSize > 1 ? householdSize : undefined,
    });
  } catch (err) {
    piiProfileError =
      err instanceof Error ? err.message : String(err ?? "unknown error");
    console.error("[register] ensureBasicPiiProfile failed", err);
  }

  try {
    await logIdentityEvent("identity_register", {
      userId: String(userId),
      meta: {
        email,
        householdSize: householdSize > 1 ? householdSize : undefined,
        piiProfileError,
        referralLinked: referralResult?.linked ?? false,
        referralRewardGranted: referralResult?.linked ? referralResult.rewardGranted : false,
        referralReason:
          referralResult && "reason" in referralResult ? referralResult.reason : undefined,
      },
    });
  } catch (telemetryErr) {
    console.error(
      "[register] logIdentityEvent(identity_register) failed",
      telemetryErr,
    );
  }

  const origin = publicOrigin();
  const verifyUrl = `${origin.replace(
    /\/$/,
    "",
  )}/register/verify-email?token=${encodeURIComponent(
    rawToken,
  )}&email=${encodeURIComponent(email)}`;

  const mail = buildVerificationMail({
    verifyUrl,
    displayName: body.name.trim(),
  });

  await sendMail({
    to: email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

function isPasswordStrong(value: string) {
  return value.length >= 12 && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}

function normalizeLocale(locale?: string) {
  if (locale && isSupportedLocale(locale)) return locale;
  return DEFAULT_LOCALE;
}

function normalizeBirthDate(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  // akzeptiere YYYY-MM-DD oder DD.MM.YYYY
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const deMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

  let yyyy: string | null = null;
  let mm: string | null = null;
  let dd: string | null = null;

  if (isoMatch) {
    [, yyyy, mm, dd] = isoMatch;
  } else if (deMatch) {
    [, dd, mm, yyyy] = deMatch;
  }

  if (!yyyy || !mm || !dd) {
    throw NextResponse.json({ error: "birthdate_invalid" }, { status: 400 });
  }

  const normalized = `${yyyy}-${mm}-${dd}`;
  const ts = Date.parse(normalized);
  if (Number.isNaN(ts)) {
    throw NextResponse.json({ error: "birthdate_invalid" }, { status: 400 });
  }
  return normalized;
}
