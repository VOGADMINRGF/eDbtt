import { describe, expect, it } from "vitest";
import {
  parseVote4GovContextBundle,
  VOTE4GOV_CONTEXT_MAX_ENCODED_BYTES,
  VOTE4GOV_CONTEXT_MAX_QUESTIONS,
  type Vote4GovContextBundleV1,
} from "@features/vote4gov/contextBundle";

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function bundle(overrides: Partial<Vote4GovContextBundleV1> = {}): Vote4GovContextBundleV1 {
  return {
    version: "vote4gov-context-v1",
    source: "vote4gov",
    articleId: "article-01",
    issue: "01",
    sourceUrl: "https://review.example.org/ausgabe-01/article-01",
    locale: "de-DE",
    questions: [
      {
        questionId: "question-01",
        prompt: "Dieser Querytext ist nur ein untrusted Hinweis.",
        response: "agree",
        remembered: true,
        updatedAt: "2026-08-03T08:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

describe("vote4gov-context-v1 bundle", () => {
  it("decodes a canonical, bounded Base64URL payload", () => {
    const result = parseVote4GovContextBundle(encode(bundle()));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.articleId).toBe("article-01");
    expect(result.value.questions[0]?.response).toBe("agree");
    expect(result.encodedBytes).toBeGreaterThan(result.decodedBytes);
  });

  it.each([
    ["missing", undefined, "missing"],
    ["duplicate query", ["one", "two"], "duplicate_query_parameter"],
    ["padding", "eyJmb28iOiJiYXIifQ==", "invalid_base64url"],
    ["non-url alphabet", "***", "invalid_base64url"],
  ])("fails closed for %s", (_label, encoded, reason) => {
    expect(parseVote4GovContextBundle(encoded as string | string[] | undefined)).toEqual({
      ok: false,
      reason,
    });
  });

  it("rejects oversized encoded and decoded payloads before domain use", () => {
    expect(parseVote4GovContextBundle("a".repeat(VOTE4GOV_CONTEXT_MAX_ENCODED_BYTES + 1))).toEqual({
      ok: false,
      reason: "encoded_too_large",
    });
    const decodedTooLarge = Buffer.alloc(13_000, 97).toString("base64url");
    expect(parseVote4GovContextBundle(decodedTooLarge)).toEqual({
      ok: false,
      reason: "decoded_too_large",
    });
  });

  it("rejects invalid JSON, unsupported versions and privileged extra fields", () => {
    expect(parseVote4GovContextBundle(Buffer.from("not-json").toString("base64url"))).toEqual({
      ok: false,
      reason: "invalid_json",
    });
    const wrongVersion = { ...bundle(), version: "vote4gov-context-v2" };
    expect(
      parseVote4GovContextBundle(Buffer.from(JSON.stringify(wrongVersion)).toString("base64url")),
    ).toEqual({ ok: false, reason: "unsupported_version" });
    const privileged = { ...bundle(), accountId: "user-123" };
    expect(
      parseVote4GovContextBundle(Buffer.from(JSON.stringify(privileged)).toString("base64url")),
    ).toEqual({ ok: false, reason: "invalid_schema" });
  });

  it("rejects non-HTTPS sources, HTML-like hints and malformed timestamps", () => {
    for (const candidate of [
      bundle({ sourceUrl: "http://review.example.org/article" }),
      bundle({ questions: [{ questionId: "q-1", prompt: "<img src=x>" }] }),
      bundle({ questions: [{ questionId: "q-1", updatedAt: "yesterday" }] }),
    ]) {
      expect(parseVote4GovContextBundle(encode(candidate))).toEqual({
        ok: false,
        reason: "invalid_schema",
      });
    }
  });

  it("rejects duplicate IDs and more than the maximum question count", () => {
    const duplicate = bundle({
      questions: [{ questionId: "q-1" }, { questionId: "q-1" }],
    });
    expect(parseVote4GovContextBundle(encode(duplicate))).toEqual({
      ok: false,
      reason: "duplicate_question_id",
    });
    const tooMany = bundle({
      questions: Array.from({ length: VOTE4GOV_CONTEXT_MAX_QUESTIONS + 1 }, (_, index) => ({
        questionId: `q-${index + 1}`,
      })),
    });
    expect(parseVote4GovContextBundle(encode(tooMany))).toEqual({
      ok: false,
      reason: "invalid_schema",
    });
  });
});
