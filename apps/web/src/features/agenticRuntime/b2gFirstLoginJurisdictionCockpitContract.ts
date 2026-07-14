import {
  AGENT_SAFE_TRACE_CONFIDENCE_LABELS,
  buildAgentSafeTraceStep,
  type AgentSafeTraceStep,
} from "@/features/agenticRuntime/agentRunArtifactSafeTraceContract";
export {
  buildB2GFirstLoginAdminHint,
  buildB2GFirstLoginOnboardingHint,
  buildB2GFirstLoginWorkspaceHint,
  buildB2GPublicReadingHint,
  buildMunicipalHandoffDecisionBoundaryHint,
} from "@/features/agenticRuntime/b2gFirstLoginJurisdictionCockpitHints";

export const B2G_AUTHORITY_FIRST_LOGIN_STATES = [
  "verified_authority_first_login",
  "pending_authority_review",
  "operator_preview",
] as const;

export const B2G_JURISDICTION_MATCH_STATES = [
  "no_match",
  "public_jurisdiction_match",
  "verified_authority_scope",
] as const;

export const B2G_GUIDANCE_MODE_IDS = [
  "self_service",
  "guided_assistance",
  "named_contact",
  "managed_governance",
] as const;

export type B2GAuthorityFirstLoginState =
  (typeof B2G_AUTHORITY_FIRST_LOGIN_STATES)[number];
export type B2GJurisdictionMatchState =
  (typeof B2G_JURISDICTION_MATCH_STATES)[number];
export type B2GGuidanceModeId = (typeof B2G_GUIDANCE_MODE_IDS)[number];

export type B2GPublicDebattenstandEntry = {
  id: string;
  title: string;
  jurisdictionLabel: string;
  availablePublicly: true;
  adoptedInternally: false;
  reviewRequired: true;
};

export type B2GSuggestedAdoptionEntry = {
  id: string;
  title: string;
  basedOnPublicDebattenstandId: string | null;
  adoptedInternally: false;
  reviewRequired: true;
};

export type B2GReviewedTopicCandidate = {
  id: string;
  title: string;
  officialAuthorityProcess: false;
  reviewRequired: true;
};

export type B2GParticipationSuggestion = {
  id: string;
  title: string;
  basedOnTopicCandidateId: string | null;
  launchedParticipation: false;
  reviewRequired: true;
};

export type B2GGuidanceMode = {
  id: B2GGuidanceModeId;
  label: string;
  humanApprovalRequired: boolean;
  automaticAssignment: false;
  automaticEntitlementActivation: false;
  externalNotification: false;
};

export type B2GFirstLoginSummaryCard = {
  id: string;
  title: string;
  body: string;
};

export type B2GFirstLoginJurisdictionCockpitContract = {
  segment: "b2g";
  primaryRole: "dossier_briefing";
  supportingRoles: readonly ["research_source", "governance_compliance"];
  verifiedAuthorityFirstLogin: {
    state: B2GAuthorityFirstLoginState;
    activationConfirmed: false;
    summary: string;
  };
  jurisdiction: {
    matchState: B2GJurisdictionMatchState;
    jurisdictionAuthorityVerified: boolean;
    matchedJurisdictionLabels: string[];
    summary: string;
  };
  availableDebattenstaende: B2GPublicDebattenstandEntry[];
  suggestedAdoptions: B2GSuggestedAdoptionEntry[];
  reviewedTopicCandidates: B2GReviewedTopicCandidate[];
  participationSuggestions: B2GParticipationSuggestion[];
  guidanceModes: B2GGuidanceMode[];
  responseCockpit: {
    externalNotification: false;
    automaticAssignment: false;
    managedGovernanceRequiresApproval: true;
    summary: string;
  };
  municipalHandoff: {
    status: "needs_decision" | "done";
    entitlementActivationAllowed: false;
    recipientVerificationAutomatic: false;
    externalNotificationAutomatic: false;
    summary: string;
  };
  agenticCivicE2E: {
    status: "blocked" | "codex_ready";
    summary: string;
  };
  publicDebattenstandRemainsFree: true;
  personalVoxyForced: false;
  noAutomaticAuthorityVerification: true;
  noAutomaticEntitlementActivation: true;
  noExternalNotification: true;
  reviewRequired: true;
  safeTrace: AgentSafeTraceStep[];
};

function buildAuthoritySummary(state: B2GAuthorityFirstLoginState) {
  if (state === "operator_preview") {
    return "Betreiber-Vorschau kann den B2G-Pfad sichtbar machen, ersetzt aber weder verifizierte Behördenzuordnung noch Aktivierung.";
  }
  if (state === "pending_authority_review") {
    return "Ein Jurisdiktions- oder Behördenkontext kann sichtbar sein, bleibt vor Review aber read-only und ohne Aktivierung.";
  }
  return "Verifizierter Authority First Login bleibt ein read-only Einstieg und ist noch keine verifizierte Authority-Aktivierung.";
}

function buildJurisdictionSummary(
  state: B2GJurisdictionMatchState,
  matchedJurisdictions: readonly string[],
) {
  if (state === "verified_authority_scope") {
    return `Jurisdiktions-Zuordnung fuer ${matchedJurisdictions.join(", ")} ist sichtbar, bleibt aber getrennt von externer Benachrichtigung, Entitlement-Aktivierung und Managed-Governance-Freigabe.`;
  }
  if (state === "public_jurisdiction_match") {
    return `Jurisdiktions-Match ordnet öffentliche Debattenstände${matchedJurisdictions.length > 0 ? ` für ${matchedJurisdictions.join(", ")}` : ""} zu, verifiziert aber noch keine Zuständigkeit der Behörde.`;
  }
  return "Ohne belastbaren Jurisdiktions-Match bleibt das Cockpit bei frei lesbarer öffentlicher Orientierung ohne Authority-Verifikation.";
}

function buildGuidanceModes(): B2GGuidanceMode[] {
  return [
    {
      id: "self_service",
      label: "Self-Service",
      humanApprovalRequired: false,
      automaticAssignment: false,
      automaticEntitlementActivation: false,
      externalNotification: false,
    },
    {
      id: "guided_assistance",
      label: "Guided Assistance",
      humanApprovalRequired: true,
      automaticAssignment: false,
      automaticEntitlementActivation: false,
      externalNotification: false,
    },
    {
      id: "named_contact",
      label: "Named Contact",
      humanApprovalRequired: true,
      automaticAssignment: false,
      automaticEntitlementActivation: false,
      externalNotification: false,
    },
    {
      id: "managed_governance",
      label: "Managed Governance",
      humanApprovalRequired: true,
      automaticAssignment: false,
      automaticEntitlementActivation: false,
      externalNotification: false,
    },
  ];
}

export function buildB2GFirstLoginJurisdictionCockpitContract(input?: {
  authorityFirstLoginState?: B2GAuthorityFirstLoginState;
  jurisdictionMatchState?: B2GJurisdictionMatchState;
  matchedJurisdictionLabels?: readonly string[];
  availableDebattenstaende?: ReadonlyArray<{
    id: string;
    title: string;
    jurisdictionLabel: string;
  }>;
  suggestedAdoptions?: ReadonlyArray<{
    id: string;
    title: string;
    basedOnPublicDebattenstandId?: string | null;
  }>;
  reviewedTopicCandidates?: ReadonlyArray<{
    id: string;
    title: string;
  }>;
  participationSuggestions?: ReadonlyArray<{
    id: string;
    title: string;
    basedOnTopicCandidateId?: string | null;
  }>;
  municipalHandoffStatus?: "needs_decision" | "done";
}): B2GFirstLoginJurisdictionCockpitContract {
  const authorityFirstLoginState =
    input?.authorityFirstLoginState ?? "verified_authority_first_login";
  const jurisdictionMatchState =
    input?.jurisdictionMatchState ?? "public_jurisdiction_match";
  const matchedJurisdictionLabels = [...(input?.matchedJurisdictionLabels ?? [])];
  const municipalHandoffStatus = input?.municipalHandoffStatus ?? "done";
  const availableDebattenstaende = (input?.availableDebattenstaende ?? []).map((entry) => ({
    id: entry.id,
    title: entry.title,
    jurisdictionLabel: entry.jurisdictionLabel,
    availablePublicly: true as const,
    adoptedInternally: false as const,
    reviewRequired: true as const,
  }));
  const suggestedAdoptions = (input?.suggestedAdoptions ?? []).map((entry) => ({
    id: entry.id,
    title: entry.title,
    basedOnPublicDebattenstandId: entry.basedOnPublicDebattenstandId ?? null,
    adoptedInternally: false as const,
    reviewRequired: true as const,
  }));
  const reviewedTopicCandidates = (input?.reviewedTopicCandidates ?? []).map((entry) => ({
    id: entry.id,
    title: entry.title,
    officialAuthorityProcess: false as const,
    reviewRequired: true as const,
  }));
  const participationSuggestions = (input?.participationSuggestions ?? []).map((entry) => ({
    id: entry.id,
    title: entry.title,
    basedOnTopicCandidateId: entry.basedOnTopicCandidateId ?? null,
    launchedParticipation: false as const,
    reviewRequired: true as const,
  }));
  const guidanceModes = buildGuidanceModes();
  const agenticCivicE2EStatus =
    municipalHandoffStatus === "done" ? "codex_ready" : "blocked";

  const safeTrace: AgentSafeTraceStep[] = [
    buildAgentSafeTraceStep({
      taskId: "V3-B2G-FIRST-LOGIN-JURISDICTION-COCKPIT-01",
      stepId: "b2g_first_login_gate",
      surface: "/account/organization/dashboard",
      userSafeLabel:
        "Verified authority first login bleibt getrennt von Aktivierung, Entitlement und externer Benachrichtigung.",
      status: "review_required",
      confidenceLabel: AGENT_SAFE_TRACE_CONFIDENCE_LABELS[1],
      requiredHumanAction: "continue_manually",
      inputArtifacts: [
        {
          id: "b2g-first-login",
          type: "review_handoff",
          label: "B2G first login context",
          reviewState: "present",
        },
      ],
      outputArtifacts: [
        {
          id: "b2g-first-login-contract",
          type: "review_handoff",
          label: "B2G first-login cockpit contract",
          reviewState: "review_required",
        },
      ],
      evidenceRefs: [
        authorityFirstLoginState,
        jurisdictionMatchState,
        municipalHandoffStatus,
      ],
      primaryRole: "dossier_briefing",
      supportingRoles: ["research_source", "governance_compliance"],
    }),
    buildAgentSafeTraceStep({
      taskId: "V3-B2G-FIRST-LOGIN-JURISDICTION-COCKPIT-01",
      stepId: "b2g_jurisdiction_response_cockpit_gate",
      surface: "/admin/region",
      userSafeLabel:
        "Verfügbarer Debattenstand, empfohlene Adoption, vorgeschlagene Beteiligung und externer Handoff bleiben bewusst getrennte Zustände.",
      status: "review_required",
      confidenceLabel: AGENT_SAFE_TRACE_CONFIDENCE_LABELS[1],
      requiredHumanAction: "review_before_publish",
      inputArtifacts: [
        {
          id: "b2g-public-debattenstand-context",
          type: "review_handoff",
          label: "Available public Debattenstand context",
          reviewState: "present",
        },
      ],
      outputArtifacts: [
        {
          id: "b2g-response-cockpit-guardrails",
          type: "review_handoff",
          label: "Response cockpit stays read-only and review-first",
          reviewState: "review_required",
        },
      ],
      evidenceRefs: [
        ...availableDebattenstaende.map((entry) => entry.id),
        ...suggestedAdoptions.map((entry) => entry.id),
        ...reviewedTopicCandidates.map((entry) => entry.id),
        ...participationSuggestions.map((entry) => entry.id),
      ],
      primaryRole: "dossier_briefing",
      supportingRoles: ["research_source", "governance_compliance"],
    }),
  ];

  return {
    segment: "b2g",
    primaryRole: "dossier_briefing",
    supportingRoles: ["research_source", "governance_compliance"],
    verifiedAuthorityFirstLogin: {
      state: authorityFirstLoginState,
      activationConfirmed: false,
      summary: buildAuthoritySummary(authorityFirstLoginState),
    },
    jurisdiction: {
      matchState: jurisdictionMatchState,
      jurisdictionAuthorityVerified: jurisdictionMatchState === "verified_authority_scope",
      matchedJurisdictionLabels,
      summary: buildJurisdictionSummary(jurisdictionMatchState, matchedJurisdictionLabels),
    },
    availableDebattenstaende,
    suggestedAdoptions,
    reviewedTopicCandidates,
    participationSuggestions,
    guidanceModes,
    responseCockpit: {
      externalNotification: false,
      automaticAssignment: false,
      managedGovernanceRequiresApproval: true,
      summary:
        "Response cockpit bleibt ein interner, review-first Arbeitsbereich. Guided assistance ist keine menschliche Freigabe, benannter Kontakt keine automatische Zuweisung und Self-Service keine Managed Governance.",
    },
    municipalHandoff: {
      status: municipalHandoffStatus,
      entitlementActivationAllowed: false,
      recipientVerificationAutomatic: false,
      externalNotificationAutomatic: false,
      summary:
        municipalHandoffStatus === "done"
          ? "Municipal Handoff läuft auf einem separaten GOV-light-/Three-Slot-/Preflight-Contract: keine automatische Recipient Verification, keine automatische externe Notification und keine automatische Entitlement-Aktivierung."
          : "Municipal Handoff bleibt needs_decision: Pricing, Entitlement, Recipient Verification und External Notification Workflow sind noch nicht freigegeben.",
    },
    agenticCivicE2E: {
      status: agenticCivicE2EStatus,
      summary:
        agenticCivicE2EStatus === "codex_ready"
          ? "Alle dokumentierten B2G- und Municipal-Handoff-Gates sind fuer den naechsten E2E-Pfad frei."
          : "Agentic Civic E2E bleibt blocked, solange Municipal Handoff auf needs_decision steht.",
    },
    publicDebattenstandRemainsFree: true,
    personalVoxyForced: false,
    noAutomaticAuthorityVerification: true,
    noAutomaticEntitlementActivation: true,
    noExternalNotification: true,
    reviewRequired: true,
    safeTrace,
  };
}

export function buildB2GFirstLoginSummaryCards(
  contract: B2GFirstLoginJurisdictionCockpitContract,
): B2GFirstLoginSummaryCard[] {
  return [
    {
      id: "authority_first_login",
      title: "Authority First Login",
      body: contract.verifiedAuthorityFirstLogin.summary,
    },
    {
      id: "jurisdiction_match",
      title: "Jurisdiktions-Match",
      body: contract.jurisdiction.summary,
    },
    {
      id: "available_vs_adopted",
      title: "Verfügbar, empfohlen, angenommen",
      body:
        "Verfügbarer Debattenstand bleibt öffentlich lesbar. Interne Adoption bleibt ein bewusster Review-Schritt, und vorgeschlagene Beteiligung ist noch kein gestarteter Prozess.",
    },
    {
      id: "response_cockpit",
      title: "Response Cockpit",
      body: contract.responseCockpit.summary,
    },
  ];
}

export function buildAgenticCivicE2EStatusHint(
  contract: B2GFirstLoginJurisdictionCockpitContract,
) {
  return contract.agenticCivicE2E.summary;
}
