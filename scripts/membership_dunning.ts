#!/usr/bin/env tsx
import { coreCol } from "@core/db/triMongo";
import type { MembershipApplication } from "@core/memberships/types";
import { buildMembershipReminderMail } from "@/utils/emailTemplates";
import { sendMail } from "@/utils/mailer";
import { mailLocaleFromUser } from "@/utils/mailRenderer";

async function run() {
  if (process.env.VOG_DUNNING_ENABLED === "0") {
    console.log("[dunning] disabled via env");
    return;
  }

  const daysFirst = Number(process.env.VOG_DUNNING_DAYS_FIRST ?? "3");
  const daysSecond = Number(process.env.VOG_DUNNING_DAYS_SECOND ?? "7");
  const daysCancel = Number(process.env.VOG_DUNNING_DAYS_CANCEL ?? "21");
  const now = new Date();

  const Applications = await coreCol<MembershipApplication>("membership_applications");
  const Users = await coreCol("users");

  const pending = await Applications
    .find({ status: "waiting_payment" })
    .toArray();

  for (const app of pending) {
    const firstDueAt = app.firstDueAt ?? app.createdAt ?? now;
    const level = app.dunningLevel ?? 0;
    const daysSinceDue = Math.floor((now.getTime() - firstDueAt.getTime()) / (1000 * 60 * 60 * 24));

    let nextLevel = level;
    let newStatus: MembershipApplication["status"] | null = null;
    let sendLevel: 1 | 2 | 3 | null = null;

    if (level === 0 && daysSinceDue >= daysFirst) {
      nextLevel = 1;
      sendLevel = 1;
    } else if (level === 1 && daysSinceDue >= daysSecond) {
      nextLevel = 2;
      sendLevel = 2;
    } else if (level === 2 && daysSinceDue >= daysCancel) {
      nextLevel = 3;
      sendLevel = 3;
      newStatus = "cancelled";
    }

    if (!sendLevel && !newStatus) continue;

    const user = await Users.findOne(
      { _id: app.coreUserId },
      { projection: { email: 1, name: 1, profile: 1, settings: 1 } },
    );

    if (!user?.email || !sendLevel) {
      await Applications.updateOne(
        { _id: app._id },
        {
          $set: {
            lastReminderDeliveryStatus: "failed",
            lastReminderDeliveryCategory: "recipient_invalid",
            lastReminderDeliveryRetryable: false,
            lastReminderDeliveryAttemptedAt: now,
            updatedAt: now,
          },
        },
      );
      continue;
    }

    try {
      const mail = buildMembershipReminderMail(sendLevel, {
        displayName: user.name ?? "Mitglied",
        amountPerPeriod: app.amountPerPeriod,
        rhythm: app.rhythm,
        householdSize: app.householdSize,
        paymentInfo: app.paymentInfo,
        reference: app.paymentReference ?? "",
        locale: mailLocaleFromUser(user),
      });
      const mailResult = await sendMail({
        to: user.email,
        mail,
        delivery: "required_delivery",
        tag: "membership_dunning_reminder",
      });
      if (!mailResult.ok) {
        await Applications.updateOne(
          { _id: app._id },
          {
            $set: {
              lastReminderDeliveryStatus: mailResult.status,
              lastReminderDeliveryCategory: mailResult.category,
              lastReminderDeliveryRetryable: mailResult.retryable,
              lastReminderDeliveryAttemptedAt: now,
              updatedAt: now,
            },
          },
        );
        continue;
      }
    } catch (err) {
      console.error("[dunning] mail execution failed", err);
      continue;
    }

    const update: any = {
      dunningLevel: nextLevel,
      lastReminderSentAt: now,
      lastReminderDeliveryStatus: "delivered",
      lastReminderDeliveryCategory: null,
      lastReminderDeliveryRetryable: false,
      lastReminderDeliveryAttemptedAt: now,
      updatedAt: now,
    };
    if (newStatus) {
      update.status = newStatus;
      update.cancelledAt = now;
      update.cancelledReason = "dunning_auto_cancel";
    }

    await Applications.updateOne({ _id: app._id }, { $set: update });

    if (newStatus) {
      await Users.updateOne(
        { _id: app.coreUserId },
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
  console.log(`[dunning] processed ${pending.length} applications`);
}

run().catch((err) => {
  console.error("[dunning] fatal", err);
  process.exit(1);
});
