export const VOTE4GOV_CONTEXT_VERSION = "vote4gov-context-v1" as const;
export const VOTE4GOV_CONTEXT_MAX_ENCODED_BYTES = 20_000;
export const VOTE4GOV_CONTEXT_MAX_DECODED_BYTES = 12_288;
export const VOTE4GOV_CONTEXT_MAX_QUESTIONS = 12;

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const LOCALE_PATTERN = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const RFC3339_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

export type Vote4GovLocalResponse = "agree" | "disagree" | null;

export type Vote4GovContextQuestionV1 = {
  questionId: string;
  prompt?: string;
  response?: Vote4GovLocalResponse;
  remembered?: boolean;
  updatedAt?: string | null;
};

export type Vote4GovContextBundleV1 = {
  version: typeof VOTE4GOV_CONTEXT_VERSION;
  source: "vote4gov";
  articleId: string;
  issue: string;
  sourceUrl: string;
  locale: string;
  questions: Vote4GovContextQuestionV1[];
};

export type Vote4GovContextParseFailureReason =
  | "missing"
  | "duplicate_query_parameter"
  | "encoded_too_large"
  | "invalid_base64url"
  | "decoded_too_large"
  | "invalid_utf8"
  | "invalid_json"
  | "invalid_schema"
  | "unsupported_version"
  | "duplicate_question_id";

export type Vote4GovContextParseResult =
  | {
      ok: true;
      value: Vote4GovContextBundleV1;
      encodedBytes: number;
      decodedBytes: number;
    }
  | { ok: false; reason: Vote4GovContextParseFailureReason };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  required: readonly string[],
) {
  const keys = Object.keys(value);
  return keys.every((key) => allowed.includes(key)) && required.every((key) => keys.includes(key));
}

function isBoundedText(value: unknown, maxLength: number, allowEmpty = false): value is string {
  if (typeof value !== "string") return false;
  if ((!allowEmpty && value.length === 0) || value.length > maxLength) return false;
  if (/[\u0000-\u001f\u007f]/u.test(value)) return false;
  return !/[<>]/u.test(value);
}

function isStableId(value: unknown, maxLength: number): value is string {
  return isBoundedText(value, maxLength) && ID_PATTERN.test(value);
}

function isHttpsUrl(value: unknown): value is string {
  if (!isBoundedText(value, 2_048)) return false;
  try {
    const parsed = new URL(value);
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

function parseQuestion(value: unknown): Vote4GovContextQuestionV1 | null {
  if (!isPlainObject(value)) return null;
  if (
    !hasExactKeys(
      value,
      ["questionId", "prompt", "response", "remembered", "updatedAt"],
      ["questionId"],
    )
  ) {
    return null;
  }
  if (!isStableId(value.questionId, 96)) return null;
  if (value.prompt !== undefined && !isBoundedText(value.prompt, 500)) return null;
  if (
    value.response !== undefined &&
    value.response !== null &&
    value.response !== "agree" &&
    value.response !== "disagree"
  ) {
    return null;
  }
  if (value.remembered !== undefined && typeof value.remembered !== "boolean") return null;
  if (
    value.updatedAt !== undefined &&
    value.updatedAt !== null &&
    (!isBoundedText(value.updatedAt, 40) ||
      !RFC3339_PATTERN.test(value.updatedAt) ||
      Number.isNaN(Date.parse(value.updatedAt)))
  ) {
    return null;
  }
  return {
    questionId: value.questionId,
    ...(value.prompt === undefined ? {} : { prompt: value.prompt as string }),
    ...(value.response === undefined
      ? {}
      : { response: value.response as Vote4GovLocalResponse }),
    ...(value.remembered === undefined
      ? {}
      : { remembered: value.remembered as boolean }),
    ...(value.updatedAt === undefined
      ? {}
      : { updatedAt: value.updatedAt as string | null }),
  };
}

function parseBundle(value: unknown): Vote4GovContextParseResult {
  if (!isPlainObject(value)) return { ok: false, reason: "invalid_schema" };
  if (
    !hasExactKeys(
      value,
      ["version", "source", "articleId", "issue", "sourceUrl", "locale", "questions"],
      ["version", "source", "articleId", "issue", "sourceUrl", "locale", "questions"],
    )
  ) {
    return { ok: false, reason: "invalid_schema" };
  }
  if (value.version !== VOTE4GOV_CONTEXT_VERSION) {
    return { ok: false, reason: "unsupported_version" };
  }
  if (
    value.source !== "vote4gov" ||
    !isStableId(value.articleId, 96) ||
    !isBoundedText(value.issue, 40) ||
    !isHttpsUrl(value.sourceUrl) ||
    !isBoundedText(value.locale, 24) ||
    !LOCALE_PATTERN.test(value.locale) ||
    !Array.isArray(value.questions) ||
    value.questions.length > VOTE4GOV_CONTEXT_MAX_QUESTIONS
  ) {
    return { ok: false, reason: "invalid_schema" };
  }

  const questions: Vote4GovContextQuestionV1[] = [];
  const questionIds = new Set<string>();
  for (const rawQuestion of value.questions) {
    const question = parseQuestion(rawQuestion);
    if (!question) return { ok: false, reason: "invalid_schema" };
    if (questionIds.has(question.questionId)) {
      return { ok: false, reason: "duplicate_question_id" };
    }
    questionIds.add(question.questionId);
    questions.push(question);
  }

  return {
    ok: true,
    value: {
      version: VOTE4GOV_CONTEXT_VERSION,
      source: "vote4gov",
      articleId: value.articleId,
      issue: value.issue,
      sourceUrl: value.sourceUrl,
      locale: value.locale,
      questions,
    },
    encodedBytes: 0,
    decodedBytes: 0,
  };
}

export function parseVote4GovContextBundle(
  encoded: string | string[] | undefined,
): Vote4GovContextParseResult {
  if (encoded === undefined) return { ok: false, reason: "missing" };
  if (Array.isArray(encoded)) return { ok: false, reason: "duplicate_query_parameter" };
  const encodedBytes = Buffer.byteLength(encoded, "utf8");
  if (encodedBytes > VOTE4GOV_CONTEXT_MAX_ENCODED_BYTES) {
    return { ok: false, reason: "encoded_too_large" };
  }
  if (!encoded || !BASE64URL_PATTERN.test(encoded)) {
    return { ok: false, reason: "invalid_base64url" };
  }

  let decoded: Buffer;
  try {
    decoded = Buffer.from(encoded, "base64url");
  } catch {
    return { ok: false, reason: "invalid_base64url" };
  }
  if (decoded.toString("base64url") !== encoded) {
    return { ok: false, reason: "invalid_base64url" };
  }
  if (decoded.byteLength > VOTE4GOV_CONTEXT_MAX_DECODED_BYTES) {
    return { ok: false, reason: "decoded_too_large" };
  }

  let jsonText: string;
  try {
    jsonText = new TextDecoder("utf-8", { fatal: true }).decode(decoded);
  } catch {
    return { ok: false, reason: "invalid_utf8" };
  }

  let json: unknown;
  try {
    json = JSON.parse(jsonText);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  const parsed = parseBundle(json);
  if (!parsed.ok) return parsed;
  return { ...parsed, encodedBytes, decodedBytes: decoded.byteLength };
}
