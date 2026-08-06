import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  VOXY_LEGACY_BASE_PATH,
  VOXY_MASTER_ASSETS,
  VOXY_MASTER_BASE_PATH,
  VOXY_MASTER_GUARDRAILS,
  resolveVoxyMasterDimensions,
} from "@/features/voxy/voxyMasterAssets";

function readPublicAsset(publicPath: string): string {
  return readFileSync(join(process.cwd(), "public", publicPath.replace(/^\//, "")), "utf8");
}

describe("Voxy master asset system", () => {
  it("uses the new plural brands directory as canonical path", () => {
    expect(VOXY_MASTER_BASE_PATH).toBe("/brands/voxy");
    expect(VOXY_LEGACY_BASE_PATH).toBe("/brand/voxy");
    expect(VOXY_MASTER_ASSETS.characters.sitting).toContain("/brands/voxy/");
  });

  it("provides production and 8K marketing dimensions", () => {
    expect(resolveVoxyMasterDimensions("16:9", "production")).toEqual({
      width: 3840,
      height: 2160,
      fps: 30,
    });
    expect(resolveVoxyMasterDimensions("9:16", "marketing8k")).toEqual({
      width: 4320,
      height: 7680,
      fps: 30,
    });
  });

  it("keeps anatomy and brand details fail-closed", () => {
    expect(VOXY_MASTER_GUARDRAILS.exactVisibleFingerCountPerHand).toBe(5);
    expect(VOXY_MASTER_GUARDRAILS.vogPinRequired).toBe(true);
    expect(VOXY_MASTER_GUARDRAILS.edebattePocketMarkRequired).toBe(true);
    expect(VOXY_MASTER_GUARDRAILS.waveformMayOverlapLogo).toBe(false);
  });

  it("verifies the canonical character contains exactly five named digits per hand", () => {
    const svg = readPublicAsset(VOXY_MASTER_ASSETS.characters.sitting);
    const leftDigits = ["left-thumb", "left-index", "left-middle", "left-ring", "left-little"];
    const rightDigits = ["right-thumb", "right-index", "right-middle", "right-ring", "right-little"];

    for (const id of [...leftDigits, ...rightDigits]) {
      expect(svg.match(new RegExp(`id="${id}"`, "g"))).toHaveLength(1);
    }
    expect(leftDigits).toHaveLength(5);
    expect(rightDigits).toHaveLength(5);
    expect(svg).toContain('id="vog-pin"');
    expect(svg).toContain(">VOG</text>");
    expect(svg).toContain('id="edebatte-pocket"');
    expect(svg).toContain(">eDebatte</text>");
  });

  it("exposes stable expression layers for controlled non-lip-sync motion", () => {
    const svg = readPublicAsset(VOXY_MASTER_ASSETS.characters.sitting);
    for (const layer of [
      "left-eye",
      "right-eye",
      "left-eyelid",
      "right-eyelid",
      "left-brow",
      "right-brow",
      "mouth-neutral",
    ]) {
      expect(svg).toContain(`id="${layer}"`);
    }
  });

  it("registers a rig that keeps the waveform behind Voxy and away from the logo", () => {
    const rig = JSON.parse(
      readPublicAsset("/brands/voxy/rig/voxy-rig-manifest.json"),
    ) as {
      requiredLayers: Array<{ id: string; digitCount?: number; zOrder?: string; waveformOverlapAllowed?: boolean }>;
      humanApprovalRequired: boolean;
    };
    expect(rig.requiredLayers.find((layer) => layer.id === "left-hand-five-fingers")?.digitCount).toBe(5);
    expect(rig.requiredLayers.find((layer) => layer.id === "right-hand-five-fingers")?.digitCount).toBe(5);
    expect(rig.requiredLayers.find((layer) => layer.id === "jarvis-waveform")?.zOrder).toBe("behind-character");
    expect(rig.requiredLayers.find((layer) => layer.id === "logo-zone")?.waveformOverlapAllowed).toBe(false);
    expect(rig.humanApprovalRequired).toBe(true);
  });

  it("keeps publishing and lip-sync disabled", () => {
    expect(VOXY_MASTER_GUARDRAILS.lipSyncRequired).toBe(false);
    expect(VOXY_MASTER_GUARDRAILS.reviewRequired).toBe(true);
    expect(VOXY_MASTER_GUARDRAILS.autoPublish).toBe(false);
  });
});
