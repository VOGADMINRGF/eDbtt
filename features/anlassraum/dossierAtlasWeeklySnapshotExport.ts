import { z } from "zod";
import type { DossierAtlasLandscapeContract } from "@features/anlassraum/dossierAtlasLandscapeContract";
import { loadDossierAtlasLandscapeReadModel } from "@features/anlassraum/dossierAtlasReadModel";

const SnapshotWindowSchema = z
  .object({
    windowStart: z.string().datetime(),
    windowEnd: z.string().datetime(),
    label: z.string().trim().min(1).max(120),
  })
  .strict();

const DossierAtlasWeeklySnapshotExportSchema = z
  .object({
    generatedAt: z.string().datetime(),
    snapshotWindow: SnapshotWindowSchema,
    summary: z
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
        weekly: z
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
    topicHighlights: z
      .array(
        z
          .object({
            topicKey: z.string().trim().min(1).max(120),
            topicLabel: z.string().trim().min(1).max(180),
            counts: z
              .object({
                anlaesse: z.number().int().min(0),
                dossiers: z.number().int().min(0),
                rounds: z.number().int().min(0),
                results: z.number().int().min(0),
              })
              .strict(),
            activityBand: z.enum(["none", "low", "medium", "high"]),
            nonRankingSelection: z.literal(true),
          })
          .strict(),
      )
      .max(24),
    activityFlows: z
      .object({
        anlassToRound: z.number().int().min(0),
        dossierToRound: z.number().int().min(0),
        roundToResult: z.number().int().min(0),
        anlassToCompanion: z.number().int().min(0),
        followupTotal: z.number().int().min(0),
      })
      .strict(),
    contextVisibility: z
      .object({
        association: z.number().int().min(0),
        initiative: z.number().int().min(0),
        organization: z.number().int().min(0),
        editorial_publisher: z.number().int().min(0),
        civic_creator: z.number().int().min(0),
        expert_voice: z.number().int().min(0),
      })
      .strict(),
    regionView: z
      .object({
        separatedFromTopicAxis: z.literal(true),
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
      })
      .strict(),
    graphicNotes: z
      .object({
        layoutHint: z.literal("atlas_weekly_snapshot_v1"),
        readOnly: z.literal(true),
        noToplist: z.literal(true),
        noTruthRanking: z.literal(true),
        noPriorityRanking: z.literal(true),
        noAutoPublish: z.literal(true),
      })
      .strict(),
    publicSafeSummary: z
      .object({
        headline: z.string().trim().min(1).max(220),
        subline: z.string().trim().min(1).max(320),
        bullets: z.array(z.string().trim().min(1).max(220)).min(2).max(6),
      })
      .strict(),
    internalDenseSummary: z
      .object({
        operationsFocus: z.array(z.string().trim().min(1).max(220)).min(2).max(8),
        watchouts: z.array(z.string().trim().min(1).max(220)).min(1).max(8),
      })
      .strict(),
    guardrails: z
      .object({
        snapshotIsNotToplist: z.literal(true),
        snapshotIsNotTruthMachine: z.literal(true),
        snapshotIsNotPriorityMachine: z.literal(true),
        keepsTopicRegionSeparated: z.literal(true),
        keepsContextNonEpistemic: z.literal(true),
        keepsFeedSignalOnly: z.literal(true),
        keepsNoAutoPublish: z.literal(true),
      })
      .strict(),
  })
  .strict();

export type DossierAtlasWeeklySnapshotExport = z.infer<
  typeof DossierAtlasWeeklySnapshotExportSchema
>;

export type DossierAtlasWeeklySnapshotExportParseResult =
  | { ok: true; value: DossierAtlasWeeklySnapshotExport }
  | { ok: false; error: "dossier_atlas_weekly_snapshot_export_invalid"; issues: string[] };

export type DossierAtlasWeeklySnapshotExportConsistency = {
  ok: boolean;
  issues: string[];
};

export type ResolveDossierAtlasWeeklySnapshotExportInput = {
  atlas: DossierAtlasLandscapeContract;
  generatedAt?: string | null;
  windowStart?: string | null;
  windowEnd?: string | null;
  label?: string | null;
  topicLimit?: number;
};

export async function loadDossierAtlasWeeklySnapshotExportFromReadModel(input: {
  limit?: number;
  generatedAt?: string | null;
  windowStart?: string | null;
  windowEnd?: string | null;
  label?: string | null;
  topicLimit?: number;
} = {}): Promise<DossierAtlasWeeklySnapshotExport> {
  const atlas = await loadDossierAtlasLandscapeReadModel({
    limit: input.limit,
  });

  return resolveDossierAtlasWeeklySnapshotExport({
    atlas,
    generatedAt: input.generatedAt,
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    label: input.label,
    topicLimit: input.topicLimit,
  });
}

export function resolveDossierAtlasWeeklySnapshotExport(
  input: ResolveDossierAtlasWeeklySnapshotExportInput,
): DossierAtlasWeeklySnapshotExport {
  const generatedAt = normalizeDateTime(input.generatedAt) ?? new Date().toISOString();
  const windowEnd = normalizeDateTime(input.windowEnd) ?? generatedAt;
  const windowStart =
    normalizeDateTime(input.windowStart) ?? daysBefore(windowEnd, 7).toISOString();
  const snapshotWindow = {
    windowStart,
    windowEnd,
    label: normalizeText(input.label) ?? "Wochenlage Atlas",
  };

  const topicLimit = normalizeTopicLimit(input.topicLimit);
  const sortedTopics = input.atlas.topicAxis.clusters
    .slice()
    .sort((a, b) => a.topicLabel.localeCompare(b.topicLabel, "de"));

  const topicHighlights = sortedTopics.slice(0, topicLimit).map((topic) => ({
    topicKey: topic.topicKey,
    topicLabel: topic.topicLabel,
    counts: {
      anlaesse: topic.anlassCount,
      dossiers: topic.dossierCount,
      rounds: topic.roundCount,
      results: topic.resultCount,
    },
    activityBand: deriveTopicActivityBand(input.atlas, topic.topicKey),
    nonRankingSelection: true as const,
  }));

  const activityFlows = {
    anlassToRound: countRelations(input.atlas, "anlass_links_round"),
    dossierToRound: countRelations(input.atlas, "dossier_links_round"),
    roundToResult: countRelations(input.atlas, "round_links_result"),
    anlassToCompanion: countRelations(input.atlas, "anlass_links_companion"),
    followupTotal: input.atlas.aggregates.weeklySnapshot.followupFlows,
  };

  const regionView = {
    separatedFromTopicAxis: input.atlas.regionAxis.separatedFromTopicAxis,
    regions: input.atlas.regionAxis.regions
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label, "de"))
      .map((region) => ({
        regionKey: region.regionKey,
        regionCode: region.regionCode,
        label: region.label,
        anlassCount: region.anlassCount,
        roundCount: region.roundCount,
        resultCount: region.resultCount,
      })),
  };

  const summary = {
    totals: { ...input.atlas.aggregates.totals },
    weekly: { ...input.atlas.aggregates.weeklySnapshot },
  };

  const publicSafeSummary = {
    headline: `${snapshotWindow.label}: ${summary.weekly.newContributions} neue Beiträge`,
    subline: `${summary.weekly.activeRounds} aktive Runden, ${summary.weekly.newDossiers} neue Dossiers, ${summary.weekly.followupFlows} Folgeverläufe.`,
    bullets: [
      `${summary.weekly.newAnlassraeume} neue Anlassräume im Zeitfenster.`,
      `${summary.weekly.openQuestions} offene Fragen im Snapshot sichtbar.`,
      `${summary.totals.topics} Themencluster in der Landschaft (ohne Toplist).`,
    ],
  };

  const internalDenseSummary = {
    operationsFocus: [
      `Follow-up-Flüsse: ${summary.weekly.followupFlows}`,
      `Aktive Runden: ${summary.weekly.activeRounds}`,
      `Neue Dossiers: ${summary.weekly.newDossiers}`,
      `Kontextmarker gesamt: ${summary.totals.contextMarkers}`,
    ],
    watchouts: [
      "Snapshot ist keine Wahrheits- oder Prioritätsrangliste.",
      "Kontextsichtbarkeit erzeugt kein Abstimmungs- oder Deutungsprivileg.",
      "Thema- und Regionenachse bleiben getrennt.",
    ],
  };

  return DossierAtlasWeeklySnapshotExportSchema.parse({
    generatedAt,
    snapshotWindow,
    summary,
    topicHighlights,
    activityFlows,
    contextVisibility: { ...input.atlas.contextGroups },
    regionView,
    graphicNotes: {
      layoutHint: "atlas_weekly_snapshot_v1",
      readOnly: true,
      noToplist: true,
      noTruthRanking: true,
      noPriorityRanking: true,
      noAutoPublish: true,
    },
    publicSafeSummary,
    internalDenseSummary,
    guardrails: {
      snapshotIsNotToplist: true,
      snapshotIsNotTruthMachine: true,
      snapshotIsNotPriorityMachine: true,
      keepsTopicRegionSeparated: true,
      keepsContextNonEpistemic: true,
      keepsFeedSignalOnly: true,
      keepsNoAutoPublish: true,
    },
  });
}

export function parseDossierAtlasWeeklySnapshotExport(
  input: unknown,
): DossierAtlasWeeklySnapshotExportParseResult {
  const parsed = DossierAtlasWeeklySnapshotExportSchema.safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data };
  return {
    ok: false,
    error: "dossier_atlas_weekly_snapshot_export_invalid",
    issues: parsed.error.issues.map((issue) => issue.message),
  };
}

export function evaluateDossierAtlasWeeklySnapshotExportConsistency(
  snapshot: DossierAtlasWeeklySnapshotExport,
): DossierAtlasWeeklySnapshotExportConsistency {
  const issues: string[] = [];

  if (!snapshot.guardrails.snapshotIsNotToplist) {
    issues.push("snapshot_must_not_be_toplist");
  }
  if (!snapshot.guardrails.snapshotIsNotTruthMachine) {
    issues.push("snapshot_must_not_be_truth_machine");
  }
  if (!snapshot.guardrails.keepsTopicRegionSeparated) {
    issues.push("snapshot_must_keep_topic_region_separated");
  }
  if (new Date(snapshot.snapshotWindow.windowStart) > new Date(snapshot.snapshotWindow.windowEnd)) {
    issues.push("snapshot_window_start_must_be_before_end");
  }
  if (snapshot.topicHighlights.some((topic) => topic.nonRankingSelection !== true)) {
    issues.push("topic_highlights_must_be_non_ranking");
  }
  if (snapshot.summary.weekly.newContributions < 0) {
    issues.push("weekly_new_contributions_must_be_non_negative");
  }

  return { ok: issues.length === 0, issues };
}

function normalizeDateTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function normalizeText(value: string | null | undefined): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function normalizeTopicLimit(value: number | undefined): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 12;
  return Math.max(3, Math.min(24, Math.floor(numeric)));
}

function daysBefore(value: string, days: number): Date {
  const base = new Date(value);
  base.setUTCDate(base.getUTCDate() - days);
  return base;
}

function countRelations(
  atlas: DossierAtlasLandscapeContract,
  relationType:
    | "anlass_links_round"
    | "dossier_links_round"
    | "round_links_result"
    | "anlass_links_companion",
): number {
  return atlas.relationships.filter((edge) => edge.relationType === relationType).length;
}

function deriveTopicActivityBand(
  atlas: DossierAtlasLandscapeContract,
  topicKey: string,
): "none" | "low" | "medium" | "high" {
  const order: Record<string, number> = {
    none: 0,
    low: 1,
    medium: 2,
    high: 3,
  };
  let best: "none" | "low" | "medium" | "high" = "none";
  for (const node of atlas.nodes) {
    if (node.topicAxis?.topicKey !== topicKey) continue;
    if (order[node.statusLayer.activityBand] > order[best]) {
      best = node.statusLayer.activityBand;
    }
  }
  return best;
}
