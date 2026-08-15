import { describe, expect, it } from "vitest";
import {
  buildVoxyFirstExplainerPlan,
  buildVoxyFirstExplainerSrt,
  buildVoxyFirstExplainerVtt,
  findVoxyFirstExplainerSegment,
  validateVoxyFirstExplainerPlan,
  VOXY_FIRST_EXPLAINER_DETECTOR_HEAD,
  VOXY_FIRST_EXPLAINER_OUTPUT,
  VOXY_FIRST_EXPLAINER_STATIC_MASTER_HEAD,
  VOXY_FIRST_EXPLAINER_TIMELINE,
} from "@/features/voxyVideo/firstExplainerVideo";
import {
  buildVoxyFirstExplainerFrameState,
  renderVoxyFirstExplainerFrameHtml,
} from "@/features/voxyVideo/firstExplainerVideoHtml";

const HEAD = "9cb25e91ae6fe04f7e532e8116cf0f500ee30ddb";
const ASSETS = {
  canonStageDataUrl: "data:image/png;base64,canon",
  wordmarkDataUrl: "data:image/svg+xml;base64,wordmark",
  vogPinDataUrl: "data:image/svg+xml;base64,vog",
  edebattePocketMarkDataUrl: "data:image/svg+xml;base64,edebatte",
};

describe("Voxy first explainer video contract", () => {
  it("binds the accepted static A/C decision and the unchanged #588 detector head", () => {
    const plan = buildVoxyFirstExplainerPlan(HEAD);
    expect(plan.staticMaster).toEqual({
      exactHeadSha: VOXY_FIRST_EXPLAINER_STATIC_MASTER_HEAD,
      primaryMaster: "A",
      editorialVariant: "C",
      rejectedVariant: "B",
      humanVisualAcceptance: "accepted",
    });
    expect(VOXY_FIRST_EXPLAINER_DETECTOR_HEAD).toHaveLength(40);
    expect(validateVoxyFirstExplainerPlan(plan)).toEqual([]);
  });

  it("defines a contiguous 16-second, 24-fps, five-state timeline", () => {
    const plan = buildVoxyFirstExplainerPlan(HEAD);
    expect(plan.output).toMatchObject({
      durationMs: 16_000,
      fps: 24,
      frameCount: 384,
      width: 1280,
      height: 720,
    });
    expect(plan.output).toBe(VOXY_FIRST_EXPLAINER_OUTPUT);
    expect(plan.timeline).toHaveLength(5);
    expect(plan.timeline.map((segment) => segment.id)).toEqual([
      "voxy_intro",
      "vote4gov_why",
      "edebatte_what",
      "voiceopengov_how",
      "voxy_connects",
    ]);
    expect(findVoxyFirstExplainerSegment(3_500).id).toBe("vote4gov_why");
    expect(findVoxyFirstExplainerSegment(15_500).id).toBe("voxy_connects");
  });

  it("preserves the exact why/what/how brand architecture without party claims", () => {
    expect(VOXY_FIRST_EXPLAINER_TIMELINE[1].editorialRole).toBe(
      "DENK- UND REFLEXIONSEBENE · WARUM",
    );
    expect(VOXY_FIRST_EXPLAINER_TIMELINE[2].editorialRole).toBe(
      "INSTRUMENT · WAS",
    );
    expect(VOXY_FIRST_EXPLAINER_TIMELINE[3].editorialRole).toBe(
      "BEWEGUNG · WIE",
    );
    const serialized = JSON.stringify(VOXY_FIRST_EXPLAINER_TIMELINE);
    expect(serialized).not.toMatch(/Partei|Kandidat|Wahlplattform/i);
    expect(VOXY_FIRST_EXPLAINER_TIMELINE[0].caption).toMatch(
      /^Hallo Nachbarn,/,
    );
  });

  it("keeps the flattened identity locked and all human/production gates fail-closed", () => {
    const plan = buildVoxyFirstExplainerPlan(HEAD);
    expect(plan.timeline.every((segment) => segment.handGesture === "none_flattened_master_identity_lock"))
      .toBe(true);
    expect(plan.motionBoundary).toMatchObject({
      flattenedMaster: true,
      independentHeadMotionAvailable: false,
      independentHandMotionAvailable: false,
    });
    expect(plan.audioProvenance.audioIncluded).toBe(false);
    expect(plan.externalProviderUsed).toBe(false);
    expect(plan.externalUploadUsed).toBe(false);
    expect(plan.generativeRedrawUsed).toBe(false);
    expect(plan.humanVisualAcceptance).toBe("pending");
    expect(plan.productionEligible).toBe(false);
    expect(plan.autoPublish).toBe(false);
  });

  it("rejects invented animation, audio and publication readiness", () => {
    const drift = structuredClone(buildVoxyFirstExplainerPlan(HEAD));
    drift.timeline[1].handGesture = "invented_hand_gesture" as never;
    drift.audioProvenance.audioIncluded = true as false;
    drift.productionEligible = true as false;
    expect(validateVoxyFirstExplainerPlan(drift)).toEqual(
      expect.arrayContaining([
        "flattened_identity_lock_broken",
        "audio_provenance_must_fail_closed",
        "human_and_production_gates_must_fail_closed",
      ]),
    );
  });

  it("renders deterministic local frames with exact native marks and one waveform contract", () => {
    const plan = buildVoxyFirstExplainerPlan(HEAD);
    for (const format of ["16:9", "9:16", "1:1"] as const) {
      const html = renderVoxyFirstExplainerFrameHtml({
        plan,
        assets: ASSETS,
        frameIndex: 192,
        format,
      });
      expect(html).toContain(`data-format="${format}"`);
      expect(html).toContain('data-waveform-count="1"');
      expect(html).toContain('data-waveform-placement="behind_voxy"');
      expect(html).toContain('alt="VOG"');
      expect(html).toContain('alt="eDebatte"');
      expect(html).toContain(">eDebatte<");
      expect(html).not.toMatch(/https?:\/\//);
      expect(html).not.toContain("<video");
      expect(html).not.toContain("<canvas");
      expect(html).not.toContain("@keyframes");
    }
  });

  it("reuses only pixel-identical stable visual states", () => {
    const plan = buildVoxyFirstExplainerPlan(HEAD);
    const stableA = buildVoxyFirstExplainerFrameState({
      plan,
      frameIndex: 30,
    });
    const stableB = buildVoxyFirstExplainerFrameState({
      plan,
      frameIndex: 31,
    });
    const blink = buildVoxyFirstExplainerFrameState({
      plan,
      frameIndex: 40,
    });
    expect(stableA.visualStateKey).toBe(stableB.visualStateKey);
    expect(blink.visualStateKey).not.toBe(stableA.visualStateKey);
  });

  it("emits matching German VTT and SRT sidecars", () => {
    const vtt = buildVoxyFirstExplainerVtt();
    const srt = buildVoxyFirstExplainerSrt();
    expect(vtt).toContain("WEBVTT");
    expect(vtt).toContain("00:00:06.000 --> 00:00:10.000");
    expect(srt).toContain("00:00:06,000 --> 00:00:10,000");
    for (const segment of VOXY_FIRST_EXPLAINER_TIMELINE) {
      expect(vtt).toContain(segment.caption);
      expect(srt).toContain(segment.caption);
    }
  });
});
