export const VOXY_CANONICAL_VISUAL_SOURCE = {
  repositoryPath: "apps/web/public/brand/voxy/voxy-podcast-stage.png",
  publicPath: "/brand/voxy/voxy-podcast-stage.png",
  status: "human_approved_reference",
} as const;

export const VOXY_MOTION_PROVIDER_STATUS = "manual_gate" as const;

export const VOXY_MOTION_PREFLIGHT_GATES = [
  "provider_selection",
  "account_credentials",
  "external_data_transfer",
  "privacy_retention",
  "budget_spend",
] as const;

export const VOXY_MOTION_HUMAN_GATES = [
  ...VOXY_MOTION_PREFLIGHT_GATES,
  "visual_acceptance",
] as const;

export type VoxyMotionPreflightGate =
  (typeof VOXY_MOTION_PREFLIGHT_GATES)[number];
export type VoxyMotionHumanGate = (typeof VOXY_MOTION_HUMAN_GATES)[number];

export type VoxyMotionProviderApproval = {
  providerId: string | null;
  providerSelectionApproved: boolean;
  accountApproved: boolean;
  credentialsConfigured: boolean;
  externalDataTransferApproved: boolean;
  privacyRetentionApproved: boolean;
  budgetSpendApproved: boolean;
};

export const EMPTY_VOXY_MOTION_PROVIDER_APPROVAL: VoxyMotionProviderApproval = {
  providerId: null,
  providerSelectionApproved: false,
  accountApproved: false,
  credentialsConfigured: false,
  externalDataTransferApproved: false,
  privacyRetentionApproved: false,
  budgetSpendApproved: false,
};

export function getMissingVoxyMotionPreflightGates(
  approval: VoxyMotionProviderApproval,
): VoxyMotionPreflightGate[] {
  const missing: VoxyMotionPreflightGate[] = [];

  if (!approval.providerId?.trim() || !approval.providerSelectionApproved) {
    missing.push("provider_selection");
  }
  if (!approval.accountApproved || !approval.credentialsConfigured) {
    missing.push("account_credentials");
  }
  if (!approval.externalDataTransferApproved) {
    missing.push("external_data_transfer");
  }
  if (!approval.privacyRetentionApproved) {
    missing.push("privacy_retention");
  }
  if (!approval.budgetSpendApproved) {
    missing.push("budget_spend");
  }

  return missing;
}

export function canInvokeVoxyMotionProvider(
  approval: VoxyMotionProviderApproval,
): boolean {
  return getMissingVoxyMotionPreflightGates(approval).length === 0;
}

export type VoxyMotionArtifactReview = {
  providerId: string;
  exactHeadSha: string;
  canonicalVisualSource: typeof VOXY_CANONICAL_VISUAL_SOURCE.repositoryPath;
  humanVisualAcceptance: "pending" | "approved" | "rejected";
};

export function canPublishVoxyMotionArtifact(input: {
  approval: VoxyMotionProviderApproval;
  review: VoxyMotionArtifactReview;
}): boolean {
  if (!canInvokeVoxyMotionProvider(input.approval)) return false;
  if (!input.approval.providerId) return false;

  return (
    input.review.providerId === input.approval.providerId &&
    input.review.exactHeadSha.trim().length > 0 &&
    input.review.canonicalVisualSource ===
      VOXY_CANONICAL_VISUAL_SOURCE.repositoryPath &&
    input.review.humanVisualAcceptance === "approved"
  );
}
