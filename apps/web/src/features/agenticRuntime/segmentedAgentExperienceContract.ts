import type { OrganizationDashboardReadModel } from "@features/region";

export const SEGMENTED_AGENT_EXPERIENCE_SEGMENTS = ["b2c", "b2b", "b2g"] as const;
export const PERSONAL_VOXY_EXPERIENCE_MODES = [
  "passive",
  "relevant_only",
  "periodic_overview",
  "active_companion",
  "topic_watch",
] as const;

export const SEGMENTED_AGENT_SURFACE_IDS = [
  "account",
  "account_organization",
  "account_organization_dashboard",
  "admin_access",
  "admin_entitlements",
  "admin_system",
  "create",
  "runden",
  "dossier",
] as const;

export type SegmentedAgentExperienceSegment =
  (typeof SEGMENTED_AGENT_EXPERIENCE_SEGMENTS)[number];
export type PersonalVoxyExperienceMode =
  (typeof PERSONAL_VOXY_EXPERIENCE_MODES)[number];
export type SegmentedAgentSurfaceId = (typeof SEGMENTED_AGENT_SURFACE_IDS)[number];

export type SegmentedAgentSurfaceMode =
  | "personal_account"
  | "institutional_onboarding"
  | "institutional_workspace"
  | "operator_readiness"
  | "shared_create_entry"
  | "shared_public_reader";

export type SegmentedAgentSurfaceContract = {
  id: SegmentedAgentSurfaceId;
  route: string;
  title: string;
  mode: SegmentedAgentSurfaceMode;
  supportedSegments: readonly SegmentedAgentExperienceSegment[];
  personalVoxyPolicy:
    | "optional_consented"
    | "separate_from_institutional"
    | "not_forced"
    | "not_primary";
  guidedAssistance: "optional" | "not_primary";
  namedHumanContact: "optional" | "not_primary";
  publicReadingRemainsFree: boolean;
  publicReadingLabel: string;
  guardrails: {
    personalizationCannotHideMaterialFacts: true;
    strongCounterargumentsRemainVisible: true;
    sourceLimitationsRemainVisible: true;
    noPoliticalProfiling: true;
    noPremiumVoteWeighting: true;
    noVotingForUser: true;
    noExternalAuthorityNotification: true;
    noAutoPublication: true;
  };
};

export type SegmentedAgentExperienceDescriptor = {
  id: SegmentedAgentExperienceSegment;
  title: string;
  primaryExperience: string;
  guidedAssistance: "optional" | "not_primary";
  namedHumanContact: "optional" | "not_primary";
  personalVoxyForced: false;
};

type OrganizationType = OrganizationDashboardReadModel["organizationType"];

const SHARED_GUARDRAILS: SegmentedAgentSurfaceContract["guardrails"] = {
  personalizationCannotHideMaterialFacts: true,
  strongCounterargumentsRemainVisible: true,
  sourceLimitationsRemainVisible: true,
  noPoliticalProfiling: true,
  noPremiumVoteWeighting: true,
  noVotingForUser: true,
  noExternalAuthorityNotification: true,
  noAutoPublication: true,
};

const SEGMENTED_AGENT_EXPERIENCES: readonly SegmentedAgentExperienceDescriptor[] = [
  {
    id: "b2c",
    title: "B2C Personal Voxy",
    primaryExperience: "consented dialogue and relevance companion",
    guidedAssistance: "optional",
    namedHumanContact: "not_primary",
    personalVoxyForced: false,
  },
  {
    id: "b2b",
    title: "B2B Team- und Topic-Workbench",
    primaryExperience: "team and topic workbench",
    guidedAssistance: "optional",
    namedHumanContact: "optional",
    personalVoxyForced: false,
  },
  {
    id: "b2g",
    title: "B2G Jurisdiktions- und Debattenstand-Cockpit",
    primaryExperience: "jurisdiction, Debattenstand and response cockpit",
    guidedAssistance: "optional",
    namedHumanContact: "optional",
    personalVoxyForced: false,
  },
] as const;

const SEGMENTED_AGENT_SURFACES: readonly SegmentedAgentSurfaceContract[] = [
  {
    id: "account",
    route: "/account",
    title: "Persönliches Konto",
    mode: "personal_account",
    supportedSegments: ["b2c"],
    personalVoxyPolicy: "optional_consented",
    guidedAssistance: "optional",
    namedHumanContact: "not_primary",
    publicReadingRemainsFree: true,
    publicReadingLabel: "öffentliche Debattenstände bleiben auch ohne Konto frei lesbar",
    guardrails: SHARED_GUARDRAILS,
  },
  {
    id: "account_organization",
    route: "/account/organization",
    title: "Institutionelles Onboarding",
    mode: "institutional_onboarding",
    supportedSegments: ["b2b", "b2g"],
    personalVoxyPolicy: "separate_from_institutional",
    guidedAssistance: "optional",
    namedHumanContact: "optional",
    publicReadingRemainsFree: true,
    publicReadingLabel: "öffentliche Debattenstände bleiben auch ohne Freischaltung frei lesbar",
    guardrails: SHARED_GUARDRAILS,
  },
  {
    id: "account_organization_dashboard",
    route: "/account/organization/dashboard",
    title: "Institutioneller Arbeitsbereich",
    mode: "institutional_workspace",
    supportedSegments: ["b2b", "b2g"],
    personalVoxyPolicy: "separate_from_institutional",
    guidedAssistance: "optional",
    namedHumanContact: "optional",
    publicReadingRemainsFree: true,
    publicReadingLabel: "öffentliche Debattenstände bleiben neben dem Arbeitsbereich frei lesbar",
    guardrails: SHARED_GUARDRAILS,
  },
  {
    id: "admin_access",
    route: "/admin/access",
    title: "Admin Access Center",
    mode: "operator_readiness",
    supportedSegments: ["b2b", "b2g"],
    personalVoxyPolicy: "not_primary",
    guidedAssistance: "not_primary",
    namedHumanContact: "optional",
    publicReadingRemainsFree: true,
    publicReadingLabel: "öffentliche Debattenstände bleiben von Admin-Freigaben getrennt frei lesbar",
    guardrails: SHARED_GUARDRAILS,
  },
  {
    id: "admin_entitlements",
    route: "/admin/entitlements",
    title: "Admin Entitlements",
    mode: "operator_readiness",
    supportedSegments: ["b2b", "b2g"],
    personalVoxyPolicy: "not_primary",
    guidedAssistance: "not_primary",
    namedHumanContact: "optional",
    publicReadingRemainsFree: true,
    publicReadingLabel: "öffentliche Debattenstände bleiben auch ohne Entitlement frei lesbar",
    guardrails: SHARED_GUARDRAILS,
  },
  {
    id: "admin_system",
    route: "/admin/system",
    title: "Admin System",
    mode: "operator_readiness",
    supportedSegments: ["b2b", "b2g"],
    personalVoxyPolicy: "not_primary",
    guidedAssistance: "not_primary",
    namedHumanContact: "optional",
    publicReadingRemainsFree: true,
    publicReadingLabel: "öffentliche Debattenstände bleiben unabhängig von Runtime-Readiness frei lesbar",
    guardrails: SHARED_GUARDRAILS,
  },
  {
    id: "create",
    route: "/create",
    title: "Gemeinsamer Einstieg",
    mode: "shared_create_entry",
    supportedSegments: ["b2c", "b2b", "b2g"],
    personalVoxyPolicy: "not_forced",
    guidedAssistance: "optional",
    namedHumanContact: "optional",
    publicReadingRemainsFree: true,
    publicReadingLabel: "öffentliche Debattenstände bleiben auch neben dem Einstieg frei lesbar",
    guardrails: SHARED_GUARDRAILS,
  },
  {
    id: "runden",
    route: "/runden",
    title: "Öffentlicher Anlassraum",
    mode: "shared_public_reader",
    supportedSegments: ["b2c", "b2b", "b2g"],
    personalVoxyPolicy: "not_primary",
    guidedAssistance: "not_primary",
    namedHumanContact: "not_primary",
    publicReadingRemainsFree: true,
    publicReadingLabel: "öffentlicher Anlassraum bleibt frei lesbar",
    guardrails: SHARED_GUARDRAILS,
  },
  {
    id: "dossier",
    route: "/dossier/[id]",
    title: "Öffentlicher Debattenstand",
    mode: "shared_public_reader",
    supportedSegments: ["b2c", "b2b", "b2g"],
    personalVoxyPolicy: "not_primary",
    guidedAssistance: "not_primary",
    namedHumanContact: "not_primary",
    publicReadingRemainsFree: true,
    publicReadingLabel: "öffentlicher Debattenstand bleibt frei lesbar",
    guardrails: SHARED_GUARDRAILS,
  },
] as const;

const B2G_ORGANIZATION_TYPES = new Set<Exclude<OrganizationType, null>>([
  "public_administration",
  "municipality",
  "district_office",
  "city_administration",
  "county_administration",
  "ministry",
  "agency",
  "public_body",
  "school",
]);

export function listSegmentedAgentExperiences() {
  return [...SEGMENTED_AGENT_EXPERIENCES];
}

export function listSegmentedAgentSurfaces() {
  return [...SEGMENTED_AGENT_SURFACES];
}

export function getSegmentedAgentSurface(
  surfaceId: SegmentedAgentSurfaceId,
): SegmentedAgentSurfaceContract {
  const surface = SEGMENTED_AGENT_SURFACES.find((entry) => entry.id === surfaceId);
  if (!surface) {
    throw new Error(`segmented_agent_surface_not_found:${surfaceId}`);
  }
  return surface;
}

export function getSegmentedAgentSurfaceByRoute(
  route: string,
): SegmentedAgentSurfaceContract | null {
  const normalized = route.trim();
  return SEGMENTED_AGENT_SURFACES.find((entry) => entry.route === normalized) ?? null;
}

export function resolveInstitutionalSegmentForOrganizationType(
  organizationType: OrganizationType,
): Extract<SegmentedAgentExperienceSegment, "b2b" | "b2g"> {
  if (organizationType && B2G_ORGANIZATION_TYPES.has(organizationType)) {
    return "b2g";
  }
  return "b2b";
}

export function buildPersonalAccountSegmentHint() {
  return "Personal Voxy bleibt hier ein optionaler, consent-basierter Dialog- und Relevanzbegleiter. Organisations- und Behördenpfade bleiben getrennt.";
}

export function buildInstitutionalOnboardingSegmentHint() {
  return "B2B und B2G starten hier als Team- oder Jurisdiktionsarbeitsbereich mit optionaler geführter Hilfe oder benanntem Kontakt. Ein persönlicher Companion wird nicht erzwungen.";
}

export function buildInstitutionalWorkspaceSegmentHint(input: {
  organizationType: OrganizationType;
  isOperatorMode?: boolean;
}) {
  if (input.isOperatorMode) {
    return "Dieser Bereich bleibt ein institutioneller Arbeitsbereich mit optionaler geführter Hilfe oder benanntem Kontakt. Ein persönlicher Companion wird auch im Betreiberkontext nicht erzwungen.";
  }

  return resolveInstitutionalSegmentForOrganizationType(input.organizationType) === "b2g"
    ? "B2G-Cockpit: Jurisdiktion, Debattenstand und Antwortpfade bleiben vom persönlichen Companion getrennt. Geführte Hilfe oder benannter Kontakt bleiben optional."
    : "B2B-Workbench: Team-, Themen- und Review-Arbeit bleiben vom persönlichen Companion getrennt. Geführte Hilfe oder benannter Kontakt bleiben optional.";
}

export function buildAdminSegmentHint() {
  return "Diese Fläche steuert institutionelle Workbenches und Cockpits. Personal Voxy bleibt davon getrennt und wird für B2B/B2G nicht erzwungen.";
}

export function buildCreateSegmentHint() {
  return "Der Einstieg bleibt gemeinsam, aber segmentneutral: Personal Voxy ist optional im persönlichen Konto; B2B und B2G wechseln später in getrennte Arbeitsbereiche.";
}

export function buildPublicReadingGuardrailLines() {
  return [
    "Öffentlich lesbare Debattenstände bleiben frei zugänglich.",
    "Personalisierung blendet weder starke Gegenargumente noch Quellen- oder Evidenzgrenzen aus.",
  ] as const;
}

export function buildSegmentGuardrailLines() {
  return [
    "Keine politische Profiling-Falle.",
    "Keine Premium-Vote-Gewichtung.",
    "Kein Voting für Nutzer.",
    "Keine externe Behördenbenachrichtigung.",
    "Keine automatische Veröffentlichung.",
  ] as const;
}
