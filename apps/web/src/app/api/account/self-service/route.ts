import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { coreCol, ObjectId } from "@core/db/triMongo";
import { piiCol } from "@core/db/db/triMongo";
import { mailFailureMetadata, sendMail } from "@/utils/mailer";
import { renderTransactionalMail } from "@/utils/mailRenderer";
import { verifyPassword } from "@/utils/password";
import { clearSession, readSession } from "@/utils/session";
import { CREDENTIAL_COLLECTION } from "../../auth/sharedAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["cancel_membership", "delete_account"]),
  note: z.string().max(1000).optional(),
  password: z.string().min(8).optional(),
});

const DELIVERY_CLAIM_TTL_MS = 5 * 60_000;

export async function POST(req: NextRequest) {
  const session = await readSession();
  const userId = session?.uid ?? null;

  if (!userId || !ObjectId.isValid(userId)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const { action, note, password } = parsed.data;
  const oid = new ObjectId(userId);
  const Users = await coreCol("users");
  const user = await Users.findOne(
    { _id: oid },
    {
      projection: {
        email: 1,
        name: 1,
        profile: 1,
        membership: 1,
        accountDeletion: 1,
      },
    },
  );
  if (!user) {
    return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
  }

  const now = new Date();
  const reason = (note ?? "").trim().slice(0, 240) || action;
  const membershipSet: Record<string, unknown> = {
    "membership.status": "cancelled",
    "membership.cancelledAt": now,
    "membership.cancelledReason": reason,
    "membership.endedByUser": true,
  };

  let deletionRequest:
    | {
        requestId: string;
        status: string;
        requestedAt: Date;
        reason: string;
        deliveryStatus?: string | null;
        deliveryRetryable?: boolean | null;
        deliveryCategory?: string | null;
        deliveryClaimId?: string | null;
        applicationCancellationStatus?: "pending" | "applied";
      }
    | null = null;
  const claimId = crypto.randomUUID();

  if (action === "cancel_membership") {
    await Users.updateOne(
      { _id: oid },
      {
        $set: {
          ...membershipSet,
          updatedAt: now,
        },
      },
    );
  } else {
    if (!password) {
      return NextResponse.json({ ok: false, error: "password_required" }, { status: 400 });
    }
    const credsCol = await piiCol(CREDENTIAL_COLLECTION);
    const creds = await credsCol.findOne({ coreUserId: oid }, { projection: { passwordHash: 1 } });
    if (!creds?.passwordHash) {
      return NextResponse.json({ ok: false, error: "credentials_missing" }, { status: 400 });
    }
    const pwdOk = await verifyPassword(password, String(creds.passwordHash));
    if (!pwdOk) {
      return NextResponse.json({ ok: false, error: "invalid_password" }, { status: 401 });
    }

    const currentDeletion = (user as any).accountDeletion ?? null;
    if (currentDeletion?.deliveryStatus === "delivered") {
      await clearSession();
      return NextResponse.json({
        ok: true,
        action,
        idempotentReplay: true,
        delivery: { status: "delivered" },
        next: "/logout",
      });
    }
    if (
      currentDeletion?.deliveryStatus === "failed" &&
      currentDeletion?.deliveryRetryable !== true
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "mail_delivery_manual_recovery_required",
          partial: true,
          mutationPersisted: true,
          action,
        },
        { status: 409 },
      );
    }

    const requestId = crypto.randomUUID();
    if (!currentDeletion) {
      const created = await Users.findOneAndUpdate(
        {
          _id: oid,
          "accountDeletion.status": { $exists: false },
        },
        {
          $set: {
            ...membershipSet,
            accountDeletion: {
              requestId,
              status: "requested",
              requestedAt: now,
              reason,
              deliveryStatus: "pending",
              deliveryRetryable: null,
              deliveryCategory: null,
              deliveryAttemptedAt: null,
              deliveryClaimId: claimId,
              deliveryClaimedAt: now,
              applicationCancellationStatus: "pending",
              applicationCancellationAppliedAt: null,
            },
            updatedAt: now,
          },
        },
        { returnDocument: "after" },
      );
      if (created?.accountDeletion?.requestId === requestId) {
        deletionRequest = created.accountDeletion;
      }
    }

    if (!deletionRequest) {
      const claimExpiredBefore = new Date(now.getTime() - DELIVERY_CLAIM_TTL_MS);
      const claimed = await Users.findOneAndUpdate(
        {
          _id: oid,
          "accountDeletion.status": "requested",
          $or: [
            { "accountDeletion.deliveryClaimId": null },
            { "accountDeletion.deliveryClaimId": { $exists: false } },
            { "accountDeletion.deliveryClaimedAt": { $lt: claimExpiredBefore } },
          ],
          "accountDeletion.deliveryStatus": { $in: ["pending", "failed"] },
          $and: [
            {
              $or: [
                { "accountDeletion.deliveryRetryable": true },
                { "accountDeletion.deliveryRetryable": null },
                { "accountDeletion.deliveryRetryable": { $exists: false } },
              ],
            },
          ],
        },
        {
          $set: {
            "accountDeletion.deliveryStatus": "pending",
            "accountDeletion.deliveryClaimId": claimId,
            "accountDeletion.deliveryClaimedAt": now,
            updatedAt: now,
          },
        },
        { returnDocument: "after" },
      );
      deletionRequest = claimed?.accountDeletion ?? null;
    }

    if (!deletionRequest || deletionRequest.deliveryClaimId !== claimId) {
      return NextResponse.json(
        {
          ok: false,
          error: "mail_delivery_in_progress",
          partial: true,
          mutationPersisted: true,
          action,
        },
        { status: 409 },
      );
    }
  }

  const Applications = await coreCol("membership_applications");
  if (
    action === "cancel_membership" ||
    deletionRequest?.applicationCancellationStatus !== "applied"
  ) {
    await Applications.updateMany(
      { coreUserId: oid },
      {
        $set: {
          status: "cancelled",
          cancelledAt: now,
          cancelledReason:
            action === "delete_account"
              ? deletionRequest?.reason ?? reason
              : reason,
          updatedAt: now,
        },
        $unset: {
          openApplicationKey: "",
          deliveryClaimId: "",
          deliveryClaimedAt: "",
        },
      },
    );
    if (action === "delete_account") {
      const appliedAt = new Date();
      await Users.updateOne(
        {
          _id: oid,
          "accountDeletion.requestId": deletionRequest?.requestId,
          "accountDeletion.deliveryClaimId": claimId,
        },
        {
          $set: {
            "accountDeletion.applicationCancellationStatus": "applied",
            "accountDeletion.applicationCancellationAppliedAt": appliedAt,
            updatedAt: appliedAt,
          },
        },
      );
      if (deletionRequest) {
        deletionRequest.applicationCancellationStatus = "applied";
      }
    }
  }

  const to = process.env.CONTACT_INBOX || "members@edebatte.org";
  const safeName = (user as any)?.profile?.displayName || (user as any)?.name || "Unbekannt";
  const safeEmail = (user as any)?.email || "unbekannt";
  const subject = `[Self-Service] ${action === "cancel_membership" ? "Mitgliedschaft beenden" : "Account-Löschung"} angefordert`;
  const mail = renderTransactionalMail({
    subject,
    preheader: "Eine Account-Self-Service-Anfrage wurde erfasst.",
    title: "Selbst-Service-Anfrage",
    blocks: [
      {
        kind: "details",
        rows: [
          { label: "User-ID", value: oid.toHexString() },
          { label: "Name", value: safeName },
          { label: "E-Mail", value: safeEmail },
          { label: "Aktion", value: action },
          {
            label: "Hinweis",
            value:
              action === "delete_account"
                ? deletionRequest?.reason ?? reason
                : reason || "–",
          },
        ],
      },
    ],
    reason: "eine Account-Self-Service-Anfrage intern geprüft werden muss.",
  });

  const mailResult = await sendMail({
    to,
    mail,
    delivery: "required_delivery",
    tag: "account_self_service",
  });

  const deliveryAt = new Date();
  if (action === "delete_account") {
    await Users.updateOne(
      {
        _id: oid,
        "accountDeletion.requestId": deletionRequest?.requestId,
        "accountDeletion.deliveryClaimId": claimId,
      },
      {
        $set: {
          "accountDeletion.status": mailResult.ok ? "notified" : "requested",
          "accountDeletion.deliveryStatus": mailResult.status,
          "accountDeletion.deliveryAt": deliveryAt,
          "accountDeletion.deliveryRetryable": mailResult.retryable,
          "accountDeletion.deliveryCategory": mailResult.category,
          "accountDeletion.deliveryClaimId": null,
          "accountDeletion.deliveryClaimedAt": null,
          updatedAt: deliveryAt,
        },
      },
    );
  } else {
    await Users.updateOne(
      { _id: oid },
      {
        $set: {
          "selfService.lastDeliveryStatus": mailResult.status,
          "selfService.lastDeliveryAt": deliveryAt,
          "selfService.lastDeliveryRetryable": mailResult.retryable,
          "selfService.lastDeliveryCategory": mailResult.category,
          updatedAt: deliveryAt,
        },
      },
    );
  }

  if (!mailResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "mail_delivery_failed",
        partial: true,
        mutationPersisted: true,
        action,
        delivery: mailFailureMetadata(mailResult),
      },
      { status: 502 },
    );
  }

  if (action === "delete_account") {
    await clearSession();
  }

  return NextResponse.json({
    ok: true,
    action,
    delivery: {
      status: mailResult.status,
      attemptedCount: mailResult.attemptedCount,
      deliveredCount: mailResult.deliveredCount,
      failedCount: mailResult.failedCount,
    },
    next: action === "delete_account" ? "/logout" : "/account",
  });
}
