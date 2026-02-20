import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { coreCol } from "@core/db/triMongo";
import { createAuditEvent } from "@features/dossier/infra/auditChain";
import type { AuditEvent, MaterialKind, MaterialLink } from "@features/dossier/infra/types";
import { requireDossierEditor } from "@/lib/server/auth/dossier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LINKS = "dossier_material_links";
const AUDIT = "dossier_audit_chain";

type Body = {
  dossierId?: string;
  kind?: MaterialKind;
  itemId?: string;
  note?: string;
  edgeType?: MaterialLink["edgeType"];
};

export async function POST(req: NextRequest) {
  const gate = await requireDossierEditor(req);
  if (gate instanceof Response) return gate;

  const body = (await req.json().catch(() => ({}))) as Body;
  const dossierId = body.dossierId?.trim();
  const kind = body.kind;
  const itemId = body.itemId?.trim();
  const note = body.note?.trim()?.slice(0, 800);
  const edgeType = body.edgeType;

  if (!dossierId || !kind || !itemId) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const link: MaterialLink = {
    linkId: `lnk_${crypto.randomUUID()}`,
    dossierId,
    kind,
    itemId,
    createdAt: now,
    createdByRole: gate.actorRole,
    createdByUserId: gate.userId,
    note,
    edgeType,
  };

  const linksCol = await coreCol<MaterialLink>(LINKS);
  await linksCol.updateOne({ dossierId, kind, itemId }, { $set: link }, { upsert: true });

  const auditCol = await coreCol<AuditEvent>(AUDIT);
  const lastEvent = await auditCol
    .find({ dossierId })
    .sort({ timestamp: -1, _id: -1 })
    .limit(1)
    .next();

  const evt = createAuditEvent({
    eventId: `evt_${crypto.randomUUID()}`,
    dossierId,
    actorRole: gate.actorRole,
    action: "material_linked",
    diff: { kind, itemId, note, edgeType },
    timestamp: now,
    previousHash: lastEvent?.eventHash,
  });

  await auditCol.insertOne(evt as any);

  return NextResponse.json({ ok: true, link, auditEvent: evt }, { status: 200 });
}
