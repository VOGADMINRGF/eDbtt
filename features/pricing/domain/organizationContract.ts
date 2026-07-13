import type {
  OrganizationAccessProvisioningDecision,
  OrganizationBillingSource,
  OrganizationBillingStatus,
  OrganizationContractAuditEventType,
  OrganizationContractStatus,
  OrganizationPlanAssignment,
  PricingOrderStatus,
} from "./types";

export const ORGANIZATION_CONTRACT_STATUSES = [
  "none",
  "draft",
  "offered",
  "accepted",
  "active",
  "limited",
  "suspended",
  "cancelled",
  "expired",
] as const;

export const ORGANIZATION_BILLING_STATUSES = [
  "none",
  "billing_pending",
  "operator_verified_contract",
  "active",
  "overdue",
  "grace_period",
  "suspended",
  "cancelled",
  "expired",
] as const;

export const ORGANIZATION_BILLING_SOURCES = [
  "operator_verified_contract",
  "manual_invoice",
  "external_checkout_pending",
  "external_checkout_integrated",
  "fixture_demo",
] as const;

export const ORGANIZATION_ACCESS_PROVISIONING_DECISIONS = [
  "none",
  "offer",
  "accept",
  "activate",
  "limit",
  "grace",
  "suspend",
  "cancel",
  "expire",
  "reactivate",
] as const;

export const DEFAULT_CONTRACT_PROVISIONED_SCOPES = [
  "organization_dashboard",
  "region_cockpit",
  "review_queue",
  "content_release",
  "dossier_studio",
  "source_connection",
  "public_share",
] as const;

export const LIMITED_CONTRACT_PROVISIONED_SCOPES = [
  "organization_dashboard",
  "region_cockpit",
] as const;

export function organizationContractStatusLabel(status: OrganizationContractStatus): string {
  switch (status) {
    case "draft":
      return "Vertrag ausstehend";
    case "offered":
      return "Angebot liegt vor";
    case "accepted":
      return "Vertrag angenommen";
    case "active":
      return "Zugriff aktiv";
    case "limited":
      return "Zugriff eingeschränkt";
    case "suspended":
      return "Pausiert";
    case "cancelled":
      return "Gekündigt";
    case "expired":
      return "Abgelaufen";
    case "none":
    default:
      return "Kein Vertrag aktiv";
  }
}

export function organizationBillingStatusLabel(status: OrganizationBillingStatus): string {
  switch (status) {
    case "billing_pending":
      return "Vertrag oder Rechnung in Prüfung";
    case "operator_verified_contract":
      return "Betreiber-Vertrag bestätigt";
    case "active":
      return "Billing aktiv";
    case "overdue":
      return "Überfällig";
    case "grace_period":
      return "Grace Period";
    case "suspended":
      return "Billing pausiert";
    case "cancelled":
      return "Billing beendet";
    case "expired":
      return "Billing abgelaufen";
    case "none":
    default:
      return "Kein Billing aktiv";
  }
}

export function organizationBillingSourceLabel(source: OrganizationBillingSource): string {
  switch (source) {
    case "operator_verified_contract":
      return "Betreiber-verifizierter Vertragsprozess";
    case "manual_invoice":
      return "Manuelle Rechnung / Vertragspfad";
    case "external_checkout_pending":
      return "Externer Checkout später optional";
    case "external_checkout_integrated":
      return "Externer Checkout integriert";
    case "fixture_demo":
    default:
      return "Demo- oder Testpfad";
  }
}

export function mapPricingOrderStatusToContractStatus(status: PricingOrderStatus): OrganizationContractStatus {
  switch (status) {
    case "package_selected":
    case "account_required":
    case "registry_incomplete":
    case "identity_complete":
    case "bank_verification_pending":
    case "bank_verified":
    case "totp_required":
      return "draft";
    case "human_review_required":
    case "order_submitted":
    case "submitted":
    case "under_review":
      return "offered";
    case "approved":
    case "adjusted":
      return "accepted";
    case "active":
      return "active";
    case "paused":
      return "suspended";
    case "cancelled":
      return "cancelled";
    default:
      return "none";
  }
}

export function mapPricingOrderStatusToBillingStatus(status: PricingOrderStatus): OrganizationBillingStatus {
  switch (status) {
    case "approved":
    case "adjusted":
      return "operator_verified_contract";
    case "active":
      return "active";
    case "paused":
      return "suspended";
    case "cancelled":
      return "cancelled";
    case "human_review_required":
    case "order_submitted":
    case "submitted":
    case "under_review":
    case "package_selected":
    case "account_required":
    case "registry_incomplete":
    case "identity_complete":
    case "bank_verification_pending":
    case "bank_verified":
    case "totp_required":
      return "billing_pending";
    default:
      return "none";
  }
}

export function defaultPlanAssignmentForOrder(input: {
  packageId: string;
  planLabel: string;
}): OrganizationPlanAssignment {
  return {
    planId: input.packageId,
    planLabel: input.planLabel,
    scopes: [...DEFAULT_CONTRACT_PROVISIONED_SCOPES],
  };
}

export function deriveProvisioningDecisionFromContract(input: {
  contractStatus: OrganizationContractStatus;
  billingStatus: OrganizationBillingStatus;
  previousContractStatus?: OrganizationContractStatus | null;
}): OrganizationAccessProvisioningDecision {
  if (input.billingStatus === "grace_period") return "grace";
  if (input.contractStatus === "active") {
    if (
      input.previousContractStatus === "limited" ||
      input.previousContractStatus === "suspended" ||
      input.previousContractStatus === "cancelled" ||
      input.previousContractStatus === "expired"
    ) {
      return "reactivate";
    }
    return "activate";
  }
  switch (input.contractStatus) {
    case "offered":
      return "offer";
    case "accepted":
      return "accept";
    case "limited":
      return "limit";
    case "suspended":
      return "suspend";
    case "cancelled":
      return "cancel";
    case "expired":
      return "expire";
    case "draft":
    case "none":
    default:
      return "none";
  }
}

export function contractAuditEventTypeForChange(input: {
  previousContractStatus: OrganizationContractStatus | null;
  nextContractStatus: OrganizationContractStatus | null;
  previousBillingStatus: OrganizationBillingStatus | null;
  nextBillingStatus: OrganizationBillingStatus | null;
}): OrganizationContractAuditEventType | null {
  if (input.nextBillingStatus === "grace_period" && input.previousBillingStatus !== "grace_period") {
    return "grace";
  }
  if (input.nextContractStatus === "active") {
    if (
      input.previousContractStatus === "limited" ||
      input.previousContractStatus === "suspended" ||
      input.previousContractStatus === "cancelled" ||
      input.previousContractStatus === "expired"
    ) {
      return "reactivate";
    }
    return "activate";
  }
  switch (input.nextContractStatus) {
    case "offered":
      return "offer";
    case "accepted":
      return "accept";
    case "limited":
      return "limit";
    case "suspended":
      return "suspend";
    case "cancelled":
      return "cancel";
    case "expired":
      return "expire";
    default:
      return null;
  }
}

export function isProductionBillingTruth(input: {
  source: OrganizationBillingSource;
  runtimeMarker: "production_runtime" | "demo_or_test_runtime" | "external_checkout_pending";
  auditBacked: boolean;
}): boolean {
  if (input.runtimeMarker !== "production_runtime") return false;
  return input.source === "operator_verified_contract" && input.auditBacked;
}
