import { coreCol, ObjectId, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { buildRegionAccessContext, type RegionAccessContext } from "../access";
import { getRegionEntitlementRuntimeRepo } from "./paidEntitlements";
import {
  allowedActionsForVerificationStatus,
  inferProvisioningRequestFromClaim,
  parseMembershipAuditEvent,
  parseOrganization,
  parseOrganizationClaim,
  parseOrganizationMembership,
  parseOrganizationProvisioningRequest,
  parseOrganizationUnit,
  parseVerificationReview,
  type MembershipAuditEvent,
  type OnboardingAllowedAction,
  type OptionalLocation,
  type Organization,
  type OrganizationClaim,
  type OrganizationClaimSource,
  type OrganizationMembership,
  type OrganizationProvisioningRequest,
  type OrganizationType,
  type OrganizationUnit,
  type VerificationReview,
  type VerificationReviewDecision,
  type VerificationStatus,
} from "../organizationOnboarding";

const ORGANIZATIONS_COLLECTION = "edebatte_region_organizations";
const ORGANIZATION_UNITS_COLLECTION = "edebatte_region_organization_units";
const ORGANIZATION_CLAIMS_COLLECTION = "organization_claims";
const ORGANIZATION_MEMBERSHIPS_COLLECTION = "organization_memberships";
const VERIFICATION_REVIEWS_COLLECTION = "edebatte_region_verification_reviews";
const MEMBERSHIP_AUDIT_EVENTS_COLLECTION = "edebatte_region_membership_audit_events";

type OrganizationDoc = {
  _id: string;
  organization: Organization;
  lookupKey: string;
  createdAt: Date;
  updatedAt: Date;
};

type OrganizationUnitDoc = {
  _id: string;
  unit: OrganizationUnit;
  lookupKey: string;
  createdAt: Date;
  updatedAt: Date;
};

type OrganizationClaimDoc = {
  _id: string;
  claim: OrganizationClaim;
  createdAt: Date;
  updatedAt: Date;
};

type OrganizationMembershipDoc = {
  _id: string;
  membership: OrganizationMembership;
  createdAt: Date;
  updatedAt: Date;
};

type VerificationReviewDoc = {
  _id: string;
  review: VerificationReview;
  createdAt: Date;
};

type MembershipAuditEventDoc = {
  _id: string;
  event: MembershipAuditEvent;
  createdAt: Date;
};

export type CreateOrganizationClaimInput = {
  userId: string;
  organizationName: string;
  organizationType: OrganizationType;
  regionId?: string | null;
  countryCode?: string | null;
  unitName?: string | null;
  roleLabel?: string | null;
  optionalLocation?: OptionalLocation | null;
  evidence?: {
    emailDomain?: string | null;
    website?: string | null;
    note?: string | null;
  };
  verificationStatus?: VerificationStatus;
  source?: OrganizationClaimSource;
  selfDeclaredProfile?: OrganizationClaim["selfDeclaredProfile"];
  provisioningRequest?: OrganizationProvisioningRequest | null;
};

export type ReviewOrganizationClaimInput = {
  claimId: string;
  reviewedBy: string;
  decision: VerificationReviewDecision;
  allowedActions?: OnboardingAllowedAction[] | null;
  note?: string | null;
};

export type ReviewOrganizationClaimResult = {
  claim: OrganizationClaim;
  membership: OrganizationMembership | null;
  review: VerificationReview;
  auditEvents: MembershipAuditEvent[];
};

export type RegionOrganizationRuntimeRepo = {
  createOrganizationClaim(input: CreateOrganizationClaimInput): Promise<OrganizationClaim>;
  listOrganizationClaimsForUser(userId: string): Promise<OrganizationClaim[]>;
  listOrganizationClaimsForReview(): Promise<OrganizationClaim[]>;
  getOrganizationClaimById(id: string): Promise<OrganizationClaim | null>;
  listMembershipsForUser(userId: string): Promise<OrganizationMembership[]>;
  getVerifiedMembershipsForUser(userId: string): Promise<OrganizationMembership[]>;
  listOrganizationsByIds(ids: string[]): Promise<Organization[]>;
  reviewOrganizationClaim(input: ReviewOrganizationClaimInput): Promise<ReviewOrganizationClaimResult>;
  createOrUpdateMembershipFromReview(input: ReviewOrganizationClaimInput): Promise<OrganizationMembership | null>;
  revokeMembership(membershipId: string, reviewedBy: string, note?: string | null): Promise<OrganizationMembership | null>;
};

let indexesReady = false;
let repoSingleton: RegionOrganizationRuntimeRepo | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isoNow() {
  return new Date().toISOString();
}

function normalizeName(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function nextStatusForDecision(decision: VerificationReviewDecision): VerificationStatus {
  switch (decision) {
    case "approve_organization":
      return "organization_verified";
    case "approve_unit":
      return "unit_verified";
    case "approve_publication":
      return "publication_approved";
    case "reject":
      return "rejected";
    case "revoke":
      return "revoked";
    case "needs_more_information":
    default:
      return "pending_review";
  }
}

function nextProvisioningRequestFromReview(input: {
  claim: OrganizationClaim;
  reviewedBy: string;
  decision: VerificationReviewDecision;
  note?: string | null;
  reviewedAt: string;
}): OrganizationProvisioningRequest {
  const existing = inferProvisioningRequestFromClaim(input.claim);
  const status =
    input.decision === "reject"
      ? "rejected"
      : input.decision === "revoke"
        ? "suspended"
        : input.decision === "needs_more_information"
          ? "verification_required"
          : "approved";
  const latestDecision =
    input.decision === "reject"
      ? "reject"
      : input.decision === "revoke"
        ? "suspend"
        : input.decision === "needs_more_information"
          ? "request_verification"
          : "approve";

  return parseOrganizationProvisioningRequest({
    ...existing,
    status,
    latestDecision,
    note: input.note ?? existing.note ?? null,
    submittedAt: existing.submittedAt ?? input.claim.createdAt,
    decidedAt: input.reviewedAt,
    decidedBy: input.reviewedBy,
  });
}

function buildOrganizationLookupKey(input: {
  organizationName: string;
  organizationType: OrganizationType;
  regionId?: string | null;
  countryCode?: string | null;
}) {
  return [
    normalizeName(input.organizationType),
    normalizeName(input.countryCode ?? ""),
    normalizeName(input.regionId ?? ""),
    normalizeName(input.organizationName),
  ]
    .filter(Boolean)
    .join(":");
}

function buildUnitLookupKey(input: { organizationId: string; unitName: string }) {
  return `${input.organizationId}:${normalizeName(input.unitName)}`;
}

function buildMembershipLookupKey(input: {
  userId: string;
  organizationId: string;
  unitId?: string | null;
}) {
  return `${input.userId}:${input.organizationId}:${input.unitId ?? "root"}`;
}

function normalizeAllowedActions(
  status: VerificationStatus,
  allowedActions?: OnboardingAllowedAction[] | null,
): OnboardingAllowedAction[] {
  const explicit = uniqueNonEmpty((allowedActions ?? []) as string[]);
  if (explicit.length > 0) return explicit as OnboardingAllowedAction[];
  return allowedActionsForVerificationStatus(status);
}

function mapOrganizationDoc(doc: OrganizationDoc | null): Organization | null {
  if (!doc?.organization) return null;
  return clone(doc.organization);
}

function mapClaimDoc(doc: OrganizationClaimDoc | null): OrganizationClaim | null {
  if (!doc?.claim) return null;
  return clone(doc.claim);
}

function mapMembershipDoc(doc: OrganizationMembershipDoc | null): OrganizationMembership | null {
  if (!doc?.membership) return null;
  return clone(doc.membership);
}

async function ensureMongoIndexes() {
  if (indexesReady) return;
  const [
    organizations,
    units,
    claims,
    memberships,
    reviews,
    audit,
  ] = await Promise.all([
    coreCol<OrganizationDoc>(ORGANIZATIONS_COLLECTION),
    coreCol<OrganizationUnitDoc>(ORGANIZATION_UNITS_COLLECTION),
    coreCol<OrganizationClaimDoc>(ORGANIZATION_CLAIMS_COLLECTION),
    coreCol<OrganizationMembershipDoc>(ORGANIZATION_MEMBERSHIPS_COLLECTION),
    coreCol<VerificationReviewDoc>(VERIFICATION_REVIEWS_COLLECTION),
    coreCol<MembershipAuditEventDoc>(MEMBERSHIP_AUDIT_EVENTS_COLLECTION),
  ]);

  await Promise.all([
    organizations.createIndex({ lookupKey: 1 }, { unique: true }),
    organizations.createIndex({ "organization.primaryRegionId": 1 }),
    organizations.createIndex({ "organization.type": 1 }),
    units.createIndex({ lookupKey: 1 }, { unique: true }),
    units.createIndex({ "unit.organizationId": 1 }),
    claims.createIndex({ "claim.userId": 1, "claim.createdAt": -1 }),
    claims.createIndex({ "claim.organizationType": 1, "claim.createdAt": -1 }),
    claims.createIndex({ "claim.regionId": 1, "claim.verificationStatus": 1 }),
    claims.createIndex({ "claim.verificationStatus": 1, createdAt: -1 }),
    memberships.createIndex({ "membership.userId": 1, "membership.updatedAt": -1 }),
    memberships.createIndex({ "membership.organizationId": 1 }),
    memberships.createIndex({ "membership.regionId": 1, "membership.verificationStatus": 1 }),
    memberships.createIndex({ "membership.verificationStatus": 1, "membership.createdAt": -1 }),
    memberships.createIndex({ "membership.organizationType": 1 }),
    reviews.createIndex({ "review.claimId": 1, createdAt: -1 }),
    audit.createIndex({ "event.membershipId": 1, createdAt: -1 }),
    audit.createIndex({ "event.claimId": 1, createdAt: -1 }),
  ]);

  indexesReady = true;
}

async function appendAuditEventMongo(event: MembershipAuditEvent) {
  await ensureMongoIndexes();
  const col = await coreCol<MembershipAuditEventDoc>(MEMBERSHIP_AUDIT_EVENTS_COLLECTION);
  await col.insertOne({
    _id: event.id,
    event: clone(event),
    createdAt: new Date(event.createdAt),
  });
}

async function createOrFindOrganizationMongo(claim: OrganizationClaim, reviewedBy: string): Promise<Organization> {
  await ensureMongoIndexes();
  const col = await coreCol<OrganizationDoc>(ORGANIZATIONS_COLLECTION);
  const lookupKey = buildOrganizationLookupKey({
    organizationName: claim.organizationName,
    organizationType: claim.organizationType,
    regionId: claim.regionId,
    countryCode: claim.countryCode,
  });
  const existing = await col.findOne({ lookupKey });
  if (existing?.organization) return clone(existing.organization);

  const organization = parseOrganization({
    id: new ObjectId().toHexString(),
    name: claim.organizationName,
    type: claim.organizationType,
    countryCode: claim.countryCode ?? null,
    primaryRegionId: claim.regionId ?? null,
    website: claim.evidence.website ?? null,
    verificationStatus: "organization_verified",
    createdByUserId: reviewedBy,
  });
  const now = new Date();
  await col.insertOne({
    _id: organization.id,
    organization: clone(organization),
    lookupKey,
    createdAt: now,
    updatedAt: now,
  });
  return organization;
}

async function createOrFindUnitMongo(
  organizationId: string,
  claim: OrganizationClaim,
): Promise<OrganizationUnit | null> {
  const unitName = String(claim.unitName ?? "").trim();
  if (!unitName) return null;
  await ensureMongoIndexes();
  const col = await coreCol<OrganizationUnitDoc>(ORGANIZATION_UNITS_COLLECTION);
  const lookupKey = buildUnitLookupKey({ organizationId, unitName });
  const existing = await col.findOne({ lookupKey });
  if (existing?.unit) return clone(existing.unit);

  const unit = parseOrganizationUnit({
    id: new ObjectId().toHexString(),
    organizationId,
    name: unitName,
    type: "unit",
    parentUnitId: null,
    jurisdictionTags: uniqueNonEmpty([claim.regionId, unitName]),
    verificationStatus: "unit_verified",
  });
  const now = new Date();
  await col.insertOne({
    _id: unit.id,
    unit: clone(unit),
    lookupKey,
    createdAt: now,
    updatedAt: now,
  });
  return unit;
}

export function createMongoRegionOrganizationRuntimeRepo(): RegionOrganizationRuntimeRepo {
  return {
    async createOrganizationClaim(input) {
      await ensureMongoIndexes();
      const claimId = new ObjectId().toHexString();
      const createdAt = isoNow();
      const claim = parseOrganizationClaim({
        id: claimId,
        userId: input.userId,
        organizationId: null,
        organizationName: input.organizationName,
        organizationType: input.organizationType,
        regionId: input.regionId ?? null,
        countryCode: input.countryCode ?? null,
        unitName: input.unitName ?? null,
        roleLabel: input.roleLabel ?? null,
        optionalLocation: input.optionalLocation ?? null,
        evidence: {
          emailDomain: input.evidence?.emailDomain ?? null,
          website: input.evidence?.website ?? null,
          note: input.evidence?.note ?? null,
        },
        verificationStatus: input.verificationStatus ?? "pending_review",
        provisioningRequest: input.provisioningRequest ?? null,
        selfDeclaredProfile: input.selfDeclaredProfile ?? null,
        createdAt,
        updatedAt: createdAt,
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
        source: input.source ?? "self_declared",
        noAutoAuthority: true,
      });
      const claims = await coreCol<OrganizationClaimDoc>(ORGANIZATION_CLAIMS_COLLECTION);
      const now = new Date();
      await claims.insertOne({
        _id: claim.id,
        claim: clone(claim),
        createdAt: now,
        updatedAt: now,
      });
      await appendAuditEventMongo(
        parseMembershipAuditEvent({
          id: new ObjectId().toHexString(),
          membershipId: null,
          claimId: claim.id,
          userId: claim.userId,
          organizationId: null,
          regionId: claim.regionId ?? null,
          eventType: "claim_created",
          verificationStatus: claim.verificationStatus,
          note: claim.evidence.note ?? null,
          createdBy: claim.userId,
          createdAt,
        }),
      );
      return claim;
    },

    async listOrganizationClaimsForUser(userId) {
      await ensureMongoIndexes();
      const claims = await coreCol<OrganizationClaimDoc>(ORGANIZATION_CLAIMS_COLLECTION);
      const docs = await claims.find({ "claim.userId": userId }).sort({ createdAt: -1 }).toArray();
      return docs
        .map((doc) => mapClaimDoc(doc))
        .filter((entry): entry is OrganizationClaim => Boolean(entry));
    },

    async listOrganizationClaimsForReview() {
      await ensureMongoIndexes();
      const claims = await coreCol<OrganizationClaimDoc>(ORGANIZATION_CLAIMS_COLLECTION);
      const docs = await claims
        .find({
          "claim.verificationStatus": {
            $in: ["pending_review", "email_verified", "organization_verified", "unit_verified"],
          },
        })
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();
      return docs
        .map((doc) => mapClaimDoc(doc))
        .filter((entry): entry is OrganizationClaim => Boolean(entry));
    },

    async getOrganizationClaimById(id) {
      await ensureMongoIndexes();
      const claims = await coreCol<OrganizationClaimDoc>(ORGANIZATION_CLAIMS_COLLECTION);
      const doc = await claims.findOne({ _id: id });
      return mapClaimDoc(doc);
    },

    async listMembershipsForUser(userId) {
      await ensureMongoIndexes();
      const memberships = await coreCol<OrganizationMembershipDoc>(ORGANIZATION_MEMBERSHIPS_COLLECTION);
      const docs = await memberships.find({ "membership.userId": userId }).sort({ updatedAt: -1 }).toArray();
      return docs
        .map((doc) => mapMembershipDoc(doc))
        .filter((entry): entry is OrganizationMembership => Boolean(entry));
    },

    async getVerifiedMembershipsForUser(userId) {
      const memberships = await this.listMembershipsForUser(userId);
      const now = Date.now();
      return memberships.filter((membership) => {
        if (
          membership.verificationStatus !== "organization_verified" &&
          membership.verificationStatus !== "unit_verified" &&
          membership.verificationStatus !== "publication_approved"
        ) {
          return false;
        }
        if (membership.revokedAt) return false;
        if (membership.expiresAt && Date.parse(membership.expiresAt) <= now) return false;
        return true;
      });
    },

    async listOrganizationsByIds(ids) {
      const normalized = uniqueNonEmpty(ids);
      if (normalized.length === 0) return [];
      await ensureMongoIndexes();
      const organizations = await coreCol<OrganizationDoc>(ORGANIZATIONS_COLLECTION);
      const docs = await organizations.find({ _id: { $in: normalized } }).toArray();
      return docs
        .map((doc) => mapOrganizationDoc(doc))
        .filter((entry): entry is Organization => Boolean(entry));
    },

    async createOrUpdateMembershipFromReview(input) {
      await ensureMongoIndexes();
      const claims = await coreCol<OrganizationClaimDoc>(ORGANIZATION_CLAIMS_COLLECTION);
      const memberships = await coreCol<OrganizationMembershipDoc>(ORGANIZATION_MEMBERSHIPS_COLLECTION);
      const claimDoc = await claims.findOne({ _id: input.claimId });
      const claim = mapClaimDoc(claimDoc);
      if (!claim) return null;

      const nextStatus = nextStatusForDecision(input.decision);
      const nowIso = isoNow();

      if (input.decision === "reject" || input.decision === "needs_more_information") {
        return null;
      }

      const organization = await createOrFindOrganizationMongo(claim, input.reviewedBy);
      const unit =
        input.decision === "approve_unit" || input.decision === "approve_publication"
          ? await createOrFindUnitMongo(organization.id, claim)
          : null;
      const membershipKey = buildMembershipLookupKey({
        userId: claim.userId,
        organizationId: organization.id,
        unitId: unit?.id ?? null,
      });
      const existingDocs = await memberships
        .find({ "membership.userId": claim.userId, "membership.organizationId": organization.id })
        .toArray();
      const existing =
        existingDocs
          .map((doc) => mapMembershipDoc(doc))
          .filter((entry): entry is OrganizationMembership => Boolean(entry))
          .find(
            (membership) =>
              buildMembershipLookupKey({
                userId: membership.userId,
                organizationId: membership.organizationId,
                unitId: membership.unitId ?? null,
              }) === membershipKey,
          ) ??
        existingDocs
          .map((doc) => mapMembershipDoc(doc))
          .filter((entry): entry is OrganizationMembership => Boolean(entry))
          .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
          [0] ??
        null;

      const membership =
        input.decision === "revoke"
          ? existing
            ? parseOrganizationMembership({
                ...existing,
                verificationStatus: "revoked",
                allowedActions: [],
                updatedAt: nowIso,
                verifiedBy: input.reviewedBy,
                verifiedAt: existing.verifiedAt ?? nowIso,
                revokedAt: nowIso,
                noAutoAuthority: true,
              })
            : null
          : parseOrganizationMembership({
              id: existing?.id ?? new ObjectId().toHexString(),
              userId: claim.userId,
              organizationId: organization.id,
              organizationName: organization.name,
              organizationType: organization.type,
              regionId: claim.regionId ?? organization.primaryRegionId ?? null,
              unitId: unit?.id ?? existing?.unitId ?? null,
              unitName: unit?.name ?? claim.unitName ?? existing?.unitName ?? null,
              optionalLocation: claim.optionalLocation ?? existing?.optionalLocation ?? null,
              roleLabel: claim.roleLabel ?? existing?.roleLabel ?? "Mitglied",
              roleType: claim.selfDeclaredProfile?.roleType ?? existing?.roleType ?? "staff",
              verificationStatus: nextStatus,
              allowedActions: normalizeAllowedActions(nextStatus, input.allowedActions),
              createdAt: existing?.createdAt ?? nowIso,
              updatedAt: nowIso,
              verifiedBy: input.reviewedBy,
              verifiedAt: nowIso,
              expiresAt: existing?.expiresAt ?? null,
              revokedAt: null,
              noAutoAuthority: true,
            });

      if (!membership) return null;

      const now = new Date();
      await memberships.updateOne(
        { _id: membership.id },
        {
          $set: {
            membership: clone(membership),
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: existing ? new Date(existing.createdAt) : now,
          },
        },
        { upsert: true },
      );
      return membership;
    },

    async reviewOrganizationClaim(input) {
      await ensureMongoIndexes();
      const claims = await coreCol<OrganizationClaimDoc>(ORGANIZATION_CLAIMS_COLLECTION);
      const reviews = await coreCol<VerificationReviewDoc>(VERIFICATION_REVIEWS_COLLECTION);
      const claimDoc = await claims.findOne({ _id: input.claimId });
      const existingClaim = mapClaimDoc(claimDoc);
      if (!existingClaim) {
        throw new Error("organization_claim_not_found");
      }

      const nextStatus = nextStatusForDecision(input.decision);
      const reviewedAt = isoNow();
      const claim = parseOrganizationClaim({
        ...existingClaim,
        verificationStatus: nextStatus,
        provisioningRequest: nextProvisioningRequestFromReview({
          claim: existingClaim,
          reviewedBy: input.reviewedBy,
          decision: input.decision,
          note: input.note ?? null,
          reviewedAt,
        }),
        updatedAt: reviewedAt,
        reviewedBy: input.reviewedBy,
        reviewedAt,
        rejectionReason:
          input.decision === "reject" || input.decision === "needs_more_information"
            ? input.note ?? existingClaim.rejectionReason ?? null
            : input.decision === "revoke"
              ? input.note ?? "revoked_by_admin"
              : null,
      });
      await claims.updateOne(
        { _id: claim.id },
        {
          $set: {
            claim: clone(claim),
            updatedAt: new Date(reviewedAt),
          },
        },
      );

      const review = parseVerificationReview({
        id: new ObjectId().toHexString(),
        claimId: claim.id,
        userId: claim.userId,
        decision: input.decision,
        previousStatus: existingClaim.verificationStatus,
        nextStatus,
        allowedActions: normalizeAllowedActions(nextStatus, input.allowedActions),
        note: input.note ?? null,
        reviewedBy: input.reviewedBy,
        reviewedAt,
      });
      await reviews.insertOne({
        _id: review.id,
        review: clone(review),
        createdAt: new Date(review.reviewedAt),
      });

      const membership = await this.createOrUpdateMembershipFromReview(input);
      const auditEvents: MembershipAuditEvent[] = [];
      const claimReviewEvent = parseMembershipAuditEvent({
        id: new ObjectId().toHexString(),
        membershipId: membership?.id ?? null,
        claimId: claim.id,
        userId: claim.userId,
        organizationId: membership?.organizationId ?? claim.organizationId ?? null,
        regionId: membership?.regionId ?? claim.regionId ?? null,
        eventType: "claim_reviewed",
        verificationStatus: claim.verificationStatus,
        note: input.note ?? null,
        createdBy: input.reviewedBy,
        createdAt: reviewedAt,
      });
      auditEvents.push(claimReviewEvent);
      await appendAuditEventMongo(claimReviewEvent);

      if (membership) {
        const membershipEvent = parseMembershipAuditEvent({
          id: new ObjectId().toHexString(),
          membershipId: membership.id,
          claimId: claim.id,
          userId: membership.userId,
          organizationId: membership.organizationId,
          regionId: membership.regionId ?? null,
          eventType:
            input.decision === "revoke"
              ? "membership_revoked"
              : membership.createdAt === membership.updatedAt
                ? "membership_created"
                : "membership_updated",
          verificationStatus: membership.verificationStatus,
          note: input.note ?? null,
          createdBy: input.reviewedBy,
          createdAt: reviewedAt,
        });
        auditEvents.push(membershipEvent);
        await appendAuditEventMongo(membershipEvent);
      }

      return { claim, membership, review, auditEvents };
    },

    async revokeMembership(membershipId, reviewedBy, note) {
      await ensureMongoIndexes();
      const memberships = await coreCol<OrganizationMembershipDoc>(ORGANIZATION_MEMBERSHIPS_COLLECTION);
      const existingDoc = await memberships.findOne({ _id: membershipId });
      const existing = mapMembershipDoc(existingDoc);
      if (!existing) return null;
      const updatedAt = isoNow();
      const membership = parseOrganizationMembership({
        ...existing,
        verificationStatus: "revoked",
        allowedActions: [],
        updatedAt,
        verifiedBy: reviewedBy,
        revokedAt: updatedAt,
        noAutoAuthority: true,
      });
      await memberships.updateOne(
        { _id: membership.id },
        {
          $set: {
            membership: clone(membership),
            updatedAt: new Date(updatedAt),
          },
        },
      );
      await appendAuditEventMongo(
        parseMembershipAuditEvent({
          id: new ObjectId().toHexString(),
          membershipId: membership.id,
          claimId: null,
          userId: membership.userId,
          organizationId: membership.organizationId,
          regionId: membership.regionId ?? null,
          eventType: "membership_revoked",
          verificationStatus: "revoked",
          note: note ?? null,
          createdBy: reviewedBy,
          createdAt: updatedAt,
        }),
      );
      return membership;
    },
  };
}

export function createInMemoryRegionOrganizationRuntimeRepo(seed?: {
  organizations?: Organization[];
  units?: OrganizationUnit[];
  claims?: OrganizationClaim[];
  memberships?: OrganizationMembership[];
}) {
  const organizations = new Map<string, Organization>();
  const units = new Map<string, OrganizationUnit>();
  const claims = new Map<string, OrganizationClaim>();
  const memberships = new Map<string, OrganizationMembership>();
  const reviews = new Map<string, VerificationReview>();
  const auditEvents = new Map<string, MembershipAuditEvent>();

  for (const organization of seed?.organizations ?? []) organizations.set(organization.id, clone(organization));
  for (const unit of seed?.units ?? []) units.set(unit.id, clone(unit));
  for (const claim of seed?.claims ?? []) claims.set(claim.id, clone(claim));
  for (const membership of seed?.memberships ?? []) memberships.set(membership.id, clone(membership));

  const repo: RegionOrganizationRuntimeRepo = {
    async createOrganizationClaim(input) {
      const createdAt = isoNow();
      const claim = parseOrganizationClaim({
        id: new ObjectId().toHexString(),
        userId: input.userId,
        organizationId: null,
        organizationName: input.organizationName,
        organizationType: input.organizationType,
        regionId: input.regionId ?? null,
        countryCode: input.countryCode ?? null,
        unitName: input.unitName ?? null,
        roleLabel: input.roleLabel ?? null,
        optionalLocation: input.optionalLocation ?? null,
        evidence: {
          emailDomain: input.evidence?.emailDomain ?? null,
          website: input.evidence?.website ?? null,
          note: input.evidence?.note ?? null,
        },
        verificationStatus: input.verificationStatus ?? "pending_review",
        provisioningRequest: input.provisioningRequest ?? null,
        selfDeclaredProfile: input.selfDeclaredProfile ?? null,
        createdAt,
        updatedAt: createdAt,
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
        source: input.source ?? "self_declared",
        noAutoAuthority: true,
      });
      claims.set(claim.id, clone(claim));
      const event = parseMembershipAuditEvent({
        id: new ObjectId().toHexString(),
        membershipId: null,
        claimId: claim.id,
        userId: claim.userId,
        organizationId: null,
        regionId: claim.regionId ?? null,
        eventType: "claim_created",
        verificationStatus: claim.verificationStatus,
        note: claim.evidence.note ?? null,
        createdBy: claim.userId,
        createdAt,
      });
      auditEvents.set(event.id, clone(event));
      return claim;
    },

    async listOrganizationClaimsForUser(userId) {
      return Array.from(claims.values())
        .map((claim) => clone(claim))
        .filter((claim) => claim.userId === userId)
        .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
    },

    async listOrganizationClaimsForReview() {
      return Array.from(claims.values())
        .map((claim) => clone(claim))
        .filter((claim) =>
          ["pending_review", "email_verified", "organization_verified", "unit_verified"].includes(
            claim.verificationStatus,
          ),
        )
        .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
    },

    async getOrganizationClaimById(id) {
      const claim = claims.get(id);
      return claim ? clone(claim) : null;
    },

    async listMembershipsForUser(userId) {
      return Array.from(memberships.values())
        .map((membership) => clone(membership))
        .filter((membership) => membership.userId === userId)
        .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
    },

    async getVerifiedMembershipsForUser(userId) {
      const now = Date.now();
      return (await this.listMembershipsForUser(userId)).filter((membership) => {
        if (
          membership.verificationStatus !== "organization_verified" &&
          membership.verificationStatus !== "unit_verified" &&
          membership.verificationStatus !== "publication_approved"
        ) {
          return false;
        }
        if (membership.revokedAt) return false;
        if (membership.expiresAt && Date.parse(membership.expiresAt) <= now) return false;
        return true;
      });
    },

    async listOrganizationsByIds(ids) {
      return uniqueNonEmpty(ids)
        .map((id) => organizations.get(id))
        .filter((organization): organization is Organization => Boolean(organization))
        .map((organization) => clone(organization));
    },

    async createOrUpdateMembershipFromReview(input) {
      const claim = claims.get(input.claimId);
      if (!claim) return null;
      const nextStatus = nextStatusForDecision(input.decision);
      if (input.decision === "reject" || input.decision === "needs_more_information") {
        return null;
      }
      const orgLookupKey = buildOrganizationLookupKey({
        organizationName: claim.organizationName,
        organizationType: claim.organizationType,
        regionId: claim.regionId,
        countryCode: claim.countryCode,
      });
      let organization =
        Array.from(organizations.values()).find(
          (item) =>
            buildOrganizationLookupKey({
              organizationName: item.name,
              organizationType: item.type,
              regionId: item.primaryRegionId ?? null,
              countryCode: item.countryCode ?? null,
            }) === orgLookupKey,
        ) ?? null;
      if (!organization) {
        organization = parseOrganization({
          id: new ObjectId().toHexString(),
          name: claim.organizationName,
          type: claim.organizationType,
          countryCode: claim.countryCode ?? null,
          primaryRegionId: claim.regionId ?? null,
          website: claim.evidence.website ?? null,
          verificationStatus: "organization_verified",
          createdByUserId: input.reviewedBy,
        });
        organizations.set(organization.id, clone(organization));
      }
      let unit: OrganizationUnit | null = null;
      if ((input.decision === "approve_unit" || input.decision === "approve_publication") && claim.unitName) {
        const unitLookupKey = buildUnitLookupKey({ organizationId: organization.id, unitName: claim.unitName });
        unit =
          Array.from(units.values()).find(
            (item) => buildUnitLookupKey({ organizationId: item.organizationId, unitName: item.name }) === unitLookupKey,
          ) ?? null;
        if (!unit) {
          unit = parseOrganizationUnit({
            id: new ObjectId().toHexString(),
            organizationId: organization.id,
            name: claim.unitName,
            type: "unit",
            parentUnitId: null,
            jurisdictionTags: uniqueNonEmpty([claim.regionId, claim.unitName]),
            verificationStatus: "unit_verified",
          });
          units.set(unit.id, clone(unit));
        }
      }
      const existing =
        Array.from(memberships.values()).find(
          (item) =>
            buildMembershipLookupKey({
              userId: item.userId,
              organizationId: item.organizationId,
              unitId: item.unitId ?? null,
            }) ===
            buildMembershipLookupKey({
              userId: claim.userId,
              organizationId: organization.id,
              unitId: unit?.id ?? null,
            }),
        ) ??
        Array.from(memberships.values())
          .filter((item) => item.userId === claim.userId && item.organizationId === organization.id)
          .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))[0] ??
        null;
      const now = isoNow();
      const membership =
        input.decision === "revoke"
          ? existing
            ? parseOrganizationMembership({
                ...existing,
                verificationStatus: "revoked",
                allowedActions: [],
                updatedAt: now,
                verifiedBy: input.reviewedBy,
                verifiedAt: existing.verifiedAt ?? now,
                revokedAt: now,
                noAutoAuthority: true,
              })
            : null
          : parseOrganizationMembership({
              id: existing?.id ?? new ObjectId().toHexString(),
              userId: claim.userId,
              organizationId: organization.id,
              organizationName: organization.name,
              organizationType: organization.type,
              regionId: claim.regionId ?? organization.primaryRegionId ?? null,
              unitId: unit?.id ?? existing?.unitId ?? null,
              unitName: unit?.name ?? claim.unitName ?? existing?.unitName ?? null,
              optionalLocation: claim.optionalLocation ?? existing?.optionalLocation ?? null,
              roleLabel: claim.roleLabel ?? existing?.roleLabel ?? "Mitglied",
              roleType: claim.selfDeclaredProfile?.roleType ?? existing?.roleType ?? "staff",
              verificationStatus: nextStatus,
              allowedActions: normalizeAllowedActions(nextStatus, input.allowedActions),
              createdAt: existing?.createdAt ?? now,
              updatedAt: now,
              verifiedBy: input.reviewedBy,
              verifiedAt: now,
              expiresAt: existing?.expiresAt ?? null,
              revokedAt: null,
              noAutoAuthority: true,
            });
      if (!membership) return null;
      memberships.set(membership.id, clone(membership));
      return membership;
    },

    async reviewOrganizationClaim(input) {
      const existingClaim = claims.get(input.claimId);
      if (!existingClaim) throw new Error("organization_claim_not_found");
      const nextStatus = nextStatusForDecision(input.decision);
      const reviewedAt = isoNow();
      const claim = parseOrganizationClaim({
        ...existingClaim,
        verificationStatus: nextStatus,
        provisioningRequest: nextProvisioningRequestFromReview({
          claim: existingClaim,
          reviewedBy: input.reviewedBy,
          decision: input.decision,
          note: input.note ?? null,
          reviewedAt,
        }),
        updatedAt: reviewedAt,
        reviewedBy: input.reviewedBy,
        reviewedAt,
        rejectionReason:
          input.decision === "reject" || input.decision === "needs_more_information"
            ? input.note ?? existingClaim.rejectionReason ?? null
            : input.decision === "revoke"
              ? input.note ?? "revoked_by_admin"
              : null,
      });
      claims.set(claim.id, clone(claim));
      const review = parseVerificationReview({
        id: new ObjectId().toHexString(),
        claimId: claim.id,
        userId: claim.userId,
        decision: input.decision,
        previousStatus: existingClaim.verificationStatus,
        nextStatus,
        allowedActions: normalizeAllowedActions(nextStatus, input.allowedActions),
        note: input.note ?? null,
        reviewedBy: input.reviewedBy,
        reviewedAt,
      });
      reviews.set(review.id, clone(review));
      const membership = await repo.createOrUpdateMembershipFromReview(input);
      const claimReviewEvent = parseMembershipAuditEvent({
        id: new ObjectId().toHexString(),
        membershipId: membership?.id ?? null,
        claimId: claim.id,
        userId: claim.userId,
        organizationId: membership?.organizationId ?? claim.organizationId ?? null,
        regionId: membership?.regionId ?? claim.regionId ?? null,
        eventType: "claim_reviewed",
        verificationStatus: claim.verificationStatus,
        note: input.note ?? null,
        createdBy: input.reviewedBy,
        createdAt: reviewedAt,
      });
      auditEvents.set(claimReviewEvent.id, clone(claimReviewEvent));
      const events = [claimReviewEvent];
      if (membership) {
        const membershipEvent = parseMembershipAuditEvent({
          id: new ObjectId().toHexString(),
          membershipId: membership.id,
          claimId: claim.id,
          userId: membership.userId,
          organizationId: membership.organizationId,
          regionId: membership.regionId ?? null,
          eventType:
            input.decision === "revoke"
              ? "membership_revoked"
              : membership.createdAt === membership.updatedAt
                ? "membership_created"
                : "membership_updated",
          verificationStatus: membership.verificationStatus,
          note: input.note ?? null,
          createdBy: input.reviewedBy,
          createdAt: reviewedAt,
        });
        auditEvents.set(membershipEvent.id, clone(membershipEvent));
        events.push(membershipEvent);
      }
      return { claim, membership, review, auditEvents: events };
    },

    async revokeMembership(membershipId, reviewedBy, note) {
      const existing = memberships.get(membershipId);
      if (!existing) return null;
      const updatedAt = isoNow();
      const membership = parseOrganizationMembership({
        ...existing,
        verificationStatus: "revoked",
        allowedActions: [],
        updatedAt,
        verifiedBy: reviewedBy,
        revokedAt: updatedAt,
        noAutoAuthority: true,
      });
      memberships.set(membership.id, clone(membership));
      const event = parseMembershipAuditEvent({
        id: new ObjectId().toHexString(),
        membershipId: membership.id,
        claimId: null,
        userId: membership.userId,
        organizationId: membership.organizationId,
        regionId: membership.regionId ?? null,
        eventType: "membership_revoked",
        verificationStatus: "revoked",
        note: note ?? null,
        createdBy: reviewedBy,
        createdAt: updatedAt,
      });
      auditEvents.set(event.id, clone(event));
      return membership;
    },
  };

  return repo;
}

export function getRegionOrganizationRuntimeRepo(): RegionOrganizationRuntimeRepo {
  if (shouldUseInMemoryMongoFallback()) {
    if (!repoSingleton) repoSingleton = createInMemoryRegionOrganizationRuntimeRepo();
    return repoSingleton;
  }
  if (!repoSingleton) {
    repoSingleton = createMongoRegionOrganizationRuntimeRepo();
  }
  return repoSingleton;
}

export function setRegionOrganizationRuntimeRepoForTests(repo: RegionOrganizationRuntimeRepo | null) {
  repoSingleton = repo;
}

export async function buildPersistedRegionAccessContext(input: {
  userId: string;
  actorRole: string;
  isAdmin: boolean;
  roles: string[];
  organizationIds?: string[] | null;
  regionId?: string | null;
}): Promise<RegionAccessContext> {
  if (input.isAdmin) {
    return buildRegionAccessContext({
      userId: input.userId,
      actorRole: input.actorRole,
      isAdmin: true,
      roles: input.roles,
      organizationIds: input.organizationIds,
    });
  }

  const repo = getRegionOrganizationRuntimeRepo();
  const memberships = await repo.listMembershipsForUser(input.userId);
  const organizations = await repo.listOrganizationsByIds(memberships.map((membership) => membership.organizationId));
  const normalizedRegionId = String(input.regionId ?? "").trim();
  const entitlementRepo = getRegionEntitlementRuntimeRepo();
  const dashboardEntitlementCheck = normalizedRegionId
    ? await entitlementRepo.checkRegionDashboardEntitlement({
        memberships,
        organizations,
        regionId: normalizedRegionId,
      })
    : null;
  const dossierDraftEntitlementCheck = normalizedRegionId
    ? await entitlementRepo.checkSignalDraftEntitlement({
        memberships,
        organizations,
        regionId: normalizedRegionId,
        draftTarget: "dossier",
      })
    : null;
  const anlassraumDraftEntitlementCheck = normalizedRegionId
    ? await entitlementRepo.checkSignalDraftEntitlement({
        memberships,
        organizations,
        regionId: normalizedRegionId,
        draftTarget: "anlassraum",
      })
    : null;
  return buildRegionAccessContext({
    userId: input.userId,
    actorRole: input.actorRole,
    isAdmin: false,
    roles: input.roles,
    organizationIds: input.organizationIds,
    memberships,
    organizations,
    dashboardEntitlementCheck,
    dossierDraftEntitlementCheck,
    anlassraumDraftEntitlementCheck,
  });
}
