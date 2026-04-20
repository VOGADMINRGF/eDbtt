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
