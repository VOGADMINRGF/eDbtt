export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { VoxyRenderRuntimeObservabilityCommand } from "@/features/create/voxyRenderRuntimeObservabilityContract";
import {
  VOXY_RENDER_RUNTIME_OBSERVABILITY_ALERT_CANDIDATE_STATUSES,
  VOXY_RENDER_RUNTIME_OBSERVABILITY_ALERT_SEVERITIES,
  VOXY_RENDER_RUNTIME_OBSERVABILITY_EVENT_CANDIDATE_STATUSES,
  VOXY_RENDER_RUNTIME_OBSERVABILITY_EVENT_DESCRIPTORS,
  VOXY_RENDER_RUNTIME_OBSERVABILITY_METRIC_CANDIDATE_STATUSES,
  VOXY_RENDER_RUNTIME_OBSERVABILITY_METRIC_KINDS,
  VOXY_RENDER_RUNTIME_OBSERVABILITY_NEXT_STEPS,
  VOXY_RENDER_RUNTIME_OBSERVABILITY_STATUSES,
  VOXY_RENDER_RUNTIME_TRACE_CANDIDATE_STATUSES,
} from "@/features/create/voxyRenderRuntimeObservabilityContract";
import {
  appendVoxyRenderRuntimeObservabilityAuditEvent,
  getLatestVoxyRenderRuntimeObservabilityRecord,
  getVoxyRenderRuntimeObservabilityPersistenceState,
  listVoxyRenderRuntimeObservabilityAuditEvents,
  listVoxyRenderRuntimeObservabilityRecords,
  persistVoxyRenderRuntimeObservability,
} from "@/features/create/voxyRenderRuntimeObservabilityStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const RefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const AuditEventCandidateSchema = z
  .object({
    eventCandidateId: z.string().trim().min(1).max(200).nullable(),
    eventKey: z.string().trim().min(1).max(200),
    status: z.enum(VOXY_RENDER_RUNTIME_OBSERVABILITY_EVENT_CANDIDATE_STATUSES),
    wouldDescribe: z.enum(VOXY_RENDER_RUNTIME_OBSERVABILITY_EVENT_DESCRIPTORS),
    emitted: z.literal(false),
    emitterAllowed: z.literal(false),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
  })
  .strict();

const MetricCandidateSchema = z
  .object({
    metricCandidateId: z.string().trim().min(1).max(200).nullable(),
    metricKey: z.string().trim().min(1).max(200),
    status: z.enum(VOXY_RENDER_RUNTIME_OBSERVABILITY_METRIC_CANDIDATE_STATUSES),
    metricKind: z.enum(VOXY_RENDER_RUNTIME_OBSERVABILITY_METRIC_KINDS),
    metricStreamCreated: z.literal(false),
    metricEmitted: z.literal(false),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
  })
  .strict();

const AlertCandidateSchema = z
  .object({
    alertCandidateId: z.string().trim().min(1).max(200).nullable(),
    alertKey: z.string().trim().min(1).max(200),
    status: z.enum(VOXY_RENDER_RUNTIME_OBSERVABILITY_ALERT_CANDIDATE_STATUSES),
    severity: z.enum(VOXY_RENDER_RUNTIME_OBSERVABILITY_ALERT_SEVERITIES),
    alertCreated: z.literal(false),
    alertEmitted: z.literal(false),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
  })
  .strict();

const RuntimeTraceCandidateSchema = z
  .object({
    traceCandidateId: z.string().trim().min(1).max(200).nullable(),
    status: z.enum(VOXY_RENDER_RUNTIME_TRACE_CANDIDATE_STATUSES),
    traceId: z.null(),
    executionStarted: z.literal(false),
    executionCompleted: z.literal(false),
    executionFailed: z.literal(false),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
  })
  .strict();

const SemanticsSchema = z
  .object({
    observabilityPlan: z.literal(true),
    runtimeTraceAvailable: z.literal(false),
    auditEventsEmitted: z.literal(false),
    metricsEmitted: z.literal(false),
    alertsEmitted: z.literal(false),
    monitoringRuntimeEnabled: z.literal(false),
    runtimeEnabled: z.literal(false),
    renderExecuted: z.literal(false),
    uploadExecuted: z.literal(false),
    schedulingExecuted: z.literal(false),
    publishExecuted: z.literal(false),
    socialPostExecuted: z.literal(false),
  })
  .strict();

const ExecutionFlagsSchema = z
  .object({
    auditEventEmissionAllowed: z.literal(false),
    metricEmissionAllowed: z.literal(false),
    alertEmissionAllowed: z.literal(false),
    monitoringProviderCallAllowed: z.literal(false),
    traceCreationAllowed: z.literal(false),
    runtimeExecutionAllowed: z.literal(false),
    schedulingAllowed: z.literal(false),
    schedulerJobAllowed: z.literal(false),
    calendarWriteAllowed: z.literal(false),
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
    runtimeObservabilityId: z.string().trim().min(1).max(200).nullable().optional(),
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
    runtimeObservabilityStatus: z.enum(VOXY_RENDER_RUNTIME_OBSERVABILITY_STATUSES),
    auditEventCandidates: z.array(AuditEventCandidateSchema).max(20),
    metricCandidates: z.array(MetricCandidateSchema).max(20),
    alertCandidates: z.array(AlertCandidateSchema).max(20),
    runtimeTraceCandidate: RuntimeTraceCandidateSchema,
    semantics: SemanticsSchema,
    executionFlags: ExecutionFlagsSchema,
    topBlockers: z.array(z.string().trim().min(1).max(4000)).max(20),
    nextStep: z.enum(VOXY_RENDER_RUNTIME_OBSERVABILITY_NEXT_STEPS),
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

  const schedulingPolicyId = req.nextUrl.searchParams.get("schedulingPolicyId")?.trim() || null;
  const uploadTargetPolicyId =
    req.nextUrl.searchParams.get("uploadTargetPolicyId")?.trim() || null;
  const previewReviewFlowId =
    req.nextUrl.searchParams.get("previewReviewFlowId")?.trim() || null;
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderRuntimeObservabilityRecords({
      schedulingPolicyId,
      uploadTargetPolicyId,
      previewReviewFlowId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    schedulingPolicyId || previewReviewFlowId
      ? getLatestVoxyRenderRuntimeObservabilityRecord({
          schedulingPolicyId,
          previewReviewFlowId,
        })
      : Promise.resolve(null),
    schedulingPolicyId || previewReviewFlowId
      ? listVoxyRenderRuntimeObservabilityAuditEvents({
          schedulingPolicyId,
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
    persistence: getVoxyRenderRuntimeObservabilityPersistenceState(),
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

  const command = parsed.data as VoxyRenderRuntimeObservabilityCommand;
  const result = await persistVoxyRenderRuntimeObservability({ command });
  if (!result.ok || !result.record) {
    return NextResponse.json(
      {
        ok: false,
        result,
        persistence: getVoxyRenderRuntimeObservabilityPersistenceState(),
      },
      { status: 400 },
    );
  }

  const auditEvent = await appendVoxyRenderRuntimeObservabilityAuditEvent({
    record: result.record,
    byUserId: userId,
  });

  return NextResponse.json({
    ok: true,
    result,
    auditEvent,
    persistence: getVoxyRenderRuntimeObservabilityPersistenceState(),
  });
}
