import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { coreCol } from "@core/db/triMongo";
import { createAuditEvent } from "@features/dossier/infra/auditChain";
import type { AuditEvent, IssueDelegation } from "@features/dossier/infra/types";
import { requireDossierEditor } from "@/lib/server/auth/dossier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  dossierId: string;
  questionId: string;
  delegatedTo?: string;
  level?: string;
  note?: string;
  status?: string;
};

const DELEGATIONS = "dossier_issue_delegations";
const AUDIT = "dossier_audit_chain";

export async function POST(req: NextRequest) {
  const gate = await requireDossierEditor(req);
  if (gate instanceof Response) return gate;

  const body = (await req.json().catch(() => ({}))) as Partial<Body>;
  const dossierId = body.dossierId?.trim();
  const questionId = body.questionId?.trim();

  if (!dossierId || !questionId) {
    return NextResponse.json({ ok: false, error: "missing_dossier_or_question" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const delegationId = `del_${crypto.randomUUID()}`;

  const doc: IssueDelegation = {
    delegationId,
    dossierId,
    questionId,
    status: (body.status ?? "in_bearbeitung") as IssueDelegation["status"],
    delegatedTo: body.delegatedTo?.trim(),
    level: body.level?.trim() as IssueDelegation["level"],
    requestedAt: now,
    updatedAt: now,
    note: body.note?.trim(),
  };

  const col = await coreCol<IssueDelegation>(DELEGATIONS);
  await col.updateOne(
    { dossierId, questionId },
    { $set: { ...doc }, $setOnInsert: { dossierId, questionId } },
    { upsert: true },
  );

  const auditCol = await coreCol<AuditEvent>(AUDIT);
  const lastEvent = await auditCol.find({ dossierId }).sort({ timestamp: -1, _id: -1 }).limit(1).next();

  const auditEvent = createAuditEvent({
    eventId: `evt_${crypto.randomUUID()}`,
    dossierId,
    actorRole: gate.actorRole,
    action: "issue_delegated",
    diff: {
      questionId,
      delegatedTo: doc.delegatedTo,
      level: doc.level,
      status: doc.status,
      note: doc.note,
    },
    timestamp: now,
    previousHash: lastEvent?.eventHash,
  });

  await auditCol.insertOne(auditEvent as any);

  return NextResponse.json({ ok: true, delegation: doc, auditEvent }, { status: 200 });
}
