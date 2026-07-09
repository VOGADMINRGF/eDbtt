export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  VOXY_RENDER_REVIEW_DECISION_OPTIONS,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import {
  getLatestVoxyRenderDecisionRecord,
  getVoxyRenderDecisionPersistenceState,
  listVoxyRenderDecisionAuditEvents,
  listVoxyRenderDecisionRecords,
  persistVoxyRenderDecision,
} from "@/features/create/voxyRenderDecisionPersistenceStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const DecisionRefSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    href: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();

const BodySchema = z
  .object({
    decisionId: z.string().trim().min(1).max(200).nullable().optional(),
    decisionGateId: z.string().trim().min(1).max(200),
    contributionRef: DecisionRefSchema.nullable(),
    dossierRef: DecisionRefSchema.nullable(),
    scriptRef: DecisionRefSchema.nullable(),
    handoffRef: DecisionRefSchema.nullable(),
    preflightRef: DecisionRefSchema.nullable(),
    registryRef: DecisionRefSchema.nullable(),
    adapterRef: DecisionRefSchema.nullable(),
    selectedDecision: z.enum(VOXY_RENDER_REVIEW_DECISION_OPTIONS),
    reviewerNote: z.string().trim().max(600).nullable(),
    reviewerRole: z.string().trim().max(120).nullable(),
    sourceLanguage: z.string().trim().min(1).max(20),
    readingLanguage: z.string().trim().min(1).max(20),
    scriptLanguage: z.string().trim().min(1).max(20),
    renderLanguage: z.string().trim().min(1).max(20),
    subtitleLanguage: z.string().trim().min(1).max(20).nullable(),
    originalPreserved: z.literal(true),
    translationIsEvidence: z.literal(false),
    rtlDecisionHint: z.string().trim().max(500).nullable(),
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
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderDecisionRecords({
      decisionGateId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    decisionGateId ? getLatestVoxyRenderDecisionRecord(decisionGateId) : Promise.resolve(null),
    decisionGateId
      ? listVoxyRenderDecisionAuditEvents({ decisionGateId, limit })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ok: true,
    records,
    latestRecord,
    auditEvents,
    persistence: getVoxyRenderDecisionPersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_voxy_render_decision_command" }, { status: 400 });
  }

  const userId = gate?._id?.toHexString?.() ?? "";
  const saved = await persistVoxyRenderDecision({
    command: {
      decisionId: parsed.data.decisionId ?? null,
      decisionGateId: parsed.data.decisionGateId,
      contributionRef: parsed.data.contributionRef,
      dossierRef: parsed.data.dossierRef,
      scriptRef: parsed.data.scriptRef,
      handoffRef: parsed.data.handoffRef,
      preflightRef: parsed.data.preflightRef,
      registryRef: parsed.data.registryRef,
      adapterRef: parsed.data.adapterRef,
      selectedDecision: parsed.data.selectedDecision,
      reviewerNote: parsed.data.reviewerNote,
      reviewerRole: parsed.data.reviewerRole,
      sourceLanguage: parsed.data.sourceLanguage,
      readingLanguage: parsed.data.readingLanguage,
      scriptLanguage: parsed.data.scriptLanguage,
      renderLanguage: parsed.data.renderLanguage,
      subtitleLanguage: parsed.data.subtitleLanguage,
      originalPreserved: true,
      translationIsEvidence: false,
      rtlDecisionHint: parsed.data.rtlDecisionHint,
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
