import { z } from "zod";

export const REGION_TYPES = ["bezirk", "kommune", "land", "landkreis", "quartier", "region"] as const;
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

export const REGIONAL_ACTOR_TYPES = [
  "verein",
  "initiative",
  "lose_gruppe",
  "bewegung",
  "sozialtraeger",
  "schule",
  "gewerbe",
  "verwaltung",
  "sonstige",
] as const;
export type RegionalActorType = (typeof REGIONAL_ACTOR_TYPES)[number];

export const ADMINISTRATIVE_UNIT_TYPES = [
  "land",
  "regionalverband",
  "landkreis",
  "kreis",
  "kreisfreie_stadt",
  "stadtkreis",
  "stadtstaat",
  "amt",
  "verbandsgemeinde",
  "samtgemeinde",
  "verwaltungsgemeinschaft",
  "verwaltungsverband",
  "kirchspielslandgemeinde",
  "erfuellende_gemeinde",
  "kreisangehoerige_gemeinde",
  "stadt",
  "markt",
  "grosse_kreisstadt",
  "grosse_kreisangehoerige_stadt",
  "gemeindefreies_gebiet_bewohnt",
  "gemeindefreies_gebiet_unbewohnt",
  "sonstige",
] as const;
export type AdministrativeUnitType = (typeof ADMINISTRATIVE_UNIT_TYPES)[number];

export const REGIONAL_ACTOR_VERIFICATION_STATUSES = [
  "unverified",
  "review_required",
  "verified",
] as const;
export type RegionalActorVerificationStatus = (typeof REGIONAL_ACTOR_VERIFICATION_STATUSES)[number];

export const COMMUNITY_SIGNAL_TYPES = [
  "hint",
  "source",
  "local_knowledge",
  "topic_proposal",
] as const;
export type CommunitySignalType = (typeof COMMUNITY_SIGNAL_TYPES)[number];

export const COMMUNITY_SIGNAL_REVIEW_STATUSES = [
  "submitted",
  "in_review",
  "accepted",
  "rejected",
] as const;
export type CommunitySignalReviewStatus = (typeof COMMUNITY_SIGNAL_REVIEW_STATUSES)[number];

export const COMMUNITY_SIGNAL_SUBMITTER_MODES = [
  "anonymous",
  "lightweight_contact",
  "registered_reference",
] as const;
export type CommunitySignalSubmitterMode = (typeof COMMUNITY_SIGNAL_SUBMITTER_MODES)[number];

export const REGIONAL_ADMIN_COCKPIT_MODULE_KEYS = [
  "themenlage",
  "akteurskarte",
  "beteiligungsstatus",
  "offene_fragen",
  "teilhabegaps",
  "naechste_rueckmeldungen",
  "mandatsstatus",
] as const;
export type RegionalAdminCockpitModuleKey = (typeof REGIONAL_ADMIN_COCKPIT_MODULE_KEYS)[number];

const RegionOfficialBodySchema = z
  .object({
    id: z.string().trim().min(1),
    label: z.string().trim().min(1),
    bodyType: z.enum([
      "landesverwaltung",
      "bezirksamt",
      "stadtverwaltung",
      "gemeindeverwaltung",
      "kreisverwaltung",
      "amtverwaltung",
      "verbandsgemeindeverwaltung",
      "samtgemeindeverwaltung",
      "verwaltungsverband",
      "verwaltungsgemeinschaft",
      "quartiersrat",
      "regionalverband",
      "sonstige",
    ]),
  })
  .strict();

export type RegionOfficialBody = z.infer<typeof RegionOfficialBodySchema>;

const OfficialDirectoryEntrySchema = z
  .object({
    ars: z.string().trim().min(1).nullable(),
    ags: z.string().trim().min(1).nullable(),
    municipalityName: z.string().trim().min(1),
    administrativeSeat: z.string().trim().min(1).nullable(),
    street: z.string().trim().min(1).nullable(),
    postalCode: z.string().trim().min(1).nullable(),
    locality: z.string().trim().min(1).nullable(),
    areaKm2: z.number().finite().nonnegative().nullable(),
    population: z.number().int().nonnegative().nullable(),
    administrativeUnitType: z.enum(ADMINISTRATIVE_UNIT_TYPES).nullable(),
    rawAdministrativeUnitLabel: z.string().trim().min(1).nullable(),
    sourceFile: z.string().trim().min(1),
    sourceAsOf: z.string().trim().min(1),
  })
  .strict();

export type OfficialDirectoryEntry = z.infer<typeof OfficialDirectoryEntrySchema>;

const RegionalActorAddressSchema = z
  .object({
    street: z.string().trim().min(1).nullable(),
    postalCode: z.string().trim().min(1).nullable(),
    locality: z.string().trim().min(1).nullable(),
  })
  .strict();

export type RegionalActorAddress = z.infer<typeof RegionalActorAddressSchema>;

export const RegionSchema = z
  .object({
    id: z.string().trim().min(1),
    slug: z.string().trim().min(1),
    name: z.string().trim().min(1),
    type: z.enum(REGION_TYPES),
    administrativeUnitType: z.enum(ADMINISTRATIVE_UNIT_TYPES).nullable().optional(),
    parentRegionId: z.string().trim().min(1).nullable(),
    officialBody: RegionOfficialBodySchema.nullable(),
    officialDirectoryEntry: OfficialDirectoryEntrySchema.nullable().optional(),
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

const RegionalActorRegisterGuardrailsSchema = z
  .object({
    noAutomaticPoliticalAssignment: z.literal(true),
    noAutomaticVoiceOpenGovMembership: z.literal(true),
    verificationStatusRequired: z.literal(true),
  })
  .strict();

export type RegionalActorRegisterGuardrails = z.infer<typeof RegionalActorRegisterGuardrailsSchema>;

export const RegionalActorSchema = z
  .object({
    id: z.string().trim().min(1),
    regionId: z.string().trim().min(1),
    slug: z.string().trim().min(1),
    name: z.string().trim().min(1),
    actorType: z.enum(REGIONAL_ACTOR_TYPES),
    verificationStatus: z.enum(REGIONAL_ACTOR_VERIFICATION_STATUSES),
    description: z.string().trim().min(1).nullable(),
    sourceKind: z.enum(["fixture", "official_directory", "manual_admin"]).default("fixture"),
    publicVisibility: z.enum(REGION_PUBLIC_VISIBILITIES),
    administrativeUnitType: z.enum(ADMINISTRATIVE_UNIT_TYPES).nullable().optional(),
    address: RegionalActorAddressSchema.nullable().optional(),
    officialDirectoryEntry: OfficialDirectoryEntrySchema.nullable().optional(),
    tags: z.array(z.string().trim().min(1)).default([]),
    guardrails: RegionalActorRegisterGuardrailsSchema,
    createdAt: z.string().datetime({ offset: true }).nullable().optional(),
    updatedAt: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (new Set(value.tags).size !== value.tags.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tags"],
        message: "duplicate_actor_tag",
      });
    }
  });

export type RegionalActor = z.infer<typeof RegionalActorSchema>;

const CommunitySignalSubmitterSchema = z
  .object({
    mode: z.enum(COMMUNITY_SIGNAL_SUBMITTER_MODES),
    displayName: z.string().trim().min(1).nullable(),
    contactChannel: z.string().trim().min(1).nullable(),
  })
  .strict();

export type CommunitySignalSubmitter = z.infer<typeof CommunitySignalSubmitterSchema>;

const CommunitySignalGuardrailsSchema = z
  .object({
    moderationRequired: z.literal(true),
    noAutoPublish: z.literal(true),
    noAutoMandate: z.literal(true),
    noAutomaticDossierCreation: z.literal(true),
  })
  .strict();

export type CommunitySignalGuardrails = z.infer<typeof CommunitySignalGuardrailsSchema>;

export const CommunitySignalSchema = z
  .object({
    id: z.string().trim().min(1),
    regionId: z.string().trim().min(1),
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    signalType: z.enum(COMMUNITY_SIGNAL_TYPES),
    reviewStatus: z.enum(COMMUNITY_SIGNAL_REVIEW_STATUSES),
    sourceActorId: z.string().trim().min(1).nullable(),
    sourceUrls: z.array(z.string().trim().url()).default([]),
    submitter: CommunitySignalSubmitterSchema,
    guardrails: CommunitySignalGuardrailsSchema,
    createdAt: z.string().datetime({ offset: true }).nullable().optional(),
    updatedAt: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (new Set(value.sourceUrls).size !== value.sourceUrls.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceUrls"],
        message: "duplicate_source_url",
      });
    }

    if (value.submitter.mode === "lightweight_contact" && !value.submitter.contactChannel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["submitter", "contactChannel"],
        message: "lightweight_contact_requires_contact_channel",
      });
    }

    if (value.submitter.mode === "registered_reference" && !value.sourceActorId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceActorId"],
        message: "registered_reference_requires_source_actor_id",
      });
    }
  });

export type CommunitySignal = z.infer<typeof CommunitySignalSchema>;

const RegionalAdminCockpitSectionSchema = z
  .object({
    headline: z.string().trim().min(1),
    summary: z.string().trim().min(1),
  })
  .strict();

export type RegionalAdminCockpitSection = z.infer<typeof RegionalAdminCockpitSectionSchema>;

const RegionalAdminCockpitGuardrailsSchema = z
  .object({
    noCitizenScoring: z.literal(true),
    noAssociationScoring: z.literal(true),
    noAutomatedEnforcement: z.literal(true),
  })
  .strict();

export type RegionalAdminCockpitGuardrails = z.infer<typeof RegionalAdminCockpitGuardrailsSchema>;

export const RegionalAdminCockpitSchema = z
  .object({
    id: z.string().trim().min(1),
    regionId: z.string().trim().min(1),
    title: z.string().trim().min(1),
    modules: z
      .object({
        themenlage: RegionalAdminCockpitSectionSchema,
        akteurskarte: RegionalAdminCockpitSectionSchema,
        beteiligungsstatus: RegionalAdminCockpitSectionSchema,
        offene_fragen: RegionalAdminCockpitSectionSchema,
        teilhabegaps: RegionalAdminCockpitSectionSchema,
        naechste_rueckmeldungen: RegionalAdminCockpitSectionSchema,
        mandatsstatus: RegionalAdminCockpitSectionSchema,
      })
      .strict(),
    guardrails: RegionalAdminCockpitGuardrailsSchema,
    createdAt: z.string().datetime({ offset: true }).nullable().optional(),
    updatedAt: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .strict();

export type RegionalAdminCockpit = z.infer<typeof RegionalAdminCockpitSchema>;

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

export function normalizeRegionalActorType(value: unknown): RegionalActorType {
  return normalizeEnum(value, REGIONAL_ACTOR_TYPES, "sonstige");
}

export function normalizeAdministrativeUnitType(value: unknown): AdministrativeUnitType {
  if (typeof value !== "string") return "sonstige";
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");

  const mapped: Record<string, AdministrativeUnitType> = {
    land: "land",
    regionalverband: "regionalverband",
    landkreis: "landkreis",
    kreis: "kreis",
    "kreisfreie stadt": "kreisfreie_stadt",
    stadtkreis: "stadtkreis",
    stadtstaat: "stadtstaat",
    amt: "amt",
    verbandsgemeinde: "verbandsgemeinde",
    samtgemeinde: "samtgemeinde",
    verwaltungsgemeinschaft: "verwaltungsgemeinschaft",
    verwaltungsverband: "verwaltungsverband",
    kirchspielslandgemeinde: "kirchspielslandgemeinde",
    "erfuellende gemeinde": "erfuellende_gemeinde",
    "kreisangehoerige gemeinde": "kreisangehoerige_gemeinde",
    stadt: "stadt",
    markt: "markt",
    "grosse kreisstadt": "grosse_kreisstadt",
    "grosse kreisangehoerige stadt": "grosse_kreisangehoerige_stadt",
    "bewohntes gemfr. gebiet": "gemeindefreies_gebiet_bewohnt",
    "unbewohntes gemfr. gebiet": "gemeindefreies_gebiet_unbewohnt",
  };
  return mapped[normalized] ?? "sonstige";
}

export function normalizeRegionalActorVerificationStatus(
  value: unknown,
): RegionalActorVerificationStatus {
  return normalizeEnum(value, REGIONAL_ACTOR_VERIFICATION_STATUSES, "review_required");
}

export function normalizeCommunitySignalType(value: unknown): CommunitySignalType {
  return normalizeEnum(value, COMMUNITY_SIGNAL_TYPES, "hint");
}

export function normalizeCommunitySignalReviewStatus(value: unknown): CommunitySignalReviewStatus {
  return normalizeEnum(value, COMMUNITY_SIGNAL_REVIEW_STATUSES, "submitted");
}

export function normalizeCommunitySignalSubmitterMode(value: unknown): CommunitySignalSubmitterMode {
  return normalizeEnum(value, COMMUNITY_SIGNAL_SUBMITTER_MODES, "anonymous");
}

export function parseRegion(value: unknown): Region {
  return RegionSchema.parse(value);
}

export function parseRegionalAnlassraum(value: unknown): RegionalAnlassraum {
  return RegionalAnlassraumSchema.parse(value);
}

export function parseRegionalActor(value: unknown): RegionalActor {
  return RegionalActorSchema.parse(value);
}

export function parseOfficialDirectoryEntry(value: unknown): OfficialDirectoryEntry {
  return OfficialDirectoryEntrySchema.parse(value);
}

export function parseCommunitySignal(value: unknown): CommunitySignal {
  return CommunitySignalSchema.parse(value);
}

export function parseRegionalAdminCockpit(value: unknown): RegionalAdminCockpit {
  return RegionalAdminCockpitSchema.parse(value);
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

export function supportsRegionalActorAutomaticPoliticalAssignment(): false {
  return false;
}

export function supportsRegionalActorAutomaticVoiceOpenGovMembership(): false {
  return false;
}

export function supportsCommunitySignalComplexProfileRequirement(): false {
  return false;
}

export function supportsCommunitySignalAutoPublish(): false {
  return false;
}

export function supportsCommunitySignalAutoMandate(): false {
  return false;
}

export function supportsCommunitySignalAutomaticDossierCreation(): false {
  return false;
}

export function supportsRegionalAdminCitizenScoring(): false {
  return false;
}

export function supportsRegionalAdminAssociationScoring(): false {
  return false;
}
