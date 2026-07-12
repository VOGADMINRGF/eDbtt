export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_MEDIA_CANDIDATE_STATUSES,
  VOXY_RENDER_MEDIA_KINDS,
  VOXY_RENDER_MEDIA_STORAGE_NEXT_STEPS,
  type VoxyRenderMediaStorageTruthCommand,
  VOXY_RENDER_MEDIA_STORAGE_TRUTH_STATUSES,
  VOXY_RENDER_STORAGE_TARGET_PROVIDERS,
  VOXY_RENDER_STORAGE_TARGET_STATUSES,
} from "@/features/create/voxyRenderMediaStorageTruthContract";
import {
  VOXY_RENDER_APPROVAL_SEMANTICS_STATUSES,
} from "@/features/create/voxyRenderApprovalSemanticsContract";
import {
  VOXY_RENDER_PREVIEW_REVIEW_FLOW_STATUSES,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";
import {
  appendVoxyRenderMediaStorageAuditEvent,
  getLatestVoxyRenderMediaStorageTruthRecord,
  getVoxyRenderMediaStoragePersistenceState,
  listVoxyRenderMediaStorageAuditEvents,
  listVoxyRenderMediaStorageTruthRecords,
  persistVoxyRenderMediaStorageTruth,
} from "@/features/create/voxyRenderMediaStorageTruthStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const RefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const MediaCandidateSchema = z
  .object({
    mediaCandidateId: z.string().trim().min(1).max(200).nullable(),
    status: z.enum(VOXY_RENDER_MEDIA_CANDIDATE_STATUSES),
    mediaKind: z.enum(VOXY_RENDER_MEDIA_KINDS),
    mimeType: z.string().trim().min(1).max(200).nullable(),
    fileSizeBytes: z.number().int().nonnegative().nullable(),
    durationSeconds: z.number().nonnegative().nullable(),
    checksum: z.string().trim().min(1).max(512).nullable(),
    width: z.number().int().positive().nullable(),
    height: z.number().int().positive().nullable(),
    publicUrl: z.string().trim().min(1).max(2000).nullable(),
    signedUrl: z.string().trim().min(1).max(2000).nullable(),
    storagePath: z.string().trim().min(1).max(2000).nullable(),
    generated: z.literal(false),
    rendered: z.literal(false),
    uploaded: z.literal(false),
    playable: z.literal(false),
    downloadable: z.literal(false),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
  })
  .strict();

const StorageTargetSchema = z
  .object({
    targetId: z.string().trim().min(1).max(200).nullable(),
    provider: z.enum(VOXY_RENDER_STORAGE_TARGET_PROVIDERS),
    status: z.enum(VOXY_RENDER_STORAGE_TARGET_STATUSES),
    writeAllowed: z.literal(false),
    readAllowed: z.literal(false),
    publicAccessAllowed: z.literal(false),
    signedAccessAllowed: z.literal(false),
    retentionPolicyNeeded: z.literal(true),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
  })
  .strict();

const MediaSemanticsSchema = z
  .object({
    mediaCandidate: z.boolean(),
    mediaFileAvailable: z.literal(false),
    previewFileAvailable: z.literal(false),
    thumbnailAvailable: z.literal(false),
    subtitleFileAvailable: z.literal(false),
    sourceCaptionFileAvailable: z.literal(false),
    storageWriteAllowed: z.literal(false),
    uploadAllowed: z.literal(false),
    published: z.literal(false),
    socialPosted: z.literal(false),
    scheduled: z.literal(false),
  })
  .strict();

const ExecutionFlagsSchema = z
  .object({
    createsMediaFile: z.literal(false),
    createsThumbnail: z.literal(false),
    createsSubtitleFile: z.literal(false),
    createsSourceCaptionFile: z.literal(false),
    storageWriteAllowed: z.literal(false),
    uploadAllowed: z.literal(false),
    publishAllowed: z.literal(false),
    schedulingAllowed: z.literal(false),
    socialPostAllowed: z.literal(false),
    autoPublishAllowed: z.literal(false),
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
    mediaStorageTruthId: z.string().trim().min(1).max(200).nullable().optional(),
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
    mediaStorageTruthStatus: z.enum(VOXY_RENDER_MEDIA_STORAGE_TRUTH_STATUSES),
    mediaCandidate: MediaCandidateSchema,
    storageTarget: StorageTargetSchema,
    mediaSemantics: MediaSemanticsSchema,
    executionFlags: ExecutionFlagsSchema,
    topBlockers: z.array(z.string().trim().min(1).max(4000)).max(20),
    nextStep: z.enum(VOXY_RENDER_MEDIA_STORAGE_NEXT_STEPS),
    userVisibleSummary: z.string().trim().min(1).max(4000),
    reviewerVisibleSummary: z.string().trim().min(1).max(4000),
    approvalStatusHint: z.enum(VOXY_RENDER_APPROVAL_SEMANTICS_STATUSES).nullable().optional(),
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

  const approvalSemanticsId =
    req.nextUrl.searchParams.get("approvalSemanticsId")?.trim() || null;
  const previewReviewFlowId =
    req.nextUrl.searchParams.get("previewReviewFlowId")?.trim() || null;
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderMediaStorageTruthRecords({
      approvalSemanticsId,
      previewReviewFlowId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    approvalSemanticsId || previewReviewFlowId
      ? getLatestVoxyRenderMediaStorageTruthRecord({
          approvalSemanticsId,
          previewReviewFlowId,
        })
      : Promise.resolve(null),
    approvalSemanticsId || previewReviewFlowId
      ? listVoxyRenderMediaStorageAuditEvents({
          approvalSemanticsId,
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
    persistence: getVoxyRenderMediaStoragePersistenceState(),
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
        error: "invalid_media_storage_truth_payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const result = await persistVoxyRenderMediaStorageTruth({
    command: {
      ...parsed.data,
      subtitleLanguage: parsed.data.subtitleLanguage,
      mediaCandidate: {
        ...parsed.data.mediaCandidate,
        mediaCandidateId: parsed.data.mediaCandidate.mediaCandidateId,
      },
      storageTarget: {
        ...parsed.data.storageTarget,
        targetId: parsed.data.storageTarget.targetId,
      },
      reviewerRef:
        parsed.data.reviewerRef ??
        (userId
          ? {
              id: userId,
              title: userId,
              href: null,
            }
          : null),
    } as VoxyRenderMediaStorageTruthCommand,
  });

  if (!result.ok || !result.record) {
    return NextResponse.json({ ok: false, result }, { status: 400 });
  }

  const auditEvent = await appendVoxyRenderMediaStorageAuditEvent({
    record: result.record,
    byUserId: userId,
  });

  return NextResponse.json({
    ok: true,
    result,
    auditEvent,
    persistence: getVoxyRenderMediaStoragePersistenceState(),
  });
}
