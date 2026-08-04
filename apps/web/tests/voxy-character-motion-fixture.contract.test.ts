import { describe, expect, it } from "vitest";
import {
  buildVoxyCharacterMotionFixturePlan,
  getVoxyFixtureDimensions,
  validateVoxyCharacterMotionFixturePlan,
} from "@/features/voxyVideo/characterMotionFixture";
import { renderVoxyCharacterMotionFixtureHtml } from "@/features/voxyVideo/characterMotionFixtureHtml";

describe("Voxy character motion fixture", () => {
  it("supports the three required review output formats", () => {
    expect(getVoxyFixtureDimensions("16:9")).toEqual({ width: 1280, height: 720 });
    expect(getVoxyFixtureDimensions("9:16")).toEqual({ width: 720, height: 1280 });
    expect(getVoxyFixtureDimensions("1:1")).toEqual({ width: 1080, height: 1080 });
  });

  it("builds a contiguous eight-second review-first fixture", () => {
    const plan = buildVoxyCharacterMotionFixturePlan("16:9");
    expect(validateVoxyCharacterMotionFixturePlan(plan)).toEqual({ ok: true, errors: [] });
    expect(plan.version).toBe("voxy-character-motion-fixture-v2");
    expect(plan.durationMs).toBe(8_000);
    expect(plan.fps).toBe(24);
    expect(plan.reviewRequired).toBe(true);
    expect(plan.autoPublish).toBe(false);
    expect(plan.lipSync).toBe(false);
    expect(plan.editorialMode).toBe("facts_updates_only");
    expect(plan.politicalInterpretationAllowed).toBe(false);
    expect(plan.recommendationsAllowed).toBe(false);
    expect(plan.scenes[0]?.startMs).toBe(0);
    expect(plan.scenes.at(-1)?.endMs).toBe(plan.durationMs);
  });

  it("uses the canonical plural brands path and separates studio from character", () => {
    const plan = buildVoxyCharacterMotionFixturePlan("16:9");
    expect(plan.studioAssetPath).toBe(
      "/brands/voxy/studio/voxy-studio-background-16x9.svg",
    );
    expect(plan.characterAssetPath).toBe(
      "/brands/voxy/characters/voxy-sitting-master.svg",
    );
    expect(plan.templateAssetPath).toContain("/brands/voxy/templates/");
    expect(plan.characterAssetPath).not.toBe(plan.studioAssetPath);
  });

  it("locks anatomy, branding and waveform placement", () => {
    const plan = buildVoxyCharacterMotionFixturePlan("16:9");
    expect(plan.anatomyContract.visibleFingerCountPerHand).toBe(5);
    expect(plan.anatomyContract.vogPinRequired).toBe(true);
    expect(plan.anatomyContract.edebattePocketMarkRequired).toBe(true);
    expect(plan.waveformContract.position).toBe("behind_character");
    expect(plan.waveformContract.mayOverlapLogo).toBe(false);
  });

  it("contains source, counterposition and open-question scenes", () => {
    const plan = buildVoxyCharacterMotionFixturePlan("16:9");
    expect(plan.scenes.map((scene) => scene.kind)).toEqual([
      "opening",
      "source_update",
      "contrast",
      "open_question",
      "closing",
    ]);
    expect(plan.scenes.find((scene) => scene.kind === "source_update")?.sourceIds)
      .toHaveLength(3);
    expect(plan.scenes.find((scene) => scene.kind === "contrast")?.sourceIds)
      .toHaveLength(1);
  });

  it("rejects timeline gaps, missing sources and broken anatomy", () => {
    const plan = buildVoxyCharacterMotionFixturePlan("16:9");
    plan.scenes[1] = { ...plan.scenes[1], startMs: 1_700, sourceIds: [] };
    plan.anatomyContract = { ...plan.anatomyContract, visibleFingerCountPerHand: 4 as 5 };
    const validation = validateVoxyCharacterMotionFixturePlan(plan);
    expect(validation.ok).toBe(false);
    expect(validation.errors).toContain("scene_timeline_gap_or_overlap:source-update");
    expect(validation.errors).toContain("source_update_requires_sources");
    expect(validation.errors).toContain("five_finger_anatomy_contract_broken");
  });

  it("renders a provider-free studio composition without a second waveform", () => {
    const plan = buildVoxyCharacterMotionFixturePlan("16:9");
    const html = renderVoxyCharacterMotionFixtureHtml({
      plan,
      embeddedStudioAssetUrl: "data:image/svg+xml;base64,studio",
      embeddedCharacterAssetUrl: "data:image/svg+xml;base64,character",
    });

    expect(html).toContain("VOXY · ON AIR");
    expect(html).toContain("QUELLENSTAND");
    expect(html).toContain("GEGENPOSITION");
    expect(html).toContain("OFFENE FRAGE");
    expect(html).toContain("Ohne Lip-Sync");
    expect(html).toContain("prefers-reduced-motion");
    expect(html).toContain("studio-layer");
    expect(html).toContain("character-layer");
    expect(html).not.toContain('class="waveform"');
    expect(html).not.toContain("HeyGen");
  });

  it("prevents long card copy from rendering past the right edge", () => {
    const plan = buildVoxyCharacterMotionFixturePlan("16:9");
    const html = renderVoxyCharacterMotionFixtureHtml({ plan });
    expect(html).toContain("overflow-wrap:anywhere");
    expect(html).toContain("max-width:100%");
    expect(html).toContain("hyphens:auto");
  });

  it("adapts the fixture canvas for vertical output", () => {
    const plan = buildVoxyCharacterMotionFixturePlan("9:16");
    const html = renderVoxyCharacterMotionFixtureHtml({ plan });
    expect(plan.width).toBe(720);
    expect(plan.height).toBe(1280);
    expect(html).toContain("width:720px");
    expect(html).toContain("height:1280px");
    expect(html).toContain("max-aspect-ratio:1/1");
  });
});
