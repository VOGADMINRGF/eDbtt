import { z } from "zod";
import type { RegionPublicationVisibilityState } from "./publicationRiskLadder";
import type {
  RegionIntelligenceClusterHint,
  RegionIntelligenceReviewSuggestion,
  RegionIntelligenceSourceAdapterId,
  RegionIntelligenceSuggestionHint,
} from "./intelligence";

export const REGION_SOURCE_CONNECTION_TYPES = [
  "manual_source",
  "curated_pilot_source",
  "official_feed",
  "municipal_news",
] as const;

export const REGION_SOURCE_SNAPSHOT_SEED_KINDS = [
  "configured_region_source",
  "example_seed",
] as const;

export type RegionSourceConnectionType =
  (typeof REGION_SOURCE_CONNECTION_TYPES)[number];
export type RegionSourceSnapshotSeedKind =
  (typeof REGION_SOURCE_SNAPSHOT_SEED_KINDS)[number];

export type RegionSourceConnectionSampleItem = {
  title: string;
  summary: string;
  url: string | null;
  detectedTopics: string[];
};

export type RegionSourceSnapshotTemplate = {
  id: string;
  label: string;
  mode: "template_only" | "template_plus_explicit_url";
  seedKind: RegionSourceSnapshotSeedKind;
  seedKindLabel: string;
  configuredUrl: string | null;
  isExampleSeed: boolean;
  reviewHint: string;
  noLiveCrawlerClaim: true;
  noScraping: true;
  noDeepSearchAutoCosts: true;
  noAutoPublish: true;
  noPublicOfficial: true;
};

export type RegionSourceConnection = {
  id: string;
  regionId: string;
  organizationId?: string | null;
  label: string;
  sourceType: RegionSourceConnectionType;
  adapterId: RegionIntelligenceSourceAdapterId;
  url: string | null;
  notes: string | null;
  enabled: boolean;
  sampleItems: RegionSourceConnectionSampleItem[];
  sourceSnapshotTemplate: RegionSourceSnapshotTemplate | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  reviewRequired: true;
  noLiveCrawlerClaim: true;
  noScraping: true;
  noDeepSearchAutoCosts: true;
};

export type RegionSourceTestResult = {
  id: string;
  connectionId: string;
  regionId: string;
  organizationId?: string | null;
  connectionLabel: string;
  sourceType: RegionSourceConnectionType;
  adapterId: RegionIntelligenceSourceAdapterId;
  resultMode: "dry_run";
  title: string;
  summary: string;
  configuredUrl: string | null;
  detectedTopics: string[];
  visibilityState: "internal_review";
  visibilityLabel: string;
  reviewStatus: "needs_review";
  confidence: number;
  sourceSnapshotStatus: "fetched" | "manual_only" | "fetch_failed";
  sourceSnapshotTitle: string | null;
  sourceSnapshotSummary: string | null;
  sourceSnapshotExcerpt: string | null;
  sourceSnapshotTemplate: RegionSourceSnapshotTemplateResult | null;
  possibleClaims: RegionSourcePossibleClaim[];
  topicClusters: RegionIntelligenceClusterHint[];
  dossierSuggestions: RegionIntelligenceSuggestionHint[];
  anlassraumSuggestions: RegionIntelligenceSuggestionHint[];
  evidenceReferences: RegionSourceEvidenceReference[];
  openQuestions: string[];
  affectedScope: RegionSourceAffectedScope;
  reviewSuggestions: RegionIntelligenceReviewSuggestion[];
  reviewTaskSummary: RegionSourceReviewTaskSummary;
  createdAt: string;
  updatedAt: string;
  testedBy: string | null;
  reviewRequired: true;
  noAutoPublish: true;
  noPublicOfficial: true;
};

export type RegionSourcePossibleClaim = {
  text: string;
  confidence: number;
  basisLabel: "Titel" | "Zusammenfassung" | "Seitenauszug";
  excerpt: string | null;
  reviewRequired: true;
};

export type RegionSourceEvidenceReference = {
  label: string;
  url: string | null;
  excerpt: string | null;
};

export type RegionSourceSnapshotTemplateResult = RegionSourceSnapshotTemplate & {
  claimCandidates: RegionSourcePossibleClaim[];
  topicCandidates: RegionIntelligenceClusterHint[];
  evidenceHints: RegionSourceEvidenceReference[];
  openQuestions: string[];
};

export type RegionSourceAffectedScope = {
  regionName: string | null;
  detectedPlaces: string[];
  ortsteilHints: string[];
  fachbereichHints: string[];
};

export type RegionSourceReviewTaskSummary = {
  claimCount: number;
  topicClusterCount: number;
  dossierSuggestionCount: number;
  anlassraumSuggestionCount: number;
  openQuestionCount: number;
  evidenceCount: number;
  label: string;
};

const SampleItemSchema = z
  .object({
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    url: z.string().trim().url().nullable().optional(),
    detectedTopics: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

export const RegionSourceConnectionUpsertSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    regionId: z.string().trim().min(1),
    label: z.string().trim().min(1),
    sourceType: z.enum(REGION_SOURCE_CONNECTION_TYPES),
    url: z.string().trim().url().nullable().optional(),
    notes: z.string().trim().nullable().optional(),
    enabled: z.boolean().optional(),
    snapshotSeedKind: z.enum(REGION_SOURCE_SNAPSHOT_SEED_KINDS).optional(),
    snapshotTemplateLabel: z.string().trim().min(1).optional(),
    sampleItems: z.array(SampleItemSchema).max(5).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      (value.sourceType === "official_feed" || value.sourceType === "municipal_news") &&
      !String(value.url ?? "").trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "explicit_url_required",
      });
    }
  });

export const RegionSourceConnectionDryRunSchema = z
  .object({
    note: z.string().trim().min(1).optional(),
  })
  .strict();

export function regionSourceConnectionTypeLabel(value: RegionSourceConnectionType) {
  switch (value) {
    case "manual_source":
      return "Manuelle Quelle";
    case "curated_pilot_source":
      return "Kuratierte Pilotquelle";
    case "official_feed":
      return "Official Feed";
    case "municipal_news":
      return "Kommunale Nachrichten";
    default:
      return value;
  }
}

export function regionSourceConnectionAdapterId(
  value: RegionSourceConnectionType,
): RegionIntelligenceSourceAdapterId {
  switch (value) {
    case "manual_source":
      return "manual_review_queue";
    case "curated_pilot_source":
      return "curated_starting_point";
    case "official_feed":
    case "municipal_news":
    default:
      return "productive_regional_source";
  }
}

export function regionSourceSnapshotSeedKindLabel(
  value: RegionSourceSnapshotSeedKind,
) {
  switch (value) {
    case "example_seed":
      return "Beispiel-Seed";
    case "configured_region_source":
    default:
      return "Regionales Snapshot-Template";
  }
}

export function buildRegionSourceSnapshotTemplateSeed(input: {
  sourceType: RegionSourceConnectionType;
  url: string | null;
  title: string;
  summary: string;
  detectedTopics?: string[];
  seedKind?: RegionSourceSnapshotSeedKind;
  templateLabel?: string | null;
}) {
  const seedKind = input.seedKind ?? "configured_region_source";
  const mode =
    input.sourceType === "curated_pilot_source" ? "template_only" : "template_plus_explicit_url";
  return {
    sampleItems: [
      {
        title: String(input.title ?? "").trim(),
        summary: String(input.summary ?? "").trim(),
        url: String(input.url ?? "").trim() || null,
        detectedTopics: (input.detectedTopics ?? []).map((topic) => String(topic).trim()).filter(Boolean),
      },
    ],
    snapshotSeedKind: seedKind,
    snapshotTemplateLabel:
      String(input.templateLabel ?? "").trim() ||
      (seedKind === "example_seed" ? "Beispiel-Snapshot" : "Regionales Snapshot-Template"),
    snapshotMode: mode,
  };
}

export function regionSourceConnectionCategoryLabel(
  value: RegionSourceConnectionType,
) {
  switch (regionSourceConnectionAdapterId(value)) {
    case "manual_review_queue":
      return "manuell";
    case "curated_starting_point":
      return "kuratiert";
    case "productive_regional_source":
    default:
      return "produktiv";
  }
}

export function regionSourceResultVisibilityLabel(
  visibilityState: RegionPublicationVisibilityState,
) {
  switch (visibilityState) {
    case "internal_review":
      return "reviewpflichtig";
    case "public_unverified":
      return "sichtbar, aber nicht geprüft";
    case "public_reviewed":
      return "geprüft";
    case "public_official":
      return "amtlich freigegeben";
    case "blocked":
      return "gesperrt";
    case "archived":
      return "archiviert";
    case "private_draft":
    default:
      return "intern";
  }
}
