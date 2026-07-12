export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_UPLOAD_ACCESS_VISIBILITIES,
  VOXY_RENDER_UPLOAD_POLICY_CANDIDATE_STATUSES,
  VOXY_RENDER_UPLOAD_TARGET_CANDIDATE_STATUSES,
  VOXY_RENDER_UPLOAD_TARGET_POLICY_NEXT_STEPS,
  VOXY_RENDER_UPLOAD_TARGET_POLICY_STATUSES,
  VOXY_RENDER_UPLOAD_TARGET_PROVIDERS,
  type VoxyRenderUploadTargetPolicyCommand,
} from "@/features/create/voxyRenderUploadTargetPolicyContract";
import {
  VOXY_RENDER_MEDIA_STORAGE_TRUTH_STATUSES,
} from "@/features/create/voxyRenderMediaStorageTruthContract";
import {
  VOXY_RENDER_APPROVAL_SEMANTICS_STATUSES,
} from "@/features/create/voxyRenderApprovalSemanticsContract";
import {
  VOXY_RENDER_PUBLISH_READINESS_GUARD_STATUSES,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import {
  VOXY_RENDER_SOCIAL_DISTRIBUTION_HANDOFF_STATUSES,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";
import {
  VOXY_RENDER_PREVIEW_REVIEW_FLOW_STATUSES,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";
import {
  appendVoxyRenderUploadTargetPolicyAuditEvent,
  getLatestVoxyRenderUploadTargetPolicyRecord,
  getVoxyRenderUploadTargetPolicyPersistenceState,
  listVoxyRenderUploadTargetPolicyAuditEvents,
  listVoxyRenderUploadTargetPolicyRecords,
  persistVoxyRenderUploadTargetPolicy,
} from "@/features/create/voxyRenderUploadTargetPolicyStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const RefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const UploadTargetCandidateSchema = z
  .object({
    uploadTargetCandidateId: z.string().trim().min(1).max(200).nullable(),
    status: z.enum(VOXY_RENDER_UPLOAD_TARGET_CANDIDATE_STATUSES),
    provider: z.enum(VOXY_RENDER_UPLOAD_TARGET_PROVIDERS),
    bucketOrContainer: z.string().trim().min(1).max(500).nullable(),
    basePath: z.string().trim().min(1).max(2000).nullable(),
    publicBaseUrl: z.string().trim().min(1).max(2000).nullable(),
    writeAllowed: z.literal(false),
    uploadAllowed: z.literal(false),
    publicAccessAllowed: z.literal(false),
    signedAccessAllowed: z.literal(false),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
  })
  .strict();

const AccessPolicySchema = z
  .object({
    accessPolicyId: z.string().trim().min(1).max(200).nullable(),
    visibility: z.enum(VOXY_RENDER_UPLOAD_ACCESS_VISIBILITIES),
    signedAccessCandidate: z.boolean(),
    signedUrlCreated: z.literal(false),
    publicUrlCreated: z.literal(false),
    downloadAllowed: z.literal(false),
    shareAllowed: z.literal(false),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
  })
  .strict();

const RetentionPolicySchema = z
  .object({
    retentionPolicyId: z.string().trim().min(1).max(200).nullable(),
    status: z.enum(VOXY_RENDER_UPLOAD_POLICY_CANDIDATE_STATUSES),
    retentionDays: z.number().int().positive().nullable(),
    deletionJobCreated: z.literal(false),
    deletionAllowed: z.literal(false),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
  })
  .strict();

const DeletionPolicySchema = z
  .object({
    deletionPolicyId: z.string().trim().min(1).max(200).nullable(),
    status: z.enum(VOXY_RENDER_UPLOAD_POLICY_CANDIDATE_STATUSES),
    deletionJobCreated: z.literal(false),
    deletionAllowed: z.literal(false),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
  })
  .strict();

const UploadSemanticsSchema = z
  .object({
    uploadCandidate: z.boolean(),
    uploadReady: z.literal(false),
    uploaded: z.literal(false),
    storageWriteAllowed: z.literal(false),
    signedUrlAvailable: z.literal(false),
    publicUrlAvailable: z.literal(false),
    mediaFileAvailable: z.literal(false),
    previewFileAvailable: z.literal(false),
    published: z.literal(false),
    socialPosted: z.literal(false),
    scheduled: z.literal(false),
  })
  .strict();

const ExecutionFlagsSchema = z
  .object({
    uploadAllowed: z.literal(false),
    storageWriteAllowed: z.literal(false),
    signedUrlCreationAllowed: z.literal(false),
    publicUrlCreationAllowed: z.literal(false),
    deletionJobAllowed: z.literal(false),
    publishAllowed: z.literal(false),
    schedulingAllowed: z.literal(false),
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
    uploadTargetPolicyStatus: z.enum(VOXY_RENDER_UPLOAD_TARGET_POLICY_STATUSES),
    uploadTargetCandidate: UploadTargetCandidateSchema,
    accessPolicy: AccessPolicySchema,
    signedAccessPolicyDefined: z.boolean(),
    retentionPolicy: RetentionPolicySchema,
    deletionPolicy: DeletionPolicySchema,
    uploadSemantics: UploadSemanticsSchema,
    executionFlags: ExecutionFlagsSchema,
    topBlockers: z.array(z.string().trim().min(1).max(4000)).max(20),
    nextStep: z.enum(VOXY_RENDER_UPLOAD_TARGET_POLICY_NEXT_STEPS),
    userVisibleSummary: z.string().trim().min(1).max(4000),
    reviewerVisibleSummary: z.string().trim().min(1).max(4000),
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

  const mediaStorageTruthId = req.nextUrl.searchParams.get("mediaStorageTruthId")?.trim() || null;
  const approvalSemanticsId =
    req.nextUrl.searchParams.get("approvalSemanticsId")?.trim() || null;
  const previewReviewFlowId =
    req.nextUrl.searchParams.get("previewReviewFlowId")?.trim() || null;
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderUploadTargetPolicyRecords({
      mediaStorageTruthId,
      approvalSemanticsId,
      previewReviewFlowId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    mediaStorageTruthId || previewReviewFlowId
      ? getLatestVoxyRenderUploadTargetPolicyRecord({
          mediaStorageTruthId,
          previewReviewFlowId,
        })
      : Promise.resolve(null),
    mediaStorageTruthId || previewReviewFlowId
      ? listVoxyRenderUploadTargetPolicyAuditEvents({
          mediaStorageTruthId,
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
    persistence: getVoxyRenderUploadTargetPolicyPersistenceState(),
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
        error: "invalid_upload_target_policy_payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const result = await persistVoxyRenderUploadTargetPolicy({
    command: {
      ...parsed.data,
      reviewerRef:
        parsed.data.reviewerRef ??
        (userId
          ? {
              id: userId,
              title: userId,
              href: null,
            }
          : null),
    } as VoxyRenderUploadTargetPolicyCommand,
  });

  if (!result.ok || !result.record) {
    return NextResponse.json({ ok: false, result }, { status: 400 });
  }

  const auditEvent = await appendVoxyRenderUploadTargetPolicyAuditEvent({
    record: result.record,
    byUserId: userId,
  });

  return NextResponse.json({
    ok: true,
    result,
    auditEvent,
    persistence: getVoxyRenderUploadTargetPolicyPersistenceState(),
  });
}
