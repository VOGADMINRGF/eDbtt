import { z } from "zod";
import {
  AGENT_ROLE_IDS,
} from "@/features/agenticRuntime/agentRegistryBootstrapContract";
import {
  AGENT_SAFE_TRACE_ARTIFACT_TYPES,
  AGENT_SAFE_TRACE_CONFIDENCE_LABELS,
  AGENT_SAFE_TRACE_REQUIRED_HUMAN_ACTIONS,
  AGENT_SAFE_TRACE_STATUSES,
} from "@/features/agenticRuntime/agentRunArtifactSafeTraceContract";

export const REGIONAL_RUN_STATUS_VALUES = [
  "configured",
  "review_ready",
  "blocked",
  "failed",
] as const;

export const REGIONAL_RUN_REGION_TYPE_VALUES = [
  "country",
  "state_region",
  "county",
  "municipality",
  "district",
  "neighborhood",
  "cross_region",
] as const;

export const REGIONAL_RUN_POLITICAL_LEVEL_VALUES = [
  "international",
  "eu",
  "federal",
  "state_region",
  "county",
  "municipal",
  "district",
  "mixed",
] as const;

const idSchema = z.string().trim().min(1).max(160).regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/);
const keySchema = z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const localeSchema = z.string().trim().min(2).max(35);
const isoDateSchema = z.string().datetime({ offset: true });

export const RegionalRunSourceSchema = z
  .object({
    id: idSchema,
    title: z.string().trim().min(1).max(500),
    issuer: z.string().trim().min(1).max(240),
    sourceClass: z.enum([
      "official_primary",
      "scientific_primary",
      "professional_context",
      "journalistic_context",
      "civil_society_context",
      "community_signal",
    ]),
    stableRef: z.string().trim().min(1).max(500),
    url: z.string().url().nullable(),
    originalLanguage: localeSchema,
    jurisdictionId: idSchema,
    publishedAt: isoDateSchema.nullable(),
    retrievedAt: isoDateSchema,
    evidenceStatus: z.enum(["fixture_only", "review_required", "qualified", "rejected"]),
    freshnessStatus: z.enum(["current", "aging", "stale", "historical_context", "unknown"]),
    translationStatus: z.enum([
      "original",
      "machine_reading_support",
      "human_reviewed",
      "approved_localization",
    ]),
    provenance: z
      .object({
        mode: z.enum(["manual_source_pack", "repository_fixture"]),
        recordedBy: z.string().trim().min(1).max(160),
        recordedAt: isoDateSchema,
        note: z.string().trim().min(1).max(1200),
      })
      .strict(),
    limitations: z.array(z.string().trim().min(1).max(1000)),
  })
  .strict();

export const RegionalRunSourcePackSchema = z
  .object({
    id: idSchema,
    label: z.string().trim().min(1).max(240),
    collectionMode: z.enum(["manual_source_pack", "repository_fixture"]),
    externalSearchUsed: z.literal(false),
    coverageStatus: z.enum([
      "sufficient_for_fixture",
      "partial",
      "language_gap",
      "jurisdiction_gap",
      "source_diversity_gap",
      "stale",
      "rejected",
    ]),
    sources: z.array(RegionalRunSourceSchema).min(1),
    missingCoverage: z.array(z.string().trim().min(1).max(1000)),
    createdAt: isoDateSchema,
  })
  .strict();

const RegionalRunSafeTraceArtifactSchema = z
  .object({
    id: z.string().trim().min(1).max(500),
    type: z.enum(AGENT_SAFE_TRACE_ARTIFACT_TYPES),
    label: z.string().trim().min(1).max(1000),
    reviewState: z.enum(["present", "planned", "review_required"]),
  })
  .strict();

export const RegionalRunSafeTraceStepSchema = z
  .object({
    roleId: z.enum(AGENT_ROLE_IDS),
    stepId: idSchema,
    surface: z.string().trim().min(1).max(240),
    userSafeLabel: z.string().trim().min(1).max(2000),
    status: z.enum(AGENT_SAFE_TRACE_STATUSES),
    confidenceLabel: z.enum(AGENT_SAFE_TRACE_CONFIDENCE_LABELS),
    requiredHumanAction: z.enum(AGENT_SAFE_TRACE_REQUIRED_HUMAN_ACTIONS),
    inputArtifacts: z.array(RegionalRunSafeTraceArtifactSchema),
    outputArtifacts: z.array(RegionalRunSafeTraceArtifactSchema),
    evidenceRefs: z.array(z.string().trim().min(1).max(500)),
    reviewState: z.string().trim().min(1).max(160),
    publishState: z.string().trim().min(1).max(160),
    traceScopeLine: z.string().trim().min(1).max(1000),
    hiddenByPolicy: z.array(z.string().trim().min(1).max(1000)).min(1),
  })
  .strict();

export const RegionalAgentRunSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    id: idSchema,
    operatorProfileVersion: z.string().trim().min(1).max(80),
    purpose: z.enum([
      "discover_civic_topics",
      "evaluate_existing_opportunities",
      "prepare_participation_candidates",
      "refresh_region_briefing",
    ]),
    status: z.enum(REGIONAL_RUN_STATUS_VALUES),
    reviewRequired: z.literal(true),
    reviewState: z.enum(["unreviewed", "review_ready", "blocked", "failed"]),
    requestedBy: z.literal("repository_fixture"),
    configuration: z
      .object({
        region: z
          .object({
            id: idSchema,
            displayName: z.string().trim().min(1).max(240),
            type: z.enum(REGIONAL_RUN_REGION_TYPE_VALUES),
            countryCode: z.string().regex(/^[A-Z]{2}$/),
            subdivisionCode: z.string().trim().min(1).max(80).nullable(),
            timezone: z.string().trim().min(1).max(80),
          })
          .strict(),
        jurisdiction: z
          .object({
            id: idSchema,
            displayName: z.string().trim().min(1).max(240),
            politicalLevel: z.enum(REGIONAL_RUN_POLITICAL_LEVEL_VALUES),
            authorityRefs: z.array(idSchema),
          })
          .strict(),
        period: z
          .object({
            startsAt: isoDateSchema,
            endsAt: isoDateSchema,
            freshnessPolicy: z.enum([
              "strict_current",
              "current_with_historical_context",
              "fixture_snapshot",
            ]),
          })
          .strict(),
        topicFrame: z
          .object({
            topicKeys: z.array(keySchema).min(1),
            excludedTopicKeys: z.array(keySchema),
            maximumCandidates: z.number().int().min(1).max(20),
          })
          .strict(),
        languages: z
          .object({
            originalLanguages: z.array(localeSchema).min(1),
            readingLanguage: localeSchema,
            interfaceLanguage: z.enum(["de", "en"]),
            outputLanguages: z.array(localeSchema).min(1),
            preserveOriginal: z.literal(true),
            translationIsEvidence: z.literal(false),
          })
          .strict(),
        outputDepth: z.enum(["overview", "standard", "detailed"]),
        sourcePackIds: z.array(idSchema).min(1),
      })
      .strict(),
    runtimeBoundaries: z
      .object({
        executionMode: z.literal("read_only"),
        externalSearch: z.literal("no_external_search"),
        providerApi: z.literal("disabled"),
        campaignMutation: z.literal("disabled"),
        assetGeneration: z.literal("disabled"),
        analyticsRecommendation: z.literal("disabled"),
        publishing: z.literal("disabled"),
        externalMessaging: z.literal("disabled"),
        politicalPersonProfiles: z.literal("disabled"),
      })
      .strict(),
    sourcePacks: z.array(RegionalRunSourcePackSchema).min(1),
    evidenceRefs: z
      .array(
        z
          .object({
            id: idSchema,
            type: z.enum(["source", "decision_contract", "registry_opportunity", "manual_fixture"]),
            ref: z.string().trim().min(1).max(500),
            status: z.enum(["fixture_only", "review_required", "qualified", "rejected"]),
            note: z.string().trim().min(1).max(1000),
          })
          .strict(),
      )
      .min(1),
    blockerRefs: z.array(
      z
        .object({
          id: idSchema,
          code: keySchema,
          status: z.enum(["open", "resolved", "terminal"]),
          summary: z.string().trim().min(1).max(1200),
          evidenceRefs: z.array(idSchema),
        })
        .strict(),
    ),
    opportunityCandidates: z.array(
      z
        .object({
          id: idSchema,
          registryOpportunityId: idSchema.nullable(),
          title: z.string().trim().min(1).max(240),
          summary: z.string().trim().min(1).max(2400),
          candidateStatus: z.enum(["suggested", "blocked", "rejected"]),
          disposition: z.literal("suggestion_only"),
          humanDecisionRequired: z.literal(true),
          evidenceRefs: z.array(idSchema).min(1),
          blockerRefs: z.array(idSchema),
          rationale: z.string().trim().min(1).max(2400),
        })
        .strict(),
    ),
    safeTrace: z
      .object({
        safeForUser: z.literal(true),
        containsPrivateChainOfThought: z.literal(false),
        containsPromptData: z.literal(false),
        containsSecrets: z.literal(false),
        steps: z.array(RegionalRunSafeTraceStepSchema).min(1),
      })
      .strict(),
    createdAt: isoDateSchema,
    updatedAt: isoDateSchema,
  })
  .strict()
  .superRefine((run, context) => {
    if (Date.parse(run.configuration.period.startsAt) > Date.parse(run.configuration.period.endsAt)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["configuration", "period"],
        message: "period start must not be after period end",
      });
    }

    const configuredPackIds = new Set(run.configuration.sourcePackIds);
    const actualPackIds = new Set(run.sourcePacks.map((pack) => pack.id));
    if (
      configuredPackIds.size !== actualPackIds.size ||
      [...configuredPackIds].some((id) => !actualPackIds.has(id))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["configuration", "sourcePackIds"],
        message: "configured source packs must match embedded source packs",
      });
    }

    const originalLanguages = new Set(run.configuration.languages.originalLanguages);
    for (const pack of run.sourcePacks) {
      for (const source of pack.sources) {
        if (!originalLanguages.has(source.originalLanguage)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["configuration", "languages", "originalLanguages"],
            message: `missing original language for source ${source.id}`,
          });
        }
      }
    }

    if ((run.status === "blocked" || run.status === "failed") && run.blockerRefs.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["blockerRefs"],
        message: "blocked and failed runs require at least one blocker",
      });
    }
  });

export type RegionalAgentRun = z.infer<typeof RegionalAgentRunSchema>;
export type RegionalRunStatus = RegionalAgentRun["status"];
export type RegionalRunSourcePack = z.infer<typeof RegionalRunSourcePackSchema>;
