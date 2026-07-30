#!/usr/bin/env tsx
import crypto from "node:crypto";
import { coreCol } from "@core/db/triMongo";
import type { MembershipApplication } from "@core/memberships/types";
import { buildMembershipReminderMail } from "@/utils/emailTemplates";
import { sendMail, type SendMailResult } from "@/utils/mailer";
import { mailLocaleFromUser } from "@/utils/mailRenderer";

const CLAIM_TTL_MS = 10 * 60_000;
const BASE_BACKOFF_MS = 5 * 60_000;
const MAX_BACKOFF_MS = 24 * 60 * 60_000;

export async function runMembershipDunning(now = new Date()) {
  if (process.env.VOG_DUNNING_ENABLED === "0") {
    console.log("[dunning] disabled via env");
    return { scanned: 0, claimed: 0, delivered: 0, retryScheduled: 0, manualRecovery: 0 };
  }

  const daysFirst = Number(process.env.VOG_DUNNING_DAYS_FIRST ?? "3");
  const daysSecond = Number(process.env.VOG_DUNNING_DAYS_SECOND ?? "7");
  const daysCancel = Number(process.env.VOG_DUNNING_DAYS_CANCEL ?? "21");

  const Applications = await coreCol<MembershipApplication>("membership_applications");
  const Users = await coreCol("users");
  const pending = await Applications.find({ status: "waiting_payment" }).toArray();
  const summary = {
    scanned: pending.length,
    claimed: 0,
    delivered: 0,
    retryScheduled: 0,
    manualRecovery: 0,
  };

  for (const snapshot of pending) {
    const stage = resolveDueStage(snapshot, now, {
      first: daysFirst,
      second: daysSecond,
      cancel: daysCancel,
    });
    if (!stage) continue;
    if (snapshot.dunningRecoveryStatus === "manual") continue;
    if (
      snapshot.dunningNextAttemptAt &&
      snapshot.dunningNextAttemptAt.getTime() > now.getTime()
    ) {
      continue;
    }

    const claimId = crypto.randomUUID();
    const claimExpiredBefore = new Date(now.getTime() - CLAIM_TTL_MS);
    const claimed = await Applications.findOneAndUpdate(
      {
        _id: snapshot._id,
        status: "waiting_payment",
        $or: [
          { dunningClaimId: null },
          { dunningClaimId: { $exists: false } },
          { dunningClaimedAt: { $lt: claimExpiredBefore } },
        ],
        $and: [
          dunningLevelFilter(snapshot.dunningLevel ?? 0),
          {
            $or: [
              { dunningRecoveryStatus: null },
              { dunningRecoveryStatus: { $exists: false } },
            ],
          },
          {
            $or: [
              { dunningNextAttemptAt: null },
              { dunningNextAttemptAt: { $exists: false } },
              { dunningNextAttemptAt: { $lte: now } },
            ],
          },
        ],
      },
      {
        $set: {
          dunningClaimId: claimId,
          dunningClaimedAt: now,
          updatedAt: now,
        },
      },
      { returnDocument: "after" },
    );
    if (!claimed) continue;
    summary.claimed += 1;

    const user = await Users.findOne(
      { _id: claimed.coreUserId },
      { projection: { email: 1, name: 1, profile: 1, settings: 1 } },
    );

    let mailResult: SendMailResult;
    if (!user?.email) {
      mailResult = permanentRecipientFailure();
    } else {
      try {
        const mail = buildMembershipReminderMail(stage.sendLevel, {
          displayName: user.name ?? "Mitglied",
          amountPerPeriod: claimed.amountPerPeriod,
          rhythm: claimed.rhythm,
          householdSize: claimed.householdSize,
          paymentInfo: claimed.paymentInfo,
          reference: claimed.paymentReference ?? "",
          locale: mailLocaleFromUser(user),
        });
        mailResult = await sendMail({
          to: user.email,
          mail,
          delivery: "required_delivery",
          tag: "membership_dunning_reminder",
        });
      } catch (error) {
        console.error("[dunning] mail execution failed", {
          category: "smtp_unknown_error",
        });
        mailResult = transientExecutionFailure();
      }
    }

    if (!mailResult.ok) {
      const failureCount = (claimed.dunningFailureCount ?? 0) + 1;
      const retryAt = mailResult.retryable
        ? new Date(now.getTime() + retryBackoffMs(failureCount))
        : null;
      await Applications.updateOne(
        { _id: claimed._id, dunningClaimId: claimId },
        {
          $set: {
            lastReminderDeliveryStatus: mailResult.status,
            lastReminderDeliveryCategory: mailResult.category,
            lastReminderDeliveryRetryable: mailResult.retryable,
            lastReminderDeliveryAttemptedAt: now,
            dunningFailureCount: failureCount,
            dunningNextAttemptAt: retryAt,
            dunningRecoveryStatus: mailResult.retryable ? null : "manual",
            dunningClaimId: null,
            dunningClaimedAt: null,
            updatedAt: now,
          },
        },
      );
      if (mailResult.retryable) summary.retryScheduled += 1;
      else summary.manualRecovery += 1;
      continue;
    }

    const update: Record<string, unknown> = {
      dunningLevel: stage.nextLevel,
      lastReminderSentAt: now,
      lastReminderDeliveryStatus: "delivered",
      lastReminderDeliveryCategory: null,
      lastReminderDeliveryRetryable: false,
      lastReminderDeliveryAttemptedAt: now,
      dunningFailureCount: 0,
      dunningNextAttemptAt: null,
      dunningRecoveryStatus: null,
      dunningClaimId: null,
      dunningClaimedAt: null,
      updatedAt: now,
    };
    if (stage.cancel) {
      update.status = "cancelled";
      update.cancelledAt = now;
      update.cancelledReason = "dunning_auto_cancel";
    }

    const completed = await Applications.updateOne(
      {
        _id: claimed._id,
        dunningClaimId: claimId,
        ...dunningLevelFilter(claimed.dunningLevel ?? 0),
      },
      stage.cancel
        ? {
            $set: update,
            $unset: {
              openApplicationKey: "",
              deliveryClaimId: "",
              deliveryClaimedAt: "",
            },
          }
        : { $set: update },
    );
    if (completed.modifiedCount !== 1) continue;
    summary.delivered += 1;

    if (stage.cancel) {
      await Users.updateOne(
        { _id: claimed.coreUserId },
        {
          $set: {
            "membership.status": "household_locked",
            "membership.cancelledAt": now,
            "membership.cancelledReason": "dunning_auto_cancel",
            updatedAt: now,
          },
        },
      );
    }
  }

  console.log(`[dunning] processed ${summary.scanned} applications`, summary);
  return summary;
}

function dunningLevelFilter(level: number) {
  return level === 0
    ? { $or: [{ dunningLevel: 0 }, { dunningLevel: { $exists: false } }] }
    : { dunningLevel: level };
}

function resolveDueStage(
  app: MembershipApplication,
  now: Date,
  days: { first: number; second: number; cancel: number },
) {
  const firstDueAt = app.firstDueAt ?? app.createdAt ?? now;
  const level = app.dunningLevel ?? 0;
  const daysSinceDue = Math.floor(
    (now.getTime() - firstDueAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (level === 0 && daysSinceDue >= days.first) {
    return { sendLevel: 1 as const, nextLevel: 1, cancel: false };
  }
  if (level === 1 && daysSinceDue >= days.second) {
    return { sendLevel: 2 as const, nextLevel: 2, cancel: false };
  }
  if (level === 2 && daysSinceDue >= days.cancel) {
    return { sendLevel: 3 as const, nextLevel: 3, cancel: true };
  }
  return null;
}

function retryBackoffMs(failureCount: number) {
  return Math.min(
    BASE_BACKOFF_MS * 2 ** Math.max(0, failureCount - 1),
    MAX_BACKOFF_MS,
  );
}

function permanentRecipientFailure(): SendMailResult {
  return {
    ok: false,
    status: "failed",
    transport: "none",
    code: "mail_transport_unavailable",
    category: "recipient_invalid",
    retryable: false,
    attemptedCount: 0,
    deliveredCount: 0,
    failedCount: 1,
    messageId: null,
  };
}

function transientExecutionFailure(): SendMailResult {
  return {
    ok: false,
    status: "failed",
    transport: "none",
    code: "mail_transport_error",
    category: "smtp_unknown_error",
    retryable: true,
    attemptedCount: 0,
    deliveredCount: 0,
    failedCount: 1,
    messageId: null,
  };
}

if (!process.env.VITEST) {
  runMembershipDunning().catch((error) => {
    console.error("[dunning] fatal", error);
    process.exit(1);
  });
}
