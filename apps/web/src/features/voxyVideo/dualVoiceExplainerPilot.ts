import {
  EDITORIAL_VOICE,
  VOXY_DUAL_VOICE_PILOT_SEGMENTS,
  VOXY_SIGNATURE,
  type VoxySpeakerRole,
} from "./dualVoiceArchitecture";
import { VOXY_FIRST_PARTY_VISUAL_BINDING } from "./firstPartyVoiceClone";

export const VOXY_DUAL_VOICE_PILOT_SCHEMA_VERSION =
  "voxy-dual-voice-explainer-pilot-v1" as const;

export const VOXY_DUAL_VOICE_PILOT_OUTPUT = {
  directory: "artifacts/voxy-dual-voice-explainer-pilot-01",
  mp4: "voxy-dual-voice-explainer-pilot-01.mp4",
  webm: "voxy-dual-voice-explainer-pilot-01.webm",
  masterAudio: "master-audio.wav",
  preview: "preview.png",
  contactSheet: "contact-sheet.png",
  speakerTimeline: "speaker-timeline.json",
  visualStateTimeline: "visual-state-timeline.json",
  manifest: "manifest.json",
  width: 1920,
  height: 1080,
  fps: 24,
  durationSeconds: { min: 45, max: 60 },
} as const;

export type VoxyDualVoicePilotVisualState =
  | "HOST"
  | "FOCUS"
  | "EXPLAIN"
  | "DOCK"
  | "SYNTHESIS";

export type VoxyDualVoicePilotSpeakerEntry = Readonly<{
  id: string;
  start: number;
  end: number;
  speakerRole: VoxySpeakerRole;
  voiceId: string;
  text: string;
}>;

export type VoxyDualVoicePilotVisualEntry = Readonly<{
  start: number;
  end: number;
  state: VoxyDualVoicePilotVisualState;
  activeEvidenceId: string | null;
  dockedEvidenceIds: readonly string[];
}>;

export const VOXY_DUAL_VOICE_PILOT_EVIDENCE = [
  {
    id: "claim-headline",
    type: "HEADLINE / CLAIM",
    label: "These oder Schlagzeile",
    provenance: "DEMO / FORMAT-FIXTURE",
  },
  {
    id: "source-card",
    type: "SOURCE CARD",
    label: "Quelle / Datengrundlage",
    provenance: "DEMO / FORMAT-FIXTURE",
  },
  {
    id: "argument-card",
    type: "ARGUMENT CARD",
    label: "Argument",
    provenance: "DEMO / FORMAT-FIXTURE",
  },
  {
    id: "counterpoint",
    type: "COUNTERPOINT",
    label: "Gegenargument",
    provenance: "DEMO / FORMAT-FIXTURE",
  },
  {
    id: "open-question",
    type: "OPEN QUESTION",
    label: "Was wissen wir noch nicht?",
    provenance: "DEMO / FORMAT-FIXTURE",
  },
] as const;

export const VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS =
  VOXY_DUAL_VOICE_PILOT_SEGMENTS.map((segment, index) => ({
    ...segment,
    spokenText: segment.text
      .replaceAll("Voxy", "Woxi")
      .replaceAll("eDebatte", "eh Debatte"),
    pauseAfterMs: index === VOXY_DUAL_VOICE_PILOT_SEGMENTS.length - 1 ? 0 : 420,
  }));

const roundSeconds = (milliseconds: number): number =>
  Number((milliseconds / 1_000).toFixed(3));

export function buildVoxyDualVoicePilotPlan(
  exactHeadSha: string,
  speechDurationsMs: readonly number[],
) {
  if (speechDurationsMs.length !== VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS.length) {
    throw new Error("exactly_seven_speech_durations_required");
  }

  let cursorMs = 500;
  const speakerTimeline: VoxyDualVoicePilotSpeakerEntry[] =
    VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS.map((segment, index) => {
      const startMs = cursorMs;
      const endMs = startMs + speechDurationsMs[index]!;
      cursorMs = endMs + segment.pauseAfterMs;
      return {
        id: segment.id,
        start: roundSeconds(startMs),
        end: roundSeconds(endMs),
        speakerRole: segment.speakerRole,
        voiceId: segment.voiceId,
        text: segment.text,
      };
    });

  const totalDurationMs = cursorMs + 700;
  const [intro, problem, editorialContext, voxyReturn, voxyReflection, editorialSummary, closing] =
    speakerTimeline;
  const firstFocusStart = Math.max(intro!.end, problem!.start + 1.6);
  const firstDockStart = Math.max(editorialContext!.start + 1, editorialContext!.end - 1.2);
  const secondFocusStart = voxyReflection!.start;
  const secondExplainStart = editorialSummary!.start;
  const secondExplainEnd = Number(
    (editorialSummary!.start + (editorialSummary!.end - editorialSummary!.start) * 0.56).toFixed(3),
  );
  const secondDockEnd = Number(
    (editorialSummary!.start + (editorialSummary!.end - editorialSummary!.start) * 0.78).toFixed(3),
  );

  const visualStateTimeline: VoxyDualVoicePilotVisualEntry[] = [
    { start: 0, end: firstFocusStart, state: "HOST", activeEvidenceId: null, dockedEvidenceIds: [] },
    { start: firstFocusStart, end: editorialContext!.start, state: "FOCUS", activeEvidenceId: "claim-headline", dockedEvidenceIds: [] },
    { start: editorialContext!.start, end: firstDockStart, state: "EXPLAIN", activeEvidenceId: "claim-headline", dockedEvidenceIds: [] },
    { start: firstDockStart, end: editorialContext!.end, state: "DOCK", activeEvidenceId: "claim-headline", dockedEvidenceIds: ["claim-headline"] },
    { start: editorialContext!.end, end: secondFocusStart, state: "HOST", activeEvidenceId: null, dockedEvidenceIds: ["claim-headline"] },
    { start: secondFocusStart, end: secondExplainStart, state: "FOCUS", activeEvidenceId: "source-card", dockedEvidenceIds: ["claim-headline"] },
    { start: secondExplainStart, end: secondExplainEnd, state: "EXPLAIN", activeEvidenceId: "source-card", dockedEvidenceIds: ["claim-headline"] },
    { start: secondExplainEnd, end: secondDockEnd, state: "DOCK", activeEvidenceId: "source-card", dockedEvidenceIds: ["claim-headline", "source-card", "argument-card", "counterpoint", "open-question"] },
    { start: secondDockEnd, end: closing!.start, state: "SYNTHESIS", activeEvidenceId: null, dockedEvidenceIds: ["claim-headline", "source-card", "argument-card", "counterpoint", "open-question"] },
    { start: closing!.start, end: roundSeconds(totalDurationMs), state: "HOST", activeEvidenceId: null, dockedEvidenceIds: ["claim-headline", "source-card", "argument-card", "counterpoint", "open-question"] },
  ];

  return {
    schemaVersion: VOXY_DUAL_VOICE_PILOT_SCHEMA_VERSION,
    exactHeadSha,
    visualMasterHeadSha: VOXY_FIRST_PARTY_VISUAL_BINDING.visualMasterHeadSha,
    output: {
      ...VOXY_DUAL_VOICE_PILOT_OUTPUT,
      durationMs: totalDurationMs,
      frameCount: Math.ceil((totalDurationMs * VOXY_DUAL_VOICE_PILOT_OUTPUT.fps) / 1_000),
    },
    speakerTimeline,
    visualStateTimeline,
    evidence: VOXY_DUAL_VOICE_PILOT_EVIDENCE,
    mouth: {
      profile: VOXY_FIRST_PARTY_VISUAL_BINDING.mouthProfile,
      shapesChanged: false,
      anchorChanged: false,
      pivotChanged: false,
      syncSpeakerRole: "voxy",
      editorialMouth: "neutral_or_closed",
    },
    waveform: { count: 1, reactsToActiveVoice: true, secondWaveform: false },
    privacy: {
      privateRawVoiceInRepository: false,
      privateReferencePathInManifest: false,
      publicArtifact: false,
      upload: false,
    },
    humanPilotAcceptance: "pending",
    productionEligible: false,
    autoPublish: false,
  } as const;
}

export type VoxyDualVoicePilotPlan = ReturnType<typeof buildVoxyDualVoicePilotPlan>;

export function validateVoxyDualVoicePilotPlan(plan: VoxyDualVoicePilotPlan): string[] {
  const errors: string[] = [];
  const durationSeconds = plan.output.durationMs / 1_000;
  if (!/^[0-9a-f]{40}$/.test(plan.exactHeadSha)) errors.push("exact_head_invalid");
  if (plan.output.width !== 1920 || plan.output.height !== 1080 || plan.output.fps !== 24 || durationSeconds < 45 || durationSeconds > 60) errors.push("media_contract_invalid");
  if (plan.speakerTimeline.length !== 7) errors.push("seven_speaker_blocks_required");
  if (plan.speakerTimeline.some((entry) => entry.start >= entry.end)) errors.push("speaker_timeline_order_invalid");
  if (plan.speakerTimeline.some((entry) => entry.speakerRole === "voxy" && entry.voiceId !== VOXY_SIGNATURE.voiceId)) errors.push("voxy_voice_invalid");
  if (plan.speakerTimeline.some((entry) => entry.speakerRole === "editorial" && entry.voiceId !== EDITORIAL_VOICE.voiceId)) errors.push("editorial_voice_invalid");
  if (!plan.speakerTimeline[0]?.text.startsWith("Hallo Nachbar,") || plan.speakerTimeline.slice(1).some((entry) => entry.text.includes("Hallo Nachbar,"))) errors.push("greeting_contract_invalid");
  if (plan.visualStateTimeline.map((entry) => entry.state).join(",") !== "HOST,FOCUS,EXPLAIN,DOCK,HOST,FOCUS,EXPLAIN,DOCK,SYNTHESIS,HOST") errors.push("news_5_sequence_invalid");
  if (plan.visualStateTimeline.some((entry) => entry.start >= entry.end)) errors.push("visual_timeline_order_invalid");
  const synthesis = plan.visualStateTimeline.find((entry) => entry.state === "SYNTHESIS");
  if (!synthesis || !VOXY_DUAL_VOICE_PILOT_EVIDENCE.every((evidence) => synthesis.dockedEvidenceIds.includes(evidence.id))) errors.push("synthesis_missing_previously_docked_evidence");
  if (plan.waveform.count !== 1 || plan.waveform.secondWaveform || !plan.waveform.reactsToActiveVoice) errors.push("single_waveform_contract_invalid");
  if (plan.mouth.syncSpeakerRole !== "voxy" || plan.mouth.editorialMouth !== "neutral_or_closed" || plan.mouth.shapesChanged || plan.mouth.anchorChanged || plan.mouth.pivotChanged) errors.push("mouth_contract_invalid");
  if (plan.privacy.privateRawVoiceInRepository || plan.privacy.privateReferencePathInManifest || plan.privacy.publicArtifact || plan.privacy.upload) errors.push("privacy_contract_invalid");
  if (plan.humanPilotAcceptance !== "pending" || plan.productionEligible || plan.autoPublish) errors.push("release_gate_invalid");
  return errors;
}

export function speakerAt(plan: VoxyDualVoicePilotPlan, atSeconds: number) {
  return plan.speakerTimeline.find((entry) => atSeconds >= entry.start && atSeconds < entry.end) ?? null;
}

export function visualStateAt(plan: VoxyDualVoicePilotPlan, atSeconds: number) {
  return plan.visualStateTimeline.find((entry) => atSeconds >= entry.start && atSeconds < entry.end) ?? plan.visualStateTimeline.at(-1)!;
}
