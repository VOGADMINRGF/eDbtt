import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { coreCol, getCol, ObjectId } from "@core/db/triMongo";
import { createAuditEvent } from "@features/dossier/infra/auditChain";
import type { AuditEvent, MaterialLink } from "@features/dossier/infra/types";
import { z } from "zod";
import { getCreateEntitlementsForRequest } from "@/lib/server/entitlements/createEntitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FinalizeSchema = z.object({
  draftId: z.string().min(1),
  selectedClaimIds: z.array(z.string()).min(1),
  topicTitle: z.string().optional(),
  source: z.enum(["contribution_new", "statement_new"]).optional(),
  dossierId: z.string().min(1).optional(),
});

type DraftDoc = {
  _id: ObjectId;
  authorId: string;
  authorName?: string | null;
  useCase?: "civic" | "journalism" | "agenda" | null;
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

type UserCreditsDoc = {
  _id: ObjectId;
  usage?: { contributionCredits?: number | null };
  stats?: { contributionCredits?: number | null };
};

type ApiSuccess<T> = { ok: true; data: T; code?: string };
type ApiError = { ok: false; error: string; code: string; details?: unknown };

function ok<T>(data: T, status = 200, code?: string) {
  return NextResponse.json({ ok: true, data, ...(code ? { code } : {}) } satisfies ApiSuccess<T>, { status });
}

function err(code: string, message: string, status = 500, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: message, code, ...(details ? { details } : {}) } satisfies ApiError,
    { status },
  );
}

async function consumeContributionCredit(userId: string): Promise<boolean> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(userId);
  } catch {
    return false;
  }

  const Users = await getCol<UserCreditsDoc>("users");
  const creditsExpr = {
    $ifNull: ["$usage.contributionCredits", { $ifNull: ["$stats.contributionCredits", 0] }],
  };

  const result = await Users.findOneAndUpdate(
    { _id: oid, $expr: { $gt: [creditsExpr, 0] } },
    [
      {
        $set: {
          "usage.contributionCredits": { $max: [{ $subtract: [creditsExpr, 1] }, 0] },
          "stats.contributionCredits": { $max: [{ $subtract: [creditsExpr, 1] }, 0] },
          "usage.lastContributionCreditUseAt": new Date(),
        },
      },
    ],
    { returnDocument: "after" },
  );

  const updated = (result as any)?.value ?? result;
  return Boolean(updated);
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("u_id")?.value;
    if (!userId) {
      return err("NOT_AUTHENTICATED", "Einreichen erfordert Anmeldung.", 401);
    }

    let body: z.infer<typeof FinalizeSchema>;
    try {
      body = FinalizeSchema.parse(await req.json());
    } catch (parseErr: any) {
      const message = parseErr?.issues?.[0]?.message ?? "invalid_body";
      return err("INVALID_BODY", message, 400, { issues: parseErr?.issues });
    }
    const entitlements = await getCreateEntitlementsForRequest(req);
    if (!entitlements.isAuthenticated || !entitlements.userId) {
      return err("NOT_AUTHENTICATED", "Einreichen erfordert Anmeldung.", 401);
    }

    const intent = body.source === "statement_new" ? "statement" : "contribution";
    const maxFinalizeClaims = intent === "statement" ? 1 : entitlements.maxFinalizeClaimsPerInput;

    if (body.selectedClaimIds.length > maxFinalizeClaims) {
      return err(
        "MAX_FINALIZE_CLAIMS_EXCEEDED",
        `Maximal ${maxFinalizeClaims} Kernaussagen sind zulaessig.`,
        403,
        { limit: maxFinalizeClaims },
      );
    }

    if (intent === "statement" && !entitlements.canSubmitStatement) {
      return err("STATEMENT_FORBIDDEN", "Statements sind fuer dein Paket nicht freigeschaltet.", 403);
    }
    if (intent === "contribution" && !entitlements.canSubmitContribution) {
      return err(
        "CONTRIBUTION_FORBIDDEN",
        entitlements.reasons?.monthly_limit ??
          entitlements.reasons?.credits ??
          "Beitraege sind fuer dein Paket nicht freigeschaltet.",
        403,
      );
    }
    const Drafts = await getCol<DraftDoc>("contribution_drafts");
    const Proposals = await getCol<ProposalDoc>("statement_proposals");

    let draftOid: ObjectId;
    try {
      draftOid = new ObjectId(body.draftId);
    } catch {
      return err("INVALID_DRAFT", "Draft-ID ist ungueltig.", 400);
    }

    const draft = await Drafts.findOne({ _id: draftOid, authorId: userId });
    if (!draft) {
      return err("DRAFT_NOT_FOUND", "Entwurf nicht gefunden.", 404);
    }

    if (draft.status === "finalized" && Array.isArray(draft.proposalIds) && draft.proposalIds.length > 0) {
      return ok({
        proposalIds: draft.proposalIds,
        redirectTo: body.dossierId ? `/dossier/${body.dossierId}` : `/swipes?fromDraft=${body.draftId}`,
      });
    }

    const claims = Array.isArray(draft.analysis?.claims) ? draft.analysis.claims : [];
    const selectedSet = new Set(body.selectedClaimIds);
    const selectedClaims = claims.filter((claim: any) => selectedSet.has(String(claim?.id)));

    if (selectedClaims.length === 0) {
      return err("NO_CLAIMS_SELECTED", "Bitte waehle mindestens ein Statement aus.", 400);
    }

    if (intent === "contribution" && entitlements.creditRequiredForContribution) {
      const consumed = await consumeContributionCredit(userId);
      if (!consumed) {
        return err("NO_CREDITS", "Keine Contribution-Credits verfuegbar.", 403);
      }
    }

    const now = new Date();
    const insertDocs: ProposalDoc[] = selectedClaims.map((claim: any) => ({
      draftId: draftOid,
      authorId: draft.authorId,
      authorName: draft.authorName ?? null,
      useCase: draft.useCase ?? null,
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

    return ok({
      proposalIds,
      redirectTo: body.dossierId ? `/dossier/${body.dossierId}` : `/swipes?fromDraft=${body.draftId}`,
    });
  } catch (err: any) {
    const message = err?.issues?.[0]?.message ?? err?.message ?? "Finalize failed";
    return err("FINALIZE_FAILED", message, 500);
  }
}
