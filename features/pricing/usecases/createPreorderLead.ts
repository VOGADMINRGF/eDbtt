import "server-only";
import { z } from "zod";
import {
  getInstitutionalAddOnById,
  getInstitutionalAddOnMaturityMeta,
} from "../domain/institutionalPricing.de";
import { normalizePricingLocale } from "../domain/i18n";
import { getEdebatePackageById, normalizePackageId } from "../domain/helpers";
import { formatPackagePriceLabel } from "../domain/formatters";
import { normalizePricingSegmentId, resolvePricingSegmentForPackage } from "../domain/journey.de";
import { PRICING_TRUST_LOOP_DE, PRICING_TRUST_LOOP_EN } from "../domain/trustLoop.de";
import {
  getInitialOrderStatusForSegment,
  orderStatusRequiresInternalReview,
} from "../domain/orderFlow";
import type {
  ConfirmationMail,
  CreatePreorderLeadResult,
  PackageAudience,
  PreorderLeadRecord,
  PricingOrderStatus,
  PreorderUserUpdate,
  UserContact,
} from "../domain/types";
import { findPreorderUserById, insertPreorderLead, updatePreorderUser } from "../server/leadsRepo";

export type LeadRepo = {
  insertLead: (lead: PreorderLeadRecord) => Promise<string | void>;
};

export type UserRepo = {
  findById: (userId: string) => Promise<UserContact | null>;
  updatePreorder: (userId: string, update: PreorderUserUpdate) => Promise<void>;
};

export type CreatePreorderLeadDeps = {
  leadRepo?: LeadRepo;
  userRepo?: UserRepo;
  now?: () => Date;
  publicOrigin?: () => string;
  buildConfirmationMail?: (args: {
    displayName?: string | null;
    planLabel: string;
    monthlyPrice?: number | null;
    accountUrl?: string;
    locale?: string;
  }) => ConfirmationMail;
  sendMail?: (payload: { to: string; subject: string; html: string; text: string }) => Promise<void>;
};

export type CreatePreorderLeadOptions = {
  userId?: string | null;
  initialStatusOverride?: PricingOrderStatus | null;
  publicSummaryNotes?: string[];
  internalReviewNote?: string | null;
};

const schema = z
  .object({
    packageId: z.string().min(1).optional(),
    package: z.string().min(1).optional(),
    email: z.string().email().optional(),
    name: z.string().max(120).optional(),
    source: z.string().max(120).optional(),
    locale: z.string().max(12).optional(),
    plz: z.string().min(3).max(12).optional(),
    note: z.string().max(800).optional(),
    phone: z.string().max(40).optional(),
    membershipRequested: z.boolean().optional(),
    organizationName: z.string().max(160).optional(),
    organizationType: z.string().max(120).optional(),
    municipalityName: z.string().max(160).optional(),
    contactRole: z.string().max(120).optional(),
    selectedAddOns: z.array(z.string().max(120)).max(20).optional(),
    selectedOptions: z.record(z.string().max(80), z.string().max(240)).optional(),
    conversationRequested: z.boolean().optional(),
    conversationChannel: z.enum(["email", "telefon", "video"]).optional(),
    type: z.enum(["buerger", "journalismus", "organisation"]).optional(),
    segment: z.enum(["privat", "journalismus", "organisationen", "kommunen"]).optional(),
  })
  .refine((data) => Boolean(data.packageId || data.package), {
    message: "package_required",
  });

type ParsedInput = z.infer<typeof schema>;

function buildDisplayName(user: UserContact | null, fallback?: string | null) {
  if (fallback?.trim()) return fallback.trim();
  if (!user) return null;
  return (
    user.displayName ||
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    null
  );
}

function normalizeEmail(value?: string | null) {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || null;
}

function normalizeText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function normalizeSelectedAddOns(value?: string[]) {
  if (!Array.isArray(value)) return [];
  const uniq = new Set<string>();
  value.forEach((entry) => {
    const normalized = normalizeText(entry);
    if (normalized) uniq.add(normalized);
  });
  return Array.from(uniq);
}

function resolveAddOnLabel(id: string, locale: "de" | "en") {
  const addOn = getInstitutionalAddOnById(id, locale);
  return addOn?.title || id;
}

function buildOrderId(now: Date) {
  const y = String(now.getFullYear());
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EDE-${y}${m}${d}-${random}`;
}

export async function createPreorderLead(
  raw: unknown,
  options: CreatePreorderLeadOptions = {},
  deps: CreatePreorderLeadDeps = {},
): Promise<CreatePreorderLeadResult> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const data: ParsedInput = parsed.data;
  const packageValue = data.packageId ?? data.package ?? "";
  const normalizedPackage = normalizePackageId(packageValue);
  const locale = normalizePricingLocale(data.locale);
  if (!normalizedPackage) {
    return { ok: false, error: "unknown_plan" };
  }

  const plan = getEdebatePackageById(normalizedPackage, locale);
  if (!plan) {
    return { ok: false, error: "unknown_plan" };
  }

  const now = deps.now ? deps.now() : new Date();
  const source = data.source ?? "package_start";
  const emailFromPayload = normalizeEmail(data.email);
  const segmentFromPackage = resolvePricingSegmentForPackage(normalizedPackage);
  const payloadSegment = normalizePricingSegmentId(data.segment);
  if (payloadSegment && payloadSegment !== segmentFromPackage) {
    return { ok: false, error: "invalid_input" };
  }
  const payloadType: PackageAudience | null = data.type ?? plan.typ ?? null;
  const selectedAddOns = normalizeSelectedAddOns(data.selectedAddOns);
  const selectedAddOnLabels = selectedAddOns.map((entry) => resolveAddOnLabel(entry, locale));
  const selectedAddOnMaturityMeta = selectedAddOns
    .map((entry) => {
      const addOn = getInstitutionalAddOnById(entry, locale);
      return addOn ? getInstitutionalAddOnMaturityMeta(addOn.maturity, locale) : null;
    })
    .filter((entry): entry is ReturnType<typeof getInstitutionalAddOnMaturityMeta> => Boolean(entry));
  const selectedAddOnNeedsReview = selectedAddOnMaturityMeta.some((entry) => entry.requiresInternalReview);
  const selectedAddOnNeedsFollowup = selectedAddOnMaturityMeta.some((entry) => entry.requiresFollowupAlignment);
  const selectedAddOnInRollout = selectedAddOnMaturityMeta.some((entry) => !entry.fullyOperational);
  const selectedOptions = data.selectedOptions ? { ...data.selectedOptions } : null;
  const orderStatus =
    options.initialStatusOverride && options.initialStatusOverride !== "order_submitted"
      ? options.initialStatusOverride
      : getInitialOrderStatusForSegment(segmentFromPackage);
  const requiresReview = orderStatusRequiresInternalReview(orderStatus);
  const orderId = buildOrderId(now);

  const leadRepo: LeadRepo = deps.leadRepo ?? { insertLead: insertPreorderLead };
  const userRepo: UserRepo | null = deps.userRepo ?? {
    findById: findPreorderUserById,
    updatePreorder: updatePreorderUser,
  };

  const lead: PreorderLeadRecord = {
    orderId,
    packageId: normalizedPackage,
    segment: segmentFromPackage,
    planLabel: plan.titel,
    type: payloadType,
    email: emailFromPayload,
    customerName: normalizeText(data.name),
    phone: normalizeText(data.phone),
    organizationName: normalizeText(data.organizationName),
    organizationType: normalizeText(data.organizationType),
    municipalityName: normalizeText(data.municipalityName),
    contactRole: normalizeText(data.contactRole),
    plz: data.plz?.trim() || null,
    note: data.note?.trim() || null,
    membershipRequested: Boolean(data.membershipRequested),
    selectedAddOns,
    selectedOptions,
    conversationRequested: Boolean(data.conversationRequested),
    conversationChannel: data.conversationChannel ?? null,
    publicPriceSummary: {
      packagePriceLabel: formatPackagePriceLabel(plan, locale),
      addOnSelections: selectedAddOnLabels,
      notes: [
        locale === "en"
          ? "Membership and package activation are handled separately."
          : "Mitgliedschaft und Paketfreischaltung sind getrennt.",
        data.membershipRequested
          ? locale === "en"
            ? "Additional VoiceOpenGov membership request is marked."
            : "Zusätzlicher VoiceOpenGov-Mitgliedschaftsantrag ist markiert."
          : null,
        data.membershipRequested && segmentFromPackage !== "privat"
          ? locale === "en"
            ? "Membership request does not change package pricing in this segment."
            : "Mitgliedschaftsantrag verändert den Paketpreis in diesem Segment nicht."
          : null,
        requiresReview
          ? locale === "en"
            ? "Order is internally reviewed before activation."
            : "Bestellung wird vor Aktivierung intern geprüft."
          : locale === "en"
            ? "Order proceeds in the standard flow."
            : "Bestellung wird im Standardablauf weiterverarbeitet.",
        !requiresReview && selectedAddOnNeedsReview
          ? locale === "en"
            ? "Selected add-ons are internally reviewed before activation."
            : "Ausgewählte Add-ons werden vor Aktivierung intern geprüft."
          : null,
        selectedAddOnNeedsFollowup
          ? locale === "en"
            ? "Selected add-ons are coordinated in a follow-up step."
            : "Ausgewählte Add-ons werden im Folgeprozess abgestimmt."
          : null,
        selectedAddOnInRollout
          ? locale === "en"
            ? "Selected add-ons are available for selected operating contexts."
            : "Ausgewählte Add-ons sind für ausgewählte Einsatzkontexte verfügbar."
          : null,
        selectedOptions?.factcheckQuota
          ? locale === "en"
            ? `Optional fact-check quota: ${selectedOptions.factcheckQuota}`
            : `Optionales Faktencheck-Kontingent: ${selectedOptions.factcheckQuota}`
          : null,
        locale === "en"
          ? PRICING_TRUST_LOOP_EN.context.orderActivationHint
          : PRICING_TRUST_LOOP_DE.context.orderActivationHint,
        ...(options.publicSummaryNotes ?? []),
      ].filter((entry): entry is string => Boolean(entry)),
    },
    source,
    priceMonthly: plan.preisMonat ?? null,
    status: orderStatus,
    requiresReview,
    reviewedAt: null,
    activatedAt: null,
    internal: {
      notes: options.internalReviewNote ? [options.internalReviewNote] : [],
      reviewedBy: null,
      reviewedAt: null,
      adjustedPriceLabel: null,
      discountKind: null,
      discountReason: null,
      discountAmount: null,
      approvalReason: null,
      rejectionReason: null,
      activationNotes: null,
      billingFinanceNote: null,
      contractReference: null,
      invoiceReference: null,
      organizationId: null,
      contractStatus: null,
      billingStatus: null,
      billingSource: null,
      planAssignment: null,
      accessProvisioningDecision: null,
      contractAuditEvents: [],
    },
    userId: options.userId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const persistedOrderId = (await leadRepo.insertLead(lead)) || orderId;

  let contactEmail = emailFromPayload;
  let displayName = data.name?.trim() || null;

  if (options.userId && userRepo) {
    const isFree = plan.preisMonat === 0;
    await userRepo.updatePreorder(options.userId, {
      packageId: normalizedPackage,
      status: isFree ? "active" : "preorder",
      source,
      updatedAt: now,
      preorderAt: now,
    });

    const user = await userRepo.findById(options.userId);
    contactEmail = contactEmail || normalizeEmail(user?.email || null);
    displayName = buildDisplayName(user, displayName);
  }

  let mailSent = false;
  if (contactEmail && deps.sendMail && deps.buildConfirmationMail) {
    try {
      const origin = deps.publicOrigin ? deps.publicOrigin() : "";
      const accountUrl = origin
        ? `${origin.replace(/\/$/, "")}/account?preorder=thanks`
        : undefined;

      const mail = deps.buildConfirmationMail({
        displayName,
        planLabel: plan.titel,
        monthlyPrice: plan.preisMonat ?? null,
        accountUrl,
        locale,
      });

      await deps.sendMail({
        to: contactEmail,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
      mailSent = true;
    } catch {
      mailSent = false;
    }
  }

  return {
    ok: true,
    mailSent,
    planLabel: plan.titel,
    orderId: persistedOrderId,
    status: orderStatus,
    requiresReview,
  };
}
