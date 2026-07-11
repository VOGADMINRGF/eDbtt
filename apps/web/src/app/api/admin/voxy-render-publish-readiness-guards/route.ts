export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_PUBLISH_READINESS_GATE_KEYS,
  VOXY_RENDER_PUBLISH_READINESS_GATE_STATUSES,
  VOXY_RENDER_PUBLISH_READINESS_NEXT_STEPS,
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
  appendVoxyRenderPublishReadinessAuditEvent,
  getLatestVoxyRenderPublishReadinessGuardRecord,
  getVoxyRenderPublishReadinessPersistenceState,
  listVoxyRenderPublishReadinessAuditEvents,
  listVoxyRenderPublishReadinessGuardRecords,
  persistVoxyRenderPublishReadinessGuard,
} from "@/features/create/voxyRenderPublishReadinessGuardStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const GuardRefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const GateSchema = z
  .object({
    gateKey: z.enum(VOXY_RENDER_PUBLISH_READINESS_GATE_KEYS),
    label: z.string().trim().min(1).max(200),
    status: z.enum(VOXY_RENDER_PUBLISH_READINESS_GATE_STATUSES),
    reviewerVisibleReason: z.string().trim().min(1).max(4000),
    userVisibleReason: z.string().trim().min(1).max(4000),
    nextAction: z.enum(VOXY_RENDER_PUBLISH_READINESS_NEXT_STEPS),
    executionAllowed: z.literal(false),
  })
  .strict();

const PublishSemanticsSchema = z
  .object({
    reviewReady: z.boolean(),
    approved: z.literal(false),
    publishReady: z.literal(false),
    published: z.literal(false),
    uploaded: z.literal(false),
    scheduled: z.literal(false),
    socialPosted: z.literal(false),
    autoPublishAllowed: z.literal(false),
  })
  .strict();

const GuardEffectsSchema = z
  .object({
    blocksPublish: z.literal(true),
    blocksUpload: z.literal(true),
    blocksScheduling: z.literal(true),
    blocksSocialPosting: z.literal(true),
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
    publishReadinessGuardId: z.string().trim().min(1).max(200).nullable().optional(),
    previewOutcomeHandoffId: z.string().trim().min(1).max(200).nullable().optional(),
    previewReviewDecisionRecordId: z.string().trim().min(1).max(200).nullable().optional(),
    previewReviewFlowId: z.string().trim().min(1).max(200).nullable().optional(),
    enablementBacklogId: z.string().trim().min(1).max(200).nullable().optional(),
    matrixId: z.string().trim().min(1).max(200).nullable().optional(),
    requestDraftId: z.string().trim().min(1).max(200).nullable().optional(),
    scriptRef: GuardRefSchema.nullable().optional(),
    contributionRef: GuardRefSchema.nullable().optional(),
    dossierRef: GuardRefSchema.nullable().optional(),
    reviewerRef: GuardRefSchema.nullable().optional(),
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
    guardStatus: z.enum(VOXY_RENDER_PUBLISH_READINESS_GUARD_STATUSES),
    reviewGate: GateSchema,
    approvalGate: GateSchema,
    mediaGate: GateSchema,
    uploadGate: GateSchema,
    schedulingGate: GateSchema,
    socialPostingGate: GateSchema,
    legalSafetyGate: GateSchema,
    sourceCaptionGate: GateSchema,
    languageGate: GateSchema,
    accessibilityGate: GateSchema,
    runtimeGate: GateSchema,
    publishSemantics: PublishSemanticsSchema,
    guardEffects: GuardEffectsSchema,
    executionFlags: ExecutionFlagsSchema,
    topBlockers: z.array(z.string().trim().min(1).max(4000)).max(20),
    nextStep: z.enum(VOXY_RENDER_PUBLISH_READINESS_NEXT_STEPS),
    userVisibleSummary: z.string().trim().min(1).max(4000),
    reviewerVisibleSummary: z.string().trim().min(1).max(4000),
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
    listVoxyRenderPublishReadinessGuardRecords({
      previewOutcomeHandoffId,
      previewReviewDecisionRecordId,
      previewReviewFlowId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    previewOutcomeHandoffId || previewReviewDecisionRecordId || previewReviewFlowId
      ? getLatestVoxyRenderPublishReadinessGuardRecord({
          previewOutcomeHandoffId,
          previewReviewDecisionRecordId,
          previewReviewFlowId,
        })
      : Promise.resolve(null),
    previewOutcomeHandoffId || previewReviewDecisionRecordId || previewReviewFlowId
      ? listVoxyRenderPublishReadinessAuditEvents({
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
    persistence: getVoxyRenderPublishReadinessPersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_voxy_render_publish_readiness_guard_command" },
      { status: 400 },
    );
  }

  const userId = gate?._id?.toHexString?.() ?? "";
  const result = await persistVoxyRenderPublishReadinessGuard({
    command: {
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
      guardStatus: parsed.data.guardStatus,
      reviewGate: parsed.data.reviewGate,
      approvalGate: parsed.data.approvalGate,
      mediaGate: parsed.data.mediaGate,
      uploadGate: parsed.data.uploadGate,
      schedulingGate: parsed.data.schedulingGate,
      socialPostingGate: parsed.data.socialPostingGate,
      legalSafetyGate: parsed.data.legalSafetyGate,
      sourceCaptionGate: parsed.data.sourceCaptionGate,
      languageGate: parsed.data.languageGate,
      accessibilityGate: parsed.data.accessibilityGate,
      runtimeGate: parsed.data.runtimeGate,
      publishSemantics: parsed.data.publishSemantics,
      guardEffects: parsed.data.guardEffects,
      executionFlags: parsed.data.executionFlags,
      topBlockers: parsed.data.topBlockers,
      nextStep: parsed.data.nextStep,
      userVisibleSummary: parsed.data.userVisibleSummary,
      reviewerVisibleSummary: parsed.data.reviewerVisibleSummary,
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

  const auditEvent = await appendVoxyRenderPublishReadinessAuditEvent({
    record: result.record,
    byUserId: userId || null,
    note: "admin_api_publish_readiness_guard",
  });

  return NextResponse.json({
    ok: true,
    result,
    auditEvent,
    persistence: getVoxyRenderPublishReadinessPersistenceState(),
  });
}

