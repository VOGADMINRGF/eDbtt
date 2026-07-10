export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_PROVIDER_SELECTION_CANDIDATE_SOURCES,
  VOXY_RENDER_PROVIDER_SELECTION_CANDIDATE_STATUSES,
  VOXY_RENDER_PROVIDER_SELECTION_DRAFT_STATUSES,
  VOXY_RENDER_PROVIDER_SELECTION_NEXT_DECISIONS,
  VOXY_RENDER_PROVIDER_SELECTION_REQUIRED_CAPABILITIES,
} from "@/features/create/voxyRenderProviderSelectionDraftContract";
import {
  getLatestVoxyRenderProviderSelectionDraftRecord,
  getVoxyRenderProviderSelectionPersistenceState,
  listVoxyRenderProviderSelectionDraftAuditEvents,
  listVoxyRenderProviderSelectionDraftRecords,
  persistVoxyRenderProviderSelectionDraft,
} from "@/features/create/voxyRenderProviderSelectionDraftStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const RequestRefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const CandidateEntrySchema = z
  .object({
    candidateId: z.string().trim().min(1).max(200),
    label: z.string().trim().min(1).max(300),
    status: z.enum(VOXY_RENDER_PROVIDER_SELECTION_CANDIDATE_STATUSES),
    statusLabel: z.string().trim().min(1).max(120),
    source: z.enum(VOXY_RENDER_PROVIDER_SELECTION_CANDIDATE_SOURCES),
    sourceLabel: z.string().trim().min(1).max(120),
    providerName: z.string().trim().min(1).max(200).nullable(),
    requiredCapabilities: z.array(z.enum(VOXY_RENDER_PROVIDER_SELECTION_REQUIRED_CAPABILITIES)),
    missingCapabilities: z.array(z.enum(VOXY_RENDER_PROVIDER_SELECTION_REQUIRED_CAPABILITIES)),
    reviewerVisibleReason: z.string().trim().min(1).max(1400),
    userVisibleReason: z.string().trim().min(1).max(1400),
    executionAllowed: z.literal(false),
    providerCalled: z.literal(false),
    secretsAccessed: z.literal(false),
    pricingClaimAllowed: z.literal(false),
    renderSafe: z.literal(false),
  })
  .strict();

const DecisionSchema = z
  .object({
    nextProviderDecision: z.enum(VOXY_RENDER_PROVIDER_SELECTION_NEXT_DECISIONS),
    userVisibleReason: z.string().trim().min(1).max(1200),
    reviewerVisibleReason: z.string().trim().min(1).max(1200),
    nextStep: z.string().trim().min(1).max(500),
  })
  .strict();

const ExecutionSchema = z
  .object({
    providerExecutionAllowed: z.literal(false),
    providerCalled: z.literal(false),
    secretsAccessed: z.literal(false),
    pricingClaimAllowed: z.literal(false),
    queueEnabled: z.literal(false),
    createsQueueJob: z.literal(false),
    workerExecutionAllowed: z.literal(false),
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
    providerSelectionDraftId: z.string().trim().min(1).max(200),
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
    providerSelectionStatus: z.enum(VOXY_RENDER_PROVIDER_SELECTION_DRAFT_STATUSES),
    candidates: z.array(CandidateEntrySchema),
    inventoryFindings: z.array(z.string().trim().min(1).max(1400)),
    gateHints: z.array(z.string().trim().min(1).max(2000)),
    blockers: z.array(z.string().trim().min(1).max(1400)),
    decision: DecisionSchema,
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
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderProviderSelectionDraftRecords({
      decisionGateId,
      decisionId,
      requestDraftId,
      queuePreviewId,
      costPolicyPreviewId,
      assetPackDraftId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    decisionGateId
      ? getLatestVoxyRenderProviderSelectionDraftRecord(decisionGateId)
      : Promise.resolve(null),
    decisionGateId
      ? listVoxyRenderProviderSelectionDraftAuditEvents({ decisionGateId, decisionId, limit })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ok: true,
    records,
    latestRecord,
    auditEvents,
    persistence: getVoxyRenderProviderSelectionPersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_voxy_render_provider_selection_draft_command" },
      { status: 400 },
    );
  }

  const userId = gate?._id?.toHexString?.() ?? "";
  const saved = await persistVoxyRenderProviderSelectionDraft({
    command: {
      providerSelectionDraftId: parsed.data.providerSelectionDraftId,
      assetPackDraftId: parsed.data.assetPackDraftId,
      costPolicyPreviewId: parsed.data.costPolicyPreviewId,
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
      videoFormat: parsed.data.videoFormat,
      sourceLanguage: parsed.data.sourceLanguage,
      readingLanguage: parsed.data.readingLanguage,
      scriptLanguage: parsed.data.scriptLanguage,
      renderLanguage: parsed.data.renderLanguage,
      subtitleLanguage: parsed.data.subtitleLanguage,
      originalPreserved: true,
      translationIsEvidence: false,
      rtlRequired: parsed.data.rtlRequired,
      surface: parsed.data.surface,
      providerSelectionStatus: parsed.data.providerSelectionStatus,
      candidates: parsed.data.candidates.map((candidate) => ({
        ...candidate,
        providerName: candidate.providerName ?? null,
      })),
      inventoryFindings: parsed.data.inventoryFindings,
      gateHints: parsed.data.gateHints,
      blockers: parsed.data.blockers,
      decision: parsed.data.decision,
      execution: {
        providerExecutionAllowed: false,
        providerCalled: false,
        secretsAccessed: false,
        pricingClaimAllowed: false,
        queueEnabled: false,
        createsQueueJob: false,
        workerExecutionAllowed: false,
        mediaFileCreationAllowed: false,
        costDebitAllowed: false,
        creditDebitAllowed: false,
        uploadAllowed: false,
        publishAllowed: false,
        socialPostAllowed: false,
        schedulingAllowed: false,
        runtimeClaimAllowed: false,
      },
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
