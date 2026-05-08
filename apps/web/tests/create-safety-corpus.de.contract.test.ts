import { describe, expect, it } from "vitest";
import {
  assertCreateSafetyCorpusCase,
  type CreateSafetyCorpusCase,
} from "./helpers/createSafetyCorpusRunner";
import { CREATE_SAFETY_CORPUS_DE } from "./fixtures/createSafetyCorpus.de";
import { CREATE_SAFETY_CORPUS_EN } from "./fixtures/createSafetyCorpus.en";
import { CREATE_SAFETY_CORPUS_MULTILINGUAL } from "./fixtures/createSafetyCorpus.multilingual";

function expectUniqueIds(cases: CreateSafetyCorpusCase[]) {
  const ids = cases.map((entry) => entry.id);
  expect(new Set(ids).size).toBe(ids.length);
}

describe("create safety corpus de contract", () => {
  it("keeps the full corpus at or above 60 structured cases", () => {
    const total =
      CREATE_SAFETY_CORPUS_DE.length +
      CREATE_SAFETY_CORPUS_EN.length +
      CREATE_SAFETY_CORPUS_MULTILINGUAL.length;

    expect(total).toBeGreaterThanOrEqual(60);
  });

  it("keeps german corpus ids unique", () => {
    expectUniqueIds(CREATE_SAFETY_CORPUS_DE);
  });

  for (const testCase of CREATE_SAFETY_CORPUS_DE) {
    it(`${testCase.id}: ${testCase.title}`, () => {
      assertCreateSafetyCorpusCase(testCase);
    });
  }
});
