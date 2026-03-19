export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId, coreCol } from "@core/db/triMongo";
import { anlassraumStructureCol } from "@features/anlassraum/db";
import { requireCreatorContext } from "../../../../streams/utils";

const ProtocolPayloadSchema = z.object({
  summary: z.string().min(3).max(4000),
  openQuestions: z.array(z.string().min(3).max(280)).max(20).optional(),
  decisions: z.array(z.string().min(3).max(280)).max(20).optional(),
  nextSteps: z.array(z.string().min(3).max(280)).max(20).optional(),
  tags: z.array(z.string().min(1).max(60)).max(20).optional(),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const sets = await coreCol("qr_question_sets");
  const set = await sets.findOne({ code });
  if (!set) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const entries = await (await coreCol("qr_protocol_entries"))
    .find({ code })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return NextResponse.json({
    ok: true,
    set: {
      code: set.code,
      title: set.title ?? null,
      anlassraumId: set.anlassraumId ? String(set.anlassraumId) : null,
      dossierId: set.dossierId ? String(set.dossierId) : null,
      roundSlug: set.roundSlug ?? null,
      protocolStatus: set.protocolStatus ?? "open",
    },
    entries: entries.map((entry: any) => ({
      id: entry._id?.toString?.() ?? "",
      summary: entry.summary,
      openQuestions: entry.openQuestions ?? [],
      decisions: entry.decisions ?? [],
      nextSteps: entry.nextSteps ?? [],
      tags: entry.tags ?? [],
      createdBy: entry.createdBy ?? null,
      createdAt: entry.createdAt?.toISOString?.() ?? null,
    })),
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const ctx = await requireCreatorContext(req);
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { code } = await context.params;
  const payload = ProtocolPayloadSchema.safeParse(await req.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const sets = await coreCol("qr_question_sets");
  const set = await sets.findOne({ code, status: "active" });
  if (!set) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (!ctx.isStaff && set.creatorId && String(set.creatorId) !== ctx.userId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const now = new Date();
  const protocolEntry = {
    code,
    qrSetId: set._id,
    anlassraumId: set.anlassraumId ?? null,
    dossierId: set.dossierId ?? null,
    roundSlug: set.roundSlug ?? null,
    summary: payload.data.summary,
    openQuestions: payload.data.openQuestions ?? [],
    decisions: payload.data.decisions ?? [],
    nextSteps: payload.data.nextSteps ?? [],
    tags: payload.data.tags ?? [],
    createdBy: ctx.userId,
    createdAt: now,
  };

  const inserted = await (await coreCol("qr_protocol_entries")).insertOne(protocolEntry);
  await sets.updateOne(
    { _id: set._id },
    {
      $set: {
        protocolStatus: "logged",
        updatedAt: now,
      },
    },
  );

  if (set.anlassraumId && ObjectId.isValid(String(set.anlassraumId))) {
    const anlassraumId = new ObjectId(String(set.anlassraumId));
    const structureCol = await anlassraumStructureCol();

    const notes = [
      {
        id: `qr-protocol-${inserted.insertedId.toString().slice(-10)}`,
        kind: "event_protocol",
        text: payload.data.summary,
      },
      ...(payload.data.decisions ?? []).map((decision, idx) => ({
        id: `qr-decision-${inserted.insertedId.toString().slice(-8)}-${idx + 1}`,
        kind: "decision",
        text: decision,
      })),
      ...(payload.data.nextSteps ?? []).map((nextStep, idx) => ({
        id: `qr-next-${inserted.insertedId.toString().slice(-8)}-${idx + 1}`,
        kind: "next_step",
        text: nextStep,
      })),
    ];

    const questions = (payload.data.openQuestions ?? []).map((question, idx) => ({
      id: `qr-question-${inserted.insertedId.toString().slice(-8)}-${idx + 1}`,
      text: question,
      dimension: "event_followup",
    }));

    await structureCol.updateOne(
      { anlassraumId },
      {
        $setOnInsert: {
          anlassraumId,
          claims: [],
          knots: [],
          segments: [],
          actors: [],
          riskFlags: [],
          createdAt: now,
        },
        $push: {
          notes: { $each: notes },
          questions: { $each: questions },
        },
        $set: {
          updatedAt: now,
        },
      },
      { upsert: true },
    );
  }

  return NextResponse.json({
    ok: true,
    entryId: inserted.insertedId.toString(),
    protocolStatus: "logged",
  });
}
