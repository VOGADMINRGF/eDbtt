export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId, getCol } from "@core/db/triMongo";
import { OrgInviteSchema } from "@features/org/schemas";
import { orgMembershipsCol, orgsCol } from "@features/org/db";
import {
  issueOrgInviteSetupToken,
  recordOrgInviteSetupDelivery,
  startOrgInviteSetupDispatch,
} from "@features/org/inviteDelivery";
import { requireAdminOrOrgRole } from "@/lib/server/auth/org";
import { recordAuditEvent } from "@features/audit/recordAuditEvent";
import { resetEmailLink } from "@/utils/email";
import { buildOrgInviteMail, buildOrgAccessMail } from "@/utils/emailTemplates";
import { mailLocaleFromUser } from "@/utils/mailRenderer";
import { mailFailureMetadata, sendMail } from "@/utils/mailer";
import { DEFAULT_LOCALE } from "@core/locale/locales";
import type { UserRole } from "@/types/user";
import type { OrgMembershipDoc } from "@features/org/types";

const INVITE_TTL_DAYS = 7;
const DELIVERY_CLAIM_TTL_MS = 5 * 60_000;

export async function POST(req: NextRequest, ctx: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await ctx.params;
  const gate = await requireAdminOrOrgRole(req, orgId, ["org_admin"]);
  if (gate instanceof Response) return gate;

  if (!ObjectId.isValid(orgId)) {
    return NextResponse.json({ ok: false, error: "invalid_org" }, { status: 400 });
  }

  const parsed = OrgInviteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const role = parsed.data.role;
  const orgObjectId = new ObjectId(orgId);
  const usersCol = await getCol("users");
  const orgs = await orgsCol();
  const org = await orgs.findOne({ _id: orgObjectId });
  if (!org) return NextResponse.json({ ok: false, error: "org_not_found" }, { status: 404 });

  let userRecord = await usersCol.findOne({
    $or: [{ email }, { email_lc: email }],
  });
  const now = new Date();
  let userId: ObjectId;

  if (!userRecord) {
    const newUser = {
      email,
      email_lc: email,
      name: email.split("@")[0],
      role: "user" as UserRole,
      roles: ["user"] as UserRole[],
      verifiedEmail: false,
      emailVerified: false,
      accessTier: "citizenBasic",
      b2cPlanId: "citizenBasic",
      tier: "citizenBasic",
      profile: {
        displayName: email.split("@")[0],
        locale: DEFAULT_LOCALE,
      },
      settings: {
        preferredLocale: DEFAULT_LOCALE,
        newsletterOptIn: false,
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
    try {
      const insert = await usersCol.insertOne(newUser);
      userId = insert.insertedId;
      userRecord = { ...newUser, _id: userId };
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      userRecord = await usersCol.findOne({
        $or: [{ email }, { email_lc: email }],
      });
      if (!userRecord?._id) throw error;
      userId = userRecord._id as ObjectId;
    }
  } else {
    userId = userRecord._id as ObjectId;
  }

  const memberships = await orgMembershipsCol();
  const existingMembership = await memberships.findOne({
    orgId: orgObjectId,
    userId,
  });

  if (existingMembership?.status === "active") {
    return NextResponse.json({ ok: false, error: "already_member" }, { status: 409 });
  }
  if (
    existingMembership?.inviteDeliveryStatus === "failed" &&
    existingMembership.inviteDeliveryRetryable !== true
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "mail_delivery_manual_recovery_required",
        membershipId: String(existingMembership._id),
        status: existingMembership.status,
      },
      { status: 409 },
    );
  }

  const claimId = crypto.randomUUID();
  const claimExpiredBefore = new Date(now.getTime() - DELIVERY_CLAIM_TTL_MS);
  let membership: OrgMembershipDoc | null = null;

  if (!existingMembership) {
    const initialStatus =
      userRecord?.emailVerified === false ||
      userRecord?.verifiedEmail === false
        ? "invited"
        : "pending_activation";
    const membershipId = new ObjectId();
    const inviteExpiresAt =
      initialStatus === "invited"
        ? new Date(
        now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000,
          )
        : null;

    membership = await memberships.findOneAndUpdate(
      { orgId: orgObjectId, userId },
      {
        $setOnInsert: {
          _id: membershipId,
          orgId: orgObjectId,
          userId,
          role,
          status: initialStatus,
          invitedEmail: email,
          invitedByUserId: new ObjectId(String(gate.user._id)),
          inviteTokenHash: null,
          inviteExpiresAt,
          inviteSetupTokenHash: null,
          inviteSetupTokenExpiresAt: null,
          inviteDeliveryStatus: "pending",
          inviteDeliveryAttemptedAt: null,
          inviteDeliveryRetryable: null,
          inviteDeliveryCategory: null,
          inviteDeliveryClaimId: claimId,
          inviteDeliveryClaimedAt: now,
          createdAt: now,
          updatedAt: now,
          disabledAt: null,
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    if (membership?.inviteDeliveryClaimId !== claimId) {
      return deliveryInProgressResponse(membership);
    }
  } else {
    membership = await memberships.findOneAndUpdate(
      {
        _id: existingMembership._id,
        status: existingMembership.status,
        $or: [
          { inviteDeliveryClaimId: null },
          { inviteDeliveryClaimId: { $exists: false } },
          { inviteDeliveryClaimedAt: { $lt: claimExpiredBefore } },
        ],
      },
      {
        $set: {
          inviteDeliveryClaimId: claimId,
          inviteDeliveryClaimedAt: now,
          inviteDeliveryStatus: "pending",
          updatedAt: now,
        },
      },
      { returnDocument: "after" },
    );
    if (!membership) return deliveryInProgressResponse(existingMembership);
  }

  if (!membership?._id) {
    return NextResponse.json({ ok: false, error: "membership_state_missing" }, { status: 500 });
  }

  const locale = mailLocaleFromUser(userRecord) ?? DEFAULT_LOCALE;
  let mail: ReturnType<typeof buildOrgInviteMail>;
  let setupDispatch:
    | {
        rawToken: string;
        tokenHash: string;
        expiresAt: Date;
        dispatchedAt: Date;
      }
    | null = null;
  if (membership.status === "invited") {
    const setupToken = await issueOrgInviteSetupToken({
      membershipId: membership._id,
      userId,
      ttlMinutes: INVITE_TTL_DAYS * 24 * 60,
    });
    const tokenBound = await memberships.updateOne(
      { _id: membership._id, inviteDeliveryClaimId: claimId },
      {
        $set: {
          inviteTokenHash: null,
          inviteExpiresAt: setupToken.expiresAt,
          inviteSetupTokenHash: setupToken.tokenHash,
          inviteSetupTokenExpiresAt: setupToken.expiresAt,
          inviteDeliveryStatus: "pending",
          inviteDeliveryRetryable: null,
          inviteDeliveryCategory: null,
          inviteDeliveryAttemptedAt: null,
          updatedAt: new Date(),
        },
      },
    );
    const dispatchedAt = new Date();
    const dispatchStarted =
      tokenBound.modifiedCount === 1 &&
      (await startOrgInviteSetupDispatch({
        membershipId: membership._id,
        rawToken: setupToken.rawToken,
        dispatchId: claimId,
        startedAt: dispatchedAt,
      }));
    if (!dispatchStarted) {
      await releaseClaimAsFailure(
        memberships,
        membership._id,
        claimId,
        "invite_setup_token_not_current",
        true,
      );
      return NextResponse.json(
        {
          ok: false,
          error: "invite_setup_token_retry_required",
          membershipId: String(membership._id),
          status: membership.status,
        },
        { status: 502 },
      );
    }
    setupDispatch = { ...setupToken, dispatchedAt };
    const resetUrl = resetEmailLink(setupToken.rawToken);
    mail = buildOrgInviteMail({
      resetUrl,
      orgName: org.name,
      role: membership.role,
      displayName: userRecord?.name ?? null,
      expiresAt: setupToken.expiresAt.toISOString(),
      locale,
    });
  } else {
    const accessUrl = `${process.env.PUBLIC_BASE_URL ?? "http://localhost:3000"}/login`;
    mail = buildOrgAccessMail({
      accessUrl,
      orgName: org.name,
      role: membership.role,
      displayName: userRecord?.name ?? null,
      locale,
    });
  }

  const transportResult = await sendMail({
    to: email,
    mail,
    delivery: "required_delivery",
    tag: membership.status === "invited" ? "org_invite" : "org_access",
  });
  const setupResultCurrent = setupDispatch
    ? await recordOrgInviteSetupDelivery({
        membershipId: membership._id,
        rawToken: setupDispatch.rawToken,
        dispatchId: claimId,
        dispatchedAt: setupDispatch.dispatchedAt,
        result: transportResult,
      })
    : true;
  const mailResult =
    setupResultCurrent || !transportResult.ok
      ? transportResult
      : staleSetupTokenFailure();
  const completedAt = new Date();
  const activated = membership.status === "pending_activation" && mailResult.ok;
  const finalStatus = activated ? "active" : membership.status;

  await memberships.updateOne(
    {
      _id: membership._id,
      inviteDeliveryClaimId: claimId,
      ...(setupDispatch
        ? { inviteSetupTokenHash: setupDispatch.tokenHash }
        : {}),
    },
    {
      $set: {
        status: finalStatus,
        inviteDeliveryStatus: mailResult.ok ? "delivered" : "failed",
        inviteDeliveryAttemptedAt: completedAt,
        inviteDeliveryRetryable: mailResult.retryable,
        inviteDeliveryCategory: mailResult.category,
        inviteDeliveryClaimId: null,
        inviteDeliveryClaimedAt: null,
        updatedAt: completedAt,
      },
    },
  );

  await recordAuditEvent({
    scope: "org",
    action: "org.member.invite",
    actorUserId: String(gate.user._id),
    actorIp: getRequestIp(req),
    target: { type: "org_membership", id: String(membership._id) },
    after: { ...membership, status: finalStatus },
    reason: mailResult.ok
      ? activated
        ? "member_activated_after_required_access_delivery"
        : "invite_delivered_membership_remains_invited"
      : membership.status === "pending_activation"
        ? "member_activation_pending_required_delivery_failed"
        : "invite_pending_required_delivery_failed",
  });

  if (!mailResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "mail_delivery_failed",
        partial: true,
        membershipPersisted: true,
        membershipId: String(membership._id),
        status: membership.status,
        delivery: mailFailureMetadata(mailResult),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    membershipId: String(membership._id),
    status: finalStatus,
    delivery: {
      status: mailResult.status,
      attemptedCount: mailResult.attemptedCount,
      deliveredCount: mailResult.deliveredCount,
      failedCount: mailResult.failedCount,
    },
  });
}

function deliveryInProgressResponse(membership: OrgMembershipDoc | null) {
  return NextResponse.json(
    {
      ok: false,
      error: "mail_delivery_in_progress",
      membershipId: membership?._id ? String(membership._id) : null,
      status: membership?.status ?? null,
    },
    { status: 409 },
  );
}

async function releaseClaimAsFailure(
  memberships: Awaited<ReturnType<typeof orgMembershipsCol>>,
  membershipId: ObjectId,
  claimId: string,
  category: string,
  retryable: boolean,
) {
  await memberships.updateOne(
    { _id: membershipId, inviteDeliveryClaimId: claimId },
    {
      $set: {
        inviteDeliveryStatus: "failed",
        inviteDeliveryRetryable: retryable,
        inviteDeliveryCategory: category,
        inviteDeliveryAttemptedAt: new Date(),
        inviteDeliveryClaimId: null,
        inviteDeliveryClaimedAt: null,
        updatedAt: new Date(),
      },
    },
  );
}

function staleSetupTokenFailure() {
  return {
    ok: false,
    status: "failed",
    transport: "smtp",
    code: "mail_transport_error",
    category: "smtp_unknown_error",
    retryable: true,
    attemptedCount: 1,
    deliveredCount: 0,
    failedCount: 1,
    messageId: null,
  } as const;
}

function getRequestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}
