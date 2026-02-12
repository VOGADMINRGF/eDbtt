import { NextRequest, NextResponse } from "next/server";
import { ObjectId, coreCol } from "@core/db/triMongo";
import { campaignsCol, toObjectId } from "@features/campaign/db";
import { getStaffContext } from "@/app/api/admin/eventualities/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const CODE_LENGTH = 8;
const TARGET_COLLECTION = "qr_targets";

const ensured = { targets: false };

type QrTargetDoc = {
  code: string;
  targetType: "campaign";
  targetIds: string[];
  status: "active" | "disabled";
  createdAt: Date;
  updatedAt: Date;
};

async function qrTargetsCol() {
  if (!ensured.targets) {
    const col = await coreCol<QrTargetDoc>(TARGET_COLLECTION);
    await col.createIndex({ code: 1 }, { unique: true });
    await col.createIndex({ targetType: 1, targetIds: 1 });
    ensured.targets = true;
    return col;
  }
  return coreCol<QrTargetDoc>(TARGET_COLLECTION);
}

function generateCode(len = CODE_LENGTH) {
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

async function generateUniqueCode() {
  const col = await qrTargetsCol();
  for (let i = 0; i < 6; i += 1) {
    const code = generateCode();
    const exists = await col.findOne({ code }, { projection: { _id: 1 } });
    if (!exists) return code;
  }
  throw new Error("code_generation_failed");
}

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: "bad_request", message }, { status: 400 });
}

function resolveCampaignId(raw: string): ObjectId | null {
  if (!raw || !ObjectId.isValid(raw)) return null;
  return toObjectId(raw);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  const { id } = await ctx.params;
  const campaignId = resolveCampaignId(String(id ?? ""));
  if (!campaignId) return badRequest("invalid_id");

  const col = await campaignsCol();
  const campaign = await col.findOne({ _id: campaignId });
  if (!campaign) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const targets = await qrTargetsCol();
  const target = await targets.findOne({
    targetType: "campaign",
    targetIds: [campaignId.toString()],
    status: "active",
  });

  return NextResponse.json({
    ok: true,
    code: target?.code ?? null,
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  const { id } = await ctx.params;
  const campaignId = resolveCampaignId(String(id ?? ""));
  if (!campaignId) return badRequest("invalid_id");

  const col = await campaignsCol();
  const campaign = await col.findOne({ _id: campaignId });
  if (!campaign) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const targets = await qrTargetsCol();
  const existing = await targets.findOne({
    targetType: "campaign",
    targetIds: [campaignId.toString()],
    status: "active",
  });
  if (existing) {
    return NextResponse.json({ ok: true, code: existing.code });
  }

  const code = await generateUniqueCode();
  const now = new Date();
  await targets.insertOne({
    code,
    targetType: "campaign",
    targetIds: [campaignId.toString()],
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true, code });
}
