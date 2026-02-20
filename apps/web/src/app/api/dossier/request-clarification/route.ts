import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { coreCol } from "@core/db/triMongo";
import { createAuditEvent } from "@features/dossier/infra/auditChain";
import type { AuditEvent, ClarificationRequest } from "@features/dossier/infra/types";
import { requireAnyUser } from "@/lib/server/auth/anyUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  dossierId?: string;
  municipality?: string;
  topic?: string;
  questionText?: string;
  context?: string;
};

const REQUESTS = "dossier_clarification_requests";
const INBOX = "dossier_editorial_inbox";
const AUDIT = "dossier_audit_chain";

export async function POST(req: NextRequest) {
  const gate = await requireAnyUser(req);
  if (gate instanceof Response) return gate;

  const body = (await req.json().catch(() => ({}))) as Body;
  const questionText = String(body.questionText ?? "").trim();

  if (!questionText || questionText.length < 8) {
    return NextResponse.json({ ok: false, error: "missing_question_text" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const requestId = `req_${crypto.randomUUID()}`;

  const doc: ClarificationRequest = {
    requestId,
    dossierId: body.dossierId,
    municipality: body.municipality,
    topic: body.topic,
    questionText: questionText.slice(0, 800),
    context: body.context ? String(body.context).slice(0, 1200) : undefined,
    requestedByRole: gate.actorRole ?? "member",
    requestedByUserId: gate.userId,
    status: "open",
    createdAt: now,
    updatedAt: now,
  };

  const requestsCol = await coreCol<ClarificationRequest>(REQUESTS);
  await requestsCol.insertOne(doc as any);

  const inboxCol = await coreCol<any>(INBOX);
  await inboxCol.insertOne({
    itemId: `inb_${crypto.randomUUID()}`,
    kind: "clarification_request",
    requestId,
    dossierId: body.dossierId,
    municipality: body.municipality,
    topic: body.topic,
    title: "Klärungsanfrage",
    subtitle: questionText.slice(0, 120),
    status: "open",
    createdAt: now,
  });

  if (body.dossierId) {
    const auditCol = await coreCol<AuditEvent>(AUDIT);
    const last = await auditCol
      .find({ dossierId: body.dossierId })
      .sort({ timestamp: -1, _id: -1 })
      .limit(1)
      .next();

    const evt = createAuditEvent({
      eventId: `evt_${crypto.randomUUID()}`,
      dossierId: body.dossierId,
      actorRole: gate.actorRole ?? "member",
      action: "clarification_requested",
      diff: { requestId, questionText: questionText.slice(0, 240) },
      timestamp: now,
      previousHash: last?.eventHash,
    });

    await auditCol.insertOne(evt as any);
  }

  return NextResponse.json({ ok: true, requestId }, { status: 200 });
}
