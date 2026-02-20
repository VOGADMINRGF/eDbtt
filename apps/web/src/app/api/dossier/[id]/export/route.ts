import { NextRequest, NextResponse } from "next/server";
import { coreCol } from "@core/db/triMongo";
import type { Dossier } from "@features/dossier";
import demoDossier from "@features/dossier/data/demoDossier";
import type {
  AuditEvent,
  DossierSnapshot,
  IssueDelegation,
  StoredDossier,
  WorkflowDoc,
} from "@features/dossier/infra/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\n") || value.includes("\"")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function toCsv(rows: string[][]) {
  return rows.map((row) => row.map((cell) => escapeCsv(cell ?? "")).join(",")).join("\n");
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const format = new URL(request.url).searchParams.get("format") ?? "json";
  let dossier: Dossier | null = null;
  if (id === "demo" || id === demoDossier.meta.id) {
    dossier = demoDossier;
  } else {
    try {
      const storeCol = await coreCol<StoredDossier>("dossier_store");
      const stored = await storeCol.findOne({ dossierId: id });
      dossier = (stored?.dossier as Dossier) ?? null;
    } catch {
      dossier = null;
    }
  }

  if (!dossier) {
    return NextResponse.json({ error: "Dossier not found" }, { status: 404 });
  }

  const { meta, analyze, sourceSet } = dossier;
  const dossierId = id === "demo" ? demoDossier.meta.id : id;

  let snapshot: DossierSnapshot | null = null;
  let auditTrail: AuditEvent[] = [];
  let workflow: WorkflowDoc | null = null;
  let delegations: IssueDelegation[] = [];

  try {
    const snapshotsCol = await coreCol<DossierSnapshot>("dossier_snapshots");
    snapshot = await snapshotsCol
      .find({ dossierId })
      .sort({ createdAt: -1, _id: -1 })
      .limit(1)
      .next();

    const auditCol = await coreCol<AuditEvent>("dossier_audit_chain");
    auditTrail = await auditCol
      .find({ dossierId })
      .sort({ timestamp: -1, _id: -1 })
      .limit(50)
      .toArray();

    const workflowCol = await coreCol<WorkflowDoc>("dossier_workflow");
    workflow = await workflowCol.findOne({ dossierId });

    const delegationsCol = await coreCol<IssueDelegation>("dossier_issue_delegations");
    delegations = await delegationsCol
      .find({ dossierId })
      .sort({ updatedAt: -1, _id: -1 })
      .limit(100)
      .toArray();
  } catch {
    snapshot = snapshot ?? null;
    auditTrail = auditTrail ?? [];
    workflow = workflow ?? null;
    delegations = delegations ?? [];
  }

  if (format === "csv") {
    const rows: string[][] = [["type", "id", "title", "details"]];

    for (const claim of analyze.claims) {
      rows.push([
        "claim",
        claim.id,
        claim.title ?? "Kernaussage",
        `${claim.text ?? ""} | Typ: ${(claim as { statementType?: string }).statementType ?? "-"}`,
      ]);
    }

    for (const source of sourceSet) {
      rows.push([
        "source",
        source.canonicalUrl ?? "source",
        source.title ?? "Quelle",
        `Publisher: ${source.publisher ?? "-"} | Typ: ${source.sourceType ?? "-"} | Ort: ${source.location ?? "-"}`,
      ]);
    }

    for (const finding of analyze.findings ?? []) {
      rows.push([
        "finding",
        finding.id,
        finding.claimId,
        `Quelle: ${finding.sourceId} | Befund: ${finding.finding} | ${finding.rationale ?? ""}`,
      ]);
    }

    for (const question of analyze.questions) {
      rows.push(["question", question.id, "Offene Frage", question.text ?? ""]);
    }

    if (snapshot) {
      rows.push([
        "snapshot",
        snapshot.snapshotId,
        "Snapshot",
        `Hash: ${snapshot.contentHash} | Signatur: ${snapshot.signature.slice(0, 12)}...`,
      ]);
    }

    for (const event of auditTrail) {
      rows.push([
        "audit",
        event.eventId,
        event.action,
        `${event.timestamp} | Rolle: ${event.actorRole}`,
      ]);
    }

    if (workflow) {
      rows.push([
        "workflow",
        workflow.dossierId,
        "Workflow",
        `${workflow.state} | ${workflow.updatedAt}`,
      ]);
    }

    if (delegations.length) {
      rows.push([
        "delegations",
        dossierId,
        "Delegationen",
        `Anzahl: ${delegations.length}`,
      ]);
    }

    for (const delegation of delegations) {
      rows.push([
        "delegation",
        delegation.delegationId,
        delegation.questionId,
        `Status: ${delegation.status} | Delegiert an: ${delegation.delegatedTo ?? "-"} | Ebene: ${delegation.level ?? "-"}`,
      ]);
    }

    const csv = toCsv(rows);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `inline; filename="dossier-${meta.id}.csv"`,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    exportedAt: new Date().toISOString(),
    dossier,
    snapshot,
    auditTrail,
    workflow,
    delegations,
  });
}
