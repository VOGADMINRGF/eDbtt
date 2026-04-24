import type { E150ProviderName } from "./journeyProfiles";
import type { ResearchUsed, VerificationMode } from "./verificationContract";

export type PresentationPassProvider = "openai";

export type PresentationPassPolicy = {
  provider: PresentationPassProvider;
  role: "presentation_pass";
  nonMutative: true;
  rules: readonly string[];
};

export type PresentationPassReason =
  | "disabled"
  | "provider_not_allowed"
  | "failed"
  | "no_change"
  | "guard_blocked"
  | "applied";

export type PresentationPassExecutionMeta = {
  attempted: boolean;
  enabled: boolean;
  applied: boolean;
  provider: PresentationPassProvider | null;
  role: "presentation_pass";
  reason: PresentationPassReason;
  nonMutativeGuardPassed: boolean;
  changedFields: string[];
  failure: string | null;
  policy: PresentationPassPolicy | null;
};

export const OPENAI_PRESENTATION_PASS_POLICY: PresentationPassPolicy = {
  provider: "openai",
  role: "presentation_pass",
  nonMutative: true,
  rules: [
    "no_claim_mutation",
    "no_evidence_mutation",
    "no_verdict_mutation",
    "no_trust_or_decision_mutation",
    "style_readability_tone_only",
  ],
};

export function canUsePresentationPass(provider: E150ProviderName): boolean {
  return provider === "openai";
}

export type PresentationPassProtectedSnapshot = {
  claims: unknown;
  evidence: unknown;
  trust: unknown;
  verificationMode: VerificationMode;
  researchUsed: ResearchUsed;
  sealEligible: boolean;
  sealGranted: boolean;
  laneMeta?: unknown;
  providerMeta?: unknown;
};

function safeStableStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? "null";
  } catch {
    return "__unserializable__";
  }
}

export function isPresentationPassNonMutative(
  before: PresentationPassProtectedSnapshot,
  after: PresentationPassProtectedSnapshot,
): boolean {
  return (
    safeStableStringify(before.claims) === safeStableStringify(after.claims) &&
    safeStableStringify(before.evidence) === safeStableStringify(after.evidence) &&
    safeStableStringify(before.trust) === safeStableStringify(after.trust) &&
    before.verificationMode === after.verificationMode &&
    before.researchUsed === after.researchUsed &&
    before.sealEligible === after.sealEligible &&
    before.sealGranted === after.sealGranted &&
    safeStableStringify(before.laneMeta) === safeStableStringify(after.laneMeta) &&
    safeStableStringify(before.providerMeta) === safeStableStringify(after.providerMeta)
  );
}

export type PresentationPassApplyResult<TPayload> = {
  payload: TPayload;
  changed: boolean;
  changedFields?: string[];
};

export function normalizePresentationText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return trimmed
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,.;:!?])([A-Za-zÄÖÜäöüß])/g, "$1 $2")
    .replace(/([!?.,;:])\1+/g, "$1");
}

export function normalizePresentationTextList(items: readonly string[]): string[] {
  return items
    .map((item) => normalizePresentationText(item))
    .filter((item) => item.length > 0);
}

export function runNonMutativePresentationPass<TPayload>(params: {
  provider: E150ProviderName;
  enabled?: boolean;
  payload: TPayload;
  snapshot: (payload: TPayload) => PresentationPassProtectedSnapshot;
  apply: (payload: TPayload) => PresentationPassApplyResult<TPayload>;
}): { payload: TPayload; meta: PresentationPassExecutionMeta } {
  if (!params.enabled) {
    return {
      payload: params.payload,
      meta: {
        attempted: false,
        enabled: false,
        applied: false,
        provider: null,
        role: "presentation_pass",
        reason: "disabled",
        nonMutativeGuardPassed: true,
        changedFields: [],
        failure: null,
        policy: null,
      },
    };
  }
  if (!canUsePresentationPass(params.provider)) {
    return {
      payload: params.payload,
      meta: {
        attempted: false,
        enabled: true,
        applied: false,
        provider: null,
        role: "presentation_pass",
        reason: "provider_not_allowed",
        nonMutativeGuardPassed: true,
        changedFields: [],
        failure: null,
        policy: null,
      },
    };
  }

  const before = params.snapshot(params.payload);

  try {
    const applied = params.apply(params.payload);
    const changedFields = applied.changedFields ?? [];
    const after = params.snapshot(applied.payload);
    const guardOk = isPresentationPassNonMutative(before, after);
    if (!guardOk) {
      return {
        payload: params.payload,
        meta: {
          attempted: true,
          enabled: true,
          applied: false,
          provider: "openai",
          role: "presentation_pass",
          reason: "guard_blocked",
          nonMutativeGuardPassed: false,
          changedFields: [],
          failure: null,
          policy: OPENAI_PRESENTATION_PASS_POLICY,
        },
      };
    }

    if (!applied.changed) {
      return {
        payload: applied.payload,
        meta: {
          attempted: true,
          enabled: true,
          applied: false,
          provider: "openai",
          role: "presentation_pass",
          reason: "no_change",
          nonMutativeGuardPassed: true,
          changedFields: [],
          failure: null,
          policy: OPENAI_PRESENTATION_PASS_POLICY,
        },
      };
    }

    return {
      payload: applied.payload,
      meta: {
        attempted: true,
        enabled: true,
        applied: true,
        provider: "openai",
        role: "presentation_pass",
        reason: "applied",
        nonMutativeGuardPassed: true,
        changedFields,
        failure: null,
        policy: OPENAI_PRESENTATION_PASS_POLICY,
      },
    };
  } catch (error) {
    return {
      payload: params.payload,
      meta: {
        attempted: true,
        enabled: true,
        applied: false,
        provider: "openai",
        role: "presentation_pass",
        reason: "failed",
        nonMutativeGuardPassed: true,
        changedFields: [],
        failure:
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "presentation_pass_failed",
        policy: OPENAI_PRESENTATION_PASS_POLICY,
      },
    };
  }
}

export function applyPresentationPassStub(params: {
  provider: E150ProviderName;
  text: string;
  enabled?: boolean;
}): { applied: boolean; text: string; policy: PresentationPassPolicy | null } {
  const result = runNonMutativePresentationPass({
    provider: params.provider,
    enabled: params.enabled,
    payload: params.text,
    snapshot: () => ({
      claims: null,
      evidence: null,
      trust: null,
      verificationMode: "none",
      researchUsed: "none",
      sealEligible: false,
      sealGranted: false,
    }),
    apply: (payload) => ({ payload, changed: false }),
  });

  return {
    applied: result.meta.applied,
    text: result.payload,
    policy: result.meta.policy,
  };
}
