export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_CALENDAR_HINT_STATUSES,
  VOXY_RENDER_PUBLISH_WINDOW_STATUSES,
  VOXY_RENDER_SCHEDULE_CANDIDATE_STATUSES,
  VOXY_RENDER_SCHEDULING_POLICY_NEXT_STEPS,
  VOXY_RENDER_SCHEDULING_POLICY_STATUSES,
  type VoxyRenderSchedulingPolicyCommand,
} from "@/features/create/voxyRenderSchedulingPolicyContract";
import { VOXY_RENDER_UPLOAD_TARGET_POLICY_STATUSES } from "@/features/create/voxyRenderUploadTargetPolicyContract";
import { VOXY_RENDER_MEDIA_STORAGE_TRUTH_STATUSES } from "@/features/create/voxyRenderMediaStorageTruthContract";
import { VOXY_RENDER_APPROVAL_SEMANTICS_STATUSES } from "@/features/create/voxyRenderApprovalSemanticsContract";
import { VOXY_RENDER_PUBLISH_READINESS_GUARD_STATUSES } from "@/features/create/voxyRenderPublishReadinessGuardContract";
import { VOXY_RENDER_SOCIAL_DISTRIBUTION_HANDOFF_STATUSES } from "@/features/create/voxyRenderSocialDistributionHandoffContract";
import { VOXY_RENDER_PREVIEW_REVIEW_FLOW_STATUSES } from "@/features/create/voxyRenderPreviewReviewFlowContract";
import {
  appendVoxyRenderSchedulingPolicyAuditEvent,
  getLatestVoxyRenderSchedulingPolicyRecord,
  getVoxyRenderSchedulingPolicyPersistenceState,
  listVoxyRenderSchedulingPolicyAuditEvents,
  listVoxyRenderSchedulingPolicyRecords,
  persistVoxyRenderSchedulingPolicy,
} from "@/features/create/voxyRenderSchedulingPolicyStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const RefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const ScheduleCandidateSchema = z
  .object({
    scheduleCandidateId: z.string().trim().min(1).max(200).nullable(),
    status: z.enum(VOXY_RENDER_SCHEDULE_CANDIDATE_STATUSES),
    suggestedWindow: z.null(),
    timezone: z.null(),
    platform: z.string().trim().min(1).max(200).nullable(),
    scheduledAt: z.null(),
    scheduled: z.literal(false),
    schedulingAllowed: z.literal(false),
    schedulerJobCreated: z.literal(false),
    calendarEventCreated: z.literal(false),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
  })
  .strict();

const PublishWindowSchema = z
  .object({
    publishWindowId: z.string().trim().min(1).max(200).nullable(),
    status: z.enum(VOXY_RENDER_PUBLISH_WINDOW_STATUSES),
    earliestPublishAt: z.null(),
    latestPublishAt: z.null(),
    timezonePolicyNeeded: z.boolean(),
    platformTimingPolicyNeeded: z.boolean(),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
  })
  .strict();

const CalendarHintSchema = z
  .object({
    calendarHintId: z.string().trim().min(1).max(200).nullable(),
    status: z.enum(VOXY_RENDER_CALENDAR_HINT_STATUSES),
    calendarEventCreated: z.literal(false),
    calendarWriteAllowed: z.literal(false),
    reminderCreated: z.literal(false),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
  })
  .strict();

const SchedulingSemanticsSchema = z
  .object({
    scheduleCandidate: z.boolean(),
    scheduled: z.literal(false),
    schedulerJobCreated: z.literal(false),
    calendarEventCreated: z.literal(false),
    postedAtAvailable: z.literal(false),
    distributionTimeFinal: z.literal(false),
    uploadReady: z.literal(false),
    published: z.literal(false),
    socialPosted: z.literal(false),
  })
  .strict();

const ExecutionFlagsSchema = z
  .object({
    schedulingAllowed: z.literal(false),
    schedulerJobAllowed: z.literal(false),
    calendarWriteAllowed: z.literal(false),
    reminderAllowed: z.literal(false),
    publishAllowed: z.literal(false),
    uploadAllowed: z.literal(false),
    storageWriteAllowed: z.literal(false),
    socialPostAllowed: z.literal(false),
    autoPublishAllowed: z.literal(false),
    createsMediaFile: z.literal(false),
    previewRendered: z.literal(false),
    renderAllowed: z.literal(false),
    rerenderAllowed: z.literal(false),
    queueAllowed: z.literal(false),
    workerAllowed: z.literal(false),
    providerExecutionAllowed: z.literal(false),
    secretsAccessed: z.literal(false),
    costDebitAllowed: z.literal(false),
    creditDebitAllowed: z.literal(false),
    runtimeClaimAllowed: z.literal(false),
  })
  .strict();

const BodySchema = z
  .object({
    schedulingPolicyId: z.string().trim().min(1).max(200).nullable().optional(),
    uploadTargetPolicyId: z.string().trim().min(1).max(200).nullable().optional(),
    mediaStorageTruthId: z.string().trim().min(1).max(200).nullable().optional(),
    approvalSemanticsId: z.string().trim().min(1).max(200).nullable().optional(),
    socialDistributionHandoffId: z.string().trim().min(1).max(200).nullable().optional(),
    publishReadinessGuardId: z.string().trim().min(1).max(200).nullable().optional(),
    previewOutcomeHandoffId: z.string().trim().min(1).max(200).nullable().optional(),
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
    schedulingPolicyStatus: z.enum(VOXY_RENDER_SCHEDULING_POLICY_STATUSES),
    scheduleCandidate: ScheduleCandidateSchema,
    publishWindow: PublishWindowSchema,
    calendarHint: CalendarHintSchema,
    schedulingSemantics: SchedulingSemanticsSchema,
    executionFlags: ExecutionFlagsSchema,
    topBlockers: z.array(z.string().trim().min(1).max(4000)).max(20),
    nextStep: z.enum(VOXY_RENDER_SCHEDULING_POLICY_NEXT_STEPS),
    userVisibleSummary: z.string().trim().min(1).max(4000),
    reviewerVisibleSummary: z.string().trim().min(1).max(4000),
    uploadTargetPolicyStatusHint: z
      .enum(VOXY_RENDER_UPLOAD_TARGET_POLICY_STATUSES)
      .nullable()
      .optional(),
    mediaStorageTruthStatusHint: z
      .enum(VOXY_RENDER_MEDIA_STORAGE_TRUTH_STATUSES)
      .nullable()
      .optional(),
    approvalStatusHint: z.enum(VOXY_RENDER_APPROVAL_SEMANTICS_STATUSES).nullable().optional(),
    publishReadinessGuardStatusHint: z
      .enum(VOXY_RENDER_PUBLISH_READINESS_GUARD_STATUSES)
      .nullable()
      .optional(),
    socialDistributionHandoffStatusHint: z
      .enum(VOXY_RENDER_SOCIAL_DISTRIBUTION_HANDOFF_STATUSES)
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

  const uploadTargetPolicyId =
    req.nextUrl.searchParams.get("uploadTargetPolicyId")?.trim() || null;
  const approvalSemanticsId =
    req.nextUrl.searchParams.get("approvalSemanticsId")?.trim() || null;
  const previewReviewFlowId =
    req.nextUrl.searchParams.get("previewReviewFlowId")?.trim() || null;
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderSchedulingPolicyRecords({
      uploadTargetPolicyId,
      approvalSemanticsId,
      previewReviewFlowId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    uploadTargetPolicyId || previewReviewFlowId
      ? getLatestVoxyRenderSchedulingPolicyRecord({
          uploadTargetPolicyId,
          previewReviewFlowId,
        })
      : Promise.resolve(null),
    uploadTargetPolicyId || previewReviewFlowId
      ? listVoxyRenderSchedulingPolicyAuditEvents({
          uploadTargetPolicyId,
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
    persistence: getVoxyRenderSchedulingPolicyPersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;
  const userId = gate._id?.toHexString?.() ?? null;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const command = parsed.data as VoxyRenderSchedulingPolicyCommand;
  const result = await persistVoxyRenderSchedulingPolicy({ command });
  if (!result.ok || !result.record) {
    return NextResponse.json(
      {
        ok: false,
        result,
        persistence: getVoxyRenderSchedulingPolicyPersistenceState(),
      },
      { status: 400 },
    );
  }

  const auditEvent = await appendVoxyRenderSchedulingPolicyAuditEvent({
    record: result.record,
    byUserId: userId,
  });

  return NextResponse.json({
    ok: true,
    result,
    auditEvent,
    persistence: getVoxyRenderSchedulingPolicyPersistenceState(),
  });
}
