import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/utils/session";
import { getPaymentEnv } from "@/lib/env/payment";
import { supportCampaignsCol, supportPledgesCol } from "@features/campaign/db";
import type { SupportPledgeDoc } from "@features/campaign/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pledgeSchema = z.object({
  amountCents: z.coerce.number().int().min(100).max(10_000_000).optional(),
  amount: z.coerce.number().finite().min(1).max(100_000).optional(),
  isAnonymous: z.boolean().optional(),
  publicName: z.string().trim().max(80).optional().nullable(),
  publicRegionCode: z.string().trim().max(32).optional().nullable(),
  message: z.string().trim().max(280).optional().nullable(),
});

function buildPaymentReference() {
  return `CF-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function paymentInfoOrNull() {
  try {
    const env = getPaymentEnv();
    return {
      recipient: env.recipient,
      iban: env.iban,
      bic: env.bic || null,
      bankName: env.bankName || null,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const normalizedSlug = String(slug ?? "").trim().toLowerCase();
  if (!normalizedSlug) {
    return NextResponse.json({ ok: false, error: "missing_slug" }, { status: 400 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = pledgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const campaigns = await supportCampaignsCol();
  const campaign = await campaigns.findOne({ slug: normalizedSlug });
  if (!campaign) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (campaign.status !== "active") {
    return NextResponse.json({ ok: false, error: "campaign_not_active" }, { status: 409 });
  }

  const amountCents =
    parsed.data.amountCents && parsed.data.amountCents > 0
      ? parsed.data.amountCents
      : Math.round((parsed.data.amount ?? 0) * 100);
  if (!amountCents || amountCents < 100) {
    return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 });
  }

  const session = await readSession();
  const now = new Date();
  const pledges = await supportPledgesCol();

  let inserted: SupportPledgeDoc | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const paymentReference = buildPaymentReference();
    const doc: SupportPledgeDoc = {
      supportCampaignId: campaign._id!,
      amountCents,
      status: "waiting_payment",
      paymentReference,
      isAnonymous: parsed.data.isAnonymous ?? true,
      publicName: parsed.data.publicName ?? null,
      publicRegionCode: parsed.data.publicRegionCode ?? null,
      message: parsed.data.message ?? null,
      createdByUserId: session?.uid ?? null,
      createdAt: now,
      updatedAt: now,
    };
    try {
      const result = await pledges.insertOne(doc);
      inserted = await pledges.findOne({ _id: result.insertedId });
      if (inserted) break;
    } catch (error: any) {
      if (typeof error?.message === "string" && error.message.includes("E11000")) continue;
      console.error("[support/pledges] insert failed", error);
      return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 500 });
    }
  }

  if (!inserted) return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 500 });

  return NextResponse.json({
    ok: true,
    pledge: {
      id: inserted._id?.toString() ?? "",
      amountCents: inserted.amountCents,
      status: inserted.status,
      paymentReference: inserted.paymentReference,
      createdAt: inserted.createdAt.toISOString(),
    },
    paymentInfo: paymentInfoOrNull(),
    rules: {
      noVoteInfluence: true,
      noXpInfluence: true,
      noCreditInfluence: true,
    },
  });
}
