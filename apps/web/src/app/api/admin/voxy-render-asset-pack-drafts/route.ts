export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_ASSET_PACK_NEXT_DECISIONS,
  VOXY_RENDER_ASSET_PACK_DRAFT_STATUSES,
  VOXY_RENDER_ASSET_PACK_ENTRY_KEYS,
  VOXY_RENDER_ASSET_PACK_ENTRY_SOURCES,
  VOXY_RENDER_ASSET_PACK_ENTRY_STATUSES,
} from "@/features/create/voxyRenderAssetPackDraftContract";
import {
  VOXY_RENDER_REQUEST_DRAFT_REQUIREMENT_STATUSES,
} from "@/features/create/voxyRenderRequestDraftContract";
import {
  getLatestVoxyRenderAssetPackDraftRecord,
  getVoxyRenderAssetPackDraftPersistenceState,
  listVoxyRenderAssetPackDraftAuditEvents,
  listVoxyRenderAssetPackDraftRecords,
  persistVoxyRenderAssetPackDraft,
} from "@/features/create/voxyRenderAssetPackDraftStore";
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

const AssetEntrySchema = z
  .object({
    assetKey: z.enum(VOXY_RENDER_ASSET_PACK_ENTRY_KEYS),
    label: z.string().trim().min(1).max(300),
    status: z.enum(VOXY_RENDER_ASSET_PACK_ENTRY_STATUSES),
    statusLabel: z.string().trim().min(1).max(120),
    source: z.enum(VOXY_RENDER_ASSET_PACK_ENTRY_SOURCES),
    sourceLabel: z.string().trim().min(1).max(120),
    publicPath: z.string().trim().min(1).max(500).nullable(),
    reviewerVisibleReason: z.string().trim().min(1).max(1200),
    userVisibleReason: z.string().trim().min(1).max(1200),
    renderSafe: z.literal(false),
    generated: z.literal(false),
    uploaded: z.literal(false),
  })
  .strict();

const ExecutionSchema = z
  .object({
    createsMediaFile: z.literal(false),
    createsSubtitleFile: z.literal(false),
    createsVoiceFile: z.literal(false),
    createsExportPreset: z.literal(false),
    callsProvider: z.literal(false),
    queueEnabled: z.literal(false),
    costDebitAllowed: z.literal(false),
    creditDebitAllowed: z.literal(false),
    uploadAllowed: z.literal(false),
    publishAllowed: z.literal(false),
    runtimeClaimAllowed: z.literal(false),
  })
  .strict();

const BodySchema = z
  .object({
    assetPackDraftId: z.string().trim().min(1).max(200),
    requestDraftId: z.string().trim().min(1).max(200).nullable(),
    queuePreviewId: z.string().trim().min(1).max(200).nullable(),
    costPolicyPreviewId: z.string().trim().min(1).max(200).nullable(),
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
    assetPackStatus: z.enum(VOXY_RENDER_ASSET_PACK_DRAFT_STATUSES),
    assetEntries: z.array(AssetEntrySchema),
    providerRequirements: z.array(RequirementItemSchema),
    assetRequirements: z.array(RequirementItemSchema),
    costRequirements: z.array(RequirementItemSchema),
    blockers: z.array(z.string().trim().min(1).max(1200)),
    evidenceLines: z.array(z.string().trim().min(1).max(1200)),
    nextAssetDecision: z.enum(VOXY_RENDER_ASSET_PACK_NEXT_DECISIONS),
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
  const queuePreviewId = req.nextUrl.searchParams.get("queuePreviewId")?.trim() || null;
  const costPolicyPreviewId = req.nextUrl.searchParams.get("costPolicyPreviewId")?.trim() || null;
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderAssetPackDraftRecords({
      decisionGateId,
      decisionId,
      requestDraftId,
      queuePreviewId,
      costPolicyPreviewId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    decisionGateId
      ? getLatestVoxyRenderAssetPackDraftRecord(decisionGateId)
      : Promise.resolve(null),
    decisionGateId
      ? listVoxyRenderAssetPackDraftAuditEvents({ decisionGateId, decisionId, limit })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ok: true,
    records,
    latestRecord,
    auditEvents,
    persistence: getVoxyRenderAssetPackDraftPersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_voxy_render_asset_pack_draft_command" },
      { status: 400 },
    );
  }

  const userId = gate?._id?.toHexString?.() ?? "";
  const saved = await persistVoxyRenderAssetPackDraft({
    command: {
      assetPackDraftId: parsed.data.assetPackDraftId,
      requestDraftId: parsed.data.requestDraftId,
      queuePreviewId: parsed.data.queuePreviewId,
      costPolicyPreviewId: parsed.data.costPolicyPreviewId,
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
      assetPackStatus: parsed.data.assetPackStatus,
      assetEntries: parsed.data.assetEntries.map((item) => ({
        assetKey: item.assetKey,
        label: item.label,
        status: item.status,
        statusLabel: item.statusLabel,
        source: item.source,
        sourceLabel: item.sourceLabel,
        publicPath: item.publicPath ?? null,
        reviewerVisibleReason: item.reviewerVisibleReason,
        userVisibleReason: item.userVisibleReason,
        renderSafe: false,
        generated: false,
        uploaded: false,
      })),
      providerRequirements: parsed.data.providerRequirements,
      assetRequirements: parsed.data.assetRequirements,
      costRequirements: parsed.data.costRequirements,
      blockers: parsed.data.blockers,
      evidenceLines: parsed.data.evidenceLines,
      nextAssetDecision: parsed.data.nextAssetDecision,
      userVisibleReason: parsed.data.userVisibleReason,
      reviewerVisibleReason: parsed.data.reviewerVisibleReason,
      nextStep: parsed.data.nextStep,
      execution: {
        createsMediaFile: false,
        createsSubtitleFile: false,
        createsVoiceFile: false,
        createsExportPreset: false,
        callsProvider: false,
        queueEnabled: false,
        costDebitAllowed: false,
        creditDebitAllowed: false,
        uploadAllowed: false,
        publishAllowed: false,
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
