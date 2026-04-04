import type { CreateMode } from "@/features/create/intents";
import { normalizeInternalRedirectPath, type InternalRedirectPath } from "@/features/create/finalizeRedirect";

export const CREATE_ENTRY_INTENTS = [
  "issue_signal",
  "content_companion",
  "round_setup",
  "org_context_setup",
] as const;

export type CreateEntryIntent = (typeof CREATE_ENTRY_INTENTS)[number];

export const CREATE_ENTRY_MODES = ["guided", "direct"] as const;
export type CreateEntryMode = (typeof CREATE_ENTRY_MODES)[number];

export const CREATE_CONTEXT_KINDS = [
  "anlassraum",
  "dossier",
  "round",
  "companion",
  "org_context",
] as const;
export type CreateContextKind = (typeof CREATE_CONTEXT_KINDS)[number];

export const CREATE_GOAL_KINDS = [
  "issue_intake",
  "companion_followup",
  "round_setup",
  "org_context_setup",
] as const;
export type CreateGoalKind = (typeof CREATE_GOAL_KINDS)[number];

export type CreateOrchestratorTargetSurface = "swipes" | "runden" | "dossier";

export type CreateOrchestratorIntentContract = {
  entryIntent: CreateEntryIntent;
  entryMode: CreateEntryMode;
  workspaceMode: "statement" | "contribution";
  createMode: CreateMode;
  contextKind: CreateContextKind;
  goalKind: CreateGoalKind;
  draftStatus: "intake_draft";
  routing: {
    createAsIntakeOrchestrator: true;
    rundenAsOperatingSurface: true;
    requiresReviewBeforePublish: true;
    targetSurface: CreateOrchestratorTargetSurface;
  };
  analysisLayer: {
    preservesOriginalInput: true;
    suggestionsAreNonBinding: true;
    userDecisionRequired: true;
    noAutoPublish: true;
    noTruthOrPriorityUpgrade: true;
  };
  guardrails: {
    forbidsTruthPrivilege: true;
    forbidsPriorityPrivilege: true;
    forbidsRankingPrivilege: true;
    forbidsVotingPrivilege: true;
    keepsDossierAsUpperContext: true;
    keepsCompanionAsFollowupFormat: true;
  };
};

function normalize(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

function hasExplicitIntent(raw: unknown): boolean {
  const value = normalize(raw);
  return value.length > 0;
}

export function parseCreateEntryIntent(raw: unknown): CreateEntryIntent | undefined {
  const value = normalize(raw);
  if (!value) return undefined;

  if (value === "issue_signal" || value === "signal" || value === "issue") return "issue_signal";
  if (value === "content_companion" || value === "companion" || value === "content") {
    return "content_companion";
  }
  if (value === "round_setup" || value === "round" || value === "runde") return "round_setup";
  if (
    value === "org_context_setup" ||
    value === "org_setup" ||
    value === "organization_context" ||
    value === "publisher_context"
  ) {
    return "org_context_setup";
  }

  // Legacy create intents map into canonical intake intents.
  if (
    value === "claim" ||
    value === "question" ||
    value === "perspective" ||
    value === "objection" ||
    value === "option" ||
    value === "factcheck" ||
    value === "statement"
  ) {
    return "issue_signal";
  }
  if (value === "source" || value === "contribution") return "content_companion";

  return undefined;
}

export function parseCreateEntryMode(raw: unknown): CreateEntryMode | undefined {
  const value = normalize(raw);
  if (!value) return undefined;
  if (value === "guided" || value === "assist" || value === "beratung" || value === "guided_assist") {
    return "guided";
  }
  if (value === "direct" || value === "manual" || value === "manuell") return "direct";
  if (value === "ai" || value === "source") return "guided";
  return undefined;
}

function resolveTargetSurface(params: {
  entryIntent: CreateEntryIntent;
  dossierId?: string | null;
  selectedAnlassraumId?: string | null;
}): CreateOrchestratorTargetSurface {
  if (typeof params.dossierId === "string" && params.dossierId.trim()) return "dossier";

  if (params.entryIntent === "round_setup" || params.entryIntent === "org_context_setup") {
    return "runden";
  }

  if (params.entryIntent === "content_companion" && params.selectedAnlassraumId) {
    return "runden";
  }

  return "swipes";
}

export function resolveCreateOrchestratorIntentContract(input: {
  rawEntryIntent?: unknown;
  rawEntryMode?: unknown;
  canSubmitContribution: boolean;
  canSubmitStatement: boolean;
  dossierId?: string | null;
  selectedAnlassraumId?: string | null;
}): CreateOrchestratorIntentContract {
  const entryIntent = parseCreateEntryIntent(input.rawEntryIntent) ?? "issue_signal";
  const entryMode = parseCreateEntryMode(input.rawEntryMode) ?? "guided";
  const explicitIntent = hasExplicitIntent(input.rawEntryIntent);

  const baseWorkspaceMode: "statement" | "contribution" =
    input.canSubmitContribution && input.canSubmitStatement ? "contribution" : "statement";

  let workspaceMode: "statement" | "contribution" = baseWorkspaceMode;
  let createMode: CreateMode = baseWorkspaceMode === "statement" ? "manual" : "source";
  let contextKind: CreateContextKind = "anlassraum";
  let goalKind: CreateGoalKind = "issue_intake";

  if (explicitIntent) {
    switch (entryIntent) {
      case "issue_signal":
        workspaceMode = input.canSubmitStatement ? "statement" : baseWorkspaceMode;
        createMode = workspaceMode === "statement" || entryMode === "direct" ? "manual" : "source";
        contextKind = "anlassraum";
        goalKind = "issue_intake";
        break;
      case "content_companion":
        workspaceMode = input.canSubmitContribution ? "contribution" : "statement";
        createMode = workspaceMode === "statement" ? "manual" : "source";
        contextKind = input.dossierId ? "dossier" : "companion";
        goalKind = "companion_followup";
        break;
      case "round_setup":
        workspaceMode = input.canSubmitContribution ? "contribution" : "statement";
        createMode = workspaceMode === "statement" || entryMode === "direct" ? "manual" : "source";
        contextKind = "round";
        goalKind = "round_setup";
        break;
      case "org_context_setup":
        workspaceMode = input.canSubmitContribution ? "contribution" : "statement";
        createMode = workspaceMode === "statement" || entryMode === "direct" ? "manual" : "source";
        contextKind = "org_context";
        goalKind = "org_context_setup";
        break;
    }
  }

  if (workspaceMode === "statement") {
    createMode = "manual";
  }

  const targetSurface = resolveTargetSurface({
    entryIntent,
    dossierId: input.dossierId,
    selectedAnlassraumId: input.selectedAnlassraumId,
  });

  return {
    entryIntent,
    entryMode,
    workspaceMode,
    createMode,
    contextKind,
    goalKind,
    draftStatus: "intake_draft",
    routing: {
      createAsIntakeOrchestrator: true,
      rundenAsOperatingSurface: true,
      requiresReviewBeforePublish: true,
      targetSurface,
    },
    analysisLayer: {
      preservesOriginalInput: true,
      suggestionsAreNonBinding: true,
      userDecisionRequired: true,
      noAutoPublish: true,
      noTruthOrPriorityUpgrade: true,
    },
    guardrails: {
      forbidsTruthPrivilege: true,
      forbidsPriorityPrivilege: true,
      forbidsRankingPrivilege: true,
      forbidsVotingPrivilege: true,
      keepsDossierAsUpperContext: true,
      keepsCompanionAsFollowupFormat: true,
    },
  };
}

export function buildCreateIntentFallbackPath(params: {
  contract: CreateOrchestratorIntentContract;
  dossierId?: string | null;
}): InternalRedirectPath {
  const dossierId = typeof params.dossierId === "string" ? params.dossierId.trim() : "";
  if (dossierId) {
    return `/dossier/${encodeURIComponent(dossierId)}` as InternalRedirectPath;
  }
  if (params.contract.routing.targetSurface === "runden") {
    return "/runden";
  }
  const normalized = normalizeInternalRedirectPath("/swipes");
  return normalized ?? "/swipes";
}
