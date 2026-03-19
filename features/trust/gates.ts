import type { ContentTrustLevel, GovernanceActorRole } from "./types";

const REVIEW_ROLES: GovernanceActorRole[] = [
  "reviewer",
  "editor",
  "admin",
  "institutional_actor",
  "editorial_actor",
];

const APPROVAL_ROLES: GovernanceActorRole[] = [
  "admin",
  "editorial_actor",
  "institutional_actor",
];

type PublishGateInput = {
  status?: string | null;
  requiredStatuses?: string[];
  reviewedBy?: string | null;
  approvedBy?: string | null;
  contentTrust?: ContentTrustLevel | null;
  hasSufficientSources?: boolean;
  hasOpenEscalations?: boolean;
  anonymousOnly?: boolean;
};

type PublishGateResult = {
  ok: boolean;
  reasons: string[];
};

export function canRoleReview(role: GovernanceActorRole): boolean {
  return REVIEW_ROLES.includes(role);
}

export function canRoleApprove(role: GovernanceActorRole): boolean {
  return APPROVAL_ROLES.includes(role);
}

export function evaluatePublishGate(input: PublishGateInput): PublishGateResult {
  const reasons: string[] = [];
  const requiredStatuses = Array.isArray(input.requiredStatuses) ? input.requiredStatuses : [];

  if (requiredStatuses.length && !requiredStatuses.includes(String(input.status ?? ""))) {
    reasons.push("status_not_publishable");
  }
  if (!String(input.reviewedBy ?? "").trim()) {
    reasons.push("missing_reviewed_by");
  }
  if (!String(input.approvedBy ?? "").trim()) {
    reasons.push("missing_approved_by");
  }
  if (input.contentTrust === "unverified") {
    reasons.push("content_trust_unverified");
  }
  if (input.hasSufficientSources === false) {
    reasons.push("insufficient_sources");
  }
  if (input.hasOpenEscalations) {
    reasons.push("open_escalations");
  }
  if (input.anonymousOnly) {
    reasons.push("anonymous_only_input");
  }

  return {
    ok: reasons.length === 0,
    reasons,
  };
}

export function mapUserRolesToGovernanceRole(roles: string[]): GovernanceActorRole {
  const lower = roles.map((role) => String(role || "").toLowerCase());
  if (lower.includes("superadmin") || lower.includes("admin")) return "admin";
  if (lower.includes("reviewer")) return "reviewer";
  if (lower.includes("editorial_actor")) return "editorial_actor";
  if (lower.includes("institutional_actor")) return "institutional_actor";
  if (lower.includes("reviewer") || lower.includes("kurator") || lower.includes("moderator")) return "reviewer";
  if (lower.includes("editor") || lower.includes("redaktion")) return "editorial_actor";
  if (lower.includes("journalist")) return "editorial_actor";
  if (lower.includes("staff") || lower.includes("legitimized") || lower.includes("owner")) return "institutional_actor";
  return "community";
}
