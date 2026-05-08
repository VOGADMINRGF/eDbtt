import { describe, expect, it } from "vitest";
import { assertCreateSafetyCorpusCase } from "./helpers/createSafetyCorpusRunner";
import { CREATE_SAFETY_CORPUS_EN } from "./fixtures/createSafetyCorpus.en";

describe("create safety corpus en contract", () => {
  it("keeps english corpus ids unique", () => {
    const ids = CREATE_SAFETY_CORPUS_EN.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const testCase of CREATE_SAFETY_CORPUS_EN) {
    it(`${testCase.id}: ${testCase.title}`, () => {
      assertCreateSafetyCorpusCase(testCase);
    });
  }
});
