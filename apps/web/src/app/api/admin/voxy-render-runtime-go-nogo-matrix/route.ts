export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_RUNTIME_GO_NOGO_BLOCKER_SEVERITIES,
  VOXY_RENDER_RUNTIME_GO_NOGO_GATE_KEYS,
  VOXY_RENDER_RUNTIME_GO_NOGO_GATE_STATUSES,
  VOXY_RENDER_RUNTIME_GO_NOGO_MATRIX_STATUSES,
  VOXY_RENDER_RUNTIME_GO_NOGO_NEXT_ACTIONS,
  VOXY_RENDER_RUNTIME_GO_NOGO_OVERALL_DECISIONS,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";
import {
  getLatestVoxyRenderRuntimeGoNogoMatrixRecord,
  getVoxyRenderRuntimeGoNogoMatrixPersistenceState,
  listVoxyRenderRuntimeGoNogoMatrixAuditEvents,
  listVoxyRenderRuntimeGoNogoMatrixRecords,
  persistVoxyRenderRuntimeGoNogoMatrix,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const RequestRefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const GateSchema = z
  .object({
    gateKey: z.enum(VOXY_RENDER_RUNTIME_GO_NOGO_GATE_KEYS),
    label: z.string().trim().min(1).max(120),
    status: z.enum(VOXY_RENDER_RUNTIME_GO_NOGO_GATE_STATUSES),
    blockerSeverity: z.enum(VOXY_RENDER_RUNTIME_GO_NOGO_BLOCKER_SEVERITIES),
    reviewerVisibleReason: z.string().trim().min(1).max(2000),
    userVisibleReason: z.string().trim().min(1).max(2000),
    evidenceRefs: z.array(z.string().trim().min(1).max(500)),
    nextAction: z.enum(VOXY_RENDER_RUNTIME_GO_NOGO_NEXT_ACTIONS),
    executionAllowed: z.literal(false),
  })
  .strict();

const ExecutionSchema = z
  .object({
    renderAllowed: z.literal(false),
    queueAllowed: z.literal(false),
    workerAllowed: z.literal(false),
    providerExecutionAllowed: z.literal(false),
    secretsAccessed: z.literal(false),
    mediaFileCreationAllowed: z.literal(false),
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
    matrixId: z.string().trim().min(1).max(200),
    providerSelectionDraftId: z.string().trim().min(1).max(200).nullable(),
    assetPackDraftId: z.string().trim().min(1).max(200).nullable(),
    costPolicyPreviewId: z.string().trim().min(1).max(200).nullable(),
    queuePreviewId: z.string().trim().min(1).max(200).nullable(),
    requestDraftId: z.string().trim().min(1).max(200).nullable(),
    decisionId: z.string().trim().min(1).max(200).nullable(),
    decisionGateId: z.string().trim().min(1).max(200),
    handoffRef: RequestRefSchema.nullable(),
    preflightRef: RequestRefSchema.nullable(),
    registryRef: RequestRefSchema.nullable(),
    adapterRef: RequestRefSchema.nullable(),
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
    matrixStatus: z.enum(VOXY_RENDER_RUNTIME_GO_NOGO_MATRIX_STATUSES),
    reviewGate: GateSchema,
    providerGate: GateSchema,
    assetGate: GateSchema,
    queueGate: GateSchema,
    costCreditGate: GateSchema,
    languageGate: GateSchema,
    runtimeGate: GateSchema,
    publishGate: GateSchema,
    overallDecision: z.enum(VOXY_RENDER_RUNTIME_GO_NOGO_OVERALL_DECISIONS),
    topBlockers: z.array(z.string().trim().min(1).max(2000)),
    nextRecommendedAction: z.enum(VOXY_RENDER_RUNTIME_GO_NOGO_NEXT_ACTIONS),
    nextStep: z.string().trim().min(1).max(1200),
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
  const requestDraftId = req.nextUrl.searchParams.get("requestDraftId")?.trim() || null;
  const queuePreviewId = req.nextUrl.searchParams.get("queuePreviewId")?.trim() || null;
  const costPolicyPreviewId = req.nextUrl.searchParams.get("costPolicyPreviewId")?.trim() || null;
  const assetPackDraftId = req.nextUrl.searchParams.get("assetPackDraftId")?.trim() || null;
  const providerSelectionDraftId =
    req.nextUrl.searchParams.get("providerSelectionDraftId")?.trim() || null;
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderRuntimeGoNogoMatrixRecords({
      decisionGateId,
      decisionId,
      requestDraftId,
      queuePreviewId,
      costPolicyPreviewId,
      assetPackDraftId,
      providerSelectionDraftId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    decisionGateId
      ? getLatestVoxyRenderRuntimeGoNogoMatrixRecord(decisionGateId)
      : Promise.resolve(null),
    decisionGateId
      ? listVoxyRenderRuntimeGoNogoMatrixAuditEvents({ decisionGateId, decisionId, limit })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ok: true,
    records,
    latestRecord,
    auditEvents,
    persistence: getVoxyRenderRuntimeGoNogoMatrixPersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_voxy_render_runtime_go_nogo_matrix_command" },
      { status: 400 },
    );
  }

  const userId = gate?._id?.toHexString?.() ?? "";
  const saved = await persistVoxyRenderRuntimeGoNogoMatrix({
    command: {
      matrixId: parsed.data.matrixId,
      providerSelectionDraftId: parsed.data.providerSelectionDraftId ?? null,
      assetPackDraftId: parsed.data.assetPackDraftId ?? null,
      costPolicyPreviewId: parsed.data.costPolicyPreviewId ?? null,
      queuePreviewId: parsed.data.queuePreviewId ?? null,
      requestDraftId: parsed.data.requestDraftId ?? null,
      decisionId: parsed.data.decisionId ?? null,
      decisionGateId: parsed.data.decisionGateId,
      handoffRef: parsed.data.handoffRef,
      preflightRef: parsed.data.preflightRef,
      registryRef: parsed.data.registryRef,
      adapterRef: parsed.data.adapterRef,
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
      matrixStatus: parsed.data.matrixStatus,
      reviewGate: parsed.data.reviewGate,
      providerGate: parsed.data.providerGate,
      assetGate: parsed.data.assetGate,
      queueGate: parsed.data.queueGate,
      costCreditGate: parsed.data.costCreditGate,
      languageGate: parsed.data.languageGate,
      runtimeGate: parsed.data.runtimeGate,
      publishGate: parsed.data.publishGate,
      overallDecision: parsed.data.overallDecision,
      topBlockers: parsed.data.topBlockers,
      nextRecommendedAction: parsed.data.nextRecommendedAction,
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
