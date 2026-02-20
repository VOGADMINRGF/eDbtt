import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { coreCol } from "@core/db/triMongo";
import demoDossier from "@features/dossier/data/demoDossier";
import { createAuditEvent } from "@features/dossier/infra/auditChain";
import { createSnapshot } from "@features/dossier/infra/snapshot";
import { canTransition } from "@features/dossier/infra/workflow";
import type {
  AuditEvent,
  ClarificationRequest,
  DossierSnapshot,
  StoredDossier,
  WorkflowDoc,
  WorkflowState,
} from "@features/dossier/infra/types";
import { requireDossierEditor } from "@/lib/server/auth/dossier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  requestId?: string;
  decision?: "accept" | "reject";
  note?: string;
  createDossier?: boolean;
  sourceHint?: string;
};

const REQUESTS = "dossier_clarification_requests";
const INBOX = "dossier_editorial_inbox";
const AUDIT = "dossier_audit_chain";
const DOSSIER_STORE = "dossier_store";
const WORKFLOW = "dossier_workflow";
const SNAPSHOTS = "dossier_snapshots";

function buildDossierFromRequest(input: {
  dossierId: string;
  now: string;
  municipality?: string;
  topic?: string;
  questionText: string;
  sourceHint?: string;
}) {
  const cloned = structuredClone(demoDossier) as any;

  cloned.meta = cloned.meta ?? {};
  cloned.meta.id = input.dossierId;
  cloned.meta.title = input.topic?.trim() || "Klärungsdossier";
  cloned.meta.region = input.municipality?.trim() || cloned.meta.region || "—";
  cloned.meta.status = "draft";
  cloned.meta.createdAt = input.now;
  cloned.meta.updatedAt = input.now;

  cloned.analyze = cloned.analyze ?? {};
  cloned.analyze.sourceText =
    input.questionText?.trim() || "Klärungsanfrage wurde angenommen. Fragestellung folgt.";
  cloned.analyze.mode = cloned.analyze.mode ?? "E150";
  cloned.analyze.language = cloned.analyze.language ?? "de";

  cloned.analyze.notes = cloned.analyze.notes ?? [];
  cloned.analyze.notes.push({
    id: `note-origin-${input.dossierId}`,
    kind: "context",
    text: `Editorial Accept: Anfrage angenommen und als Dossier angelegt. (${input.now})`,
  });

  if (input.sourceHint) {
    const hint = String(input.sourceHint).replace(/\s+/g, " ").trim().slice(0, 400);
    if (hint) {
      cloned.analyze.notes.push({
        id: `note-sourcehint-${input.dossierId}`,
        kind: "context",
        text: `Ursprungshinweis: ${hint}`,
      });
    }
  }

  cloned.analyze.questions = cloned.analyze.questions ?? [];
  const qId = `q_${crypto.randomUUID()}`;
  cloned.analyze.questions.unshift({
    id: qId,
    text: input.questionText.slice(0, 800),
    dimension: "klarung",
  });

  return cloned;
}

export async function POST(req: NextRequest) {
  const gate = await requireDossierEditor(req);
  if (gate instanceof Response) return gate;

  const body = (await req.json().catch(() => ({}))) as Body;
  const requestId = String(body.requestId ?? "").trim();
  const decision = body.decision;

  if (!requestId || (decision !== "accept" && decision !== "reject")) {
    return NextResponse.json({ ok: false, error: "missing_request_or_decision" }, { status: 400 });
  }

  const requestsCol = await coreCol<ClarificationRequest>(REQUESTS);
  const reqDoc = await requestsCol.findOne({ requestId });
  if (!reqDoc) {
    return NextResponse.json({ ok: false, error: "request_not_found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const nextStatus = decision === "accept" ? "accepted" : "rejected";
  const note = body.note ? String(body.note).slice(0, 800) : undefined;
  if (decision === "reject" && (!note || note.trim().length < 3)) {
    return NextResponse.json({ ok: false, error: "missing_decision_note" }, { status: 400 });
  }

  let linkedDossierId: string | undefined;
  if (decision === "accept" && body.createDossier) {
    linkedDossierId = reqDoc.linkedDossierId ?? `dossier_${crypto.randomUUID()}`;
    const dossierPayload = buildDossierFromRequest({
      dossierId: linkedDossierId,
      now,
      municipality: reqDoc.municipality,
      topic: reqDoc.topic,
      questionText: reqDoc.questionText,
      sourceHint: body.sourceHint,
    });

    const storeCol = await coreCol<StoredDossier>(DOSSIER_STORE);
    const stored: StoredDossier = {
      dossierId: linkedDossierId,
      createdAt: now,
      updatedAt: now,
      createdByRole: gate.actorRole,
      createdByUserId: gate.userId,
      dossier: dossierPayload,
    };
    await storeCol.updateOne({ dossierId: linkedDossierId }, { $set: stored }, { upsert: true });

    const workflowCol = await coreCol<WorkflowDoc>(WORKFLOW);
    const current = await workflowCol.findOne({ dossierId: linkedDossierId });
    const currentState: WorkflowState = (current?.state as WorkflowState) ?? "draft";
    const nextState: WorkflowState = "in_review";

    if (!current || canTransition(currentState, nextState) || currentState === nextState) {
      await workflowCol.updateOne(
        { dossierId: linkedDossierId },
        {
          $set: {
            dossierId: linkedDossierId,
            state: nextState,
            updatedAt: now,
            updatedByRole: gate.actorRole,
            updatedByUserId: gate.userId,
          },
        },
        { upsert: true },
      );
    }

    const privateKey = process.env.DOSSIER_SIGNING_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ ok: false, error: "missing_signing_key" }, { status: 500 });
    }

    const snapshotsCol = await coreCol<DossierSnapshot>(SNAPSHOTS);
    const lastSnapshot = await snapshotsCol
      .find({ dossierId: linkedDossierId })
      .sort({ createdAt: -1, _id: -1 })
      .limit(1)
      .next();

    const snapshot = createSnapshot({
      dossierId: linkedDossierId,
      content: dossierPayload,
      previousHash: lastSnapshot?.contentHash,
      privateKeyPem: privateKey,
    });

    await snapshotsCol.insertOne(snapshot as any);

    const auditCol = await coreCol<AuditEvent>(AUDIT);
    const lastEvent = await auditCol
      .find({ dossierId: linkedDossierId })
      .sort({ timestamp: -1, _id: -1 })
      .limit(1)
      .next();

    const acceptEvt = createAuditEvent({
      eventId: `evt_${crypto.randomUUID()}`,
      dossierId: linkedDossierId,
      actorRole: gate.actorRole,
      action: "editorial_accept",
      diff: { requestId, note, fromRequest: true },
      timestamp: now,
      previousHash: lastEvent?.eventHash,
    });

    await auditCol.insertOne(acceptEvt as any);

    const wfEvt = createAuditEvent({
      eventId: `evt_${crypto.randomUUID()}`,
      dossierId: linkedDossierId,
      actorRole: gate.actorRole,
      action: "workflow_transition",
      diff: { from: currentState, to: "in_review", note: "Editorial accept" },
      timestamp: now,
      previousHash: acceptEvt.eventHash,
    });

    await auditCol.insertOne(wfEvt as any);

    const snapEvt = createAuditEvent({
      eventId: `evt_${crypto.randomUUID()}`,
      dossierId: linkedDossierId,
      actorRole: gate.actorRole,
      action: "snapshot_created",
      diff: { snapshotId: snapshot.snapshotId, contentHash: snapshot.contentHash },
      timestamp: now,
      previousHash: wfEvt.eventHash,
    });

    await auditCol.insertOne(snapEvt as any);
  }

  await requestsCol.updateOne(
    { requestId },
    {
      $set: {
        status: nextStatus,
        updatedAt: now,
        decidedAt: now,
        decidedByRole: gate.actorRole,
        decidedByUserId: gate.userId,
        decisionNote: note,
        linkedDossierId: linkedDossierId ?? reqDoc.linkedDossierId,
      },
    },
  );

  const inboxCol = await coreCol<any>(INBOX);
  await inboxCol.updateOne(
    { requestId },
    { $set: { status: nextStatus, decidedAt: now, decidedByRole: gate.actorRole } },
  );

  if (reqDoc.dossierId) {
    const auditCol = await coreCol<AuditEvent>(AUDIT);
    const last = await auditCol
      .find({ dossierId: reqDoc.dossierId })
      .sort({ timestamp: -1, _id: -1 })
      .limit(1)
      .next();

    const evt = createAuditEvent({
      eventId: `evt_${crypto.randomUUID()}`,
      dossierId: reqDoc.dossierId,
      actorRole: gate.actorRole,
      action: "editorial_decision",
      diff: { requestId, decision: nextStatus, note },
      timestamp: now,
      previousHash: last?.eventHash,
    });

    await auditCol.insertOne(evt as any);
  }

  return NextResponse.json({ ok: true, status: nextStatus, linkedDossierId }, { status: 200 });
}
