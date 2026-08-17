import { describe, expect, it } from "vitest";

import {
  EDITORIAL_VOICE,
  VOXY_SIGNATURE,
} from "../src/features/voxyVideo/dualVoiceArchitecture";
import {
  VOXY_DUAL_VOICE_PILOT_EVIDENCE,
  VOXY_DUAL_VOICE_PILOT_OUTPUT,
  buildVoxyDualVoicePilotPlan,
  speakerAt,
  validateVoxyDualVoicePilotPlan,
  visualStateAt,
} from "../src/features/voxyVideo/dualVoiceExplainerPilot";
import { renderVoxyDualVoicePilotFrameHtml } from "../src/features/voxyVideo/dualVoiceExplainerPilotHtml";
import { VOXY_FIRST_PARTY_VISUAL_BINDING } from "../src/features/voxyVideo/firstPartyVoiceClone";

const exactHead = "a".repeat(40);
const plan = buildVoxyDualVoicePilotPlan(
  exactHead,
  [8_000, 6_500, 8_500, 5_000, 4_200, 6_500, 3_000],
);
const assets = {
  canonStageDataUrl: "data:image/png;base64,AA==",
  studioLockupDataUrl: "data:image/svg+xml;base64,AA==",
  lapelPinDataUrl: "data:image/svg+xml;base64,AA==",
  edebattePocketMarkDataUrl: "data:image/svg+xml;base64,AA==",
};

describe("VOXY dual-voice explainer pilot", () => {
  it("builds exactly seven explicit speaker blocks with accepted role-bound voices", () => {
    expect(plan.speakerTimeline).toHaveLength(7);
    expect(plan.speakerTimeline.every((entry) =>
      ["start", "end", "speakerRole", "voiceId", "text"].every((field) => field in entry),
    )).toBe(true);
    expect(plan.speakerTimeline.filter((entry) => entry.speakerRole === "voxy").every((entry) => entry.voiceId === VOXY_SIGNATURE.voiceId)).toBe(true);
    expect(plan.speakerTimeline.filter((entry) => entry.speakerRole === "editorial").every((entry) => entry.voiceId === EDITORIAL_VOICE.voiceId)).toBe(true);
    expect(plan.speakerTimeline[0]?.text.startsWith("Hallo Nachbar,")).toBe(true);
    expect(plan.speakerTimeline.slice(1).some((entry) => entry.text.includes("Hallo Nachbar,"))).toBe(false);
  });

  it("keeps the technical media contract in the 45–60 second window", () => {
    expect(plan.output).toMatchObject({ width: 1920, height: 1080, fps: 24 });
    expect(plan.output.durationMs).toBeGreaterThanOrEqual(45_000);
    expect(plan.output.durationMs).toBeLessThanOrEqual(60_000);
    expect(VOXY_DUAL_VOICE_PILOT_OUTPUT).toMatchObject({
      mp4: "voxy-dual-voice-explainer-pilot-01.mp4",
      webm: "voxy-dual-voice-explainer-pilot-01.webm",
      masterAudio: "master-audio.wav",
      preview: "preview.png",
      contactSheet: "contact-sheet.png",
      speakerTimeline: "speaker-timeline.json",
      visualStateTimeline: "visual-state-timeline.json",
      manifest: "manifest.json",
    });
  });

  it("follows HOST FOCUS EXPLAIN DOCK twice before synthesis and Voxy close", () => {
    expect(plan.visualStateTimeline.map((entry) => entry.state)).toEqual([
      "HOST", "FOCUS", "EXPLAIN", "DOCK", "HOST",
      "FOCUS", "EXPLAIN", "DOCK", "SYNTHESIS", "HOST",
    ]);
    expect(plan.visualStateTimeline.every((entry) =>
      ["start", "end", "state", "activeEvidenceId", "dockedEvidenceIds"].every((field) => field in entry),
    )).toBe(true);
  });

  it("focuses information before docking it into dynamic evidence memory", () => {
    const firstFocus = plan.visualStateTimeline.findIndex((entry) => entry.state === "FOCUS" && entry.activeEvidenceId === "claim-headline");
    const firstDock = plan.visualStateTimeline.findIndex((entry) => entry.state === "DOCK" && entry.activeEvidenceId === "claim-headline");
    expect(firstFocus).toBeGreaterThan(-1);
    expect(firstDock).toBeGreaterThan(firstFocus);
    expect(plan.visualStateTimeline[firstDock]?.dockedEvidenceIds).toContain("claim-headline");
  });

  it("synthesizes all previously docked fixture evidence", () => {
    const synthesis = plan.visualStateTimeline.find((entry) => entry.state === "SYNTHESIS");
    expect(synthesis?.dockedEvidenceIds).toEqual(VOXY_DUAL_VOICE_PILOT_EVIDENCE.map((entry) => entry.id));
    expect(VOXY_DUAL_VOICE_PILOT_EVIDENCE.every((entry) => entry.provenance === "DEMO / FORMAT-FIXTURE")).toBe(true);
  });

  it("keeps Editorial mouth neutral while the one waveform remains audio-reactive", () => {
    const editorial = plan.speakerTimeline.find((entry) => entry.speakerRole === "editorial")!;
    const frameIndex = Math.floor(((editorial.start + 0.25) * plan.output.fps));
    const html = renderVoxyDualVoicePilotFrameHtml({ plan, assets, frameIndex, amplitude: 0.8 });
    expect(speakerAt(plan, frameIndex / plan.output.fps)?.speakerRole).toBe("editorial");
    expect(html).toContain('data-speaker-role="editorial"');
    expect(html).toContain('data-editorial-mouth-neutral="true"');
    expect(html).toContain('data-mouth-state="neutral"');
    expect(html).toContain('data-waveform-count="1"');
    expect(html).toContain('data-waveform-audio-reactive="true"');
    expect(html.match(/class="audio-waveform-reactive"/g)).toHaveLength(1);
  });

  it("uses Voxy-only audio mouth sync and preserves the visual canon binding", () => {
    const voxy = plan.speakerTimeline[0]!;
    const frameIndex = Math.floor(((voxy.start + 0.5) * plan.output.fps));
    const html = renderVoxyDualVoicePilotFrameHtml({ plan, assets, frameIndex, amplitude: 0.9 });
    expect(html).toContain('data-speaker-role="voxy"');
    expect(html).toContain('data-editorial-mouth-neutral="false"');
    expect(html).toContain('data-mouth-next-state="speakingOpen"');
    expect(plan.visualMasterHeadSha).toBe(VOXY_FIRST_PARTY_VISUAL_BINDING.visualMasterHeadSha);
    expect(plan.mouth).toMatchObject({ profile: "voxy-mouth-v4-1-v1", shapesChanged: false, anchorChanged: false, pivotChanged: false });
  });

  it("keeps privacy, human review, production and publishing fail-closed", () => {
    expect(plan.privacy).toEqual({
      privateRawVoiceInRepository: false,
      privateReferencePathInManifest: false,
      publicArtifact: false,
      upload: false,
    });
    expect(plan).toMatchObject({
      humanPilotAcceptance: "pending",
      productionEligible: false,
      autoPublish: false,
    });
    expect(validateVoxyDualVoicePilotPlan(plan)).toEqual([]);
  });

  it("resolves each visual state continuously across the full timeline", () => {
    for (const entry of plan.visualStateTimeline) {
      const state = visualStateAt(plan, (entry.start + entry.end) / 2);
      expect(state.state).toBe(entry.state);
    }
    expect(plan.visualStateTimeline[0]?.start).toBe(0);
    expect(plan.visualStateTimeline.at(-1)?.end).toBe(plan.output.durationMs / 1_000);
  });
});
