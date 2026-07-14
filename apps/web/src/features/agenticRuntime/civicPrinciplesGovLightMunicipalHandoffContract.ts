export const EDEBATTE_PUBLIC_DISCOURSE_FORMAT_IDS = [
  "weighing_question",
  "priority_question",
  "option_comparison",
  "condition_question",
  "implementation_path",
  "mood_snapshot_with_context",
  "debate_status_with_arguments",
  "participation_topic_with_action_space",
] as const;

export const EDEBATTE_NON_DEFAULT_BINARY_FORMAT_IDS = [
  "yes_no_poll",
  "simple_approval_rejection",
  "pillory_question",
  "suggestive_question",
  "outrage_counter",
] as const;

export const EDEBATTE_CIVIC_PRINCIPLE_IDS = [
  "democratic_participation",
  "transparency",
  "no_manipulation",
  "no_discrimination",
  "no_hate",
  "no_hidden_political_profiling",
  "no_false_officiality",
  "no_sensitive_personal_data_without_basis",
  "no_premium_vote_weighting",
  "no_fake_sources",
  "no_fake_participation",
  "no_suggestive_or_pillory_questions",
  "counterarguments_and_limits_stay_visible",
  "plausible_public_relevance_required",
  "public_debate_status_remains_free",
] as const;

export const GOV_LIGHT_INCLUDED_CAPABILITIES = [
  "public_basic_surface",
  "gov_verified_badge",
  "simple_participation_or_mood_overview",
  "reduced_evaluation",
  "simple_authority_response",
  "visible_civic_value",
] as const;

export const GOV_LIGHT_EXCLUDED_CAPABILITIES = [
  "full_segmentation",
  "full_report",
  "deep_evaluation",
  "export_package",
  "official_gazette_or_embed_package",
  "crm_stakeholder_or_api_package",
  "unlimited_active_topics",
  "automatic_external_authority_notification",
  "automatic_entitlement_activation",
] as const;

export const GOV_LIGHT_USAGE_ACTION_IDS = [
  "read_public_debate_status",
  "open_gov_light_teaser",
  "review_agent_suggestion",
  "inspect_public_debate_status",
  "bookmark_internal_topic",
  "publish_gov_light_topic",
  "activate_gov_light_topic",
] as const;

export const VERIFIED_PUBLISHER_TYPES = [
  "verified_authority",
  "verified_editorial",
  "verified_media_house",
  "verified_comparable_publisher",
] as const;

export const VERIFIED_PUBLISHER_PREFLIGHT_STATUSES = [
  "green_direct_live",
  "yellow_adjust_or_review",
  "red_blocked_manual_review",
] as const;

export type EdebatePublicDiscourseFormatId =
  (typeof EDEBATTE_PUBLIC_DISCOURSE_FORMAT_IDS)[number];
export type EdebateBinaryDefaultFormatId =
  (typeof EDEBATTE_NON_DEFAULT_BINARY_FORMAT_IDS)[number];
export type EdebateCivicPrincipleId = (typeof EDEBATTE_CIVIC_PRINCIPLE_IDS)[number];
export type GovLightUsageActionId = (typeof GOV_LIGHT_USAGE_ACTION_IDS)[number];
export type VerifiedPublisherType = (typeof VERIFIED_PUBLISHER_TYPES)[number];
export type VerifiedPublisherPreflightStatus =
  (typeof VERIFIED_PUBLISHER_PREFLIGHT_STATUSES)[number];

export type EdebateCivicPrinciple = {
  id: EdebateCivicPrincipleId;
  label: string;
  summary: string;
};

export type CivicPrinciplesGovLightMunicipalHandoffContract = {
  primaryRole: "governance_compliance";
  supportingRoles: readonly ["dossier_briefing", "participation_moderation"];
  publicDiscourse: {
    notABinaryOutrageMachine: true;
    preferredFormats: readonly EdebatePublicDiscourseFormatId[];
    disallowedDefaultFormats: readonly EdebateBinaryDefaultFormatId[];
    binaryReviewGatesRemainInternalOnly: true;
  };
  majorityWithinPrinciples: {
    majorityOrientationAllowed: true;
    principleOverridesForbidden: readonly [
      "discrimination",
      "manipulation",
      "hide_material_facts",
      "hide_minority_arguments",
      "violate_protection_rights",
      "fake_official_or_legal_effect",
      "fake_referendum_binding",
    ];
  };
  civicPrinciples: EdebateCivicPrinciple[];
  authorityContinuation: {
    govVerifiedAuthorityRequired: true;
    continuationAllowedInsideJurisdiction: true;
    automaticImplementation: false;
    legalClaimCreated: false;
    officialDecisionCreated: false;
    bindingReferendumCreated: false;
    externalNotificationCreated: false;
  };
  govLight: {
    verifiedAuthorityRequired: true;
    activeSlotLimit: 3;
    activePublishedTopics: number;
    activeSlotsRemaining: number;
    includedCapabilities: readonly string[];
    excludedCapabilities: readonly string[];
    slotUsageAction: GovLightUsageActionId;
    slotConsumedByAction: boolean;
    hardClosePressureAllowed: false;
    valueFirstUpgradeTouchpoints: readonly [
      "reminder",
      "nps",
      "transparency_or_impact_review",
      "agent_value_explanation",
      "upgrade_hint_for_advanced_capabilities",
    ];
  };
  verifiedPublisherPreflight: {
    publisherType: VerifiedPublisherType;
    consciousPublishClickRequired: true;
    agentMayAutoPublish: false;
    status: VerifiedPublisherPreflightStatus;
    outcomes: {
      green: "direct_live";
      yellow: "adjust_or_review_required";
      red: "blocked_manual_review_required";
    };
  };
  municipalHandoff: {
    humanApprovalRequired: true;
    externalNotificationAutomatic: false;
    adoptionAutomatic: false;
    entitlementActivationAutomatic: false;
    authorityVerificationAutomatic: false;
    crmPipelineSupports: readonly [
      "signal_candidate",
      "authority_candidate",
      "pipeline_card",
      "follow_up_reminder",
      "contact_draft",
      "admin_operator_visualization",
      "responsibility_tracking",
    ];
    agentMayPrepare: readonly [
      "follow_up_reminders",
      "pipeline_status",
      "visualizations",
      "drafts",
      "hints",
      "decision_templates",
    ];
    agentMayNot: readonly [
      "send_external_message",
      "contact_authority_automatically",
      "trigger_adoption_automatically",
      "activate_entitlement_automatically",
    ];
  };
  publicDebateStatusRemainsFree: true;
  noPremiumVoteWeighting: true;
  noFakeSources: true;
  noFakeParticipation: true;
};

const CIVIC_PRINCIPLES: EdebateCivicPrinciple[] = [
  {
    id: "democratic_participation",
    label: "Demokratische Teilhabe",
    summary: "eDebatte unterstuetzt demokratische Beteiligung statt bloßer Empoerungszaehlung.",
  },
  {
    id: "transparency",
    label: "Transparenz",
    summary: "Zustaendigkeit, Framing, Quellenlage und Folgegrenzen bleiben sichtbar.",
  },
  {
    id: "no_manipulation",
    label: "Keine Manipulation",
    summary: "Diskursformate und Agents optimieren nicht auf manipulative Mehrheiten.",
  },
  {
    id: "no_discrimination",
    label: "Keine Diskriminierung",
    summary: "Mehrheitsbildung darf keine diskriminierenden Ergebnisse normalisieren.",
  },
  {
    id: "no_hate",
    label: "Keine Hetze",
    summary: "Hetzerische, entmenschlichende oder prangerhafte Oeffentlichkeitsformate bleiben ausgeschlossen.",
  },
  {
    id: "no_hidden_political_profiling",
    label: "Keine versteckte politische Profilierung",
    summary: "Personalisierung bleibt begrenzt und versteckt keine politische Etikettierung.",
  },
  {
    id: "no_false_officiality",
    label: "Keine Irrefuehrung ueber Amtlichkeit",
    summary: "Debattenstand, Umfrage und Handoff geben keine amtliche Rechtswirkung vor.",
  },
  {
    id: "no_sensitive_personal_data_without_basis",
    label: "Keine sensiblen personenbezogenen Daten ohne Grundlage",
    summary: "Sensible Daten bleiben ausserhalb des Standardpfads ohne klare Rechts- und Produktgrundlage.",
  },
  {
    id: "no_premium_vote_weighting",
    label: "Keine Premium-Stimmengewichtung",
    summary: "Zahlung oder Paketstatus aendern kein Stimmgewicht.",
  },
  {
    id: "no_fake_sources",
    label: "Keine Fake-Quellen",
    summary: "Quellen, Evidenz und Transferability bleiben echt, sichtbar und review-first.",
  },
  {
    id: "no_fake_participation",
    label: "Keine Fake-Beteiligung",
    summary: "Signals, Umfragen und Handoffs werden nicht mit erfundenen Beteiligungen aufgeblasen.",
  },
  {
    id: "no_suggestive_or_pillory_questions",
    label: "Keine Suggestiv- oder Prangerfragen",
    summary: "Oeffentliche Standardformate bleiben abwaegend statt anprangernd.",
  },
  {
    id: "counterarguments_and_limits_stay_visible",
    label: "Gegenargumente und Grenzen bleiben sichtbar",
    summary: "Materiale Gegenargumente, Quellenlimits und Kontext duerfen nicht systematisch verborgen werden.",
  },
  {
    id: "plausible_public_relevance_required",
    label: "Plausibler oeffentlicher Bezug",
    summary: "Oeffentliche Themen brauchen einen plausiblen Themen- oder Zustaendigkeitsbezug.",
  },
  {
    id: "public_debate_status_remains_free",
    label: "Oeffentlicher Debattenstand bleibt frei lesbar",
    summary: "Lesbarkeit oeffentlicher Debattenstaende wird nicht an GOV-light oder Upgrade gekoppelt.",
  },
] as const;

export function usesGovLightActiveSlot(action: GovLightUsageActionId) {
  return action === "publish_gov_light_topic" || action === "activate_gov_light_topic";
}

export function buildCivicPrinciplesGovLightMunicipalHandoffContract(input?: {
  activePublishedTopics?: number;
  govLightUsageAction?: GovLightUsageActionId;
  publisherType?: VerifiedPublisherType;
  verifiedPublisherPreflightStatus?: VerifiedPublisherPreflightStatus;
}): CivicPrinciplesGovLightMunicipalHandoffContract {
  const activePublishedTopics = Math.max(0, input?.activePublishedTopics ?? 0);
  const govLightUsageAction = input?.govLightUsageAction ?? "read_public_debate_status";
  const publisherType = input?.publisherType ?? "verified_authority";
  const verifiedPublisherPreflightStatus =
    input?.verifiedPublisherPreflightStatus ?? "yellow_adjust_or_review";

  return {
    primaryRole: "governance_compliance",
    supportingRoles: ["dossier_briefing", "participation_moderation"],
    publicDiscourse: {
      notABinaryOutrageMachine: true,
      preferredFormats: EDEBATTE_PUBLIC_DISCOURSE_FORMAT_IDS,
      disallowedDefaultFormats: EDEBATTE_NON_DEFAULT_BINARY_FORMAT_IDS,
      binaryReviewGatesRemainInternalOnly: true,
    },
    majorityWithinPrinciples: {
      majorityOrientationAllowed: true,
      principleOverridesForbidden: [
        "discrimination",
        "manipulation",
        "hide_material_facts",
        "hide_minority_arguments",
        "violate_protection_rights",
        "fake_official_or_legal_effect",
        "fake_referendum_binding",
      ],
    },
    civicPrinciples: [...CIVIC_PRINCIPLES],
    authorityContinuation: {
      govVerifiedAuthorityRequired: true,
      continuationAllowedInsideJurisdiction: true,
      automaticImplementation: false,
      legalClaimCreated: false,
      officialDecisionCreated: false,
      bindingReferendumCreated: false,
      externalNotificationCreated: false,
    },
    govLight: {
      verifiedAuthorityRequired: true,
      activeSlotLimit: 3,
      activePublishedTopics,
      activeSlotsRemaining: Math.max(0, 3 - activePublishedTopics),
      includedCapabilities: GOV_LIGHT_INCLUDED_CAPABILITIES,
      excludedCapabilities: GOV_LIGHT_EXCLUDED_CAPABILITIES,
      slotUsageAction: govLightUsageAction,
      slotConsumedByAction: usesGovLightActiveSlot(govLightUsageAction),
      hardClosePressureAllowed: false,
      valueFirstUpgradeTouchpoints: [
        "reminder",
        "nps",
        "transparency_or_impact_review",
        "agent_value_explanation",
        "upgrade_hint_for_advanced_capabilities",
      ],
    },
    verifiedPublisherPreflight: {
      publisherType,
      consciousPublishClickRequired: true,
      agentMayAutoPublish: false,
      status: verifiedPublisherPreflightStatus,
      outcomes: {
        green: "direct_live",
        yellow: "adjust_or_review_required",
        red: "blocked_manual_review_required",
      },
    },
    municipalHandoff: {
      humanApprovalRequired: true,
      externalNotificationAutomatic: false,
      adoptionAutomatic: false,
      entitlementActivationAutomatic: false,
      authorityVerificationAutomatic: false,
      crmPipelineSupports: [
        "signal_candidate",
        "authority_candidate",
        "pipeline_card",
        "follow_up_reminder",
        "contact_draft",
        "admin_operator_visualization",
        "responsibility_tracking",
      ],
      agentMayPrepare: [
        "follow_up_reminders",
        "pipeline_status",
        "visualizations",
        "drafts",
        "hints",
        "decision_templates",
      ],
      agentMayNot: [
        "send_external_message",
        "contact_authority_automatically",
        "trigger_adoption_automatically",
        "activate_entitlement_automatically",
      ],
    },
    publicDebateStatusRemainsFree: true,
    noPremiumVoteWeighting: true,
    noFakeSources: true,
    noFakeParticipation: true,
  };
}
