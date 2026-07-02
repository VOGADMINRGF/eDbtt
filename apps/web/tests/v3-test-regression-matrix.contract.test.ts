import { describe, expect, it } from "vitest";

import {
  V3_TEST_MATRIX_ITEM_IDS,
  buildV3TestRegressionMatrix,
} from "@/features/admin/v3TestRegressionMatrix";

describe("v3 test regression matrix contract", () => {
  it("contains all required matrix groups with valid coverage states", () => {
    const readModel = buildV3TestRegressionMatrix();

    expect([...readModel.items.map((entry) => entry.id)].sort()).toEqual(
      [...V3_TEST_MATRIX_ITEM_IDS].sort(),
    );
    expect(readModel.summary.total).toBe(readModel.items.length);

    for (const item of readModel.items) {
      expect(item.nextSliceId).toMatch(/^V3-/);
      expect(Array.isArray(item.knownTests)).toBe(true);
      expect(Array.isArray(item.missingTests)).toBe(true);
      expect(item.categories.length).toBeGreaterThan(0);
    }
  });

  it("keeps missing and docs-only items blocking endstate_ready and surfaces core gaps", () => {
    const readModel = buildV3TestRegressionMatrix();
    const noAutoPublish = readModel.items.find((entry) => entry.id === "no_auto_publish");
    const noHiddenCosts = readModel.items.find((entry) => entry.id === "no_hidden_cost_paths");
    const noFakeActions = readModel.items.find((entry) => entry.id === "no_fake_actions");
    const externalBrowser = readModel.items.find((entry) => entry.id === "external_browser_e2e");
    const programm = readModel.items.find((entry) => entry.id === "programme_candidate_pipeline");
    const socialDrafts = readModel.items.find((entry) => entry.id === "social_output_drafts");

    for (const item of readModel.items.filter(
      (entry) => entry.coverageStatus === "missing" || entry.coverageStatus === "docs_only",
    )) {
      expect(item.blocksEndstateReady).toBe(true);
    }

    expect(noAutoPublish).toMatchObject({ coverageStatus: "covered" });
    expect(noHiddenCosts).toMatchObject({ coverageStatus: "covered" });
    expect(noFakeActions).toMatchObject({ coverageStatus: "covered" });
    expect(externalBrowser?.coverageStatus).not.toBe("covered");
    expect(programm).toBeTruthy();
    expect(socialDrafts).toBeTruthy();
  });

  it("keeps known and missing test references explicit for every item", () => {
    const readModel = buildV3TestRegressionMatrix();

    for (const item of readModel.items) {
      expect(item.knownTests).toBeDefined();
      expect(item.missingTests).toBeDefined();
      expect(item.guardrailNotes.length).toBeGreaterThan(0);
    }
  });
});
