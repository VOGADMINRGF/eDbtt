import { z } from "zod";

export const REGION_TYPES = ["bezirk", "kommune", "landkreis", "quartier", "region"] as const;
export type RegionType = (typeof REGION_TYPES)[number];

export const REGION_PUBLIC_VISIBILITIES = ["public", "restricted", "internal"] as const;
export type RegionPublicVisibility = (typeof REGION_PUBLIC_VISIBILITIES)[number];

export const REGIONAL_ANLASSRAUM_STATUSES = ["draft", "active", "archived"] as const;
export type RegionalAnlassraumStatus = (typeof REGIONAL_ANLASSRAUM_STATUSES)[number];

export const REGIONAL_ANLASSRAUM_SCOPE_KEYS = [
  "signals",
  "topics",
  "actors",
  "dossiers",
  "rounds",
  "mandates",
  "activities",
] as const;
export type RegionalAnlassraumScopeKey = (typeof REGIONAL_ANLASSRAUM_SCOPE_KEYS)[number];

const RegionOfficialBodySchema = z
  .object({
    id: z.string().trim().min(1),
    label: z.string().trim().min(1),
    bodyType: z.enum([
      "bezirksamt",
      "stadtverwaltung",
      "kreisverwaltung",
      "quartiersrat",
      "regionalverband",
      "sonstige",
    ]),
  })
  .strict();

export type RegionOfficialBody = z.infer<typeof RegionOfficialBodySchema>;

export const RegionSchema = z
  .object({
    id: z.string().trim().min(1),
    slug: z.string().trim().min(1),
    name: z.string().trim().min(1),
    type: z.enum(REGION_TYPES),
    parentRegionId: z.string().trim().min(1).nullable(),
    officialBody: RegionOfficialBodySchema.nullable(),
    federalState: z.string().trim().min(1).nullable(),
    country: z.string().trim().min(2),
    publicVisibility: z.enum(REGION_PUBLIC_VISIBILITIES),
    createdAt: z.string().datetime({ offset: true }).nullable().optional(),
    updatedAt: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .strict();

export type Region = z.infer<typeof RegionSchema>;

const RegionalAnlassraumGuardrailsSchema = z
  .object({
    noAutoPublish: z.literal(true),
    noAutoMandate: z.literal(true),
    noAutomaticPoliticalAssignment: z.literal(true),
    noScrapingByDefault: z.literal(true),
  })
  .strict();

export type RegionalAnlassraumGuardrails = z.infer<typeof RegionalAnlassraumGuardrailsSchema>;

const RegionalAnlassraumReferenceLinksSchema = z
  .object({
    dossierIds: z.array(z.string().trim().min(1)).default([]),
    roundIds: z.array(z.string().trim().min(1)).default([]),
    mandateIds: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export type RegionalAnlassraumReferenceLinks = z.infer<typeof RegionalAnlassraumReferenceLinksSchema>;

const RegionalAnlassraumPublicReadModelSchema = z
  .object({
    headline: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    regionName: z.string().trim().min(1),
    statusLabel: z.string().trim().min(1),
    scopeBadges: z.array(z.enum(REGIONAL_ANLASSRAUM_SCOPE_KEYS)).min(1),
    participationPath: z
      .literal("Check -> Dossier -> Runde -> Beteiligung -> Ergebnis -> Mandat -> Status")
      .default("Check -> Dossier -> Runde -> Beteiligung -> Ergebnis -> Mandat -> Status"),
    lastUpdatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .strict();

export type RegionalAnlassraumPublicReadModel = z.infer<typeof RegionalAnlassraumPublicReadModelSchema>;

export const RegionalAnlassraumSchema = z
  .object({
    id: z.string().trim().min(1),
    regionId: z.string().trim().min(1),
    slug: z.string().trim().min(1),
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    status: z.enum(REGIONAL_ANLASSRAUM_STATUSES),
    scope: z.array(z.enum(REGIONAL_ANLASSRAUM_SCOPE_KEYS)).min(1),
    guidelineProfile: z.string().trim().min(1).nullable(),
    guardrails: RegionalAnlassraumGuardrailsSchema,
    links: RegionalAnlassraumReferenceLinksSchema,
    ownershipModel: z.literal("reference_only"),
    publicReadModel: RegionalAnlassraumPublicReadModelSchema,
    createdAt: z.string().datetime({ offset: true }).nullable().optional(),
    updatedAt: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    for (const scopeKey of REGIONAL_ANLASSRAUM_SCOPE_KEYS) {
      if (!value.scope.includes(scopeKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scope"],
          message: `missing_scope_${scopeKey}`,
        });
      }
    }

    const buckets: Array<keyof RegionalAnlassraumReferenceLinks> = [
      "dossierIds",
      "roundIds",
      "mandateIds",
    ];

    for (const bucket of buckets) {
      const entries = value.links[bucket];
      if (new Set(entries).size !== entries.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["links", bucket],
          message: `duplicate_reference_in_${bucket}`,
        });
      }
    }
  });

export type RegionalAnlassraum = z.infer<typeof RegionalAnlassraumSchema>;

function normalizeEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number],
): T[number] {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  const match = allowed.find((entry) => entry.toLowerCase() === normalized);
  return match ?? fallback;
}

export function normalizeRegionType(value: unknown): RegionType {
  return normalizeEnum(value, REGION_TYPES, "region");
}

export function normalizeRegionPublicVisibility(value: unknown): RegionPublicVisibility {
  return normalizeEnum(value, REGION_PUBLIC_VISIBILITIES, "restricted");
}

export function normalizeRegionalAnlassraumStatus(value: unknown): RegionalAnlassraumStatus {
  return normalizeEnum(value, REGIONAL_ANLASSRAUM_STATUSES, "draft");
}

export function parseRegion(value: unknown): Region {
  return RegionSchema.parse(value);
}

export function parseRegionalAnlassraum(value: unknown): RegionalAnlassraum {
  return RegionalAnlassraumSchema.parse(value);
}

export function supportsRegionTenantIsolationRequirement(): false {
  return false;
}

export function supportsRegionalAnlassraumAutoPublish(): false {
  return false;
}

export function supportsRegionalAnlassraumAutoMandate(): false {
  return false;
}

export function supportsRegionalAnlassraumAutomaticPoliticalAssignment(): false {
  return false;
}

export function supportsRegionalAnlassraumScrapingByDefault(): false {
  return false;
}

export function supportsRegionalAnlassraumAutomaticDossierCreation(): false {
  return false;
}

export function supportsRegionalAnlassraumAutomaticRoundCreation(): false {
  return false;
}

export function supportsRegionalAnlassraumAutomaticVoiceOpenGovMembership(): false {
  return false;
}
