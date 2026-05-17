import { z } from "zod";
import type { RegionPublicationVisibilityState } from "./publicationRiskLadder";
import type { RegionIntelligenceSourceAdapterId } from "./intelligence";

export const REGION_SOURCE_CONNECTION_TYPES = [
  "manual_source",
  "curated_pilot_source",
  "official_feed",
  "municipal_news",
] as const;

export type RegionSourceConnectionType =
  (typeof REGION_SOURCE_CONNECTION_TYPES)[number];

export type RegionSourceConnectionSampleItem = {
  title: string;
  summary: string;
  url: string | null;
  detectedTopics: string[];
};

export type RegionSourceConnection = {
  id: string;
  regionId: string;
  label: string;
  sourceType: RegionSourceConnectionType;
  adapterId: RegionIntelligenceSourceAdapterId;
  url: string | null;
  notes: string | null;
  enabled: boolean;
  sampleItems: RegionSourceConnectionSampleItem[];
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
  createdAt: string;
  updatedAt: string;
  testedBy: string | null;
  reviewRequired: true;
  noAutoPublish: true;
  noPublicOfficial: true;
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
