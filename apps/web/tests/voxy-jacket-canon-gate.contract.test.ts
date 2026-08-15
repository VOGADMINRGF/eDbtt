import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildVoxyJacketCanonGatePlan,
  validateVoxyJacketCanonGatePlan,
  VOXY_JACKET_CANON_GATE_CROPS,
  VOXY_JACKET_CANON_MARK_PROVENANCE,
  VOXY_JACKET_CANON_GATE_OUTPUT,
  VOXY_JACKET_CANON_PIXEL_MATCH_CROPS,
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
    expect(plan.pixelMatchCrops).toBe(VOXY_JACKET_CANON_PIXEL_MATCH_CROPS);
    expect(plan.source.canonBoardId).toBe("CANON-04");
    expect(Object.keys(plan.source.allCanonHashes)).toHaveLength(4);
  });

  it("records the exact Canon pixel match without claiming OCR", () => {
    const { brandQa } = buildVoxyJacketCanonGatePlan(HEAD);
    expect(brandQa.evidenceMethod).toBe(
      "exact_canon_pixel_match_plus_human_visual_review_no_ocr_claim",
    );
    expect(brandQa.lapelPin).toMatchObject({
      expectedText: "VOG",
      expectedVisibleMarkCount: 1,
      visibleMarkCount: 1,
      machineRecognizedText: null,
      status: "passed",
    });
    expect(brandQa.pocketMark).toMatchObject({
      expectedText: "eDebatte",
      expectedVisibleMarkCount: 1,
      visibleMarkCount: 1,
      badgePresent: false,
      secondLinePresent: false,
      machineRecognizedText: null,
      status: "passed",
    });
  });

  it("passes the Jacket gate while keeping layer master and Motion v3 closed", () => {
    const plan = buildVoxyJacketCanonGatePlan(HEAD);
    expect(plan.jacketCanonGate).toEqual({
      passed: true,
      lapelPin: "passed",
      pocketMark: "passed",
      texturePreserved: true,
      lapelGeometryPreserved: true,
      pocketGeometryPreserved: true,
      bluePipingPreserved: true,
      visualIntegration: "passed",
    });
    expect(plan.layerMasterEligible).toBe(false);
    expect(plan.motionV3Eligible).toBe(false);
    expect(plan.animationEligible).toBe(false);
    expect(plan.humanVisualAcceptance).toBe("pending");
    expect(plan.productionEligible).toBe(false);
    expect(plan.autoPublish).toBe(false);
    expect(validateVoxyJacketCanonGatePlan(plan)).toEqual([]);
  });

  it("rejects Canon-match drift and any silent downstream release", () => {
    const drift = structuredClone(buildVoxyJacketCanonGatePlan(HEAD));
    drift.jacketCanonGate.passed = false as true;
    drift.brandQa.pocketMark.visibleMarkCount = 2 as 1;
    drift.motionV3Eligible = true as false;
    drift.productionEligible = true as false;
    expect(validateVoxyJacketCanonGatePlan(drift)).toEqual(
      expect.arrayContaining([
        "brand_qa_must_reflect_canon_pixel_match",
        "jacket_gate_pass_contract_invalid",
        "downstream_and_release_gates_must_fail_closed",
      ]),
    );
  });

  it("binds honest geometric provenance for both retained Canon marks", () => {
    const plan = buildVoxyJacketCanonGatePlan(HEAD);
    expect(plan.markProvenance).toBe(VOXY_JACKET_CANON_MARK_PROVENANCE);
    for (const mark of Object.values(plan.markProvenance)) {
      expect(mark.sourceCanonFile).toContain(
        "CANON-04-broadcast-layout-blue.png",
      );
      expect(mark.scale.effective).toBeCloseTo(1.234449761);
      expect(mark.rotation).toEqual({
        additionalDegrees: 0,
        nativeCanonAnglePreserved: true,
      });
      expect(mark.opacity).toBe(1);
      expect(mark.compositingMethod).toBe(
        "retain_unmodified_canon_raster_pixels_via_primary_a_camera_no_overlay",
      );
    }
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
    expect(source).toContain("jacket_canon_pixel_match_failed");
    expect(source).toContain("No layer master or Motion v3 render is authorized");
    expect(source).not.toContain("vogPinOverlay");
    expect(source).not.toContain("edebattePocketOverlay");
    expect(source).not.toContain("artifacts/voxy-layer-master");
    expect(source).not.toContain("artifacts/voxy-motion-v3");
  });
});
