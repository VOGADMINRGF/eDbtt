import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { coreCol } from "@core/db/triMongo";
import demoDossier from "@features/dossier/data/demoDossier";
import { createSnapshot } from "@features/dossier/infra/snapshot";
import { createAuditEvent } from "@features/dossier/infra/auditChain";
import type { AuditEvent, DossierSnapshot } from "@features/dossier/infra/types";
import { requireDossierEditor } from "@/lib/server/auth/dossier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SnapshotBody = { dossierId?: string; content?: unknown };

const SNAPSHOT_COLLECTION = "dossier_snapshots";
const AUDIT_COLLECTION = "dossier_audit_chain";

export async function POST(req: NextRequest) {
  const gate = await requireDossierEditor(req);
  if (gate instanceof Response) return gate;

  const body = (await req.json().catch(() => ({}))) as SnapshotBody;
  const dossierId = body.dossierId ?? demoDossier.meta.id;

  let content = body.content;
  if (!content && (dossierId === demoDossier.meta.id || dossierId === "demo")) {
    content = demoDossier;
  }

  if (!content) {
    return NextResponse.json({ ok: false, error: "dossier_not_found" }, { status: 404 });
  }

  const privateKey = process.env.DOSSIER_SIGNING_PRIVATE_KEY;
  if (!privateKey) {
    return NextResponse.json({ ok: false, error: "missing_signing_key" }, { status: 500 });
  }

  const snapshotsCol = await coreCol<DossierSnapshot>(SNAPSHOT_COLLECTION);
  const lastSnapshot = await snapshotsCol
    .find({ dossierId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(1)
    .next();

  const snapshot = createSnapshot({
    dossierId,
    content,
    previousHash: lastSnapshot?.contentHash,
    privateKeyPem: privateKey,
  });

  await snapshotsCol.insertOne(snapshot as any);

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
    action: "snapshot_created",
    diff: { snapshotId: snapshot.snapshotId, contentHash: snapshot.contentHash },
    timestamp: new Date().toISOString(),
    previousHash: lastEvent?.eventHash,
  });

  await auditCol.insertOne(auditEvent as any);

  return NextResponse.json({ ok: true, snapshot, auditEvent }, { status: 200 });
}
