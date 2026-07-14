import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

export const AGENT_ROLE_IDS = [
  "personal_voxy",
  "intake_format",
  "research_source",
  "claims_factcheck",
  "participation_moderation",
  "dossier_briefing",
  "governance_compliance",
] as const;

export const AGENT_SEGMENTS = ["b2c", "b2b", "b2g"] as const;

export const PERSONAL_VOXY_MODES = [
  "passive",
  "relevant_only",
  "periodic_overview",
  "active_companion",
  "topic_watch",
] as const;

export const SCREENSHOT_INTAKE_STAGES = [
  "visible_observation",
  "user_interpretation",
  "possible_hypothesis",
  "source_backed_fact",
  "affected_group_candidate",
  "jurisdiction_candidate",
  "possible_individual_action",
] as const;

export const AGENT_SHARED_RULE_KEYS = [
  "canonicalArtifactsOnly",
  "reuseExistingV3Contracts",
  "noParallelStores",
  "noAutoPublish",
  "reviewFirst",
  "safeTraceOnly",
  "personalizationCannotHideMaterialFacts",
  "translationIsNotEvidence",
  "publicDebattenstandReadingRemainsFree",
] as const;

export const FOLLOWUP_TASK_STATUSES = ["codex_ready", "blocked", "needs_decision"] as const;

export type AgentRoleId = (typeof AGENT_ROLE_IDS)[number];
export type AgentSegment = (typeof AGENT_SEGMENTS)[number];
export type PersonalVoxyMode = (typeof PERSONAL_VOXY_MODES)[number];
export type ScreenshotIntakeStage = (typeof SCREENSHOT_INTAKE_STAGES)[number];
export type AgentSharedRuleKey = (typeof AGENT_SHARED_RULE_KEYS)[number];
export type FollowupTaskStatus = (typeof FOLLOWUP_TASK_STATUSES)[number];

const AgentRoleIdSchema = z.enum(AGENT_ROLE_IDS);
const FollowupTaskStatusSchema = z.enum(FOLLOWUP_TASK_STATUSES);

const SharedRulesSchema = z.object({
  canonicalArtifactsOnly: z.literal(true),
  reuseExistingV3Contracts: z.literal(true),
  noParallelStores: z.literal(true),
  noAutoPublish: z.literal(true),
  reviewFirst: z.literal(true),
  safeTraceOnly: z.literal(true),
  personalizationCannotHideMaterialFacts: z.literal(true),
  translationIsNotEvidence: z.literal(true),
  publicDebattenstandReadingRemainsFree: z.literal(true),
});

const RegistryRoleSchema = z.object({
  id: AgentRoleIdSchema,
  title: z.string().min(1),
  primaryDomains: z.array(z.string().min(1)).min(1),
  allowedArtifacts: z.array(z.string().min(1)).min(1),
  deniedActions: z.array(z.string().min(1)).min(1),
});

const RegistrySchema = z.object({
  schemaVersion: z.string().min(1),
  mode: z.literal("single-runner-multi-role"),
  runner: z.object({
    id: z.literal("lean-continuous-slice-runner"),
    maySpawnParallelAgents: z.literal(false),
    mayAutoMerge: z.literal(false),
    mayDeploy: z.literal(false),
    mayPublish: z.literal(false),
    mayNotifyExternalRecipients: z.literal(false),
    mayUseSecrets: z.literal(false),
  }),
  sharedRules: SharedRulesSchema,
  roles: z.array(RegistryRoleSchema).length(AGENT_ROLE_IDS.length),
  taskMapping: z.record(z.string().min(1), z.array(AgentRoleIdSchema).min(1)),
  municipalTrial: z.object({
    publicReadingAlwaysFree: z.literal(true),
    verifiedTrialAdoptions: z.literal(3),
    trialFeatures: z.array(z.string().min(1)).min(1),
    requiresApprovalBeforeNotification: z.literal(true),
    requiresVerifiedAuthority: z.literal(true),
    postTrial: z.string().min(1),
  }),
});

const BootstrapTaskSchema = z.object({
  id: z.literal("V3-AGENT-REGISTRY-RUNNER-BOOTSTRAP-01"),
  status: z.literal("codex_ready"),
  priority: z.number().int().positive(),
  cluster: z.string().min(1),
  primaryRole: AgentRoleIdSchema,
  supportingRoles: z.array(AgentRoleIdSchema).min(1),
  scope: z.array(z.string().min(1)).min(1),
  nonGoals: z.array(z.string().min(1)).min(1),
  independentReviewRequired: z.literal(true),
});

const FollowupTaskSchema = z.object({
  id: z.string().regex(/^V3-/),
  status: FollowupTaskStatusSchema,
  priority: z.number().int().positive(),
  cluster: z.string().min(1),
  primaryRole: AgentRoleIdSchema,
  supportingRoles: z.array(AgentRoleIdSchema).default([]),
  unblockAfter: z.array(z.string().min(1)).optional(),
  decisionBoundary: z.string().min(1).optional(),
  scope: z.array(z.string().min(1)).optional(),
});

const BootstrapSchema = z.object({
  schemaVersion: z.string().min(1),
  bootstrapTask: BootstrapTaskSchema,
  followupTasks: z.array(FollowupTaskSchema).min(1),
});

export type AgentRegistry = z.infer<typeof RegistrySchema>;
export type AgentRegistryRole = AgentRegistry["roles"][number];
export type AgentBootstrap = z.infer<typeof BootstrapSchema>;
export type AgentBootstrapTask = AgentBootstrap["bootstrapTask"];
export type AgentFollowupTask = AgentBootstrap["followupTasks"][number];
export type AgentTaskRoleResolution = {
  primaryRole: AgentRoleId;
  supportingRoles: AgentRoleId[];
  matchedBy: string;
};

export type AgentSegmentBoundary = {
  id: AgentSegment;
  title: string;
  userFacingMode: string;
  forcedCompanion: boolean;
  optionalGuidance: boolean;
};

export type AgenticBootstrapReadiness = {
  registry: {
    schemaVersion: string;
    roleCount: number;
    validatedRoleIds: AgentRoleId[];
    sharedRuleKeys: AgentSharedRuleKey[];
    deniedActionCount: number;
    allowedArtifactCount: number;
    taskMappingCount: number;
  };
  bootstrap: {
    schemaVersion: string;
    bootstrapTaskId: string;
    bootstrapStatusInOpenTasks: "missing" | "materialized" | "done";
    followupTaskCount: number;
    followupStatuses: Record<FollowupTaskStatus, number>;
    missingFollowupTaskIds: string[];
    codexReadyTaskIds: string[];
    blockedTaskIds: string[];
    needsDecisionTaskIds: string[];
    doneTaskIds: string[];
    primaryRole: AgentRoleId;
    supportingRoles: AgentRoleId[];
    independentReviewRequired: true;
  };
  segments: AgentSegmentBoundary[];
  personalVoxyModes: readonly PersonalVoxyMode[];
  dailyCivicImpulses: {
    optional: true;
    maxPerDay: 3;
    framing: readonly string[];
  };
  screenshotIntakeStages: readonly ScreenshotIntakeStage[];
  sharedRules: Record<AgentSharedRuleKey, true>;
  resolverPreview: Array<{
    taskId: string;
    primaryRole: AgentRoleId;
    supportingRoles: AgentRoleId[];
    status: string;
  }>;
  noParallelArchitecture: true;
  runtimeActivationAllowed: false;
};

const SEGMENT_BOUNDARIES: AgentSegmentBoundary[] = [
  {
    id: "b2c",
    title: "B2C Personal Voxy",
    userFacingMode: "consented companion",
    forcedCompanion: false,
    optionalGuidance: true,
  },
  {
    id: "b2b",
    title: "B2B Workbench",
    userFacingMode: "team workbench",
    forcedCompanion: false,
    optionalGuidance: true,
  },
  {
    id: "b2g",
    title: "B2G Authority Cockpit",
    userFacingMode: "jurisdiction cockpit",
    forcedCompanion: false,
    optionalGuidance: true,
  },
] as const;

const DAILY_CIVIC_FRAMING = [
  "Was bewegt dich heute?",
  "Drei kurze Impulse",
  "Heute aufgefallen",
] as const;

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

function resolveRepoFile(...segments: string[]) {
  const cwd = process.cwd();
  const candidates = [
    cwd,
    resolve(cwd, ".."),
    resolve(cwd, "..", ".."),
  ].map((base) => resolve(base, ...segments));

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  throw new Error(`repo_file_not_found:${segments.join("/")}`);
}

function readRepoTextFile(...segments: string[]) {
  return readFileSync(resolveRepoFile(...segments), "utf8");
}

function readTaskStatusMapFromOpenTasks() {
  const openTasks = readOpenTasksText();
  const matches = openTasks.matchAll(/^\|\s*(V3-[^|]+?)\s*\|\s*([^|]+?)\s*\|/gm);
  const statusMap = new Map<string, string>();

  for (const match of matches) {
    const taskId = match[1]?.trim();
    const status = match[2]?.trim();
    if (!taskId || !status) continue;
    statusMap.set(taskId, status);
  }

  return statusMap;
}

function ensureUniqueRoleIds(registry: AgentRegistry) {
  const actualRoleIds = registry.roles.map((role) => role.id);
  const uniqueRoleIds = unique(actualRoleIds);
  if (uniqueRoleIds.length !== AGENT_ROLE_IDS.length) {
    throw new Error("agent_registry_duplicate_role_ids");
  }
  for (const roleId of AGENT_ROLE_IDS) {
    if (!actualRoleIds.includes(roleId)) {
      throw new Error(`agent_registry_missing_role:${roleId}`);
    }
  }
}

function ensureUniqueRoleEntries(registry: AgentRegistry) {
  for (const role of registry.roles) {
    if (unique(role.deniedActions).length !== role.deniedActions.length) {
      throw new Error(`agent_registry_duplicate_denied_actions:${role.id}`);
    }
    if (unique(role.allowedArtifacts).length !== role.allowedArtifacts.length) {
      throw new Error(`agent_registry_duplicate_allowed_artifacts:${role.id}`);
    }
  }
}

function ensureBootstrapConsistency(bootstrap: AgentBootstrap, registry: AgentRegistry) {
  const followupIds = bootstrap.followupTasks.map((task) => task.id);
  if (unique(followupIds).length !== followupIds.length) {
    throw new Error("agent_bootstrap_duplicate_followup_ids");
  }

  for (const task of bootstrap.followupTasks) {
    if (task.status === "blocked" && (!task.unblockAfter || task.unblockAfter.length === 0)) {
      throw new Error(`agent_bootstrap_blocked_without_dependency:${task.id}`);
    }
    if (task.status === "needs_decision" && !task.decisionBoundary) {
      throw new Error(`agent_bootstrap_needs_decision_without_boundary:${task.id}`);
    }
    if (!registry.roles.some((role) => role.id === task.primaryRole)) {
      throw new Error(`agent_bootstrap_unknown_primary_role:${task.id}`);
    }
  }
}

let cachedRegistry: AgentRegistry | null = null;
let cachedBootstrap: AgentBootstrap | null = null;

export function loadAgentRegistry(): AgentRegistry {
  if (cachedRegistry) return cachedRegistry;
  const parsed = RegistrySchema.parse(JSON.parse(readRepoTextFile(".codex", "agents", "registry.json")));
  ensureUniqueRoleIds(parsed);
  ensureUniqueRoleEntries(parsed);
  cachedRegistry = parsed;
  return parsed;
}

export function loadAgentBootstrap(): AgentBootstrap {
  if (cachedBootstrap) return cachedBootstrap;
  const registry = loadAgentRegistry();
  const parsed = BootstrapSchema.parse(JSON.parse(readRepoTextFile(".codex", "agents", "bootstrap.json")));
  ensureBootstrapConsistency(parsed, registry);
  cachedBootstrap = parsed;
  return parsed;
}

export function readOpenTasksText() {
  return readRepoTextFile("docs", "E150", "OpenTasks.md");
}

export function listAgentRoleCapabilities(roleId: AgentRoleId) {
  const role = loadAgentRegistry().roles.find((entry) => entry.id === roleId);
  if (!role) throw new Error(`agent_role_not_found:${roleId}`);
  return {
    primaryDomains: [...role.primaryDomains],
    allowedArtifacts: [...role.allowedArtifacts],
  };
}

export function enforceDeniedActions(roleId: AgentRoleId, requestedAllowedActions: readonly string[] = []) {
  const role = loadAgentRegistry().roles.find((entry) => entry.id === roleId);
  if (!role) throw new Error(`agent_role_not_found:${roleId}`);

  const denied = new Set(role.deniedActions);
  const allowedActions = requestedAllowedActions.filter((action) => !denied.has(action));
  const ignoredRequestedAllows = requestedAllowedActions.filter((action) => denied.has(action));

  return {
    deniedActions: [...role.deniedActions],
    allowedActions,
    ignoredRequestedAllows,
  };
}

export function enforceSharedRules(overrides: Partial<Record<AgentSharedRuleKey, boolean>> = {}) {
  const registry = loadAgentRegistry();
  const ignoredOverrides: AgentSharedRuleKey[] = [];
  const effectiveRules = { ...registry.sharedRules };

  for (const key of AGENT_SHARED_RULE_KEYS) {
    if (overrides[key] === false) {
      ignoredOverrides.push(key);
    }
    effectiveRules[key] = true;
  }

  return {
    effectiveRules,
    ignoredOverrides,
  };
}

export function resolveTaskToAgentRoles(input: {
  id: string;
  cluster?: string;
  scope?: string | string[];
  primaryRole?: AgentRoleId;
  supportingRoles?: AgentRoleId[];
}): AgentTaskRoleResolution {
  if (input.primaryRole) {
    return {
      primaryRole: input.primaryRole,
      supportingRoles: unique((input.supportingRoles ?? []).filter((role) => role !== input.primaryRole)),
      matchedBy: "explicit_primary_role",
    };
  }

  const bootstrap = loadAgentBootstrap();
  const explicitTask =
    input.id === bootstrap.bootstrapTask.id
      ? bootstrap.bootstrapTask
      : bootstrap.followupTasks.find((task) => task.id === input.id);

  if (explicitTask) {
    return {
      primaryRole: explicitTask.primaryRole,
      supportingRoles: unique(explicitTask.supportingRoles.filter((role) => role !== explicitTask.primaryRole)),
      matchedBy: "bootstrap_registry",
    };
  }

  const registry = loadAgentRegistry();
  const haystack = [input.id, input.cluster, ...(Array.isArray(input.scope) ? input.scope : [input.scope])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const [pattern, roles] of Object.entries(registry.taskMapping)) {
    if (new RegExp(pattern, "i").test(haystack)) {
      return {
        primaryRole: roles[0],
        supportingRoles: unique(roles.slice(1).filter((role) => role !== roles[0])),
        matchedBy: pattern,
      };
    }
  }

  return {
    primaryRole: "governance_compliance",
    supportingRoles: [],
    matchedBy: "fallback_governance_compliance",
  };
}

export function buildAgenticBootstrapReadiness(): AgenticBootstrapReadiness {
  const registry = loadAgentRegistry();
  const bootstrap = loadAgentBootstrap();
  const openTasks = readOpenTasksText();
  const openTaskStatusMap = readTaskStatusMapFromOpenTasks();
  const followupStatuses: Record<FollowupTaskStatus, number> = {
    codex_ready: 0,
    blocked: 0,
    needs_decision: 0,
  };

  for (const task of bootstrap.followupTasks) {
    followupStatuses[task.status] += 1;
  }

  const missingFollowupTaskIds = bootstrap.followupTasks
    .map((task) => task.id)
    .filter((taskId) => !openTasks.includes(taskId));

  const bootstrapStatusInOpenTasks = openTasks.includes(
    `| ${bootstrap.bootstrapTask.id} | done |`,
  )
    ? "done"
    : openTasks.includes(bootstrap.bootstrapTask.id)
      ? "materialized"
      : "missing";

  const deniedActionCount = registry.roles.reduce((total, role) => total + role.deniedActions.length, 0);
  const allowedArtifactCount = registry.roles.reduce(
    (total, role) => total + role.allowedArtifacts.length,
    0,
  );
  const codexReadyTaskIds = bootstrap.followupTasks
    .map((task) => task.id)
    .filter((taskId) => openTaskStatusMap.get(taskId) === "codex_ready");
  const blockedTaskIds = bootstrap.followupTasks
    .map((task) => task.id)
    .filter((taskId) => openTaskStatusMap.get(taskId) === "blocked");
  const needsDecisionTaskIds = bootstrap.followupTasks
    .map((task) => task.id)
    .filter((taskId) => openTaskStatusMap.get(taskId) === "needs_decision");
  const doneTaskIds = bootstrap.followupTasks
    .map((task) => task.id)
    .filter((taskId) => openTaskStatusMap.get(taskId) === "done");

  const resolverPreviewTasks = [
    bootstrap.bootstrapTask,
    ...bootstrap.followupTasks.filter((task) => codexReadyTaskIds.includes(task.id)),
  ];

  return {
    registry: {
      schemaVersion: registry.schemaVersion,
      roleCount: registry.roles.length,
      validatedRoleIds: [...AGENT_ROLE_IDS],
      sharedRuleKeys: [...AGENT_SHARED_RULE_KEYS],
      deniedActionCount,
      allowedArtifactCount,
      taskMappingCount: Object.keys(registry.taskMapping).length,
    },
    bootstrap: {
      schemaVersion: bootstrap.schemaVersion,
      bootstrapTaskId: bootstrap.bootstrapTask.id,
      bootstrapStatusInOpenTasks,
      followupTaskCount: bootstrap.followupTasks.length,
      followupStatuses,
      missingFollowupTaskIds,
      codexReadyTaskIds,
      blockedTaskIds,
      needsDecisionTaskIds,
      doneTaskIds,
      primaryRole: bootstrap.bootstrapTask.primaryRole,
      supportingRoles: [...bootstrap.bootstrapTask.supportingRoles],
      independentReviewRequired: true,
    },
    segments: [...SEGMENT_BOUNDARIES],
    personalVoxyModes: PERSONAL_VOXY_MODES,
    dailyCivicImpulses: {
      optional: true,
      maxPerDay: 3,
      framing: DAILY_CIVIC_FRAMING,
    },
    screenshotIntakeStages: SCREENSHOT_INTAKE_STAGES,
    sharedRules: registry.sharedRules,
    resolverPreview: resolverPreviewTasks.map((task) => {
      const resolved = resolveTaskToAgentRoles({
        id: task.id,
        cluster: task.cluster,
        scope: "scope" in task ? task.scope : undefined,
      });
      return {
        taskId: task.id,
        primaryRole: resolved.primaryRole,
        supportingRoles: resolved.supportingRoles,
        status: task.status,
      };
    }),
    noParallelArchitecture: true,
    runtimeActivationAllowed: false,
  };
}
