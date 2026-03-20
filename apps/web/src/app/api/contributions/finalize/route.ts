import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { coreCol, getCol, ObjectId } from "@core/db/triMongo";
import { createAuditEvent } from "@features/dossier/infra/auditChain";
import type { AuditEvent, MaterialLink } from "@features/dossier/infra/types";
import { z } from "zod";
import { CREATE_MODE_VALUES, parseCreateMode, type CreateMode } from "@/features/create/intents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FinalizeSchema = z.object({
  draftId: z.string().min(1),
  selectedClaimIds: z.array(z.string()).min(1),
  topicTitle: z.string().optional(),
  source: z.enum(["contribution_new", "statement_new"]).optional(),
  createMode: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const parsed = parseCreateMode(value);
      return parsed ?? value.toLowerCase().trim();
    },
    z.enum(CREATE_MODE_VALUES).optional(),
  ),
  anlassraumId: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const normalized = value.trim().toLowerCase();
      return normalized || undefined;
    },
    z
      .string()
      .refine((value) => ObjectId.isValid(value), "invalid_anlassraum_id")
      .optional(),
  ),
  dossierId: z.string().min(1).optional(),
});

type DraftDoc = {
  _id: ObjectId;
  authorId: string;
  authorName?: string | null;
  useCase?: "civic" | "journalism" | "agenda" | null;
  createMode?: CreateMode | null;
  anlassraumId?: string | null;
  analysis?: any;
  status?: "draft" | "finalized";
  proposalIds?: string[];
};

type ProposalDoc = {
  _id?: ObjectId;
  draftId: ObjectId;
  authorId: string;
  authorName?: string | null;
  useCase?: "civic" | "journalism" | "agenda" | null;
  createMode?: CreateMode | null;
  anlassraumId?: string | null;
  claimId: string;
  text: string;
  title?: string | null;
  responsibility?: string | null;
  topic?: string | null;
  stance?: string | null;
  importance?: number | null;
  source?: string;
  topicTitle?: string;
  dossierId?: string;
  status: "proposed";
  createdAt: Date;
};

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("u_id")?.value;
    if (!userId) {
      return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
    }

    const body = FinalizeSchema.parse(await req.json());
    const Drafts = await getCol<DraftDoc>("contribution_drafts");
    const Proposals = await getCol<ProposalDoc>("statement_proposals");

    let draftOid: ObjectId;
    try {
      draftOid = new ObjectId(body.draftId);
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_draft" }, { status: 400 });
    }

    const draft = await Drafts.findOne({ _id: draftOid, authorId: userId });
    if (!draft) {
      return NextResponse.json({ ok: false, error: "draft_not_found" }, { status: 404 });
    }

    if (draft.status === "finalized" && Array.isArray(draft.proposalIds) && draft.proposalIds.length > 0) {
      return NextResponse.json({
        ok: true,
        proposalIds: draft.proposalIds,
        redirectTo: body.dossierId ? `/dossier/${body.dossierId}` : `/swipes?fromDraft=${body.draftId}`,
      });
    }

    const claims = Array.isArray(draft.analysis?.claims) ? draft.analysis.claims : [];
    const selectedSet = new Set(body.selectedClaimIds);
    const selectedClaims = claims.filter((claim: any) => selectedSet.has(String(claim?.id)));

    if (selectedClaims.length === 0) {
      return NextResponse.json({ ok: false, error: "no_claims_selected" }, { status: 400 });
    }
    const resolvedCreateMode: CreateMode =
      body.createMode ?? draft.createMode ?? (body.source === "statement_new" ? "manual" : "source");
    const resolvedAnlassraumId = body.anlassraumId ?? draft.anlassraumId ?? null;

    const now = new Date();
    const insertDocs: ProposalDoc[] = selectedClaims.map((claim: any) => ({
      draftId: draftOid,
      authorId: draft.authorId,
      authorName: draft.authorName ?? null,
      useCase: draft.useCase ?? null,
      createMode: resolvedCreateMode,
      anlassraumId: resolvedAnlassraumId,
      claimId: String(claim.id),
      text: String(claim.text ?? ""),
      title: claim.title ?? null,
      responsibility: claim.responsibility ?? null,
      topic: claim.topic ?? null,
      stance: claim.stance ?? null,
      importance: typeof claim.importance === "number" ? claim.importance : null,
      source: body.source,
      topicTitle: body.topicTitle,
      dossierId: body.dossierId,
      status: "proposed",
      createdAt: now,
    }));

    const insert = await Proposals.insertMany(insertDocs);
    const proposalIds = Object.values(insert.insertedIds).map((id) => String(id));

    await Drafts.updateOne(
      { _id: draftOid },
      {
        $set: {
          status: "finalized",
          finalizedAt: now,
          proposalIds,
          createMode: resolvedCreateMode,
          anlassraumId: resolvedAnlassraumId,
        },
      },
    );

    if (body.dossierId) {
      const dossierId = body.dossierId;
      const auditCol = await coreCol<AuditEvent>("dossier_audit_chain");
      const lastEvent = await auditCol
        .find({ dossierId })
        .sort({ timestamp: -1, _id: -1 })
        .limit(1)
        .next();
      const evt = createAuditEvent({
        eventId: `evt_${crypto.randomUUID()}`,
        dossierId,
        actorRole: "citizen",
        action: body.source === "statement_new" ? "statement_submitted" : "contribution_submitted",
        diff: { draftId: body.draftId, proposalIds },
        timestamp: now.toISOString(),
        previousHash: lastEvent?.eventHash,
      });
      await auditCol.insertOne(evt as any);

      const linksCol = await coreCol<MaterialLink>("dossier_material_links");
      const createdAt = now.toISOString();
      const linkDocs: MaterialLink[] = [];
      const baseNote = body.source === "statement_new" ? "Direkt eingereicht" : "Aus Beitrag";

      if (body.source === "contribution_new") {
        linkDocs.push({
          linkId: `lnk_${crypto.randomUUID()}`,
          dossierId,
          kind: "contribution",
          itemId: body.draftId,
          createdAt,
          createdByRole: "citizen",
          createdByUserId: userId,
          note: "Beitrag eingereicht",
          edgeType: "mentions",
        });
      }

      for (const proposalId of proposalIds) {
        linkDocs.push({
          linkId: `lnk_${crypto.randomUUID()}`,
          dossierId,
          kind: "statement",
          itemId: proposalId,
          createdAt,
          createdByRole: "citizen",
          createdByUserId: userId,
          note: baseNote,
          edgeType: "supports",
        });
      }

      if (linkDocs.length) {
        await Promise.all(
          linkDocs.map((link) =>
            linksCol.updateOne(
              { dossierId: link.dossierId, kind: link.kind, itemId: link.itemId },
              { $set: link },
              { upsert: true },
            ),
          ),
        );

        const lastAfter = await auditCol
          .find({ dossierId })
          .sort({ timestamp: -1, _id: -1 })
          .limit(1)
          .next();
        const materialEvt = createAuditEvent({
          eventId: `evt_${crypto.randomUUID()}`,
          dossierId,
          actorRole: "citizen",
          action: "material_linked",
          diff: {
            source: body.source ?? "contribution_new",
            contributionId: body.source === "contribution_new" ? body.draftId : undefined,
            statementIds: proposalIds,
            count: linkDocs.length,
          },
          timestamp: now.toISOString(),
          previousHash: lastAfter?.eventHash,
        });
        await auditCol.insertOne(materialEvt as any);
      }
    }

    return NextResponse.json({
      ok: true,
      proposalIds,
      createMode: resolvedCreateMode,
      anlassraumId: resolvedAnlassraumId,
      redirectTo: body.dossierId ? `/dossier/${body.dossierId}` : `/swipes?fromDraft=${body.draftId}`,
    });
  } catch (err: any) {
    if (Array.isArray(err?.issues) && err.issues.length > 0) {
      const issue = err.issues[0];
      const message =
        issue?.path?.[0] === "createMode"
          ? "invalid_create_mode"
          : issue?.path?.[0] === "anlassraumId"
            ? "invalid_anlassraum_id"
          : issue?.message ?? "invalid_body";
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    const message = err?.message ?? "Finalize failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
