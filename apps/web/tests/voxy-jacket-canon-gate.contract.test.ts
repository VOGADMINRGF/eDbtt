import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildVoxyJacketCanonGatePlan,
  validateVoxyJacketCanonGatePlan,
  VOXY_JACKET_CANON_GATE_CROPS,
  VOXY_JACKET_CANON_GATE_OUTPUT,
  VOXY_JACKET_HARD_CANON_REGION,
} from "@/features/voxyVideo/jacketCanonGate";

const HEAD = "7c6aa18e5618b4ef82760f24e1ecf9b80c04ff70";

describe("Voxy jacket canon gate contract", () => {
  it("makes the jacket and both character marks a hard Canon region", () => {
    const plan = buildVoxyJacketCanonGatePlan(HEAD);
    expect(plan.hardCanonRegion).toBe(VOXY_JACKET_HARD_CANON_REGION);
    expect(plan.hardCanonRegion).toEqual([
      "jacket_cut",
      "lapel_geometry",
      "fabric_texture",
      "stitching",
      "pocket_geometry",
      "blue_piping",
      "vog_lapel_pin",
      "edebatte_pocket_mark",
    ]);
    expect(plan.cropContract).toBe(VOXY_JACKET_CANON_GATE_CROPS);
    expect(plan.source.canonBoardId).toBe("CANON-04");
    expect(Object.keys(plan.source.allCanonHashes)).toHaveLength(4);
  });

  it("records the rejected visible brand state without claiming OCR", () => {
    const { brandQa } = buildVoxyJacketCanonGatePlan(HEAD);
    expect(brandQa.evidenceMethod).toBe(
      "human_visual_review_plus_asset_provenance_no_ocr_claim",
    );
    expect(brandQa.lapelPin).toMatchObject({
      expectedText: "VOG",
      expectedVisibleMarkCount: 1,
      visibleMarkCount: 1,
      machineRecognizedText: null,
      status: "failed",
    });
    expect(brandQa.pocketMark).toMatchObject({
      expectedText: "eDebatte",
      expectedVisibleMarkCount: 1,
      visibleMarkCount: 2,
      badgePresent: false,
      secondLinePresent: true,
      machineRecognizedText: null,
      status: "failed",
    });
  });

  it("stops layer master and Motion v3 fail-closed", () => {
    const plan = buildVoxyJacketCanonGatePlan(HEAD);
    expect(plan.jacketCanonGate).toEqual({
      passed: false,
      lapelPin: "failed",
      pocketMark: "failed",
      texturePreserved: false,
      pocketGeometryPreserved: false,
      visualIntegration: "failed",
    });
    expect(plan.layerMasterEligible).toBe(false);
    expect(plan.motionV3Eligible).toBe(false);
    expect(plan.animationEligible).toBe(false);
    expect(plan.humanVisualAcceptance).toBe("pending");
    expect(plan.productionEligible).toBe(false);
    expect(plan.autoPublish).toBe(false);
    expect(validateVoxyJacketCanonGatePlan(plan)).toEqual([]);
  });

  it("rejects a silent downstream release or invented brand pass", () => {
    const drift = structuredClone(buildVoxyJacketCanonGatePlan(HEAD));
    drift.jacketCanonGate.passed = true as false;
    drift.brandQa.pocketMark.visibleMarkCount = 1 as 2;
    drift.motionV3Eligible = true as false;
    drift.productionEligible = true as false;
    expect(validateVoxyJacketCanonGatePlan(drift)).toEqual(
      expect.arrayContaining([
        "brand_qa_must_reflect_rejected_visual_evidence",
        "jacket_gate_must_fail_closed",
        "downstream_and_release_gates_must_fail_closed",
      ]),
    );
  });

  it("binds exactly the five mandatory visual evidence PNGs", () => {
    expect(VOXY_JACKET_CANON_GATE_OUTPUT).toMatchObject({
      outputDirectory: "artifacts/voxy-jacket-canon-gate",
      jacketFullFileName: "jacket-full.png",
      jacket200PctFileName: "jacket-200pct.png",
      lapelPin400PctFileName: "lapel-pin-400pct.png",
      pocketMark400PctFileName: "pocket-mark-400pct.png",
      comparisonFileName: "jacket-canon-comparison.png",
      manifestFileName: "manifest.json",
    });
  });

  it("keeps the renderer local and explicitly excludes downstream artifacts", () => {
    const source = readFileSync(
      resolve(process.cwd(), "scripts/render-voxy-jacket-canon-gate.ts"),
      "utf8",
    );
    for (const file of [
      "jacketFullFileName",
      "jacket200PctFileName",
      "lapelPin400PctFileName",
      "pocketMark400PctFileName",
      "comparisonFileName",
      "manifestFileName",
    ]) {
      expect(source).toContain(file);
    }
    expect(source).toContain("external_requests_detected");
    expect(source).toContain("No layer master or Motion v3 render is authorized");
    expect(source).not.toContain("artifacts/voxy-layer-master");
    expect(source).not.toContain("artifacts/voxy-motion-v3");
  });
});
