import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { coreCol } from "@core/db/triMongo";
import demoDossier from "@features/dossier/data/demoDossier";
import { createAuditEvent } from "@features/dossier/infra/auditChain";
import { createSnapshot } from "@features/dossier/infra/snapshot";
import type { AuditEvent, DossierSnapshot, StoredDossier, WorkflowState } from "@features/dossier/infra/types";
import { canTransition } from "@features/dossier/infra/workflow";
import { requireDossierEditor } from "@/lib/server/auth/dossier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TransitionBody = {
  dossierId?: string;
  nextState?: WorkflowState;
  note?: string;
};

type WorkflowDoc = {
  dossierId: string;
  state: WorkflowState;
  updatedAt: string;
  updatedByRole: string;
  updatedByUserId?: string;
};

const WORKFLOW_COLLECTION = "dossier_workflow";
const AUDIT_COLLECTION = "dossier_audit_chain";

export async function POST(req: NextRequest) {
  const gate = await requireDossierEditor(req);
  if (gate instanceof Response) return gate;

  const body = (await req.json().catch(() => ({}))) as TransitionBody;
  const dossierId = body.dossierId ?? demoDossier.meta.id;
  const nextState = body.nextState;

  if (!nextState) {
    return NextResponse.json({ ok: false, error: "missing_next_state" }, { status: 400 });
  }

  const workflowCol = await coreCol<WorkflowDoc>(WORKFLOW_COLLECTION);
  const current = await workflowCol.findOne({ dossierId });
  const currentState: WorkflowState = current?.state ?? "draft";
  const note = body.note?.trim();

  if (!canTransition(currentState, nextState)) {
    return NextResponse.json(
      { ok: false, error: "transition_not_allowed", current: currentState, next: nextState },
      { status: 409 },
    );
  }
  if (currentState === "approved" && nextState === "published" && (!note || note.length < 3)) {
    return NextResponse.json({ ok: false, error: "missing_transition_note" }, { status: 400 });
  }

  const updatedAt = new Date().toISOString();
  await workflowCol.updateOne(
    { dossierId },
    {
      $set: {
        dossierId,
        state: nextState,
        updatedAt,
        updatedByRole: gate.actorRole,
        updatedByUserId: gate.userId,
      },
    },
    { upsert: true },
  );

  const auditCol = await coreCol<AuditEvent>(AUDIT_COLLECTION);
  const lastEvent = await auditCol
    .find({ dossierId })
    .sort({ timestamp: -1, _id: -1 })
    .limit(1)
    .next();

  const auditEvent = createAuditEvent({
    eventId: `evt_${crypto.randomUUID()}`,
    dossierId,
    actorRole: gate.actorRole,
    action: "workflow_transition",
    diff: {
      from: currentState,
      to: nextState,
      note,
    },
    timestamp: updatedAt,
    previousHash: lastEvent?.eventHash,
  });

  await auditCol.insertOne(auditEvent as any);

  let snapshot: DossierSnapshot | null = null;
  const privateKey = process.env.DOSSIER_SIGNING_PRIVATE_KEY;
  if (privateKey) {
    let content: any = null;
    if (dossierId === demoDossier.meta.id || dossierId === "demo") {
      content = demoDossier;
    } else {
      try {
        const storeCol = await coreCol<StoredDossier>("dossier_store");
        const stored = await storeCol.findOne({ dossierId });
        content = stored?.dossier ?? null;
      } catch {
        content = null;
      }
    }

    if (content) {
      const snapshotsCol = await coreCol<DossierSnapshot>("dossier_snapshots");
      const lastSnapshot = await snapshotsCol
        .find({ dossierId })
        .sort({ createdAt: -1, _id: -1 })
        .limit(1)
        .next();

      snapshot = createSnapshot({
        dossierId,
        content,
        previousHash: lastSnapshot?.contentHash,
        privateKeyPem: privateKey,
      });
      await snapshotsCol.insertOne(snapshot as any);

      const snapEvent = createAuditEvent({
        eventId: `evt_${crypto.randomUUID()}`,
        dossierId,
        actorRole: gate.actorRole,
        action: "snapshot_created",
        diff: { snapshotId: snapshot.snapshotId, contentHash: snapshot.contentHash },
        timestamp: updatedAt,
        previousHash: auditEvent.eventHash,
      });

      await auditCol.insertOne(snapEvent as any);
    }
  }

  return NextResponse.json(
    { ok: true, dossierId, previousState: currentState, state: nextState, updatedAt, auditEvent, snapshot },
    { status: 200 },
  );
}
