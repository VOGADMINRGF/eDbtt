export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_PREVIEW_REVIEW_DECISION_CHECKLIST_STATUSES,
  VOXY_RENDER_PREVIEW_REVIEW_DECISION_TYPES,
} from "@/features/create/voxyRenderPreviewReviewDecisionPersistenceContract";
import {
  VOXY_RENDER_PREVIEW_REVIEW_CHECK_KEYS,
  VOXY_RENDER_PREVIEW_REVIEW_FLOW_STATUSES,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";
import {
  getLatestVoxyRenderPreviewReviewDecisionRecord,
  getVoxyRenderPreviewReviewDecisionPersistenceState,
  listVoxyRenderPreviewReviewDecisionAuditEvents,
  listVoxyRenderPreviewReviewDecisionRecords,
  persistVoxyRenderPreviewReviewDecision,
} from "@/features/create/voxyRenderPreviewReviewDecisionPersistenceStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const DecisionRefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const ChecklistResultSchema = z
  .object({
    checkKey: z.enum(VOXY_RENDER_PREVIEW_REVIEW_CHECK_KEYS),
    status: z.enum(VOXY_RENDER_PREVIEW_REVIEW_DECISION_CHECKLIST_STATUSES),
    reviewerVisibleReason: z.string().trim().min(1).max(3000),
    userVisibleReason: z.string().trim().min(1).max(3000),
  })
  .strict();

const DecisionPayloadSchema = z
  .object({
    reviewerComment: z.string().trim().max(3000).nullable(),
    revisionReason: z.string().trim().max(3000).nullable(),
    rejectionReason: z.string().trim().max(3000).nullable(),
    reviewReadyReason: z.string().trim().max(3000).nullable(),
    checklistFindings: z.array(z.string().trim().min(1).max(500)).max(20),
    languageNotes: z.string().trim().max(3000).nullable(),
    sourceCaptionNotes: z.string().trim().max(3000).nullable(),
    claimSafetyNotes: z.string().trim().max(3000).nullable(),
    brandNotes: z.string().trim().max(3000).nullable(),
    accessibilityNotes: z.string().trim().max(3000).nullable(),
    legalSafetyNotes: z.string().trim().max(3000).nullable(),
  })
  .strict();

const DecisionEffectsSchema = z
  .object({
    createsRenderJob: z.literal(false),
    triggersRerender: z.literal(false),
    triggersProvider: z.literal(false),
    createsQueueJob: z.literal(false),
    createsMediaFile: z.literal(false),
    createsUpload: z.literal(false),
    triggersPublish: z.literal(false),
    costDebitAllowed: z.literal(false),
    creditDebitAllowed: z.literal(false),
    runtimeClaimAllowed: z.literal(false),
  })
  .strict();

const ExecutionFlagsSchema = z
  .object({
    previewRendered: z.literal(false),
    renderAllowed: z.literal(false),
    rerenderAllowed: z.literal(false),
    queueAllowed: z.literal(false),
    workerAllowed: z.literal(false),
    providerExecutionAllowed: z.literal(false),
    secretsAccessed: z.literal(false),
    mediaFileCreationAllowed: z.literal(false),
    previewFileAvailable: z.literal(false),
    uploadAllowed: z.literal(false),
    publishAllowed: z.literal(false),
    socialPostAllowed: z.literal(false),
    schedulingAllowed: z.literal(false),
    runtimeClaimAllowed: z.literal(false),
  })
  .strict();

const BodySchema = z
  .object({
    decisionRecordId: z.string().trim().min(1).max(200).nullable().optional(),
    previewReviewFlowId: z.string().trim().min(1).max(200).nullable().optional(),
    decisionGateId: z.string().trim().min(1).max(200).nullable().optional(),
    enablementBacklogId: z.string().trim().min(1).max(200).nullable().optional(),
    matrixId: z.string().trim().min(1).max(200).nullable().optional(),
    requestDraftId: z.string().trim().min(1).max(200).nullable().optional(),
    renderDecisionId: z.string().trim().min(1).max(200).nullable().optional(),
    scriptRef: DecisionRefSchema.nullable().optional(),
    contributionRef: DecisionRefSchema.nullable().optional(),
    dossierRef: DecisionRefSchema.nullable().optional(),
    reviewerRef: DecisionRefSchema.nullable().optional(),
    createdAt: z.string().trim().max(100).nullable().optional(),
    updatedAt: z.string().trim().max(100).nullable().optional(),
    sourceLanguage: z.string().trim().min(1).max(20),
    readingLanguage: z.string().trim().min(1).max(20),
    scriptLanguage: z.string().trim().min(1).max(20),
    renderLanguage: z.string().trim().min(1).max(20),
    subtitleLanguage: z.string().trim().min(1).max(20).nullable(),
    originalPreserved: z.literal(true),
    translationIsEvidence: z.literal(false),
    rtlRequired: z.boolean(),
    decisionType: z.enum(VOXY_RENDER_PREVIEW_REVIEW_DECISION_TYPES),
    decisionPayload: DecisionPayloadSchema,
    checklistResults: z.array(ChecklistResultSchema).min(1),
    decisionEffects: DecisionEffectsSchema,
    executionFlags: ExecutionFlagsSchema,
    nextStep: z.string().trim().min(1).max(1000),
    userVisibleSummary: z.string().trim().min(1).max(4000),
    reviewerVisibleSummary: z.string().trim().min(1).max(4000),
    previewReviewStatusHint: z.enum(VOXY_RENDER_PREVIEW_REVIEW_FLOW_STATUSES).nullable().optional(),
  })
  .strict();

function parseLimit(req: NextRequest) {
  const raw = Number(req.nextUrl.searchParams.get("limit") ?? "10");
  return Number.isFinite(raw) ? Math.max(1, Math.min(50, raw)) : 10;
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const previewReviewFlowId = req.nextUrl.searchParams.get("previewReviewFlowId")?.trim() || null;
  const decisionGateId = req.nextUrl.searchParams.get("decisionGateId")?.trim() || null;
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderPreviewReviewDecisionRecords({
      previewReviewFlowId,
      decisionGateId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    previewReviewFlowId || decisionGateId
      ? getLatestVoxyRenderPreviewReviewDecisionRecord({
          previewReviewFlowId,
          decisionGateId,
        })
      : Promise.resolve(null),
    previewReviewFlowId || decisionGateId
      ? listVoxyRenderPreviewReviewDecisionAuditEvents({
          previewReviewFlowId,
          decisionGateId,
          limit,
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ok: true,
    records,
    latestRecord,
    auditEvents,
    persistence: getVoxyRenderPreviewReviewDecisionPersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_voxy_render_preview_review_decision_command" },
      { status: 400 },
    );
  }

  const userId = gate?._id?.toHexString?.() ?? "";
  const saved = await persistVoxyRenderPreviewReviewDecision({
    command: {
      decisionRecordId: parsed.data.decisionRecordId ?? null,
      previewReviewFlowId: parsed.data.previewReviewFlowId ?? null,
      decisionGateId: parsed.data.decisionGateId ?? null,
      enablementBacklogId: parsed.data.enablementBacklogId ?? null,
      matrixId: parsed.data.matrixId ?? null,
      requestDraftId: parsed.data.requestDraftId ?? null,
      renderDecisionId: parsed.data.renderDecisionId ?? null,
      scriptRef: parsed.data.scriptRef ?? null,
      contributionRef: parsed.data.contributionRef ?? null,
      dossierRef: parsed.data.dossierRef ?? null,
      reviewerRef:
        parsed.data.reviewerRef ??
        (userId
          ? {
              id: userId,
              title: userId,
              href: null,
            }
          : null),
      createdAt: parsed.data.createdAt ?? null,
      updatedAt: parsed.data.updatedAt ?? null,
      sourceLanguage: parsed.data.sourceLanguage,
      readingLanguage: parsed.data.readingLanguage,
      scriptLanguage: parsed.data.scriptLanguage,
      renderLanguage: parsed.data.renderLanguage,
      subtitleLanguage: parsed.data.subtitleLanguage,
      originalPreserved: true,
      translationIsEvidence: false,
      rtlRequired: parsed.data.rtlRequired,
      decisionType: parsed.data.decisionType,
      decisionPayload: {
        reviewerComment: parsed.data.decisionPayload.reviewerComment,
        revisionReason: parsed.data.decisionPayload.revisionReason,
        rejectionReason: parsed.data.decisionPayload.rejectionReason,
        reviewReadyReason: parsed.data.decisionPayload.reviewReadyReason,
        checklistFindings: parsed.data.decisionPayload.checklistFindings,
        languageNotes: parsed.data.decisionPayload.languageNotes,
        sourceCaptionNotes: parsed.data.decisionPayload.sourceCaptionNotes,
        claimSafetyNotes: parsed.data.decisionPayload.claimSafetyNotes,
        brandNotes: parsed.data.decisionPayload.brandNotes,
        accessibilityNotes: parsed.data.decisionPayload.accessibilityNotes,
        legalSafetyNotes: parsed.data.decisionPayload.legalSafetyNotes,
      },
      checklistResults: parsed.data.checklistResults.map((item) => ({
        checkKey: item.checkKey,
        status: item.status,
        reviewerVisibleReason: item.reviewerVisibleReason,
        userVisibleReason: item.userVisibleReason,
      })),
      decisionEffects: parsed.data.decisionEffects,
      executionFlags: parsed.data.executionFlags,
      nextStep: parsed.data.nextStep,
      userVisibleSummary: parsed.data.userVisibleSummary,
      reviewerVisibleSummary: parsed.data.reviewerVisibleSummary,
      previewReviewStatusHint: parsed.data.previewReviewStatusHint ?? null,
    },
  });

  const status = saved.result.ok ? 200 : 400;
  return NextResponse.json(
    {
      ok: saved.result.ok,
      result: saved.result,
      auditEvent: saved.auditEvent,
      persistence: saved.persistence,
    },
    { status },
  );
}
