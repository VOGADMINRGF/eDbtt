import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId, coreCol, piiCol } from "@core/db/triMongo";
import { z } from "zod";
import {
  getMembershipPaymentWorkflowProfile,
  upsertMembershipPaymentProfile,
} from "@core/db/pii/userPaymentProfiles";
import { safeRandomId } from "@core/utils/random";
import crypto from "crypto";
import {
  mailFailureMetadata,
  sendMail,
  type SendMailResult,
} from "@/utils/mailer";
import { mailLocaleFromUser } from "@/utils/mailRenderer";
import { publicOrigin } from "@/utils/publicOrigin";
import { incrementRateLimit } from "@/lib/security/rate-limit";
import { verifyHumanTokenDetailed } from "@/lib/security/human-token";
import { getPaymentEnv } from "@/lib/env/payment";
import {
  buildHouseholdInviteMail,
  buildMembershipApplyAdminMail,
  buildMembershipApplyUserMail,
} from "@/utils/emailTemplates";
import type { MembershipApplication, HouseholdMemberRef } from "@core/memberships/types";
import type { HouseholdInvite } from "@core/pii/households/types";
import {
  logIdentityEvent,
  logHouseholdInviteSent,
  logMembershipApplySubmitted,
} from "@core/telemetry/identityEvents";
import { resolveRegionInfo } from "@core/geo/region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_COUNTRY = (process.env.GEO_DEFAULT_COUNTRY ?? "de").toLowerCase();
const MICRO_TRANSFER_EXPIRES_DAYS = 14;
const RATE_LIMIT_MAX = 6;
const RATE_LIMIT_WINDOW = 15 * 60; // 15 Minuten
const MIN_FORM_MS = 3000;
const MAX_FORM_MS = 2 * 60 * 60 * 1000;
const DELIVERY_CLAIM_TTL_MS = 10 * 60_000;
let workflowIndexesEnsured = false;

function hashedClientKey(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ua = req.headers.get("user-agent") || "unknown";
  return crypto.createHash("sha256").update(`${ip}|${ua}`).digest("hex").slice(0, 32);
}

const memberSchema = z.object({
  givenName: z.string().min(1).max(120).optional(),
  familyName: z.string().min(1).max(160).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  email: z.string().email().optional(),
  role: z.enum(["primary", "adult", "youth"]).default("adult"),
});

const paymentSchema = z.object({
  type: z.literal("bank_transfer"),
  billingName: z.string().min(2).max(200),
  street: z.string().min(2).max(200).optional(),
  postalCode: z.string().min(2).max(20).optional(),
  city: z.string().min(2).max(100).optional(),
  country: z.string().min(2).max(100).optional(),
  iban: z.string().min(15).max(34),
  mandateReference: z.string().max(140).optional(),
  geo: z
    .object({
      lat: z.coerce.number(),
      lon: z.coerce.number(),
      label: z.string().optional(),
    })
    .optional(),
});

const bodySchema = z.object({
  amountPerPeriod: z.coerce.number().min(0),
  membershipAmountPerMonth: z.coerce.number().min(0).optional(),
  peopleCount: z.coerce.number().int().min(1).max(20).optional(),
  rhythm: z.enum(["monthly", "once", "yearly"]),
  householdSize: z.coerce.number().int().min(1).max(20),
  members: z.array(memberSchema).min(1),
  payment: paymentSchema,
  legalTransparencyAccepted: z.boolean(),
  legalStatuteAccepted: z.boolean(),
  edebatte: z
    .object({
      enabled: z.boolean(),
      planKey: z
        .enum(["basis", "start", "pro", "edb-basis", "edb-start", "edb-pro"])
        .optional(),
      listPricePerMonth: z.coerce.number().optional(),
      discountPercent: z.coerce.number().optional(),
      finalPricePerMonth: z.coerce.number().optional(),
      billingMode: z.enum(["monthly", "yearly"]).optional(),
    })
    .optional(),
  humanToken: z.string().min(10).max(1024),
  formStartedAt: z.coerce.number().optional(),
  hp_membership: z.string().optional(),
});

function normalizeIban(raw?: string) {
  return raw?.replace(/\s+/g, "").toUpperCase();
}

function maskIban(raw?: string) {
  if (!raw) return "";
  const cleaned = normalizeIban(raw) ?? "";
  if (cleaned.length <= 8) return cleaned;
  const last4 = cleaned.slice(-4);
  return `${cleaned.slice(0, 2)}** **** **** ${last4}`;
}

function isValidIban(iban: string) {
  const cleaned = normalizeIban(iban);
  if (!cleaned || cleaned.length < 15 || cleaned.length > 34) return false;
  if (!/^[A-Z]{2}[0-9A-Z]+$/.test(cleaned)) return false;
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    const value = code >= 65 && code <= 90 ? String(code - 55) : ch;
    for (const digit of value) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder === 1;
}

function createMicroTransferCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashMicroTransferCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(req: NextRequest) {
  const parsedBody = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[membership/apply] invalid_input", parsedBody.error.issues);
    }
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_input",
        message: "Ungültige Eingabedaten.",
        issues: process.env.NODE_ENV !== "production" ? parsedBody.error.issues : undefined,
      },
      { status: 400 },
    );
  }
  const body = parsedBody.data;
  if (body.hp_membership && body.hp_membership.trim().length > 0) {
    return NextResponse.json(
      { ok: false, error: "invalid_input", message: "Ungültige Eingabedaten." },
      { status: 400 },
    );
  }

  const rateKey = hashedClientKey(req);
  const attempts = await incrementRateLimit(`membership:apply:${rateKey}`, RATE_LIMIT_WINDOW);
  if (attempts > RATE_LIMIT_MAX) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", message: "Zu viele Versuche. Bitte später erneut versuchen." },
      { status: 429 },
    );
  }

  if (typeof body.formStartedAt === "number") {
    const durationMs = Date.now() - body.formStartedAt;
    if (durationMs < MIN_FORM_MS || durationMs > MAX_FORM_MS) {
      return NextResponse.json(
        { ok: false, error: "invalid_input", message: "Ungültige Eingabedaten." },
        { status: 400 },
      );
    }
  }

  const humanCheck = await verifyHumanTokenDetailed(body.humanToken);
  if (!humanCheck.ok) {
    const reason = "code" in humanCheck ? humanCheck.code : "invalid";
    const isExpired = reason === "expired";
    return NextResponse.json(
      {
        ok: false,
        error: isExpired ? "human_token_expired" : "human_token_invalid",
        message: isExpired
          ? "Sicherheitscheck abgelaufen. Bitte erneut bestätigen."
          : "Sicherheitscheck ungültig. Bitte erneut bestätigen.",
      },
      { status: 400 },
    );
  }
  if (humanCheck.payload.formId !== "membership-apply") {
    return NextResponse.json(
      {
        ok: false,
        error: "human_token_invalid",
        message: "Sicherheitscheck ungültig. Bitte erneut bestätigen.",
      },
      { status: 400 },
    );
  }
  if (!isValidIban(body.payment.iban)) {
    return NextResponse.json(
      { ok: false, error: "invalid_iban", message: "Ungültige IBAN." },
      { status: 400 },
    );
  }

  let paymentEnv: ReturnType<typeof getPaymentEnv>;
  try {
    paymentEnv = getPaymentEnv();
  } catch (err) {
    console.error("[membership/apply] env_misconfigured", err);
    return NextResponse.json(
      { ok: false, error: "server_misconfigured" },
      { status: 500 },
    );
  }
  const geoRegion =
    body.payment.geo && Number.isFinite(body.payment.geo.lat) && Number.isFinite(body.payment.geo.lon)
      ? await resolveRegionInfo({
          lat: body.payment.geo.lat,
          lon: body.payment.geo.lon,
          countryCode: DEFAULT_COUNTRY.toUpperCase(),
          postalCode: body.payment.postalCode ?? undefined,
          city: body.payment.city ?? undefined,
        })
      : null;

  if (!body.legalTransparencyAccepted || !body.legalStatuteAccepted) {
    return NextResponse.json(
      { ok: false, error: "legal_required" },
      { status: 400 },
    );
  }

  if (body.members.length > body.householdSize) {
    return NextResponse.json(
      { ok: false, error: "household_mismatch" },
      { status: 400 },
    );
  }

  const hasPrimary = body.members.some((m) => m.role === "primary");
  if (!hasPrimary) {
    return NextResponse.json(
      { ok: false, error: "primary_required" },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const userId = cookieStore.get("u_id")?.value;
  if (!userId || !ObjectId.isValid(userId)) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const Users = await coreCol("users");
  const user = await Users.findOne(
    { _id: new ObjectId(userId) },
    {
      projection: {
        email: 1,
        name: 1,
        emailVerified: 1,
        verification: 1,
        membership: 1,
        profile: 1,
        settings: 1,
        publicFlags: 1,
      },
    },
  );
  if (!user || user.emailVerified === false) {
    return NextResponse.json({ ok: false, error: "email_not_verified" }, { status: 403 });
  }
  if ((user as any)?.membership?.status === "household_locked") {
    return NextResponse.json({ ok: false, error: "household_locked" }, { status: 403 });
  }

  const now = new Date();
  const coreUserId = new ObjectId(userId);
  const MembersCol = await coreCol<MembershipApplication>("membership_applications");
  await ensureMembershipWorkflowIndexes(MembersCol);
  const openApplicationKey = `membership-open:${userId}`;
  const claimId = crypto.randomUUID();
  let application = await MembersCol.findOne({ openApplicationKey });
  let applicationCreated = false;

  if (!application) {
    const membershipId = new ObjectId();
    const paymentReference = `${paymentEnv.referencePrefix}${String(membershipId).slice(-6)}`;
    const dunningFirstDays = Number(process.env.VOG_DUNNING_DAYS_FIRST ?? "7");
    const firstDueAt = new Date(
      now.getTime() + Math.max(1, dunningFirstDays) * 24 * 60 * 60 * 1000,
    );
    const memberRefs: HouseholdMemberRef[] = body.members.map((member) => ({
      email: member.email?.trim().toLowerCase() ?? null,
      givenName: member.givenName ?? null,
      familyName: member.familyName ?? null,
      birthDate: member.birthDate ?? null,
      role: member.role,
      status: member.role === "primary" ? "active" : "invited",
    }));
    const candidate: MembershipApplication = {
      _id: membershipId,
      openApplicationKey,
      workflowStatus: "initializing",
      deliveryClaimId: claimId,
      deliveryClaimedAt: now,
      coreUserId,
      householdSize: body.householdSize,
      peopleCount: body.peopleCount ?? body.householdSize,
      membershipAmountPerMonth:
        body.membershipAmountPerMonth ?? body.amountPerPeriod,
      members: memberRefs,
      amountPerPeriod: body.amountPerPeriod,
      rhythm: body.rhythm,
      edebatte: body.edebatte ?? { enabled: false },
      paymentProfileId: null,
      paymentMethod: "bank_transfer",
      paymentReference,
      paymentInfo: {
        method: "bank_transfer",
        reference: paymentReference,
        bankRecipient: paymentEnv.recipient,
        bankIban: paymentEnv.iban,
        bankIbanMasked: maskIban(paymentEnv.iban),
        bankBic: paymentEnv.bic || null,
        bankName: paymentEnv.bankName || null,
        accountMode: paymentEnv.accountMode as any,
        mandateStatus: "pending_microtransfer",
      },
      legalAcceptedAt: now,
      transparencyVersion: "2025-12-01",
      statuteVersion: "Entwurf-2026-v1",
      firstDueAt,
      dunningLevel: 0,
      lastReminderSentAt: null,
      cancelledAt: null,
      cancelledReason: null,
      mailDeliveryStatus: null,
      mailDeliveryRetryable: null,
      mailDeliveryCategory: null,
      adminMailDeliveryStatus: null,
      adminMailDeliveryRetryable: null,
      adminMailDeliveryCategory: null,
      status: "waiting_payment",
      createdAt: now,
      updatedAt: now,
      address: body.payment.street
        ? {
            street: body.payment.street,
            postalCode: body.payment.postalCode,
            city: body.payment.city,
            country: body.payment.country,
            geo: body.payment.geo
              ? {
                  lat: body.payment.geo.lat,
                  lon: body.payment.geo.lon,
                  label: body.payment.geo.label,
                  region: geoRegion ?? undefined,
                }
              : undefined,
          }
        : undefined,
    };

    try {
      await MembersCol.insertOne(candidate);
      application = candidate;
      applicationCreated = true;
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      application = await MembersCol.findOne({ openApplicationKey });
    }
  }

  if (!application) {
    return NextResponse.json(
      { ok: false, error: "application_state_missing" },
      { status: 500 },
    );
  }

  if (application.workflowStatus === "complete") {
    return successfulMembershipResponse(application, false, true);
  }

  if (!applicationCreated) {
    const claimExpiredBefore = new Date(now.getTime() - DELIVERY_CLAIM_TTL_MS);
    const claimed = await MembersCol.findOneAndUpdate(
      {
        _id: application._id,
        status: "waiting_payment",
        $or: [
          { deliveryClaimId: null },
          { deliveryClaimId: { $exists: false } },
          { deliveryClaimedAt: { $lt: claimExpiredBefore } },
        ],
      },
      {
        $set: {
          deliveryClaimId: claimId,
          deliveryClaimedAt: now,
          updatedAt: now,
        },
      },
      { returnDocument: "after" },
    );
    if (!claimed) {
      return NextResponse.json(
        {
          ok: false,
          error: "application_delivery_in_progress",
          partial: true,
          applicationPersisted: true,
          membershipId: String(application._id),
        },
        { status: 409 },
      );
    }
    application = claimed;
  }

  if (applicationCreated) {
    const microTransferCode = createMicroTransferCode();
    const microTransferExpiresAt = new Date(
      now.getTime() + MICRO_TRANSFER_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    );
    const paymentProfileId = await upsertMembershipPaymentProfile(coreUserId, {
      type: body.payment.type,
      billingName: body.payment.billingName,
      billingAddress: {
        street: body.payment.street,
        postalCode: body.payment.postalCode,
        city: body.payment.city,
        country: body.payment.country,
      },
      iban: normalizeIban(body.payment.iban),
      mandateReference: body.payment.mandateReference,
      microTransferHash: hashMicroTransferCode(microTransferCode),
      microTransferCode,
      microTransferExpiresAt,
      microTransferAttempts: 0,
      microTransferVerifiedAt: null,
    });
    application.paymentProfileId = paymentProfileId;
    application.workflowStatus = "delivery_pending";
    await MembersCol.updateOne(
      { _id: application._id, deliveryClaimId: claimId },
      {
        $set: {
          paymentProfileId,
          workflowStatus: "delivery_pending",
          updatedAt: new Date(),
        },
      },
    );

    await Users.updateOne(
      { _id: coreUserId },
      {
        $set: {
          "membership.status": "waiting_payment",
          "membership.amountPerMonth":
            application.membershipAmountPerMonth ?? application.amountPerPeriod,
          "membership.rhythm": application.rhythm,
          "membership.householdSize": application.householdSize,
          "membership.peopleCount":
            application.peopleCount ?? application.householdSize,
          "membership.submittedAt": now,
          "membership.applicationId": application._id,
          "membership.edebatte": application.edebatte,
          "membership.paymentMethod": application.paymentMethod ?? null,
          "membership.paymentReference": application.paymentReference,
          "membership.paymentInfo": application.paymentInfo,
          updatedAt: now,
        },
      },
    );
  }

  const workflowProfile = await getMembershipPaymentWorkflowProfile(coreUserId);
  if (!workflowProfile?.microTransferCode) {
    await releaseApplicationClaim(MembersCol, application._id, claimId, {
      workflowStatus: "manual_recovery",
    });
    return NextResponse.json(
      {
        ok: false,
        error: "payment_workflow_manual_recovery_required",
        partial: true,
        applicationPersisted: true,
        membershipId: String(application._id),
      },
      { status: 409 },
    );
  }

  const invitesCol = await piiCol<HouseholdInvite>("household_invites");
  await ensureHouseholdInviteIndexes(invitesCol);
  const inviteTargets = application.members.filter(
    (member) =>
      member.role !== "primary" &&
      member.email &&
      member.email.toLowerCase() !== String(user.email ?? "").toLowerCase(),
  );
  const payerMail = user.email;
  const payerName =
    user.name ||
    application.members.find((member) => member.role === "primary")?.givenName ||
    "Mitglied";
  const origin = publicOrigin();
  const base = origin.replace(/\/$/, "");
  const accountUrl = `${base}/account/payment`;
  const shareEnabled = Boolean(
    (user as any)?.profile?.publicFlags?.showMembership ?? (user as any)?.publicFlags?.showMembership,
  );
  const shareId = (user as any)?.profile?.publicShareId;
  const profileUrl = shareEnabled && shareId ? `${base}/profile/${shareId}` : undefined;

  let payerDelivery: SendMailResult | null = null;
  if (!payerMail) {
    await releaseApplicationClaim(MembersCol, application._id, claimId, {
      workflowStatus: "manual_recovery",
      mailDeliveryStatus: "failed",
      mailDeliveryRetryable: false,
      mailDeliveryCategory: "recipient_invalid",
      mailDeliveryAttemptedAt: new Date(),
    });
    return NextResponse.json(
      {
        ok: false,
        error: "recipient_missing",
        partial: true,
        applicationPersisted: true,
        membershipId: String(application._id),
        delivery: {
          status: "failed",
          category: "recipient_invalid",
          retryable: false,
          attemptedCount: 0,
          deliveredCount: 0,
          failedCount: 1,
        },
      },
      { status: 409 },
    );
  }

  if (
    application.mailDeliveryStatus === "failed" &&
    application.mailDeliveryRetryable !== true
  ) {
    await releaseApplicationClaim(MembersCol, application._id, claimId, {
      workflowStatus: "manual_recovery",
    });
    return NextResponse.json(
      {
        ok: false,
        error: "mail_delivery_manual_recovery_required",
        partial: true,
        applicationPersisted: true,
        membershipId: String(application._id),
      },
      { status: 409 },
    );
  }

  if (application.mailDeliveryStatus !== "delivered") {
    const mail = buildMembershipApplyUserMail({
      displayName: payerName,
      amountPerPeriod: application.amountPerPeriod,
      rhythm: application.rhythm,
      householdSize: application.householdSize,
      membershipId: String(application._id),
      accountUrl,
      edebatte: application.edebatte,
      paymentMethod: application.paymentMethod,
      paymentReference: application.paymentReference ?? "",
      paymentInfo: application.paymentInfo,
      bankDetails: {
        recipient: application.paymentInfo?.bankRecipient ?? paymentEnv.recipient,
        iban: application.paymentInfo?.bankIban ?? paymentEnv.iban,
        bic: application.paymentInfo?.bankBic ?? "",
        bankName: application.paymentInfo?.bankName ?? "",
        accountMode:
          application.paymentInfo?.accountMode ?? paymentEnv.accountMode,
      },
      profileUrl,
      locale: mailLocaleFromUser(user),
    });
    payerDelivery = await sendMail({
      to: payerMail,
      mail,
      delivery: "required_delivery",
      tag: "membership_application_confirmation",
    });
    await MembersCol.updateOne(
      { _id: application._id, deliveryClaimId: claimId },
      {
        $set: {
          mailDeliveryStatus: payerDelivery.status,
          mailDeliveryRetryable: payerDelivery.retryable,
          mailDeliveryCategory: payerDelivery.category,
          mailDeliveryAttemptedAt: new Date(),
        },
      },
    );
    if (!payerDelivery.ok) {
      await releaseApplicationClaim(MembersCol, application._id, claimId, {
        workflowStatus: payerDelivery.retryable ? "partial" : "manual_recovery",
      });
      return NextResponse.json(
        {
          ok: false,
          error: "mail_delivery_failed",
          partial: true,
          applicationPersisted: true,
          membershipId: String(application._id),
          delivery: mailFailureMetadata(payerDelivery),
        },
        { status: payerDelivery.retryable ? 502 : 409 },
      );
    }
    application.mailDeliveryStatus = "delivered";
  } else {
    payerDelivery = deliveredReplayResult();
  }

  let existingInvites = await invitesCol
    .find({ membershipId: application._id })
    .toArray();
  for (const target of inviteTargets) {
    const targetEmail = target.email!.trim().toLowerCase();
    if (
      existingInvites.some(
        (invite) => invite.targetEmail.trim().toLowerCase() === targetEmail,
      )
    ) {
      continue;
    }
    const invite: HouseholdInvite = {
      _id: new ObjectId(),
      membershipId: application._id,
      coreUserId,
      targetEmail,
      targetGivenName: target.givenName ?? null,
      targetFamilyName: target.familyName ?? null,
      token: safeRandomId(),
      status: "pending",
      deliveryStatus: "pending",
      deliveryRetryable: null,
      deliveryCategory: null,
      sentAt: now,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await invitesCol.insertOne(invite);
      existingInvites.push(invite);
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
    }
  }

  const adminTo = process.env.MAIL_ADMIN_TO || paymentEnv.membershipContactEmail;
  if (
    application.adminMailDeliveryStatus !== "delivered" &&
    !(
      application.adminMailDeliveryStatus === "failed" &&
      application.adminMailDeliveryRetryable !== true
    )
  ) {
    const adminMail = buildMembershipApplyAdminMail({
      membershipId: String(application._id),
      userId: String(userId),
      email: user.email ?? "n/a",
      amountPerPeriod: application.amountPerPeriod,
      rhythm: application.rhythm,
      householdSize: application.householdSize,
      paymentMethod: application.paymentMethod,
      paymentReference: application.paymentReference ?? "",
      payerName: workflowProfile.billingName ?? payerName,
      payerIban: workflowProfile.ibanMasked ?? undefined,
      microTransferCode: workflowProfile.microTransferCode,
    });
    const adminDelivery = await sendMail({
      to: adminTo,
      mail: adminMail,
      delivery: "best_effort_delivery",
      tag: "membership_application_admin",
    });
    await MembersCol.updateOne(
      { _id: application._id, deliveryClaimId: claimId },
      {
        $set: {
          adminMailDeliveryStatus: adminDelivery.status,
          adminMailDeliveryRetryable: adminDelivery.retryable,
          adminMailDeliveryCategory: adminDelivery.category,
          adminMailDeliveryAttemptedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );
    application.adminMailDeliveryStatus = adminDelivery.status;
    application.adminMailDeliveryRetryable = adminDelivery.retryable;
  }

  if (!application.submittedTelemetryAt) {
    try {
      await logMembershipApplySubmitted({
        userId: String(userId),
        membershipId: String(application._id),
        amountPerPeriod: application.amountPerPeriod,
        rhythm: application.rhythm,
        householdSize: application.householdSize,
      });
      await MembersCol.updateOne(
        { _id: application._id, deliveryClaimId: claimId },
        { $set: { submittedTelemetryAt: new Date(), updatedAt: new Date() } },
      );
    } catch (err) {
      console.error("[membership.apply] telemetry failed", err);
    }
  }

  const attemptedInviteDeliveries: SendMailResult[] = [];
  for (const invite of existingInvites) {
    if (invite.deliveryStatus === "delivered") continue;
    if (
      invite.deliveryStatus === "failed" &&
      invite.deliveryRetryable !== true
    ) {
      continue;
    }
    const inviteUrl = `${base}/register?invite=${encodeURIComponent(invite.token)}`;
    const inviteName = [
      invite.targetGivenName,
      invite.targetFamilyName,
    ]
      .filter(Boolean)
      .join(" ");
      const inviteMail = buildHouseholdInviteMail({
        targetName: inviteName,
        inviteUrl,
        inviterName: payerName,
        locale: mailLocaleFromUser(user),
      });
      const inviteDelivery = await sendMail({
        to: invite.targetEmail,
        mail: inviteMail,
        delivery: "required_delivery",
        tag: "household_invite",
      });
      attemptedInviteDeliveries.push(inviteDelivery);
      await invitesCol.updateOne(
        { _id: invite._id, membershipId: application._id },
        {
          $set: {
            deliveryStatus: inviteDelivery.status,
            deliveryRetryable: inviteDelivery.retryable,
            deliveryCategory: inviteDelivery.category,
            deliveryAttemptedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );
  }

  existingInvites = await invitesCol
    .find({ membershipId: application._id })
    .toArray();
  const permanentInviteFailures = existingInvites.filter(
    (invite) =>
      invite.deliveryStatus === "failed" &&
      invite.deliveryRetryable !== true,
  );
  const retryableInviteFailures = existingInvites.filter(
    (invite) =>
      invite.deliveryStatus !== "delivered" &&
      invite.deliveryRetryable === true,
  );

  if (permanentInviteFailures.length > 0 || retryableInviteFailures.length > 0) {
    const retryable = retryableInviteFailures.length > 0;
    await releaseApplicationClaim(MembersCol, application._id, claimId, {
      workflowStatus: retryable ? "partial" : "manual_recovery",
    });
    return NextResponse.json(
      {
        ok: false,
        error: retryable
          ? "household_invite_delivery_failed"
          : "household_invite_manual_recovery_required",
        partial: true,
        applicationPersisted: true,
        membershipId: String(application._id),
        delivery: aggregateInviteDelivery(
          attemptedInviteDeliveries,
          existingInvites,
          retryable,
        ),
      },
      { status: retryable ? 502 : 409 },
    );
  }

  if (existingInvites.length > 0 && attemptedInviteDeliveries.some((result) => result.ok)) {
    try {
      await logHouseholdInviteSent({
        userId: String(userId),
        membershipId: String(application._id),
        inviteCount: existingInvites.length,
      });
    } catch (err) {
      console.error("[membership.apply] invite telemetry failed", err);
    }
  }

  await releaseApplicationClaim(MembersCol, application._id, claimId, {
    workflowStatus: "complete",
  });
  application.workflowStatus = "complete";
  return successfulMembershipResponse(
    application,
    applicationCreated,
    !applicationCreated,
    existingInvites.length,
    payerDelivery,
  );
}

async function ensureMembershipWorkflowIndexes(
  col: Awaited<ReturnType<typeof coreCol<MembershipApplication>>>,
) {
  if (workflowIndexesEnsured) return;
  await col.createIndex(
    { openApplicationKey: 1 },
    { unique: true, sparse: true, name: "membership_open_application_unique" },
  );
  workflowIndexesEnsured = true;
}

async function ensureHouseholdInviteIndexes(
  col: Awaited<ReturnType<typeof piiCol<HouseholdInvite>>>,
) {
  await col.createIndex(
    { membershipId: 1, targetEmail: 1 },
    { unique: true, name: "household_invite_recipient_unique" },
  );
}

async function releaseApplicationClaim(
  col: Awaited<ReturnType<typeof coreCol<MembershipApplication>>>,
  membershipId: ObjectId,
  claimId: string,
  fields: Partial<MembershipApplication>,
) {
  await col.updateOne(
    { _id: membershipId, deliveryClaimId: claimId },
    {
      $set: {
        ...fields,
        deliveryClaimId: null,
        deliveryClaimedAt: null,
        updatedAt: new Date(),
      },
    },
  );
}

function deliveredReplayResult(): SendMailResult {
  return {
    ok: true,
    status: "delivered",
    transport: "smtp",
    category: null,
    retryable: false,
    attemptedCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    messageId: null,
  };
}

function aggregateInviteDelivery(
  attempted: SendMailResult[],
  invites: HouseholdInvite[],
  retryable: boolean,
) {
  const failures = attempted.filter(
    (delivery): delivery is Extract<SendMailResult, { ok: false }> =>
      !delivery.ok,
  );
  const deliveredRecipientCount = invites.filter(
    (invite) => invite.deliveryStatus === "delivered",
  ).length;
  return {
    status: deliveredRecipientCount > 0
      ? "partial"
      : "failed",
    category: failures[0]?.category ?? "smtp_unknown_error",
    retryable,
    attemptedCount: attempted.reduce(
      (sum, delivery) => sum + delivery.attemptedCount,
      0,
    ),
    deliveredCount: attempted.reduce(
      (sum, delivery) => sum + delivery.deliveredCount,
      0,
    ),
    failedCount: failures.reduce(
      (sum, delivery) => sum + delivery.failedCount,
      0,
    ),
  };
}

function successfulMembershipResponse(
  application: MembershipApplication,
  created: boolean,
  idempotentReplay: boolean,
  invitesCreated = application.members.filter(
    (member) => member.role !== "primary" && Boolean(member.email),
  ).length,
  payerDelivery: SendMailResult = deliveredReplayResult(),
) {
  return NextResponse.json(
    {
      ok: true,
      idempotentReplay,
      data: {
        membershipId: String(application._id),
        invitesCreated,
        delivery: { status: payerDelivery.status },
      },
    },
    { status: created ? 201 : 200 },
  );
}
