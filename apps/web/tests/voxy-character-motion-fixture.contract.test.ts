import { describe, expect, it } from "vitest";
import {
  buildVoxyCharacterMotionFixturePlan,
  getVoxyFixtureDimensions,
  validateVoxyCharacterMotionFixturePlan,
} from "@/features/voxyVideo/characterMotionFixture";
import { renderVoxyCharacterMotionFixtureHtml } from "@/features/voxyVideo/characterMotionFixtureHtml";

describe("Voxy character motion fixture", () => {
  it("supports the three required output formats", () => {
    expect(getVoxyFixtureDimensions("16:9")).toEqual({ width: 1280, height: 720 });
    expect(getVoxyFixtureDimensions("9:16")).toEqual({ width: 720, height: 1280 });
    expect(getVoxyFixtureDimensions("1:1")).toEqual({ width: 1080, height: 1080 });
  });

  it("builds a contiguous eight-second review-first fixture", () => {
    const plan = buildVoxyCharacterMotionFixturePlan("16:9");
    const validation = validateVoxyCharacterMotionFixturePlan(plan);

    expect(validation).toEqual({ ok: true, errors: [] });
    expect(plan.durationMs).toBe(8_000);
    expect(plan.fps).toBe(24);
    expect((plan.durationMs / 1_000) * plan.fps).toBe(192);
    expect(plan.reviewRequired).toBe(true);
    expect(plan.autoPublish).toBe(false);
    expect(plan.lipSync).toBe(false);
    expect(plan.editorialMode).toBe("facts_updates_only");
    expect(plan.politicalInterpretationAllowed).toBe(false);
    expect(plan.recommendationsAllowed).toBe(false);
    expect(plan.scenes[0]?.startMs).toBe(0);
    expect(plan.scenes.at(-1)?.endMs).toBe(plan.durationMs);
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

  it("rejects timeline gaps and source cards without sources", () => {
    const plan = buildVoxyCharacterMotionFixturePlan("16:9");
    plan.scenes[1] = {
      ...plan.scenes[1],
      startMs: 1_700,
      sourceIds: [],
    };

    const validation = validateVoxyCharacterMotionFixturePlan(plan);
    expect(validation.ok).toBe(false);
    expect(validation.errors).toContain("scene_timeline_gap_or_overlap:source-update");
    expect(validation.errors).toContain("source_update_requires_sources");
  });

  it("renders a standalone, provider-free studio composition", () => {
    const plan = buildVoxyCharacterMotionFixturePlan("16:9");
    const html = renderVoxyCharacterMotionFixtureHtml({
      plan,
      embeddedCharacterAssetUrl: "data:image/png;base64,fixture",
    });

    expect(html).toContain("VOXY · ON AIR");
    expect(html).toContain("QUELLENSTAND");
    expect(html).toContain("GEGENPOSITION");
    expect(html).toContain("OFFENE FRAGE");
    expect(html).toContain("Ohne Lip-Sync");
    expect(html).toContain("prefers-reduced-motion");
    expect(html).toContain("character-layer");
    expect(html).not.toContain("HeyGen");
    expect(html).not.toContain("autoPublish: true");
  });

  it("supports exact paused frame capture for deterministic 24fps output", () => {
    const plan = buildVoxyCharacterMotionFixturePlan("16:9");
    const html = renderVoxyCharacterMotionFixtureHtml({
      plan,
      captureTimeMs: 4_000,
    });

    expect(html).toContain('class="capture-mode"');
    expect(html).toContain("--capture-time:4000ms");
    expect(html).toContain("animation-play-state: paused");
    expect(html).toContain("calc(var(--scene-start) - var(--capture-time))");
  });

  it("clamps capture time to the fixture duration", () => {
    const plan = buildVoxyCharacterMotionFixturePlan("16:9");
    const html = renderVoxyCharacterMotionFixtureHtml({
      plan,
      captureTimeMs: 99_999,
    });

    expect(html).toContain("--capture-time:7999ms");
  });

  it("adapts the fixture canvas for vertical output", () => {
    const plan = buildVoxyCharacterMotionFixturePlan("9:16");
    const html = renderVoxyCharacterMotionFixtureHtml({ plan });

    expect(plan.width).toBe(720);
    expect(plan.height).toBe(1280);
    expect(html).toContain("width: 720px");
    expect(html).toContain("height: 1280px");
    expect(html).toContain("max-aspect-ratio: 1/1");
  });
});
