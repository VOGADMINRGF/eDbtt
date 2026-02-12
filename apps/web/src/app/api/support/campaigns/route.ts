import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { campaignsCol, supportCampaignsCol } from "@features/campaign/db";
import type { SupportCampaignDoc, SupportTargetType } from "@features/campaign/types";
import { getStaffContext } from "@/app/api/admin/eventualities/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: "bad_request", message }, { status: 400 });
}

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function serialize(doc: SupportCampaignDoc) {
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
    createdBy: doc.createdBy ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function POST(req: NextRequest) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid_json");
  }

  const targetTypeRaw = String(body?.targetType ?? "campaign").trim().toLowerCase();
  const targetType: SupportTargetType =
    targetTypeRaw === "project" || targetTypeRaw === "question" ? targetTypeRaw : "campaign";

  const targetId = String(body?.targetId ?? body?.campaignId ?? "").trim();
  if (!targetId) return badRequest("missing_target_id");

  if (targetType === "campaign" && !ObjectId.isValid(targetId)) {
    return badRequest("invalid_campaign_id");
  }

  const slug = normalizeSlug(String(body?.slug ?? ""));
  if (!slug || slug.length < 3 || slug.length > 80) {
    return badRequest("invalid_slug");
  }

  const title = String(body?.title ?? "").trim();
  if (!title) return badRequest("missing_title");

  const goalCents = Number(body?.goalCents);
  if (!Number.isFinite(goalCents) || goalCents < 100 || goalCents > 50_000_000) {
    return badRequest("invalid_goal_cents");
  }

  if (targetType === "campaign") {
    const campaignCol = await campaignsCol();
    const campaign = await campaignCol.findOne({ _id: new ObjectId(targetId) });
    if (!campaign) return NextResponse.json({ ok: false, error: "campaign_not_found" }, { status: 404 });
  }

  const now = new Date();
  const doc: SupportCampaignDoc = {
    targetType,
    targetId,
    slug,
    title,
    description: typeof body?.description === "string" ? body.description.trim() : null,
    goalCents: Math.round(goalCents),
    currency: "EUR",
    status: body?.status === "draft" || body?.status === "closed" ? body.status : "active",
    createdBy: staff.context?.userId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const supportCol = await supportCampaignsCol();
  try {
    const result = await supportCol.insertOne(doc);
    const inserted = await supportCol.findOne({ _id: result.insertedId });
    if (!inserted) return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 500 });

    if (targetType === "campaign") {
      const campaignCol = await campaignsCol();
      await campaignCol.updateOne(
        { _id: new ObjectId(targetId) },
        {
          $set: {
            supportEnabled: inserted.status === "active",
            supportSlug: inserted.slug,
            updatedAt: now,
          },
        },
      );
    }

    return NextResponse.json({ ok: true, supportCampaign: serialize(inserted) });
  } catch (error: any) {
    if (typeof error?.message === "string" && error.message.includes("E11000")) {
      return NextResponse.json({ ok: false, error: "slug_exists" }, { status: 409 });
    }
    console.error("[support/campaigns] create failed", error);
    return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  }
}
