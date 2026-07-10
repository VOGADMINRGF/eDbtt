export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { VOXY_PLANS } from "@/features/voxy/accessContract";
import {
  VOXY_RENDER_COST_CREDIT_ACCOUNT_CONTEXT_STATUSES,
  VOXY_RENDER_COST_CREDIT_NEXT_DECISIONS,
  VOXY_RENDER_COST_CREDIT_POLICY_STATUSES,
  VOXY_RENDER_COST_ESTIMATE_STATUSES,
  VOXY_RENDER_CREDIT_POLICY_STATUSES,
  VOXY_RENDER_LIMIT_POLICY_STATUSES,
  VOXY_RENDER_PROVIDER_PRICING_STATUSES,
  VOXY_RENDER_RUNTIME_METERING_STATUSES,
} from "@/features/create/voxyRenderCostCreditPolicyContract";
import {
  VOXY_RENDER_REQUEST_DRAFT_REQUIREMENT_STATUSES,
} from "@/features/create/voxyRenderRequestDraftContract";
import {
  getLatestVoxyRenderCostCreditPolicyRecord,
  getVoxyRenderCostCreditPolicyPersistenceState,
  listVoxyRenderCostCreditPolicyAuditEvents,
  listVoxyRenderCostCreditPolicyRecords,
  persistVoxyRenderCostCreditPolicy,
} from "@/features/create/voxyRenderCostCreditPolicyStore";
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

const AccountContextSchema = z
  .object({
    status: z.enum(VOXY_RENDER_COST_CREDIT_ACCOUNT_CONTEXT_STATUSES),
    label: z.string().trim().min(1).max(600),
    planKey: z.enum(VOXY_PLANS).nullable(),
    planLabel: z.string().trim().min(1).max(120).nullable(),
    capabilityLabels: z.array(z.string().trim().min(1).max(120)),
    contributionCredits: z.number().finite().nullable(),
    monthlyContributionLimit: z.number().finite().nullable(),
    nextCreditIn: z.number().finite().nullable(),
    creditRequiredForContribution: z.boolean().nullable(),
    evidence: z.array(z.string().trim().min(1).max(600)),
  })
  .strict();

const ExecutionSchema = z
  .object({
    billingRuntimeAvailable: z.literal(false),
    costDebitAllowed: z.literal(false),
    creditDebitAllowed: z.literal(false),
    invoiceAllowed: z.literal(false),
    paymentAllowed: z.literal(false),
    queueEnabled: z.literal(false),
    createsQueueJob: z.literal(false),
    workerExecutionAllowed: z.literal(false),
    providerExecutionAllowed: z.literal(false),
    mediaFileCreationAllowed: z.literal(false),
    uploadAllowed: z.literal(false),
    publishAllowed: z.literal(false),
    socialPostAllowed: z.literal(false),
    schedulingAllowed: z.literal(false),
    runtimeClaimAllowed: z.literal(false),
  })
  .strict();

const BodySchema = z
  .object({
    policyPreviewId: z.string().trim().min(1).max(200),
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
    accountRef: RequestRefSchema.nullable(),
    surface: z.enum(["create", "account", "admin", "workspace"]),
    videoFormat: z.literal("briefing_video"),
    policyStatus: z.enum(VOXY_RENDER_COST_CREDIT_POLICY_STATUSES),
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
    runtimeRequirements: z.array(RequirementItemSchema),
    costEstimateStatus: z.enum(VOXY_RENDER_COST_ESTIMATE_STATUSES),
    estimatedCostAmount: z.number().finite().nullable(),
    currency: z.string().trim().min(1).max(20).nullable(),
    costClaimAllowed: z.literal(false),
    costDebitAllowed: z.literal(false),
    invoiceAllowed: z.literal(false),
    creditStatus: z.enum(VOXY_RENDER_CREDIT_POLICY_STATUSES),
    creditsRequired: z.number().finite().nullable(),
    creditsAvailable: z.number().finite().nullable(),
    creditDebitAllowed: z.literal(false),
    limitStatus: z.enum(VOXY_RENDER_LIMIT_POLICY_STATUSES),
    perAccountLimit: z.number().finite().nullable(),
    perDayLimit: z.number().finite().nullable(),
    perDossierLimit: z.number().finite().nullable(),
    perProviderLimit: z.number().finite().nullable(),
    limitApprovalAllowed: z.literal(false),
    accountContext: AccountContextSchema,
    providerPricingStatus: z.enum(VOXY_RENDER_PROVIDER_PRICING_STATUSES),
    providerPricingLabel: z.string().trim().min(1).max(600),
    runtimeMeteringStatus: z.enum(VOXY_RENDER_RUNTIME_METERING_STATUSES),
    runtimeMeteringLabel: z.string().trim().min(1).max(600),
    policyEvidence: z.array(z.string().trim().min(1).max(600)),
    nextPolicyDecision: z.enum(VOXY_RENDER_COST_CREDIT_NEXT_DECISIONS),
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
  const queuePreviewId = req.nextUrl.searchParams.get("queuePreviewId")?.trim() || null;
  const requestDraftId = req.nextUrl.searchParams.get("requestDraftId")?.trim() || null;
  const contributionRefId = req.nextUrl.searchParams.get("contributionRefId")?.trim() || null;
  const dossierRefId = req.nextUrl.searchParams.get("dossierRefId")?.trim() || null;
  const limit = parseLimit(req);

  const [records, latestRecord, auditEvents] = await Promise.all([
    listVoxyRenderCostCreditPolicyRecords({
      decisionGateId,
      decisionId,
      queuePreviewId,
      requestDraftId,
      contributionRefId,
      dossierRefId,
      limit,
    }),
    decisionGateId
      ? getLatestVoxyRenderCostCreditPolicyRecord(decisionGateId)
      : Promise.resolve(null),
    decisionGateId
      ? listVoxyRenderCostCreditPolicyAuditEvents({ decisionGateId, decisionId, limit })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ok: true,
    records,
    latestRecord,
    auditEvents,
    persistence: getVoxyRenderCostCreditPolicyPersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_voxy_render_cost_credit_policy_command" },
      { status: 400 },
    );
  }

  const userId = gate?._id?.toHexString?.() ?? "";
  const saved = await persistVoxyRenderCostCreditPolicy({
    command: {
      policyPreviewId: parsed.data.policyPreviewId,
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
      accountRef: parsed.data.accountRef,
      surface: parsed.data.surface,
      videoFormat: parsed.data.videoFormat,
      policyStatus: parsed.data.policyStatus,
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
      runtimeRequirements: parsed.data.runtimeRequirements,
      costEstimateStatus: parsed.data.costEstimateStatus,
      estimatedCostAmount: parsed.data.estimatedCostAmount,
      currency: parsed.data.currency,
      costClaimAllowed: false,
      costDebitAllowed: false,
      invoiceAllowed: false,
      creditStatus: parsed.data.creditStatus,
      creditsRequired: parsed.data.creditsRequired,
      creditsAvailable: parsed.data.creditsAvailable,
      creditDebitAllowed: false,
      limitStatus: parsed.data.limitStatus,
      perAccountLimit: parsed.data.perAccountLimit,
      perDayLimit: parsed.data.perDayLimit,
      perDossierLimit: parsed.data.perDossierLimit,
      perProviderLimit: parsed.data.perProviderLimit,
      limitApprovalAllowed: false,
      accountContext: {
        status: parsed.data.accountContext.status,
        label: parsed.data.accountContext.label,
        planKey: parsed.data.accountContext.planKey,
        planLabel: parsed.data.accountContext.planLabel,
        capabilityLabels: parsed.data.accountContext.capabilityLabels,
        contributionCredits: parsed.data.accountContext.contributionCredits,
        monthlyContributionLimit: parsed.data.accountContext.monthlyContributionLimit,
        nextCreditIn: parsed.data.accountContext.nextCreditIn,
        creditRequiredForContribution: parsed.data.accountContext.creditRequiredForContribution,
        evidence: parsed.data.accountContext.evidence,
      },
      providerPricingStatus: parsed.data.providerPricingStatus,
      providerPricingLabel: parsed.data.providerPricingLabel,
      runtimeMeteringStatus: parsed.data.runtimeMeteringStatus,
      runtimeMeteringLabel: parsed.data.runtimeMeteringLabel,
      policyEvidence: parsed.data.policyEvidence,
      nextPolicyDecision: parsed.data.nextPolicyDecision,
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
