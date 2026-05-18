import { coreCol, ObjectId, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { z } from "zod";
import { EDEBATTE_PACKAGES_DE } from "@features/pricing/domain/plans.de";
import type { EDebattePackageId } from "@features/pricing/domain/types";
import type { Organization, OrganizationMembership, OrganizationType } from "../organizationOnboarding";

export const ENTITLEMENT_STATUSES = [
  "inactive",
  "trial",
  "active",
  "past_due",
  "suspended",
  "cancelled",
  "expired",
  "revoked",
] as const;

export type EntitlementStatus = (typeof ENTITLEMENT_STATUSES)[number];

export const ENTITLEMENT_SCOPES = [
  "organization",
  "region",
  "organization_unit",
  "project",
  "dossier",
  "anlassraum",
] as const;

export type EntitlementScope = (typeof ENTITLEMENT_SCOPES)[number];

export const ENTITLEMENT_SOURCES = [
  "admin_grant",
  "pilot_grant",
  "order_request",
  "manual_contract",
  "migration",
  "fixture",
] as const;

export type EntitlementSource = (typeof ENTITLEMENT_SOURCES)[number];

export const ENTITLEMENT_CHECK_REASONS = [
  "active",
  "trial",
  "missing_entitlement",
  "expired",
  "suspended",
  "past_due",
  "over_limit",
  "wrong_region",
  "wrong_organization",
  "membership_not_verified",
  "unsupported_organization_type",
] as const;

export type EntitlementCheckReason = (typeof ENTITLEMENT_CHECK_REASONS)[number];

const EntitlementPlanSchema = z
  .object({
    id: z.string().trim().min(1),
    label: z.string().trim().min(1),
    packageId: z.string().trim().min(1).nullable().optional(),
    packageStatus: z.string().trim().min(1).nullable().optional(),
    audience: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

export type EntitlementPlan = z.infer<typeof EntitlementPlanSchema>;

const EntitlementLimitSchema = z
  .object({
    maxRegions: z.number().int().nonnegative().nullable().optional(),
    maxDossiers: z.number().int().nonnegative().nullable().optional(),
    maxAnlassraeume: z.number().int().nonnegative().nullable().optional(),
    maxSignalsPerMonth: z.number().int().nonnegative().nullable().optional(),
    maxDraftsPerMonth: z.number().int().nonnegative().nullable().optional(),
    maxUsers: z.number().int().nonnegative().nullable().optional(),
    factcheckCredits: z.number().int().nonnegative().nullable().optional(),
  })
  .strict();

export type EntitlementLimit = z.infer<typeof EntitlementLimitSchema>;

const EntitlementUsageSchema = z
  .object({
    regionsUsed: z.number().int().nonnegative(),
    dossiersUsed: z.number().int().nonnegative(),
    anlassraeumeUsed: z.number().int().nonnegative(),
    signalsThisMonth: z.number().int().nonnegative(),
    draftsThisMonth: z.number().int().nonnegative(),
    usersUsed: z.number().int().nonnegative(),
    factcheckCreditsUsed: z.number().int().nonnegative(),
  })
  .strict();

export type EntitlementUsage = z.infer<typeof EntitlementUsageSchema>;

export const PaidDashboardEntitlementSchema = z
  .object({
    id: z.string().trim().min(1),
    organizationId: z.string().trim().min(1),
    organizationName: z.string().trim().min(1),
    organizationType: z.string().trim().min(1),
    regionId: z.string().trim().min(1).nullable().optional(),
    unitId: z.string().trim().min(1).nullable().optional(),
    planId: z.string().trim().min(1),
    planLabel: z.string().trim().min(1),
    status: z.enum(ENTITLEMENT_STATUSES),
    scope: z.enum(ENTITLEMENT_SCOPES),
    validFrom: z.string().datetime({ offset: true }),
    validUntil: z.string().datetime({ offset: true }).nullable().optional(),
    limits: EntitlementLimitSchema,
    usage: EntitlementUsageSchema,
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    createdBy: z.string().trim().min(1),
    source: z.enum(ENTITLEMENT_SOURCES),
    noAutoBilling: z.literal(true),
    noAutoCharge: z.literal(true),
  })
  .strict();

export type PaidDashboardEntitlement = z.infer<typeof PaidDashboardEntitlementSchema>;

export const EntitlementAuditEventSchema = z
  .object({
    id: z.string().trim().min(1),
    entitlementId: z.string().trim().min(1),
    organizationId: z.string().trim().min(1),
    regionId: z.string().trim().min(1).nullable().optional(),
    eventType: z.enum([
      "created",
      "updated",
      "usage_updated",
      "suspended",
      "revoked",
    ]),
    previousStatus: z.enum(ENTITLEMENT_STATUSES).nullable().optional(),
    nextStatus: z.enum(ENTITLEMENT_STATUSES).nullable().optional(),
    note: z.string().trim().min(1).nullable().optional(),
    createdAt: z.string().datetime({ offset: true }),
    createdBy: z.string().trim().min(1),
  })
  .strict();

export type EntitlementAuditEvent = z.infer<typeof EntitlementAuditEventSchema>;

const EntitlementCheckResultSchema = z
  .object({
    allowed: z.boolean(),
    reason: z.enum(ENTITLEMENT_CHECK_REASONS),
    entitlementId: z.string().trim().min(1).nullable().optional(),
    status: z.enum(ENTITLEMENT_STATUSES).nullable().optional(),
    planId: z.string().trim().min(1).nullable().optional(),
    planLabel: z.string().trim().min(1).nullable().optional(),
    scope: z.enum(ENTITLEMENT_SCOPES).nullable().optional(),
    source: z.enum(ENTITLEMENT_SOURCES).nullable().optional(),
    limits: EntitlementLimitSchema.nullable().optional(),
    usage: EntitlementUsageSchema.nullable().optional(),
    guardrails: z
      .object({
        noAutoBilling: z.literal(true),
        noAutoCharge: z.literal(true),
        noAutoPublish: z.literal(true),
        requiresVerifiedMembership: z.literal(true),
      })
      .strict(),
  })
  .strict();

export type EntitlementCheckResult = z.infer<typeof EntitlementCheckResultSchema>;

export type CreatePaidDashboardEntitlementInput = {
  organizationId: string;
  organizationName: string;
  organizationType: OrganizationType;
  regionId?: string | null;
  unitId?: string | null;
  planId: string;
  planLabel?: string | null;
  status: EntitlementStatus;
  scope: EntitlementScope;
  validFrom?: string | null;
  validUntil?: string | null;
  limits?: Partial<EntitlementLimit> | null;
  usage?: Partial<EntitlementUsage> | null;
  createdBy: string;
  source: EntitlementSource;
};

export type UpdatePaidDashboardEntitlementInput = {
  id: string;
  updatedBy: string;
  status?: EntitlementStatus;
  validUntil?: string | null;
  limits?: Partial<EntitlementLimit> | null;
  note?: string | null;
};

export type UpdateEntitlementUsageInput = {
  id: string;
  updatedBy: string;
  usageDelta?: Partial<EntitlementUsage> | null;
  note?: string | null;
};

export type EntitlementCheckInput = {
  memberships: OrganizationMembership[];
  organizations: Organization[];
  regionId: string;
  draftTarget?: "dossier" | "anlassraum" | null;
};

export type RegionEntitlementRuntimeRepo = {
  createPaidDashboardEntitlement(input: CreatePaidDashboardEntitlementInput): Promise<PaidDashboardEntitlement>;
  getEntitlementsForOrganization(organizationId: string): Promise<PaidDashboardEntitlement[]>;
  getActiveEntitlementForOrganizationRegion(input: {
    organizationId: string;
    regionId?: string | null;
    unitId?: string | null;
  }): Promise<PaidDashboardEntitlement | null>;
  checkRegionDashboardEntitlement(input: EntitlementCheckInput): Promise<EntitlementCheckResult>;
  checkSignalDraftEntitlement(input: EntitlementCheckInput): Promise<EntitlementCheckResult>;
  updateEntitlementUsage(input: UpdateEntitlementUsageInput): Promise<PaidDashboardEntitlement | null>;
  suspendEntitlement(id: string, updatedBy: string, note?: string | null): Promise<PaidDashboardEntitlement | null>;
  revokeEntitlement(id: string, updatedBy: string, note?: string | null): Promise<PaidDashboardEntitlement | null>;
  updatePaidDashboardEntitlement(input: UpdatePaidDashboardEntitlementInput): Promise<PaidDashboardEntitlement | null>;
  listEntitlementsForAdmin(): Promise<PaidDashboardEntitlement[]>;
};

const PAID_DASHBOARD_ENTITLEMENTS_COLLECTION = "paid_dashboard_entitlements";
const ENTITLEMENT_AUDIT_EVENTS_COLLECTION = "edebatte_region_entitlement_audit_events";

type EntitlementDoc = {
  _id: string;
  entitlement: PaidDashboardEntitlement;
  createdAt: Date;
  updatedAt: Date;
};

type EntitlementAuditDoc = {
  _id: string;
  event: EntitlementAuditEvent;
  createdAt: Date;
};

const CHECK_GUARDRAILS = {
  noAutoBilling: true,
  noAutoCharge: true,
  noAutoPublish: true,
  requiresVerifiedMembership: true,
} as const;

const PLAN_LOOKUP = new Map(EDEBATTE_PACKAGES_DE.map((plan) => [plan.id, plan]));
const VERIFIED_MEMBERSHIP_STATUSES = new Set<OrganizationMembership["verificationStatus"]>([
  "organization_verified",
  "unit_verified",
  "publication_approved",
]);
const SUPPORTED_ORGANIZATION_TYPES = new Set<string>([
  "public_administration",
  "municipality",
  "district_office",
  "city_administration",
  "county_administration",
  "ministry",
  "public_body",
  "school",
  "association",
  "ngo",
  "civic_initiative",
  "foundation",
  "media",
  "company",
  "research_institution",
  "custom",
]);

let repoSingleton: RegionEntitlementRuntimeRepo | null = null;
let indexesReady = false;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isoNow() {
  return new Date().toISOString();
}

function defaultUsage(input: Partial<EntitlementUsage> | null | undefined): EntitlementUsage {
  return EntitlementUsageSchema.parse({
    regionsUsed: input?.regionsUsed ?? 0,
    dossiersUsed: input?.dossiersUsed ?? 0,
    anlassraeumeUsed: input?.anlassraeumeUsed ?? 0,
    signalsThisMonth: input?.signalsThisMonth ?? 0,
    draftsThisMonth: input?.draftsThisMonth ?? 0,
    usersUsed: input?.usersUsed ?? 0,
    factcheckCreditsUsed: input?.factcheckCreditsUsed ?? 0,
  });
}

function defaultLimits(input: Partial<EntitlementLimit> | null | undefined): EntitlementLimit {
  return EntitlementLimitSchema.parse({
    maxRegions: input?.maxRegions ?? null,
    maxDossiers: input?.maxDossiers ?? null,
    maxAnlassraeume: input?.maxAnlassraeume ?? null,
    maxSignalsPerMonth: input?.maxSignalsPerMonth ?? null,
    maxDraftsPerMonth: input?.maxDraftsPerMonth ?? null,
    maxUsers: input?.maxUsers ?? null,
    factcheckCredits: input?.factcheckCredits ?? null,
  });
}

function resolveEntitlementPlan(planId: string, planLabel?: string | null): EntitlementPlan {
  const pricingPlan = PLAN_LOOKUP.get(planId as EDebattePackageId);
  return EntitlementPlanSchema.parse({
    id: planId,
    label: planLabel?.trim() || pricingPlan?.titel || planId,
    packageId: pricingPlan?.id ?? null,
    packageStatus: pricingPlan?.status ?? null,
    audience: pricingPlan?.typ ?? null,
  });
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function normalizeRegionId(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function entitlementMatchesScope(input: {
  entitlement: PaidDashboardEntitlement;
  regionId: string;
  unitId?: string | null;
}) {
  const targetRegion = normalizeRegionId(input.regionId);
  const entitlementRegion = normalizeRegionId(input.entitlement.regionId ?? null);
  switch (input.entitlement.scope) {
    case "organization":
      return true;
    case "region":
      return entitlementRegion === targetRegion;
    case "organization_unit":
      return entitlementRegion === targetRegion && Boolean(input.unitId) && input.entitlement.unitId === input.unitId;
    default:
      return false;
  }
}

function membershipIsVerifiedForEntitlement(membership: OrganizationMembership): boolean {
  if (membership.revokedAt) return false;
  if (membership.expiresAt && Date.parse(membership.expiresAt) <= Date.now()) return false;
  return VERIFIED_MEMBERSHIP_STATUSES.has(membership.verificationStatus);
}

function statusPrecedence(status: EntitlementStatus): number {
  switch (status) {
    case "active":
      return 0;
    case "trial":
      return 1;
    case "past_due":
      return 2;
    case "suspended":
      return 3;
    case "expired":
      return 4;
    case "cancelled":
      return 5;
    case "revoked":
      return 6;
    default:
      return 7;
  }
}

function compareEntitlements(left: PaidDashboardEntitlement, right: PaidDashboardEntitlement) {
  return statusPrecedence(left.status) - statusPrecedence(right.status);
}

function overLimitReason(
  entitlement: PaidDashboardEntitlement,
  input: { regionId: string; draftTarget?: "dossier" | "anlassraum" | null },
): boolean {
  const { limits, usage } = entitlement;
  if (typeof limits.maxUsers === "number" && usage.usersUsed >= limits.maxUsers) return true;
  if (typeof limits.maxRegions === "number" && usage.regionsUsed >= limits.maxRegions && entitlement.scope === "organization") {
    return true;
  }
  if (typeof limits.maxSignalsPerMonth === "number" && usage.signalsThisMonth >= limits.maxSignalsPerMonth) {
    return true;
  }
  if (typeof limits.maxDraftsPerMonth === "number" && usage.draftsThisMonth >= limits.maxDraftsPerMonth) {
    return true;
  }
  if (input.draftTarget === "dossier" && typeof limits.maxDossiers === "number" && usage.dossiersUsed >= limits.maxDossiers) {
    return true;
  }
  if (
    input.draftTarget === "anlassraum" &&
    typeof limits.maxAnlassraeume === "number" &&
    usage.anlassraeumeUsed >= limits.maxAnlassraeume
  ) {
    return true;
  }
  return false;
}

function blockedResult(reason: EntitlementCheckReason, entitlement?: PaidDashboardEntitlement | null): EntitlementCheckResult {
  return EntitlementCheckResultSchema.parse({
    allowed: false,
    reason,
    entitlementId: entitlement?.id ?? null,
    status: entitlement?.status ?? null,
    planId: entitlement?.planId ?? null,
    planLabel: entitlement?.planLabel ?? null,
    scope: entitlement?.scope ?? null,
    source: entitlement?.source ?? null,
    limits: entitlement?.limits ?? null,
    usage: entitlement?.usage ?? null,
    guardrails: CHECK_GUARDRAILS,
  });
}

function allowedResult(reason: "active" | "trial", entitlement: PaidDashboardEntitlement): EntitlementCheckResult {
  return EntitlementCheckResultSchema.parse({
    allowed: true,
    reason,
    entitlementId: entitlement.id,
    status: entitlement.status,
    planId: entitlement.planId,
    planLabel: entitlement.planLabel,
    scope: entitlement.scope,
    source: entitlement.source,
    limits: entitlement.limits,
    usage: entitlement.usage,
    guardrails: CHECK_GUARDRAILS,
  });
}

function mapEntitlementDoc(doc: EntitlementDoc | null): PaidDashboardEntitlement | null {
  if (!doc?.entitlement) return null;
  return clone(doc.entitlement);
}

async function ensureMongoIndexes() {
  if (indexesReady) return;
  const [entitlements, audit] = await Promise.all([
    coreCol<EntitlementDoc>(PAID_DASHBOARD_ENTITLEMENTS_COLLECTION),
    coreCol<EntitlementAuditDoc>(ENTITLEMENT_AUDIT_EVENTS_COLLECTION),
  ]);
  await Promise.all([
    entitlements.createIndex({ "entitlement.organizationId": 1 }),
    entitlements.createIndex({ "entitlement.regionId": 1 }),
    entitlements.createIndex({ "entitlement.status": 1 }),
    entitlements.createIndex({ "entitlement.planId": 1 }),
    entitlements.createIndex({ "entitlement.validUntil": 1 }),
    entitlements.createIndex({ "entitlement.source": 1 }),
    audit.createIndex({ "event.entitlementId": 1, createdAt: -1 }),
  ]);
  indexesReady = true;
}

async function appendAuditEventMongo(event: EntitlementAuditEvent) {
  await ensureMongoIndexes();
  const col = await coreCol<EntitlementAuditDoc>(ENTITLEMENT_AUDIT_EVENTS_COLLECTION);
  await col.insertOne({
    _id: event.id,
    event: clone(event),
    createdAt: new Date(event.createdAt),
  });
}

function createAuditEvent(input: {
  entitlement: PaidDashboardEntitlement;
  eventType: EntitlementAuditEvent["eventType"];
  createdBy: string;
  previousStatus?: EntitlementStatus | null;
  nextStatus?: EntitlementStatus | null;
  note?: string | null;
}): EntitlementAuditEvent {
  return EntitlementAuditEventSchema.parse({
    id: new ObjectId().toHexString(),
    entitlementId: input.entitlement.id,
    organizationId: input.entitlement.organizationId,
    regionId: input.entitlement.regionId ?? null,
    eventType: input.eventType,
    previousStatus: input.previousStatus ?? null,
    nextStatus: input.nextStatus ?? null,
    note: input.note ?? null,
    createdAt: isoNow(),
    createdBy: input.createdBy,
  });
}

async function evaluateEntitlementCheck(
  listEntitlementsForOrganizations: (organizationIds: string[]) => Promise<PaidDashboardEntitlement[]>,
  input: EntitlementCheckInput,
): Promise<EntitlementCheckResult> {
  const verifiedMemberships = input.memberships.filter(membershipIsVerifiedForEntitlement);
  if (verifiedMemberships.length === 0) {
    return blockedResult("membership_not_verified");
  }

  const organizationsById = new Map(input.organizations.map((organization) => [organization.id, organization]));
  const candidateMemberships = verifiedMemberships.filter((membership) => {
    const membershipRegion = normalizeRegionId(
      membership.regionId ?? organizationsById.get(membership.organizationId)?.primaryRegionId ?? null,
    );
    return membershipRegion === normalizeRegionId(input.regionId);
  });

  if (candidateMemberships.length === 0) {
    return blockedResult("wrong_region");
  }

  const unsupported = candidateMemberships.find(
    (membership) => !SUPPORTED_ORGANIZATION_TYPES.has(membership.organizationType),
  );
  if (unsupported) {
    return blockedResult("unsupported_organization_type");
  }

  const entitlements = await listEntitlementsForOrganizations(
    candidateMemberships.map((membership) => membership.organizationId),
  );
  if (entitlements.length === 0) {
    return blockedResult("missing_entitlement");
  }

  const relevant = candidateMemberships.flatMap((membership) =>
    entitlements.filter((entitlement) =>
      entitlement.organizationId === membership.organizationId &&
      entitlementMatchesScope({
        entitlement,
        regionId: input.regionId,
        unitId: membership.unitId ?? null,
      }),
    ),
  );

  if (relevant.length === 0) {
    const sameOrgOtherRegion = candidateMemberships.some((membership) =>
      entitlements.some((entitlement) => entitlement.organizationId === membership.organizationId),
    );
    return blockedResult(sameOrgOtherRegion ? "wrong_region" : "missing_entitlement");
  }

  const entitlement = relevant.sort(compareEntitlements)[0];
  const now = Date.now();
  if (entitlement.validUntil && Date.parse(entitlement.validUntil) <= now) {
    return blockedResult("expired", entitlement);
  }
  if (entitlement.status === "trial" || entitlement.status === "active") {
    if (overLimitReason(entitlement, input)) {
      return blockedResult("over_limit", entitlement);
    }
    return allowedResult(entitlement.status, entitlement);
  }
  if (entitlement.status === "past_due") return blockedResult("past_due", entitlement);
  if (entitlement.status === "suspended") return blockedResult("suspended", entitlement);
  if (entitlement.status === "revoked") return blockedResult("expired", entitlement);
  if (entitlement.status === "cancelled") return blockedResult("expired", entitlement);
  if (entitlement.status === "expired") return blockedResult("expired", entitlement);
  return blockedResult("missing_entitlement", entitlement);
}

export function createMongoRegionEntitlementRuntimeRepo(): RegionEntitlementRuntimeRepo {
  return {
    async createPaidDashboardEntitlement(input) {
      await ensureMongoIndexes();
      const plan = resolveEntitlementPlan(input.planId, input.planLabel);
      const createdAt = isoNow();
      const entitlement = PaidDashboardEntitlementSchema.parse({
        id: new ObjectId().toHexString(),
        organizationId: input.organizationId,
        organizationName: input.organizationName,
        organizationType: input.organizationType,
        regionId: input.regionId ?? null,
        unitId: input.unitId ?? null,
        planId: plan.id,
        planLabel: plan.label,
        status: input.status,
        scope: input.scope,
        validFrom: input.validFrom ?? createdAt,
        validUntil: input.validUntil ?? null,
        limits: defaultLimits(input.limits),
        usage: defaultUsage(input.usage),
        createdAt,
        updatedAt: createdAt,
        createdBy: input.createdBy,
        source: input.source,
        noAutoBilling: true,
        noAutoCharge: true,
      });
      const col = await coreCol<EntitlementDoc>(PAID_DASHBOARD_ENTITLEMENTS_COLLECTION);
      const now = new Date();
      await col.insertOne({
        _id: entitlement.id,
        entitlement: clone(entitlement),
        createdAt: now,
        updatedAt: now,
      });
      await appendAuditEventMongo(
        createAuditEvent({
          entitlement,
          eventType: "created",
          createdBy: input.createdBy,
          nextStatus: entitlement.status,
        }),
      );
      return entitlement;
    },

    async getEntitlementsForOrganization(organizationId) {
      await ensureMongoIndexes();
      const col = await coreCol<EntitlementDoc>(PAID_DASHBOARD_ENTITLEMENTS_COLLECTION);
      const docs = await col.find({ "entitlement.organizationId": organizationId }).sort({ updatedAt: -1 }).toArray();
      return docs
        .map((doc) => mapEntitlementDoc(doc))
        .filter((entry): entry is PaidDashboardEntitlement => Boolean(entry));
    },

    async getActiveEntitlementForOrganizationRegion(input) {
      const all = await this.getEntitlementsForOrganization(input.organizationId);
      const targetRegion = normalizeRegionId(input.regionId ?? null);
      const matches = all.filter((entitlement) => {
        if (entitlement.status !== "active" && entitlement.status !== "trial") return false;
        if (entitlement.validUntil && Date.parse(entitlement.validUntil) <= Date.now()) return false;
        return entitlementMatchesScope({
          entitlement,
          regionId: targetRegion || entitlement.regionId || "",
          unitId: input.unitId ?? null,
        });
      });
      return matches.sort(compareEntitlements)[0] ?? null;
    },

    async checkRegionDashboardEntitlement(input) {
      return evaluateEntitlementCheck(
        async (organizationIds) => {
          const all = await Promise.all(
            uniqueNonEmpty(organizationIds).map((organizationId) => this.getEntitlementsForOrganization(organizationId)),
          );
          return all.flat();
        },
        { ...input, draftTarget: null },
      );
    },

    async checkSignalDraftEntitlement(input) {
      return evaluateEntitlementCheck(
        async (organizationIds) => {
          const all = await Promise.all(
            uniqueNonEmpty(organizationIds).map((organizationId) => this.getEntitlementsForOrganization(organizationId)),
          );
          return all.flat();
        },
        input,
      );
    },

    async updateEntitlementUsage(input) {
      await ensureMongoIndexes();
      const col = await coreCol<EntitlementDoc>(PAID_DASHBOARD_ENTITLEMENTS_COLLECTION);
      const doc = await col.findOne({ _id: input.id });
      const current = mapEntitlementDoc(doc);
      if (!current) return null;
      const updated = PaidDashboardEntitlementSchema.parse({
        ...current,
        usage: defaultUsage({
          regionsUsed: current.usage.regionsUsed + (input.usageDelta?.regionsUsed ?? 0),
          dossiersUsed: current.usage.dossiersUsed + (input.usageDelta?.dossiersUsed ?? 0),
          anlassraeumeUsed: current.usage.anlassraeumeUsed + (input.usageDelta?.anlassraeumeUsed ?? 0),
          signalsThisMonth: current.usage.signalsThisMonth + (input.usageDelta?.signalsThisMonth ?? 0),
          draftsThisMonth: current.usage.draftsThisMonth + (input.usageDelta?.draftsThisMonth ?? 0),
          usersUsed: current.usage.usersUsed + (input.usageDelta?.usersUsed ?? 0),
          factcheckCreditsUsed: current.usage.factcheckCreditsUsed + (input.usageDelta?.factcheckCreditsUsed ?? 0),
        }),
        updatedAt: isoNow(),
      });
      await col.updateOne(
        { _id: updated.id },
        { $set: { entitlement: clone(updated), updatedAt: new Date(updated.updatedAt) } },
      );
      await appendAuditEventMongo(
        createAuditEvent({
          entitlement: updated,
          eventType: "usage_updated",
          createdBy: input.updatedBy,
          previousStatus: current.status,
          nextStatus: updated.status,
          note: input.note ?? null,
        }),
      );
      return updated;
    },

    async suspendEntitlement(id, updatedBy, note) {
      return this.updatePaidDashboardEntitlement({
        id,
        updatedBy,
        status: "suspended",
        note,
      });
    },

    async revokeEntitlement(id, updatedBy, note) {
      return this.updatePaidDashboardEntitlement({
        id,
        updatedBy,
        status: "revoked",
        note,
      });
    },

    async updatePaidDashboardEntitlement(input) {
      await ensureMongoIndexes();
      const col = await coreCol<EntitlementDoc>(PAID_DASHBOARD_ENTITLEMENTS_COLLECTION);
      const doc = await col.findOne({ _id: input.id });
      const current = mapEntitlementDoc(doc);
      if (!current) return null;
      const updated = PaidDashboardEntitlementSchema.parse({
        ...current,
        status: input.status ?? current.status,
        validUntil:
          input.validUntil === undefined
            ? current.validUntil ?? null
            : input.validUntil,
        limits: input.limits ? defaultLimits({ ...current.limits, ...input.limits }) : current.limits,
        updatedAt: isoNow(),
      });
      await col.updateOne(
        { _id: updated.id },
        { $set: { entitlement: clone(updated), updatedAt: new Date(updated.updatedAt) } },
      );
      const eventType =
        updated.status === "suspended"
          ? "suspended"
          : updated.status === "revoked"
            ? "revoked"
            : "updated";
      await appendAuditEventMongo(
        createAuditEvent({
          entitlement: updated,
          eventType,
          createdBy: input.updatedBy,
          previousStatus: current.status,
          nextStatus: updated.status,
          note: input.note ?? null,
        }),
      );
      return updated;
    },

    async listEntitlementsForAdmin() {
      await ensureMongoIndexes();
      const col = await coreCol<EntitlementDoc>(PAID_DASHBOARD_ENTITLEMENTS_COLLECTION);
      const docs = await col.find({}).sort({ updatedAt: -1 }).limit(500).toArray();
      return docs
        .map((doc) => mapEntitlementDoc(doc))
        .filter((entry): entry is PaidDashboardEntitlement => Boolean(entry));
    },
  };
}

export function createInMemoryRegionEntitlementRuntimeRepo(seed?: {
  entitlements?: PaidDashboardEntitlement[];
  auditEvents?: EntitlementAuditEvent[];
}): RegionEntitlementRuntimeRepo {
  const entitlements = new Map<string, PaidDashboardEntitlement>();
  const auditEvents = new Map<string, EntitlementAuditEvent>();
  for (const entitlement of seed?.entitlements ?? []) entitlements.set(entitlement.id, clone(entitlement));
  for (const event of seed?.auditEvents ?? []) auditEvents.set(event.id, clone(event));

  const repo: RegionEntitlementRuntimeRepo = {
    async createPaidDashboardEntitlement(input) {
      const plan = resolveEntitlementPlan(input.planId, input.planLabel);
      const createdAt = isoNow();
      const entitlement = PaidDashboardEntitlementSchema.parse({
        id: new ObjectId().toHexString(),
        organizationId: input.organizationId,
        organizationName: input.organizationName,
        organizationType: input.organizationType,
        regionId: input.regionId ?? null,
        unitId: input.unitId ?? null,
        planId: plan.id,
        planLabel: plan.label,
        status: input.status,
        scope: input.scope,
        validFrom: input.validFrom ?? createdAt,
        validUntil: input.validUntil ?? null,
        limits: defaultLimits(input.limits),
        usage: defaultUsage(input.usage),
        createdAt,
        updatedAt: createdAt,
        createdBy: input.createdBy,
        source: input.source,
        noAutoBilling: true,
        noAutoCharge: true,
      });
      entitlements.set(entitlement.id, clone(entitlement));
      const event = createAuditEvent({
        entitlement,
        eventType: "created",
        createdBy: input.createdBy,
        nextStatus: entitlement.status,
      });
      auditEvents.set(event.id, clone(event));
      return entitlement;
    },

    async getEntitlementsForOrganization(organizationId) {
      return Array.from(entitlements.values())
        .map((entitlement) => clone(entitlement))
        .filter((entitlement) => entitlement.organizationId === organizationId)
        .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
    },

    async getActiveEntitlementForOrganizationRegion(input) {
      const list = await this.getEntitlementsForOrganization(input.organizationId);
      const matches = list.filter((entitlement) => {
        if (entitlement.status !== "active" && entitlement.status !== "trial") return false;
        if (entitlement.validUntil && Date.parse(entitlement.validUntil) <= Date.now()) return false;
        return entitlementMatchesScope({
          entitlement,
          regionId: input.regionId ?? entitlement.regionId ?? "",
          unitId: input.unitId ?? null,
        });
      });
      return matches.sort(compareEntitlements)[0] ?? null;
    },

    async checkRegionDashboardEntitlement(input) {
      return evaluateEntitlementCheck(
        async (organizationIds) =>
          Array.from(entitlements.values()).filter((entitlement) =>
            uniqueNonEmpty(organizationIds).includes(entitlement.organizationId),
          ),
        { ...input, draftTarget: null },
      );
    },

    async checkSignalDraftEntitlement(input) {
      return evaluateEntitlementCheck(
        async (organizationIds) =>
          Array.from(entitlements.values()).filter((entitlement) =>
            uniqueNonEmpty(organizationIds).includes(entitlement.organizationId),
          ),
        input,
      );
    },

    async updateEntitlementUsage(input) {
      const current = entitlements.get(input.id);
      if (!current) return null;
      const updated = PaidDashboardEntitlementSchema.parse({
        ...current,
        usage: defaultUsage({
          regionsUsed: current.usage.regionsUsed + (input.usageDelta?.regionsUsed ?? 0),
          dossiersUsed: current.usage.dossiersUsed + (input.usageDelta?.dossiersUsed ?? 0),
          anlassraeumeUsed: current.usage.anlassraeumeUsed + (input.usageDelta?.anlassraeumeUsed ?? 0),
          signalsThisMonth: current.usage.signalsThisMonth + (input.usageDelta?.signalsThisMonth ?? 0),
          draftsThisMonth: current.usage.draftsThisMonth + (input.usageDelta?.draftsThisMonth ?? 0),
          usersUsed: current.usage.usersUsed + (input.usageDelta?.usersUsed ?? 0),
          factcheckCreditsUsed: current.usage.factcheckCreditsUsed + (input.usageDelta?.factcheckCreditsUsed ?? 0),
        }),
        updatedAt: isoNow(),
      });
      entitlements.set(updated.id, clone(updated));
      const event = createAuditEvent({
        entitlement: updated,
        eventType: "usage_updated",
        createdBy: input.updatedBy,
        previousStatus: current.status,
        nextStatus: updated.status,
        note: input.note ?? null,
      });
      auditEvents.set(event.id, clone(event));
      return updated;
    },

    async suspendEntitlement(id, updatedBy, note) {
      return this.updatePaidDashboardEntitlement({ id, updatedBy, status: "suspended", note });
    },

    async revokeEntitlement(id, updatedBy, note) {
      return this.updatePaidDashboardEntitlement({ id, updatedBy, status: "revoked", note });
    },

    async updatePaidDashboardEntitlement(input) {
      const current = entitlements.get(input.id);
      if (!current) return null;
      const updated = PaidDashboardEntitlementSchema.parse({
        ...current,
        status: input.status ?? current.status,
        validUntil: input.validUntil === undefined ? current.validUntil ?? null : input.validUntil,
        limits: input.limits ? defaultLimits({ ...current.limits, ...input.limits }) : current.limits,
        updatedAt: isoNow(),
      });
      entitlements.set(updated.id, clone(updated));
      const event = createAuditEvent({
        entitlement: updated,
        eventType:
          updated.status === "suspended"
            ? "suspended"
            : updated.status === "revoked"
              ? "revoked"
              : "updated",
        createdBy: input.updatedBy,
        previousStatus: current.status,
        nextStatus: updated.status,
        note: input.note ?? null,
      });
      auditEvents.set(event.id, clone(event));
      return updated;
    },

    async listEntitlementsForAdmin() {
      return Array.from(entitlements.values())
        .map((entitlement) => clone(entitlement))
        .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
    },
  };

  return repo;
}

export function getRegionEntitlementRuntimeRepo(): RegionEntitlementRuntimeRepo {
  if (shouldUseInMemoryMongoFallback()) {
    if (!repoSingleton) repoSingleton = createInMemoryRegionEntitlementRuntimeRepo();
    return repoSingleton;
  }
  if (!repoSingleton) repoSingleton = createMongoRegionEntitlementRuntimeRepo();
  return repoSingleton;
}

export function setRegionEntitlementRuntimeRepoForTests(repo: RegionEntitlementRuntimeRepo | null) {
  repoSingleton = repo;
}
