import { describe, expect, it } from "vitest";
import {
  resolveVote4GovTopicHandoff,
  validateVote4GovArticleRelease,
  type Vote4GovArticleReleaseV1,
} from "@features/vote4gov/sourceRegistry";

const release: Vote4GovArticleReleaseV1 = {
  version: "vote4gov-article-release-v1",
  source: "vote4gov",
  articleId: "article-01",
  issue: "01",
  sourceUrl: "https://review.example.org/ausgabe-01/article-01",
  topicSlug: "bezahlbare-energie-und-waermewende-berlin",
  originalLanguage: "de",
  translations: {
    de: {
      status: "original",
      title: "Kanonischer Artikeltitel",
      summary: "Kanonischer Kurzkontext aus der serverseitigen Registry.",
      thesis: "Die zentrale kanonische These bleibt serverseitig freigegeben.",
      questions: {
        "question-binary": "Soll diese Position weiter beraten werden?",
        "question-open": "Welche Gegenposition oder Quelle fehlt?",
      },
    },
    en: {
      status: "reviewed_translation",
      title: "Canonical article title",
      summary: "Canonical server-side context.",
      thesis: "The canonical thesis remains server-released.",
      questions: {
        "question-binary": "Should this position be discussed further?",
        "question-open": "Which counter-position or source is missing?",
      },
    },
  },
  lifecycle: "open",
  visibility: "public",
  participationClass: "open_public_consultation",
  questions: [
    {
      questionId: "question-binary",
      kind: "binary_thesis",
      counterpositionHref: "/dossier/energie#gegenpositionen",
      impactHref: "/anlassraum/energie#wirkung",
    },
    {
      questionId: "question-open",
      kind: "open_question",
      counterpositionHref: "/dossier/energie#gegenpositionen",
      impactHref: "/anlassraum/energie#wirkung",
    },
  ],
};

function encoded(overrides: Record<string, unknown> = {}) {
  return Buffer.from(JSON.stringify({
    version: "vote4gov-context-v1",
    source: "vote4gov",
    articleId: "article-01",
    issue: "01",
    sourceUrl: "https://review.example.org/ausgabe-01/article-01",
    locale: "de",
    questions: [
      {
        questionId: "question-open",
        prompt: "Manipulierter Querytext",
        remembered: true,
      },
      {
        questionId: "question-binary",
        prompt: "Eine andere Formulierung",
        response: "disagree",
      },
    ],
    ...overrides,
  }), "utf8").toString("base64url");
}

describe("Vote4Gov server-side article registry", () => {
  it("validates a released article without granting query authority", () => {
    expect(validateVote4GovArticleRelease(release)).toBe(true);
    const result = resolveVote4GovTopicHandoff({
      encodedBundle: encoded(),
      topicSlug: release.topicSlug,
      registry: [release],
    });
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.value.title).toBe("Kanonischer Artikeltitel");
    expect(result.value.questions.map((question) => question.questionId)).toEqual([
      "question-binary",
      "question-open",
    ]);
    expect(result.value.questions.map((question) => question.prompt)).toEqual([
      "Soll diese Position weiter beraten werden?",
      "Welche Gegenposition oder Quelle fehlt?",
    ]);
    expect(result.value.questions.map((question) => question.localSelection)).toEqual([
      "disagree",
      "remembered",
    ]);
  });

  it("keeps binary and open-question semantics separate", () => {
    const result = resolveVote4GovTopicHandoff({
      encodedBundle: encoded(),
      topicSlug: release.topicSlug,
      registry: [release],
    });
    expect(result.status === "resolved" && result.value.questions.map((item) => item.kind)).toEqual([
      "binary_thesis",
      "open_question",
    ]);
  });

  it("uses a reviewed EN version and marks a missing translation fallback", () => {
    const english = resolveVote4GovTopicHandoff({
      encodedBundle: encoded({ locale: "en-GB" }),
      topicSlug: release.topicSlug,
      registry: [release],
    });
    expect(english.status === "resolved" && english.value.title).toBe("Canonical article title");
    expect(english.status === "resolved" && english.value.translationStatus).toBe(
      "reviewed_translation",
    );

    const withoutEnglish = { ...release, translations: { de: release.translations.de } };
    const fallback = resolveVote4GovTopicHandoff({
      encodedBundle: encoded({ locale: "en" }),
      topicSlug: release.topicSlug,
      registry: [withoutEnglish],
    });
    expect(fallback.status === "resolved" && fallback.value.readingLanguage).toBe("de");
    expect(fallback.status === "resolved" && fallback.value.translationStatus).toBe(
      "missing_fallback",
    );
  });

  it.each([
    ["unknown article", encoded({ articleId: "unknown" }), release.topicSlug, "unknown_article"],
    ["wrong topic", encoded(), "anderes-thema", "article_context_mismatch"],
    ["wrong issue", encoded({ issue: "02" }), release.topicSlug, "article_context_mismatch"],
    [
      "wrong source",
      encoded({ sourceUrl: "https://attacker.example/article" }),
      release.topicSlug,
      "article_context_mismatch",
    ],
    [
      "unknown question",
      encoded({ questions: [{ questionId: "question-unknown" }] }),
      release.topicSlug,
      "unknown_question",
    ],
  ])("fails closed for %s", (_label, encodedBundle, topicSlug, reason) => {
    expect(
      resolveVote4GovTopicHandoff({ encodedBundle, topicSlug, registry: [release] }),
    ).toEqual({ status: "invalid", reason });
  });

  it("exposes only the unavailable adapter before PR #557 is integrated", () => {
    const result = resolveVote4GovTopicHandoff({
      encodedBundle: encoded(),
      topicSlug: release.topicSlug,
      registry: [release],
    });
    expect(result.status === "resolved" && result.value.publicBallot).toEqual({
      status: "unavailable",
      label: "Public Ballot noch nicht freigegeben",
      publicHref: null,
      canWrite: false,
      adapter: "vog-public-ballot-unavailable-v1",
    });
  });

  it("keeps /create secondary and preserves question/article origin", () => {
    const result = resolveVote4GovTopicHandoff({
      encodedBundle: encoded(),
      topicSlug: release.topicSlug,
      registry: [release],
    });
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    const href = new URL(result.value.questions[0]!.contributionHref, "https://edebatte.org");
    expect(href.pathname).toBe("/create");
    expect(href.searchParams.get("source")).toBe("vote4gov_context");
    expect(href.searchParams.get("sourceId")).toBe("article-01");
    expect(href.searchParams.get("reason")).toBe("vote4gov_question:question-binary");
    expect(result.value.questions[0]!.counterpositionHref).toBe(
      "/dossier/energie#gegenpositionen",
    );
    expect(result.value.questions[0]!.impactHref).toBe("/anlassraum/energie#wirkung");
  });

  it("rejects invalid registry releases and duplicate article registrations", () => {
    const invalid = {
      ...release,
      questions: [{ ...release.questions[0]!, counterpositionHref: "https://attacker.example" }],
    };
    expect(validateVote4GovArticleRelease(invalid)).toBe(false);
    expect(
      resolveVote4GovTopicHandoff({
        encodedBundle: encoded(),
        topicSlug: release.topicSlug,
        registry: [release, release],
      }),
    ).toEqual({ status: "invalid", reason: "invalid_registry_release" });
  });
});
