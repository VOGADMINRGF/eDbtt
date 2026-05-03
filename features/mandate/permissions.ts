import type { Mandate } from "./contract";

export const MANDATE_ACTOR_ROLES = [
  "guest",
  "citizen",
  "journalist",
  "fachakteur",
  "organisation_representative",
  "verwaltung_representative",
  "mandate_representative",
  "admin",
] as const;

export type MandateActorRole = (typeof MANDATE_ACTOR_ROLES)[number];

export const MANDATE_PERMISSION_ACTIONS = [
  "read_mandate",
  "submit_source_hint",
  "submit_objection",
  "submit_followup_question",
  "submit_progress_observation",
  "submit_factcheck_hint",
  "accept_mandate",
  "update_mandate_status",
  "update_mandate_responsibility",
  "update_mandate_resolution_details",
  "admin_verify_mandate",
  "admin_set_visibility",
  "admin_mark_conflict",
] as const;

export type MandatePermissionAction = (typeof MANDATE_PERMISSION_ACTIONS)[number];
export type MandatePermissionMatrix = Record<MandatePermissionAction, boolean>;

export type ResolveMandatePermissionInput = {
  role: MandateActorRole;
  mandate: Mandate;
  actorReferenceIds?: string[];
};

function emptyMatrix(): MandatePermissionMatrix {
  return {
    read_mandate: false,
    submit_source_hint: false,
    submit_objection: false,
    submit_followup_question: false,
    submit_progress_observation: false,
    submit_factcheck_hint: false,
    accept_mandate: false,
    update_mandate_status: false,
    update_mandate_responsibility: false,
    update_mandate_resolution_details: false,
    admin_verify_mandate: false,
    admin_set_visibility: false,
    admin_mark_conflict: false,
  };
}

function isAuthenticated(role: MandateActorRole): boolean {
  return role !== "guest";
}

function canMaintainOwnMandate(role: MandateActorRole): boolean {
  return (
    role === "organisation_representative" ||
    role === "verwaltung_representative" ||
    role === "mandate_representative"
  );
}

function isResponsibleForMandate(input: ResolveMandatePermissionInput): boolean {
  const refs = new Set(input.actorReferenceIds ?? []);
  return refs.has(input.mandate.responsibility.holderId);
}

export function normalizeMandateActorRole(value: unknown): MandateActorRole {
  if (typeof value !== "string") return "guest";
  const normalized = value.trim().toLowerCase();
  const match = MANDATE_ACTOR_ROLES.find((role) => role === normalized);
  return match ?? "guest";
}

export function resolveMandatePermissionMatrix(
  input: ResolveMandatePermissionInput,
): MandatePermissionMatrix {
  const matrix = emptyMatrix();

  if (input.mandate.visibility === "public_readonly") {
    matrix.read_mandate = true;
  }

  if (isAuthenticated(input.role)) {
    matrix.submit_source_hint = true;
    matrix.submit_objection = true;
    matrix.submit_followup_question = true;
    matrix.submit_progress_observation = true;
  }

  if (input.role === "journalist" || input.role === "fachakteur" || input.role === "admin") {
    matrix.submit_factcheck_hint = true;
  }

  if (canMaintainOwnMandate(input.role) && isResponsibleForMandate(input)) {
    matrix.accept_mandate = true;
    matrix.update_mandate_status = true;
    matrix.update_mandate_responsibility = true;
    matrix.update_mandate_resolution_details = true;
  }

  if (input.role === "admin") {
    matrix.accept_mandate = true;
    matrix.update_mandate_status = true;
    matrix.update_mandate_responsibility = true;
    matrix.update_mandate_resolution_details = true;
    matrix.admin_verify_mandate = true;
    matrix.admin_set_visibility = true;
    matrix.admin_mark_conflict = true;
  }

  return matrix;
}

export function canPerformMandateAction(
  input: ResolveMandatePermissionInput,
  action: MandatePermissionAction,
): boolean {
  return resolveMandatePermissionMatrix(input)[action];
}
