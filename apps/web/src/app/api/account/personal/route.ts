import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import type { Collection } from "mongodb";
import { z } from "zod";
import { assertStoreConfigured, ObjectId, getCol } from "@core/db/triMongo";
import { getPiiProfile, upsertPiiProfile } from "@core/pii/userProfileService";
import { readSession } from "@/utils/session";
import { logOnboardingEvent } from "@/lib/onboarding/events";
import { refreshUserPreferenceSnapshot } from "@/lib/onboarding/preferenceSnapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NameMode = "real_name" | "nickname";

type CoreUserDoc = {
  _id: ObjectId;
  profile?: {
    inviteToken?: string | null;
    publicShareId?: string | null;
    referrals?: {
      successfulInvites?: number | null;
      rewardAnalysisStarts?: number | null;
      lastSuccessAt?: string | Date | null;
    };
    identity?: {
      displayMode?: NameMode;
      nickname?: string | null;
    };
  };
};

const nullableText = (max: number) =>
  z
    .union([
      z.string().trim().max(max, "too_long"),
      z.literal("").transform(() => null),
      z.null(),
    ])
    .optional();

const patchSchema = z
  .object({
    givenName: nullableText(120),
    familyName: nullableText(120),
    street: nullableText(160),
    postalCode: nullableText(24),
    city: nullableText(120),
    country: nullableText(80),
    displayMode: z.enum(["real_name", "nickname"]).optional(),
    nickname: nullableText(80),
  })
  .superRefine((data, ctx) => {
    if (data.displayMode === "nickname") {
      const nickname = typeof data.nickname === "string" ? data.nickname.trim() : "";
      if (nickname.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "nickname_required",
          path: ["nickname"],
        });
      }
    }
  });

function createInviteToken() {
  return crypto.randomBytes(7).toString("hex");
}

function normalizeDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function ensureInviteToken(Users: Collection<CoreUserDoc>, user: CoreUserDoc) {
  const existing =
    (typeof user.profile?.inviteToken === "string" && user.profile.inviteToken.trim()) ||
    (typeof user.profile?.publicShareId === "string" && user.profile.publicShareId.trim()) ||
    null;
  if (existing) return existing;

  const inviteToken = createInviteToken();
  await Users.updateOne(
    { _id: user._id },
    { $set: { "profile.inviteToken": inviteToken, updatedAt: new Date() } },
  );
  return inviteToken;
}

async function loadPersonalPayload(userId: string) {
  if (!ObjectId.isValid(userId)) return null;
  const userObjectId = new ObjectId(userId);
  const Users = await getCol<CoreUserDoc>("users");
  const [profile, user] = await Promise.all([
    getPiiProfile(userObjectId),
    Users.findOne({ _id: userObjectId }, { projection: { profile: 1 } }),
  ]);
  if (!user) return null;

  const inviteToken = await ensureInviteToken(Users, user);
  const displayMode: NameMode = user.profile?.identity?.displayMode === "nickname" ? "nickname" : "real_name";
  const nickname = typeof user.profile?.identity?.nickname === "string" ? user.profile.identity.nickname : null;
  const successfulInvites = Number(user.profile?.referrals?.successfulInvites ?? 0) || 0;
  const rewardAnalysisStarts = Number(user.profile?.referrals?.rewardAnalysisStarts ?? 0) || 0;
  const lastReferralSuccessAt = normalizeDate(user.profile?.referrals?.lastSuccessAt ?? null);

  return {
    personal: {
      givenName: profile?.personal?.givenName ?? null,
      familyName: profile?.personal?.familyName ?? null,
      email: profile?.contacts?.emailPrimary ?? null,
      street: profile?.address?.street ?? null,
      postalCode: profile?.address?.postalCode ?? null,
      city: profile?.address?.city ?? null,
      country: profile?.address?.country ?? null,
      displayMode,
      nickname,
      inviteToken,
      referralCode: inviteToken,
      successfulInvites,
      rewardAnalysisStarts,
      lastReferralSuccessAt,
    },
  };
}

export async function GET() {
  assertStoreConfigured("core", "api/account/personal.GET");
  assertStoreConfigured("pii", "api/account/personal.GET");
  const session = await readSession();
  const userId = session?.uid ?? null;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const payload = await loadPersonalPayload(userId);
  if (!payload) {
    return NextResponse.json({ ok: true, personal: null });
  }

  return NextResponse.json({ ok: true, ...payload });
}

export async function PATCH(req: NextRequest) {
  assertStoreConfigured("core", "api/account/personal.PATCH");
  assertStoreConfigured("pii", "api/account/personal.PATCH");
  const session = await readSession();
  const userId = session?.uid ?? null;
  if (!userId || !ObjectId.isValid(userId)) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "validation_error" },
      { status: 400 },
    );
  }

  const userObjectId = new ObjectId(userId);
  await upsertPiiProfile(userObjectId, {
    givenName: parsed.data.givenName ?? undefined,
    familyName: parsed.data.familyName ?? undefined,
    address: {
      street: parsed.data.street ?? undefined,
      postalCode: parsed.data.postalCode ?? undefined,
      city: parsed.data.city ?? undefined,
      country: parsed.data.country ?? undefined,
    },
  });

  const Users = await getCol("users");
  const setOps: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (parsed.data.displayMode !== undefined) {
    setOps["profile.identity.displayMode"] = parsed.data.displayMode;
  }
  if (parsed.data.nickname !== undefined) {
    setOps["profile.identity.nickname"] = parsed.data.nickname?.trim() || null;
  }

  await Users.updateOne({ _id: userObjectId }, { $set: setOps });

  let onboardingTransitions = {
    interestsCompletedNow: false,
    locationCompletedNow: false,
    personalizedReadyNow: false,
  };
  try {
    const refreshed = await refreshUserPreferenceSnapshot(userObjectId);
    onboardingTransitions = refreshed.transitions;
    if (refreshed.transitions.interestsCompletedNow) {
      await logOnboardingEvent("interests_completed", { userId });
    }
    if (refreshed.transitions.locationCompletedNow) {
      await logOnboardingEvent("location_completed", { userId });
    }
    if (refreshed.transitions.personalizedReadyNow) {
      await logOnboardingEvent("personalized_start_ready", { userId });
    }
  } catch (error) {
    console.error("[account/personal] refreshUserPreferenceSnapshot failed", error);
  }

  const payload = await loadPersonalPayload(userId);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ...payload, onboardingTransitions });
}
