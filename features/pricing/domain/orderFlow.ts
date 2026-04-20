import type { PricingOrderStatus, PricingSegmentId } from "./types";

export const PRICING_ORDER_STATUS_LABELS: Record<PricingOrderStatus, string> = {
  package_selected: "Paket gewählt",
  account_required: "Konto erforderlich",
  registry_incomplete: "Registry unvollständig",
  identity_complete: "Identität vollständig",
  bank_verification_pending: "Bankverifikation ausstehend",
  bank_verified: "Bank verifiziert",
  totp_required: "TOTP erforderlich",
  human_review_required: "Manuelle Prüfung erforderlich",
  order_submitted: "Bestellung abgesendet",
  submitted: "Eingegangen",
  under_review: "In Prüfung",
  approved: "Freigegeben",
  adjusted: "Angepasst",
  rejected: "Abgelehnt",
  active: "Aktiv",
  paused: "Pausiert",
  cancelled: "Storniert",
};

const ORDER_STATUS_TRANSITIONS: Record<PricingOrderStatus, readonly PricingOrderStatus[]> = {
  package_selected: ["account_required", "registry_incomplete", "order_submitted", "cancelled"],
  account_required: ["registry_incomplete", "identity_complete", "cancelled"],
  registry_incomplete: ["identity_complete", "human_review_required", "cancelled"],
  identity_complete: ["bank_verification_pending", "bank_verified", "totp_required", "human_review_required", "cancelled"],
  bank_verification_pending: ["bank_verified", "human_review_required", "cancelled"],
  bank_verified: ["totp_required", "order_submitted", "human_review_required", "cancelled"],
  totp_required: ["order_submitted", "human_review_required", "cancelled"],
  human_review_required: ["under_review", "approved", "rejected", "cancelled"],
  order_submitted: ["submitted", "under_review", "approved", "adjusted", "rejected", "cancelled"],
  submitted: ["under_review", "approved", "adjusted", "rejected", "cancelled"],
  under_review: ["approved", "adjusted", "rejected", "cancelled"],
  approved: ["adjusted", "active", "paused", "cancelled"],
  adjusted: ["approved", "active", "rejected", "cancelled"],
  rejected: [],
  active: ["paused", "cancelled"],
  paused: ["active", "cancelled"],
  cancelled: [],
};

export function getInitialOrderStatusForSegment(segmentId: PricingSegmentId): PricingOrderStatus {
  return segmentId === "organisationen" || segmentId === "kommunen" ? "under_review" : "submitted";
}

export function orderStatusRequiresInternalReview(status: PricingOrderStatus) {
  return status === "under_review";
}

export function canTransitionPricingOrderStatus(from: PricingOrderStatus, to: PricingOrderStatus) {
  if (from === to) return true;
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}
