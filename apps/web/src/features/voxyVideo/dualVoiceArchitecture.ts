import { VOXY_DOCUMENTARY_VOICE_CANDIDATES } from "./documentaryVoiceBakeoff";
import {
  VOXY_CHATTERBOX_ENGINE,
  VOXY_CHATTERBOX_MODEL,
  VOXY_FIRST_PARTY_IDENTITY,
  VOXY_FIRST_PARTY_PRIVACY,
  VOXY_FIRST_PARTY_VISUAL_BINDING,
} from "./firstPartyVoiceClone";

export type VoxySpeakerRole = "voxy" | "editorial";

export type VoxyNewsVisualState =
  | "host"
  | "focus"
  | "explain"
  | "dock"
  | "synthesis";

export type VoxySpeakerTimelineEntry = Readonly<{
  start: number;
  end: number;
  speakerRole: VoxySpeakerRole;
  voiceId: string;
  text: string;
}>;

export const VOXY_DUAL_VOICE_SCHEMA_VERSION =
  "voxy-dual-voice-architecture-v1" as const;

const EDITORIAL_DOCUMENTARY_REFERENCE = VOXY_DOCUMENTARY_VOICE_CANDIDATES[1];

export const VOXY_SIGNATURE = {
  id: "VOXY_SIGNATURE",
  speakerRole: "voxy",
  gender: "male",
  voiceId: "voxy-signature-e-5a465a33",
  deliveryMode: "signature",
  acceptedCandidate: "E — VOXY SIGNATURE",
  selectedVariantId: "e-02-warm-sovereign",
  provenance: {
    source: "accepted_first_party_voice_identity",
    exactHeadSha: "5a465a339c453acc2f8206f84d85f009bbf3d037",
    engine: VOXY_CHATTERBOX_ENGINE,
    model: VOXY_CHATTERBOX_MODEL,
    identity: VOXY_FIRST_PARTY_IDENTITY,
    privateRawReferencesInRepository: false,
    historicalBakeoffEvidencePreserved: true,
  },
  privacyAndLicense: {
    ...VOXY_FIRST_PARTY_PRIVACY,
    engineLicense: VOXY_CHATTERBOX_ENGINE.engineLicense,
    modelLicense: VOXY_CHATTERBOX_MODEL.modelLicense,
    localInferenceOnly: true,
    runtimeDistributionAuthorized: false,
    publicAudioAuthorized: false,
  },
} as const;

export const EDITORIAL_VOICE = {
  id: "EDITORIAL_VOICE",
  speakerRole: "editorial",
  gender: "female",
  voiceId: EDITORIAL_DOCUMENTARY_REFERENCE.voice,
  deliveryMode: "editorial",
  acceptedCandidate: "Documentary Candidate A — Ramona Deininger",
  provenance: {
    source: "accepted_local_documentary_voice_candidate",
    candidateId: EDITORIAL_DOCUMENTARY_REFERENCE.id,
    engine: EDITORIAL_DOCUMENTARY_REFERENCE.engine,
    engineVersion: EDITORIAL_DOCUMENTARY_REFERENCE.engineVersion,
    engineSourceUrl: EDITORIAL_DOCUMENTARY_REFERENCE.engineSourceUrl,
    modelRepository: EDITORIAL_DOCUMENTARY_REFERENCE.modelRepository,
    modelRevision: EDITORIAL_DOCUMENTARY_REFERENCE.modelRevision,
    dataset: EDITORIAL_DOCUMENTARY_REFERENCE.dataset,
    datasetSourceUrl: EDITORIAL_DOCUMENTARY_REFERENCE.datasetSourceUrl,
    modelFiles: EDITORIAL_DOCUMENTARY_REFERENCE.modelFiles,
    historicalBakeoffEvidencePreserved: true,
  },
  privacyAndLicense: {
    engineLicense: EDITORIAL_DOCUMENTARY_REFERENCE.engineLicense,
    modelLicense: EDITORIAL_DOCUMENTARY_REFERENCE.modelLicense,
    datasetLicense: EDITORIAL_DOCUMENTARY_REFERENCE.datasetLicense,
    attribution: EDITORIAL_DOCUMENTARY_REFERENCE.attribution,
    commercialUse: EDITORIAL_DOCUMENTARY_REFERENCE.commercialUse,
    offlineAfterProvisioning: EDITORIAL_DOCUMENTARY_REFERENCE.offlineAfterProvisioning,
    runtimeNetworkRequests: EDITORIAL_DOCUMENTARY_REFERENCE.runtimeNetworkRequests,
    privateRawReferencesInRepository: false,
    localInferenceOnly: true,
    publicAudioAuthorized: false,
  },
} as const;

export const VOXY_DUAL_VOICE_ACCEPTANCE = {
  humanVoiceArchitectureAcceptance: "accepted",
  voxyMaleSignatureAcceptance: "accepted",
  editorialFemaleVoiceAcceptance: "accepted",
  acceptedAt: "2026-08-17",
  productionEligible: false,
  autoPublish: false,
} as const;

export const VOXY_SPEAKER_ROLE_RULES = {
  voxy: {
    voiceId: VOXY_SIGNATURE.voiceId,
    responsibilities: [
      "greeting",
      "direct_user_address",
      "questions",
      "moderation",
      "transitions",
      "reflection",
      "cta",
      "closing",
    ],
    voxyMouth: "sync_to_active_voxy_voice",
    voxyMotion: "existing_natural_host_motion",
  },
  editorial: {
    voiceId: EDITORIAL_VOICE.voiceId,
    responsibilities: [
      "fact_condensation",
      "context",
      "source_and_argument_classification",
      "explanation",
      "intermediate_summary",
      "closing_summary",
    ],
    voxyMouth: "neutral_or_closed_no_editorial_lip_sync",
    voxyMotion: "subtle_idle_only",
  },
  waveform: {
    count: 1,
    reactsToActiveVoice: true,
    speakerChangeCreatesSecondWaveform: false,
  },
} as const;

export const VOXY_DIRECT_ADDRESS_GREETING = {
  text: "Hallo Nachbar,",
  speakerRole: "voxy",
  placement: "once_at_start_of_connected_direct_address_video",
  editorialUsesGreeting: false,
  repeatBeforeEachVoxySegment: false,
  repeatForShortInsertTransitionOrNonDirectInformation: false,
  brandNarrativeException: false,
} as const;

export const VOXY_NEWS_VISUAL_STATES = [
  {
    id: "host",
    primaryFocus: "voxy",
    purpose: ["introduction", "question", "transition", "reflection", "cta"],
    voxyPresence: "primary",
  },
  {
    id: "focus",
    primaryFocus: "active_information_object",
    allowedObjects: ["source", "chart", "map", "document", "image", "statistic", "quote", "trend"],
    sourceMustRemainRecognizable: true,
    relevantEvidenceMayBeHighlighted: true,
    voxyPresence: "visibly_reduced_host",
  },
  {
    id: "explain",
    primaryFocus: "active_information_object",
    preferredSpeakerRole: "editorial",
    narrationDrivenVisualization: true,
    decorativeAnimationWithoutInformationValue: false,
    voxyPresence: "present_passive_host",
    voxyMouth: "neutral_or_closed",
  },
  {
    id: "dock",
    primaryFocus: "evidence_memory_transition",
    destination: "right_dynamic_evidence_summary_zone",
    abruptDisappearance: false,
    provenanceRemainsVisible: true,
    refocusAllowed: true,
  },
  {
    id: "synthesis",
    primaryFocus: "multiple_previously_explained_evidence_objects",
    relationships: ["agreement", "contradiction", "dependency", "uncertainty"],
    editorialSummaryAllowed: true,
    nextState: "host_for_reflection_question_or_cta",
  },
] as const satisfies readonly {
  id: VoxyNewsVisualState;
  primaryFocus: string;
  [key: string]: unknown;
}[];

export const VOXY_DYNAMIC_EVIDENCE_MEMORY = {
  location: "right_evidence_summary_zone",
  staticSidebar: false,
  stores: [
    "source",
    "metric",
    "trend",
    "argument",
    "counterargument",
    "quote",
    "open_question",
    "uncertainty",
    "vote_result",
  ],
  previouslyDockedObjectsMayReturnToFocus: true,
  provenanceRemainsTraceable: true,
} as const;

export const VOXY_SOURCE_FIRST_PRIORITY = [
  "original_source_or_original_data",
  "traceably_derived_visualization",
  "clearly_labeled_editorial_summary",
] as const;

export const VOXY_SOURCE_FIRST_GUARDRAILS = {
  showOrigin: true,
  showWhatSourceContains: true,
  showRelevantPart: true,
  showDerivation: true,
  inventedCharts: false,
  decorativeFakeData: false,
  sourceOnlyAsFinePrint: false,
} as const;

export const VOXY_NARRATIVE_CHART_BEHAVIOR = {
  narrationDrivesAnimation: true,
  allowedSequence: [
    "axis_first",
    "relevant_series",
    "time_range_focus",
    "comparison_value",
    "relevant_point",
    "full_context",
    "dock",
  ],
  fullComplexChartRequiredAtStart: false,
  decorativeAnimationWithoutInformationValue: false,
} as const;

export const VOXY_CANONICAL_INFORMATION_FLOW = [
  { state: "host", active: "voxy", speakerRole: "voxy" },
  { state: "focus", active: "information", speakerRole: null },
  { state: "explain", active: "editorial", speakerRole: "editorial" },
  { state: "dock", active: "information", speakerRole: null },
  { state: "host", active: "voxy", speakerRole: "voxy" },
  { state: "focus", active: "next_information", speakerRole: null },
  { state: "explain", active: "editorial", speakerRole: "editorial" },
  { state: "dock", active: "information", speakerRole: null },
  { state: "synthesis", active: "evidence_relationships", speakerRole: "editorial" },
  { state: "host", active: "voxy_reflection_or_cta", speakerRole: "voxy" },
] as const satisfies readonly {
  state: VoxyNewsVisualState;
  active: string;
  speakerRole: VoxySpeakerRole | null;
}[];

export const VOXY_DUAL_VOICE_PILOT_SEGMENTS = [
  {
    id: "voxy-introduction",
    speakerRole: "voxy",
    voiceId: VOXY_SIGNATURE.voiceId,
    text: "Hallo Nachbar,\nich bin Voxy.\n\nUnd ich möchte dir zeigen, warum eDebatte mehr ist\nals eine weitere Plattform für politische Meinungen.",
  },
  {
    id: "voxy-problem",
    speakerRole: "voxy",
    voiceId: VOXY_SIGNATURE.voiceId,
    text: "Nehmen wir eine politische Frage.\nMeistens begegnen uns dazu Schlagzeilen,\neinzelne Zahlen und ziemlich schnell\nzwei gegensätzliche Lager.",
  },
  {
    id: "editorial-context",
    speakerRole: "editorial",
    voiceId: EDITORIAL_VOICE.voiceId,
    text: "eDebatte führt Quellen, Argumente und unterschiedliche\nPerspektiven zusammen.\nDabei wird sichtbar, was belegt ist,\nwo Aussagen einander widersprechen\nund welche Fragen noch offen sind.",
  },
  {
    id: "voxy-return",
    speakerRole: "voxy",
    voiceId: VOXY_SIGNATURE.voiceId,
    text: "Und genau hier komme ich wieder ins Spiel.\nIch sage dir nicht, welche Seite recht hat.",
  },
  {
    id: "voxy-reflection",
    speakerRole: "voxy",
    voiceId: VOXY_SIGNATURE.voiceId,
    text: "Ich helfe dir dabei, selbst herauszufinden,\nwas du davon hältst.",
  },
  {
    id: "editorial-summary",
    speakerRole: "editorial",
    voiceId: EDITORIAL_VOICE.voiceId,
    text: "Kurz gesagt:\nverstehen, prüfen, einordnen\nund anschließend selbst entscheiden.",
  },
  {
    id: "voxy-closing",
    speakerRole: "voxy",
    voiceId: VOXY_SIGNATURE.voiceId,
    text: "Das ist eDebatte.\nUnd ich bin Voxy.",
  },
] as const satisfies readonly {
  id: string;
  speakerRole: VoxySpeakerRole;
  voiceId: string;
  text: string;
}[];

export const VOXY_DUAL_VOICE_PILOT_CONTRACT = {
  taskId: "VOXY-DUAL-VOICE-EXPLAINER-PILOT-01",
  status: "review",
  implementationInCurrentPass: true,
  title: "Was ist eDebatte?",
  privateHumanReviewEvidence: true,
  format: { width: 1920, height: 1080, fps: 24, durationSeconds: { min: 45, max: 60 } },
  requiredOutputs: [
    "mp4",
    "webm",
    "wav_master_audio",
    "preview",
    "contact_sheet",
    "speaker-timeline.json",
    "visual-state-timeline.json",
    "manifest.json",
  ],
  speakerTimelineFields: ["start", "end", "speakerRole", "voiceId", "text"],
  requiredVisualSequence: ["host", "focus", "explain", "dock", "host"],
  finalSynthesisRequired: true,
  visualMaster: {
    ...VOXY_FIRST_PARTY_VISUAL_BINDING,
    characterRedesign: false,
    cameraBaseChanged: false,
    editorialAvatarRequired: false,
  },
  autonomousNewsProductionImplemented: false,
  productionEligible: false,
  autoPublish: false,
} as const;

export const VOXY_FUTURE_FORMAT_FAMILY = [
  "VOXY_NEWS",
  "VOXY_EXPLAINER",
  "VOXY_DOSSIER",
  "VOXY_BALLOT",
  "VOXY_SOCIAL_SHORT",
] as const;

export function validateVoxyDualVoiceArchitecture(): string[] {
  const errors: string[] = [];
  if (EDITORIAL_DOCUMENTARY_REFERENCE.id !== "candidate-a") errors.push("editorial_reference_drift");
  if (VOXY_SIGNATURE.speakerRole !== "voxy" || VOXY_SIGNATURE.gender !== "male") errors.push("voxy_identity_invalid");
  if (EDITORIAL_VOICE.speakerRole !== "editorial" || EDITORIAL_VOICE.gender !== "female") errors.push("editorial_identity_invalid");
  if (Object.values(VOXY_DUAL_VOICE_ACCEPTANCE).includes("pending" as never)) errors.push("human_acceptance_pending");
  if (VOXY_DUAL_VOICE_PILOT_SEGMENTS.some((segment) => segment.speakerRole === "voxy" && segment.voiceId !== VOXY_SIGNATURE.voiceId)) errors.push("voxy_voice_selection_implicit_or_invalid");
  if (VOXY_DUAL_VOICE_PILOT_SEGMENTS.some((segment) => segment.speakerRole === "editorial" && segment.voiceId !== EDITORIAL_VOICE.voiceId)) errors.push("editorial_voice_selection_implicit_or_invalid");
  if (!VOXY_DUAL_VOICE_PILOT_SEGMENTS[0].text.startsWith(`${VOXY_DIRECT_ADDRESS_GREETING.text}\n`) || VOXY_DUAL_VOICE_PILOT_SEGMENTS.slice(1).some((segment) => segment.text.includes(VOXY_DIRECT_ADDRESS_GREETING.text))) errors.push("direct_address_greeting_invalid");
  if (VOXY_DIRECT_ADDRESS_GREETING.editorialUsesGreeting || VOXY_DIRECT_ADDRESS_GREETING.brandNarrativeException) errors.push("direct_address_greeting_role_or_canon_invalid");
  if (VOXY_SPEAKER_ROLE_RULES.editorial.voxyMouth !== "neutral_or_closed_no_editorial_lip_sync") errors.push("editorial_voxy_lip_sync_forbidden");
  if (VOXY_SPEAKER_ROLE_RULES.waveform.count !== 1 || VOXY_SPEAKER_ROLE_RULES.waveform.speakerChangeCreatesSecondWaveform) errors.push("single_waveform_contract_failed");
  if (VOXY_NEWS_VISUAL_STATES.map((state) => state.id).join(",") !== "host,focus,explain,dock,synthesis") errors.push("visual_state_grammar_drift");
  if (VOXY_DYNAMIC_EVIDENCE_MEMORY.staticSidebar || !VOXY_DYNAMIC_EVIDENCE_MEMORY.previouslyDockedObjectsMayReturnToFocus) errors.push("dynamic_evidence_memory_invalid");
  if (VOXY_SOURCE_FIRST_PRIORITY[0] !== "original_source_or_original_data" || VOXY_SOURCE_FIRST_GUARDRAILS.inventedCharts || VOXY_SOURCE_FIRST_GUARDRAILS.decorativeFakeData) errors.push("source_first_contract_failed");
  if (VOXY_DUAL_VOICE_PILOT_CONTRACT.requiredVisualSequence.join(",") !== "host,focus,explain,dock,host" || !VOXY_DUAL_VOICE_PILOT_CONTRACT.finalSynthesisRequired) errors.push("pilot_visual_grammar_incomplete");
  if (!VOXY_DUAL_VOICE_PILOT_CONTRACT.implementationInCurrentPass || VOXY_DUAL_VOICE_PILOT_CONTRACT.autonomousNewsProductionImplemented) errors.push("pilot_implementation_or_scope_invalid");
  if (VOXY_DUAL_VOICE_PILOT_CONTRACT.productionEligible || VOXY_DUAL_VOICE_PILOT_CONTRACT.autoPublish) errors.push("release_must_remain_blocked");
  return errors;
}
