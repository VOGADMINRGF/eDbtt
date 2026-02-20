import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { coreCol } from "@core/db/triMongo";
import demoDossier from "@features/dossier/data/demoDossier";
import { createSnapshot } from "@features/dossier/infra/snapshot";
import { createAuditEvent } from "@features/dossier/infra/auditChain";
import type {
  AuditEvent,
  DossierSnapshot,
  StoredDossier,
  WorkflowDoc,
  WorkflowState,
} from "@features/dossier/infra/types";
import { requireDossierEditor } from "@/lib/server/auth/dossier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  municipality: string;
  title: string;
  sourceHint?: string;
};

const DOSSIER_STORE = "dossier_store";
const SNAPSHOTS = "dossier_snapshots";
const AUDIT = "dossier_audit_chain";
const WORKFLOW = "dossier_workflow";

function patchPresentationMunicipality(dossier: any, municipality: string, title: string) {
  const notes = dossier?.analyze?.notes ?? [];
  for (const note of notes) {
    if (note?.kind !== "presentation" || !note?.text) continue;
    try {
      const parsed = JSON.parse(note.text);
      parsed.topic = {
        ...(parsed.topic ?? {}),
        municipality,
        kommune: municipality,
      };
      parsed.hero = {
        ...(parsed.hero ?? {}),
      };
      note.text = JSON.stringify(parsed);
    } catch {
      continue;
    }
  }
  dossier.meta = {
    ...dossier.meta,
    title,
    region: municipality,
  };
}

export async function POST(req: NextRequest) {
  const gate = await requireDossierEditor(req);
  if (gate instanceof Response) return gate;

  const body = (await req.json().catch(() => ({}))) as Partial<Body>;
  const municipality = body.municipality?.trim();
  const title = body.title?.trim();
  let sourceHint = "";

  if (!municipality || !title) {
    return NextResponse.json({ ok: false, error: "missing_municipality_or_title" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const dossierId = `dos_${crypto.randomUUID()}`;

  const cloned = structuredClone(demoDossier) as any;
  cloned.meta = {
    ...cloned.meta,
    id: dossierId,
    title,
    region: municipality,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  patchPresentationMunicipality(cloned, municipality, title);

  if (body.sourceHint) {
    const hint = String(body.sourceHint).replace(/\s+/g, " ").trim().slice(0, 400);
    if (hint) {
      sourceHint = hint;
      cloned.analyze.notes = cloned.analyze.notes ?? [];
      cloned.analyze.notes.push({
        id: `note-sourcehint-${dossierId}`,
        kind: "context",
        text: `Ursprungshinweis: ${hint}`,
      });
    }
  }

  const storeCol = await coreCol<StoredDossier>(DOSSIER_STORE);
  const stored: StoredDossier = {
    dossierId,
    createdAt: now,
    updatedAt: now,
    createdByRole: gate.actorRole,
    createdByUserId: gate.userId,
    dossier: cloned,
  };
  await storeCol.insertOne(stored as any);

  const privateKey = process.env.DOSSIER_SIGNING_PRIVATE_KEY;
  if (!privateKey) {
    return NextResponse.json({ ok: false, error: "missing_signing_key" }, { status: 500 });
  }

  const snapshotsCol = await coreCol<DossierSnapshot>(SNAPSHOTS);
  const snapshot = createSnapshot({
    dossierId,
    content: cloned,
    previousHash: undefined,
    privateKeyPem: privateKey,
  });
  await snapshotsCol.insertOne(snapshot as any);

  const workflowCol = await coreCol<WorkflowDoc>(WORKFLOW);
  await workflowCol.updateOne(
    { dossierId },
    {
      $set: {
        dossierId,
        state: "draft",
        updatedAt: now,
        updatedByRole: gate.actorRole,
        updatedByUserId: gate.userId,
      },
    },
    { upsert: true },
  );

  const auditCol = await coreCol<AuditEvent>(AUDIT);
  const auditEvent = createAuditEvent({
    eventId: `evt_${crypto.randomUUID()}`,
    dossierId,
    actorRole: gate.actorRole,
    action: "dossier_created_from_suggestion",
    diff: {
      municipality,
      title,
      snapshotId: snapshot.snapshotId,
      contentHash: snapshot.contentHash,
      sourceHint,
    },
    timestamp: now,
    previousHash: undefined,
  });
  await auditCol.insertOne(auditEvent as any);

  return NextResponse.json({ ok: true, dossierId, snapshot, auditEvent }, { status: 200 });
}
