export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ObjectId, coreCol } from "@core/db/triMongo";
import { campaignsCol } from "@features/campaign/db";

async function logScan(args: { code: string; targetType: string; targetIds: string[]; req: NextRequest }) {
  try {
    const scans = await coreCol("qr_scans");
    const ip = args.req.headers.get("x-forwarded-for") ?? args.req.headers.get("x-real-ip") ?? null;
    const userAgent = args.req.headers.get("user-agent") ?? null;
    await scans.insertOne({
      code: args.code,
      targetType: args.targetType,
      targetIds: args.targetIds,
      ip,
      userAgent,
      createdAt: new Date(),
    });
  } catch {
    // Tracking darf keine Fehler werfen
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qrId = searchParams.get("qrId")?.trim();
  if (!qrId) {
    return NextResponse.json({ success: false, error: "missing_qr" }, { status: 400 });
  }

  const setsCol = await coreCol("qr_question_sets");
  const set = await setsCol.findOne({ code: qrId, status: "active" });
  if (set) {
    void logScan({ code: qrId, targetType: "set", targetIds: [set.code], req });
    return NextResponse.json({
      success: true,
      data: {
        targetType: "set",
        targetIds: [set.code],
        title: set.title ?? null,
      },
    });
  }

  const targetsCol = await coreCol("qr_targets");
  const target = await targetsCol.findOne({ code: qrId, status: "active" });
  if (target?.targetType === "campaign") {
    const campaignId = target?.targetIds?.[0];
    if (campaignId && ObjectId.isValid(campaignId)) {
      const campaigns = await campaignsCol();
      const campaign = await campaigns.findOne({ _id: new ObjectId(campaignId) });
      if (campaign) {
        void logScan({ code: qrId, targetType: "campaign", targetIds: [campaignId], req });
        return NextResponse.json({
          success: true,
          data: {
            targetType: "campaign",
            targetIds: [campaignId],
            title: campaign.title ?? null,
          },
        });
      }
    }
  }
  if (target?.targetType === "campaign_session") {
    const [campaignId, sessionId] = target?.targetIds ?? [];
    if (campaignId && ObjectId.isValid(campaignId)) {
      const campaigns = await campaignsCol();
      const campaign = await campaigns.findOne({ _id: new ObjectId(campaignId) });
      if (campaign) {
        void logScan({ code: qrId, targetType: "campaign_session", targetIds: [campaignId, sessionId].filter(Boolean), req });
        return NextResponse.json({
          success: true,
          data: {
            targetType: "campaign_session",
            targetIds: [campaignId, sessionId].filter(Boolean),
            title: campaign.title ?? null,
          },
        });
      }
    }
  }

  return NextResponse.json({ success: false, error: "not_found" }, { status: 404 });
}
