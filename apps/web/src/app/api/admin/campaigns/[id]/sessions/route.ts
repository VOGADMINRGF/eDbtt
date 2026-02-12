import { NextRequest, NextResponse } from "next/server";
import { ObjectId, coreCol } from "@core/db/triMongo";
import { campaignsCol, campaignSessionsCol, toObjectId } from "@features/campaign/db";
import type { CampaignSessionDoc } from "@features/campaign/types";
import { getStaffContext } from "@/app/api/admin/eventualities/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const TARGET_COLLECTION = "qr_targets";

type QrTargetDoc = {
  code: string;
  targetType: "campaign_session";
  targetIds: string[];
  status: "active" | "disabled";
  createdAt: Date;
  updatedAt: Date;
};

const ensured = { targets: false };

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

function generateCode(len = 8) {
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

function resolveId(raw: string): ObjectId | null {
  if (!raw || !ObjectId.isValid(raw)) return null;
  return toObjectId(raw);
}

function serializeSession(doc: CampaignSessionDoc) {
  return {
    id: doc._id?.toString() ?? "",
    label: doc.label ?? null,
    status: doc.status,
    startsAt: doc.startsAt ? doc.startsAt.toISOString() : null,
    endsAt: doc.endsAt ? doc.endsAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function deriveStatus(
  status: CampaignSessionDoc["status"] | undefined,
  startsAt: Date | null | undefined,
  endsAt: Date | null | undefined,
  now = new Date(),
): CampaignSessionDoc["status"] {
  if (endsAt && endsAt.getTime() <= now.getTime()) return "ended";
  if (startsAt && startsAt.getTime() <= now.getTime()) return "live";
  return status ?? "planned";
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  const { id } = await ctx.params;
  const campaignId = resolveId(String(id ?? ""));
  if (!campaignId) return badRequest("invalid_id");

  const col = await campaignSessionsCol();
  const sessions = await col.find({ campaignId }).sort({ createdAt: -1 }).toArray();
  const targets = await qrTargetsCol();
  const targetDocs = await targets
    .find({ targetType: "campaign_session", "targetIds.0": campaignId.toString() })
    .toArray();
  const qrBySession = new Map<string, string>();
  targetDocs.forEach((doc) => {
    const sessionId = doc?.targetIds?.[1];
    if (sessionId) qrBySession.set(sessionId, doc.code);
  });

  return NextResponse.json({
    ok: true,
    sessions: sessions.map((session) => ({
      ...serializeSession(session),
      qrCode: session._id ? qrBySession.get(session._id.toString()) ?? null : null,
    })),
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  const { id } = await ctx.params;
  const campaignId = resolveId(String(id ?? ""));
  if (!campaignId) return badRequest("invalid_id");

  const campaigns = await campaignsCol();
  const campaign = await campaigns.findOne({ _id: campaignId });
  if (!campaign) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid_json");
  }

  const now = new Date();
  const sessionDoc: CampaignSessionDoc = {
    campaignId,
    label: typeof body?.label === "string" ? body.label.trim() : null,
    status: "planned",
    startsAt: body?.startsAt ? new Date(body.startsAt) : null,
    endsAt: body?.endsAt ? new Date(body.endsAt) : null,
    createdAt: now,
    updatedAt: now,
  };
  sessionDoc.status = deriveStatus(sessionDoc.status, sessionDoc.startsAt, sessionDoc.endsAt, now);

  const sessionsCol = await campaignSessionsCol();
  const result = await sessionsCol.insertOne(sessionDoc);
  const inserted = await sessionsCol.findOne({ _id: result.insertedId });
  if (!inserted) return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 500 });

  const code = await generateUniqueCode();
  const targets = await qrTargetsCol();
  await targets.insertOne({
    code,
    targetType: "campaign_session",
    targetIds: [campaignId.toString(), result.insertedId.toString()],
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    ok: true,
    session: serializeSession(inserted),
    qrCode: code,
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  const { id } = await ctx.params;
  const campaignId = resolveId(String(id ?? ""));
  if (!campaignId) return badRequest("invalid_id");

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid_json");
  }

  const sessionId = resolveId(String(body?.sessionId ?? ""));
  if (!sessionId) return badRequest("invalid_session_id");

  const patch: Partial<CampaignSessionDoc> = {};
  if (typeof body?.label === "string") patch.label = body.label.trim();
  if (body?.status === "planned" || body?.status === "live" || body?.status === "ended") {
    patch.status = body.status;
  }
  if (body?.startsAt !== undefined) {
    patch.startsAt = body.startsAt ? new Date(body.startsAt) : null;
  }
  if (body?.endsAt !== undefined) {
    patch.endsAt = body.endsAt ? new Date(body.endsAt) : null;
  }

  if (Object.keys(patch).length === 0) return badRequest("empty_patch");

  patch.updatedAt = new Date();
  if (!patch.status) {
    patch.status = deriveStatus(
      undefined,
      patch.startsAt,
      patch.endsAt,
      patch.updatedAt,
    );
  }

  const sessionsCol = await campaignSessionsCol();
  const updated = await sessionsCol.findOneAndUpdate(
    { _id: sessionId, campaignId },
    { $set: patch },
    { returnDocument: "after" },
  );

  if (!updated) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true, session: serializeSession(updated) });
}
