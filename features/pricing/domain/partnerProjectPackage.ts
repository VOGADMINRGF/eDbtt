import type {
  OrganizationBillingSource,
  PartnerFundingDisclosureRole,
  PartnerPackageAuditEventType,
  PartnerPackageScope,
  PartnerPackageStatus,
  PartnerPackageType,
  PartnerReportingState,
} from "./types";
import { isProductionBillingTruth } from "./organizationContract";

export const PARTNER_PACKAGE_TYPES = [
  "municipality_pilot",
  "association_workspace",
  "media_dossier_series",
  "newsroom_qr_dossier",
  "foundation_program",
  "participation_office",
  "agency_workspace",
  "public_dialog_project",
] as const;

export const PARTNER_PACKAGE_STATUSES = [
  "draft",
  "offered",
  "active",
  "limited",
  "reporting_required",
  "paused",
  "completed",
  "cancelled",
  "archived",
] as const;

export const PARTNER_PACKAGE_SCOPES = [
  "dossier_studio",
  "social_distribution",
  "source_connections",
  "runden_qr",
  "reporting_export",
] as const;

export const PARTNER_REPORTING_STATES = [
  "draft",
  "review_required",
  "approved",
  "archived",
] as const;

export function partnerPackageTypeLabel(type: PartnerPackageType): string {
  switch (type) {
    case "municipality_pilot":
      return "Kommunaler Pilot";
    case "association_workspace":
      return "Verbands- / Vereinsarbeitsraum";
    case "media_dossier_series":
      return "Medien-Dossier-Serie";
    case "newsroom_qr_dossier":
      return "Newsroom-QR-Dossier";
    case "foundation_program":
      return "Stiftungsprogramm";
    case "participation_office":
      return "Beteiligungsbüro";
    case "agency_workspace":
      return "Agentur-Arbeitsraum";
    case "public_dialog_project":
      return "Public-Dialog-Projekt";
    default:
      return "Projektpaket";
  }
}

export function partnerPackageStatusLabel(status: PartnerPackageStatus): string {
  switch (status) {
    case "draft":
      return "Paket angefragt";
    case "offered":
      return "Paket angeboten";
    case "active":
      return "Paket aktiv";
    case "limited":
      return "Leistungen eingeschränkt";
    case "reporting_required":
      return "Reporting erforderlich";
    case "paused":
      return "Paket pausiert";
    case "completed":
      return "Paket abgeschlossen";
    case "cancelled":
      return "Paket beendet";
    case "archived":
      return "Paket archiviert";
    default:
      return "Kein Paketstatus";
  }
}

export function partnerPackageScopeLabel(scope: PartnerPackageScope): string {
  switch (scope) {
    case "dossier_studio":
      return "Dossier Studio";
    case "social_distribution":
      return "Social Distribution";
    case "source_connections":
      return "Source Connections";
    case "runden_qr":
      return "Runden / QR / Share";
    case "reporting_export":
      return "Reporting / Export";
    default:
      return scope;
  }
}

export function partnerReportingStateLabel(state: PartnerReportingState): string {
  switch (state) {
    case "draft":
      return "Reporting in Vorbereitung";
    case "review_required":
      return "Reporting prüfen";
    case "approved":
      return "Reporting freigegeben";
    case "archived":
      return "Reporting archiviert";
    default:
      return "Kein Reportingstatus";
  }
}

export function partnerFundingDisclosureRoleLabel(role: PartnerFundingDisclosureRole): string {
  switch (role) {
    case "auftraggeber":
      return "Auftraggeber";
    case "partner":
      return "Partner";
    case "foerderer":
      return "Förderer";
    case "traeger":
      return "Träger";
    default:
      return "Partner";
  }
}

export function partnerPackageAuditEventTypeForStatus(
  previousStatus: PartnerPackageStatus | null,
  nextStatus: PartnerPackageStatus | null,
): PartnerPackageAuditEventType {
  switch (nextStatus) {
    case "draft":
      return previousStatus ? "update" : "create_draft";
    case "offered":
      return "offer";
    case "active":
      return "activate";
    case "limited":
      return "limit";
    case "reporting_required":
      return "reporting_required";
    case "paused":
      return "pause";
    case "completed":
      return "complete";
    case "cancelled":
      return "cancel";
    case "archived":
      return "archive";
    default:
      return "update";
  }
}

export function isProductionPartnerPackageTruth(input: {
  source: OrganizationBillingSource;
  runtimeMarker: "production_runtime" | "demo_or_test_runtime" | "external_checkout_pending";
  auditBacked: boolean;
}): boolean {
  return isProductionBillingTruth(input);
}

export function partnerProjectPackageAllowsScope(input: {
  status: PartnerPackageStatus;
  scopes: PartnerPackageScope[];
  source: OrganizationBillingSource;
  runtimeMarker: "production_runtime" | "demo_or_test_runtime" | "external_checkout_pending";
  auditBacked: boolean;
}, scope: PartnerPackageScope): boolean {
  if (
    input.status === "paused" ||
    input.status === "completed" ||
    input.status === "cancelled" ||
    input.status === "archived"
  ) {
    return false;
  }

  if (
    !isProductionPartnerPackageTruth({
      source: input.source,
      runtimeMarker: input.runtimeMarker,
      auditBacked: input.auditBacked,
    })
  ) {
    return false;
  }

  return input.scopes.includes(scope);
}
