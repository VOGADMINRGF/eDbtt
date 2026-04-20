import "server-only";
import { ObjectId, coreCol } from "@core/db/triMongo";
import type { PreorderLeadRecord, PreorderUserUpdate, PricingOrderStatus, UserContact } from "../domain/types";
import { canTransitionPricingOrderStatus } from "../domain/orderFlow";

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
};

function normalizeDate(value: unknown) {
  return value instanceof Date ? value.toISOString() : null;
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

export async function listPricingOrders(options?: { status?: PricingOrderStatus; limit?: number }) {
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
  return docs.map((doc: any): PricingOrderAdminListItem => ({
    id: String(doc._id),
    orderId: typeof doc.orderId === "string" && doc.orderId ? doc.orderId : String(doc._id),
    packageId: typeof doc.package === "string" ? doc.package : "",
    planLabel: typeof doc.planLabel === "string" ? doc.planLabel : "",
    segment: typeof doc.segment === "string" ? doc.segment : null,
    status: normalizeStatus(doc.status),
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
          addOnSelections: Array.isArray(doc.publicPriceSummary.addOnSelections)
            ? doc.publicPriceSummary.addOnSelections.filter((item: unknown): item is string => typeof item === "string")
            : [],
          notes: Array.isArray(doc.publicPriceSummary.notes)
            ? doc.publicPriceSummary.notes.filter((item: unknown): item is string => typeof item === "string")
            : [],
        }
      : null,
    selectedAddOns: Array.isArray(doc.selectedAddOns)
      ? doc.selectedAddOns.filter((item: unknown): item is string => typeof item === "string")
      : [],
    requiresReview: Boolean(doc.requiresReview),
    internal: (() => {
      const internalDoc = doc.internal && typeof doc.internal === "object" ? doc.internal : {};
      return {
        notes: Array.isArray((internalDoc as any).notes)
          ? (internalDoc as any).notes.filter((entry: unknown): entry is string => typeof entry === "string")
          : [],
        reviewedBy: typeof (internalDoc as any).reviewedBy === "string" ? (internalDoc as any).reviewedBy : null,
        reviewedAt: normalizeDate((internalDoc as any).reviewedAt),
        adjustedPriceLabel:
          typeof (internalDoc as any).adjustedPriceLabel === "string"
            ? (internalDoc as any).adjustedPriceLabel
            : null,
        discountKind:
          (internalDoc as any).discountKind === "pilot" ||
          (internalDoc as any).discountKind === "yearly" ||
          (internalDoc as any).discountKind === "partner" ||
          (internalDoc as any).discountKind === "reference" ||
          (internalDoc as any).discountKind === "manual_special"
            ? (internalDoc as any).discountKind
            : null,
        discountReason:
          typeof (internalDoc as any).discountReason === "string"
            ? (internalDoc as any).discountReason
            : null,
        discountAmount:
          typeof (internalDoc as any).discountAmount === "number"
            ? (internalDoc as any).discountAmount
            : null,
        approvalReason:
          typeof (internalDoc as any).approvalReason === "string"
            ? (internalDoc as any).approvalReason
            : null,
        rejectionReason:
          typeof (internalDoc as any).rejectionReason === "string"
            ? (internalDoc as any).rejectionReason
            : null,
        activationNotes:
          typeof (internalDoc as any).activationNotes === "string"
            ? (internalDoc as any).activationNotes
            : null,
        billingFinanceNote:
          typeof (internalDoc as any).billingFinanceNote === "string"
            ? (internalDoc as any).billingFinanceNote
            : null,
        contractReference:
          typeof (internalDoc as any).contractReference === "string"
            ? (internalDoc as any).contractReference
            : null,
        invoiceReference:
          typeof (internalDoc as any).invoiceReference === "string"
            ? (internalDoc as any).invoiceReference
            : null,
      };
    })(),
    source: typeof doc.source === "string" ? doc.source : null,
    createdAt: normalizeDate(doc.createdAt),
    updatedAt: normalizeDate(doc.updatedAt),
  }));
}

export async function updatePricingOrderReview(id: string, input: AdminUpdateInput) {
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
