import { z } from "zod";
import type { ShareReadyAssetContract } from "@features/anlassraum/shareReadyAssetContract";

export const THEMENRADAR_SOURCE_TYPES = [
  "manual",
  "news",
  "community",
  "create_intake",
] as const;

export type ThemenradarSourceType = (typeof THEMENRADAR_SOURCE_TYPES)[number];

export const THEMENRADAR_JURISDICTIONS = [
  "bund",
  "land",
  "kommune",
  "mixed",
] as const;

export type ThemenradarJurisdiction = (typeof THEMENRADAR_JURISDICTIONS)[number];

export const THEMENRADAR_LIFECYCLE_STATUSES = [
  "raw",
  "qualified",
  "content_ready",
  "review_ready",
  "published",
  "archived",
] as const;

export type ThemenradarLifecycleStatus =
  (typeof THEMENRADAR_LIFECYCLE_STATUSES)[number];

export type ThemenradarTelemetrySnapshot = {
  campaignKey: string | null;
  clicks: number;
  leads: number;
  memberships: number;
  updatedAt: string;
};

export const THEMENRADAR_AUDIT_EVENT_TYPES = [
  "created",
  "qualified",
  "content_prep_generated",
  "review_ready_set",
  "share_ready_generated",
  "published_set",
  "archived",
  "lifecycle_transition",
] as const;

export type ThemenradarAuditEventType = (typeof THEMENRADAR_AUDIT_EVENT_TYPES)[number];

export type ThemenradarAuditEvent = {
  id: string;
  itemId: string;
  eventType: ThemenradarAuditEventType;
  at: string;
  actorUserId: string | null;
  actorEmail: string | null;
  fromStatus: ThemenradarLifecycleStatus | null;
  toStatus: ThemenradarLifecycleStatus | null;
  note: string | null;
  auditVersion: number;
  metadata: Record<string, unknown> | null;
};

export type ThemenradarItem = {
  id: string;
  title: string;
  rawSignal: string;
  sourceType: ThemenradarSourceType;
  heatScore: number;
  everydayRelevanceScore: number;
  polarizationScore: number;
  membershipPotentialScore: number;
  jurisdiction: ThemenradarJurisdiction;
  lifecycleStatus: ThemenradarLifecycleStatus;
  linkedAnlassraumId?: string | null;
  linkedDossierId?: string | null;
  campaignKey?: string | null;
  shareContractSnapshot?: ShareReadyAssetContract | null;
  telemetrySnapshot?: ThemenradarTelemetrySnapshot | null;
  reviewRequired: true;
  autoPostEligible: false;
  officialSocialRequiresReview: true;
  createdBy: string | null;
  updatedBy: string | null;
  lastReviewedBy: string | null;
  lastReviewedAt: string | null;
  reviewNotes: string[];
  auditVersion: number;
  archivedAt: string | null;
  archivedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

const scoreSchema = z
  .number()
  .min(0, "score_must_be_gte_0")
  .max(100, "score_must_be_lte_100");

const isoDateSchema = z.string().datetime({ offset: true });

const ThemenradarItemSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(160),
    rawSignal: z.string().trim().min(1).max(4000),
    sourceType: z.enum(THEMENRADAR_SOURCE_TYPES),
    heatScore: scoreSchema,
    everydayRelevanceScore: scoreSchema,
    polarizationScore: scoreSchema,
    membershipPotentialScore: scoreSchema,
    jurisdiction: z.enum(THEMENRADAR_JURISDICTIONS),
    lifecycleStatus: z.enum(THEMENRADAR_LIFECYCLE_STATUSES),
    linkedAnlassraumId: z.string().trim().min(1).max(120).nullable().optional(),
    linkedDossierId: z.string().trim().min(1).max(120).nullable().optional(),
    campaignKey: z.string().trim().min(1).max(120).nullable().optional(),
    shareContractSnapshot: z.unknown().nullable().optional(),
    telemetrySnapshot: z
      .object({
        campaignKey: z.string().trim().min(1).max(120).nullable(),
        clicks: z.number().int().min(0),
        leads: z.number().int().min(0),
        memberships: z.number().int().min(0),
        updatedAt: isoDateSchema,
      })
      .strict()
      .nullable()
      .optional(),
    reviewRequired: z.literal(true),
    autoPostEligible: z.literal(false),
    officialSocialRequiresReview: z.literal(true),
    createdBy: z.string().trim().min(1).max(120).nullable(),
    updatedBy: z.string().trim().min(1).max(120).nullable(),
    lastReviewedBy: z.string().trim().min(1).max(120).nullable(),
    lastReviewedAt: isoDateSchema.nullable(),
    reviewNotes: z.array(z.string().trim().min(1).max(1000)).max(100),
    auditVersion: z.number().int().min(0),
    archivedAt: isoDateSchema.nullable(),
    archivedBy: z.string().trim().min(1).max(120).nullable(),
    createdAt: isoDateSchema,
    updatedAt: isoDateSchema,
  })
  .strict();

export type ThemenradarParseResult =
  | { ok: true; value: ThemenradarItem }
  | { ok: false; error: string; issues: string[] };

export function clampScore(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  if (numeric < 0) return 0;
  if (numeric > 100) return 100;
  return Math.round(numeric);
}

export function parseThemenradarItem(input: unknown): ThemenradarParseResult {
  const parsed = ThemenradarItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_themenradar_item",
      issues: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "root"}:${issue.message}`,
      ),
    };
  }
  return {
    ok: true,
    value: parsed.data as ThemenradarItem,
  };
}

export function assertThemenradarItem(input: unknown): ThemenradarItem {
  const parsed = parseThemenradarItem(input);
  if (!parsed.ok) {
    throw new Error((parsed as { ok: false; error: string }).error);
  }
  return (parsed as { ok: true; value: ThemenradarItem }).value;
}

export function normalizeCampaignKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "-");
  if (!normalized) return null;
  return normalized.slice(0, 120);
}

export function normalizeOptionalString(value: unknown, maxLength = 120): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

export function normalizeReviewNote(value: unknown, maxLength = 400): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

export function nowIsoString() {
  return new Date().toISOString();
}

const lifecycleOrder: ThemenradarLifecycleStatus[] = [
  "raw",
  "qualified",
  "content_ready",
  "review_ready",
  "published",
  "archived",
];

export function canTransitionLifecycle(input: {
  from: ThemenradarLifecycleStatus;
  to: ThemenradarLifecycleStatus;
}) {
  if (input.from === input.to) return true;
  const fromIndex = lifecycleOrder.indexOf(input.from);
  const toIndex = lifecycleOrder.indexOf(input.to);
  if (fromIndex === -1 || toIndex === -1) return false;
  if (input.from === "archived") return false;
  if (input.to === "raw") return false;
  return toIndex === fromIndex + 1 || input.to === "archived";
}
