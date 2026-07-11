export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_CATEGORIES,
  VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_ITEM_STATUSES,
  VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_PRIORITIES,
  VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_SOURCE_GATES,
  VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_STATUSES,
  VOXY_RENDER_RUNTIME_ENABLEMENT_NEXT_ACTIONS,
  VOXY_RENDER_RUNTIME_ENABLEMENT_RUNTIME_IMPACTS,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogContract";
import {
  getLatestVoxyRenderRuntimeEnablementBacklogRecord,
  getVoxyRenderRuntimeEnablementBacklogPersistenceState,
  listVoxyRenderRuntimeEnablementBacklogAuditEvents,
  listVoxyRenderRuntimeEnablementBacklogRecords,
  persistVoxyRenderRuntimeEnablementBacklog,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const RequestRefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const BacklogItemSchema = z
  .object({
    itemId: z.string().trim().min(1).max(200),
    category: z.enum(VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_CATEGORIES),
    title: z.string().trim().min(1).max(300),
    status: z.enum(VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_ITEM_STATUSES),
    priority: z.enum(VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_PRIORITIES),
    dependencyKeys: z.array(z.string().trim().min(1).max(300)),
    sourceGate: z.enum(VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_SOURCE_GATES),
    userVisibleReason: z.string().trim().min(1).max(3000),
    reviewerVisibleReason: z.string().trim().min(1).max(3000),
    acceptanceCriteria: z.array(z.string().trim().min(1).max(500)),
    nonGoals: z.array(z.string().trim().min(1).max(300)),
    runtimeImpact: z.enum(VOXY_RENDER_RUNTIME_ENABLEMENT_RUNTIME_IMPACTS),
    executionAllowed: z.literal(false),
    implemented: z.literal(false),
  })
  .strict();

const ExecutionSchema = z
  .object({
    runtimeEnabled: z.literal(false),
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
    backlogId: z.string().trim().min(1).max(200),
    matrixId: z.string().trim().min(1).max(200).nullable(),
    providerSelectionDraftId: z.string().trim().min(1).max(200).nullable(),
    assetPackDraftId: z.string().trim().min(1).max(200).nullable(),
    costPolicyPreviewId: z.string().trim().min(1).max(200).nullable(),
    queuePreviewId: z.string().trim().min(1).max(200).nullable(),
    requestDraftId: z.string().trim().min(1).max(200).nullable(),
    decisionId: z.string().trim().min(1).max(200).nullable(),
    decisionGateId: z.string().trim().min(1).max(200).nullable(),
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
    backlogStatus: z.enum(VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_STATUSES),
    items: z.array(BacklogItemSchema),
    topP0Items: z.array(z.string().trim().min(1).max(300)),
    nextRecommendedAction: z.enum(VOXY_RENDER_RUNTIME_ENABLEMENT_NEXT_ACTIONS),
    reviewerVisibleSummary: z.string().trim().min(1).max(4000),
    userVisibleSummary: z.string().trim().min(1).max(4000),
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
  const matrixId = req.nextUrl.searchParams.get("matrixId")?.trim() || null;
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderRuntimeEnablementBacklogRecords({
      decisionGateId,
      decisionId,
      requestDraftId,
      queuePreviewId,
      costPolicyPreviewId,
      assetPackDraftId,
      providerSelectionDraftId,
      matrixId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    decisionGateId
      ? getLatestVoxyRenderRuntimeEnablementBacklogRecord(decisionGateId)
      : Promise.resolve(null),
    decisionGateId
      ? listVoxyRenderRuntimeEnablementBacklogAuditEvents({ decisionGateId, decisionId, limit })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ok: true,
    records,
    latestRecord,
    auditEvents,
    persistence: getVoxyRenderRuntimeEnablementBacklogPersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_voxy_render_runtime_enablement_backlog_command" },
      { status: 400 },
    );
  }

  const userId = gate?._id?.toHexString?.() ?? "";
  const saved = await persistVoxyRenderRuntimeEnablementBacklog({
    command: {
      backlogId: parsed.data.backlogId,
      matrixId: parsed.data.matrixId ?? null,
      providerSelectionDraftId: parsed.data.providerSelectionDraftId ?? null,
      assetPackDraftId: parsed.data.assetPackDraftId ?? null,
      costPolicyPreviewId: parsed.data.costPolicyPreviewId ?? null,
      queuePreviewId: parsed.data.queuePreviewId ?? null,
      requestDraftId: parsed.data.requestDraftId ?? null,
      decisionId: parsed.data.decisionId ?? null,
      decisionGateId: parsed.data.decisionGateId ?? null,
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
      backlogStatus: parsed.data.backlogStatus,
      items: parsed.data.items,
      topP0Items: parsed.data.topP0Items,
      nextRecommendedAction: parsed.data.nextRecommendedAction,
      reviewerVisibleSummary: parsed.data.reviewerVisibleSummary,
      userVisibleSummary: parsed.data.userVisibleSummary,
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
