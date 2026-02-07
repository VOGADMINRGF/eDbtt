import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId, coreCol } from "@core/db/triMongo";
import { readSession } from "@/utils/session";
import { upsertUserPaymentProfile } from "@core/db/pii/userPaymentProfiles";
import { EDEBATTE_PLANS } from "@/config/pricing";
import { safeRandomId } from "@core/utils/random";
import { sendMail } from "@/utils/mailer";
import { publicOrigin } from "@/utils/publicOrigin";
import { buildEdebatePreorderMail } from "@/utils/emailTemplates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  package: z.enum(["basis", "start", "pro"]),
  commitmentMonths: z.coerce.number().int().optional(),
  confirm: z.boolean().optional(),
  payment: z
    .object({
      holderName: z.string().min(2).max(120),
      iban: z.string().min(8),
      bic: z.string().optional(),
    })
    .optional(),
});

function normalizeIban(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

// IBAN-Pruefung (Mod 97)
function isValidIban(iban: string) {
  const cleaned = normalizeIban(iban);
  if (cleaned.length < 15 || cleaned.length > 34) return false;
  if (!/^[A-Z]{2}[0-9A-Z]+$/.test(cleaned)) return false;

  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  let remainder = 0;

  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    const value = code >= 65 && code <= 90 ? String(code - 55) : ch;
    for (const digit of value) remainder = (remainder * 10 + Number(digit)) % 97;
  }

  return remainder === 1;
}

function maskIban(iban: string) {
  const clean = normalizeIban(iban);
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  const middle = "*".repeat(Math.max(0, clean.length - 8));
  const combined = `${start}${middle}${end}`;
  return combined.match(/.{1,4}/g)?.join(" ") ?? `${start} **** ${end}`;
}

function validateBic(bic?: string) {
  if (!bic) return null;
  const normalized = bic.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(normalized)) throw new Error("invalid_bic");
  return normalized;
}

function addMonths(start: Date, months: number) {
  const d = new Date(start.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function POST(req: NextRequest) {
  const session = await readSession();
  const userId = session?.uid ?? null;

  if (!userId || !ObjectId.isValid(userId)) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const payload = parsed.data;
  const planKey = `edb-${payload.package}` as const;

  const plan = EDEBATTE_PLANS.find((p) => p.id === planKey);
  if (!plan) return NextResponse.json({ ok: false, error: "unknown_plan" }, { status: 400 });

  const isPaidPlan = !plan.isFree && plan.listPrice.amount > 0;
  const commitmentMonths = payload.commitmentMonths ?? null;

  if (isPaidPlan) {
    if (!payload.confirm) {
      return NextResponse.json({ ok: false, error: "confirm_required", message: "Bitte verbindlich bestaetigen." }, { status: 400 });
    }
    if (!payload.payment?.holderName || !payload.payment?.iban) {
      return NextResponse.json({ ok: false, error: "payment_required", message: "Bankdaten fehlen." }, { status: 400 });
    }
    if (!commitmentMonths || ![12, 24].includes(commitmentMonths)) {
      return NextResponse.json({ ok: false, error: "commitment_required", message: "Laufzeit 12 oder 24 Monate waehlen." }, { status: 400 });
    }
  }

  const now = new Date();
  const reference = `EDB-${safeRandomId().slice(0, 8).toUpperCase()}`;
  const commitmentEndsAt = commitmentMonths ? addMonths(now, commitmentMonths) : null;

  let ibanMasked: string | null = null;

  if (isPaidPlan && payload.payment) {
    const iban = normalizeIban(payload.payment.iban);
    if (!isValidIban(iban)) {
      return NextResponse.json({ ok: false, error: "invalid_iban", message: "Ungueltige IBAN." }, { status: 400 });
    }

    let bic: string | null = null;
    try {
      bic = validateBic(payload.payment.bic);
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_bic", message: "Ungueltige BIC." }, { status: 400 });
    }

    ibanMasked = maskIban(iban);

    await upsertUserPaymentProfile(new ObjectId(userId), {
      ibanMasked,
      bic,
      holderName: payload.payment.holderName.trim(),
      verifiedBy: "manual",
    });
  }

  const Users = await coreCol("users");
  const user = await Users.findOne(
    { _id: new ObjectId(userId) },
    { projection: { email: 1, name: 1 } },
  );

  if (!user) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const status = isPaidPlan ? "preorder" : "active";
  const pledgeAmount = isPaidPlan ? plan.listPrice.amount : null;
  const pledgeInterval = isPaidPlan ? "monthly" : null;

  await Users.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        "edebatte.package": payload.package,
        "edebatte.status": status,
        "edebatte.billingInterval": "monthly",
        "edebatte.pledgeAmount": pledgeAmount,
        "edebatte.pledgeInterval": pledgeInterval,
        "edebatte.pledgeReference": reference,
        "edebatte.pledgeConfirmedAt": now,
        "edebatte.commitmentMonths": commitmentMonths,
        "edebatte.commitmentStartsAt": now,
        "edebatte.commitmentEndsAt": commitmentEndsAt,
        "edebatte.updatedAt": now,
        updatedAt: now,
      },
    },
  );

  let mailSent = false;
  if (user.email) {
    try {
      const origin = publicOrigin();
      const accountUrl = `${origin.replace(/\/$/, "")}/account?preorder=thanks`;

      const mail = buildEdebatePreorderMail({
        displayName: user.name ?? undefined,
        planLabel: plan.label,
        monthlyPrice: plan.listPrice.amount,
        commitmentMonths: commitmentMonths ?? undefined,
        ibanMasked: ibanMasked ?? undefined,
        pledgeReference: reference,
        accountUrl,
      });

      await sendMail({ to: user.email, subject: mail.subject, html: mail.html, text: mail.text });
      mailSent = true;
    } catch {
      mailSent = false;
    }
  }

  return NextResponse.json({ ok: true, reference, mailSent });
}
