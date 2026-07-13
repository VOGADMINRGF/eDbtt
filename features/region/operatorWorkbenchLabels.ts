import type {
  OrganizationProvisioningStatus,
  VerificationStatus,
} from "./organizationOnboarding";

export function organizationVerificationStatusLabel(
  value: VerificationStatus | "none" | "admin_fallback" | null | undefined,
): string {
  switch (value) {
    case "publication_approved":
      return "Publikationsfreigabe bestätigt";
    case "limited":
      return "Eingeschränkt";
    case "suspended":
      return "Gesperrt";
    case "unit_verified":
      return "Unit-verifiziert";
    case "organization_verified":
      return "Organisations-verifiziert";
    case "email_verified":
      return "E-Mail verifiziert";
    case "pending_review":
      return "In Prüfung";
    case "rejected":
      return "Abgelehnt";
    case "revoked":
      return "Widerrufen";
    case "admin_fallback":
      return "Betreiberkontext";
    case "unverified":
      return "Unverifiziert";
    case "none":
    default:
      return "Noch kein Status";
  }
}

export function organizationProvisioningStatusLabel(
  value: OrganizationProvisioningStatus | "none" | null | undefined,
): string {
  switch (value) {
    case "draft":
      return "Antrag gestartet";
    case "submitted":
      return "Prüfung läuft";
    case "verification_required":
      return "Prüfung erforderlich";
    case "operator_review_required":
      return "Betreiberprüfung läuft";
    case "approved":
      return "Freigeschaltet";
    case "limited":
      return "Eingeschränkt";
    case "rejected":
      return "Abgelehnt";
    case "suspended":
      return "Gesperrt";
    case "none":
    default:
      return "Noch kein Antrag";
  }
}

export function regionEntitlementReasonLabel(value: string | null | undefined): string {
  switch (value) {
    case "admin_fallback":
      return "Globale Adminsicht ohne gesonderte Freischaltung.";
    case "active":
      return "Freischaltung aktiv.";
    case "trial":
      return "Test- oder Pilotfreischaltung aktiv.";
    case "missing_entitlement":
      return "Verifizierte Membership vorhanden, aber Freischaltung fehlt.";
    case "expired":
      return "Freischaltung ist abgelaufen.";
    case "suspended":
      return "Freischaltung ist vorübergehend gesperrt.";
    case "past_due":
      return "Freischaltung steht auf überfällig und ist deshalb blockiert.";
    case "over_limit":
      return "Limit erreicht. Lesen oder Aktionen bleiben eingeschränkt.";
    case "wrong_region":
      return "Freischaltung passt nicht zur aktuellen Region.";
    case "wrong_organization":
      return "Freischaltung passt nicht zur aktuellen Organisation.";
    case "membership_not_verified":
      return "Freischaltung allein reicht nicht ohne verifizierte Membership.";
    case "unsupported_organization_type":
      return "Dieser Organisationstyp braucht einen gesonderten Review-Pfad.";
    default:
      return "Freischaltung wurde noch nicht geprüft.";
  }
}

export function regionEntitlementStatusLabel(value: string | null | undefined): string {
  switch (value) {
    case "admin_fallback":
      return "Admin-Fallback";
    case "active":
      return "Aktiv";
    case "trial":
      return "Testweise aktiv";
    case "past_due":
      return "Überfällig";
    case "suspended":
      return "Suspendiert";
    case "cancelled":
      return "Gekündigt";
    case "expired":
      return "Abgelaufen";
    case "revoked":
      return "Widerrufen";
    case "inactive":
      return "Inaktiv";
    default:
      return "Keine Freischaltung";
  }
}

export function regionReviewStatusLabel(value: string | null | undefined): string {
  switch (value) {
    case "accepted":
      return "Akzeptiert";
    case "rejected":
      return "Abgelehnt";
    case "archived":
      return "Archiviert";
    case "needs_region_review":
      return "Region prüfen";
    case "revoked":
      return "Widerrufen";
    case "needs_review":
      return "Review erforderlich";
    default:
      return "Entwurf";
  }
}

export function regionVisibilityStateLabel(value: string | null | undefined): string {
  switch (value) {
    case "private_draft":
      return "Nur intern als Entwurf";
    case "internal_review":
      return "Intern in Prüfung";
    case "public_unverified":
      return "Öffentlich ungeprüft";
    case "public_reviewed":
      return "Öffentlich geprüft";
    case "public_official":
      return "Offiziell freigegeben";
    case "archived":
      return "Archiviert";
    case "blocked":
      return "Gesperrt";
    default:
      return "Sichtbarkeit offen";
  }
}

export function regionFeedSignalOriginLabel(value: string | null | undefined): string {
  switch (value) {
    case "pilot_fixture":
      return "Pilotvorschau · kuratierte Startlage · keine Produktionsdaten";
    case "source_connection_runtime":
      return "Explizit verbundene Quelle · Review erforderlich";
    default:
      return "Bestehender Review-Pfad";
  }
}

export function regionOpenReviewOriginLabel(isFixture: boolean): string {
  return isFixture ? "Pilotvorschau / kuratierte Startlage" : "Review aus aktiver Quelle";
}

export function regionGuardrailLabel(
  value:
    | "reviewRequired"
    | "noAutoPublish"
    | "noAutoDossierCreation"
    | "noAutoAnlassraumCreation"
    | "noTenderMonitoring"
    | "noProcurementMonitoring",
): string {
  switch (value) {
    case "reviewRequired":
      return "Review erforderlich";
    case "noAutoPublish":
      return "Kein Auto-Publish";
    case "noAutoDossierCreation":
      return "Kein Auto-Dossier";
    case "noAutoAnlassraumCreation":
      return "Kein Auto-Anlassraum";
    case "noTenderMonitoring":
      return "Kein Tender-Monitoring";
    case "noProcurementMonitoring":
    default:
      return "Kein Procurement-Monitoring";
  }
}
