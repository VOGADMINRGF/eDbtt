import { describe, expect, it } from "vitest";
import {
  buildVoxyAnimatableMasterAsset,
  buildVoxyMasterMotionFrame,
  validateVoxyAnimatableMasterAsset,
} from "@/features/voxyVideo/animatableMasterAsset";

describe("Voxy animatable master asset", () => {
  it("builds one shared independent layer rig for both brand themes", () => {
    const edebatte = buildVoxyAnimatableMasterAsset("edebatte");
    const vog = buildVoxyAnimatableMasterAsset("vog_member");

    expect(validateVoxyAnimatableMasterAsset(edebatte)).toEqual({
      ok: true,
      errors: [],
    });
    expect(validateVoxyAnimatableMasterAsset(vog)).toEqual({
      ok: true,
      errors: [],
    });
    expect(edebatte.layers.map((layer) => layer.id)).toEqual(
      vog.layers.map((layer) => layer.id),
    );
    expect(edebatte.colors.primary).toBe("#0B5FFF");
    expect(vog.colors.jacket).toContain("#16D7C7");
    expect(vog.colors.jacket).toContain("#2A7CFF");
  });

  it("keeps all required anatomy, expression and brand layers independent", () => {
    const master = buildVoxyAnimatableMasterAsset("edebatte");
    const leftHand = master.layers.find(
      (layer) => layer.id === "left-hand-five-fingers",
    );
    const rightHand = master.layers.find(
      (layer) => layer.id === "right-hand-five-fingers",
    );
    const pin = master.layers.find((layer) => layer.id === "vog-pin");
    const pocket = master.layers.find(
      (layer) => layer.id === "edebatte-pocket",
    );

    expect(leftHand).toMatchObject({ independent: true, digitCount: 5 });
    expect(rightHand).toMatchObject({ independent: true, digitCount: 5 });
    expect(pin?.sourcePath).not.toBe(pocket?.sourcePath);
    expect(master.lipSync).toBe(false);
    expect(master.visemes).toBe(false);
  });

  it("produces bounded head, arm and eyelid transforms", () => {
    const master = buildVoxyAnimatableMasterAsset("vog_member");
    const frame = buildVoxyMasterMotionFrame({
      master,
      motion: "highlighting_source",
      timeMs: 500,
    });

    const head = frame.transforms.find((item) => item.layerId === "head");
    const leftArm = frame.transforms.find(
      (item) => item.layerId === "left-arm",
    );
    expect(Math.abs(head?.rotateDegrees ?? 99)).toBeLessThanOrEqual(4);
    expect(Math.abs(leftArm?.rotateDegrees ?? 99)).toBeLessThanOrEqual(18);
    expect(frame.motion).toBe("highlighting_source");
  });

  it("fails closed when an independent required layer is missing", () => {
    const master = buildVoxyAnimatableMasterAsset("edebatte");
    master.layers = master.layers.filter((layer) => layer.id !== "left-eye");

    expect(validateVoxyAnimatableMasterAsset(master).errors).toContain(
      "required_layer_missing:left-eye",
    );
  });

  it("rejects duplicate layers and missing pivots", () => {
    const master = buildVoxyAnimatableMasterAsset("edebatte");
    const head = master.layers.find((layer) => layer.id === "head");
    if (!head) throw new Error("head layer missing in fixture");
    head.pivot = null;
    master.layers.push({ ...master.layers[0] });

    const validation = validateVoxyAnimatableMasterAsset(master);
    expect(validation.errors).toContain("pivot_missing:head");
    expect(validation.errors).toContain("duplicate_layer:studio-background");
  });

  it("rejects finger mutation and waveform placement in front of Voxy", () => {
    const master = buildVoxyAnimatableMasterAsset("vog_member");
    const hand = master.layers.find(
      (layer) => layer.id === "right-hand-five-fingers",
    );
    const waveform = master.layers.find(
      (layer) => layer.id === "jarvis-waveform",
    );
    if (!hand || !waveform) throw new Error("required fixture layers missing");
    hand.digitCount = 4 as 5;
    waveform.zIndex = 999;

    const validation = validateVoxyAnimatableMasterAsset(master);
    expect(validation.errors).toContain(
      "five_finger_contract_broken:right-hand-five-fingers",
    );
    expect(validation.errors).toContain(
      "waveform_must_remain_behind_character",
    );
  });

  it("keeps all required output crops and human approval gate", () => {
    const master = buildVoxyAnimatableMasterAsset("edebatte");
    expect(master.cropSafeFormats).toEqual(["16:9", "9:16", "1:1"]);
    expect(master.humanApprovalRequired).toBe(true);
  });
});
