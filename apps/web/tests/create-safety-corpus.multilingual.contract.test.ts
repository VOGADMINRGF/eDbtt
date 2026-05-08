import { describe, expect, it } from "vitest";
import { assertCreateSafetyCorpusCase } from "./helpers/createSafetyCorpusRunner";
import { CREATE_SAFETY_CORPUS_MULTILINGUAL } from "./fixtures/createSafetyCorpus.multilingual";

describe("create safety corpus multilingual contract", () => {
  it("keeps multilingual corpus ids unique", () => {
    const ids = CREATE_SAFETY_CORPUS_MULTILINGUAL.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers the required placeholder languages", () => {
    expect(CREATE_SAFETY_CORPUS_MULTILINGUAL.map((entry) => entry.locale).sort()).toEqual([
      "ar",
      "pl",
      "ru",
      "tr",
      "uk",
    ]);
  });

  for (const testCase of CREATE_SAFETY_CORPUS_MULTILINGUAL) {
    it(`${testCase.id}: ${testCase.title}`, () => {
      const result = assertCreateSafetyCorpusCase(testCase);
      expect(result.crossLingualRisk).toBe(true);
      expect(result.noSilentMerge).toBe(true);
    });
  }
});
