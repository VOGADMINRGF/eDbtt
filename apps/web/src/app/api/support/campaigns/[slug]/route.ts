import { NextRequest, NextResponse } from "next/server";
import { supportCampaignsCol, supportPledgesCol } from "@features/campaign/db";
import type { SupportCampaignDoc, SupportPledgeDoc } from "@features/campaign/types";
import { getPaymentEnv } from "@/lib/env/payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serializePledgePreview(doc: SupportPledgeDoc) {
  const publicName =
    doc.isAnonymous || !doc.publicName?.trim() ? "Anonym" : doc.publicName.trim().slice(0, 80);
  return {
    id: doc._id?.toString() ?? "",
    amountCents: doc.amountCents,
    status: doc.status,
    publicName,
    publicRegionCode: doc.publicRegionCode ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

function serializeCampaign(doc: SupportCampaignDoc) {
  return {
    id: doc._id?.toString() ?? "",
    targetType: doc.targetType,
    targetId: doc.targetId,
    slug: doc.slug,
    title: doc.title,
    description: doc.description ?? null,
    goalCents: doc.goalCents,
    currency: doc.currency,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
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

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const normalizedSlug = String(slug ?? "").trim().toLowerCase();
  if (!normalizedSlug) {
    return NextResponse.json({ ok: false, error: "missing_slug" }, { status: 400 });
  }

  const campaigns = await supportCampaignsCol();
  const campaign = await campaigns.findOne({ slug: normalizedSlug });
  if (!campaign) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const pledges = await supportPledgesCol();
  const [totals] = await pledges
    .aggregate([
      { $match: { supportCampaignId: campaign._id } },
      {
        $group: {
          _id: null,
          raisedCents: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, "$amountCents", 0],
            },
          },
          waitingCents: {
            $sum: {
              $cond: [{ $eq: ["$status", "waiting_payment"] }, "$amountCents", 0],
            },
          },
          totalPledges: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const recent = await pledges
    .find({ supportCampaignId: campaign._id, status: { $in: ["waiting_payment", "paid"] } })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  return NextResponse.json({
    ok: true,
    supportCampaign: serializeCampaign(campaign),
    progress: {
      raisedCents: totals?.raisedCents ?? 0,
      waitingCents: totals?.waitingCents ?? 0,
      goalCents: campaign.goalCents,
      pct: campaign.goalCents > 0 ? Math.min(1, (totals?.raisedCents ?? 0) / campaign.goalCents) : 0,
      totalPledges: totals?.totalPledges ?? 0,
    },
    recentPledges: recent.map(serializePledgePreview),
    paymentInfo: paymentInfoOrNull(),
    rules: {
      noVoteInfluence: true,
      noXpInfluence: true,
      noCreditInfluence: true,
    },
  });
}
