import {
  GOV_LIGHT_EXCLUDED_CAPABILITIES,
  GOV_LIGHT_INCLUDED_CAPABILITIES,
  usesGovLightActiveSlot,
  type GovLightUsageActionId,
  type VerifiedPublisherPreflightStatus,
} from "@/features/agenticRuntime/civicPrinciplesGovLightMunicipalHandoffContract";

export const MUNICIPAL_HANDOFF_TRIAL_SLOT_STATES = [
  "available",
  "reserved_internal_draft",
  "active",
  "archived_ended",
] as const;

export type MunicipalHandoffTrialSlotState =
  (typeof MUNICIPAL_HANDOFF_TRIAL_SLOT_STATES)[number];

export type MunicipalHandoffTrialSlot = {
  slotNumber: 1 | 2 | 3;
  state: MunicipalHandoffTrialSlotState;
  consumesActiveCapacity: boolean;
  publicReadingRemainsFree: true;
  summary: string;
};

export type MunicipalHandoffThreeAdoptionTrialSummaryCard = {
  id: string;
  title: string;
  body: string;
};

export type MunicipalHandoffThreeAdoptionTrialContract = {
  primaryRole: "dossier_briefing";
  supportingRoles: readonly ["governance_compliance", "participation_moderation"];
  govLightTrial: {
    slotLimit: 3;
    slots: MunicipalHandoffTrialSlot[];
    activeCount: number;
    remainingSlots: number;
    includedCapabilities: readonly string[];
    excludedCapabilities: readonly string[];
    slotUsageActions: readonly GovLightUsageActionId[];
    slotConsumptionRule: string;
  };
  govLightReport: {
    mode: "light";
    exportPackageAvailable: false;
    fullReportAvailable: false;
    deepSegmentationAvailable: false;
    summary: string;
  };
  verifiedPublisherPreflight: {
    consciousPublishClickRequired: true;
    agentMayAutoPublish: false;
    allowedStatuses: readonly VerifiedPublisherPreflightStatus[];
    summary: string;
  };
  authorityContinuationCandidate: {
    systemTopicCandidateRequired: true;
    jurisdictionPlausibilityRequired: true;
    feasibilityNoteRequired: true;
    principlesPreflightRequired: true;
    continuationCandidateOnly: true;
    officialAuthorityProcessCreated: false;
    externalNotificationTriggered: false;
    summary: string;
  };
  handoffBoundary: {
    internalCrmPipelineOnly: true;
    humanApprovalRequired: true;
    recipientVerificationAutomatic: false;
    externalNotificationAutomatic: false;
    entitlementActivationAutomatic: false;
    adoptionAutomatic: false;
    agentMayAutoPublish: false;
    allowedInternalArtifacts: readonly [
      "pipeline_card",
      "follow_up_reminder",
      "contact_draft",
      "operator_visualization",
      "responsibility_tracking",
    ];
    summary: string;
  };
  publicReading: {
    remainsFreeReadable: true;
    readOnlyViewingConsumesSlot: false;
    teaserOpenConsumesSlot: false;
    internalBookmarkConsumesSlot: false;
    summary: string;
  };
};

function buildSlotSummary(slotNumber: number, state: MunicipalHandoffTrialSlotState) {
  if (state === "active") {
    return `Slot ${slotNumber} ist aktiv und zählt erst jetzt als verbrauchter GOV-light-Slot.`;
  }
  if (state === "reserved_internal_draft") {
    return `Slot ${slotNumber} bleibt als interner Draft reserviert und verbraucht noch keinen aktiven GOV-light-Slot.`;
  }
  if (state === "archived_ended") {
    return `Slot ${slotNumber} ist archiviert oder beendet und blockiert keinen aktiven GOV-light-Slot mehr.`;
  }
  return `Slot ${slotNumber} ist frei; öffentliche Lesbarkeit und interne Vorbereitung bleiben ohne Aktivierung möglich.`;
}

export function buildMunicipalHandoffThreeAdoptionTrialContract(input?: {
  slotStates?: readonly MunicipalHandoffTrialSlotState[];
}): MunicipalHandoffThreeAdoptionTrialContract {
  const slotStates = input?.slotStates ?? ["available", "reserved_internal_draft", "active"];
  const slots: MunicipalHandoffTrialSlot[] = [1, 2, 3].map((slotNumber, index) => {
    const state = slotStates[index] ?? "available";
    return {
      slotNumber: slotNumber as 1 | 2 | 3,
      state,
      consumesActiveCapacity: state === "active",
      publicReadingRemainsFree: true,
      summary: buildSlotSummary(slotNumber, state),
    };
  });
  const activeCount = slots.filter((slot) => slot.consumesActiveCapacity).length;

  return {
    primaryRole: "dossier_briefing",
    supportingRoles: ["governance_compliance", "participation_moderation"],
    govLightTrial: {
      slotLimit: 3,
      slots,
      activeCount,
      remainingSlots: Math.max(0, 3 - activeCount),
      includedCapabilities: GOV_LIGHT_INCLUDED_CAPABILITIES,
      excludedCapabilities: GOV_LIGHT_EXCLUDED_CAPABILITIES,
      slotUsageActions: [
        "read_public_debate_status",
        "open_gov_light_teaser",
        "review_agent_suggestion",
        "inspect_public_debate_status",
        "bookmark_internal_topic",
        "publish_gov_light_topic",
        "activate_gov_light_topic",
      ],
      slotConsumptionRule:
        "Nur bewusste GOV-light-Veröffentlichung oder Aktivierung verbraucht einen aktiven Slot; Lesen, Teaser und interne Draft-Reservierung bleiben frei.",
    },
    govLightReport: {
      mode: "light",
      exportPackageAvailable: false,
      fullReportAvailable: false,
      deepSegmentationAvailable: false,
      summary:
        "GOV-light bleibt bewusst leichtgewichtig: kein Export-Paket, kein Vollreport und keine tiefe Segmentierung als stiller Standard.",
    },
    verifiedPublisherPreflight: {
      consciousPublishClickRequired: true,
      agentMayAutoPublish: false,
      allowedStatuses: [
        "green_direct_live",
        "yellow_adjust_or_review",
        "red_blocked_manual_review",
      ],
      summary:
        "Verified Publisher Preflight bleibt Grün/Gelb/Rot nach bewusstem Publish-Klick; kein Agent darf automatisch veröffentlichen oder den Preflight überspringen.",
    },
    authorityContinuationCandidate: {
      systemTopicCandidateRequired: true,
      jurisdictionPlausibilityRequired: true,
      feasibilityNoteRequired: true,
      principlesPreflightRequired: true,
      continuationCandidateOnly: true,
      officialAuthorityProcessCreated: false,
      externalNotificationTriggered: false,
      summary:
        "Authority Continuation bleibt ein Kandidat mit System-Themenvorschlag, Jurisdiktions-Plausibilität, Machbarkeitsnotiz und Principles-Preflight, aber noch kein offizieller Behördenprozess.",
    },
    handoffBoundary: {
      internalCrmPipelineOnly: true,
      humanApprovalRequired: true,
      recipientVerificationAutomatic: false,
      externalNotificationAutomatic: false,
      entitlementActivationAutomatic: false,
      adoptionAutomatic: false,
      agentMayAutoPublish: false,
      allowedInternalArtifacts: [
        "pipeline_card",
        "follow_up_reminder",
        "contact_draft",
        "operator_visualization",
        "responsibility_tracking",
      ],
      summary:
        "Municipal Handoff bleibt ein interner CRM-/Pipeline-Pfad mit Human Approval: keine automatische Recipient Verification, keine externe Notification, keine automatische Entitlement-Aktivierung und kein Agent-Auto-Publish.",
    },
    publicReading: {
      remainsFreeReadable: true,
      readOnlyViewingConsumesSlot: false,
      teaserOpenConsumesSlot: false,
      internalBookmarkConsumesSlot: false,
      summary:
        "Öffentliche Lesbarkeit, GOV-light-Teaser und internes Bookmarking bleiben frei; erst aktives Publish oder Activate verbraucht einen der drei Slots.",
    },
  };
}

export function buildMunicipalHandoffThreeAdoptionTrialSummaryCards(
  contract: MunicipalHandoffThreeAdoptionTrialContract,
): MunicipalHandoffThreeAdoptionTrialSummaryCard[] {
  return [
    {
      id: "gov_light_slots",
      title: "Three-Slot Trial",
      body: `${contract.govLightTrial.activeCount}/${contract.govLightTrial.slotLimit} aktive GOV-light-Slots, ${contract.govLightTrial.remainingSlots} frei. ${contract.govLightTrial.slotConsumptionRule}`,
    },
    {
      id: "publisher_preflight",
      title: "Verified Publisher Preflight",
      body: contract.verifiedPublisherPreflight.summary,
    },
    {
      id: "authority_continuation",
      title: "Authority Continuation Candidate",
      body: contract.authorityContinuationCandidate.summary,
    },
    {
      id: "handoff_boundary",
      title: "Municipal Handoff Boundary",
      body: contract.handoffBoundary.summary,
    },
  ];
}

export function buildMunicipalHandoffTrialOnboardingHint() {
  return "Öffentliche Lesbarkeit, GOV-light-Teaser und internes Bookmarking bleiben frei; ein aktiver GOV-light-Slot wird erst bei bewusstem Publish oder Activate verbraucht.";
}

export function buildMunicipalHandoffTrialWorkspaceHint() {
  return "Municipal Handoff folgt jetzt einem GOV-light-/Three-Slot-/Preflight-Contract: interne Adoption, veröffentlichter GOV-light-Slot und externer Behördenkontakt bleiben getrennte Zustände.";
}

export function buildMunicipalHandoffTrialAdminHint() {
  return "GOV-light-Aktivierung ist weder Billing noch automatische Entitlement-Aktivierung; Municipal Handoff bleibt CRM-/Pipeline-intern und human-approved.";
}

export function buildMunicipalHandoffTrialRegionHint() {
  return "Authority Continuation bleibt ein Kandidat mit System-Thema, Jurisdiktions-Plausibilität und Machbarkeitsnotiz, aber noch kein offizieller Behördenprozess.";
}

export function buildMunicipalHandoffTrialReviewHint() {
  return "Verified Publisher Preflight bleibt Grün/Gelb/Rot nach bewusstem Publish-Klick; kein Review-Item schaltet still externe Notification oder Auto-Publish frei.";
}

export function buildMunicipalHandoffTrialPublicReadingHint() {
  return "Read-only Lesen, Teilen und QR für bereits sichtbare öffentliche Stände verbrauchen keinen GOV-light-Slot und starten keinen Municipal Handoff.";
}

export function usesMunicipalHandoffTrialActiveSlot(action: GovLightUsageActionId) {
  return usesGovLightActiveSlot(action);
}
