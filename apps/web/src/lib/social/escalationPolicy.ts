export type SocialEscalationContext = "moderated" | "curated";

export type SocialEscalationPolicyInput = {
  context: unknown;
  optIn: unknown;
  trustSignal: unknown;
  verificationSignal: unknown;
};

export type SocialEscalationDecisionReason =
  | "missing_allowed_context"
  | "missing_opt_in"
  | "missing_trust_or_verification"
  | "allowed";

export type SocialEscalationDecision = {
  allowed: boolean;
  context: SocialEscalationContext | null;
  reason: SocialEscalationDecisionReason;
  flags: {
    optIn: boolean;
    trustSignal: boolean;
    verificationSignal: boolean;
  };
};

export type SocialEscalationStartformContract = {
  defaultEnabled: false;
  allowedContexts: readonly ["moderated", "curated"];
  requiresOptIn: true;
  requiresTrustOrVerification: true;
  requiresModerationAndAbuseGates: true;
};

export const SOCIAL_ESCALATION_STARTFORM_CONTRACT: SocialEscalationStartformContract = {
  defaultEnabled: false,
  allowedContexts: ["moderated", "curated"],
  requiresOptIn: true,
  requiresTrustOrVerification: true,
  requiresModerationAndAbuseGates: true,
};

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function readBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") return TRUE_VALUES.has(value.trim().toLowerCase());
  return false;
}

function normalizeContext(value: unknown): SocialEscalationContext | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "moderated" || normalized === "moderated_space") return "moderated";
  if (normalized === "curated" || normalized === "curated_space") return "curated";
  return null;
}

export function resolveSocialEscalationPolicy(
  input: SocialEscalationPolicyInput,
): SocialEscalationDecision {
  const context = normalizeContext(input.context);
  const optIn = readBool(input.optIn);
  const trustSignal = readBool(input.trustSignal);
  const verificationSignal = readBool(input.verificationSignal);

  if (!context) {
    return {
      allowed: false,
      context: null,
      reason: "missing_allowed_context",
      flags: { optIn, trustSignal, verificationSignal },
    };
  }
  if (!optIn) {
    return {
      allowed: false,
      context,
      reason: "missing_opt_in",
      flags: { optIn, trustSignal, verificationSignal },
    };
  }
  if (!trustSignal && !verificationSignal) {
    return {
      allowed: false,
      context,
      reason: "missing_trust_or_verification",
      flags: { optIn, trustSignal, verificationSignal },
    };
  }
  return {
    allowed: true,
    context,
    reason: "allowed",
    flags: { optIn, trustSignal, verificationSignal },
  };
}
