import { describe, expect, it } from "vitest";

import {
  EDITORIAL_VOICE,
  VOXY_SIGNATURE,
} from "../src/features/voxyVideo/dualVoiceArchitecture";
import {
  VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS,
  VOXY_DUAL_VOICE_PILOT_EVIDENCE,
  VOXY_DUAL_VOICE_PILOT_OUTPUT,
  VOXY_DUAL_VOICE_PILOT_VOICE_BINDINGS,
  VOXY_SINGLE_VOICE_REVIEW_AUDIO_SEGMENTS,
  VOXY_SINGLE_VOICE_REVIEW_OUTPUT,
  assertVoxyPilotVoiceBinding,
  buildVoxyDualVoicePilotPlan,
  buildVoxySingleVoiceReviewPlan,
  buildVoxyDualVoicePilotSrt,
  buildVoxyDualVoicePilotVtt,
  speakerAt,
  validateVoxyDualVoicePilotPlan,
  validateVoxySingleVoiceReviewPlan,
  visualStateAt,
} from "../src/features/voxyVideo/dualVoiceExplainerPilot";
import { renderVoxyDualVoicePilotFrameHtml } from "../src/features/voxyVideo/dualVoiceExplainerPilotHtml";
import { VOXY_FIRST_PARTY_VISUAL_BINDING } from "../src/features/voxyVideo/firstPartyVoiceClone";

const exactHead = "a".repeat(40);
const plan = buildVoxyDualVoicePilotPlan(
  exactHead,
  [9_000, 4_500, 6_500, 6_000, 3_500, 5_500, 5_000, 6_500, 3_500],
);
const singleVoicePlan = buildVoxySingleVoiceReviewPlan(
  exactHead,
  [9_000, 4_500, 6_500, 6_000, 3_500, 5_500, 5_000, 6_500, 3_500],
);
const assets = {
  canonStageDataUrl: "data:image/png;base64,AA==",
  studioLockupDataUrl: "data:image/svg+xml;base64,AA==",
  lapelPinDataUrl: "data:image/svg+xml;base64,AA==",
  edebattePocketMarkDataUrl: "data:image/svg+xml;base64,AA==",
};

describe("VOXY dual-voice democracy pilot v1.3", () => {
  it("binds every role fail-closed to the final human-accepted pipeline", () => {
    expect(plan.speakerTimeline).toHaveLength(9);
    expect(plan.speakerTimeline.some((entry) => entry.speakerRole === "voxy")).toBe(true);
    expect(plan.speakerTimeline.some((entry) => entry.speakerRole === "editorial")).toBe(true);
    expect(plan.speakerTimeline.filter((entry) => entry.speakerRole === "voxy").every((entry) => entry.voiceId === VOXY_SIGNATURE.voiceId)).toBe(true);
    expect(plan.speakerTimeline.filter((entry) => entry.speakerRole === "editorial").every((entry) => entry.voiceId === EDITORIAL_VOICE.voiceId)).toBe(true);
    expect(VOXY_DUAL_VOICE_PILOT_VOICE_BINDINGS).toEqual({
      voxy: {
        speakerRole: "voxy",
        candidateId: "D1",
        voiceId: "voxy-d1-conversational-dynamic-pr621",
        variant: "d1-conversational-dynamic",
        humanIdentityStatus: "accepted",
        synthesisBackend: "chatterbox_multilingual_first_party",
      },
      editorial: {
        speakerRole: "editorial",
        candidateId: "W1",
        voiceId: "de_DE/m-ailabs_low#ramona_deininger",
        variant: "w1-natural-editorial",
        humanIdentityStatus: "accepted",
        synthesisBackend: "mimic3_m_ailabs_ramona_deininger",
      },
    });
    expect(() => assertVoxyPilotVoiceBinding({ speakerRole: "voxy", voiceId: EDITORIAL_VOICE.voiceId })).toThrow("voice_mapping_fail_closed:voxy");
    expect(() => assertVoxyPilotVoiceBinding({ speakerRole: "editorial", voiceId: VOXY_SIGNATURE.voiceId })).toThrow("voice_mapping_fail_closed:editorial");
  });

  it("uses the democracy story and only clearly marked illustrative evidence", () => {
    expect(plan.speakerTimeline[0]?.text).toContain("Wird meine Stimme eigentlich gehört?");
    expect(plan.speakerTimeline.at(-1)?.text).toContain("Du sollst es prüfen können.");
    expect(plan.speakerTimeline.map((entry) => entry.text).join(" ")).toContain("Demokratie");
    expect(VOXY_DUAL_VOICE_PILOT_EVIDENCE.map((entry) => entry.id)).toEqual([
      "democracy-trust",
      "democracy-participation",
      "democracy-open-question",
    ]);
    expect(VOXY_DUAL_VOICE_PILOT_EVIDENCE.every((entry) => entry.provenance === "DEMO / ILLUSTRATION")).toBe(true);
  });

  it("keeps sidecar captions separate from the 1920x1080 24-fps video", () => {
    expect(plan.output).toMatchObject({ width: 1920, height: 1080, fps: 24 });
    expect(plan.output.durationMs).toBeGreaterThanOrEqual(45_000);
    expect(plan.output.durationMs).toBeLessThanOrEqual(90_000);
    expect(VOXY_DUAL_VOICE_PILOT_OUTPUT).toMatchObject({
      directory: "artifacts/voxy-dual-voice-explainer-pilot-01/v1.3",
      mp4: "voxy-democracy-pilot-v1.3.mp4",
      webm: "voxy-democracy-pilot-v1.3.webm",
      captionsVtt: "captions.de.vtt",
      captionsSrt: "captions.de.srt",
      evidenceTimeline: "evidence-timeline.json",
      audioPreservation: "audio-preservation.json",
    });
    expect(plan.captions).toEqual({ sidecarsOnly: true, burnedIn: false, languages: ["de"] });
    expect(buildVoxyDualVoicePilotVtt(plan.speakerTimeline)).toContain("WEBVTT");
    expect(buildVoxyDualVoicePilotSrt(plan.speakerTimeline)).toContain("[Editorial]");
  });

  it("follows both NEWS 5.0 evidence cycles before synthesis and Voxy close", () => {
    expect(plan.visualStateTimeline.map((entry) => entry.state)).toEqual([
      "HOST", "FOCUS", "EXPLAIN", "DOCK", "HOST",
      "FOCUS", "EXPLAIN", "DOCK", "SYNTHESIS", "HOST",
    ]);
    expect(plan.visualStateTimeline.every((entry) =>
      ["start", "end", "state", "activeEvidenceId", "dockedEvidenceIds"].every((field) => field in entry),
    )).toBe(true);
  });

  it("moves the identical evidence object from focus through dock without substitution", () => {
    for (const evidenceId of ["democracy-trust", "democracy-participation"]) {
      const focus = plan.visualStateTimeline.findIndex((entry) => entry.state === "FOCUS" && entry.activeEvidenceId === evidenceId);
      const dock = plan.visualStateTimeline.findIndex((entry) => entry.state === "DOCK" && entry.activeEvidenceId === evidenceId);
      expect(focus).toBeGreaterThan(-1);
      expect(dock).toBeGreaterThan(focus);
      expect(plan.visualStateTimeline[dock]?.dockedEvidenceIds).toContain(evidenceId);
      expect(plan.evidenceTimeline.some((entry) => entry.evidenceId === evidenceId && entry.action === "continuous_scale_translation_to_memory")).toBe(true);
    }
    expect(plan.objectContinuity).toEqual({
      sameEvidenceId: true,
      sameVisualIdentity: true,
      scaleAndTranslation: true,
      hardSubstitution: false,
      crossfadeToDifferentObject: false,
    });
    const dock = plan.visualStateTimeline.find((entry) => entry.state === "DOCK")!;
    const html = renderVoxyDualVoicePilotFrameHtml({ plan, assets, frameIndex: Math.floor(((dock.start + dock.end) / 2) * plan.output.fps), amplitude: 0.4 });
    expect(html).toContain('data-object-continuity="same-object-scale-translation"');
    expect(html).toContain('data-evidence-id="democracy-trust"');
  });

  it("keeps a dynamic evidence memory and derives synthesis from both docked objects", () => {
    const secondFocus = plan.visualStateTimeline.find((entry) => entry.state === "FOCUS" && entry.activeEvidenceId === "democracy-participation")!;
    const focusHtml = renderVoxyDualVoicePilotFrameHtml({ plan, assets, frameIndex: Math.floor(((secondFocus.start + secondFocus.end) / 2) * plan.output.fps), amplitude: 0.5 });
    expect(focusHtml).toContain('data-memory-object="true"');
    expect(focusHtml).toContain('data-evidence-id="democracy-trust"');
    const synthesis = plan.visualStateTimeline.find((entry) => entry.state === "SYNTHESIS")!;
    expect(synthesis.dockedEvidenceIds).toEqual(["democracy-trust", "democracy-participation"]);
    const synthesisHtml = renderVoxyDualVoicePilotFrameHtml({ plan, assets, frameIndex: Math.floor(((synthesis.start + synthesis.end) / 2) * plan.output.fps), amplitude: 0.5 });
    expect(synthesisHtml).toContain('data-synthesis-uses="democracy-trust democracy-participation"');
    expect(synthesisHtml).toContain('data-derived-evidence-id="democracy-open-question"');
    expect(synthesisHtml).toContain(".synthesis-stage{--build:1;");
    expect(synthesisHtml).not.toContain('data-memory-object="true"');
  });

  it("removes burned-in speech text while keeping semantic evidence text", () => {
    const editorial = plan.speakerTimeline.find((entry) => entry.speakerRole === "editorial")!;
    const html = renderVoxyDualVoicePilotFrameHtml({ plan, assets, frameIndex: Math.floor((editorial.start + 0.5) * plan.output.fps), amplitude: 0.8 });
    expect(html).toContain('data-burned-in-captions="false"');
    expect(html).toContain(".caption-bar,.portrait-caption,.editorial-cue{display:none!important}");
    expect(html).not.toContain(editorial.text);
    expect(html).toContain("DEMO · ILLUSTRATION");
  });

  it("keeps Editorial mouth closed while the one waveform remains audio-reactive", () => {
    const editorial = plan.speakerTimeline.find((entry) => entry.speakerRole === "editorial")!;
    const frameIndex = Math.floor((editorial.start + 0.25) * plan.output.fps);
    const html = renderVoxyDualVoicePilotFrameHtml({ plan, assets, frameIndex, amplitude: 0.8 });
    expect(speakerAt(plan, frameIndex / plan.output.fps)?.speakerRole).toBe("editorial");
    expect(html).toContain('data-speaker-role="editorial"');
    expect(html).toContain('data-editorial-mouth-neutral="true"');
    expect(html).toContain('data-mouth-state="closed"');
    expect(html).toContain('data-mouth-next-state="closed"');
    expect(html).toContain('data-waveform-count="1"');
    expect(html.match(/class="audio-waveform-reactive"/g)).toHaveLength(1);
  });

  it("uses Voxy-only mouth sync and preserves the visual canon binding", () => {
    const voxy = plan.speakerTimeline[0]!;
    const frameIndex = Math.floor((voxy.start + 0.5) * plan.output.fps);
    const html = renderVoxyDualVoicePilotFrameHtml({ plan, assets, frameIndex, amplitude: 0.9 });
    expect(html).toContain('data-speaker-role="voxy"');
    expect(html).toContain('data-editorial-mouth-neutral="false"');
    expect(html).toContain('data-mouth-next-state="speakingOpen"');
    expect(plan.visualMasterHeadSha).toBe(VOXY_FIRST_PARTY_VISUAL_BINDING.visualMasterHeadSha);
    expect(plan.mouth).toMatchObject({ profile: "voxy-mouth-v4-1-v1", shapesChanged: false, anchorChanged: false, pivotChanged: false });
  });

  it("keeps privacy and release fail-closed after the human voice freeze", () => {
    expect(plan.privacy).toEqual({
      privateRawVoiceInRepository: false,
      privateReferencePathInManifest: false,
      publicArtifact: false,
      upload: false,
    });
    expect(plan).toMatchObject({
      technicalPilotGate: "passed",
      technicalVoiceMappingGate: "passed",
      humanPilotAcceptance: "pending",
      humanVoiceAcceptance: "accepted",
      humanVoxyVoiceAcceptance: "accepted",
      humanEditorialVoiceAcceptance: "accepted",
      humanNews5VisualAcceptance: "pending",
      canonicalVoxyVoice: "D1 Conversational Dynamic",
      canonicalEditorialVoice: "W1 Natural Editorial",
      genderLabelsAllowed: false,
      videoRenderingAllowed: true,
      productionEligible: false,
      autoPublish: false,
    });
    expect(validateVoxyDualVoicePilotPlan(plan)).toEqual([]);
    expect(VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS.every((entry) => entry.voiceBinding.voiceId === entry.voiceId)).toBe(true);
  });

  it("resolves each visual state continuously across the full timeline", () => {
    for (const entry of plan.visualStateTimeline) {
      expect(visualStateAt(plan, (entry.start + entry.end) / 2).state).toBe(entry.state);
    }
    expect(plan.visualStateTimeline[0]?.start).toBe(0);
    expect(plan.visualStateTimeline.at(-1)?.end).toBe(plan.output.durationMs / 1_000);
  });
});

describe("VOXY single-voice human A/B review variant", () => {
  it("uses D1 for every unchanged spoken segment without changing the canonical voice decisions", () => {
    expect(singleVoicePlan.speakerTimeline).toHaveLength(9);
    expect(singleVoicePlan.speakerTimeline.every((entry) => entry.speakerRole === "voxy" && entry.voiceId === VOXY_SIGNATURE.voiceId)).toBe(true);
    expect(VOXY_SINGLE_VOICE_REVIEW_AUDIO_SEGMENTS.every((entry) => entry.voiceBinding.candidateId === "D1")).toBe(true);
    expect(singleVoicePlan.speakerTimeline.map((entry) => entry.text)).toEqual(plan.speakerTimeline.map((entry) => entry.text));
    expect(singleVoicePlan).toMatchObject({
      reviewVariant: "single_voice_human_ab_test",
      dualVoiceBaseline: "v1.3",
      canonicalArchitectureUnchanged: true,
      technicalSingleVoiceTest: "passed",
      humanSingleVsDualPreference: "pending",
      canonicalVoxyVoice: "D1 Conversational Dynamic",
      canonicalEditorialVoice: "W1 Natural Editorial",
      humanVoxyVoiceAcceptance: "accepted",
      humanEditorialVoiceAcceptance: "accepted",
      productionEligible: false,
      autoPublish: false,
    });
    expect(Object.keys(singleVoicePlan.activeVoiceBindings)).toEqual(["voxy"]);
    expect(validateVoxySingleVoiceReviewPlan(singleVoicePlan)).toEqual([]);
  });

  it("keeps the v1.3 visual grammar while D1 mouth sync remains active in EXPLAIN", () => {
    expect(singleVoicePlan.visualStateTimeline).toEqual(plan.visualStateTimeline);
    expect(singleVoicePlan.visualStateTimeline.map((entry) => entry.state)).toEqual([
      "HOST", "FOCUS", "EXPLAIN", "DOCK", "HOST",
      "FOCUS", "EXPLAIN", "DOCK", "SYNTHESIS", "HOST",
    ]);
    const explain = singleVoicePlan.visualStateTimeline.find((entry) => entry.state === "EXPLAIN")!;
    const frameIndex = Math.floor((explain.start + 0.5) * singleVoicePlan.output.fps);
    const html = renderVoxyDualVoicePilotFrameHtml({ plan: singleVoicePlan, assets, frameIndex, amplitude: 0.9 });
    expect(html).toContain('data-speaker-role="voxy"');
    expect(html).toContain('data-editorial-mouth-neutral="false"');
    expect(html).toContain('data-mouth-next-state="speakingOpen"');
    expect(html).toContain('data-pilot-state="EXPLAIN"');
  });

  it("writes the additive private output separately from the unchanged v1.3 baseline", () => {
    expect(VOXY_SINGLE_VOICE_REVIEW_OUTPUT).toMatchObject({
      directory: "artifacts/voxy-dual-voice-explainer-pilot-01/v1.3-single-voice",
      mp4: "voxy-democracy-pilot-v1.3-single-voice.mp4",
      webm: "voxy-democracy-pilot-v1.3-single-voice.webm",
      masterAudio: "master-audio.wav",
      preview: "preview.png",
      contactSheet: "contact-sheet.png",
      speakerTimeline: "speaker-timeline.json",
      visualStateTimeline: "visual-state-timeline.json",
      manifest: "manifest.json",
      comparisonNotes: "ab-comparison-notes.md",
    });
    expect(VOXY_SINGLE_VOICE_REVIEW_OUTPUT.directory).not.toBe(VOXY_DUAL_VOICE_PILOT_OUTPUT.directory);
  });
});
