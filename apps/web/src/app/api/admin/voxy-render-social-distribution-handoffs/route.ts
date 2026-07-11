export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_SOCIAL_DISTRIBUTION_COPY_STATUSES,
  VOXY_RENDER_SOCIAL_DISTRIBUTION_HANDOFF_STATUSES,
  VOXY_RENDER_SOCIAL_DISTRIBUTION_NEXT_STEPS,
  VOXY_RENDER_SOCIAL_DISTRIBUTION_PLATFORM_STATUSES,
  VOXY_RENDER_SOCIAL_DISTRIBUTION_SCHEDULE_STATUSES,
  VOXY_RENDER_SOCIAL_DISTRIBUTION_TARGETS,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";
import {
  VOXY_RENDER_PUBLISH_READINESS_GUARD_STATUSES,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
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
  appendVoxyRenderSocialDistributionAuditEvent,
  getLatestVoxyRenderSocialDistributionHandoffRecord,
  getVoxyRenderSocialDistributionPersistenceState,
  listVoxyRenderSocialDistributionAuditEvents,
  listVoxyRenderSocialDistributionHandoffRecords,
  persistVoxyRenderSocialDistributionHandoff,
} from "@/features/create/voxyRenderSocialDistributionHandoffStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const RefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const PlatformCandidateSchema = z
  .object({
    platform: z.enum(VOXY_RENDER_SOCIAL_DISTRIBUTION_TARGETS),
    label: z.string().trim().min(1).max(200),
    status: z.enum(VOXY_RENDER_SOCIAL_DISTRIBUTION_PLATFORM_STATUSES),
    platformApiCallAllowed: z.literal(false),
    uploadAllowed: z.literal(false),
    postAllowed: z.literal(false),
    scheduleAllowed: z.literal(false),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
  })
  .strict();

const CopyVariantSchema = z
  .object({
    variantId: z.string().trim().min(1).max(200),
    platform: z.enum(VOXY_RENDER_SOCIAL_DISTRIBUTION_TARGETS),
    label: z.string().trim().min(1).max(200),
    status: z.enum(VOXY_RENDER_SOCIAL_DISTRIBUTION_COPY_STATUSES),
    headline: z.string().trim().min(1).max(400).nullable(),
    body: z.string().trim().min(1).max(4000).nullable(),
    hashtags: z.array(z.string().trim().min(1).max(100)).max(20),
    cta: z.string().trim().min(1).max(400).nullable(),
    sourceCaptionRequired: z.boolean(),
    languageReviewRequired: z.boolean(),
    legalReviewRequired: z.boolean(),
    posted: z.literal(false),
    scheduled: z.literal(false),
    platformApiCallAllowed: z.literal(false),
  })
  .strict();

const ScheduleCandidateSchema = z
  .object({
    scheduleCandidateId: z.string().trim().min(1).max(200).nullable(),
    status: z.enum(VOXY_RENDER_SOCIAL_DISTRIBUTION_SCHEDULE_STATUSES),
    suggestedWindow: z.string().trim().min(1).max(400).nullable(),
    scheduled: z.literal(false),
    schedulingAllowed: z.literal(false),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
  })
  .strict();

const DistributionSemanticsSchema = z
  .object({
    publishReady: z.literal(false),
    published: z.literal(false),
    uploaded: z.literal(false),
    scheduled: z.literal(false),
    socialPosted: z.literal(false),
    platformApiCalled: z.literal(false),
    autoPublishAllowed: z.literal(false),
  })
  .strict();

const GuardEffectsSchema = z
  .object({
    blocksUpload: z.literal(true),
    blocksScheduling: z.literal(true),
    blocksSocialPosting: z.literal(true),
    blocksPublish: z.literal(true),
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
    handoffStatus: z.enum(VOXY_RENDER_SOCIAL_DISTRIBUTION_HANDOFF_STATUSES),
    platformCandidates: z.array(PlatformCandidateSchema).min(1).max(20),
    copyVariants: z.array(CopyVariantSchema).max(20),
    scheduleCandidate: ScheduleCandidateSchema,
    distributionSemantics: DistributionSemanticsSchema,
    guardEffects: GuardEffectsSchema,
    executionFlags: ExecutionFlagsSchema,
    topBlockers: z.array(z.string().trim().min(1).max(4000)).max(20),
    nextStep: z.enum(VOXY_RENDER_SOCIAL_DISTRIBUTION_NEXT_STEPS),
    userVisibleSummary: z.string().trim().min(1).max(4000),
    reviewerVisibleSummary: z.string().trim().min(1).max(4000),
    publishGuardStatusHint: z
      .enum(VOXY_RENDER_PUBLISH_READINESS_GUARD_STATUSES)
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
    listVoxyRenderSocialDistributionHandoffRecords({
      publishReadinessGuardId,
      previewOutcomeHandoffId,
      previewReviewDecisionRecordId,
      previewReviewFlowId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    publishReadinessGuardId || previewOutcomeHandoffId || previewReviewDecisionRecordId || previewReviewFlowId
      ? getLatestVoxyRenderSocialDistributionHandoffRecord({
          publishReadinessGuardId,
          previewOutcomeHandoffId,
          previewReviewDecisionRecordId,
          previewReviewFlowId,
        })
      : Promise.resolve(null),
    publishReadinessGuardId || previewOutcomeHandoffId || previewReviewDecisionRecordId || previewReviewFlowId
      ? listVoxyRenderSocialDistributionAuditEvents({
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
    persistence: getVoxyRenderSocialDistributionPersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_voxy_render_social_distribution_handoff_command" },
      { status: 400 },
    );
  }

  const userId = gate?._id?.toHexString?.() ?? "";
  const result = await persistVoxyRenderSocialDistributionHandoff({
    command: {
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
      platformCandidates: parsed.data.platformCandidates.map((candidate) => ({
        platform: candidate.platform,
        label: candidate.label,
        status: candidate.status,
        platformApiCallAllowed: false,
        uploadAllowed: false,
        postAllowed: false,
        scheduleAllowed: false,
        reviewerVisibleReason: candidate.reviewerVisibleReason,
        userVisibleReason: candidate.userVisibleReason,
      })),
      copyVariants: parsed.data.copyVariants.map((variant) => ({
        variantId: variant.variantId,
        platform: variant.platform,
        label: variant.label,
        status: variant.status,
        headline: variant.headline,
        body: variant.body,
        hashtags: variant.hashtags,
        cta: variant.cta,
        sourceCaptionRequired: variant.sourceCaptionRequired,
        languageReviewRequired: variant.languageReviewRequired,
        legalReviewRequired: variant.legalReviewRequired,
        posted: false,
        scheduled: false,
        platformApiCallAllowed: false,
      })),
      scheduleCandidate: {
        scheduleCandidateId: parsed.data.scheduleCandidate.scheduleCandidateId,
        status: parsed.data.scheduleCandidate.status,
        suggestedWindow: parsed.data.scheduleCandidate.suggestedWindow,
        scheduled: false,
        schedulingAllowed: false,
        reviewerVisibleReason: parsed.data.scheduleCandidate.reviewerVisibleReason,
        userVisibleReason: parsed.data.scheduleCandidate.userVisibleReason,
      },
      distributionSemantics: parsed.data.distributionSemantics,
      guardEffects: parsed.data.guardEffects,
      executionFlags: parsed.data.executionFlags,
      topBlockers: parsed.data.topBlockers,
      nextStep: parsed.data.nextStep,
      userVisibleSummary: parsed.data.userVisibleSummary,
      reviewerVisibleSummary: parsed.data.reviewerVisibleSummary,
      publishGuardStatusHint: parsed.data.publishGuardStatusHint ?? null,
      previewOutcomeTypeHint: parsed.data.previewOutcomeTypeHint ?? null,
      previewOutcomeStatusHint: parsed.data.previewOutcomeStatusHint ?? null,
      previewReviewDecisionTypeHint: parsed.data.previewReviewDecisionTypeHint ?? null,
      previewReviewDecisionStatusHint: parsed.data.previewReviewDecisionStatusHint ?? null,
      previewReviewFlowStatusHint: parsed.data.previewReviewFlowStatusHint ?? null,
    },
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, result }, { status: 400 });
  }

  const auditEvent = result.record
    ? await appendVoxyRenderSocialDistributionAuditEvent({
        socialDistributionHandoffId: result.record.socialDistributionHandoffId,
        publishReadinessGuardId: result.record.publishReadinessGuardId,
        previewOutcomeHandoffId: result.record.previewOutcomeHandoffId,
        previewReviewDecisionRecordId: result.record.previewReviewDecisionRecordId,
        previewReviewFlowId: result.record.previewReviewFlowId,
        byUserId: userId || null,
        handoffStatus: result.record.handoffStatus,
        nextStep: result.record.nextStep,
        summary: result.record.reviewerVisibleSummary,
        previousSocialDistributionHandoffRef: result.record.previousSocialDistributionHandoffRef,
      })
    : null;

  return NextResponse.json({
    ok: true,
    result,
    auditEvent,
    persistence: getVoxyRenderSocialDistributionPersistenceState(),
  });
}
