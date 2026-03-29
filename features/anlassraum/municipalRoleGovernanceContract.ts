import type { GovernanceActorRole } from "@features/trust/types";
import type { MunicipalResponsibilityScope } from "@features/anlassraum/municipalResponsibilityGuardrails";
import { MUNICIPAL_ALLOWED_SCOPES } from "@features/anlassraum/municipalResponsibilityGuardrails";
import type { MunicipalGovernanceMode, MunicipalReleaseStatus } from "@features/anlassraum/municipalGovernanceModeContract";
import type { MunicipalResponsibilityStatus } from "@features/anlassraum/municipalResponsibilityGuardrails";

export type MunicipalRoleProfile =
  | "public_monitoring"
  | "institution_leadership"
  | "department_owner"
  | "office_operator"
  | "institution_followup_team";

export type MunicipalGovernanceAction =
  | "view_monitoring_meta"
  | "assign_responsibility_scope"
  | "set_process_status"
  | "set_followup_status"
  | "set_release_status"
  | "request_public_trace_release"
  | "approve_public_trace_release"
  | "reject_public_trace_release"
  | "set_mandate_progress"
  | "add_governance_note";

export type MunicipalRoleGovernanceContract = {
  institutionalContext: boolean;
  actorRole: GovernanceActorRole | "unknown";
  responsibilityScope: MunicipalResponsibilityScope | null;
  governanceMode: MunicipalGovernanceMode;
  roleProfile: MunicipalRoleProfile;
  allowedActions: readonly MunicipalGovernanceAction[];
  reasonAuditRequiredActions: readonly MunicipalGovernanceAction[];
  guardrails: {
    monitoringFirst: true;
    deniesTruthPrivilege: true;
    deniesPriorityPrivilege: true;
    deniesInstitutionalAutoOverride: true;
    requiresExplainableRoleBoundaries: true;
  };
};

export type MunicipalRoleGovernanceConsistency = {
  ok: boolean;
  issues: string[];
};

const ROLE_ACTIONS: Record<MunicipalRoleProfile, readonly MunicipalGovernanceAction[]> = {
  public_monitoring: ["view_monitoring_meta"],
  institution_leadership: [
    "view_monitoring_meta",
    "assign_responsibility_scope",
    "set_process_status",
    "set_followup_status",
    "set_release_status",
    "request_public_trace_release",
    "approve_public_trace_release",
    "reject_public_trace_release",
    "set_mandate_progress",
    "add_governance_note",
  ],
  department_owner: [
    "view_monitoring_meta",
    "assign_responsibility_scope",
    "set_process_status",
    "set_followup_status",
    "request_public_trace_release",
    "reject_public_trace_release",
    "set_mandate_progress",
    "add_governance_note",
  ],
  office_operator: [
    "view_monitoring_meta",
    "set_process_status",
    "set_followup_status",
    "request_public_trace_release",
    "set_mandate_progress",
    "add_governance_note",
  ],
  institution_followup_team: [
    "view_monitoring_meta",
    "set_followup_status",
    "set_mandate_progress",
    "add_governance_note",
  ],
} as const;

const AUDIT_REQUIRED_ACTIONS: readonly MunicipalGovernanceAction[] = [
  "assign_responsibility_scope",
  "set_process_status",
  "set_followup_status",
  "set_release_status",
  "request_public_trace_release",
  "approve_public_trace_release",
  "reject_public_trace_release",
  "set_mandate_progress",
  "add_governance_note",
] as const;

function normalizeActorRole(value: unknown): GovernanceActorRole | "unknown" {
  if (typeof value !== "string") return "unknown";
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "community" ||
    normalized === "editor" ||
    normalized === "reviewer" ||
    normalized === "admin" ||
    normalized === "institutional_actor" ||
    normalized === "editorial_actor"
  ) {
    return normalized;
  }
  return "unknown";
}

function normalizeScope(value: unknown): MunicipalResponsibilityScope | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (MUNICIPAL_ALLOWED_SCOPES.includes(normalized as MunicipalResponsibilityScope)) {
    return normalized as MunicipalResponsibilityScope;
  }
  return null;
}

function resolveRoleProfile(input: {
  institutionalContext: boolean;
  actorRole: GovernanceActorRole | "unknown";
  responsibilityScope: MunicipalResponsibilityScope | null;
  governanceMode: MunicipalGovernanceMode;
}): MunicipalRoleProfile {
  if (!input.institutionalContext || input.governanceMode === "monitoring_only") return "public_monitoring";
  if (input.actorRole === "admin") return "institution_leadership";
  if (input.actorRole !== "institutional_actor") return "public_monitoring";
  if (input.responsibilityScope === "dezernat" || input.responsibilityScope === "fachbereich") {
    return "department_owner";
  }
  if (input.responsibilityScope === "amt") return "office_operator";
  return "institution_followup_team";
}

export function resolveMunicipalRoleGovernanceContract(input: {
  institutionalContext: boolean;
  actorRole: unknown;
  responsibilityScope?: unknown;
  governanceMode: MunicipalGovernanceMode;
}): MunicipalRoleGovernanceContract {
  const institutionalContext = Boolean(input.institutionalContext);
  const actorRole = normalizeActorRole(input.actorRole);
  const responsibilityScope = institutionalContext ? normalizeScope(input.responsibilityScope) : null;
  const governanceMode = input.governanceMode;
  const roleProfile = resolveRoleProfile({
    institutionalContext,
    actorRole,
    responsibilityScope,
    governanceMode,
  });

  return {
    institutionalContext,
    actorRole,
    responsibilityScope,
    governanceMode,
    roleProfile,
    allowedActions: ROLE_ACTIONS[roleProfile],
    reasonAuditRequiredActions: AUDIT_REQUIRED_ACTIONS.filter((action) => ROLE_ACTIONS[roleProfile].includes(action)),
    guardrails: {
      monitoringFirst: true,
      deniesTruthPrivilege: true,
      deniesPriorityPrivilege: true,
      deniesInstitutionalAutoOverride: true,
      requiresExplainableRoleBoundaries: true,
    },
  };
}

export function validateMunicipalRoleGovernanceConsistency(input: {
  contract: MunicipalRoleGovernanceContract;
  processStatus: MunicipalResponsibilityStatus;
  releaseStatus: MunicipalReleaseStatus;
}): MunicipalRoleGovernanceConsistency {
  const issues: string[] = [];
  const { contract, processStatus, releaseStatus } = input;
  const hasAction = (action: MunicipalGovernanceAction) => contract.allowedActions.includes(action);

  if (!contract.institutionalContext && contract.roleProfile !== "public_monitoring") {
    issues.push("non_institutional_context_requires_public_monitoring_profile");
  }
  if (contract.governanceMode === "monitoring_only" && contract.roleProfile !== "public_monitoring") {
    issues.push("monitoring_only_mode_requires_public_monitoring_profile");
  }
  if (contract.roleProfile === "public_monitoring" && processStatus !== "beobachtet") {
    issues.push("public_monitoring_profile_cannot_drive_non_monitoring_process_status");
  }
  if (releaseStatus === "approved_for_public_trace" && !hasAction("approve_public_trace_release")) {
    issues.push("approved_public_trace_requires_approve_release_permission");
  }
  if (processStatus === "abgeschlossen" && !hasAction("set_process_status")) {
    issues.push("closed_process_state_requires_process_status_permission");
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}
