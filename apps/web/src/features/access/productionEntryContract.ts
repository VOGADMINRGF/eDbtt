import type { OrganizationDashboardReadModel } from "@features/region";
import { PRICING_PATH_CONTRACT, getPricingEntryTrustCopy } from "@features/pricing";
import type { MembershipStatus } from "@/lib/server/auth/membershipDirectoryRepository";

const DE_TRUST = getPricingEntryTrustCopy("de");

export const PRODUCTION_ENTRY_PATHS = {
  login: "/login",
  register: "/register",
  account: "/account",
  organization: "/account/organization",
  organizationDashboard: "/account/organization/dashboard",
  directOrder: PRICING_PATH_CONTRACT.primaryOrderPath,
  legacyOrderFallback: PRICING_PATH_CONTRACT.legacyFallbackPath,
} as const;

export const PRODUCTION_ENTRY_COPY = {
  loginRegisterHint:
    "Direkt starten heißt: anmelden, registrieren, Organisation anlegen oder beitreten und dann loslegen.",
  registerTrustHint:
    "Nach der Registrierung kannst du direkt mit Konto, Organisationsantrag oder Paketpfad weitergehen. Nichts wird automatisch veröffentlicht, bezahlt oder freigeschaltet.",
  accountLead:
    "Direkt loslegen heißt: Profil, Paketstatus, Organisationsantrag und sichere nächste Schritte an einem Ort.",
  organizationLead: `${DE_TRUST.freeCorePromise} ${DE_TRUST.organizationScopeOnly}`,
  organizationReviewHint:
    "Self-Provisioning bleibt review-first: Angaben zu Organisation, Region oder Wirkraum, verantwortlicher Person und Rolle sind zunächst Selbstauskunft. Rechte und Freischaltungen entstehen erst nach bewusster Betreiberentscheidung und bestätigter Membership. Kein verpflichtender Checkout.",
  organizationPathHint: `Produktionsreif ist: anmelden, Organisation anlegen oder beitreten, Status prüfen und danach direkt im Arbeitsbereich weitergehen. ${PRICING_PATH_CONTRACT.legacyFallbackPath} bleibt nur Bestandslink/Fallback.`,
  organizationClaimLead:
    `${DE_TRUST.freeCorePromise} Dieser Antrag dient nur bewusstem Org-Scope, Rollen und Freischaltungen.`,
  organizationClaimPathHint:
    "Hier startet der eine Organisations-Einstieg. Antrag, Status und spätere Freischaltung bleiben getrennte Schritte, damit Teams direkt starten können, sobald der Scope bewusst bestätigt ist.",
  organizationClaimGuardrail:
    `\`publication_approved\`, \`public_official\` und öffentliche Sichtbarkeit werden nie automatisch gesetzt. ${DE_TRUST.noHiddenAiCosts}`,
  adminAccessLead:
    "Rollen, Membership, Freischaltungen und Billing-Gates bleiben getrennt sichtbar. Rollen allein erzeugen keine stillen Freigaben, keine Veröffentlichung und keinen Vollzugriff.",
  adminEntitlementsLead:
    "Freischaltungen ergänzen verifizierte Memberships, ersetzen sie aber nicht. Pilot-, Test- und Admin-Freischaltungen bleiben review-first, ohne Checkout, automatische Abbuchung oder Rechnungslogik.",
} as const;

export type RegisterFlowBridge = {
  title: string;
  text: string;
};

export function resolveRegisterBridgeForProductionEntry(next: string | null): RegisterFlowBridge | null {
  if (!next) return null;
  const path = next.split("?")[0] || next;

  if (path.startsWith("/create")) {
    return {
      title: "Willkommen bei eDebatte",
      text: "Du kommst aus dem Eingabe-Flow. Mit einem Konto können wir deine Eingabe sicher speichern und danach direkt weiterführen.",
    };
  }
  if (path.startsWith("/mitglied-antrag") || path.startsWith("/mitglied-werden")) {
    return {
      title: "Willkommen bei eDebatte",
      text: "Du kommst aus dem Initiativ-Flow. Nach der Registrierung führen wir dich ohne Umweg zurück zum Mitgliedsantrag.",
    };
  }
  if (path.startsWith("/stream")) {
    return {
      title: "Willkommen bei eDebatte",
      text: "Du kommst aus dem Stream-Kontext. Für Beteiligung und Zuordnung ist ein Konto erforderlich.",
    };
  }
  if (path.startsWith(PRICING_PATH_CONTRACT.primaryOrderPath)) {
    return {
      title: "Willkommen bei eDebatte",
      text: `Du kommst aus dem direkten Paketpfad. ${PRODUCTION_ENTRY_COPY.loginRegisterHint} Danach führen wir dich ohne Legacy-Umweg zurück zu ${PRICING_PATH_CONTRACT.primaryOrderPath}.`,
    };
  }
  if (path.startsWith(PRICING_PATH_CONTRACT.legacyFallbackPath)) {
    return {
      title: "Willkommen bei eDebatte",
      text: `Du kommst über den Legacy-/Fallback-Pfad ${PRICING_PATH_CONTRACT.legacyFallbackPath}. ${PRODUCTION_ENTRY_COPY.loginRegisterHint} Danach kannst du direkt im aktuellen Paketpfad ${PRICING_PATH_CONTRACT.primaryOrderPath} oder im Organisationspfad weitermachen.`,
    };
  }
  if (path.startsWith("/pricing")) {
    return {
      title: "Willkommen bei eDebatte",
      text: `Du kommst aus dem Pricing-Kontext. ${PRODUCTION_ENTRY_COPY.loginRegisterHint} Paketwahl und Freischaltung bleiben bewusste nächste Schritte.`,
    };
  }
  return {
    title: "Willkommen bei eDebatte",
    text: "Damit wir deine Eingabe sicher weiterbearbeiten können, melde dich bitte an oder registriere dich.",
  };
}

type OrganizationAccessStatusInput = {
  provisioningStatus: OrganizationDashboardReadModel["provisioningSummary"]["currentStatus"];
  contractStatus: OrganizationDashboardReadModel["contractSummary"]["currentContractStatus"];
  billingStatus: OrganizationDashboardReadModel["contractSummary"]["billingStatus"];
  entitlementStatus: OrganizationDashboardReadModel["entitlementSummary"]["currentStatus"];
};

export function isOrganizationAccessBlocked(input: OrganizationAccessStatusInput): boolean {
  return (
    input.provisioningStatus === "suspended" ||
    input.contractStatus === "suspended" ||
    input.contractStatus === "cancelled" ||
    input.contractStatus === "expired" ||
    input.billingStatus === "suspended" ||
    input.billingStatus === "cancelled" ||
    input.billingStatus === "expired" ||
    input.entitlementStatus === "suspended" ||
    input.entitlementStatus === "revoked" ||
    input.entitlementStatus === "expired"
  );
}

export function isOrganizationVerificationPending(input: {
  verificationStatus: OrganizationDashboardReadModel["verificationStatus"];
  hasOrganizationSignal: boolean;
}): boolean {
  return (
    input.hasOrganizationSignal &&
    input.verificationStatus !== "organization_verified" &&
    input.verificationStatus !== "unit_verified" &&
    input.verificationStatus !== "publication_approved"
  );
}

export function isOrganizationAccessLimited(
  input: OrganizationAccessStatusInput & {
    hasWritableOrganizationContext?: boolean;
  },
): boolean {
  return (
    input.hasWritableOrganizationContext === false ||
    input.entitlementStatus === "limited" ||
    input.entitlementStatus === "pending_operator_decision" ||
    input.contractStatus === "limited" ||
    input.contractStatus === "draft" ||
    input.contractStatus === "offered" ||
    input.contractStatus === "accepted" ||
    input.billingStatus === "billing_pending" ||
    input.billingStatus === "grace_period" ||
    input.billingStatus === "overdue"
  );
}

export function hasVerifiedOrganizationMembershipStatus(status: MembershipStatus): boolean {
  return status === "verified";
}
