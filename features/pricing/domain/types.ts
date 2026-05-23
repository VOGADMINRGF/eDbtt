export type PackageStatus = "verfuegbar" | "pilot" | "vormerkung" | "bald";
export type PackageAudience = "buerger" | "journalismus" | "organisation";
export type PricingSegmentId = "privat" | "journalismus" | "organisationen" | "kommunen";
export type PricingOrderStatus =
  | "package_selected"
  | "account_required"
  | "registry_incomplete"
  | "identity_complete"
  | "bank_verification_pending"
  | "bank_verified"
  | "totp_required"
  | "human_review_required"
  | "order_submitted"
  | "submitted"
  | "under_review"
  | "approved"
  | "adjusted"
  | "rejected"
  | "active"
  | "paused"
  | "cancelled";

export type OrganizationContractStatus =
  | "none"
  | "draft"
  | "offered"
  | "accepted"
  | "active"
  | "limited"
  | "suspended"
  | "cancelled"
  | "expired";

export type OrganizationBillingStatus =
  | "none"
  | "billing_pending"
  | "operator_verified_contract"
  | "active"
  | "overdue"
  | "grace_period"
  | "suspended"
  | "cancelled"
  | "expired";

export type OrganizationBillingSource =
  | "operator_verified_contract"
  | "manual_invoice"
  | "external_checkout_pending"
  | "external_checkout_integrated"
  | "fixture_demo";

export type OrganizationPlanAssignment = {
  planId: string;
  planLabel: string;
  scopes: string[];
};

export type OrganizationAccessProvisioningDecision =
  | "none"
  | "offer"
  | "accept"
  | "activate"
  | "limit"
  | "grace"
  | "suspend"
  | "cancel"
  | "expire"
  | "reactivate";

export type OrganizationContractAuditEventType =
  | "offer"
  | "accept"
  | "activate"
  | "limit"
  | "grace"
  | "suspend"
  | "cancel"
  | "expire"
  | "reactivate";

export type OrganizationContractAuditEvent = {
  id: string;
  eventType: OrganizationContractAuditEventType;
  organizationId: string | null;
  orderId: string;
  previousContractStatus: OrganizationContractStatus | null;
  nextContractStatus: OrganizationContractStatus | null;
  previousBillingStatus: OrganizationBillingStatus | null;
  nextBillingStatus: OrganizationBillingStatus | null;
  source: OrganizationBillingSource;
  planAssignment: OrganizationPlanAssignment | null;
  note: string | null;
  createdAt: string;
  createdBy: string;
};
export type EDebattePackageId =
  | "basis"
  | "start"
  | "pro"
  | "journal_basis"
  | "journal_pro"
  | "b2b_basis"
  | "b2b_pro"
  | "b2g_basis"
  | "b2g_pro";

export type EDebattePackageDefinition = {
  id: EDebattePackageId;
  titel: string;
  zielgruppe: string;
  typ: PackageAudience;
  status: PackageStatus;
  preisMonat?: number;
  preisJahr?: number;
  mitgliederPreisMonat?: number;
  preisLabel?: string;
  fuerWen: string;
  wofuerGedacht: string;
  unterschiedZurNaechstenStufe: string;
  beschreibungKurz: string;
  leistungen: string[];
  hervorgehoben?: boolean;
  ctaText: string;
  ctaHref: string;
  sekundarCtaText?: string;
  sekundarCtaHref?: string;
  contributionCreditsPerMonth: number;
  anlassraumCredits: number;
  searchCredits: number;
  deepResearchCredits: number;
  dossierBoostEligible: boolean;
  premiumResearchEligible: boolean;
};

export type CreatePreorderLeadInput = {
  packageId: string;
  email?: string;
  name?: string;
  source?: string;
  locale?: string;
  plz?: string;
  note?: string;
  phone?: string;
  membershipRequested?: boolean;
  organizationName?: string;
  organizationType?: string;
  municipalityName?: string;
  contactRole?: string;
  selectedAddOns?: string[];
  selectedOptions?: Record<string, string>;
  conversationRequested?: boolean;
  conversationChannel?: "email" | "telefon" | "video";
  type?: PackageAudience;
  segment?: PricingSegmentId;
};

export type CreatePreorderLeadResult =
  | {
      ok: true;
      mailSent: boolean;
      planLabel: string;
      orderId: string;
      status: PricingOrderStatus;
      requiresReview: boolean;
    }
  | { ok: false; error: "invalid_input" | "unknown_plan" | "account_required" | "registry_incomplete" | "bank_verification_pending" | "totp_required" | "human_review_required" };

export type PublicPriceSummary = {
  packagePriceLabel: string;
  addOnSelections: string[];
  notes: string[];
};

export type PricingOrderInternalSnapshot = {
  notes: string[];
  reviewedBy: string | null;
  reviewedAt: Date | null;
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
};

export type PreorderLeadRecord = {
  orderId: string;
  packageId: EDebattePackageId;
  segment: PricingSegmentId | null;
  planLabel: string;
  type: PackageAudience | null;
  email: string | null;
  customerName: string | null;
  phone: string | null;
  organizationName: string | null;
  organizationType: string | null;
  municipalityName: string | null;
  contactRole: string | null;
  plz: string | null;
  note: string | null;
  membershipRequested: boolean;
  selectedAddOns: string[];
  selectedOptions: Record<string, string> | null;
  conversationRequested: boolean;
  conversationChannel: "email" | "telefon" | "video" | null;
  publicPriceSummary: PublicPriceSummary;
  source: string;
  priceMonthly: number | null;
  status: PricingOrderStatus;
  requiresReview: boolean;
  reviewedAt: Date | null;
  activatedAt: Date | null;
  internal: PricingOrderInternalSnapshot;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizationContractOrderRecord = {
  id: string;
  orderId: string;
  packageId: string;
  planLabel: string;
  organizationId: string | null;
  organizationName: string | null;
  status: PricingOrderStatus;
  contractStatus: OrganizationContractStatus | null;
  billingStatus: OrganizationBillingStatus | null;
  billingSource: OrganizationBillingSource | null;
  planAssignment: OrganizationPlanAssignment | null;
  accessProvisioningDecision: OrganizationAccessProvisioningDecision | null;
  auditEvents: OrganizationContractAuditEvent[];
  source: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PreorderUserUpdate = {
  packageId: EDebattePackageId;
  status: "active" | "preorder";
  source: string;
  updatedAt: Date;
  preorderAt: Date;
};

export type UserContact = {
  email?: string | null;
  displayName?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type ConfirmationMail = {
  subject: string;
  html: string;
  text: string;
};
