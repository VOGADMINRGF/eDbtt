import { NextRequest, NextResponse } from "next/server";
import { coreCol, ObjectId } from "@core/db/triMongo";
import type { Dossier } from "@features/dossier";
import demoDossier from "@features/dossier/data/demoDossier";
import type {
  AuditEvent,
  DossierSnapshot,
  IssueDelegation,
  MaterialLink,
  StoredDossier,
  WorkflowDoc,
} from "@features/dossier/infra/types";
import {
  getAnyDossierPublicationRecordByDossierId,
} from "@/features/create/dossierPublishWorkflowServer";
import { resolveDossierPublicExportAccess } from "@/features/dossier/publicExportAccess";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

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

function extractSnippet(value?: string | null) {
  if (!value) return "";
  const plain = String(value).replace(/\s+/g, " ").trim();
  return plain.length > 140 ? `${plain.slice(0, 140)}…` : plain;
}

function pushId(map: Map<string, { title?: string; excerpt?: string; source?: string }>, id?: string, value?: { title?: string; excerpt?: string; source?: string }) {
  if (!id || !value) return;
  map.set(id, value);
}

function splitObjectIds(ids: string[]) {
  const objectIds: ObjectId[] = [];
  const stringIds: string[] = [];
  for (const id of ids) {
    if (ObjectId.isValid(id)) {
      objectIds.push(new ObjectId(id));
    } else {
      stringIds.push(id);
    }
  }
  return { objectIds, stringIds };
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

  const dossierId = id === "demo" ? demoDossier.meta.id : id;
  const access =
    id === "demo" || id === demoDossier.meta.id
      ? { allowed: true as const, truthStage: "published" as const, truthStageLabel: "Veröffentlicht" }
      : resolveDossierPublicExportAccess(
          await getAnyDossierPublicationRecordByDossierId(dossierId).catch(() => null),
        );
  if (access.allowed === false) {
    const adminGate = await requireAdminOrResponse(request);
    if (adminGate instanceof Response) {
      return NextResponse.json(
        {
          ok: false,
          error: access.error,
          truthStage: access.truthStage,
          truthStageLabel: access.truthStageLabel,
        },
        { status: 409 },
      );
    }
  }

  const { meta, analyze, sourceSet } = dossier;

  let snapshot: DossierSnapshot | null = null;
  let auditTrail: AuditEvent[] = [];
  let workflow: WorkflowDoc | null = null;
  let delegations: IssueDelegation[] = [];
  let materialLinks: MaterialLink[] = [];

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

    const linksCol = await coreCol<MaterialLink>("dossier_material_links");
    materialLinks = await linksCol
      .find({ dossierId })
      .sort({ createdAt: -1, _id: -1 })
      .limit(100)
      .toArray();
  } catch {
    snapshot = snapshot ?? null;
    auditTrail = auditTrail ?? [];
    workflow = workflow ?? null;
    delegations = delegations ?? [];
    materialLinks = materialLinks ?? [];
  }

  if (materialLinks.length) {
    try {
      const statementIds = materialLinks.filter((l) => l.kind === "statement").map((l) => l.itemId);
      const contributionIds = materialLinks.filter((l) => l.kind === "contribution").map((l) => l.itemId);
      const statementMap = new Map<string, { title?: string; excerpt?: string; source?: string }>();
      const contributionMap = new Map<string, { title?: string; excerpt?: string; source?: string }>();

      if (statementIds.length) {
        const { objectIds, stringIds } = splitObjectIds(statementIds);
        const stmtsCol = await coreCol<any>("statements");
        const proposalsCol = await coreCol<any>("statement_proposals");

        if (objectIds.length) {
          const docs = await stmtsCol.find({ _id: { $in: objectIds } }).toArray();
          for (const doc of docs) {
            const title = doc.title ?? "Aussage";
            const excerpt = extractSnippet(doc.text ?? doc.content ?? doc.analysis?.summary ?? "");
            const source = "statements";
            pushId(statementMap, doc.id ?? String(doc._id), { title, excerpt, source });
            pushId(statementMap, String(doc._id), { title, excerpt, source });
          }
          const props = await proposalsCol.find({ _id: { $in: objectIds } }).toArray();
          for (const doc of props) {
            const title = doc.title ?? "Aussage (Vorschlag)";
            const excerpt = extractSnippet(doc.text ?? "");
            const source = "statement_proposals";
            pushId(statementMap, String(doc._id), { title, excerpt, source });
          }
        }
        if (stringIds.length) {
          const docs = await stmtsCol.find({ id: { $in: stringIds } }).toArray();
          for (const doc of docs) {
            const title = doc.title ?? "Aussage";
            const excerpt = extractSnippet(doc.text ?? doc.content ?? doc.analysis?.summary ?? "");
            const source = "statements";
            pushId(statementMap, doc.id ?? String(doc._id), { title, excerpt, source });
          }
        }
      }

      if (contributionIds.length) {
        const { objectIds, stringIds } = splitObjectIds(contributionIds);
        const contribCol = await coreCol<any>("contributions");

        if (objectIds.length) {
          const docs = await contribCol.find({ _id: { $in: objectIds } }).toArray();
          for (const doc of docs) {
            const title = doc.title ?? "Beitrag";
            const excerpt = extractSnippet(doc.text ?? doc.content ?? doc.analysis?.summary ?? "");
            const source = "contributions";
            pushId(contributionMap, doc.id ?? String(doc._id), { title, excerpt, source });
            pushId(contributionMap, String(doc._id), { title, excerpt, source });
          }
          const { readCreateContributionDraftById } = await import("@/server/serverDrafts");
          const drafts = await Promise.all(
            objectIds.map((objectId) => readCreateContributionDraftById(objectId.toHexString())),
          );
          for (const draft of drafts) {
            if (!draft) continue;
            const title = "Beitrag (Entwurf)";
            const excerpt = extractSnippet(draft.text ?? (draft.analysis as any)?.summary ?? "");
            const source = draft.storage === "drafts" ? "drafts" : "contribution_drafts";
            pushId(contributionMap, draft.id, { title, excerpt, source });
          }
        }
        if (stringIds.length) {
          const docs = await contribCol.find({ id: { $in: stringIds } }).toArray();
          for (const doc of docs) {
            const title = doc.title ?? "Beitrag";
            const excerpt = extractSnippet(doc.text ?? doc.content ?? doc.analysis?.summary ?? "");
            const source = "contributions";
            pushId(contributionMap, doc.id ?? String(doc._id), { title, excerpt, source });
          }
        }
      }

      materialLinks = materialLinks.map((link) => {
        const info = link.kind === "statement" ? statementMap.get(link.itemId) : contributionMap.get(link.itemId);
        return info
          ? { ...link, itemTitle: info.title, itemExcerpt: info.excerpt, itemSource: info.source }
          : link;
      });
    } catch {
      // fallback: raw links only
    }
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

    if (materialLinks.length) {
      rows.push([
        "material_links",
        dossierId,
        "Materialverknüpfungen",
        `Anzahl: ${materialLinks.length}`,
      ]);
      for (const link of materialLinks) {
        rows.push([
          "material_link",
          link.linkId,
          `${link.kind}:${link.itemId}`,
          `Kante: ${link.edgeType ?? "unknown"} | Hinweis: ${link.note ?? "-"} | Titel: ${link.itemTitle ?? "-"}`,
        ]);
      }
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
    materialLinks,
  });
}
