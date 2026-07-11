export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_APPROVAL_CANDIDATE_STATUSES,
  VOXY_RENDER_APPROVAL_GATE_KEYS,
  VOXY_RENDER_APPROVAL_GATE_STATUSES,
  VOXY_RENDER_APPROVAL_NEXT_STEPS,
  VOXY_RENDER_APPROVAL_SEMANTICS_STATUSES,
} from "@/features/create/voxyRenderApprovalSemanticsContract";
import {
  VOXY_RENDER_PUBLISH_READINESS_GUARD_STATUSES,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import {
  VOXY_RENDER_SOCIAL_DISTRIBUTION_HANDOFF_STATUSES,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";
import {
  VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_STATUSES,
  VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_TYPES,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffContract";
import {
  VOXY_RENDER_PREVIEW_REVIEW_DECISION_STATUSES,
  VOXY_RENDER_PREVIEW_REVIEW_DECISION_TYPES,
} from "@/features/create/voxyRenderPreviewReviewDecisionPersistenceContract";
import {
  VOXY_RENDER_PREVIEW_REVIEW_FLOW_STATUSES,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";
import {
  appendVoxyRenderApprovalAuditEvent,
  getLatestVoxyRenderApprovalSemanticsRecord,
  getVoxyRenderApprovalPersistenceState,
  listVoxyRenderApprovalAuditEvents,
  listVoxyRenderApprovalSemanticsRecords,
  persistVoxyRenderApprovalSemantics,
} from "@/features/create/voxyRenderApprovalSemanticsStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const RefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const CandidateSchema = z
  .object({
    approvalCandidateId: z.string().trim().min(1).max(200).nullable(),
    status: z.enum(VOXY_RENDER_APPROVAL_CANDIDATE_STATUSES),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
    approvalAllowed: z.literal(false),
    approved: z.literal(false),
  })
  .strict();

const GateSchema = z
  .object({
    gateKey: z.enum(VOXY_RENDER_APPROVAL_GATE_KEYS),
    label: z.string().trim().min(1).max(200),
    status: z.enum(VOXY_RENDER_APPROVAL_GATE_STATUSES),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
    nextAction: z.enum(VOXY_RENDER_APPROVAL_NEXT_STEPS),
    executionAllowed: z.literal(false),
  })
  .strict();

const ApprovalSemanticsSchema = z
  .object({
    reviewReady: z.boolean(),
    publishReady: z.literal(false),
    approvalCandidate: z.boolean(),
    approved: z.literal(false),
    uploaded: z.literal(false),
    scheduled: z.literal(false),
    socialPosted: z.literal(false),
    published: z.literal(false),
    autoPublishAllowed: z.literal(false),
  })
  .strict();

const ApprovalEffectsSchema = z
  .object({
    marksApproved: z.literal(false),
    createsUpload: z.literal(false),
    createsSchedule: z.literal(false),
    createsSocialPost: z.literal(false),
    triggersPublish: z.literal(false),
    createsRenderJob: z.literal(false),
    triggersRerender: z.literal(false),
    triggersProvider: z.literal(false),
    createsQueueJob: z.literal(false),
    createsMediaFile: z.literal(false),
    costDebitAllowed: z.literal(false),
    creditDebitAllowed: z.literal(false),
    runtimeClaimAllowed: z.literal(false),
  })
  .strict();

const ExecutionFlagsSchema = z
  .object({
    approvalExecutionAllowed: z.literal(false),
    publishAllowed: z.literal(false),
    uploadAllowed: z.literal(false),
    schedulingAllowed: z.literal(false),
    socialPostAllowed: z.literal(false),
    autoPublishAllowed: z.literal(false),
    platformApiCallAllowed: z.literal(false),
    previewRendered: z.literal(false),
    renderAllowed: z.literal(false),
    rerenderAllowed: z.literal(false),
    queueAllowed: z.literal(false),
    workerAllowed: z.literal(false),
    providerExecutionAllowed: z.literal(false),
    secretsAccessed: z.literal(false),
    mediaFileCreationAllowed: z.literal(false),
    previewFileAvailable: z.literal(false),
    costDebitAllowed: z.literal(false),
    creditDebitAllowed: z.literal(false),
    runtimeClaimAllowed: z.literal(false),
  })
  .strict();

const BodySchema = z
  .object({
    approvalSemanticsId: z.string().trim().min(1).max(200).nullable().optional(),
    socialDistributionHandoffId: z.string().trim().min(1).max(200).nullable().optional(),
    publishReadinessGuardId: z.string().trim().min(1).max(200).nullable().optional(),
    previewOutcomeHandoffId: z.string().trim().min(1).max(200).nullable().optional(),
    previewReviewDecisionRecordId: z.string().trim().min(1).max(200).nullable().optional(),
    previewReviewFlowId: z.string().trim().min(1).max(200).nullable().optional(),
    enablementBacklogId: z.string().trim().min(1).max(200).nullable().optional(),
    matrixId: z.string().trim().min(1).max(200).nullable().optional(),
    requestDraftId: z.string().trim().min(1).max(200).nullable().optional(),
    scriptRef: RefSchema.nullable().optional(),
    contributionRef: RefSchema.nullable().optional(),
    dossierRef: RefSchema.nullable().optional(),
    reviewerRef: RefSchema.nullable().optional(),
    approverRef: RefSchema.nullable().optional(),
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
    approvalStatus: z.enum(VOXY_RENDER_APPROVAL_SEMANTICS_STATUSES),
    approvalCandidate: CandidateSchema,
    humanApprovalGate: GateSchema,
    legalSafetyGate: GateSchema,
    sourceCaptionGate: GateSchema,
    claimSafetyGate: GateSchema,
    languageGate: GateSchema,
    accessibilityGate: GateSchema,
    mediaGate: GateSchema,
    publishGuardGate: GateSchema,
    distributionGuardGate: GateSchema,
    runtimeGate: GateSchema,
    approvalSemantics: ApprovalSemanticsSchema,
    approvalEffects: ApprovalEffectsSchema,
    executionFlags: ExecutionFlagsSchema,
    topBlockers: z.array(z.string().trim().min(1).max(4000)).max(20),
    nextStep: z.enum(VOXY_RENDER_APPROVAL_NEXT_STEPS),
    userVisibleSummary: z.string().trim().min(1).max(4000),
    reviewerVisibleSummary: z.string().trim().min(1).max(4000),
    publishGuardStatusHint: z
      .enum(VOXY_RENDER_PUBLISH_READINESS_GUARD_STATUSES)
      .nullable()
      .optional(),
    socialDistributionStatusHint: z
      .enum(VOXY_RENDER_SOCIAL_DISTRIBUTION_HANDOFF_STATUSES)
      .nullable()
      .optional(),
    previewOutcomeTypeHint: z.enum(VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_TYPES).nullable().optional(),
    previewOutcomeStatusHint: z
      .enum(VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_STATUSES)
      .nullable()
      .optional(),
    previewReviewDecisionTypeHint: z
      .enum(VOXY_RENDER_PREVIEW_REVIEW_DECISION_TYPES)
      .nullable()
      .optional(),
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

  const socialDistributionHandoffId =
    req.nextUrl.searchParams.get("socialDistributionHandoffId")?.trim() || null;
  const publishReadinessGuardId =
    req.nextUrl.searchParams.get("publishReadinessGuardId")?.trim() || null;
  const previewOutcomeHandoffId =
    req.nextUrl.searchParams.get("previewOutcomeHandoffId")?.trim() || null;
  const previewReviewDecisionRecordId =
    req.nextUrl.searchParams.get("previewReviewDecisionRecordId")?.trim() || null;
  const previewReviewFlowId =
    req.nextUrl.searchParams.get("previewReviewFlowId")?.trim() || null;
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderApprovalSemanticsRecords({
      socialDistributionHandoffId,
      publishReadinessGuardId,
      previewOutcomeHandoffId,
      previewReviewDecisionRecordId,
      previewReviewFlowId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    socialDistributionHandoffId ||
    publishReadinessGuardId ||
    previewOutcomeHandoffId ||
    previewReviewDecisionRecordId ||
    previewReviewFlowId
      ? getLatestVoxyRenderApprovalSemanticsRecord({
          socialDistributionHandoffId,
          publishReadinessGuardId,
          previewOutcomeHandoffId,
          previewReviewDecisionRecordId,
          previewReviewFlowId,
        })
      : Promise.resolve(null),
    socialDistributionHandoffId ||
    publishReadinessGuardId ||
    previewOutcomeHandoffId ||
    previewReviewDecisionRecordId ||
    previewReviewFlowId
      ? listVoxyRenderApprovalAuditEvents({
          socialDistributionHandoffId,
          publishReadinessGuardId,
          previewOutcomeHandoffId,
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
    persistence: getVoxyRenderApprovalPersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_voxy_render_approval_semantics_command" },
      { status: 400 },
    );
  }

  const userId = gate?._id?.toHexString?.() ?? "";
  const result = await persistVoxyRenderApprovalSemantics({
    command: {
      approvalSemanticsId: parsed.data.approvalSemanticsId ?? null,
      socialDistributionHandoffId: parsed.data.socialDistributionHandoffId ?? null,
      publishReadinessGuardId: parsed.data.publishReadinessGuardId ?? null,
      previewOutcomeHandoffId: parsed.data.previewOutcomeHandoffId ?? null,
      previewReviewDecisionRecordId: parsed.data.previewReviewDecisionRecordId ?? null,
      previewReviewFlowId: parsed.data.previewReviewFlowId ?? null,
      enablementBacklogId: parsed.data.enablementBacklogId ?? null,
      matrixId: parsed.data.matrixId ?? null,
      requestDraftId: parsed.data.requestDraftId ?? null,
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
      approverRef: parsed.data.approverRef ?? null,
      createdAt: parsed.data.createdAt ?? null,
      updatedAt: parsed.data.updatedAt ?? null,
      sourceLanguage: parsed.data.sourceLanguage,
      readingLanguage: parsed.data.readingLanguage,
      scriptLanguage: parsed.data.scriptLanguage,
      renderLanguage: parsed.data.renderLanguage,
      subtitleLanguage: parsed.data.subtitleLanguage ?? null,
      originalPreserved: true,
      translationIsEvidence: false,
      rtlRequired: parsed.data.rtlRequired,
      approvalStatus: parsed.data.approvalStatus,
      approvalCandidate: {
        approvalCandidateId: parsed.data.approvalCandidate.approvalCandidateId ?? null,
        status: parsed.data.approvalCandidate.status,
        reviewerVisibleReason: parsed.data.approvalCandidate.reviewerVisibleReason,
        userVisibleReason: parsed.data.approvalCandidate.userVisibleReason,
        approvalAllowed: false,
        approved: false,
      },
      humanApprovalGate: parsed.data.humanApprovalGate,
      legalSafetyGate: parsed.data.legalSafetyGate,
      sourceCaptionGate: parsed.data.sourceCaptionGate,
      claimSafetyGate: parsed.data.claimSafetyGate,
      languageGate: parsed.data.languageGate,
      accessibilityGate: parsed.data.accessibilityGate,
      mediaGate: parsed.data.mediaGate,
      publishGuardGate: parsed.data.publishGuardGate,
      distributionGuardGate: parsed.data.distributionGuardGate,
      runtimeGate: parsed.data.runtimeGate,
      approvalSemantics: parsed.data.approvalSemantics,
      approvalEffects: parsed.data.approvalEffects,
      executionFlags: parsed.data.executionFlags,
      topBlockers: parsed.data.topBlockers,
      nextStep: parsed.data.nextStep,
      userVisibleSummary: parsed.data.userVisibleSummary,
      reviewerVisibleSummary: parsed.data.reviewerVisibleSummary,
      publishGuardStatusHint: parsed.data.publishGuardStatusHint ?? null,
      socialDistributionStatusHint: parsed.data.socialDistributionStatusHint ?? null,
      previewOutcomeTypeHint: parsed.data.previewOutcomeTypeHint ?? null,
      previewOutcomeStatusHint: parsed.data.previewOutcomeStatusHint ?? null,
      previewReviewDecisionTypeHint: parsed.data.previewReviewDecisionTypeHint ?? null,
      previewReviewDecisionStatusHint: parsed.data.previewReviewDecisionStatusHint ?? null,
      previewReviewFlowStatusHint: parsed.data.previewReviewFlowStatusHint ?? null,
    },
  });

  if (!result.ok || !result.record) {
    return NextResponse.json({ ok: false, result }, { status: 400 });
  }

  const auditEvent = await appendVoxyRenderApprovalAuditEvent({
    record: result.record,
    byUserId: userId || null,
  });

  return NextResponse.json({
    ok: true,
    result,
    auditEvent,
    persistence: getVoxyRenderApprovalPersistenceState(),
  });
}
