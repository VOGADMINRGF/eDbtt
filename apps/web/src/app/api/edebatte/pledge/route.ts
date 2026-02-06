import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { coreCol, ObjectId } from "@core/db/triMongo";
import { readSession } from "@/utils/session";
import { getPaymentEnv } from "@/lib/env/payment";
import { sendMail } from "@/utils/mailer";
import { buildEdebatePreorderPledgeAdminMail, buildEdebatePreorderPledgeUserMail } from "@/utils/emailTemplates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  amount: z.coerce.number().finite().min(1).max(25000),
});

const formatPlanLabel = (plan?: string | null) => {
  if (plan === "basis") return "eDebatte Basis";
  if (plan === "start") return "eDebatte Start";
  if (plan === "pro") return "eDebatte Pro";
  return "eDebatte";
};

function uniqueEmails(values: Array<string | undefined | null>) {
  const set = new Set<string>();
  values.forEach((value) => {
    const trimmed = value?.trim();
    if (trimmed) set.add(trimmed);
  });
  return Array.from(set);
}

export async function POST(req: NextRequest) {
  const session = await readSession();
  const userId = session?.uid ?? null;
  if (!userId || !ObjectId.isValid(userId)) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const amount = Math.round(parsed.data.amount * 100) / 100;
  const Users = await coreCol("users");
  const oid = new ObjectId(userId);
  const user = await Users.findOne(
    { _id: oid },
    { projection: { email: 1, profile: 1, displayName: 1, firstName: 1, lastName: 1, edebatte: 1 } },
  );
  if (!user) {
    return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
  }

  const edebatteStatus = (user as any)?.edebatte?.status ?? "none";
  if (edebatteStatus !== "preorder") {
    return NextResponse.json({ ok: false, error: "not_preorder" }, { status: 400 });
  }

  const paymentEnv = getPaymentEnv();
  const reference = `${paymentEnv.referencePrefix}PRE-${String(oid).slice(-6).toUpperCase()}`;
  const confirmedAt = new Date();

  await Users.updateOne(
    { _id: oid },
    {
      $set: {
        "edebatte.pledgeAmount": amount,
        "edebatte.pledgeInterval": "once",
        "edebatte.pledgeReference": reference,
        "edebatte.pledgeConfirmedAt": confirmedAt,
        "edebatte.updatedAt": confirmedAt,
      },
    },
  );

  const email =
    (user as any)?.email ||
    (user as any)?.profile?.email ||
    (user as any)?.profile?.contactEmail ||
    null;

  const displayName =
    (user as any)?.profile?.displayName ||
    (user as any)?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "";

  const planLabel = formatPlanLabel((user as any)?.edebatte?.package);
  const bank = {
    recipient: paymentEnv.recipient,
    iban: paymentEnv.iban,
    bic: paymentEnv.bic || "",
    bankName: paymentEnv.bankName || "",
    accountMode: paymentEnv.accountMode,
  };

  if (email) {
    const userMail = buildEdebatePreorderPledgeUserMail({
      displayName,
      planLabel,
      amount,
      reference,
      bank,
    });
    await sendMail({ to: email, subject: userMail.subject, html: userMail.html, text: userMail.text });
  }

  const teamRecipients = uniqueEmails([
    process.env.TEAM_NOTIFY_TO,
    process.env.MEMBERS_NOTIFY_TO,
    process.env.MAIL_ADMIN_TO,
    paymentEnv.membershipContactEmail,
  ]);
  if (teamRecipients.length > 0) {
    const adminMail = buildEdebatePreorderPledgeAdminMail({
      displayName,
      email: email || "unknown",
      userId: String(oid),
      planLabel,
      amount,
      reference,
      bank,
    });
    await Promise.all(
      teamRecipients.map((to) =>
        sendMail({ to, subject: adminMail.subject, html: adminMail.html, text: adminMail.text }),
      ),
    );
  }

  return NextResponse.json({
    ok: true,
    pledge: {
      amount,
      reference,
      confirmedAt: confirmedAt.toISOString(),
    },
  });
}
