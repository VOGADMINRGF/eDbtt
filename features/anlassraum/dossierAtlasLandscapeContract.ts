import { z } from "zod";

export const DOSSIER_ATLAS_NODE_TYPES = [
  "topic_cluster",
  "subtopic_cluster",
  "anlass_node",
  "dossier_node",
  "round_node",
  "result_node",
  "companion_node",
  "org_context_marker",
  "editorial_context_marker",
  "civic_context_marker",
  "expert_context_marker",
] as const;

export const DOSSIER_ATLAS_RELATION_TYPES = [
  "topic_contains_subtopic",
  "topic_links_anlass",
  "topic_links_dossier",
  "anlass_links_round",
  "anlass_links_result",
  "anlass_links_companion",
  "dossier_links_round",
  "dossier_links_result",
  "round_links_result",
  "context_marks_anlass",
  "context_marks_dossier",
] as const;

export const DOSSIER_ATLAS_CONTEXT_GROUPS = [
  "association",
  "initiative",
  "organization",
  "editorial_publisher",
  "civic_creator",
  "expert_voice",
] as const;

export const DOSSIER_ATLAS_ACTIVITY_BANDS = ["none", "low", "medium", "high"] as const;
export const DOSSIER_ATLAS_LIFECYCLE_STATES = [
  "unknown",
  "open",
  "active",
  "closed",
  "archived",
] as const;
export const DOSSIER_ATLAS_WORK_STATES = [
  "unknown",
  "monitoring",
  "in_progress",
  "review",
  "completed",
] as const;

export type DossierAtlasNodeType = (typeof DOSSIER_ATLAS_NODE_TYPES)[number];
export type DossierAtlasRelationType = (typeof DOSSIER_ATLAS_RELATION_TYPES)[number];
export type DossierAtlasContextGroup = (typeof DOSSIER_ATLAS_CONTEXT_GROUPS)[number];

type DossierAtlasSourceItem = {
  title: string;
  topicKey?: string | null;
  topicLabel?: string | null;
  regionKey?: string | null;
  regionCode?: string | null;
  anlassId?: string | null;
  dossierId?: string | null;
  roundId?: string | null;
  resultId?: string | null;
  companionId?: string | null;
  lifecycle?: string | null;
  activityBand?: string | null;
  workState?: string | null;
  contextGroups?: DossierAtlasContextGroup[];
};

type ResolveDossierAtlasLandscapeInput = {
  generatedAt?: string | null;
  items: DossierAtlasSourceItem[];
  weeklySnapshot?: {
    newContributions?: number;
    newAnlassraeume?: number;
    activeRounds?: number;
    openQuestions?: number;
    newDossiers?: number;
    followupFlows?: number;
  } | null;
};

const DossierAtlasNodeSchema = z
  .object({
    nodeId: z.string().trim().min(1).max(180),
    nodeType: z.enum(DOSSIER_ATLAS_NODE_TYPES),
    label: z.string().trim().min(1).max(180),
    topicAxis: z
      .object({
        topicKey: z.string().trim().min(1).max(120),
        topicLabel: z.string().trim().min(1).max(180),
      })
      .nullable(),
    regionAxis: z
      .object({
        regionKey: z.string().trim().min(1).max(120),
        regionCode: z.string().trim().min(1).max(40).nullable(),
      })
      .nullable(),
    statusLayer: z
      .object({
        lifecycle: z.enum(DOSSIER_ATLAS_LIFECYCLE_STATES),
        activityBand: z.enum(DOSSIER_ATLAS_ACTIVITY_BANDS),
        workState: z.enum(DOSSIER_ATLAS_WORK_STATES),
      })
      .strict(),
    contextGroups: z.array(z.enum(DOSSIER_ATLAS_CONTEXT_GROUPS)).max(6),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      (value.nodeType === "topic_cluster" || value.nodeType === "subtopic_cluster") &&
      !value.topicAxis
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["topicAxis"],
        message: "topic_clusters_require_topic_axis",
      });
    }
    if (value.nodeType === "result_node" && value.statusLayer.lifecycle === "active") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["statusLayer", "lifecycle"],
        message: "result_nodes_cannot_be_active",
      });
    }
  });

const DossierAtlasRelationshipSchema = z
  .object({
    fromNodeId: z.string().trim().min(1).max(180),
    toNodeId: z.string().trim().min(1).max(180),
    relationType: z.enum(DOSSIER_ATLAS_RELATION_TYPES),
    nonEpistemic: z.literal(true),
    nonPriorityBoost: z.literal(true),
  })
  .strict();

const DossierAtlasLandscapeSchema = z
  .object({
    generatedAt: z.string().datetime(),
    topicAxis: z
      .object({
        clusters: z.array(
          z
            .object({
              topicKey: z.string().trim().min(1).max(120),
              topicLabel: z.string().trim().min(1).max(180),
              nodeId: z.string().trim().min(1).max(180),
              anlassCount: z.number().int().min(0),
              dossierCount: z.number().int().min(0),
              roundCount: z.number().int().min(0),
              resultCount: z.number().int().min(0),
            })
            .strict(),
        ),
        separatedFromRegionAxis: z.literal(true),
      })
      .strict(),
    regionAxis: z
      .object({
        regions: z.array(
          z
            .object({
              regionKey: z.string().trim().min(1).max(120),
              regionCode: z.string().trim().min(1).max(40).nullable(),
              label: z.string().trim().min(1).max(180),
              anlassCount: z.number().int().min(0),
              roundCount: z.number().int().min(0),
              resultCount: z.number().int().min(0),
            })
            .strict(),
        ),
        separatedFromTopicAxis: z.literal(true),
      })
      .strict(),
    nodes: z.array(DossierAtlasNodeSchema).max(1200),
    relationships: z.array(DossierAtlasRelationshipSchema).max(3000),
    aggregates: z
      .object({
        totals: z
          .object({
            topics: z.number().int().min(0),
            anlaesse: z.number().int().min(0),
            dossiers: z.number().int().min(0),
            rounds: z.number().int().min(0),
            results: z.number().int().min(0),
            companions: z.number().int().min(0),
            contextMarkers: z.number().int().min(0),
          })
          .strict(),
        weeklySnapshot: z
          .object({
            newContributions: z.number().int().min(0),
            newAnlassraeume: z.number().int().min(0),
            activeRounds: z.number().int().min(0),
            openQuestions: z.number().int().min(0),
            newDossiers: z.number().int().min(0),
            followupFlows: z.number().int().min(0),
          })
          .strict(),
      })
      .strict(),
    contextGroups: z
      .object({
        association: z.number().int().min(0),
        initiative: z.number().int().min(0),
        organization: z.number().int().min(0),
        editorial_publisher: z.number().int().min(0),
        civic_creator: z.number().int().min(0),
        expert_voice: z.number().int().min(0),
      })
      .strict(),
    guardrails: z
      .object({
        keepsTopicRegionSeparated: z.literal(true),
        forbidsTruthPrivilegeFromContext: z.literal(true),
        forbidsPriorityPrivilegeFromContext: z.literal(true),
        forbidsVotingPrivilegeFromContext: z.literal(true),
        keepsFeedAsSignalOnly: z.literal(true),
        keepsNoAutoPublish: z.literal(true),
        forbidsReputationScoring: z.literal(true),
        supportsWeeklySnapshotWithoutRanking: z.literal(true),
      })
      .strict(),
    forbiddenInferences: z.tuple([
      z.literal("activity_is_not_truth"),
      z.literal("context_visibility_is_not_priority"),
      z.literal("org_editorial_expert_is_not_voting_weight"),
      z.literal("topic_axis_is_not_region_axis"),
      z.literal("snapshot_is_not_toplist"),
    ]),
    explainability: z
      .object({
        reasonRequiredFields: z.tuple([
          z.literal("nodeType"),
          z.literal("topicAxis"),
          z.literal("regionAxis"),
          z.literal("statusLayer"),
          z.literal("contextGroups"),
          z.literal("source"),
        ]),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const nodeIds = new Set(value.nodes.map((node) => node.nodeId));
    for (const relation of value.relationships) {
      if (!nodeIds.has(relation.fromNodeId) || !nodeIds.has(relation.toNodeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["relationships"],
          message: "relationship_references_unknown_node",
        });
        break;
      }
    }
  });

export type DossierAtlasLandscapeContract = z.infer<typeof DossierAtlasLandscapeSchema>;
export type DossierAtlasLandscapeParseResult =
  | { ok: true; value: DossierAtlasLandscapeContract }
  | { ok: false; error: string; issues: string[] };

export type DossierAtlasLandscapeConsistency = {
  ok: boolean;
  issues: string[];
};

function normalize(value: unknown): string | null {
  const out = typeof value === "string" ? value.trim() : "";
  return out ? out : null;
}

function lifecycleFromValue(value: unknown): (typeof DOSSIER_ATLAS_LIFECYCLE_STATES)[number] {
  const normalized = normalize(value);
  if (normalized === "open") return "open";
  if (normalized === "active") return "active";
  if (normalized === "closed") return "closed";
  if (normalized === "archived") return "archived";
  return "unknown";
}

function activityBandFromValue(value: unknown): (typeof DOSSIER_ATLAS_ACTIVITY_BANDS)[number] {
  const normalized = normalize(value);
  if (normalized === "low") return "low";
  if (normalized === "medium") return "medium";
  if (normalized === "high") return "high";
  return "none";
}

function workStateFromValue(value: unknown): (typeof DOSSIER_ATLAS_WORK_STATES)[number] {
  const normalized = normalize(value);
  if (normalized === "monitoring") return "monitoring";
  if (normalized === "in_progress") return "in_progress";
  if (normalized === "review") return "review";
  if (normalized === "completed") return "completed";
  return "unknown";
}

function toContextMarkerNodeType(
  contextGroup: DossierAtlasContextGroup,
): DossierAtlasNodeType {
  if (contextGroup === "expert_voice") return "expert_context_marker";
  if (contextGroup === "editorial_publisher") return "editorial_context_marker";
  if (contextGroup === "civic_creator") return "civic_context_marker";
  return "org_context_marker";
}

function toTopicLabel(topicKey: string): string {
  return topicKey
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toRegionLabel(regionKey: string): string {
  return regionKey
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function addNode(
  bucket: Map<string, z.infer<typeof DossierAtlasNodeSchema>>,
  node: z.infer<typeof DossierAtlasNodeSchema>,
) {
  if (!bucket.has(node.nodeId)) {
    bucket.set(node.nodeId, node);
  }
}

function addRelation(
  bucket: Map<string, z.infer<typeof DossierAtlasRelationshipSchema>>,
  relation: z.infer<typeof DossierAtlasRelationshipSchema>,
) {
  const key = `${relation.fromNodeId}|${relation.relationType}|${relation.toNodeId}`;
  if (!bucket.has(key)) {
    bucket.set(key, relation);
  }
}

export function resolveDossierAtlasLandscapeContract(
  input: ResolveDossierAtlasLandscapeInput,
): DossierAtlasLandscapeContract {
  const generatedAt =
    normalize(input.generatedAt) ?? new Date().toISOString();
  const items = Array.isArray(input.items) ? input.items : [];

  const nodeMap = new Map<string, z.infer<typeof DossierAtlasNodeSchema>>();
  const relationMap = new Map<string, z.infer<typeof DossierAtlasRelationshipSchema>>();

  const topicStats = new Map<
    string,
    { topicLabel: string; nodeId: string; anlassCount: number; dossierCount: number; roundCount: number; resultCount: number }
  >();
  const regionStats = new Map<
    string,
    { regionCode: string | null; label: string; anlassCount: number; roundCount: number; resultCount: number }
  >();

  const contextGroupCounts: Record<DossierAtlasContextGroup, number> = {
    association: 0,
    initiative: 0,
    organization: 0,
    editorial_publisher: 0,
    civic_creator: 0,
    expert_voice: 0,
  };

  let fallbackCounter = 0;
  for (const item of items) {
    const title = normalize(item.title) ?? "Anlasskontext";
    fallbackCounter += 1;
    const fallbackId = String(fallbackCounter).padStart(4, "0");
    const anlassId =
      normalize(item.anlassId) ??
      normalize(item.roundId) ??
      `anlass-${fallbackId}`;
    const roundId =
      normalize(item.roundId) ?? normalize(item.anlassId) ?? `round-${fallbackId}`;
    const dossierId = normalize(item.dossierId);
    const resultId = normalize(item.resultId);
    const companionId = normalize(item.companionId);
    const topicKey = normalize(item.topicKey) ?? "unsorted";
    const topicLabel = normalize(item.topicLabel) ?? toTopicLabel(topicKey);
    const regionKey = normalize(item.regionKey);
    const regionCode = normalize(item.regionCode);
    const lifecycle = lifecycleFromValue(item.lifecycle);
    const activityBand = activityBandFromValue(item.activityBand);
    const workState = workStateFromValue(item.workState);
    const contextGroups = Array.isArray(item.contextGroups)
      ? item.contextGroups.filter((group): group is DossierAtlasContextGroup =>
          DOSSIER_ATLAS_CONTEXT_GROUPS.includes(group),
        )
      : [];

    const topicNodeId = `topic:${topicKey}`;
    addNode(nodeMap, {
      nodeId: topicNodeId,
      nodeType: "topic_cluster",
      label: topicLabel,
      topicAxis: { topicKey, topicLabel },
      regionAxis: null,
      statusLayer: {
        lifecycle: "active",
        activityBand: "none",
        workState: "monitoring",
      },
      contextGroups: [],
    });

    addNode(nodeMap, {
      nodeId: `anlass:${anlassId}`,
      nodeType: "anlass_node",
      label: title,
      topicAxis: { topicKey, topicLabel },
      regionAxis: regionKey
        ? {
            regionKey,
            regionCode,
          }
        : null,
      statusLayer: {
        lifecycle,
        activityBand,
        workState,
      },
      contextGroups,
    });

    addNode(nodeMap, {
      nodeId: `round:${roundId}`,
      nodeType: "round_node",
      label: title,
      topicAxis: { topicKey, topicLabel },
      regionAxis: regionKey
        ? {
            regionKey,
            regionCode,
          }
        : null,
      statusLayer: {
        lifecycle,
        activityBand,
        workState,
      },
      contextGroups,
    });

    addRelation(relationMap, {
      fromNodeId: topicNodeId,
      toNodeId: `anlass:${anlassId}`,
      relationType: "topic_links_anlass",
      nonEpistemic: true,
      nonPriorityBoost: true,
    });

    addRelation(relationMap, {
      fromNodeId: `anlass:${anlassId}`,
      toNodeId: `round:${roundId}`,
      relationType: "anlass_links_round",
      nonEpistemic: true,
      nonPriorityBoost: true,
    });

    if (dossierId) {
      addNode(nodeMap, {
        nodeId: `dossier:${dossierId}`,
        nodeType: "dossier_node",
        label: `Dossier ${dossierId.slice(0, 10)}`,
        topicAxis: { topicKey, topicLabel },
        regionAxis: null,
        statusLayer: {
          lifecycle: lifecycle === "closed" ? "closed" : "active",
          activityBand,
          workState,
        },
        contextGroups,
      });
      addRelation(relationMap, {
        fromNodeId: topicNodeId,
        toNodeId: `dossier:${dossierId}`,
        relationType: "topic_links_dossier",
        nonEpistemic: true,
        nonPriorityBoost: true,
      });
      addRelation(relationMap, {
        fromNodeId: `dossier:${dossierId}`,
        toNodeId: `round:${roundId}`,
        relationType: "dossier_links_round",
        nonEpistemic: true,
        nonPriorityBoost: true,
      });
    }

    if (resultId || lifecycle === "closed") {
      const effectiveResultId = resultId ?? `${roundId}-result`;
      addNode(nodeMap, {
        nodeId: `result:${effectiveResultId}`,
        nodeType: "result_node",
        label: `Ergebnis ${title}`,
        topicAxis: { topicKey, topicLabel },
        regionAxis: regionKey
          ? {
              regionKey,
              regionCode,
            }
          : null,
        statusLayer: {
          lifecycle: "closed",
          activityBand: activityBand === "none" ? "low" : activityBand,
          workState: "completed",
        },
        contextGroups,
      });
      addRelation(relationMap, {
        fromNodeId: `round:${roundId}`,
        toNodeId: `result:${effectiveResultId}`,
        relationType: "round_links_result",
        nonEpistemic: true,
        nonPriorityBoost: true,
      });
      addRelation(relationMap, {
        fromNodeId: `anlass:${anlassId}`,
        toNodeId: `result:${effectiveResultId}`,
        relationType: "anlass_links_result",
        nonEpistemic: true,
        nonPriorityBoost: true,
      });
      if (dossierId) {
        addRelation(relationMap, {
          fromNodeId: `dossier:${dossierId}`,
          toNodeId: `result:${effectiveResultId}`,
          relationType: "dossier_links_result",
          nonEpistemic: true,
          nonPriorityBoost: true,
        });
      }
    }

    if (companionId) {
      addNode(nodeMap, {
        nodeId: `companion:${companionId}`,
        nodeType: "companion_node",
        label: `Companion ${title}`,
        topicAxis: { topicKey, topicLabel },
        regionAxis: null,
        statusLayer: {
          lifecycle: lifecycle === "closed" ? "closed" : "active",
          activityBand,
          workState,
        },
        contextGroups,
      });
      addRelation(relationMap, {
        fromNodeId: `anlass:${anlassId}`,
        toNodeId: `companion:${companionId}`,
        relationType: "anlass_links_companion",
        nonEpistemic: true,
        nonPriorityBoost: true,
      });
    }

    for (const contextGroup of contextGroups) {
      contextGroupCounts[contextGroup] += 1;
      const markerNodeType = toContextMarkerNodeType(contextGroup);
      const markerNodeId = `context:${contextGroup}`;
      addNode(nodeMap, {
        nodeId: markerNodeId,
        nodeType: markerNodeType,
        label: `Kontext ${contextGroup.replace(/_/g, " ")}`,
        topicAxis: null,
        regionAxis: null,
        statusLayer: {
          lifecycle: "active",
          activityBand: "none",
          workState: "monitoring",
        },
        contextGroups: [contextGroup],
      });
      addRelation(relationMap, {
        fromNodeId: markerNodeId,
        toNodeId: `anlass:${anlassId}`,
        relationType: "context_marks_anlass",
        nonEpistemic: true,
        nonPriorityBoost: true,
      });
      if (dossierId) {
        addRelation(relationMap, {
          fromNodeId: markerNodeId,
          toNodeId: `dossier:${dossierId}`,
          relationType: "context_marks_dossier",
          nonEpistemic: true,
          nonPriorityBoost: true,
        });
      }
    }

    const topic = topicStats.get(topicKey) ?? {
      topicLabel,
      nodeId: topicNodeId,
      anlassCount: 0,
      dossierCount: 0,
      roundCount: 0,
      resultCount: 0,
    };
    topic.anlassCount += 1;
    topic.roundCount += 1;
    if (dossierId) topic.dossierCount += 1;
    if (resultId || lifecycle === "closed") topic.resultCount += 1;
    topicStats.set(topicKey, topic);

    if (regionKey) {
      const region = regionStats.get(regionKey) ?? {
        regionCode,
        label: toRegionLabel(regionKey),
        anlassCount: 0,
        roundCount: 0,
        resultCount: 0,
      };
      region.anlassCount += 1;
      region.roundCount += 1;
      if (resultId || lifecycle === "closed") region.resultCount += 1;
      regionStats.set(regionKey, region);
    }
  }

  const nodes = Array.from(nodeMap.values());
  const relationships = Array.from(relationMap.values());

  const totals = {
    topics: nodes.filter((node) => node.nodeType === "topic_cluster").length,
    anlaesse: nodes.filter((node) => node.nodeType === "anlass_node").length,
    dossiers: nodes.filter((node) => node.nodeType === "dossier_node").length,
    rounds: nodes.filter((node) => node.nodeType === "round_node").length,
    results: nodes.filter((node) => node.nodeType === "result_node").length,
    companions: nodes.filter((node) => node.nodeType === "companion_node").length,
    contextMarkers: nodes.filter((node) =>
      node.nodeType.endsWith("_context_marker"),
    ).length,
  };

  const derivedWeekly = {
    newContributions: items.length,
    newAnlassraeume: totals.anlaesse,
    activeRounds: nodes.filter(
      (node) =>
        node.nodeType === "round_node" && node.statusLayer.lifecycle === "active",
    ).length,
    openQuestions: 0,
    newDossiers: totals.dossiers,
    followupFlows: relationships.filter(
      (rel) =>
        rel.relationType === "dossier_links_round" ||
        rel.relationType === "anlass_links_companion" ||
        rel.relationType === "round_links_result",
    ).length,
  };

  const weeklySnapshot = {
    newContributions:
      input.weeklySnapshot?.newContributions ?? derivedWeekly.newContributions,
    newAnlassraeume:
      input.weeklySnapshot?.newAnlassraeume ?? derivedWeekly.newAnlassraeume,
    activeRounds:
      input.weeklySnapshot?.activeRounds ?? derivedWeekly.activeRounds,
    openQuestions:
      input.weeklySnapshot?.openQuestions ?? derivedWeekly.openQuestions,
    newDossiers: input.weeklySnapshot?.newDossiers ?? derivedWeekly.newDossiers,
    followupFlows:
      input.weeklySnapshot?.followupFlows ?? derivedWeekly.followupFlows,
  };

  return DossierAtlasLandscapeSchema.parse({
    generatedAt,
    topicAxis: {
      clusters: Array.from(topicStats.entries()).map(([topicKey, value]) => ({
        topicKey,
        topicLabel: value.topicLabel,
        nodeId: value.nodeId,
        anlassCount: value.anlassCount,
        dossierCount: value.dossierCount,
        roundCount: value.roundCount,
        resultCount: value.resultCount,
      })),
      separatedFromRegionAxis: true,
    },
    regionAxis: {
      regions: Array.from(regionStats.entries()).map(([regionKey, value]) => ({
        regionKey,
        regionCode: value.regionCode,
        label: value.label,
        anlassCount: value.anlassCount,
        roundCount: value.roundCount,
        resultCount: value.resultCount,
      })),
      separatedFromTopicAxis: true,
    },
    nodes,
    relationships,
    aggregates: {
      totals,
      weeklySnapshot,
    },
    contextGroups: contextGroupCounts,
    guardrails: {
      keepsTopicRegionSeparated: true,
      forbidsTruthPrivilegeFromContext: true,
      forbidsPriorityPrivilegeFromContext: true,
      forbidsVotingPrivilegeFromContext: true,
      keepsFeedAsSignalOnly: true,
      keepsNoAutoPublish: true,
      forbidsReputationScoring: true,
      supportsWeeklySnapshotWithoutRanking: true,
    },
    forbiddenInferences: [
      "activity_is_not_truth",
      "context_visibility_is_not_priority",
      "org_editorial_expert_is_not_voting_weight",
      "topic_axis_is_not_region_axis",
      "snapshot_is_not_toplist",
    ],
    explainability: {
      reasonRequiredFields: [
        "nodeType",
        "topicAxis",
        "regionAxis",
        "statusLayer",
        "contextGroups",
        "source",
      ],
    },
  });
}

export function parseDossierAtlasLandscapeContract(
  input: unknown,
): DossierAtlasLandscapeParseResult {
  const parsed = DossierAtlasLandscapeSchema.safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data };
  return {
    ok: false,
    error: "dossier_atlas_landscape_contract_invalid",
    issues: parsed.error.issues.map((issue) => issue.message),
  };
}

export function evaluateDossierAtlasLandscapeConsistency(
  contract: DossierAtlasLandscapeContract,
): DossierAtlasLandscapeConsistency {
  const issues: string[] = [];
  if (!contract.guardrails.keepsTopicRegionSeparated) {
    issues.push("topic_region_axis_must_stay_separated");
  }
  if (!contract.guardrails.forbidsTruthPrivilegeFromContext) {
    issues.push("truth_privilege_guardrail_missing");
  }
  if (!contract.guardrails.forbidsPriorityPrivilegeFromContext) {
    issues.push("priority_privilege_guardrail_missing");
  }
  if (!contract.guardrails.forbidsReputationScoring) {
    issues.push("reputation_scoring_guardrail_missing");
  }
  if (
    contract.aggregates.weeklySnapshot.newContributions < 0 ||
    contract.aggregates.weeklySnapshot.newAnlassraeume < 0
  ) {
    issues.push("weekly_snapshot_values_must_be_non_negative");
  }
  return { ok: issues.length === 0, issues };
}
