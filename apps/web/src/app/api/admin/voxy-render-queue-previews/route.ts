export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_QUEUE_PREVIEW_STATUSES,
} from "@/features/create/voxyRenderQueueContract";
import {
  VOXY_RENDER_REQUEST_DRAFT_REQUIREMENT_STATUSES,
} from "@/features/create/voxyRenderRequestDraftContract";
import {
  getLatestVoxyRenderQueuePreviewRecord,
  getVoxyRenderQueuePersistenceState,
  listVoxyRenderQueueAuditEvents,
  listVoxyRenderQueuePreviewRecords,
  persistVoxyRenderQueuePreview,
} from "@/features/create/voxyRenderQueueStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const RequestRefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const RequirementItemSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    label: z.string().trim().min(1).max(300),
    status: z.enum(VOXY_RENDER_REQUEST_DRAFT_REQUIREMENT_STATUSES),
    statusLabel: z.string().trim().min(1).max(120),
    reason: z.string().trim().min(1).max(1000),
  })
  .strict();

const ExecutionSchema = z
  .object({
    queueEnabled: z.literal(false),
    createsQueueJob: z.literal(false),
    workerExecutionAllowed: z.literal(false),
    providerExecutionAllowed: z.literal(false),
    mediaFileCreationAllowed: z.literal(false),
    costDebitAllowed: z.literal(false),
    uploadAllowed: z.literal(false),
    publishAllowed: z.literal(false),
    socialPostAllowed: z.literal(false),
    schedulingAllowed: z.literal(false),
    runtimeClaimAllowed: z.literal(false),
  })
  .strict();

const BodySchema = z
  .object({
    queuePreviewId: z.string().trim().min(1).max(200),
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
    surface: z.enum(["create", "account", "admin", "workspace"]),
    videoFormat: z.literal("briefing_video"),
    queueStatus: z.enum(VOXY_RENDER_QUEUE_PREVIEW_STATUSES),
    sourceLanguage: z.string().trim().min(1).max(20),
    readingLanguage: z.string().trim().min(1).max(20),
    scriptLanguage: z.string().trim().min(1).max(20),
    renderLanguage: z.string().trim().min(1).max(20),
    subtitleLanguage: z.string().trim().min(1).max(20).nullable(),
    originalPreserved: z.literal(true),
    translationIsEvidence: z.literal(false),
    rtlRequired: z.boolean(),
    providerRequirements: z.array(RequirementItemSchema),
    assetRequirements: z.array(RequirementItemSchema),
    costRequirements: z.array(RequirementItemSchema),
    reviewRequirements: z.array(RequirementItemSchema),
    publicSafetyRequirements: z.array(RequirementItemSchema),
    estimatedRuntimeRequirements: z.array(RequirementItemSchema),
    userVisibleReason: z.string().trim().min(1).max(1200),
    reviewerVisibleReason: z.string().trim().min(1).max(1200),
    nextStep: z.string().trim().min(1).max(500),
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
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderQueuePreviewRecords({
      decisionGateId,
      decisionId,
      requestDraftId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    decisionGateId ? getLatestVoxyRenderQueuePreviewRecord(decisionGateId) : Promise.resolve(null),
    decisionGateId
      ? listVoxyRenderQueueAuditEvents({ decisionGateId, decisionId, limit })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ok: true,
    records,
    latestRecord,
    auditEvents,
    persistence: getVoxyRenderQueuePersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_voxy_render_queue_preview_command" },
      { status: 400 },
    );
  }

  const userId = gate?._id?.toHexString?.() ?? "";
  const saved = await persistVoxyRenderQueuePreview({
    command: {
      queuePreviewId: parsed.data.queuePreviewId,
      requestDraftId: parsed.data.requestDraftId,
      decisionId: parsed.data.decisionId,
      decisionGateId: parsed.data.decisionGateId,
      handoffRef: parsed.data.handoffRef,
      preflightRef: parsed.data.preflightRef,
      registryRef: parsed.data.registryRef,
      adapterRef: parsed.data.adapterRef,
      scriptRef: parsed.data.scriptRef,
      contributionRef: parsed.data.contributionRef,
      dossierRef: parsed.data.dossierRef,
      surface: parsed.data.surface,
      videoFormat: parsed.data.videoFormat,
      queueStatus: parsed.data.queueStatus,
      sourceLanguage: parsed.data.sourceLanguage,
      readingLanguage: parsed.data.readingLanguage,
      scriptLanguage: parsed.data.scriptLanguage,
      renderLanguage: parsed.data.renderLanguage,
      subtitleLanguage: parsed.data.subtitleLanguage,
      originalPreserved: true,
      translationIsEvidence: false,
      rtlRequired: parsed.data.rtlRequired,
      providerRequirements: parsed.data.providerRequirements,
      assetRequirements: parsed.data.assetRequirements,
      costRequirements: parsed.data.costRequirements,
      reviewRequirements: parsed.data.reviewRequirements,
      publicSafetyRequirements: parsed.data.publicSafetyRequirements,
      estimatedRuntimeRequirements: parsed.data.estimatedRuntimeRequirements,
      userVisibleReason: parsed.data.userVisibleReason,
      reviewerVisibleReason: parsed.data.reviewerVisibleReason,
      nextStep: parsed.data.nextStep,
      execution: parsed.data.execution,
      createdBy: parsed.data.createdBy?.trim() || userId || null,
      createdAt: parsed.data.createdAt?.trim() || null,
    },
  });

  const status = saved.result.ok ? 200 : 400;
  return NextResponse.json(
    {
      ok: saved.result.ok,
      result: saved.result,
      auditEvent: saved.auditEvent,
      persistence: saved.persistence,
    },
    { status },
  );
}
