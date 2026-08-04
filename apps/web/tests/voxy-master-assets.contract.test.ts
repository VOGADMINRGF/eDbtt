import { describe, expect, it } from "vitest";
import {
  VOXY_LEGACY_BASE_PATH,
  VOXY_MASTER_ASSETS,
  VOXY_MASTER_BASE_PATH,
  VOXY_MASTER_GUARDRAILS,
  resolveVoxyMasterDimensions,
} from "@/features/voxy/voxyMasterAssets";

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

  it("keeps publishing and lip-sync disabled", () => {
    expect(VOXY_MASTER_GUARDRAILS.lipSyncRequired).toBe(false);
    expect(VOXY_MASTER_GUARDRAILS.reviewRequired).toBe(true);
    expect(VOXY_MASTER_GUARDRAILS.autoPublish).toBe(false);
  });
});
