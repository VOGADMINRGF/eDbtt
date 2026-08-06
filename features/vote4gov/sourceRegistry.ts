import {
  parseVote4GovContextBundle,
  type Vote4GovContextParseFailureReason,
  type Vote4GovLocalResponse,
} from "./contextBundle";
import {
  getVote4GovPublicBallotHandoff,
  type Vote4GovPublicBallotHandoff,
} from "./publicBallotAdapter";

export type Vote4GovRegistryLanguage = "de" | "en";
export type Vote4GovQuestionKind = "binary_thesis" | "open_question";
export type Vote4GovArticleLifecycle = "scheduled" | "open" | "closed";

export type Vote4GovLocalizedArticleRelease = {
  status: "original" | "reviewed_translation";
  title: string;
  summary: string;
  thesis: string;
  questions: Record<string, string>;
};

export type Vote4GovArticleQuestionRelease = {
  questionId: string;
  kind: Vote4GovQuestionKind;
  counterpositionHref: string;
  impactHref: string;
};

export type Vote4GovArticleReleaseV1 = {
  version: "vote4gov-article-release-v1";
  source: "vote4gov";
  articleId: string;
  issue: string;
  sourceUrl: string;
  topicSlug: string;
  originalLanguage: Vote4GovRegistryLanguage;
  translations: Partial<Record<Vote4GovRegistryLanguage, Vote4GovLocalizedArticleRelease>>;
  lifecycle: Vote4GovArticleLifecycle;
  visibility: "public";
  participationClass: "open_public_consultation";
  questions: Vote4GovArticleQuestionRelease[];
};

export type Vote4GovResolvedQuestion = {
  questionId: string;
  kind: Vote4GovQuestionKind;
  prompt: string;
  localSelection: "agree" | "disagree" | "remembered" | null;
  sourceHref: string;
  counterpositionHref: string;
  contributionHref: string;
  impactHref: string;
};

export type Vote4GovResolvedTopicHandoff = {
  articleId: string;
  issue: string;
  sourceUrl: string;
  topicSlug: string;
  title: string;
  summary: string;
  thesis: string;
  lifecycle: Vote4GovArticleLifecycle;
  participationClass: "open_public_consultation";
  originalLanguage: Vote4GovRegistryLanguage;
  readingLanguage: Vote4GovRegistryLanguage;
  translationStatus: "original" | "reviewed_translation" | "missing_fallback";
  questions: Vote4GovResolvedQuestion[];
  publicBallot: Vote4GovPublicBallotHandoff;
};

export type Vote4GovTopicHandoffFailureReason =
  | Vote4GovContextParseFailureReason
  | "unknown_article"
  | "invalid_registry_release"
  | "article_context_mismatch"
  | "unknown_question";

export type Vote4GovTopicHandoffResolution =
  | { status: "absent" }
  | { status: "invalid"; reason: Vote4GovTopicHandoffFailureReason }
  | { status: "resolved"; value: Vote4GovResolvedTopicHandoff };

const STABLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/;
const TOPIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Version-controlled, server-owned release registry. No article is included
 * until its canonical text, source, topic relation and release state have
 * been confirmed. Query data can never create a release entry.
 */
export const VOTE4GOV_ARTICLE_RELEASES_V1: readonly Vote4GovArticleReleaseV1[] = [];

function isSafeText(value: unknown, maxLength: number) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maxLength &&
    !/[\u0000-\u001f\u007f<>]/u.test(value)
  );
}

function isCanonicalHttpsUrl(value: unknown) {
  if (!isSafeText(value, 2_048)) return false;
  try {
    const parsed = new URL(value as string);
    return (
      parsed.protocol === "https:" &&
      parsed.username === "" &&
      parsed.password === "" &&
      Boolean(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function isInternalRegistryTarget(value: unknown, allowedPrefixes: readonly string[]) {
  if (!isSafeText(value, 1_024)) return false;
  if (!(value as string).startsWith("/") || (value as string).startsWith("//")) return false;
  if ((value as string).includes("\\")) return false;
  try {
    const parsed = new URL(value as string, "https://edebatte.invalid");
    if (parsed.origin !== "https://edebatte.invalid") return false;
    return allowedPrefixes.some(
      (prefix) => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`),
    );
  } catch {
    return false;
  }
}

export function validateVote4GovArticleRelease(release: Vote4GovArticleReleaseV1) {
  if (
    release.version !== "vote4gov-article-release-v1" ||
    release.source !== "vote4gov" ||
    !STABLE_ID_PATTERN.test(release.articleId) ||
    !isSafeText(release.issue, 40) ||
    !isCanonicalHttpsUrl(release.sourceUrl) ||
    !TOPIC_SLUG_PATTERN.test(release.topicSlug) ||
    !["de", "en"].includes(release.originalLanguage) ||
    !["scheduled", "open", "closed"].includes(release.lifecycle) ||
    release.visibility !== "public" ||
    release.participationClass !== "open_public_consultation" ||
    !Array.isArray(release.questions) ||
    release.questions.length === 0 ||
    release.questions.length > 12
  ) {
    return false;
  }

  const questionIds = new Set<string>();
  for (const question of release.questions) {
    if (
      !STABLE_ID_PATTERN.test(question.questionId) ||
      questionIds.has(question.questionId) ||
      !["binary_thesis", "open_question"].includes(question.kind) ||
      !isInternalRegistryTarget(question.counterpositionHref, ["/topic", "/dossier", "/anlassraum", "/runden"]) ||
      !isInternalRegistryTarget(question.impactHref, ["/topic", "/dossier", "/anlassraum", "/runden"])
    ) {
      return false;
    }
    questionIds.add(question.questionId);
  }

  const translationKeys = Object.keys(release.translations);
  if (
    translationKeys.length === 0 ||
    translationKeys.some((language) => language !== "de" && language !== "en")
  ) {
    return false;
  }
  const original = release.translations[release.originalLanguage];
  if (!original || original.status !== "original") return false;
  for (const language of translationKeys as Vote4GovRegistryLanguage[]) {
    const translation = release.translations[language];
    if (
      !translation ||
      !["original", "reviewed_translation"].includes(translation.status) ||
      !isSafeText(translation.title, 240) ||
      !isSafeText(translation.summary, 1_200) ||
      !isSafeText(translation.thesis, 800)
    ) {
      return false;
    }
    if (Object.keys(translation.questions).length !== release.questions.length) return false;
    for (const question of release.questions) {
      if (!isSafeText(translation.questions[question.questionId], 800)) return false;
    }
  }
  return true;
}

function normalizeSourceUrl(value: string) {
  return new URL(value).href;
}

function requestedLanguage(locale: string): Vote4GovRegistryLanguage | null {
  const language = locale.toLowerCase().split("-")[0];
  return language === "de" || language === "en" ? language : null;
}

function localSelection(response: Vote4GovLocalResponse | undefined, remembered?: boolean) {
  if (response === "agree" || response === "disagree") return response;
  return remembered ? "remembered" : null;
}

function contributionHref(params: {
  topicSlug: string;
  articleId: string;
  questionId: string;
  articleTitle: string;
}) {
  const query = new URLSearchParams();
  query.set("mode", "source");
  query.set("entryIntent", "issue_signal");
  query.set("entryMode", "guided");
  query.set("source", "vote4gov_context");
  query.set("reason", `vote4gov_question:${params.questionId}`);
  query.set("signalTitle", params.articleTitle.slice(0, 160));
  query.set("returnTo", `/topic/${params.topicSlug}`);
  query.set("sourceId", params.articleId);
  return `/create?${query.toString()}`;
}

export function resolveVote4GovTopicHandoff(params: {
  encodedBundle: string | string[] | undefined;
  topicSlug: string;
  registry?: readonly Vote4GovArticleReleaseV1[];
}): Vote4GovTopicHandoffResolution {
  if (params.encodedBundle === undefined) return { status: "absent" };
  const parsed = parseVote4GovContextBundle(params.encodedBundle);
  if (parsed.ok === false) return { status: "invalid", reason: parsed.reason };

  const registry = params.registry ?? VOTE4GOV_ARTICLE_RELEASES_V1;
  const matches = registry.filter((entry) => entry.articleId === parsed.value.articleId);
  if (matches.length === 0) return { status: "invalid", reason: "unknown_article" };
  if (matches.length !== 1 || !validateVote4GovArticleRelease(matches[0]!)) {
    return { status: "invalid", reason: "invalid_registry_release" };
  }
  const release = matches[0]!;
  if (
    release.topicSlug !== params.topicSlug ||
    release.issue !== parsed.value.issue ||
    normalizeSourceUrl(release.sourceUrl) !== normalizeSourceUrl(parsed.value.sourceUrl)
  ) {
    return { status: "invalid", reason: "article_context_mismatch" };
  }

  const releaseQuestionIds = new Set(release.questions.map((question) => question.questionId));
  if (parsed.value.questions.some((question) => !releaseQuestionIds.has(question.questionId))) {
    return { status: "invalid", reason: "unknown_question" };
  }
  const localByQuestionId = new Map(
    parsed.value.questions.map((question) => [question.questionId, question] as const),
  );
  const preferredLanguage = requestedLanguage(parsed.value.locale);
  const selectedLanguage =
    (preferredLanguage && release.translations[preferredLanguage] ? preferredLanguage : null) ??
    release.originalLanguage;
  const translation = release.translations[selectedLanguage]!;
  const translationStatus =
    preferredLanguage && preferredLanguage !== selectedLanguage
      ? "missing_fallback"
      : translation.status;

  return {
    status: "resolved",
    value: {
      articleId: release.articleId,
      issue: release.issue,
      sourceUrl: release.sourceUrl,
      topicSlug: release.topicSlug,
      title: translation.title,
      summary: translation.summary,
      thesis: translation.thesis,
      lifecycle: release.lifecycle,
      participationClass: release.participationClass,
      originalLanguage: release.originalLanguage,
      readingLanguage: selectedLanguage,
      translationStatus,
      questions: release.questions.map((question) => {
        const local = localByQuestionId.get(question.questionId);
        return {
          questionId: question.questionId,
          kind: question.kind,
          prompt: translation.questions[question.questionId]!,
          localSelection: localSelection(local?.response, local?.remembered),
          sourceHref: release.sourceUrl,
          counterpositionHref: question.counterpositionHref,
          contributionHref: contributionHref({
            topicSlug: release.topicSlug,
            articleId: release.articleId,
            questionId: question.questionId,
            articleTitle: translation.title,
          }),
          impactHref: question.impactHref,
        };
      }),
      publicBallot: getVote4GovPublicBallotHandoff(),
    },
  };
}
