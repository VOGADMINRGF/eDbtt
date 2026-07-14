import { hasRequiredPrivacyAcknowledgement, type Consent } from "@/lib/privacy/consent";
import {
  PERSONAL_VOXY_MODES,
  type PersonalVoxyMode,
} from "@/features/agenticRuntime/agentRegistryBootstrapContract";
import {
  AGENT_SAFE_TRACE_CONFIDENCE_LABELS,
  buildAgentSafeTraceStep,
  type AgentSafeTraceStep,
} from "@/features/agenticRuntime/agentRunArtifactSafeTraceContract";

export const PERSONAL_VOXY_RELEVANCE_DEPTHS = [
  "headline_only",
  "balanced",
  "full_context",
] as const;

export const PERSONAL_VOXY_NOTIFICATION_POLICIES = [
  "off",
  "important_only",
  "weekly_digest",
] as const;

export const PERSONAL_VOXY_CONSENT_SCOPES = [
  "profile_memory",
  "topic_relevance",
  "regional_context",
  "notifications",
] as const;

export type PersonalVoxyRelevanceDepth =
  (typeof PERSONAL_VOXY_RELEVANCE_DEPTHS)[number];
export type PersonalVoxyNotificationPolicy =
  (typeof PERSONAL_VOXY_NOTIFICATION_POLICIES)[number];
export type PersonalVoxyConsentScope =
  (typeof PERSONAL_VOXY_CONSENT_SCOPES)[number];

export type PersonalVoxyConsentDecision = {
  scope: PersonalVoxyConsentScope;
  granted: boolean;
  persistenceAllowed: boolean;
  reason: string;
};

export type PersonalVoxyOnboardingStep = {
  id:
    | "choose_mode"
    | "choose_relevance_depth"
    | "confirm_boundaries"
    | "confirm_memory"
    | "confirm_notifications";
  label: string;
  status: "ready" | "requires_consent" | "blocked_for_segment";
};

export type PersonalVoxyProfileConsentOnboardingContract = {
  segment: "b2c" | "b2b" | "b2g";
  requestedMode: PersonalVoxyMode;
  effectiveMode: PersonalVoxyMode;
  availableModes: readonly PersonalVoxyMode[];
  relevanceDepth: PersonalVoxyRelevanceDepth;
  notificationPolicy: PersonalVoxyNotificationPolicy;
  privacyNoticeAcknowledged: boolean;
  explicitPersonalVoxyConsent: boolean;
  consentDecisions: PersonalVoxyConsentDecision[];
  profilePersistenceAllowed: boolean;
  notificationAllowed: boolean;
  companionAvailable: boolean;
  userControlsRelevanceDepth: true;
  noHiddenPoliticalProfiling: true;
  noExternalProfileSale: true;
  noUnapprovedNotification: true;
  materialFactsRemainVisible: true;
  strongCounterargumentsRemainVisible: true;
  institutionalCompanionForced: false;
  onboardingSteps: PersonalVoxyOnboardingStep[];
  reviewRequired: true;
  noProfilePersistenceWithoutConsent: true;
  safeTrace: AgentSafeTraceStep[];
};

function allowScope(input: {
  scope: PersonalVoxyConsentScope;
  segment: "b2c" | "b2b" | "b2g";
  privacyNoticeAcknowledged: boolean;
  explicitPersonalVoxyConsent: boolean;
  notificationPolicy: PersonalVoxyNotificationPolicy;
}): PersonalVoxyConsentDecision {
  if (input.segment !== "b2c") {
    return {
      scope: input.scope,
      granted: false,
      persistenceAllowed: false,
      reason:
        "Personal Voxy bleibt auf B2C begrenzt. B2B- und B2G-Pfade erzwingen keinen persoenlichen Companion.",
    };
  }

  if (!input.privacyNoticeAcknowledged) {
    return {
      scope: input.scope,
      granted: false,
      persistenceAllowed: false,
      reason:
        "Vor jeder persoenlichen Speicher- oder Relevanzlogik muss der aktuelle Datenschutzhinweis bestaetigt sein.",
    };
  }

  if (!input.explicitPersonalVoxyConsent) {
    return {
      scope: input.scope,
      granted: false,
      persistenceAllowed: false,
      reason:
        "Persoenliche Relevanz- oder Profilpersistenz bleibt bis zum expliziten Personal-Voxy-Consent gesperrt.",
    };
  }

  if (input.scope === "notifications" && input.notificationPolicy === "off") {
    return {
      scope: input.scope,
      granted: false,
      persistenceAllowed: false,
      reason: "Benachrichtigungen bleiben aus, solange der Nutzer keine Zustellform auswaehlt.",
    };
  }

  return {
    scope: input.scope,
    granted: true,
    persistenceAllowed: true,
    reason: "Bewusster B2C-Consent liegt vor; der Scope bleibt editierbar und widerrufbar.",
  };
}

function buildOnboardingSteps(input: {
  segment: "b2c" | "b2b" | "b2g";
  profilePersistenceAllowed: boolean;
  notificationAllowed: boolean;
}): PersonalVoxyOnboardingStep[] {
  const blockedForSegment = input.segment !== "b2c";

  return [
    {
      id: "choose_mode",
      label: "Modus waehlen",
      status: blockedForSegment ? "blocked_for_segment" : "ready",
    },
    {
      id: "choose_relevance_depth",
      label: "Relevanztiefe waehlen",
      status: blockedForSegment ? "blocked_for_segment" : "ready",
    },
    {
      id: "confirm_boundaries",
      label: "Grenzen bestaetigen",
      status: blockedForSegment ? "blocked_for_segment" : "ready",
    },
    {
      id: "confirm_memory",
      label: "Speicher-Consent bestaetigen",
      status: input.profilePersistenceAllowed ? "ready" : blockedForSegment ? "blocked_for_segment" : "requires_consent",
    },
    {
      id: "confirm_notifications",
      label: "Benachrichtigungen bestaetigen",
      status: input.notificationAllowed ? "ready" : blockedForSegment ? "blocked_for_segment" : "requires_consent",
    },
  ];
}

export function buildPersonalVoxyProfileConsentOnboardingContract(input?: {
  segment?: "b2c" | "b2b" | "b2g";
  requestedMode?: PersonalVoxyMode;
  requestedRelevanceDepth?: PersonalVoxyRelevanceDepth;
  requestedNotificationPolicy?: PersonalVoxyNotificationPolicy;
  privacyConsent?: Consent | null;
  explicitPersonalVoxyConsent?: boolean;
}): PersonalVoxyProfileConsentOnboardingContract {
  const segment = input?.segment ?? "b2c";
  const requestedMode = input?.requestedMode ?? "passive";
  const relevanceDepth = input?.requestedRelevanceDepth ?? "balanced";
  const notificationPolicy = input?.requestedNotificationPolicy ?? "off";
  const privacyNoticeAcknowledged = hasRequiredPrivacyAcknowledgement(
    input?.privacyConsent ?? null,
  );
  const explicitPersonalVoxyConsent = Boolean(
    input?.explicitPersonalVoxyConsent ?? false,
  );

  const consentDecisions = PERSONAL_VOXY_CONSENT_SCOPES.map((scope) =>
    allowScope({
      scope,
      segment,
      privacyNoticeAcknowledged,
      explicitPersonalVoxyConsent,
      notificationPolicy,
    }),
  );
  const profilePersistenceAllowed = consentDecisions
    .filter((decision) => decision.scope !== "notifications")
    .every((decision) => decision.persistenceAllowed);
  const notificationAllowed =
    consentDecisions.find((decision) => decision.scope === "notifications")
      ?.persistenceAllowed ?? false;
  const companionAvailable = segment === "b2c";
  const effectiveMode =
    companionAvailable && profilePersistenceAllowed ? requestedMode : "passive";

  const safeTrace: AgentSafeTraceStep[] = [
    buildAgentSafeTraceStep({
      taskId: "V3-PERSONAL-VOXY-PROFILE-CONSENT-ONBOARDING-01",
      stepId: "personal_voxy_consent_gate",
      surface: "/account",
      userSafeLabel:
        "Personal Voxy bleibt optional. Profilspeicher, Relevanzgedaechtnis und Benachrichtigungen brauchen einen bewussten B2C-Consent.",
      status: profilePersistenceAllowed ? "completed" : "review_required",
      confidenceLabel: profilePersistenceAllowed
        ? AGENT_SAFE_TRACE_CONFIDENCE_LABELS[2]
        : AGENT_SAFE_TRACE_CONFIDENCE_LABELS[1],
      requiredHumanAction: "continue_manually",
      inputArtifacts: [
        {
          id: "personal-voxy-consent-input",
          type: "human_input",
          label: "Consent- und Onboarding-Wahl",
          reviewState: "present",
        },
      ],
      outputArtifacts: [
        {
          id: "personal-voxy-consent-contract",
          type: "review_handoff",
          label: profilePersistenceAllowed
            ? "Consent-konformer B2C-Begleitmodus"
            : "Consent vor Persistenz erforderlich",
          reviewState: "review_required",
        },
      ],
      evidenceRefs: consentDecisions.map((decision) => decision.scope),
      primaryRole: "personal_voxy",
      supportingRoles: ["governance_compliance"],
    }),
    buildAgentSafeTraceStep({
      taskId: "V3-PERSONAL-VOXY-PROFILE-CONSENT-ONBOARDING-01",
      stepId: "personal_voxy_onboarding_boundaries",
      surface: "/profile",
      userSafeLabel:
        "Personalisierung darf Sprache und Tiefe anpassen, aber keine wesentlichen Fakten, Quellenlimits oder starken Gegenargumente ausblenden.",
      status: "review_required",
      confidenceLabel: AGENT_SAFE_TRACE_CONFIDENCE_LABELS[1],
      requiredHumanAction: "continue_manually",
      inputArtifacts: [
        {
          id: "personal-voxy-boundaries",
          type: "human_input",
          label: "Onboarding-Grenzen",
          reviewState: "present",
        },
      ],
      outputArtifacts: [
        {
          id: "personal-voxy-boundary-contract",
          type: "review_handoff",
          label: "No hidden profiling / no hidden facts",
          reviewState: "review_required",
        },
      ],
      evidenceRefs: [
        "no_political_profiling",
        "no_external_profile_sale",
        "material_facts_visible",
        "counterarguments_visible",
      ],
      primaryRole: "governance_compliance",
      supportingRoles: ["personal_voxy"],
    }),
  ];

  return {
    segment,
    requestedMode,
    effectiveMode,
    availableModes: PERSONAL_VOXY_MODES,
    relevanceDepth,
    notificationPolicy,
    privacyNoticeAcknowledged,
    explicitPersonalVoxyConsent,
    consentDecisions,
    profilePersistenceAllowed,
    notificationAllowed,
    companionAvailable,
    userControlsRelevanceDepth: true,
    noHiddenPoliticalProfiling: true,
    noExternalProfileSale: true,
    noUnapprovedNotification: true,
    materialFactsRemainVisible: true,
    strongCounterargumentsRemainVisible: true,
    institutionalCompanionForced: false,
    onboardingSteps: buildOnboardingSteps({
      segment,
      profilePersistenceAllowed,
      notificationAllowed,
    }),
    reviewRequired: true,
    noProfilePersistenceWithoutConsent: true,
    safeTrace,
  };
}
