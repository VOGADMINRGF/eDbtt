export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_DECISION_RECORD_STATUSES,
} from "@/features/create/voxyRenderDecisionPersistenceContract";
import {
  VOXY_RENDER_REQUEST_DRAFT_REQUIREMENT_STATUSES,
  VOXY_RENDER_REQUEST_DRAFT_STATUSES,
} from "@/features/create/voxyRenderRequestDraftContract";
import {
  getLatestVoxyRenderRequestDraftRecord,
  getVoxyRenderRequestDraftPersistenceState,
  listVoxyRenderRequestDraftAuditEvents,
  listVoxyRenderRequestDraftRecords,
  persistVoxyRenderRequestDraft,
} from "@/features/create/voxyRenderRequestDraftStore";
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
    createsRenderJob: z.literal(false),
    queueAllowed: z.literal(false),
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
    requestDraftId: z.string().trim().min(1).max(200),
    decisionId: z.string().trim().min(1).max(200).nullable(),
    decisionGateId: z.string().trim().min(1).max(200),
    surface: z.enum(["create", "account", "admin", "workspace"]),
    contributionRef: RequestRefSchema.nullable(),
    dossierRef: RequestRefSchema.nullable(),
    scriptRef: RequestRefSchema.nullable(),
    handoffRef: RequestRefSchema.nullable(),
    preflightRef: RequestRefSchema.nullable(),
    registryRef: RequestRefSchema.nullable(),
    adapterRef: RequestRefSchema.nullable(),
    videoFormat: z.literal("briefing_video"),
    requestStatus: z.enum(VOXY_RENDER_REQUEST_DRAFT_STATUSES),
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
    sourceFactcheckRequirements: z.array(RequirementItemSchema),
    reviewerNote: z.string().trim().max(600).nullable(),
    userVisibleReason: z.string().trim().min(1).max(1200),
    reviewerVisibleReason: z.string().trim().min(1).max(1200),
    nextStep: z.string().trim().min(1).max(500),
    decisionStatusSnapshot: z.enum(VOXY_RENDER_DECISION_RECORD_STATUSES).nullable(),
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
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderRequestDraftRecords({
      decisionGateId,
      decisionId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    decisionGateId ? getLatestVoxyRenderRequestDraftRecord(decisionGateId) : Promise.resolve(null),
    decisionGateId
      ? listVoxyRenderRequestDraftAuditEvents({ decisionGateId, decisionId, limit })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ok: true,
    records,
    latestRecord,
    auditEvents,
    persistence: getVoxyRenderRequestDraftPersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_voxy_render_request_draft_command" },
      { status: 400 },
    );
  }

  const userId = gate?._id?.toHexString?.() ?? "";
  const saved = await persistVoxyRenderRequestDraft({
    command: {
      requestDraftId: parsed.data.requestDraftId,
      decisionId: parsed.data.decisionId,
      decisionGateId: parsed.data.decisionGateId,
      surface: parsed.data.surface,
      contributionRef: parsed.data.contributionRef,
      dossierRef: parsed.data.dossierRef,
      scriptRef: parsed.data.scriptRef,
      handoffRef: parsed.data.handoffRef,
      preflightRef: parsed.data.preflightRef,
      registryRef: parsed.data.registryRef,
      adapterRef: parsed.data.adapterRef,
      videoFormat: parsed.data.videoFormat,
      requestStatus: parsed.data.requestStatus,
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
      sourceFactcheckRequirements: parsed.data.sourceFactcheckRequirements,
      reviewerNote: parsed.data.reviewerNote,
      userVisibleReason: parsed.data.userVisibleReason,
      reviewerVisibleReason: parsed.data.reviewerVisibleReason,
      nextStep: parsed.data.nextStep,
      decisionStatusSnapshot: parsed.data.decisionStatusSnapshot,
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
