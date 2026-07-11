export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_PREVIEW_CANDIDATE_STATUSES,
  VOXY_RENDER_PREVIEW_REVIEW_ACTION_KEYS,
  VOXY_RENDER_PREVIEW_REVIEW_CHECK_KEYS,
  VOXY_RENDER_PREVIEW_REVIEW_CHECK_STATUSES,
  VOXY_RENDER_PREVIEW_REVIEW_NEXT_ACTIONS,
  VOXY_RENDER_PREVIEW_REVIEW_OVERALL_DECISIONS,
  VOXY_RENDER_PREVIEW_REVIEW_FLOW_STATUSES,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";
import {
  getLatestVoxyRenderPreviewReviewFlowRecord,
  getVoxyRenderPreviewReviewFlowPersistenceState,
  listVoxyRenderPreviewReviewFlowAuditEvents,
  listVoxyRenderPreviewReviewFlowRecords,
  persistVoxyRenderPreviewReviewFlow,
} from "@/features/create/voxyRenderPreviewReviewFlowStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const RequestRefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const PreviewCandidateSchema = z
  .object({
    previewCandidateId: z.string().trim().min(1).max(200).nullable(),
    status: z.enum(VOXY_RENDER_PREVIEW_CANDIDATE_STATUSES),
    mediaUrl: z.string().trim().min(1).max(500).nullable(),
    thumbnailUrl: z.string().trim().min(1).max(500).nullable(),
    durationSeconds: z.number().finite().positive().nullable(),
    generated: z.literal(false),
    rendered: z.literal(false),
    uploaded: z.literal(false),
    playable: z.literal(false),
    reviewerVisibleReason: z.string().trim().min(1).max(3000),
    userVisibleReason: z.string().trim().min(1).max(3000),
  })
  .strict();

const ReviewActionSchema = z
  .object({
    actionKey: z.enum(VOXY_RENDER_PREVIEW_REVIEW_ACTION_KEYS),
    allowed: z.boolean(),
    executionAllowed: z.literal(false),
    createsRenderJob: z.literal(false),
    triggersProvider: z.literal(false),
    triggersPublish: z.literal(false),
    userVisibleLabel: z.string().trim().min(1).max(300),
    reviewerVisibleReason: z.string().trim().min(1).max(3000),
  })
  .strict();

const ChecklistItemSchema = z
  .object({
    checkKey: z.enum(VOXY_RENDER_PREVIEW_REVIEW_CHECK_KEYS),
    status: z.enum(VOXY_RENDER_PREVIEW_REVIEW_CHECK_STATUSES),
    reviewerVisibleReason: z.string().trim().min(1).max(3000),
    userVisibleReason: z.string().trim().min(1).max(3000),
  })
  .strict();

const ExecutionSchema = z
  .object({
    previewRendered: z.literal(false),
    renderAllowed: z.literal(false),
    queueAllowed: z.literal(false),
    workerAllowed: z.literal(false),
    providerExecutionAllowed: z.literal(false),
    secretsAccessed: z.literal(false),
    mediaFileCreationAllowed: z.literal(false),
    previewFileAvailable: z.literal(false),
    costDebitAllowed: z.literal(false),
    creditDebitAllowed: z.literal(false),
    uploadAllowed: z.literal(false),
    publishAllowed: z.literal(false),
    socialPostAllowed: z.literal(false),
    schedulingAllowed: z.literal(false),
    runtimeClaimAllowed: z.literal(false),
  })
  .strict();

const BodySchema = z
  .object({
    previewReviewFlowId: z.string().trim().min(1).max(200),
    enablementBacklogId: z.string().trim().min(1).max(200).nullable(),
    matrixId: z.string().trim().min(1).max(200).nullable(),
    providerSelectionDraftId: z.string().trim().min(1).max(200).nullable(),
    assetPackDraftId: z.string().trim().min(1).max(200).nullable(),
    costPolicyPreviewId: z.string().trim().min(1).max(200).nullable(),
    queuePreviewId: z.string().trim().min(1).max(200).nullable(),
    requestDraftId: z.string().trim().min(1).max(200).nullable(),
    decisionId: z.string().trim().min(1).max(200).nullable(),
    decisionGateId: z.string().trim().min(1).max(200).nullable(),
    scriptRef: RequestRefSchema.nullable(),
    contributionRef: RequestRefSchema.nullable(),
    dossierRef: RequestRefSchema.nullable(),
    videoFormat: z.literal("briefing_video"),
    sourceLanguage: z.string().trim().min(1).max(20),
    readingLanguage: z.string().trim().min(1).max(20),
    scriptLanguage: z.string().trim().min(1).max(20),
    renderLanguage: z.string().trim().min(1).max(20),
    subtitleLanguage: z.string().trim().min(1).max(20).nullable(),
    originalPreserved: z.literal(true),
    translationIsEvidence: z.literal(false),
    rtlRequired: z.boolean(),
    surface: z.enum(["create", "account", "admin", "workspace"]),
    previewStatus: z.enum(VOXY_RENDER_PREVIEW_REVIEW_FLOW_STATUSES),
    previewCandidate: PreviewCandidateSchema,
    reviewActions: z.array(ReviewActionSchema),
    reviewChecklist: z.array(ChecklistItemSchema),
    overallDecision: z.enum(VOXY_RENDER_PREVIEW_REVIEW_OVERALL_DECISIONS),
    topBlockers: z.array(z.string().trim().min(1).max(500)),
    nextRecommendedAction: z.enum(VOXY_RENDER_PREVIEW_REVIEW_NEXT_ACTIONS),
    reviewerVisibleSummary: z.string().trim().min(1).max(4000),
    userVisibleSummary: z.string().trim().min(1).max(4000),
    nextStep: z.string().trim().min(1).max(1000),
    execution: ExecutionSchema,
    createdBy: z.string().trim().max(200).nullable().optional(),
    createdAt: z.string().trim().max(100).nullable().optional(),
  })
  .strict();

function parseLimit(req: NextRequest) {
  const raw = Number(req.nextUrl.searchParams.get("limit") ?? "10");
  return Number.isFinite(raw) ? Math.max(1, Math.min(50, raw)) : 10;
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const decisionGateId = req.nextUrl.searchParams.get("decisionGateId")?.trim() || null;
  const decisionId = req.nextUrl.searchParams.get("decisionId")?.trim() || null;
  const enablementBacklogId =
    req.nextUrl.searchParams.get("enablementBacklogId")?.trim() || null;
  const matrixId = req.nextUrl.searchParams.get("matrixId")?.trim() || null;
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderPreviewReviewFlowRecords({
      decisionGateId,
      decisionId,
      enablementBacklogId,
      matrixId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    decisionGateId
      ? getLatestVoxyRenderPreviewReviewFlowRecord(decisionGateId)
      : Promise.resolve(null),
    decisionGateId
      ? listVoxyRenderPreviewReviewFlowAuditEvents({ decisionGateId, decisionId, limit })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ok: true,
    records,
    latestRecord,
    auditEvents,
    persistence: getVoxyRenderPreviewReviewFlowPersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_voxy_render_preview_review_flow_command" },
      { status: 400 },
    );
  }

  const userId = gate?._id?.toHexString?.() ?? "";
  const saved = await persistVoxyRenderPreviewReviewFlow({
    command: {
      previewReviewFlowId: parsed.data.previewReviewFlowId,
      enablementBacklogId: parsed.data.enablementBacklogId ?? null,
      matrixId: parsed.data.matrixId ?? null,
      providerSelectionDraftId: parsed.data.providerSelectionDraftId ?? null,
      assetPackDraftId: parsed.data.assetPackDraftId ?? null,
      costPolicyPreviewId: parsed.data.costPolicyPreviewId ?? null,
      queuePreviewId: parsed.data.queuePreviewId ?? null,
      requestDraftId: parsed.data.requestDraftId ?? null,
      decisionId: parsed.data.decisionId ?? null,
      decisionGateId: parsed.data.decisionGateId ?? null,
      scriptRef: parsed.data.scriptRef,
      contributionRef: parsed.data.contributionRef,
      dossierRef: parsed.data.dossierRef,
      videoFormat: parsed.data.videoFormat,
      sourceLanguage: parsed.data.sourceLanguage,
      readingLanguage: parsed.data.readingLanguage,
      scriptLanguage: parsed.data.scriptLanguage,
      renderLanguage: parsed.data.renderLanguage,
      subtitleLanguage: parsed.data.subtitleLanguage ?? null,
      originalPreserved: true,
      translationIsEvidence: false,
      rtlRequired: parsed.data.rtlRequired,
      surface: parsed.data.surface,
      previewStatus: parsed.data.previewStatus,
      previewCandidate: {
        previewCandidateId: parsed.data.previewCandidate.previewCandidateId ?? null,
        status: parsed.data.previewCandidate.status,
        mediaUrl: parsed.data.previewCandidate.mediaUrl ?? null,
        thumbnailUrl: parsed.data.previewCandidate.thumbnailUrl ?? null,
        durationSeconds: parsed.data.previewCandidate.durationSeconds ?? null,
        generated: false,
        rendered: false,
        uploaded: false,
        playable: false,
        reviewerVisibleReason: parsed.data.previewCandidate.reviewerVisibleReason,
        userVisibleReason: parsed.data.previewCandidate.userVisibleReason,
      },
      reviewActions: parsed.data.reviewActions.map((action) => ({
        actionKey: action.actionKey,
        allowed: action.allowed,
        executionAllowed: false,
        createsRenderJob: false,
        triggersProvider: false,
        triggersPublish: false,
        userVisibleLabel: action.userVisibleLabel,
        reviewerVisibleReason: action.reviewerVisibleReason,
      })),
      reviewChecklist: parsed.data.reviewChecklist.map((item) => ({
        checkKey: item.checkKey,
        status: item.status,
        reviewerVisibleReason: item.reviewerVisibleReason,
        userVisibleReason: item.userVisibleReason,
      })),
      overallDecision: parsed.data.overallDecision,
      topBlockers: parsed.data.topBlockers,
      nextRecommendedAction: parsed.data.nextRecommendedAction,
      reviewerVisibleSummary: parsed.data.reviewerVisibleSummary,
      userVisibleSummary: parsed.data.userVisibleSummary,
      nextStep: parsed.data.nextStep,
      execution: parsed.data.execution,
      createdBy: parsed.data.createdBy ?? userId,
      createdAt: parsed.data.createdAt ?? new Date().toISOString(),
    },
  });

  return NextResponse.json({
    ok: true,
    result: saved.result,
    auditEvent: saved.auditEvent,
    persistence: saved.persistence,
  });
}
