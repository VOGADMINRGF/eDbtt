export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_NEXT_STEPS,
  VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_STATUSES,
  VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_TARGETS,
  VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_TYPES,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffContract";
import {
  VOXY_RENDER_PREVIEW_REVIEW_DECISION_STATUSES,
} from "@/features/create/voxyRenderPreviewReviewDecisionPersistenceContract";
import {
  VOXY_RENDER_PREVIEW_REVIEW_FLOW_STATUSES,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";
import {
  getLatestVoxyRenderPreviewOutcomeHandoffRecord,
  getVoxyRenderPreviewOutcomeHandoffPersistenceState,
  listVoxyRenderPreviewOutcomeHandoffAuditEvents,
  listVoxyRenderPreviewOutcomeHandoffRecords,
  persistVoxyRenderPreviewOutcomeHandoff,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const OutcomeRefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const HandoffPayloadSchema = z
  .object({
    reviewerComment: z.string().trim().max(3000).nullable(),
    revisionReason: z.string().trim().max(3000).nullable(),
    rejectionReason: z.string().trim().max(3000).nullable(),
    reviewReadyReason: z.string().trim().max(3000).nullable(),
    checklistSummary: z.string().trim().max(4000).nullable(),
    languageNotes: z.string().trim().max(4000).nullable(),
    claimSafetyNotes: z.string().trim().max(4000).nullable(),
    assetNotes: z.string().trim().max(4000).nullable(),
    runtimeNotes: z.string().trim().max(4000).nullable(),
    downstreamNotes: z.string().trim().max(4000).nullable(),
  })
  .strict();

const HandoffEffectsSchema = z
  .object({
    createsScriptRevisionTask: z.boolean(),
    createsAssetRevisionTask: z.boolean(),
    createsRuntimeBacklogTask: z.boolean(),
    blocksDownstream: z.boolean(),
    marksReviewReadyOnly: z.boolean(),
    pausesVideoFlow: z.boolean(),
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
    outcomeHandoffId: z.string().trim().min(1).max(200).nullable().optional(),
    previewReviewDecisionRecordId: z.string().trim().min(1).max(200).nullable().optional(),
    previewReviewFlowId: z.string().trim().min(1).max(200).nullable().optional(),
    enablementBacklogId: z.string().trim().min(1).max(200).nullable().optional(),
    matrixId: z.string().trim().min(1).max(200).nullable().optional(),
    requestDraftId: z.string().trim().min(1).max(200).nullable().optional(),
    renderDecisionId: z.string().trim().min(1).max(200).nullable().optional(),
    scriptRef: OutcomeRefSchema.nullable().optional(),
    contributionRef: OutcomeRefSchema.nullable().optional(),
    dossierRef: OutcomeRefSchema.nullable().optional(),
    reviewerRef: OutcomeRefSchema.nullable().optional(),
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
    handoffStatus: z.enum(VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_STATUSES),
    outcomeType: z.enum(VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_TYPES),
    downstreamTarget: z.enum(VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_TARGETS),
    handoffPayload: HandoffPayloadSchema,
    handoffEffects: HandoffEffectsSchema,
    executionFlags: ExecutionFlagsSchema,
    nextStep: z.enum(VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_NEXT_STEPS),
    userVisibleSummary: z.string().trim().min(1).max(4000),
    reviewerVisibleSummary: z.string().trim().min(1).max(4000),
    previewReviewDecisionTypeHint: z.enum(VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_TYPES).nullable().optional(),
    previewReviewDecisionStatusHint: z
      .enum(VOXY_RENDER_PREVIEW_REVIEW_DECISION_STATUSES)
      .nullable()
      .optional(),
    previewReviewFlowStatusHint: z
      .enum(VOXY_RENDER_PREVIEW_REVIEW_FLOW_STATUSES)
      .nullable()
      .optional(),
  })
  .strict();

function parseLimit(req: NextRequest) {
  const raw = Number(req.nextUrl.searchParams.get("limit") ?? "10");
  return Number.isFinite(raw) ? Math.max(1, Math.min(50, raw)) : 10;
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const previewReviewDecisionRecordId =
    req.nextUrl.searchParams.get("previewReviewDecisionRecordId")?.trim() || null;
  const previewReviewFlowId =
    req.nextUrl.searchParams.get("previewReviewFlowId")?.trim() || null;
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderPreviewOutcomeHandoffRecords({
      previewReviewDecisionRecordId,
      previewReviewFlowId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    previewReviewDecisionRecordId || previewReviewFlowId
      ? getLatestVoxyRenderPreviewOutcomeHandoffRecord({
          previewReviewDecisionRecordId,
          previewReviewFlowId,
        })
      : Promise.resolve(null),
    previewReviewDecisionRecordId || previewReviewFlowId
      ? listVoxyRenderPreviewOutcomeHandoffAuditEvents({
          previewReviewDecisionRecordId,
          previewReviewFlowId,
          limit,
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ok: true,
    records,
    latestRecord,
    auditEvents,
    persistence: getVoxyRenderPreviewOutcomeHandoffPersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_voxy_render_preview_outcome_handoff_command" },
      { status: 400 },
    );
  }

  const userId = gate?._id?.toHexString?.() ?? "";
  const saved = await persistVoxyRenderPreviewOutcomeHandoff({
    command: {
      outcomeHandoffId: parsed.data.outcomeHandoffId ?? null,
      previewReviewDecisionRecordId: parsed.data.previewReviewDecisionRecordId ?? null,
      previewReviewFlowId: parsed.data.previewReviewFlowId ?? null,
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
      handoffStatus: parsed.data.handoffStatus,
      outcomeType: parsed.data.outcomeType,
      downstreamTarget: parsed.data.downstreamTarget,
      handoffPayload: {
        reviewerComment: parsed.data.handoffPayload.reviewerComment,
        revisionReason: parsed.data.handoffPayload.revisionReason,
        rejectionReason: parsed.data.handoffPayload.rejectionReason,
        reviewReadyReason: parsed.data.handoffPayload.reviewReadyReason,
        checklistSummary: parsed.data.handoffPayload.checklistSummary,
        languageNotes: parsed.data.handoffPayload.languageNotes,
        claimSafetyNotes: parsed.data.handoffPayload.claimSafetyNotes,
        assetNotes: parsed.data.handoffPayload.assetNotes,
        runtimeNotes: parsed.data.handoffPayload.runtimeNotes,
        downstreamNotes: parsed.data.handoffPayload.downstreamNotes,
      },
      handoffEffects: {
        createsScriptRevisionTask: parsed.data.handoffEffects.createsScriptRevisionTask,
        createsAssetRevisionTask: parsed.data.handoffEffects.createsAssetRevisionTask,
        createsRuntimeBacklogTask: parsed.data.handoffEffects.createsRuntimeBacklogTask,
        blocksDownstream: parsed.data.handoffEffects.blocksDownstream,
        marksReviewReadyOnly: parsed.data.handoffEffects.marksReviewReadyOnly,
        pausesVideoFlow: parsed.data.handoffEffects.pausesVideoFlow,
        createsRenderJob: false,
        triggersRerender: false,
        triggersProvider: false,
        createsQueueJob: false,
        createsMediaFile: false,
        createsUpload: false,
        triggersPublish: false,
        costDebitAllowed: false,
        creditDebitAllowed: false,
        runtimeClaimAllowed: false,
      },
      executionFlags: {
        previewRendered: false,
        renderAllowed: false,
        rerenderAllowed: false,
        queueAllowed: false,
        workerAllowed: false,
        providerExecutionAllowed: false,
        secretsAccessed: false,
        mediaFileCreationAllowed: false,
        previewFileAvailable: false,
        uploadAllowed: false,
        publishAllowed: false,
        socialPostAllowed: false,
        schedulingAllowed: false,
        runtimeClaimAllowed: false,
      },
      nextStep: parsed.data.nextStep,
      userVisibleSummary: parsed.data.userVisibleSummary,
      reviewerVisibleSummary: parsed.data.reviewerVisibleSummary,
      previewReviewDecisionTypeHint: parsed.data.previewReviewDecisionTypeHint ?? null,
      previewReviewDecisionStatusHint: parsed.data.previewReviewDecisionStatusHint ?? null,
      previewReviewFlowStatusHint: parsed.data.previewReviewFlowStatusHint ?? null,
    },
  });

  const blocked = saved.result.status === "blocked";
  return NextResponse.json(
    {
      ok: !blocked,
      result: saved.result,
      auditEvent: saved.auditEvent,
      persistence: saved.persistence,
    },
    { status: blocked ? 400 : 200 },
  );
}
