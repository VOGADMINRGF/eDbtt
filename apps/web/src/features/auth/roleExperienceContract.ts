import { normalizeInternalRedirectPath } from "@/features/create/finalizeRedirect";
import type { UserRole } from "@/types/user";

export type ProductExperienceRole =
  | "citizens"
  | "journalists"
  | "organizations"
  | "municipalities"
  | "admin_backoffice";

export type RoleVisibilityContract = {
  accountDashboard: "visible" | "restricted";
  adminDashboard: "visible" | "hidden";
  pricingInstitutionalDetail: "visible" | "visible_with_review" | "optional";
  pricingOrderAdmin: "visible" | "hidden";
};

export type RoleExperienceContract = {
  id: ProductExperienceRole;
  label: string;
  expectedPostLoginRoute: `/${string}`;
  expectedPostRegistrationRoute: `/${string}`;
  primaryModules: readonly string[];
  primaryCtas: readonly string[];
  firstTask: string;
  visibility: RoleVisibilityContract;
  reviewNotes: readonly string[];
};

const ADMIN_ROLES = new Set<string>(["admin", "superadmin", "staff", "moderator", "finance", "billing", "accounting"]);
const JOURNALISM_ROLES = new Set<string>(["journalist", "redaktion", "editor", "kurator"]);
const ORGANIZATION_ROLES = new Set<string>(["ngo", "owner"]);
const MUNICIPAL_ROLES = new Set<string>(["politics", "legitimized"]);

export const ROLE_EXPERIENCE_MATRIX: readonly RoleExperienceContract[] = [
  {
    id: "citizens",
    label: "Bürger:innen",
    expectedPostLoginRoute: "/account",
    expectedPostRegistrationRoute: "/account?welcome=1",
    primaryModules: ["Profil & Sicherheit", "Paketstatus", "Interessen/Themen"],
    primaryCtas: ["Pakete & Preise", "Paket bestellen", "Mitgliedschaft beantragen"],
    firstTask: "Paketstatus prüfen und bei Bedarf ein Privatpaket bestellen.",
    visibility: {
      accountDashboard: "visible",
      adminDashboard: "hidden",
      pricingInstitutionalDetail: "optional",
      pricingOrderAdmin: "hidden",
    },
    reviewNotes: [
      "Privatpakete sind direkt bestellbar.",
      "Mitgliedschaft und Paketfreischaltung bleiben getrennt.",
    ],
  },
  {
    id: "journalists",
    label: "Freie Journalist:innen",
    expectedPostLoginRoute: "/account?context=journalismus",
    expectedPostRegistrationRoute: "/account?context=journalismus&welcome=1",
    primaryModules: ["Profil & Sicherheit", "Paketstatus Journalismus", "Anlassraum/Dossier-Start"],
    primaryCtas: ["Journalismus-Paket auswählen", "Optionales Faktencheck-Kontingent wählen"],
    firstTask: "Journalismus-Paket wählen und optionales Faktencheck-Kontingent festlegen.",
    visibility: {
      accountDashboard: "visible",
      adminDashboard: "hidden",
      pricingInstitutionalDetail: "optional",
      pricingOrderAdmin: "hidden",
    },
    reviewNotes: [
      "Journalismus bleibt direkt bestellbar, Gespräch ist optional.",
      "Faktencheck-Kontingente können Folgeabstimmung benötigen.",
    ],
  },
  {
    id: "organizations",
    label: "Organisationen / Verbände / Vereine",
    expectedPostLoginRoute: "/account?context=organisationen",
    expectedPostRegistrationRoute: "/account?context=organisationen&welcome=1",
    primaryModules: ["Paketstatus Institution", "Bestell-/Review-Status", "Kontakt-/Governance-Kontext"],
    primaryCtas: ["Institutionelle Preise im Detail", "Bestellung absenden", "Gespräch optional vereinbaren"],
    firstTask: "Institutionelles Paket beauftragen und Governance-/Kontextangaben ergänzen.",
    visibility: {
      accountDashboard: "visible",
      adminDashboard: "hidden",
      pricingInstitutionalDetail: "visible_with_review",
      pricingOrderAdmin: "hidden",
    },
    reviewNotes: [
      "Institutionelle Bestellungen sind öffentlich bestellbar.",
      "Aktivierung kann intern geprüft und angepasst werden.",
    ],
  },
  {
    id: "municipalities",
    label: "Kommunen / Verwaltungen",
    expectedPostLoginRoute: "/account?context=kommunen",
    expectedPostRegistrationRoute: "/account?context=kommunen&welcome=1",
    primaryModules: ["Paketstatus Kommune", "Bestell-/Review-Status", "Transparenz-/Report-Kontext"],
    primaryCtas: ["Institutionelle Preise im Detail", "Bestellung absenden", "Gespräch optional vereinbaren"],
    firstTask: "Kommunales Paket beauftragen und Aktivierungs-/Reporting-Kontext hinterlegen.",
    visibility: {
      accountDashboard: "visible",
      adminDashboard: "hidden",
      pricingInstitutionalDetail: "visible_with_review",
      pricingOrderAdmin: "hidden",
    },
    reviewNotes: [
      "Kommunale Bestellungen sind öffentlich bestellbar.",
      "Freischaltung kann intern reviewpflichtig bleiben.",
    ],
  },
  {
    id: "admin_backoffice",
    label: "Admin / Backoffice / Rechnungsprüfung",
    expectedPostLoginRoute: "/admin",
    expectedPostRegistrationRoute: "/admin",
    primaryModules: ["Admin-Dashboard", "Pricing Orders", "Governance/Review-Queues"],
    primaryCtas: ["Pricing Orders öffnen", "Status ändern", "Freigabe/Ablehnung dokumentieren"],
    firstTask: "Neue Bestellungen in Pricing Orders prüfen und Status/Notizen aktualisieren.",
    visibility: {
      accountDashboard: "restricted",
      adminDashboard: "visible",
      pricingInstitutionalDetail: "optional",
      pricingOrderAdmin: "visible",
    },
    reviewNotes: [
      "Admin sieht Bestellungen, Notizen und Statusübergänge.",
      "Billing-/Finance-Feinprozesse bleiben außerhalb dieses Slices.",
    ],
  },
] as const;

function collectRoleTokens(input: {
  roles?: Array<UserRole | { role?: string } | string> | null;
  primaryRole?: UserRole | string | null;
}) {
  const result = new Set<string>();

  if (input.primaryRole) {
    result.add(String(input.primaryRole));
  }

  if (Array.isArray(input.roles)) {
    input.roles.forEach((entry) => {
      if (typeof entry === "string") {
        if (entry) result.add(entry);
        return;
      }
      const role = entry?.role;
      if (role) result.add(String(role));
    });
  }

  return Array.from(result);
}

export function resolveExperienceRoleId(input: {
  roles?: Array<UserRole | { role?: string } | string> | null;
  primaryRole?: UserRole | string | null;
}): ProductExperienceRole {
  const roles = collectRoleTokens(input);

  if (roles.some((role) => ADMIN_ROLES.has(role))) return "admin_backoffice";
  if (roles.some((role) => MUNICIPAL_ROLES.has(role))) return "municipalities";
  if (roles.some((role) => ORGANIZATION_ROLES.has(role))) return "organizations";
  if (roles.some((role) => JOURNALISM_ROLES.has(role))) return "journalists";
  return "citizens";
}

export function getRoleExperienceContract(roleId: ProductExperienceRole) {
  return ROLE_EXPERIENCE_MATRIX.find((entry) => entry.id === roleId) ?? ROLE_EXPERIENCE_MATRIX[0];
}

function isAdminOnlyRoute(path: string) {
  return path.startsWith("/admin") || path.startsWith("/dashboard");
}

export function resolvePostLoginRedirect(input: {
  requestedRedirect?: string | null;
  roles?: Array<UserRole | { role?: string } | string> | null;
  primaryRole?: UserRole | string | null;
}) {
  const roleId = resolveExperienceRoleId(input);
  const contract = getRoleExperienceContract(roleId);
  const requested = normalizeInternalRedirectPath(input.requestedRedirect);

  if (requested) {
    if (isAdminOnlyRoute(requested) && roleId !== "admin_backoffice") {
      return contract.expectedPostLoginRoute;
    }
    return requested;
  }

  return contract.expectedPostLoginRoute;
}

export function resolvePostRegistrationRedirect(input: {
  requestedRedirect?: string | null;
  roleId?: ProductExperienceRole;
}) {
  const roleId = input.roleId ?? "citizens";
  const contract = getRoleExperienceContract(roleId);
  const requested = normalizeInternalRedirectPath(input.requestedRedirect);

  if (requested) {
    if (isAdminOnlyRoute(requested) && roleId !== "admin_backoffice") {
      return contract.expectedPostRegistrationRoute;
    }
    return requested;
  }

  return contract.expectedPostRegistrationRoute;
}
