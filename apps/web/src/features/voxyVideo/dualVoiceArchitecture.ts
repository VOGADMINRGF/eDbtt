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
    id: "voxy-democracy-opening",
    speakerRole: "voxy",
    voiceId: VOXY_SIGNATURE.voiceId,
    text: "Hallo Nachbar.\n\nWir wählen.\nWir diskutieren.\nWir streiten.\n\nUnd trotzdem bleibt bei vielen Menschen\neine ziemlich einfache Frage:\n\nWird meine Stimme eigentlich gehört?",
  },
  {
    id: "voxy-headline-limits",
    speakerRole: "voxy",
    voiceId: VOXY_SIGNATURE.voiceId,
    text: "Aber wenn wir wissen wollen,\nwie es unserer Demokratie wirklich geht,\nreicht eine Schlagzeile nicht.",
  },
  {
    id: "editorial-democracy-dimensions",
    speakerRole: "editorial",
    voiceId: EDITORIAL_VOICE.voiceId,
    text: "Denn Vertrauen,\npolitische Beteiligung\nund das Gefühl, selbst etwas bewirken zu können,\nbeschreiben unterschiedliche Seiten derselben Demokratie.",
  },
  {
    id: "editorial-look-closer",
    speakerRole: "editorial",
    voiceId: EDITORIAL_VOICE.voiceId,
    text: "Ein einzelner Wert kann steigen,\nwährend ein anderer fällt.\n\nDas ist kein Widerspruch.\n\nEs bedeutet,\ndass wir genauer hinschauen müssen.",
  },
  {
    id: "voxy-distinction",
    speakerRole: "voxy",
    voiceId: VOXY_SIGNATURE.voiceId,
    text: "Genau deshalb trennen wir\nGefühl,\nBefund\nund offene Frage.",
  },
  {
    id: "editorial-open-questions",
    speakerRole: "editorial",
    voiceId: EDITORIAL_VOICE.voiceId,
    text: "Was wissen wir?\n\nWas spricht für eine Erklärung?\n\nWas spricht dagegen?\n\nUnd was wissen wir noch nicht?",
  },
  {
    id: "editorial-synthesis",
    speakerRole: "editorial",
    voiceId: EDITORIAL_VOICE.voiceId,
    text: "Erst zusammen entsteht ein Bild,\ndas mehr zeigt als eine einzelne Zahl\noder eine einzelne Meinung.",
  },
  {
    id: "voxy-democracy-reflection",
    speakerRole: "voxy",
    voiceId: VOXY_SIGNATURE.voiceId,
    text: "Vielleicht ist die spannendere Frage also nicht nur,\nob Demokratie funktioniert.\n\nSondern wo Menschen erleben,\ndass sie nicht mehr funktioniert.",
  },
  {
    id: "voxy-verifiability",
    speakerRole: "voxy",
    voiceId: VOXY_SIGNATURE.voiceId,
    text: "Du musst mir dabei nichts glauben.\n\nDu sollst es prüfen können.",
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
  title: "Demokratie — Human-Review Correction Pass v1.1",
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
    "evidence-timeline.json",
    "captions.de.vtt",
    "captions.de.srt",
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
  if (!/^Hallo Nachbar[,.]\n/.test(VOXY_DUAL_VOICE_PILOT_SEGMENTS[0].text) || VOXY_DUAL_VOICE_PILOT_SEGMENTS.slice(1).some((segment) => /Hallo Nachbar[,.]/.test(segment.text))) errors.push("direct_address_greeting_invalid");
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
