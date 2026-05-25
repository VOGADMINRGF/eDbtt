import "server-only";
import { ObjectId, coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import type {
  OrganizationAccessProvisioningDecision,
  OrganizationBillingSource,
  OrganizationBillingStatus,
  OrganizationContractAuditEvent,
  OrganizationContractOrderRecord,
  OrganizationContractStatus,
  OrganizationPlanAssignment,
  PartnerFundingDisclosure,
  PartnerFundingDisclosureRole,
  PartnerPackageAuditEvent,
  PartnerPackageScope,
  PartnerPackageStatus,
  PartnerPackageType,
  PartnerProjectPackage,
  PartnerReportingState,
  PreorderLeadRecord,
  PreorderUserUpdate,
  PricingOrderStatus,
  UserContact,
} from "../domain/types";
import { canTransitionPricingOrderStatus } from "../domain/orderFlow";
import {
  contractAuditEventTypeForChange,
  defaultPlanAssignmentForOrder,
  deriveProvisioningDecisionFromContract,
  mapPricingOrderStatusToBillingStatus,
  mapPricingOrderStatusToContractStatus,
} from "../domain/organizationContract";
import { partnerPackageAuditEventTypeForStatus } from "../domain/partnerProjectPackage";

function toObjectId(value: string | null) {
  if (!value) return null;
  if (!ObjectId.isValid(value)) return null;
  return new ObjectId(value);
}

export async function insertPreorderLead(lead: PreorderLeadRecord) {
  const Leads = await coreCol("edebatte_preorders");
  const result = await Leads.insertOne({
    orderId: lead.orderId,
    package: lead.packageId,
    segment: lead.segment,
    planLabel: lead.planLabel,
    type: lead.type,
    email: lead.email,
    customerName: lead.customerName,
    phone: lead.phone,
    organizationName: lead.organizationName,
    organizationType: lead.organizationType,
    municipalityName: lead.municipalityName,
    contactRole: lead.contactRole,
    plz: lead.plz,
    note: lead.note,
    membershipRequested: lead.membershipRequested,
    selectedAddOns: lead.selectedAddOns,
    selectedOptions: lead.selectedOptions,
    conversationRequested: lead.conversationRequested,
    conversationChannel: lead.conversationChannel,
    publicPriceSummary: lead.publicPriceSummary,
    source: lead.source,
    priceMonthly: lead.priceMonthly,
    status: lead.status,
    requiresReview: lead.requiresReview,
    reviewedAt: lead.reviewedAt,
    activatedAt: lead.activatedAt,
    internal: lead.internal,
    userId: toObjectId(lead.userId),
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  });
  return lead.orderId || String(result.insertedId);
}

export async function findPreorderUserById(userId: string): Promise<UserContact | null> {
  const oid = toObjectId(userId);
  if (!oid) return null;
  const Users = await coreCol("users");
  const user = await Users.findOne(
    { _id: oid },
    { projection: { email: 1, name: 1, displayName: 1, firstName: 1, lastName: 1 } },
  );
  return (user as UserContact) || null;
}

export async function updatePreorderUser(userId: string, update: PreorderUserUpdate) {
  const oid = toObjectId(userId);
  if (!oid) return;
  const Users = await coreCol("users");
  await Users.updateOne(
    { _id: oid },
    {
      $set: {
        "edebatte.package": update.packageId,
        "edebatte.status": update.status,
        "edebatte.updatedAt": update.updatedAt,
        "edebatte.preorderAt": update.preorderAt,
        "edebatte.source": update.source,
      },
    },
  );
}

export type PricingOrderAdminListItem = {
  id: string;
  orderId: string;
  packageId: string;
  planLabel: string;
  segment: string | null;
  status: PricingOrderStatus;
  email: string | null;
  customerName: string | null;
  organizationName: string | null;
  municipalityName: string | null;
  publicPriceSummary: {
    packagePriceLabel?: string | null;
    addOnSelections?: string[];
    notes?: string[];
  } | null;
  selectedAddOns: string[];
  requiresReview: boolean;
  internal: {
    notes: string[];
    reviewedBy: string | null;
    reviewedAt: string | null;
    adjustedPriceLabel: string | null;
    discountKind: "pilot" | "yearly" | "partner" | "reference" | "manual_special" | null;
    discountReason: string | null;
    discountAmount: number | null;
    approvalReason: string | null;
    rejectionReason: string | null;
    activationNotes: string | null;
    billingFinanceNote: string | null;
    contractReference: string | null;
    invoiceReference: string | null;
    organizationId: string | null;
    contractStatus: OrganizationContractStatus | null;
    billingStatus: OrganizationBillingStatus | null;
    billingSource: OrganizationBillingSource | null;
    planAssignment: OrganizationPlanAssignment | null;
    accessProvisioningDecision: OrganizationAccessProvisioningDecision | null;
    contractAuditEvents: OrganizationContractAuditEvent[];
    partnerProjectPackage: PartnerProjectPackage | null;
    partnerFundingDisclosure: PartnerFundingDisclosure | null;
    partnerReportingState: PartnerReportingState | null;
    partnerPackageAuditEvents: PartnerPackageAuditEvent[];
  };
  source: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type AdminUpdateInput = {
  status: PricingOrderStatus;
  actorUserId: string;
  note?: string | null;
  adjustedPriceLabel?: string | null;
  discountKind?: "pilot" | "yearly" | "partner" | "reference" | "manual_special" | null;
  discountReason?: string | null;
  discountAmount?: number | null;
  approvalReason?: string | null;
  rejectionReason?: string | null;
  activationNotes?: string | null;
  billingFinanceNote?: string | null;
  contractReference?: string | null;
  invoiceReference?: string | null;
  organizationId?: string | null;
  contractStatus?: OrganizationContractStatus | null;
  billingStatus?: OrganizationBillingStatus | null;
  billingSource?: OrganizationBillingSource | null;
  planAssignment?: OrganizationPlanAssignment | null;
  accessProvisioningDecision?: OrganizationAccessProvisioningDecision | null;
  partnerProjectPackage?: PartnerProjectPackage | null;
  partnerFundingDisclosure?: PartnerFundingDisclosure | null;
  partnerReportingState?: PartnerReportingState | null;
};

let pricingOrdersForTests: PricingOrderAdminListItem[] | null = null;

function normalizeDate(value: unknown) {
  return value instanceof Date ? value.toISOString() : null;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeText(value: unknown): string | null {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry: unknown): entry is string => typeof entry === "string")
    : [];
}

function normalizeContractStatus(value: unknown): OrganizationContractStatus | null {
  switch (value) {
    case "none":
    case "draft":
    case "offered":
    case "accepted":
    case "active":
    case "limited":
    case "suspended":
    case "cancelled":
    case "expired":
      return value;
    default:
      return null;
  }
}

function normalizeBillingStatus(value: unknown): OrganizationBillingStatus | null {
  switch (value) {
    case "none":
    case "billing_pending":
    case "operator_verified_contract":
    case "active":
    case "overdue":
    case "grace_period":
    case "suspended":
    case "cancelled":
    case "expired":
      return value;
    default:
      return null;
  }
}

function normalizeBillingSource(value: unknown): OrganizationBillingSource | null {
  switch (value) {
    case "operator_verified_contract":
    case "manual_invoice":
    case "external_checkout_pending":
    case "external_checkout_integrated":
    case "fixture_demo":
      return value;
    default:
      return null;
  }
}

function normalizePartnerPackageType(value: unknown): PartnerPackageType | null {
  switch (value) {
    case "municipality_pilot":
    case "association_workspace":
    case "media_dossier_series":
    case "newsroom_qr_dossier":
    case "foundation_program":
    case "participation_office":
    case "agency_workspace":
    case "public_dialog_project":
      return value;
    default:
      return null;
  }
}

function normalizePartnerPackageStatus(value: unknown): PartnerPackageStatus | null {
  switch (value) {
    case "draft":
    case "offered":
    case "active":
    case "limited":
    case "reporting_required":
    case "paused":
    case "completed":
    case "cancelled":
    case "archived":
      return value;
    default:
      return null;
  }
}

function normalizePartnerPackageScopes(value: unknown): PartnerPackageScope[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is PartnerPackageScope => {
    return (
      entry === "dossier_studio" ||
      entry === "social_distribution" ||
      entry === "source_connections" ||
      entry === "runden_qr" ||
      entry === "reporting_export"
    );
  });
}

function normalizePartnerReportingState(value: unknown): PartnerReportingState | null {
  switch (value) {
    case "draft":
    case "review_required":
    case "approved":
    case "archived":
      return value;
    default:
      return null;
  }
}

function normalizePartnerFundingDisclosureRole(
  value: unknown,
): PartnerFundingDisclosureRole | null {
  switch (value) {
    case "auftraggeber":
    case "partner":
    case "foerderer":
    case "traeger":
      return value;
    default:
      return null;
  }
}

function normalizePartnerFundingDisclosure(value: unknown): PartnerFundingDisclosure | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const partnerName = normalizeText(source.partnerName);
  const role = normalizePartnerFundingDisclosureRole(source.role);
  const label = normalizeText(source.label);
  if (!partnerName || !role || !label) return null;
  return {
    partnerName,
    role,
    label,
    transparencyNote: normalizeText(source.transparencyNote),
    sourceReference: normalizeText(source.sourceReference),
    shownToUsers: source.shownToUsers !== false,
    shownToAdmins: source.shownToAdmins !== false,
    noSourceWeightInfluence: true,
    noVoteOutcomeInfluence: true,
    noFactcheckSealInfluence: true,
    noAutoOfficial: true,
    noAutoPublicationApproved: true,
  };
}

function normalizePlanAssignment(value: unknown, fallback: { packageId: string; planLabel: string }): OrganizationPlanAssignment | null {
  if (!value || typeof value !== "object") {
    return defaultPlanAssignmentForOrder(fallback);
  }
  const source = value as Record<string, unknown>;
  const planId = normalizeText(source.planId) ?? fallback.packageId;
  const planLabel = normalizeText(source.planLabel) ?? fallback.planLabel;
  const scopes = normalizeStringArray(source.scopes);
  return {
    planId,
    planLabel,
    scopes: scopes.length > 0 ? scopes : defaultPlanAssignmentForOrder(fallback).scopes,
  };
}

function normalizePartnerProjectPackage(value: unknown): PartnerProjectPackage | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const id = normalizeText(source.id);
  const type = normalizePartnerPackageType(source.type);
  const status = normalizePartnerPackageStatus(source.status);
  const scopes = normalizePartnerPackageScopes(source.scopes);
  if (!id || !type || !status) return null;
  return {
    id,
    type,
    status,
    organizationId: normalizeText(source.organizationId),
    organizationName: normalizeText(source.organizationName),
    scopes,
    contractLinked: source.contractLinked !== false,
    billingLinked: source.billingLinked !== false,
    reviewOnlyOutputs: true,
    noOperatorRights: true,
    noAutoOfficial: true,
    noAutoPublicationApproved: true,
    createdAt: normalizeText(source.createdAt) ?? new Date().toISOString(),
    updatedAt: normalizeText(source.updatedAt) ?? new Date().toISOString(),
  };
}

function normalizeContractAuditEvents(value: unknown): OrganizationContractAuditEvent[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const source = entry as Record<string, unknown>;
      const eventType = normalizeText(source.eventType);
      if (
        eventType !== "offer" &&
        eventType !== "accept" &&
        eventType !== "activate" &&
        eventType !== "limit" &&
        eventType !== "grace" &&
        eventType !== "suspend" &&
        eventType !== "cancel" &&
        eventType !== "expire" &&
        eventType !== "reactivate"
      ) {
        return null;
      }
      return {
        id: normalizeText(source.id) ?? new ObjectId().toHexString(),
        eventType,
        organizationId: normalizeText(source.organizationId),
        orderId: normalizeText(source.orderId) ?? "",
        previousContractStatus: normalizeContractStatus(source.previousContractStatus),
        nextContractStatus: normalizeContractStatus(source.nextContractStatus),
        previousBillingStatus: normalizeBillingStatus(source.previousBillingStatus),
        nextBillingStatus: normalizeBillingStatus(source.nextBillingStatus),
        source: normalizeBillingSource(source.source) ?? "operator_verified_contract",
        planAssignment:
          source.planAssignment && typeof source.planAssignment === "object"
            ? normalizePlanAssignment(source.planAssignment, { packageId: "", planLabel: "" })
            : null,
        note: normalizeText(source.note),
        createdAt: normalizeText(source.createdAt) ?? new Date().toISOString(),
        createdBy: normalizeText(source.createdBy) ?? "system",
      } satisfies OrganizationContractAuditEvent;
    })
    .filter((entry): entry is OrganizationContractAuditEvent => Boolean(entry));
}

function normalizePartnerPackageAuditEvents(value: unknown): PartnerPackageAuditEvent[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const source = entry as Record<string, unknown>;
      const eventType = normalizeText(source.eventType);
      if (
        eventType !== "create_draft" &&
        eventType !== "offer" &&
        eventType !== "activate" &&
        eventType !== "limit" &&
        eventType !== "reporting_required" &&
        eventType !== "pause" &&
        eventType !== "complete" &&
        eventType !== "cancel" &&
        eventType !== "archive" &&
        eventType !== "update"
      ) {
        return null;
      }
      return {
        id: normalizeText(source.id) ?? new ObjectId().toHexString(),
        eventType,
        packageId: normalizeText(source.packageId) ?? "",
        organizationId: normalizeText(source.organizationId),
        previousStatus: normalizePartnerPackageStatus(source.previousStatus),
        nextStatus: normalizePartnerPackageStatus(source.nextStatus),
        source: normalizeBillingSource(source.source) ?? "operator_verified_contract",
        changedScopes: normalizePartnerPackageScopes(source.changedScopes),
        note: normalizeText(source.note),
        createdAt: normalizeText(source.createdAt) ?? new Date().toISOString(),
        createdBy: normalizeText(source.createdBy) ?? "system",
      } satisfies PartnerPackageAuditEvent;
    })
    .filter((entry): entry is PartnerPackageAuditEvent => Boolean(entry));
}

function normalizeStatus(value: unknown): PricingOrderStatus {
  switch (value) {
    case "package_selected":
    case "account_required":
    case "registry_incomplete":
    case "identity_complete":
    case "bank_verification_pending":
    case "bank_verified":
    case "totp_required":
    case "human_review_required":
    case "order_submitted":
    case "submitted":
    case "under_review":
    case "approved":
    case "adjusted":
    case "rejected":
    case "active":
    case "paused":
    case "cancelled":
      return value;
    case "vormerkung":
      return "submitted";
    default:
      return "submitted";
  }
}

function deriveContractFieldsFromOrder(params: {
  packageId: string;
  planLabel: string;
  source: string | null;
  internalDoc: Record<string, unknown>;
  status: PricingOrderStatus;
}): PricingOrderAdminListItem["internal"] {
  const fallbackContractStatus = mapPricingOrderStatusToContractStatus(params.status);
  const fallbackBillingStatus = mapPricingOrderStatusToBillingStatus(params.status);
  const fallbackBillingSource =
    params.source === "fixture"
      ? "fixture_demo"
      : normalizeText(params.internalDoc.invoiceReference) || normalizeText(params.internalDoc.billingFinanceNote)
        ? "manual_invoice"
        : "operator_verified_contract";
  const contractStatus = normalizeContractStatus(params.internalDoc.contractStatus) ?? fallbackContractStatus;
  const billingStatus = normalizeBillingStatus(params.internalDoc.billingStatus) ?? fallbackBillingStatus;
  const billingSource = normalizeBillingSource(params.internalDoc.billingSource) ?? fallbackBillingSource;
  const planAssignment = normalizePlanAssignment(params.internalDoc.planAssignment, {
    packageId: params.packageId,
    planLabel: params.planLabel,
  });
  const accessProvisioningDecision =
    ((): OrganizationAccessProvisioningDecision | null => {
      const normalized = normalizeText(params.internalDoc.accessProvisioningDecision);
      switch (normalized) {
        case "offer":
        case "accept":
        case "activate":
        case "limit":
        case "grace":
        case "suspend":
        case "cancel":
        case "expire":
        case "reactivate":
        case "none":
          return normalized;
        default:
          return deriveProvisioningDecisionFromContract({
            contractStatus,
            billingStatus,
          });
      }
    })();

  return {
    notes: normalizeStringArray(params.internalDoc.notes),
    reviewedBy: normalizeText(params.internalDoc.reviewedBy),
    reviewedAt: normalizeDate(params.internalDoc.reviewedAt),
    adjustedPriceLabel: normalizeText(params.internalDoc.adjustedPriceLabel),
    discountKind:
      params.internalDoc.discountKind === "pilot" ||
      params.internalDoc.discountKind === "yearly" ||
      params.internalDoc.discountKind === "partner" ||
      params.internalDoc.discountKind === "reference" ||
      params.internalDoc.discountKind === "manual_special"
        ? params.internalDoc.discountKind
        : null,
    discountReason: normalizeText(params.internalDoc.discountReason),
    discountAmount:
      typeof params.internalDoc.discountAmount === "number"
        ? params.internalDoc.discountAmount
        : null,
    approvalReason: normalizeText(params.internalDoc.approvalReason),
    rejectionReason: normalizeText(params.internalDoc.rejectionReason),
    activationNotes: normalizeText(params.internalDoc.activationNotes),
    billingFinanceNote: normalizeText(params.internalDoc.billingFinanceNote),
    contractReference: normalizeText(params.internalDoc.contractReference),
    invoiceReference: normalizeText(params.internalDoc.invoiceReference),
    organizationId: normalizeText(params.internalDoc.organizationId),
    contractStatus,
    billingStatus,
    billingSource,
    planAssignment,
    accessProvisioningDecision,
    contractAuditEvents: normalizeContractAuditEvents(params.internalDoc.contractAuditEvents),
    partnerProjectPackage: normalizePartnerProjectPackage(params.internalDoc.partnerProjectPackage),
    partnerFundingDisclosure: normalizePartnerFundingDisclosure(params.internalDoc.partnerFundingDisclosure),
    partnerReportingState: normalizePartnerReportingState(params.internalDoc.partnerReportingState),
    partnerPackageAuditEvents: normalizePartnerPackageAuditEvents(params.internalDoc.partnerPackageAuditEvents),
  };
}

function mapDocToPricingOrderAdminListItem(doc: any): PricingOrderAdminListItem {
  const packageId = typeof doc.package === "string" ? doc.package : "";
  const planLabel = typeof doc.planLabel === "string" ? doc.planLabel : "";
  const status = normalizeStatus(doc.status);
  const internalDoc = doc.internal && typeof doc.internal === "object" ? doc.internal : {};
  return {
    id: String(doc._id),
    orderId: typeof doc.orderId === "string" && doc.orderId ? doc.orderId : String(doc._id),
    packageId,
    planLabel,
    segment: typeof doc.segment === "string" ? doc.segment : null,
    status,
    email: typeof doc.email === "string" ? doc.email : null,
    customerName: typeof doc.customerName === "string" ? doc.customerName : null,
    organizationName: typeof doc.organizationName === "string" ? doc.organizationName : null,
    municipalityName: typeof doc.municipalityName === "string" ? doc.municipalityName : null,
    publicPriceSummary: doc.publicPriceSummary && typeof doc.publicPriceSummary === "object"
      ? {
          packagePriceLabel:
            typeof doc.publicPriceSummary.packagePriceLabel === "string"
              ? doc.publicPriceSummary.packagePriceLabel
              : null,
          addOnSelections: normalizeStringArray(doc.publicPriceSummary.addOnSelections),
          notes: normalizeStringArray(doc.publicPriceSummary.notes),
        }
      : null,
    selectedAddOns: normalizeStringArray(doc.selectedAddOns),
    requiresReview: Boolean(doc.requiresReview),
    internal: deriveContractFieldsFromOrder({
      packageId,
      planLabel,
      source: typeof doc.source === "string" ? doc.source : null,
      internalDoc,
      status,
    }),
    source: typeof doc.source === "string" ? doc.source : null,
    createdAt: normalizeDate(doc.createdAt),
    updatedAt: normalizeDate(doc.updatedAt),
  };
}

function buildContractAuditEvent(params: {
  orderId: string;
  actorUserId: string;
  organizationId: string | null;
  previousContractStatus: OrganizationContractStatus | null;
  nextContractStatus: OrganizationContractStatus | null;
  previousBillingStatus: OrganizationBillingStatus | null;
  nextBillingStatus: OrganizationBillingStatus | null;
  source: OrganizationBillingSource;
  planAssignment: OrganizationPlanAssignment | null;
  note: string | null;
}): OrganizationContractAuditEvent | null {
  const eventType = contractAuditEventTypeForChange({
    previousContractStatus: params.previousContractStatus,
    nextContractStatus: params.nextContractStatus,
    previousBillingStatus: params.previousBillingStatus,
    nextBillingStatus: params.nextBillingStatus,
  });
  if (!eventType) return null;
  return {
    id: new ObjectId().toHexString(),
    eventType,
    organizationId: params.organizationId,
    orderId: params.orderId,
    previousContractStatus: params.previousContractStatus,
    nextContractStatus: params.nextContractStatus,
    previousBillingStatus: params.previousBillingStatus,
    nextBillingStatus: params.nextBillingStatus,
    source: params.source,
    planAssignment: params.planAssignment,
    note: params.note,
    createdAt: new Date().toISOString(),
    createdBy: params.actorUserId,
  };
}

function buildPartnerPackageAuditEvent(params: {
  actorUserId: string;
  organizationId: string | null;
  source: OrganizationBillingSource;
  previousPackage: PartnerProjectPackage | null;
  nextPackage: PartnerProjectPackage | null;
  note: string | null;
}): PartnerPackageAuditEvent | null {
  if (!params.previousPackage && !params.nextPackage) return null;
  const previousStatus = params.previousPackage?.status ?? null;
  const nextStatus = params.nextPackage?.status ?? null;
  const packageId = params.nextPackage?.id ?? params.previousPackage?.id ?? "";
  if (!packageId) return null;

  const previousScopes = params.previousPackage?.scopes ?? [];
  const nextScopes = params.nextPackage?.scopes ?? [];
  const changed =
    previousStatus !== nextStatus ||
    JSON.stringify(previousScopes) !== JSON.stringify(nextScopes) ||
    JSON.stringify(params.previousPackage) !== JSON.stringify(params.nextPackage);
  if (!changed) return null;

  return {
    id: new ObjectId().toHexString(),
    eventType: partnerPackageAuditEventTypeForStatus(previousStatus, nextStatus),
    packageId,
    organizationId: params.organizationId,
    previousStatus,
    nextStatus,
    source: params.source,
    changedScopes: nextScopes,
    note: params.note,
    createdAt: new Date().toISOString(),
    createdBy: params.actorUserId,
  };
}

export async function listPricingOrders(options?: { status?: PricingOrderStatus; limit?: number }) {
  if (pricingOrdersForTests) {
    return clone(pricingOrdersForTests).filter((item) =>
      options?.status ? item.status === options.status : true,
    ).slice(0, Math.max(1, Math.min(options?.limit ?? 200, 500)));
  }
  if (shouldUseInMemoryMongoFallback()) {
    return [];
  }
  const Leads = await coreCol("edebatte_preorders");
  const limit = Math.max(1, Math.min(options?.limit ?? 200, 500));

  const query: Record<string, unknown> = {};
  if (options?.status) {
    if (options.status === "submitted") {
      query.$or = [{ status: "submitted" }, { status: "vormerkung" }, { status: { $exists: false } }];
    } else {
      query.status = options.status;
    }
  }

  const docs = await Leads.find(query).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map((doc: any) => mapDocToPricingOrderAdminListItem(doc));
}

export async function listPricingOrdersForOrganization(input: {
  organizationId?: string | null;
  organizationName?: string | null;
  limit?: number;
}): Promise<OrganizationContractOrderRecord[]> {
  const items = await listPricingOrders({ limit: input.limit ?? 250 });
  const organizationId = normalizeText(input.organizationId);
  const organizationName = normalizeText(input.organizationName)?.toLowerCase() ?? null;

  return items
    .filter((item) => {
      const internalOrgId = normalizeText(item.internal.organizationId);
      const matchesOrganizationId = organizationId ? internalOrgId === organizationId : false;
      const matchesOrganizationName =
        organizationName && item.organizationName
          ? item.organizationName.trim().toLowerCase() === organizationName
          : false;
      return matchesOrganizationId || matchesOrganizationName;
    })
    .map((item) => ({
      id: item.id,
      orderId: item.orderId,
      packageId: item.packageId,
      planLabel: item.planLabel,
      organizationId: item.internal.organizationId,
      organizationName: item.organizationName,
      status: item.status,
      contractStatus: item.internal.contractStatus,
      billingStatus: item.internal.billingStatus,
      billingSource: item.internal.billingSource,
      planAssignment: item.internal.planAssignment,
      accessProvisioningDecision: item.internal.accessProvisioningDecision,
      auditEvents: item.internal.contractAuditEvents,
      partnerProjectPackage: item.internal.partnerProjectPackage,
      partnerFundingDisclosure: item.internal.partnerFundingDisclosure,
      partnerReportingState: item.internal.partnerReportingState,
      partnerPackageAuditEvents: item.internal.partnerPackageAuditEvents,
      source: item.source,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
}

export async function updatePricingOrderReview(id: string, input: AdminUpdateInput) {
  if (pricingOrdersForTests) {
    const index = pricingOrdersForTests.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error("order_not_found");
    }
    const existing = pricingOrdersForTests[index];
    const fromStatus = normalizeStatus(existing.status);
    if (!canTransitionPricingOrderStatus(fromStatus, input.status)) {
      throw new Error("invalid_status_transition");
    }
    const note = input.note?.trim() ?? null;
    const nextContractStatus =
      input.contractStatus ?? mapPricingOrderStatusToContractStatus(input.status);
    const nextBillingStatus =
      input.billingStatus ?? mapPricingOrderStatusToBillingStatus(input.status);
    const nextBillingSource =
      input.billingSource ??
      existing.internal.billingSource ??
      (existing.source === "fixture"
        ? "fixture_demo"
        : input.invoiceReference || input.billingFinanceNote
          ? "manual_invoice"
          : "operator_verified_contract");
    const planAssignment =
      input.planAssignment ??
      existing.internal.planAssignment ??
      defaultPlanAssignmentForOrder({
        packageId: existing.packageId,
        planLabel: existing.planLabel,
      });
    const nextProvisioningDecision =
      input.accessProvisioningDecision ??
      deriveProvisioningDecisionFromContract({
        contractStatus: nextContractStatus,
        billingStatus: nextBillingStatus,
        previousContractStatus: existing.internal.contractStatus,
      });
    const nextPartnerFundingDisclosure =
      typeof input.partnerFundingDisclosure !== "undefined"
        ? input.partnerFundingDisclosure
        : existing.internal.partnerFundingDisclosure;
    const nextPartnerReportingState =
      typeof input.partnerReportingState !== "undefined"
        ? input.partnerReportingState
        : existing.internal.partnerReportingState;
    const nextPartnerProjectPackage = (() => {
      if (typeof input.partnerProjectPackage !== "undefined") {
        if (!input.partnerProjectPackage) return null;
        return {
          ...input.partnerProjectPackage,
          organizationId: input.organizationId ?? existing.internal.organizationId,
          organizationName: existing.organizationName,
          contractLinked: true,
          billingLinked: true,
          reviewOnlyOutputs: true,
          noOperatorRights: true,
          noAutoOfficial: true,
          noAutoPublicationApproved: true,
          createdAt: input.partnerProjectPackage.createdAt,
          updatedAt: new Date().toISOString(),
        } satisfies PartnerProjectPackage;
      }
      return existing.internal.partnerProjectPackage;
    })();
    const contractAuditEvent = buildContractAuditEvent({
      orderId: existing.orderId,
      actorUserId: input.actorUserId,
      organizationId: input.organizationId ?? existing.internal.organizationId,
      previousContractStatus: existing.internal.contractStatus,
      nextContractStatus,
      previousBillingStatus: existing.internal.billingStatus,
      nextBillingStatus,
      source: nextBillingSource,
      planAssignment,
      note,
    });
    const partnerPackageAuditEvent = buildPartnerPackageAuditEvent({
      actorUserId: input.actorUserId,
      organizationId: input.organizationId ?? existing.internal.organizationId,
      source: nextBillingSource,
      previousPackage: existing.internal.partnerProjectPackage,
      nextPackage: nextPartnerProjectPackage,
      note,
    });
    pricingOrdersForTests[index] = {
      ...existing,
      status: input.status,
      updatedAt: new Date().toISOString(),
      internal: {
        ...existing.internal,
        notes: note ? [...existing.internal.notes, note] : existing.internal.notes,
        reviewedBy: input.actorUserId,
        reviewedAt: new Date().toISOString(),
        adjustedPriceLabel: input.adjustedPriceLabel ?? existing.internal.adjustedPriceLabel,
        discountKind: input.discountKind ?? existing.internal.discountKind,
        discountReason: input.discountReason ?? existing.internal.discountReason,
        discountAmount:
          typeof input.discountAmount === "number" ? input.discountAmount : existing.internal.discountAmount,
        approvalReason: input.approvalReason ?? existing.internal.approvalReason,
        rejectionReason: input.rejectionReason ?? existing.internal.rejectionReason,
        activationNotes: input.activationNotes ?? existing.internal.activationNotes,
        billingFinanceNote: input.billingFinanceNote ?? existing.internal.billingFinanceNote,
        contractReference: input.contractReference ?? existing.internal.contractReference,
        invoiceReference: input.invoiceReference ?? existing.internal.invoiceReference,
        organizationId: input.organizationId ?? existing.internal.organizationId,
        contractStatus: nextContractStatus,
        billingStatus: nextBillingStatus,
        billingSource: nextBillingSource,
        planAssignment,
        accessProvisioningDecision: nextProvisioningDecision,
        contractAuditEvents: contractAuditEvent
          ? [...existing.internal.contractAuditEvents, contractAuditEvent]
          : existing.internal.contractAuditEvents,
        partnerProjectPackage: nextPartnerProjectPackage,
        partnerFundingDisclosure: nextPartnerFundingDisclosure ?? null,
        partnerReportingState: nextPartnerReportingState ?? null,
        partnerPackageAuditEvents: partnerPackageAuditEvent
          ? [...existing.internal.partnerPackageAuditEvents, partnerPackageAuditEvent]
          : existing.internal.partnerPackageAuditEvents,
      },
    };
    return {
      id,
      status: input.status,
      reviewedAt: pricingOrdersForTests[index]?.internal.reviewedAt ?? new Date().toISOString(),
    };
  }
  if (shouldUseInMemoryMongoFallback()) {
    throw new Error("order_not_found");
  }
  if (!ObjectId.isValid(id)) {
    throw new Error("invalid_order_id");
  }

  const Leads = await coreCol("edebatte_preorders");
  const _id = new ObjectId(id);
  const existing = await Leads.findOne({ _id });
  if (!existing) {
    throw new Error("order_not_found");
  }

  const fromStatus = normalizeStatus((existing as any).status);
  if (!canTransitionPricingOrderStatus(fromStatus, input.status)) {
    throw new Error("invalid_status_transition");
  }

  const now = new Date();
  const note = input.note?.trim();
  const internalBefore = (existing as any).internal && typeof (existing as any).internal === "object"
    ? (existing as any).internal
    : {};
  const notesBefore = Array.isArray(internalBefore.notes)
    ? internalBefore.notes.filter((entry: unknown): entry is string => typeof entry === "string")
    : [];
  const notes = note ? [...notesBefore, `${now.toISOString()} | ${input.actorUserId}: ${note}`] : notesBefore;

  const packageId = typeof (existing as any).package === "string" ? (existing as any).package : "";
  const planLabel = typeof (existing as any).planLabel === "string" ? (existing as any).planLabel : "";
  const previousContractStatus = normalizeContractStatus(internalBefore.contractStatus);
  const previousBillingStatus = normalizeBillingStatus(internalBefore.billingStatus);
  const nextContractStatus = input.contractStatus ?? mapPricingOrderStatusToContractStatus(input.status);
  const nextBillingStatus = input.billingStatus ?? mapPricingOrderStatusToBillingStatus(input.status);
  const nextBillingSource =
    input.billingSource ??
    normalizeBillingSource(internalBefore.billingSource) ??
    ((existing as any).source === "fixture"
      ? "fixture_demo"
      : input.invoiceReference || input.billingFinanceNote || internalBefore.invoiceReference || internalBefore.billingFinanceNote
        ? "manual_invoice"
        : "operator_verified_contract");
  const planAssignment =
    input.planAssignment ??
    normalizePlanAssignment(internalBefore.planAssignment, { packageId, planLabel }) ??
    defaultPlanAssignmentForOrder({ packageId, planLabel });
  const nextProvisioningDecision =
    input.accessProvisioningDecision ??
    deriveProvisioningDecisionFromContract({
      contractStatus: nextContractStatus,
      billingStatus: nextBillingStatus,
      previousContractStatus,
    });
  const existingContractAuditEvents = normalizeContractAuditEvents(internalBefore.contractAuditEvents);
  const existingPartnerProjectPackage = normalizePartnerProjectPackage(internalBefore.partnerProjectPackage);
  const existingPartnerFundingDisclosure = normalizePartnerFundingDisclosure(
    internalBefore.partnerFundingDisclosure,
  );
  const existingPartnerReportingState = normalizePartnerReportingState(
    internalBefore.partnerReportingState,
  );
  const existingPartnerPackageAuditEvents = normalizePartnerPackageAuditEvents(
    internalBefore.partnerPackageAuditEvents,
  );
  const nextPartnerFundingDisclosure =
    typeof input.partnerFundingDisclosure !== "undefined"
      ? input.partnerFundingDisclosure
      : existingPartnerFundingDisclosure;
  const nextPartnerReportingState =
    typeof input.partnerReportingState !== "undefined"
      ? input.partnerReportingState
      : existingPartnerReportingState;
  const nextPartnerProjectPackage = (() => {
    if (typeof input.partnerProjectPackage !== "undefined") {
      if (!input.partnerProjectPackage) return null;
      return {
        ...input.partnerProjectPackage,
        organizationId: input.organizationId ?? normalizeText(internalBefore.organizationId),
        organizationName:
          normalizeText((existing as any).organizationName) ?? existingPartnerProjectPackage?.organizationName ?? null,
        contractLinked: true,
        billingLinked: true,
        reviewOnlyOutputs: true,
        noOperatorRights: true,
        noAutoOfficial: true,
        noAutoPublicationApproved: true,
        createdAt: input.partnerProjectPackage.createdAt,
        updatedAt: now.toISOString(),
      } satisfies PartnerProjectPackage;
    }
    return existingPartnerProjectPackage;
  })();
  const contractAuditEvent = buildContractAuditEvent({
    orderId: typeof (existing as any).orderId === "string" ? (existing as any).orderId : id,
    actorUserId: input.actorUserId,
    organizationId: input.organizationId ?? normalizeText(internalBefore.organizationId),
    previousContractStatus,
    nextContractStatus,
    previousBillingStatus,
    nextBillingStatus,
    source: nextBillingSource,
    planAssignment,
    note: note ?? null,
  });
  const partnerPackageAuditEvent = buildPartnerPackageAuditEvent({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId ?? normalizeText(internalBefore.organizationId),
    source: nextBillingSource,
    previousPackage: existingPartnerProjectPackage,
    nextPackage: nextPartnerProjectPackage,
    note: note ?? null,
  });

  const internal = {
    notes,
    reviewedBy: input.actorUserId,
    reviewedAt: now,
    adjustedPriceLabel: input.adjustedPriceLabel ?? internalBefore.adjustedPriceLabel ?? null,
    discountKind: input.discountKind ?? internalBefore.discountKind ?? null,
    discountReason: input.discountReason ?? internalBefore.discountReason ?? null,
    discountAmount:
      typeof input.discountAmount === "number" ? input.discountAmount : internalBefore.discountAmount ?? null,
    approvalReason: input.approvalReason ?? internalBefore.approvalReason ?? null,
    rejectionReason: input.rejectionReason ?? internalBefore.rejectionReason ?? null,
    activationNotes: input.activationNotes ?? internalBefore.activationNotes ?? null,
    billingFinanceNote: input.billingFinanceNote ?? internalBefore.billingFinanceNote ?? null,
    contractReference: input.contractReference ?? internalBefore.contractReference ?? null,
    invoiceReference: input.invoiceReference ?? internalBefore.invoiceReference ?? null,
    organizationId: input.organizationId ?? internalBefore.organizationId ?? null,
    contractStatus: nextContractStatus,
    billingStatus: nextBillingStatus,
    billingSource: nextBillingSource,
    planAssignment,
    accessProvisioningDecision: nextProvisioningDecision,
    contractAuditEvents: contractAuditEvent
      ? [...existingContractAuditEvents, contractAuditEvent]
      : existingContractAuditEvents,
    partnerProjectPackage: nextPartnerProjectPackage,
    partnerFundingDisclosure: nextPartnerFundingDisclosure ?? null,
    partnerReportingState: nextPartnerReportingState ?? null,
    partnerPackageAuditEvents: partnerPackageAuditEvent
      ? [...existingPartnerPackageAuditEvents, partnerPackageAuditEvent]
      : existingPartnerPackageAuditEvents,
  };

  await Leads.updateOne(
    { _id },
    {
      $set: {
        status: input.status,
        reviewedAt: now,
        activatedAt: input.status === "active" ? now : (existing as any).activatedAt ?? null,
        updatedAt: now,
        internal,
      },
    },
  );

  return {
    id,
    status: input.status,
    reviewedAt: now.toISOString(),
  };
}

export function setPricingOrdersForTests(items: PricingOrderAdminListItem[] | null) {
  pricingOrdersForTests = items ? clone(items) : null;
}
