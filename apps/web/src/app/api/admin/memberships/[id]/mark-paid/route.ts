import { NextRequest, NextResponse } from "next/server";
import { ObjectId, coreCol, piiCol } from "@core/db/triMongo";
import type { MembershipApplication } from "@core/memberships/types";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { logMembershipPaid } from "@core/telemetry/identityEvents";
import { buildMembershipActivationMail } from "@/utils/emailTemplates";
import { mailLocaleFromUser } from "@/utils/mailRenderer";
import { sendMail } from "@/utils/mailer";
import { publicOrigin } from "@/utils/publicOrigin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const { id: membershipId } = await params;
  if (typeof membershipId !== "string" || !ObjectId.isValid(membershipId)) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  const Applications = await coreCol<MembershipApplication>("membership_applications");
  const Users = await coreCol("users");

  const application = await Applications.findOne({ _id: new ObjectId(membershipId) });
  if (!application) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (application.status !== "waiting_payment") {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 409 });
  }

  const now = new Date();
  await Applications.updateOne(
    { _id: application._id },
    {
      $set: {
        status: "active",
        firstPaidAt: now,
        updatedAt: now,
        "paymentInfo.firstPaidAt": now,
        "paymentInfo.mandateStatus": "active",
      },
    },
  );

  await Users.updateOne(
    { _id: application.coreUserId },
    {
      $set: {
        "membership.status": "active",
        "membership.activatedAt": now,
        "membership.paymentInfo.mandateStatus": "active",
        "membership.paymentInfo.firstPaidAt": now,
        updatedAt: now,
      },
    },
  );

  const Profiles = await piiCol("user_payment_profiles");
  await Profiles.updateOne(
    { userId: application.coreUserId },
    {
      $set: {
        microTransferVerifiedAt: now,
        microTransferHash: null,
        microTransferExpiresAt: null,
        microTransferAttempts: null,
      },
    },
  );

  await logMembershipPaid({
    userId: String(application.coreUserId),
    membershipId: String(application._id),
    amountPerPeriod: application.amountPerPeriod,
    rhythm: application.rhythm,
  }).catch((err) => {
    console.error("[membership.mark-paid] logMembershipPaid failed", err);
  });

  const activatedUser = await Users.findOne(
    { _id: application.coreUserId },
    { projection: { email: 1, name: 1, profile: 1, settings: 1 } },
  );
  let activationMailQueued = false;
  if (activatedUser?.email) {
    const mail = buildMembershipActivationMail({
      displayName:
        activatedUser.profile?.displayName ?? activatedUser.name ?? null,
      accountUrl: `${publicOrigin().replace(/\/$/, "")}/account`,
      locale: mailLocaleFromUser(activatedUser),
    });
    const mailResult = await sendMail({
      to: activatedUser.email,
      mail,
      delivery: "best_effort_delivery",
      tag: "membership_activation",
    });
    activationMailQueued = mailResult.ok;
  }

  return NextResponse.json({ ok: true, activationMailQueued });
}
