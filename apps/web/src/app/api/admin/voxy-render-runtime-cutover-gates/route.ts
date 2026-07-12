export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_RUNTIME_CUTOVER_CANDIDATE_STATUSES,
  VOXY_RENDER_RUNTIME_CUTOVER_GATE_ITEM_STATUSES,
  VOXY_RENDER_RUNTIME_CUTOVER_GATE_KEYS,
  VOXY_RENDER_RUNTIME_CUTOVER_GATE_NEXT_STEPS,
  VOXY_RENDER_RUNTIME_CUTOVER_GATE_STATUSES,
  type VoxyRenderRuntimeCutoverGateCommand,
} from "@/features/create/voxyRenderRuntimeCutoverGateContract";
import {
  appendVoxyRenderRuntimeCutoverGateAuditEvent,
  getLatestVoxyRenderRuntimeCutoverGateRecord,
  getVoxyRenderRuntimeCutoverGatePersistenceState,
  listVoxyRenderRuntimeCutoverGateAuditEvents,
  listVoxyRenderRuntimeCutoverGateRecords,
  persistVoxyRenderRuntimeCutoverGate,
} from "@/features/create/voxyRenderRuntimeCutoverGateStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const RefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const CutoverCandidateSchema = z
  .object({
    cutoverCandidateId: z.string().trim().min(1).max(200).nullable(),
    status: z.enum(VOXY_RENDER_RUNTIME_CUTOVER_CANDIDATE_STATUSES),
    runtimeCutoverCandidate: z.boolean(),
    runtimeEnabled: z.literal(false),
    featureFlagCandidate: z.boolean(),
    featureFlagEnabled: z.literal(false),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
  })
  .strict();

const GateSchema = z
  .object({
    gateKey: z.enum(VOXY_RENDER_RUNTIME_CUTOVER_GATE_KEYS),
    label: z.string().trim().min(1).max(200),
    status: z.enum(VOXY_RENDER_RUNTIME_CUTOVER_GATE_ITEM_STATUSES),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
    nextAction: z.enum(VOXY_RENDER_RUNTIME_CUTOVER_GATE_NEXT_STEPS),
    executionAllowed: z.literal(false),
  })
  .strict();

const SemanticsSchema = z
  .object({
    runtimeCutoverCandidate: z.boolean(),
    runtimeEnabled: z.literal(false),
    featureFlagCandidate: z.boolean(),
    featureFlagEnabled: z.literal(false),
    providerRuntimeEnabled: z.literal(false),
    queueWorkerEnabled: z.literal(false),
    storageRuntimeEnabled: z.literal(false),
    uploadRuntimeEnabled: z.literal(false),
    schedulingRuntimeEnabled: z.literal(false),
    observabilityRuntimeEnabled: z.literal(false),
    costRuntimeEnabled: z.literal(false),
    rollbackReady: z.literal(false),
    runbookReady: z.literal(false),
    publishAllowed: z.literal(false),
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

const OptionalStatusSchema = z.string().trim().min(1).max(200).nullable().optional();

const BodySchema = z
  .object({
    runtimeCutoverGateId: z.string().trim().min(1).max(200).nullable().optional(),
    runtimeObservabilityId: z.string().trim().min(1).max(200).nullable().optional(),
    schedulingPolicyId: z.string().trim().min(1).max(200).nullable().optional(),
    uploadTargetPolicyId: z.string().trim().min(1).max(200).nullable().optional(),
    mediaStorageTruthId: z.string().trim().min(1).max(200).nullable().optional(),
    approvalSemanticsId: z.string().trim().min(1).max(200).nullable().optional(),
    socialDistributionHandoffId: z.string().trim().min(1).max(200).nullable().optional(),
    publishReadinessGuardId: z.string().trim().min(1).max(200).nullable().optional(),
    enablementBacklogId: z.string().trim().min(1).max(200).nullable().optional(),
    matrixId: z.string().trim().min(1).max(200).nullable().optional(),
    providerSelectionDraftId: z.string().trim().min(1).max(200).nullable().optional(),
    queueContractId: z.string().trim().min(1).max(200).nullable().optional(),
    costCreditPolicyId: z.string().trim().min(1).max(200).nullable().optional(),
    requestDraftId: z.string().trim().min(1).max(200).nullable().optional(),
    previewReviewFlowId: z.string().trim().min(1).max(200).nullable().optional(),
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
    runtimeCutoverGateStatus: z.enum(VOXY_RENDER_RUNTIME_CUTOVER_GATE_STATUSES),
    cutoverCandidate: CutoverCandidateSchema,
    gates: z.array(GateSchema).min(1).max(32),
    semantics: SemanticsSchema,
    executionFlags: ExecutionFlagsSchema,
    topBlockers: z.array(z.string().trim().min(1).max(4000)).max(30),
    nextStep: z.enum(VOXY_RENDER_RUNTIME_CUTOVER_GATE_NEXT_STEPS),
    userVisibleSummary: z.string().trim().min(1).max(4000),
    reviewerVisibleSummary: z.string().trim().min(1).max(4000),
    runtimeObservabilityStatusHint: OptionalStatusSchema,
    schedulingPolicyStatusHint: OptionalStatusSchema,
    uploadTargetPolicyStatusHint: OptionalStatusSchema,
    mediaStorageTruthStatusHint: OptionalStatusSchema,
    approvalStatusHint: OptionalStatusSchema,
    socialDistributionHandoffStatusHint: OptionalStatusSchema,
    publishReadinessGuardStatusHint: OptionalStatusSchema,
    providerSelectionStatusHint: OptionalStatusSchema,
    queueStatusHint: OptionalStatusSchema,
    costCreditPolicyStatusHint: OptionalStatusSchema,
    backlogStatusHint: OptionalStatusSchema,
    matrixStatusHint: OptionalStatusSchema,
  })
  .strict();

function parseLimit(req: NextRequest) {
  const raw = Number(req.nextUrl.searchParams.get("limit") ?? "10");
  return Number.isFinite(raw) ? Math.max(1, Math.min(50, raw)) : 10;
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const runtimeObservabilityId =
    req.nextUrl.searchParams.get("runtimeObservabilityId")?.trim() || null;
  const schedulingPolicyId = req.nextUrl.searchParams.get("schedulingPolicyId")?.trim() || null;
  const previewReviewFlowId =
    req.nextUrl.searchParams.get("previewReviewFlowId")?.trim() || null;
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderRuntimeCutoverGateRecords({
      runtimeObservabilityId,
      schedulingPolicyId,
      previewReviewFlowId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    runtimeObservabilityId || previewReviewFlowId
      ? getLatestVoxyRenderRuntimeCutoverGateRecord({
          runtimeObservabilityId,
          previewReviewFlowId,
        })
      : Promise.resolve(null),
    runtimeObservabilityId || previewReviewFlowId
      ? listVoxyRenderRuntimeCutoverGateAuditEvents({
          runtimeObservabilityId,
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
    persistence: getVoxyRenderRuntimeCutoverGatePersistenceState(),
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
        error: "invalid_runtime_cutover_gate_payload",
        issues: body.error.flatten(),
      },
      { status: 400 },
    );
  }

  const result = await persistVoxyRenderRuntimeCutoverGate({
    command: body.data as VoxyRenderRuntimeCutoverGateCommand,
  });

  if (!result.ok || !result.record) {
    return NextResponse.json(
      {
        ok: false,
        result,
        persistence: getVoxyRenderRuntimeCutoverGatePersistenceState(),
      },
      { status: 400 },
    );
  }

  const byUserId =
    typeof gate === "object" && gate && "_id" in gate && gate._id && typeof gate._id === "object"
      ? (gate._id as { toHexString?: () => string }).toHexString?.() ?? null
      : null;
  const auditEvent = await appendVoxyRenderRuntimeCutoverGateAuditEvent({
    record: result.record,
    byUserId,
  });

  return NextResponse.json({
    ok: true,
    result,
    auditEvent,
    persistence: getVoxyRenderRuntimeCutoverGatePersistenceState(),
  });
}
