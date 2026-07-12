export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_VIDEO_BRIEFING_FLOW_MASTER_CLOSURE_STATUSES,
  VOXY_VIDEO_BRIEFING_FLOW_MASTER_READINESS_AREA_KEYS,
  VOXY_VIDEO_BRIEFING_FLOW_MASTER_READINESS_AREA_STATUSES,
  VOXY_VIDEO_BRIEFING_FLOW_MASTER_NEXT_STEPS,
  type VoxyVideoBriefingFlowMasterClosureCommand,
} from "@/features/create/voxyVideoBriefingFlowMasterClosureContract";
import {
  appendVoxyVideoBriefingFlowMasterClosureAuditEvent,
  getLatestVoxyVideoBriefingFlowMasterClosureRecord,
  getVoxyVideoBriefingFlowMasterClosurePersistenceState,
  listVoxyVideoBriefingFlowMasterClosureAuditEvents,
  listVoxyVideoBriefingFlowMasterClosureRecords,
  persistVoxyVideoBriefingFlowMasterClosure,
} from "@/features/create/voxyVideoBriefingFlowMasterClosureStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const RefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const ReadinessAreaSchema = z
  .object({
    areaKey: z.enum(VOXY_VIDEO_BRIEFING_FLOW_MASTER_READINESS_AREA_KEYS),
    label: z.string().trim().min(1).max(200),
    status: z.enum(VOXY_VIDEO_BRIEFING_FLOW_MASTER_READINESS_AREA_STATUSES),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
    nextAction: z.enum(VOXY_VIDEO_BRIEFING_FLOW_MASTER_NEXT_STEPS),
    runtimeEnabled: z.literal(false),
    executionAllowed: z.literal(false),
  })
  .strict();

const SemanticsSchema = z
  .object({
    reviewFirstArchitectureComplete: z.boolean(),
    runtimePending: z.literal(true),
    runtimeEnabled: z.literal(false),
    previewRendered: z.literal(false),
    mediaFileAvailable: z.literal(false),
    uploaded: z.literal(false),
    scheduled: z.literal(false),
    socialPosted: z.literal(false),
    published: z.literal(false),
    autoPublishAllowed: z.literal(false),
  })
  .strict();

const ExecutionFlagsSchema = z
  .object({
    runtimeExecutionAllowed: z.literal(false),
    featureFlagWriteAllowed: z.literal(false),
    providerExecutionAllowed: z.literal(false),
    queueAllowed: z.literal(false),
    workerAllowed: z.literal(false),
    storageWriteAllowed: z.literal(false),
    uploadAllowed: z.literal(false),
    schedulingAllowed: z.literal(false),
    schedulerJobAllowed: z.literal(false),
    calendarWriteAllowed: z.literal(false),
    publishAllowed: z.literal(false),
    socialPostAllowed: z.literal(false),
    autoPublishAllowed: z.literal(false),
    auditEventEmissionAllowed: z.literal(false),
    metricEmissionAllowed: z.literal(false),
    alertEmissionAllowed: z.literal(false),
    monitoringProviderCallAllowed: z.literal(false),
    createsMediaFile: z.literal(false),
    previewRendered: z.literal(false),
    renderAllowed: z.literal(false),
    rerenderAllowed: z.literal(false),
    secretsAccessed: z.literal(false),
    costDebitAllowed: z.literal(false),
    creditDebitAllowed: z.literal(false),
    runtimeClaimAllowed: z.literal(false),
  })
  .strict();

const BodySchema = z
  .object({
    masterClosureId: z.string().trim().min(1).max(200).nullable().optional(),
    runtimeCutoverGateId: z.string().trim().min(1).max(200).nullable().optional(),
    runtimeObservabilityId: z.string().trim().min(1).max(200).nullable().optional(),
    schedulingPolicyId: z.string().trim().min(1).max(200).nullable().optional(),
    uploadTargetPolicyId: z.string().trim().min(1).max(200).nullable().optional(),
    mediaStorageTruthId: z.string().trim().min(1).max(200).nullable().optional(),
    approvalSemanticsId: z.string().trim().min(1).max(200).nullable().optional(),
    socialDistributionHandoffId: z.string().trim().min(1).max(200).nullable().optional(),
    publishReadinessGuardId: z.string().trim().min(1).max(200).nullable().optional(),
    previewOutcomeHandoffId: z.string().trim().min(1).max(200).nullable().optional(),
    previewReviewFlowId: z.string().trim().min(1).max(200).nullable().optional(),
    renderRequestDraftId: z.string().trim().min(1).max(200).nullable().optional(),
    scriptCandidateId: z.string().trim().min(1).max(200).nullable().optional(),
    providerSelectionDraftId: z.string().trim().min(1).max(200).nullable().optional(),
    assetPackDraftId: z.string().trim().min(1).max(200).nullable().optional(),
    queueContractId: z.string().trim().min(1).max(200).nullable().optional(),
    costCreditPolicyId: z.string().trim().min(1).max(200).nullable().optional(),
    contributionRef: RefSchema.nullable().optional(),
    dossierRef: RefSchema.nullable().optional(),
    reviewerRef: RefSchema.nullable().optional(),
    scriptRef: RefSchema.nullable().optional(),
    createdAt: z.string().trim().max(100).nullable().optional(),
    sourceLanguage: z.string().trim().min(1).max(20),
    readingLanguage: z.string().trim().min(1).max(20),
    scriptLanguage: z.string().trim().min(1).max(20),
    renderLanguage: z.string().trim().min(1).max(20),
    originalPreserved: z.literal(true),
    translationIsEvidence: z.literal(false),
    rtlRequired: z.boolean(),
    masterStatus: z.enum(VOXY_VIDEO_BRIEFING_FLOW_MASTER_CLOSURE_STATUSES),
    readinessAreas: z.array(ReadinessAreaSchema).min(1).max(24),
    semantics: SemanticsSchema,
    executionFlags: ExecutionFlagsSchema,
    topBlockers: z.array(z.string().trim().min(1).max(4000)).max(30),
    runtimePendingRequirements: z.array(z.string().trim().min(1).max(4000)).max(30),
    nextStep: z.enum(VOXY_VIDEO_BRIEFING_FLOW_MASTER_NEXT_STEPS),
    userVisibleSummary: z.string().trim().min(1).max(4000),
    reviewerVisibleSummary: z.string().trim().min(1).max(4000),
  })
  .strict();

function parseLimit(req: NextRequest) {
  const raw = Number(req.nextUrl.searchParams.get("limit") ?? "10");
  return Number.isFinite(raw) ? Math.max(1, Math.min(50, raw)) : 10;
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const runtimeCutoverGateId =
    req.nextUrl.searchParams.get("runtimeCutoverGateId")?.trim() || null;
  const previewReviewFlowId =
    req.nextUrl.searchParams.get("previewReviewFlowId")?.trim() || null;
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyVideoBriefingFlowMasterClosureRecords({
      runtimeCutoverGateId,
      previewReviewFlowId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    runtimeCutoverGateId || previewReviewFlowId
      ? getLatestVoxyVideoBriefingFlowMasterClosureRecord({
          runtimeCutoverGateId,
          previewReviewFlowId,
        })
      : Promise.resolve(null),
    runtimeCutoverGateId || previewReviewFlowId
      ? listVoxyVideoBriefingFlowMasterClosureAuditEvents({
          runtimeCutoverGateId,
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
    persistence: getVoxyVideoBriefingFlowMasterClosurePersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const body = BodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_voxy_video_briefing_flow_master_closure_payload",
        issues: body.error.flatten(),
      },
      { status: 400 },
    );
  }

  const result = await persistVoxyVideoBriefingFlowMasterClosure({
    command: body.data as VoxyVideoBriefingFlowMasterClosureCommand,
  });

  if (!result.ok || !result.record) {
    return NextResponse.json(
      {
        ok: false,
        result,
        persistence: getVoxyVideoBriefingFlowMasterClosurePersistenceState(),
      },
      { status: 400 },
    );
  }

  const auditEvent = await appendVoxyVideoBriefingFlowMasterClosureAuditEvent({
    record: result.record,
  });

  return NextResponse.json({
    ok: true,
    result,
    auditEvent,
    persistence: getVoxyVideoBriefingFlowMasterClosurePersistenceState(),
  });
}
