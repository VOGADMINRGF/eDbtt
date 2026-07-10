import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { V3VoxyCocreationDialogModel } from "@/features/create/voxyCocreationDialogContract";
import type {
  VoxyRenderPersistedDecisionRecord,
} from "@/features/create/voxyRenderDecisionPersistenceContract";
import type {
  VoxyRenderProviderHandoffModel,
} from "@/features/create/voxyRenderProviderHandoffContract";
import type {
  VoxyRenderPreflightReadinessModel,
} from "@/features/create/voxyRenderPreflightReadinessContract";
import type {
  VoxyRenderAssetProviderRegistryModel,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import type {
  VoxyRenderAdapterNoopModel,
} from "@/features/create/voxyRenderAdapterNoopContract";
import type {
  VoxyRenderReviewDecisionGateModel,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import type {
  VoxyRenderQueuePreviewRecord,
} from "@/features/create/voxyRenderQueueContract";
import type {
  VoxyRenderRequestDraftRecord,
  VoxyRenderRequestDraftRequirementItem,
} from "@/features/create/voxyRenderRequestDraftContract";
import {
  buildVoxyRenderAdapterNoopFromCreateCandidatePreview,
  buildVoxyRenderAdapterNoopFromReviewContext,
  buildVoxyRenderAdapterNoopFromVoxyDialog,
} from "@/features/create/voxyRenderAdapterNoopContract";
import {
  buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview,
  buildVoxyRenderAssetProviderRegistryFromReviewContext,
  buildVoxyRenderAssetProviderRegistryFromVoxyDialog,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import {
  buildVoxyRenderPreflightReadinessFromCreateCandidatePreview,
  buildVoxyRenderPreflightReadinessFromReviewContext,
  buildVoxyRenderPreflightReadinessFromVoxyDialog,
} from "@/features/create/voxyRenderPreflightReadinessContract";
import {
  buildVoxyRenderProviderHandoffFromCreateCandidatePreview,
  buildVoxyRenderProviderHandoffFromReviewContext,
  buildVoxyRenderProviderHandoffFromVoxyDialog,
} from "@/features/create/voxyRenderProviderHandoffContract";
import {
  buildVoxyRenderQueuePreviewFromCreateCandidatePreview,
  buildVoxyRenderQueuePreviewFromReadmodels,
  buildVoxyRenderQueuePreviewFromReviewContext,
  buildVoxyRenderQueuePreviewFromVoxyDialog,
} from "@/features/create/voxyRenderQueueContract";
import {
  buildVoxyRenderRequestDraftFromCreateCandidatePreview,
  buildVoxyRenderRequestDraftFromReadmodels,
  buildVoxyRenderRequestDraftFromReviewContext,
  buildVoxyRenderRequestDraftFromVoxyDialog,
} from "@/features/create/voxyRenderRequestDraftContract";
import {
  buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview,
  buildVoxyRenderReviewDecisionGateFromReviewContext,
  buildVoxyRenderReviewDecisionGateFromVoxyDialog,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import {
  getVoxyCapabilitiesForPlan,
  type VoxyPlan,
} from "@/features/voxy/accessContract";

export const VOXY_RENDER_COST_CREDIT_POLICY_STATUSES = [
  "policy_preview_only",
  "noop_billing",
  "needs_cost_policy",
  "needs_credit_policy",
  "needs_limit_policy",
  "needs_account_context",
  "needs_provider_pricing",
  "needs_runtime_metering",
  "blocked_by_missing_request_draft",
  "blocked_by_missing_queue_contract",
  "blocked_by_missing_provider",
  "blocked_by_missing_assets",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderCostCreditPolicyStatus =
  (typeof VOXY_RENDER_COST_CREDIT_POLICY_STATUSES)[number];

export const VOXY_RENDER_COST_CREDIT_POLICY_STORE_RESULT_STATUSES = [
  "preview_only",
  "noop",
  "blocked",
] as const;

export type VoxyRenderCostCreditPolicyStoreResultStatus =
  (typeof VOXY_RENDER_COST_CREDIT_POLICY_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_COST_CREDIT_POLICY_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderCostCreditPolicyPersistenceMode =
  (typeof VOXY_RENDER_COST_CREDIT_POLICY_PERSISTENCE_MODES)[number];

export const VOXY_RENDER_COST_ESTIMATE_STATUSES = [
  "not_available",
  "provider_pricing_needed",
  "estimate_not_claimed",
  "blocked",
] as const;

export type VoxyRenderCostEstimateStatus =
  (typeof VOXY_RENDER_COST_ESTIMATE_STATUSES)[number];

export const VOXY_RENDER_CREDIT_POLICY_STATUSES = [
  "not_available",
  "credit_policy_needed",
  "account_context_needed",
  "limit_check_needed",
  "blocked",
] as const;

export type VoxyRenderCreditPolicyStatus =
  (typeof VOXY_RENDER_CREDIT_POLICY_STATUSES)[number];

export const VOXY_RENDER_LIMIT_POLICY_STATUSES = [
  "not_available",
  "limit_policy_needed",
  "runtime_metering_needed",
  "account_context_needed",
  "blocked",
] as const;

export type VoxyRenderLimitPolicyStatus =
  (typeof VOXY_RENDER_LIMIT_POLICY_STATUSES)[number];

export const VOXY_RENDER_COST_CREDIT_NEXT_DECISIONS = [
  "define_cost_policy",
  "define_credit_policy",
  "define_limit_policy",
  "attach_account_context",
  "configure_provider_pricing",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderCostCreditNextDecision =
  (typeof VOXY_RENDER_COST_CREDIT_NEXT_DECISIONS)[number];

export const VOXY_RENDER_COST_CREDIT_ACCOUNT_CONTEXT_STATUSES = [
  "not_available",
  "surface_scope_only",
  "plan_only",
  "entitlement_snapshot",
] as const;

export type VoxyRenderCostCreditAccountContextStatus =
  (typeof VOXY_RENDER_COST_CREDIT_ACCOUNT_CONTEXT_STATUSES)[number];

export const VOXY_RENDER_PROVIDER_PRICING_STATUSES = [
  "not_available",
  "provider_interface_only",
  "available",
] as const;

export type VoxyRenderProviderPricingStatus =
  (typeof VOXY_RENDER_PROVIDER_PRICING_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_METERING_STATUSES = [
  "not_available",
  "runtime_required",
  "available",
] as const;

export type VoxyRenderRuntimeMeteringStatus =
  (typeof VOXY_RENDER_RUNTIME_METERING_STATUSES)[number];

type PolicySurface = "create" | "account" | "admin" | "workspace";

type PolicyRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyRenderCostCreditPolicyAccountContext = {
  status: VoxyRenderCostCreditAccountContextStatus;
  label: string;
  planKey: VoxyPlan | null;
  planLabel: string | null;
  capabilityLabels: string[];
  contributionCredits: number | null;
  monthlyContributionLimit: number | null;
  nextCreditIn: number | null;
  creditRequiredForContribution: boolean | null;
  evidence: string[];
};

export type VoxyRenderCostCreditPolicyInputs = {
  providerPricing?: {
    status: "missing" | "available";
    label?: string | null;
    estimatedCostAmount?: number | null;
    currency?: string | null;
    evidence?: string[];
  } | null;
  creditPolicy?: {
    status: "missing" | "available";
    label?: string | null;
    creditsRequired?: number | null;
    creditsAvailable?: number | null;
    evidence?: string[];
  } | null;
  limitPolicy?: {
    status: "missing" | "available";
    label?: string | null;
    perAccountLimit?: number | null;
    perDayLimit?: number | null;
    perDossierLimit?: number | null;
    perProviderLimit?: number | null;
    evidence?: string[];
  } | null;
  runtimeMetering?: {
    status: "missing" | "available";
    label?: string | null;
    evidence?: string[];
  } | null;
};

export type VoxyRenderCostCreditPolicyExecutionFlags = {
  billingRuntimeAvailable: false;
  costDebitAllowed: false;
  creditDebitAllowed: false;
  invoiceAllowed: false;
  paymentAllowed: false;
  queueEnabled: false;
  createsQueueJob: false;
  workerExecutionAllowed: false;
  providerExecutionAllowed: false;
  mediaFileCreationAllowed: false;
  uploadAllowed: false;
  publishAllowed: false;
  socialPostAllowed: false;
  schedulingAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderCostCreditPolicyPreviewRecord = {
  policyPreviewId: string;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  handoffRef: PolicyRef | null;
  preflightRef: PolicyRef | null;
  registryRef: PolicyRef | null;
  adapterRef: PolicyRef | null;
  scriptRef: PolicyRef | null;
  contributionRef: PolicyRef | null;
  dossierRef: PolicyRef | null;
  accountRef: PolicyRef | null;
  surface: PolicySurface;
  videoFormat: "briefing_video";
  policyStatus: VoxyRenderCostCreditPolicyStatus;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlRequired: boolean;
  providerRequirements: VoxyRenderRequestDraftRequirementItem[];
  assetRequirements: VoxyRenderRequestDraftRequirementItem[];
  costRequirements: VoxyRenderRequestDraftRequirementItem[];
  runtimeRequirements: VoxyRenderRequestDraftRequirementItem[];
  costEstimateStatus: VoxyRenderCostEstimateStatus;
  estimatedCostAmount: number | null;
  currency: string | null;
  costClaimAllowed: false;
  costDebitAllowed: false;
  invoiceAllowed: false;
  creditStatus: VoxyRenderCreditPolicyStatus;
  creditsRequired: number | null;
  creditsAvailable: number | null;
  creditDebitAllowed: false;
  limitStatus: VoxyRenderLimitPolicyStatus;
  perAccountLimit: number | null;
  perDayLimit: number | null;
  perDossierLimit: number | null;
  perProviderLimit: number | null;
  limitApprovalAllowed: false;
  accountContext: VoxyRenderCostCreditPolicyAccountContext;
  providerPricingStatus: VoxyRenderProviderPricingStatus;
  providerPricingLabel: string;
  runtimeMeteringStatus: VoxyRenderRuntimeMeteringStatus;
  runtimeMeteringLabel: string;
  policyEvidence: string[];
  nextPolicyDecision: VoxyRenderCostCreditNextDecision;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
  execution: VoxyRenderCostCreditPolicyExecutionFlags;
  persistedAt: string | null;
  persistedBy: string | null;
  idempotencyKey: string | null;
  previousPolicyPreviewRef: string | null;
  supersedesPolicyPreviewRef: string | null;
  policyVersion: number | null;
};

export type VoxyRenderCostCreditPolicyPreviewCommand = Omit<
  VoxyRenderCostCreditPolicyPreviewRecord,
  "persistedAt" | "persistedBy" | "idempotencyKey" | "previousPolicyPreviewRef" | "supersedesPolicyPreviewRef" | "policyVersion"
> & {
  createdAt: string | null;
  createdBy: string | null;
};

export type VoxyRenderCostCreditPolicyStoreResult = {
  ok: boolean;
  status: VoxyRenderCostCreditPolicyStoreResultStatus;
  record: VoxyRenderCostCreditPolicyPreviewRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: string;
};

export type VoxyRenderCostCreditPolicyPersistenceState = {
  mode: VoxyRenderCostCreditPolicyPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyRenderCostCreditPolicyRepository";
  storeKind: "mongo_collection" | "in_memory" | "none";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "server_only_only" | "not_available";
};

export type VoxyRenderCostCreditPolicyPanelModel = {
  title: string;
  summary: string;
  preview: VoxyRenderCostCreditPolicyPreviewRecord;
  policyStatusLabel: string;
  costStatusLabel: string;
  creditStatusLabel: string;
  limitStatusLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    policyPreviewId: string;
    statusLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    policyVersion: number | null;
    queuePreviewId: string | null;
  } | null;
  blockedReasons: string[];
  evidenceLines: string[];
  auditLines: string[];
  nextStep: string;
  executionFlags: VoxyRenderCostCreditPolicyExecutionFlags;
};

type BuildPolicyPreviewInput = {
  surface: PolicySurface;
  queuePreview?: VoxyRenderQueuePreviewRecord | null;
  allowQueuePreviewSynthesis?: boolean;
  requestDraft?: VoxyRenderRequestDraftRecord | null;
  allowRequestDraftSynthesis?: boolean;
  latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  handoffModel?: VoxyRenderProviderHandoffModel | null;
  preflightModel?: VoxyRenderPreflightReadinessModel | null;
  registryModel?: VoxyRenderAssetProviderRegistryModel | null;
  adapterModel?: VoxyRenderAdapterNoopModel | null;
  accountContext?: Partial<VoxyRenderCostCreditPolicyAccountContext> & {
    accountRef?: PolicyRef | null;
  };
  policyInputs?: VoxyRenderCostCreditPolicyInputs | null;
  persistedAt?: string | null;
  persistedBy?: string | null;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => normalizeText(value)).filter(Boolean)));
}

function sanitizeIdFragment(value: string) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function requirementStatusLabel(value: VoxyRenderRequestDraftRequirementItem["status"]) {
  if (value === "ready") return "Bereit";
  if (value === "needs_review") return "Review nötig";
  if (value === "requirement_only") return "Nur Anforderung";
  if (value === "missing") return "Fehlt";
  return "Blockiert";
}

function buildRequirementItem(input: {
  id: string;
  label: string;
  status: VoxyRenderRequestDraftRequirementItem["status"];
  reason: string;
}) {
  return {
    id: input.id,
    label: input.label,
    status: input.status,
    statusLabel: requirementStatusLabel(input.status),
    reason: normalizeText(input.reason) || "Policy-Anforderung bleibt offen.",
  } satisfies VoxyRenderRequestDraftRequirementItem;
}

function defaultPersistenceState(): VoxyRenderCostCreditPolicyPersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Cost-/Credit-Policy-Store im Surface",
    summary:
      "Dieses Surface zeigt nur eine Noop-Lesart für Kosten-, Credit- und Limit-Prüfungen. Es gibt bewusst keine Billing-Runtime.",
    repositoryInterface: "VoxyRenderCostCreditPolicyRepository",
    storeKind: "none",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "not_available",
  };
}

function voxyPlanLabel(plan: VoxyPlan) {
  if (plan === "public") return "Public";
  if (plan === "member") return "Member";
  if (plan === "author_plus") return "Author Plus";
  if (plan === "partner") return "Partner";
  if (plan === "operator") return "Operator";
  return "Admin";
}

function voxyCapabilityLabel(value: string) {
  if (value === "voxy_visual_brief_generate") return "Visual Brief Generate";
  if (value === "voxy_draft_export") return "Draft Export";
  if (value === "voxy_cocreation_full") return "Co-Creation";
  if (value === "voxy_editorial_review") return "Editorial Review";
  if (value === "voxy_publish_prepare") return "Publish Prepare";
  return value.replace(/_/g, " ");
}

export function buildVoxyRenderCostCreditPolicyAccountContextFromPlan(
  plan: VoxyPlan,
  options?: {
    label?: string | null;
    contributionCredits?: number | null;
    monthlyContributionLimit?: number | null;
    nextCreditIn?: number | null;
    creditRequiredForContribution?: boolean | null;
    evidence?: string[];
  },
): VoxyRenderCostCreditPolicyAccountContext {
  return {
    status: "plan_only",
    label:
      normalizeText(options?.label) ||
      `Nur Plan-/Capability-Matrix vorhanden (${voxyPlanLabel(plan)}), keine abrechenbare Billing-Runtime.`,
    planKey: plan,
    planLabel: voxyPlanLabel(plan),
    capabilityLabels: getVoxyCapabilitiesForPlan(plan).map(voxyCapabilityLabel),
    contributionCredits: options?.contributionCredits ?? null,
    monthlyContributionLimit: options?.monthlyContributionLimit ?? null,
    nextCreditIn: options?.nextCreditIn ?? null,
    creditRequiredForContribution: options?.creditRequiredForContribution ?? null,
    evidence: uniqueStrings([
      ...(options?.evidence ?? []),
      "Voxy-Capability-Matrix aus dem Repo ist vorhanden, aber keine Render-Billing-Wahrheit.",
    ]),
  };
}

function buildDefaultAccountContext(
  surface: PolicySurface,
  input?: BuildPolicyPreviewInput["accountContext"],
) {
  const planKey = input?.planKey ?? null;
  const planLabel = planKey ? voxyPlanLabel(planKey) : null;
  const capabilityLabels =
    Array.isArray(input?.capabilityLabels) && input?.capabilityLabels.length > 0
      ? input.capabilityLabels
      : planKey
        ? getVoxyCapabilitiesForPlan(planKey).map(voxyCapabilityLabel)
        : [];
  const status =
    input?.status ??
    (surface === "admin" || surface === "workspace"
      ? "surface_scope_only"
      : "not_available");
  return {
    status,
    label:
      normalizeText(input?.label) ||
      (status === "surface_scope_only"
        ? "Nur Review-/Workspace-Kontext vorhanden, kein belastbarer Account- oder Billing-Kontext."
        : "Kein belastbarer Account-, Credit- oder Limit-Kontext im Surface vorhanden."),
    planKey,
    planLabel,
    capabilityLabels,
    contributionCredits: input?.contributionCredits ?? null,
    monthlyContributionLimit: input?.monthlyContributionLimit ?? null,
    nextCreditIn: input?.nextCreditIn ?? null,
    creditRequiredForContribution: input?.creditRequiredForContribution ?? null,
    evidence: uniqueStrings(
      input?.evidence ??
        (status === "surface_scope_only"
          ? ["Surface-Kontext ist bekannt, aber nicht als Billing-Wahrheit belastbar."]
          : ["Ohne Account-/Entitlement-Kontext kann keine Credit- oder Limit-Prüfung behauptet werden."]),
    ),
  } satisfies VoxyRenderCostCreditPolicyAccountContext;
}

export function voxyRenderCostCreditPolicyStatusLabel(value: VoxyRenderCostCreditPolicyStatus) {
  if (value === "policy_preview_only") return "Policy-Vorschau";
  if (value === "noop_billing") return "Noop Billing";
  if (value === "needs_cost_policy") return "Cost-Policy fehlt";
  if (value === "needs_credit_policy") return "Credit-Policy fehlt";
  if (value === "needs_limit_policy") return "Limit-Policy fehlt";
  if (value === "needs_account_context") return "Account-Kontext fehlt";
  if (value === "needs_provider_pricing") return "Provider-Pricing fehlt";
  if (value === "needs_runtime_metering") return "Runtime-Metering fehlt";
  if (value === "blocked_by_missing_request_draft") return "Ohne Request-Draft blockiert";
  if (value === "blocked_by_missing_queue_contract") return "Ohne Queue-Vertrag blockiert";
  if (value === "blocked_by_missing_provider") return "Ohne Provider-Anforderungen blockiert";
  if (value === "blocked_by_missing_assets") return "Ohne Pflichtassets blockiert";
  if (value === "blocked_by_runtime_truth") return "Ohne Runtime-Wahrheit blockiert";
  return "Bewusst Script-only";
}

function costEstimateStatusLabel(value: VoxyRenderCostEstimateStatus) {
  if (value === "provider_pricing_needed") return "Provider-Pricing nötig";
  if (value === "estimate_not_claimed") return "Estimate nicht beansprucht";
  if (value === "blocked") return "Blockiert";
  return "Nicht verfügbar";
}

function creditPolicyStatusLabel(value: VoxyRenderCreditPolicyStatus) {
  if (value === "credit_policy_needed") return "Credit-Policy nötig";
  if (value === "account_context_needed") return "Account-Kontext nötig";
  if (value === "limit_check_needed") return "Limit-Prüfung nötig";
  if (value === "blocked") return "Blockiert";
  return "Keine Live-Creditprüfung";
}

function limitPolicyStatusLabel(value: VoxyRenderLimitPolicyStatus) {
  if (value === "limit_policy_needed") return "Limit-Policy nötig";
  if (value === "runtime_metering_needed") return "Runtime-Metering nötig";
  if (value === "account_context_needed") return "Account-Kontext nötig";
  if (value === "blocked") return "Blockiert";
  return "Keine Live-Limitprüfung";
}

function buildExecutionFlags(): VoxyRenderCostCreditPolicyExecutionFlags {
  return {
    billingRuntimeAvailable: false,
    costDebitAllowed: false,
    creditDebitAllowed: false,
    invoiceAllowed: false,
    paymentAllowed: false,
    queueEnabled: false,
    createsQueueJob: false,
    workerExecutionAllowed: false,
    providerExecutionAllowed: false,
    mediaFileCreationAllowed: false,
    uploadAllowed: false,
    publishAllowed: false,
    socialPostAllowed: false,
    schedulingAllowed: false,
    runtimeClaimAllowed: false,
  };
}

function buildPreviewId(input: {
  queuePreview: VoxyRenderQueuePreviewRecord | null;
  requestDraft: VoxyRenderRequestDraftRecord | null;
  latestDecisionRecord: VoxyRenderPersistedDecisionRecord | null;
  gate: VoxyRenderReviewDecisionGateModel | null;
  surface: PolicySurface;
}) {
  return `voxy-render-cost-credit-policy:${sanitizeIdFragment(
    input.queuePreview?.queuePreviewId ??
      input.requestDraft?.requestDraftId ??
      input.latestDecisionRecord?.decisionId ??
      input.gate?.decisionGateId ??
      `${input.surface}-policy`,
  )}`;
}

function buildRuntimeRequirements(
  queuePreview: VoxyRenderQueuePreviewRecord | null,
): VoxyRenderRequestDraftRequirementItem[] {
  const existing = queuePreview?.estimatedRuntimeRequirements ?? [];
  return existing.length > 0
    ? existing
    : [
        buildRequirementItem({
          id: "billing_runtime_missing",
          label: "Billing-Runtime fehlt",
          status: "missing",
          reason: "Es gibt bewusst keine Billing-, Credit- oder Invoice-Runtime in diesem Slice.",
        }),
        buildRequirementItem({
          id: "metering_runtime_missing",
          label: "Usage-Metering fehlt",
          status: "missing",
          reason: "Es existiert keine per-run Metering-Wahrheit für Voxy-Renderläufe.",
        }),
      ];
}

function hasAnyRequirementStatus(
  items: VoxyRenderRequestDraftRequirementItem[],
  statuses: VoxyRenderRequestDraftRequirementItem["status"][],
) {
  return items.some((item) => statuses.includes(item.status));
}

function fallbackRequestDraft(input: BuildPolicyPreviewInput) {
  if (input.allowRequestDraftSynthesis === false) return null;
  return buildVoxyRenderRequestDraftFromReadmodels({
    surface: input.surface,
    gate: input.gate ?? null,
    latestDecisionRecord: input.latestDecisionRecord ?? null,
    handoffModel: input.handoffModel ?? null,
    preflightModel: input.preflightModel ?? null,
    registryModel: input.registryModel ?? null,
    adapterModel: input.adapterModel ?? null,
    persistedAt: input.persistedAt ?? null,
    persistedBy: input.persistedBy ?? null,
  });
}

function fallbackQueuePreview(input: BuildPolicyPreviewInput) {
  if (input.allowQueuePreviewSynthesis === false) return null;
  return buildVoxyRenderQueuePreviewFromReadmodels({
    surface: input.surface,
    requestDraft: input.requestDraft ?? fallbackRequestDraft(input),
    latestDecisionRecord: input.latestDecisionRecord ?? null,
    gate: input.gate ?? null,
    handoffModel: input.handoffModel ?? null,
    preflightModel: input.preflightModel ?? null,
    registryModel: input.registryModel ?? null,
    adapterModel: input.adapterModel ?? null,
    persistedAt: input.persistedAt ?? null,
    persistedBy: input.persistedBy ?? null,
  });
}

function buildPolicyStatus(input: {
  queuePreview: VoxyRenderQueuePreviewRecord | null;
  requestDraft: VoxyRenderRequestDraftRecord | null;
  latestDecisionRecord: VoxyRenderPersistedDecisionRecord | null;
  gate: VoxyRenderReviewDecisionGateModel | null;
  accountContext: VoxyRenderCostCreditPolicyAccountContext;
  policyInputs: VoxyRenderCostCreditPolicyInputs | null | undefined;
}) {
  if (!input.requestDraft) return "blocked_by_missing_request_draft";
  if (!input.queuePreview) return "blocked_by_missing_queue_contract";
  if (
    input.requestDraft.requestStatus === "keep_as_script_only" ||
    input.latestDecisionRecord?.selectedDecision === "keep_as_script_only" ||
    input.latestDecisionRecord?.selectedDecision === "block_render_path"
  ) {
    return "keep_as_script_only";
  }
  if (
    input.queuePreview.queueStatus === "blocked_by_missing_provider" ||
    input.requestDraft.requestStatus === "blocked_by_missing_provider" ||
    hasAnyRequirementStatus(input.queuePreview.providerRequirements, ["missing", "blocked"])
  ) {
    return "blocked_by_missing_provider";
  }
  if (
    input.queuePreview.queueStatus === "blocked_by_missing_assets" ||
    input.requestDraft.requestStatus === "blocked_by_missing_assets" ||
    hasAnyRequirementStatus(input.queuePreview.assetRequirements, ["missing", "blocked"])
  ) {
    return "blocked_by_missing_assets";
  }
  if (
    input.queuePreview.queueStatus === "blocked_by_runtime_truth" ||
    input.requestDraft.requestStatus === "blocked_by_runtime_truth" ||
    input.gate?.decisionStatus === "blocked_by_runtime_truth"
  ) {
    return "blocked_by_runtime_truth";
  }
  if (
    input.queuePreview.queueStatus === "disabled_preview" ||
    input.requestDraft.requestStatus === "draft_only" ||
    input.requestDraft.requestStatus === "audit_preview"
  ) {
    return "policy_preview_only";
  }
  if (input.accountContext.status === "not_available") {
    return "needs_account_context";
  }
  if (input.policyInputs?.providerPricing?.status !== "available") {
    return "needs_provider_pricing";
  }
  if (input.policyInputs?.creditPolicy?.status !== "available") {
    return "needs_credit_policy";
  }
  if (input.policyInputs?.limitPolicy?.status !== "available") {
    return "needs_limit_policy";
  }
  if (input.policyInputs?.runtimeMetering?.status !== "available") {
    return "needs_runtime_metering";
  }
  return "noop_billing";
}

function buildCostEstimateStatus(input: {
  policyStatus: VoxyRenderCostCreditPolicyStatus;
  providerPricing: VoxyRenderCostCreditPolicyInputs["providerPricing"];
}) {
  if (
    input.policyStatus === "blocked_by_missing_request_draft" ||
    input.policyStatus === "blocked_by_missing_queue_contract" ||
    input.policyStatus === "blocked_by_missing_provider" ||
    input.policyStatus === "blocked_by_missing_assets" ||
    input.policyStatus === "blocked_by_runtime_truth" ||
    input.policyStatus === "keep_as_script_only"
  ) {
    return "blocked" satisfies VoxyRenderCostEstimateStatus;
  }
  if (input.providerPricing?.status !== "available") {
    return "provider_pricing_needed" satisfies VoxyRenderCostEstimateStatus;
  }
  return "estimate_not_claimed" satisfies VoxyRenderCostEstimateStatus;
}

function buildCreditStatus(input: {
  policyStatus: VoxyRenderCostCreditPolicyStatus;
  accountContext: VoxyRenderCostCreditPolicyAccountContext;
  creditPolicy: VoxyRenderCostCreditPolicyInputs["creditPolicy"];
  limitPolicy: VoxyRenderCostCreditPolicyInputs["limitPolicy"];
  runtimeMetering: VoxyRenderCostCreditPolicyInputs["runtimeMetering"];
}) {
  if (
    input.policyStatus === "blocked_by_missing_request_draft" ||
    input.policyStatus === "blocked_by_missing_queue_contract" ||
    input.policyStatus === "blocked_by_missing_provider" ||
    input.policyStatus === "blocked_by_missing_assets" ||
    input.policyStatus === "blocked_by_runtime_truth" ||
    input.policyStatus === "keep_as_script_only"
  ) {
    return "blocked" satisfies VoxyRenderCreditPolicyStatus;
  }
  if (input.accountContext.status === "not_available") {
    return "account_context_needed" satisfies VoxyRenderCreditPolicyStatus;
  }
  if (input.creditPolicy?.status !== "available") {
    return "credit_policy_needed" satisfies VoxyRenderCreditPolicyStatus;
  }
  if (
    input.limitPolicy?.status !== "available" ||
    input.runtimeMetering?.status !== "available"
  ) {
    return "limit_check_needed" satisfies VoxyRenderCreditPolicyStatus;
  }
  return "not_available" satisfies VoxyRenderCreditPolicyStatus;
}

function buildLimitStatus(input: {
  policyStatus: VoxyRenderCostCreditPolicyStatus;
  accountContext: VoxyRenderCostCreditPolicyAccountContext;
  limitPolicy: VoxyRenderCostCreditPolicyInputs["limitPolicy"];
  runtimeMetering: VoxyRenderCostCreditPolicyInputs["runtimeMetering"];
}) {
  if (
    input.policyStatus === "blocked_by_missing_request_draft" ||
    input.policyStatus === "blocked_by_missing_queue_contract" ||
    input.policyStatus === "blocked_by_missing_provider" ||
    input.policyStatus === "blocked_by_missing_assets" ||
    input.policyStatus === "blocked_by_runtime_truth" ||
    input.policyStatus === "keep_as_script_only"
  ) {
    return "blocked" satisfies VoxyRenderLimitPolicyStatus;
  }
  if (input.accountContext.status === "not_available") {
    return "account_context_needed" satisfies VoxyRenderLimitPolicyStatus;
  }
  if (input.limitPolicy?.status !== "available") {
    return "limit_policy_needed" satisfies VoxyRenderLimitPolicyStatus;
  }
  if (input.runtimeMetering?.status !== "available") {
    return "runtime_metering_needed" satisfies VoxyRenderLimitPolicyStatus;
  }
  return "not_available" satisfies VoxyRenderLimitPolicyStatus;
}

function buildNextPolicyDecision(status: VoxyRenderCostCreditPolicyStatus) {
  if (status === "keep_as_script_only") return "keep_as_script_only";
  if (status === "needs_account_context") return "attach_account_context";
  if (status === "needs_provider_pricing" || status === "needs_cost_policy") {
    return "configure_provider_pricing";
  }
  if (status === "needs_credit_policy") return "define_credit_policy";
  if (status === "needs_limit_policy" || status === "needs_runtime_metering") {
    return "define_limit_policy";
  }
  if (
    status === "blocked_by_missing_request_draft" ||
    status === "blocked_by_missing_queue_contract" ||
    status === "blocked_by_missing_provider" ||
    status === "blocked_by_missing_assets" ||
    status === "blocked_by_runtime_truth" ||
    status === "noop_billing"
  ) {
    return "blocked";
  }
  return "define_cost_policy";
}

function buildSummary(status: VoxyRenderCostCreditPolicyStatus) {
  if (status === "policy_preview_only") {
    return "Die Kosten-, Credit- und Limit-Lesart bleibt bewusst Vorschau. Es gibt noch keine Buchung und keine Freigabe zur Ausführung.";
  }
  if (status === "noop_billing") {
    return "Policy, Pricing-Hinweise und Limits sind nur als Noop-Schicht dokumentiert. Billing bleibt strikt deaktiviert.";
  }
  if (status === "keep_as_script_only") {
    return "Die dokumentierte Entscheidung hält bewusst vor Kosten-, Credit- und Limit-Läufen an.";
  }
  if (
    status === "blocked_by_missing_request_draft" ||
    status === "blocked_by_missing_queue_contract" ||
    status === "blocked_by_missing_provider" ||
    status === "blocked_by_missing_assets" ||
    status === "blocked_by_runtime_truth"
  ) {
    return "Die Policy-Lesart bleibt blockiert und darf keine Billing- oder Render-Wahrheit behaupten.";
  }
  return "Diese Schicht beschreibt nur, welche Cost-, Credit- und Limit-Prüfungen später nötig wären. Heute bleibt alles readmodel-only.";
}

function buildBlockedReasons(preview: VoxyRenderCostCreditPolicyPreviewRecord) {
  if (preview.policyStatus === "blocked_by_missing_request_draft") {
    return [
      "Ohne Render-Request-Draft bleibt jede Kosten- oder Credit-Prüfung rein hypothetisch.",
    ];
  }
  if (preview.policyStatus === "blocked_by_missing_queue_contract") {
    return [
      "Ohne disabled Queue-Vertrag fehlt der technische Rahmen, an dem eine spätere Billing-Prüfung hängen könnte.",
    ];
  }
  if (preview.policyStatus === "keep_as_script_only") {
    return ["Die dokumentierte Entscheidung hält bewusst vor Kosten, Credits, Limits und Billing an."];
  }
  if (preview.policyStatus === "blocked_by_missing_provider") {
    return preview.providerRequirements
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.reason}`);
  }
  if (preview.policyStatus === "blocked_by_missing_assets") {
    return preview.assetRequirements
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.reason}`);
  }
  if (preview.policyStatus === "blocked_by_runtime_truth") {
    return preview.runtimeRequirements
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.reason}`);
  }
  if (preview.policyStatus === "needs_account_context") {
    return [preview.accountContext.label];
  }
  if (preview.policyStatus === "needs_provider_pricing") {
    return [
      "Es gibt keine belastbare Provider-Pricing-Wahrheit für Avatar-, Voice- oder Render-Partner.",
    ];
  }
  if (preview.policyStatus === "needs_credit_policy") {
    return [
      "Es gibt keine Voxy-Render-spezifische Credit-Policy, die Credits sicher liest, ohne etwas abzuziehen.",
    ];
  }
  if (preview.policyStatus === "needs_limit_policy") {
    return [
      "Es gibt keine Voxy-Render-spezifische Limit-Policy für Account, Tag, Dossier oder Provider.",
    ];
  }
  if (preview.policyStatus === "needs_runtime_metering") {
    return [
      "Es fehlt eine belastbare per-run Metering-Wahrheit, obwohl Policy-Bausteine vorbereitet wurden.",
    ];
  }
  return [
    "Keine Buchung, keine Credit-Abbuchung, keine Invoice, kein Payment, keine Queue, kein Worker, kein Providerlauf, kein Upload und kein Publish.",
  ];
}

function buildUserVisibleReason(status: VoxyRenderCostCreditPolicyStatus) {
  if (status === "policy_preview_only") {
    return "Kosten & Credits werden nur als Vorschau gezeigt. Es wird nichts gebucht oder abgezogen.";
  }
  if (status === "noop_billing") {
    return "Selbst mit formalen Policy-Hinweisen bleibt Billing deaktiviert und ohne Abbuchung.";
  }
  if (status === "needs_account_context") {
    return "Bevor Credits oder Limits geprüft werden könnten, fehlt belastbarer Account-Kontext.";
  }
  if (status === "needs_provider_pricing") {
    return "Es fehlen echte Provider-Pricing-Daten. Deshalb wird kein Preis behauptet.";
  }
  if (status === "needs_credit_policy") {
    return "Es fehlt eine sichere Credit-Policy. Deshalb werden keine Credits gezeigt oder abgezogen.";
  }
  if (status === "needs_limit_policy") {
    return "Es fehlt eine sichere Limit-Policy. Deshalb wird keine Freigabe zur Ausführung behauptet.";
  }
  if (status === "needs_runtime_metering") {
    return "Ohne Runtime-Metering kann selbst eine Policy-Vorschau keine Live-Freigabe ableiten.";
  }
  if (status === "keep_as_script_only") {
    return "Dieser Pfad bleibt bewusst beim Script und geht nicht in Kosten- oder Billing-Läufe über.";
  }
  return "Dieser Block zeigt nur, welche Prüfungen später nötig wären. Heute passiert keine Ausführung.";
}

function buildReviewerVisibleReason(status: VoxyRenderCostCreditPolicyStatus) {
  if (status === "noop_billing") {
    return "Formale Policy-Bausteine können dokumentiert sein, aber Billing-Runtime, Credit-Debit, Queue und Providerlauf bleiben strikt false.";
  }
  if (status === "policy_preview_only") {
    return "Disabled Queue-/Draft-Wahrheit führt hier nur in eine Preview-Schicht, nicht in Pricing-, Credit- oder Invoice-Wahrheit.";
  }
  if (status === "needs_provider_pricing") {
    return "Der Slice kennt Provider-Interfaces, aber keine belastbaren Render-Kostenquellen. Deshalb bleibt `estimatedCostAmount` leer.";
  }
  if (status === "needs_credit_policy") {
    return "Bestehende Repo-Credits und Entitlements sind nicht automatisch Voxy-Render-Billing und werden hier nicht still umgedeutet.";
  }
  if (status === "needs_limit_policy") {
    return "Bestehende Account-/Usage-Muster reichen nicht als Voxy-Render-Limit-Wahrheit. Der Slice bleibt noop_billing.";
  }
  if (status === "needs_account_context") {
    return "Ohne belastbaren Account- oder Entitlement-Snapshot darf keine Credit- oder Limit-Prüfung behauptet werden.";
  }
  if (status === "needs_runtime_metering") {
    return "Policy ohne Metering ist nicht billing-fähig und bleibt unterhalb jeder Debit- oder Invoice-Wahrheit.";
  }
  return "Der Slice bündelt Queue-, Draft-, Preflight-, Registry- und Adapter-Wahrheit zu einer Noop-Billing-Schicht ohne Buchung, Payment oder Providerabrechnung.";
}

function buildNextStep(status: VoxyRenderCostCreditPolicyStatus) {
  if (status === "needs_account_context") {
    return "Belastbaren Account- oder Entitlement-Kontext separat anbinden";
  }
  if (status === "needs_provider_pricing" || status === "needs_cost_policy") {
    return "Provider-Pricing als sichere Readmodel-Wahrheit definieren";
  }
  if (status === "needs_credit_policy") {
    return "Credit-Policy definieren, ohne Credits abzuziehen";
  }
  if (status === "needs_limit_policy") {
    return "Limit-Policy für Account, Tag, Dossier und Provider definieren";
  }
  if (status === "needs_runtime_metering") {
    return "Runtime-Metering vor jeder späteren Debit- oder Limit-Aussage separat designen";
  }
  if (status === "noop_billing") {
    return "Policy-Audit prüfen und echte Billing-Runtime bewusst separat planen";
  }
  if (status === "policy_preview_only") {
    return "Preview dokumentieren und spätere Policy-Bausteine separat schärfen";
  }
  if (status === "keep_as_script_only") {
    return "Script-only dokumentiert lassen";
  }
  return "Blocker im Queue-, Provider-, Asset- oder Runtime-Pfad klären";
}

function buildProviderPricingLabel(
  status: VoxyRenderProviderPricingStatus,
  input: VoxyRenderCostCreditPolicyInputs["providerPricing"],
) {
  if (status === "available") {
    return normalizeText(input?.label) || "Provider-Pricing ist als Readmodel-Hinweis vorhanden.";
  }
  if (status === "provider_interface_only") {
    return normalizeText(input?.label) || "Provider ist nur als Interface oder Requirement sichtbar, nicht mit Preisen.";
  }
  return "Keine belastbare Provider-Pricing-Wahrheit vorhanden.";
}

function buildRuntimeMeteringLabel(
  status: VoxyRenderRuntimeMeteringStatus,
  input: VoxyRenderCostCreditPolicyInputs["runtimeMetering"],
) {
  if (status === "available") {
    return normalizeText(input?.label) || "Runtime-Metering ist als Readmodel-Hinweis vorhanden.";
  }
  return normalizeText(input?.label) || "Keine per-run Metering-Wahrheit vorhanden.";
}

export function buildVoxyRenderCostCreditPolicyPreviewFromReadmodels(
  input: BuildPolicyPreviewInput,
): VoxyRenderCostCreditPolicyPreviewRecord | null {
  const requestDraft = input.requestDraft ?? fallbackRequestDraft(input);
  const queuePreview = input.queuePreview ?? fallbackQueuePreview(input);
  if (!requestDraft && !queuePreview && !input.gate && !input.latestDecisionRecord) return null;

  const gate = input.gate ?? null;
  const latestDecisionRecord = input.latestDecisionRecord ?? null;
  const accountContext = buildDefaultAccountContext(input.surface, input.accountContext);
  const providerPricingStatus =
    input.policyInputs?.providerPricing?.status === "available"
      ? "available"
      : queuePreview?.queueStatus === "blocked_by_missing_provider"
        ? "not_available"
        : "provider_interface_only";
  const runtimeMeteringStatus =
    input.policyInputs?.runtimeMetering?.status === "available"
      ? "available"
      : "runtime_required";
  const policyStatus = buildPolicyStatus({
    queuePreview,
    requestDraft,
    latestDecisionRecord,
    gate,
    accountContext,
    policyInputs: input.policyInputs,
  });
  const costEstimateStatus = buildCostEstimateStatus({
    policyStatus,
    providerPricing: input.policyInputs?.providerPricing,
  });
  const creditStatus = buildCreditStatus({
    policyStatus,
    accountContext,
    creditPolicy: input.policyInputs?.creditPolicy,
    limitPolicy: input.policyInputs?.limitPolicy,
    runtimeMetering: input.policyInputs?.runtimeMetering,
  });
  const limitStatus = buildLimitStatus({
    policyStatus,
    accountContext,
    limitPolicy: input.policyInputs?.limitPolicy,
    runtimeMetering: input.policyInputs?.runtimeMetering,
  });
  const nextStep = buildNextStep(policyStatus);

  return {
    policyPreviewId: buildPreviewId({
      queuePreview,
      requestDraft,
      latestDecisionRecord,
      gate,
      surface: input.surface,
    }),
    queuePreviewId: queuePreview?.queuePreviewId ?? null,
    requestDraftId: requestDraft?.requestDraftId ?? null,
    decisionId: queuePreview?.decisionId ?? requestDraft?.decisionId ?? latestDecisionRecord?.decisionId ?? null,
    decisionGateId:
      queuePreview?.decisionGateId ??
      requestDraft?.decisionGateId ??
      gate?.decisionGateId ??
      latestDecisionRecord?.decisionGateId ??
      null,
    handoffRef:
      queuePreview?.handoffRef ??
      requestDraft?.handoffRef ??
      gate?.handoffRef ??
      latestDecisionRecord?.handoffRef ??
      null,
    preflightRef:
      queuePreview?.preflightRef ??
      requestDraft?.preflightRef ??
      gate?.preflightRef ??
      latestDecisionRecord?.preflightRef ??
      null,
    registryRef:
      queuePreview?.registryRef ??
      requestDraft?.registryRef ??
      gate?.registryRef ??
      latestDecisionRecord?.registryRef ??
      null,
    adapterRef:
      queuePreview?.adapterRef ??
      requestDraft?.adapterRef ??
      gate?.adapterRef ??
      latestDecisionRecord?.adapterRef ??
      null,
    scriptRef:
      queuePreview?.scriptRef ??
      requestDraft?.scriptRef ??
      gate?.scriptRef ??
      latestDecisionRecord?.scriptRef ??
      null,
    contributionRef:
      queuePreview?.contributionRef ??
      requestDraft?.contributionRef ??
      gate?.contributionRef ??
      latestDecisionRecord?.contributionRef ??
      null,
    dossierRef:
      queuePreview?.dossierRef ??
      requestDraft?.dossierRef ??
      gate?.dossierRef ??
      latestDecisionRecord?.dossierRef ??
      null,
    accountRef: input.accountContext?.accountRef ?? null,
    surface: input.surface,
    videoFormat: "briefing_video",
    policyStatus,
    sourceLanguage:
      queuePreview?.sourceLanguage ??
      requestDraft?.sourceLanguage ??
      gate?.sourceLanguage ??
      latestDecisionRecord?.sourceLanguage ??
      "de",
    readingLanguage:
      queuePreview?.readingLanguage ??
      requestDraft?.readingLanguage ??
      gate?.readingLanguage ??
      latestDecisionRecord?.readingLanguage ??
      "de",
    scriptLanguage:
      queuePreview?.scriptLanguage ??
      requestDraft?.scriptLanguage ??
      gate?.scriptLanguage ??
      latestDecisionRecord?.scriptLanguage ??
      "de",
    renderLanguage:
      queuePreview?.renderLanguage ??
      requestDraft?.renderLanguage ??
      gate?.renderLanguage ??
      latestDecisionRecord?.renderLanguage ??
      "de",
    subtitleLanguage:
      queuePreview?.subtitleLanguage ??
      requestDraft?.subtitleLanguage ??
      gate?.subtitleLanguage ??
      latestDecisionRecord?.subtitleLanguage ??
      null,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: queuePreview?.rtlRequired ?? requestDraft?.rtlRequired ?? false,
    providerRequirements: queuePreview?.providerRequirements ?? requestDraft?.providerRequirements ?? [],
    assetRequirements: queuePreview?.assetRequirements ?? requestDraft?.assetRequirements ?? [],
    costRequirements: queuePreview?.costRequirements ?? requestDraft?.costRequirements ?? [],
    runtimeRequirements: buildRuntimeRequirements(queuePreview),
    costEstimateStatus,
    estimatedCostAmount:
      input.policyInputs?.providerPricing?.status === "available"
        ? input.policyInputs.providerPricing.estimatedCostAmount ?? null
        : null,
    currency:
      input.policyInputs?.providerPricing?.status === "available"
        ? normalizeText(input.policyInputs.providerPricing.currency) || null
        : null,
    costClaimAllowed: false,
    costDebitAllowed: false,
    invoiceAllowed: false,
    creditStatus,
    creditsRequired:
      input.policyInputs?.creditPolicy?.status === "available"
        ? input.policyInputs.creditPolicy.creditsRequired ?? null
        : null,
    creditsAvailable:
      input.policyInputs?.creditPolicy?.status === "available"
        ? input.policyInputs.creditPolicy.creditsAvailable ?? null
        : null,
    creditDebitAllowed: false,
    limitStatus,
    perAccountLimit:
      input.policyInputs?.limitPolicy?.status === "available"
        ? input.policyInputs.limitPolicy.perAccountLimit ?? null
        : null,
    perDayLimit:
      input.policyInputs?.limitPolicy?.status === "available"
        ? input.policyInputs.limitPolicy.perDayLimit ?? null
        : null,
    perDossierLimit:
      input.policyInputs?.limitPolicy?.status === "available"
        ? input.policyInputs.limitPolicy.perDossierLimit ?? null
        : null,
    perProviderLimit:
      input.policyInputs?.limitPolicy?.status === "available"
        ? input.policyInputs.limitPolicy.perProviderLimit ?? null
        : null,
    limitApprovalAllowed: false,
    accountContext,
    providerPricingStatus,
    providerPricingLabel: buildProviderPricingLabel(
      providerPricingStatus,
      input.policyInputs?.providerPricing,
    ),
    runtimeMeteringStatus,
    runtimeMeteringLabel: buildRuntimeMeteringLabel(
      runtimeMeteringStatus,
      input.policyInputs?.runtimeMetering,
    ),
    policyEvidence: uniqueStrings([
      ...accountContext.evidence,
      ...(input.policyInputs?.providerPricing?.evidence ?? []),
      ...(input.policyInputs?.creditPolicy?.evidence ?? []),
      ...(input.policyInputs?.limitPolicy?.evidence ?? []),
      ...(input.policyInputs?.runtimeMetering?.evidence ?? []),
      queuePreview?.queuePreviewId ? `Queue-Preview: ${queuePreview.queuePreviewId}` : null,
      requestDraft?.requestDraftId ? `Request-Draft: ${requestDraft.requestDraftId}` : null,
      "Voxy-Capability-Matrix ist im Repo vorhanden.",
      "Create-Entitlements, AI-Usage und Admin-Entitlements existieren im Repo, sind aber keine automatische Voxy-Render-Billing-Wahrheit.",
      "Es gibt keine belastbare Provider-Preisquelle, keine Credit-Abbuchung und keine Billing-Runtime in diesem Slice.",
    ]),
    nextPolicyDecision: buildNextPolicyDecision(policyStatus),
    userVisibleReason: buildUserVisibleReason(policyStatus),
    reviewerVisibleReason: buildReviewerVisibleReason(policyStatus),
    nextStep,
    execution: buildExecutionFlags(),
    persistedAt: normalizeText(input.persistedAt) || null,
    persistedBy: normalizeText(input.persistedBy) || null,
    idempotencyKey: null,
    previousPolicyPreviewRef: null,
    supersedesPolicyPreviewRef: null,
    policyVersion: null,
  };
}

export function buildVoxyRenderCostCreditPolicyPreviewCommandFromPreview(
  preview: VoxyRenderCostCreditPolicyPreviewRecord,
  options?: {
    createdAt?: string | null;
    createdBy?: string | null;
  },
): VoxyRenderCostCreditPolicyPreviewCommand {
  return {
    ...preview,
    createdAt: normalizeText(options?.createdAt) || null,
    createdBy: normalizeText(options?.createdBy) || null,
  };
}

export function buildVoxyRenderCostCreditPolicyPreviewFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  return buildVoxyRenderCostCreditPolicyPreviewFromReadmodels({
    surface: "create",
    requestDraft: buildVoxyRenderRequestDraftFromCreateCandidatePreview(model),
    queuePreview: buildVoxyRenderQueuePreviewFromCreateCandidatePreview(model),
    gate: buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview(model),
    handoffModel: buildVoxyRenderProviderHandoffFromCreateCandidatePreview(model),
    preflightModel: buildVoxyRenderPreflightReadinessFromCreateCandidatePreview(model),
    registryModel: buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview(model),
    adapterModel: buildVoxyRenderAdapterNoopFromCreateCandidatePreview(model),
  });
}

export function buildVoxyRenderCostCreditPolicyPreviewFromReviewContext(
  context: V3ReviewQueueWiringContext,
  options?: {
    audience: "admin" | "workspace";
    latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
    latestRequestDraftRecord?: VoxyRenderRequestDraftRecord | null;
    latestQueuePreviewRecord?: VoxyRenderQueuePreviewRecord | null;
    contributionRef?: PolicyRef | null;
    dossierRef?: PolicyRef | null;
    outputRef?: PolicyRef | null;
    accountContext?: BuildPolicyPreviewInput["accountContext"];
    policyInputs?: VoxyRenderCostCreditPolicyInputs | null;
  },
) {
  const audience = options?.audience ?? "admin";
  return buildVoxyRenderCostCreditPolicyPreviewFromReadmodels({
    surface: audience,
    requestDraft:
      options?.latestRequestDraftRecord ??
      buildVoxyRenderRequestDraftFromReviewContext(context, {
        audience,
        latestDecisionRecord: options?.latestDecisionRecord ?? null,
        contributionRef: options?.contributionRef ?? null,
        dossierRef: options?.dossierRef ?? null,
        outputRef: options?.outputRef ?? null,
      }),
    queuePreview:
      options?.latestQueuePreviewRecord ??
      buildVoxyRenderQueuePreviewFromReviewContext(context, {
        audience,
        latestDecisionRecord: options?.latestDecisionRecord ?? null,
        latestRequestDraftRecord: options?.latestRequestDraftRecord ?? null,
        contributionRef: options?.contributionRef ?? null,
        dossierRef: options?.dossierRef ?? null,
        outputRef: options?.outputRef ?? null,
      }),
    allowQueuePreviewSynthesis: false,
    latestDecisionRecord: options?.latestDecisionRecord ?? null,
    gate: buildVoxyRenderReviewDecisionGateFromReviewContext(context, {
      audience,
      contributionRef: options?.contributionRef ?? null,
      dossierRef: options?.dossierRef ?? null,
      outputRef: options?.outputRef ?? null,
    }),
    handoffModel: buildVoxyRenderProviderHandoffFromReviewContext(context, {
      audience,
      contributionRef: options?.contributionRef ?? null,
      dossierRef: options?.dossierRef ?? null,
      outputRef: options?.outputRef ?? null,
    }),
    preflightModel: buildVoxyRenderPreflightReadinessFromReviewContext(context, {
      audience,
      contributionRef: options?.contributionRef ?? null,
      dossierRef: options?.dossierRef ?? null,
      outputRef: options?.outputRef ?? null,
    }),
    registryModel: buildVoxyRenderAssetProviderRegistryFromReviewContext(context, {
      audience,
      contributionRef: options?.contributionRef ?? null,
      dossierRef: options?.dossierRef ?? null,
      outputRef: options?.outputRef ?? null,
    }),
    adapterModel: buildVoxyRenderAdapterNoopFromReviewContext(context, {
      audience,
      contributionRef: options?.contributionRef ?? null,
      dossierRef: options?.dossierRef ?? null,
      outputRef: options?.outputRef ?? null,
    }),
    accountContext: options?.accountContext,
    policyInputs: options?.policyInputs ?? null,
  });
}

export function buildVoxyRenderCostCreditPolicyPreviewFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null,
  options?: {
    latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
    latestRequestDraftRecord?: VoxyRenderRequestDraftRecord | null;
    latestQueuePreviewRecord?: VoxyRenderQueuePreviewRecord | null;
    contributionRef?: PolicyRef | null;
    dossierRef?: PolicyRef | null;
    outputRef?: PolicyRef | null;
    nextStep?: string;
    accountContext?: BuildPolicyPreviewInput["accountContext"];
    policyInputs?: VoxyRenderCostCreditPolicyInputs | null;
  },
) {
  const contributionRef = options?.contributionRef ?? dialog?.contributionRef ?? null;
  return buildVoxyRenderCostCreditPolicyPreviewFromReadmodels({
    surface: "account",
    requestDraft:
      options?.latestRequestDraftRecord ??
      buildVoxyRenderRequestDraftFromVoxyDialog(dialog, {
        latestDecisionRecord: options?.latestDecisionRecord ?? null,
        contributionRef,
        dossierRef: options?.dossierRef ?? null,
        outputRef: options?.outputRef ?? null,
        nextStep: options?.nextStep,
      }),
    queuePreview:
      options?.latestQueuePreviewRecord ??
      buildVoxyRenderQueuePreviewFromVoxyDialog(dialog, {
        latestDecisionRecord: options?.latestDecisionRecord ?? null,
        latestRequestDraftRecord: options?.latestRequestDraftRecord ?? null,
        contributionRef,
        dossierRef: options?.dossierRef ?? null,
        outputRef: options?.outputRef ?? null,
        nextStep: options?.nextStep,
      }),
    latestDecisionRecord: options?.latestDecisionRecord ?? null,
    gate: buildVoxyRenderReviewDecisionGateFromVoxyDialog(dialog, {
      contributionRef,
      dossierRef: options?.dossierRef ?? null,
      outputRef: options?.outputRef ?? null,
      nextStep: options?.nextStep,
    }),
    handoffModel: buildVoxyRenderProviderHandoffFromVoxyDialog(dialog, {
      contributionRef,
      outputRef: options?.outputRef ?? null,
      nextStep: options?.nextStep,
    }),
    preflightModel: buildVoxyRenderPreflightReadinessFromVoxyDialog(dialog, {
      contributionRef,
      outputRef: options?.outputRef ?? null,
      nextStep: options?.nextStep,
    }),
    registryModel: buildVoxyRenderAssetProviderRegistryFromVoxyDialog(dialog, {
      contributionRef,
      outputRef: options?.outputRef ?? null,
      nextStep: options?.nextStep,
    }),
    adapterModel: buildVoxyRenderAdapterNoopFromVoxyDialog(dialog, {
      contributionRef,
      outputRef: options?.outputRef ?? null,
      nextStep: options?.nextStep,
    }),
    accountContext: options?.accountContext,
    policyInputs: options?.policyInputs ?? null,
  });
}

export function buildVoxyRenderCostCreditPolicyPanelModel(input: {
  preview: VoxyRenderCostCreditPolicyPreviewRecord | null;
  latestRecord?: VoxyRenderCostCreditPolicyPreviewRecord | null;
  storeState?: VoxyRenderCostCreditPolicyPersistenceState | null;
}) {
  if (!input.preview) return null;
  const latestRecord = input.latestRecord ?? null;
  const storeState = input.storeState ?? defaultPersistenceState();
  const blockedReasons = buildBlockedReasons(input.preview);
  return {
    title: "Kosten & Credits",
    summary: buildSummary(input.preview.policyStatus),
    preview: input.preview,
    policyStatusLabel: voxyRenderCostCreditPolicyStatusLabel(input.preview.policyStatus),
    costStatusLabel: costEstimateStatusLabel(input.preview.costEstimateStatus),
    creditStatusLabel: creditPolicyStatusLabel(input.preview.creditStatus),
    limitStatusLabel: limitPolicyStatusLabel(input.preview.limitStatus),
    storeStateLabel: storeState.label,
    storeStateSummary: storeState.summary,
    latestRecord: latestRecord
      ? {
          policyPreviewId: latestRecord.policyPreviewId,
          statusLabel: voxyRenderCostCreditPolicyStatusLabel(latestRecord.policyStatus),
          persistedAt: latestRecord.persistedAt,
          persistedBy: latestRecord.persistedBy,
          policyVersion: latestRecord.policyVersion,
          queuePreviewId: latestRecord.queuePreviewId,
        }
      : null,
    blockedReasons,
    evidenceLines: input.preview.policyEvidence,
    auditLines: uniqueStrings([
      `Status: ${voxyRenderCostCreditPolicyStatusLabel(input.preview.policyStatus)}`,
      `Kosten: ${costEstimateStatusLabel(input.preview.costEstimateStatus)}`,
      `Credits: ${creditPolicyStatusLabel(input.preview.creditStatus)}`,
      `Limits: ${limitPolicyStatusLabel(input.preview.limitStatus)}`,
      latestRecord?.persistedAt ? `Zuletzt gespeichert: ${latestRecord.persistedAt}` : null,
      latestRecord?.persistedBy ? `Von: ${latestRecord.persistedBy}` : null,
      "Keine Buchung, keine Credit-Abbuchung, keine Invoice, kein Payment, keine Queue, kein Worker und kein Providerlauf.",
    ]),
    nextStep: input.preview.nextStep,
    executionFlags: input.preview.execution,
  } satisfies VoxyRenderCostCreditPolicyPanelModel;
}
