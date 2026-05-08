import { expect } from "vitest";
import {
  evaluateCreateInputSafety,
  type CreateInputSafetyDecision,
  type CreateInputSafetyFindingKind,
  type CreateInputSafetyResult,
} from "@/features/create/safety/createInputSafety";

export type CreateSafetyCorpusCase = {
  id: string;
  title: string;
  locale: "de" | "en" | "tr" | "ar" | "ru" | "uk" | "pl";
  input: string;
  expectedDecision: CreateInputSafetyDecision;
  allowedDecisions?: CreateInputSafetyDecision[];
  mustFind?: CreateInputSafetyFindingKind[];
  mustNotFind?: CreateInputSafetyFindingKind[];
  mustRedact?: string[];
  mustNotContainInRedacted?: string[];
  mustHaveFactcheckCandidate?: boolean;
  mustHaveGraphReviewHint?: boolean;
  mayProceedAsSafeQuestion?: boolean;
  notes?: string;
};

type EvaluateLocaleConfig = {
  locale: "de" | "en";
  sourceLanguage: string;
  contentLanguage: string;
};

function resolveEvaluationLocaleConfig(
  testCase: CreateSafetyCorpusCase,
): EvaluateLocaleConfig {
  if (testCase.locale === "en") {
    return {
      locale: "en",
      sourceLanguage: "en",
      contentLanguage: "en",
    };
  }

  if (testCase.locale === "de") {
    return {
      locale: "de",
      sourceLanguage: "de",
      contentLanguage: "de",
    };
  }

  // Placeholder multilingual samples are evaluated as non-DE source text
  // entering the German graph where same_language_only remains the default.
  return {
    locale: "de",
    sourceLanguage: testCase.locale,
    contentLanguage: "de",
  };
}

export function evaluateCreateSafetyCorpusCase(
  testCase: CreateSafetyCorpusCase,
): CreateInputSafetyResult {
  const localeConfig = resolveEvaluationLocaleConfig(testCase);

  return evaluateCreateInputSafety({
    text: testCase.input,
    locale: localeConfig.locale,
    sourceLanguage: localeConfig.sourceLanguage,
    contentLanguage: localeConfig.contentLanguage,
    routeStage: "analyze",
  });
}

function expectNoRawLeak(result: CreateInputSafetyResult, fragments: string[]) {
  const reviewJson = JSON.stringify(result.reviewItems);
  const telemetryJson = JSON.stringify(result.telemetry);

  for (const fragment of fragments) {
    expect(result.redactedText).not.toContain(fragment);
    expect(reviewJson).not.toContain(fragment);
    expect(telemetryJson).not.toContain(fragment);
  }
}

export function assertCreateSafetyCorpusCase(testCase: CreateSafetyCorpusCase) {
  const result = evaluateCreateSafetyCorpusCase(testCase);
  const allowedDecisions = new Set([
    testCase.expectedDecision,
    ...(testCase.allowedDecisions ?? []),
  ]);
  const findingKinds = result.findings.map((entry) => entry.kind);

  expect(
    allowedDecisions.has(result.decision),
    `${testCase.id} expected ${Array.from(allowedDecisions).join(", ")} but received ${result.decision}`,
  ).toBe(true);

  for (const finding of testCase.mustFind ?? []) {
    expect(
      findingKinds.includes(finding),
      `${testCase.id} must include finding ${finding}`,
    ).toBe(true);
  }

  for (const finding of testCase.mustNotFind ?? []) {
    expect(
      findingKinds.includes(finding),
      `${testCase.id} must not include finding ${finding}`,
    ).toBe(false);
  }

  const redactionFragments = testCase.mustRedact ?? [];
  if (redactionFragments.length > 0) {
    expectNoRawLeak(result, redactionFragments);
    expect(result.telemetry.redactionApplied).toBe(true);
  }

  for (const fragment of testCase.mustNotContainInRedacted ?? []) {
    expect(result.redactedText).not.toContain(fragment);
  }

  if (typeof testCase.mustHaveFactcheckCandidate === "boolean") {
    if (testCase.mustHaveFactcheckCandidate) {
      expect(result.factCheckCandidates.length).toBeGreaterThan(0);
    } else {
      expect(result.factCheckCandidates).toHaveLength(0);
    }
  }

  if (typeof testCase.mustHaveGraphReviewHint === "boolean") {
    if (testCase.mustHaveGraphReviewHint) {
      expect(result.graphReviewHints.length).toBeGreaterThan(0);
      expect(result.noSilentMerge).toBe(true);
    } else {
      expect(result.graphReviewHints).toHaveLength(0);
    }
  }

  if (testCase.mayProceedAsSafeQuestion) {
    expect(result.decision).toBe("allow");
    expect(result.factCheckCandidates.length).toBeGreaterThan(0);
    expect(result.factCheckCandidates.every((candidate) => candidate.truthStatus === "open")).toBe(true);
    expect(result.reviewItems.some((item) => item.code === "safe_question_proceed")).toBe(true);
  }

  return result;
}
