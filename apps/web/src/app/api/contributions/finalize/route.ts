import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { coreCol, getCol, ObjectId } from "@core/db/triMongo";
import { createAuditEvent } from "@features/dossier/infra/auditChain";
import type { AuditEvent, MaterialLink } from "@features/dossier/infra/types";
import { z } from "zod";
import { CREATE_MODE_VALUES, parseCreateMode, type CreateMode } from "@/features/create/intents";
import {
  buildFinalizeRedirectPath,
  type InternalRedirectPath,
} from "@/features/create/finalizeRedirect";
import {
  type CreateInputSafetyDecision,
  type CreateInputSafetyResult,
} from "@/features/create/safety/createInputSafety";
import {
  evaluateCreateClaimSafety,
  type CreateClaimPublicationStatus,
  type CreateClaimSafetyResult,
} from "@/features/create/safety/createClaimSafety";

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

type StoredClaimSafety = CreateClaimSafetyResult;

function isSafetyDecision(value: unknown): value is CreateInputSafetyDecision {
  return (
    value === "allow" ||
    value === "revise_required" ||
    value === "factcheck_required" ||
    value === "graph_review_required" ||
    value === "editorial_review_required" ||
    value === "moderation_required" ||
    value === "blocked"
  );
}

function hasOpenRequiredClarifications(safety: CreateInputSafetyResult | null): boolean {
  return Boolean(
    safety &&
      Array.isArray(safety.clarifications) &&
      safety.clarifications.some((clarification) => clarification.requiredBeforeFinalize),
  );
}

function readDraftSafety(analysis: unknown): CreateInputSafetyResult | null {
  if (!analysis || typeof analysis !== "object" || Array.isArray(analysis)) return null;
  const maybe = (analysis as Record<string, unknown>).safety;
  if (!maybe || typeof maybe !== "object" || Array.isArray(maybe)) return null;
  const decision = (maybe as Record<string, unknown>).decision;
  if (!isSafetyDecision(decision)) return null;
  return maybe as CreateInputSafetyResult;
}

function looksLikeSafeQuestionOrProofClaim(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.includes("?")) return true;
  if (/quelle|beleg|nachweis|source|evidence|https?:\/\//.test(normalized)) return true;
  return false;
}

function readDraftClaimSafety(analysis: unknown): StoredClaimSafety[] {
  if (!analysis || typeof analysis !== "object" || Array.isArray(analysis)) return [];
  const safety = (analysis as Record<string, unknown>).safety;
  if (!safety || typeof safety !== "object" || Array.isArray(safety)) return [];
  const claimSafety = (safety as Record<string, unknown>).claimSafety;
  if (!Array.isArray(claimSafety)) return [];
  return claimSafety.filter(
    (entry): entry is StoredClaimSafety =>
      Boolean(entry) &&
      typeof entry === "object" &&
      !Array.isArray(entry) &&
      typeof (entry as Record<string, unknown>).publicationStatus === "string",
  );
}

function resolveClaimSafetyForFinalize(params: {
  claim: any;
  storedClaimSafetyById: Map<string, StoredClaimSafety>;
  locale: string;
}): CreateClaimSafetyResult {
  const claimId =
    typeof params.claim?.id === "string" || typeof params.claim?.id === "number"
      ? String(params.claim.id)
      : null;
  if (claimId && params.storedClaimSafetyById.has(claimId)) {
    return params.storedClaimSafetyById.get(claimId)!;
  }
  return evaluateCreateClaimSafety({
    claimId,
    text: String(params.claim?.text ?? ""),
    locale: params.locale,
    sourceLanguage: params.locale,
    contentLanguage: params.locale,
  });
}

function isAllowedPublicationStatus(status: CreateClaimPublicationStatus): boolean {
  return (
    status === "publishable" ||
    status === "publishable_as_question" ||
    status === "publishable_as_opinion" ||
    status === "needs_rewrite"
  );
}

function resolveFinalizeErrorCode(claimSafety: CreateClaimSafetyResult | null): string {
  if (!claimSafety) return "factcheck_required";
  if (claimSafety.publicationStatus === "blocked" || claimSafety.publicationStatus === "moderation_required") {
    return "create_input_blocked";
  }
  if (claimSafety.publicationStatus === "graph_review_required") {
    return "graph_review_required";
  }
  return "factcheck_required";
}

function resolveProposalText(claim: any, claimSafety: CreateClaimSafetyResult): string {
  if (claimSafety.safeText.trim()) {
    return claimSafety.safeText;
  }
  return String(claim?.text ?? "");
}

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

type FinalizeSuccessResponse = {
  ok: true;
  proposalIds: string[];
  createMode?: CreateMode;
  anlassraumId?: string | null;
  redirectTo: InternalRedirectPath;
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

    const draftSafety = readDraftSafety(draft.analysis);
    if (draftSafety?.decision === "blocked" || draftSafety?.decision === "moderation_required") {
      return NextResponse.json(
        {
          ok: false,
          error: "create_input_blocked",
          safety: draftSafety,
        },
        { status: 422 },
      );
    }

    if (
      draftSafety?.decision === "editorial_review_required" ||
      draftSafety?.qualityGate?.editorialReviewRequested
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "editorial_review_required",
          safety: draftSafety,
        },
        { status: 422 },
      );
    }

    if (hasOpenRequiredClarifications(draftSafety)) {
      return NextResponse.json(
        {
          ok: false,
          error: "quality_clarification_required",
          safety: draftSafety,
        },
        { status: 422 },
      );
    }

    if (draft.status === "finalized" && Array.isArray(draft.proposalIds) && draft.proposalIds.length > 0) {
      const response: FinalizeSuccessResponse = {
        ok: true,
        proposalIds: draft.proposalIds,
        redirectTo: buildFinalizeRedirectPath({
          draftId: body.draftId,
          dossierId: body.dossierId,
        }),
      };
      return NextResponse.json(response);
    }

    const claims = Array.isArray(draft.analysis?.claims) ? draft.analysis.claims : [];
    const selectedSet = new Set(body.selectedClaimIds);
    const selectedClaims = claims.filter((claim: any) => selectedSet.has(String(claim?.id)));

    if (selectedClaims.length === 0) {
      return NextResponse.json({ ok: false, error: "no_claims_selected" }, { status: 400 });
    }

    const storedClaimSafety = readDraftClaimSafety(draft.analysis);
    const storedClaimSafetyById = new Map(
      storedClaimSafety
        .filter((entry) => entry.claimId)
        .map((entry) => [String(entry.claimId), entry] as const),
    );
    const selectedClaimSafety = selectedClaims.map((claim: any) =>
      resolveClaimSafetyForFinalize({
        claim,
        storedClaimSafetyById,
        locale: "de",
      }),
    );

    const blockingClaimSafety =
      selectedClaimSafety.find((entry) => !isAllowedPublicationStatus(entry.publicationStatus)) ??
      null;

    if (blockingClaimSafety) {
      return NextResponse.json(
        {
          ok: false,
          error: resolveFinalizeErrorCode(blockingClaimSafety),
          safety: blockingClaimSafety,
        },
        { status: 422 },
      );
    }

    if (draftSafety?.decision === "factcheck_required") {
      const hasUnsupportedClaim = selectedClaimSafety.some(
        (entry) =>
          entry.publicationStatus === "factcheck_required" &&
          !looksLikeSafeQuestionOrProofClaim(entry.safeText || entry.text),
      );
      if (hasUnsupportedClaim) {
        return NextResponse.json(
          {
            ok: false,
            error: "factcheck_required",
            safety: draftSafety,
          },
          { status: 422 },
        );
      }
    }
    const resolvedCreateMode: CreateMode =
      body.createMode ?? draft.createMode ?? (body.source === "statement_new" ? "manual" : "source");
    const resolvedAnlassraumId = body.anlassraumId ?? draft.anlassraumId ?? null;

    const now = new Date();
    const insertDocs: ProposalDoc[] = selectedClaims.map((claim: any, index: number) => ({
      draftId: draftOid,
      authorId: draft.authorId,
      authorName: draft.authorName ?? null,
      useCase: draft.useCase ?? null,
      createMode: resolvedCreateMode,
      anlassraumId: resolvedAnlassraumId,
      claimId: String(claim.id),
      text: resolveProposalText(
        claim,
        selectedClaimSafety[index] ??
          evaluateCreateClaimSafety({
            claimId: claim?.id ? String(claim.id) : null,
            text: String(claim?.text ?? ""),
            locale: "de",
            sourceLanguage: "de",
            contentLanguage: "de",
          }),
      ),
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

    const response: FinalizeSuccessResponse = {
      ok: true,
      proposalIds,
      createMode: resolvedCreateMode,
      anlassraumId: resolvedAnlassraumId,
      redirectTo: buildFinalizeRedirectPath({
        draftId: body.draftId,
        dossierId: body.dossierId,
      }),
    };
    return NextResponse.json(response);
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
