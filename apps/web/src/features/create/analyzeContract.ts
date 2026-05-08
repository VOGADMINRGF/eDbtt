import type { AnalyzeResult } from "@features/analyze/schemas";
import { resolveCreateCtaSuggestions } from "@/features/create/ctaResolver";
import { resolveCreateLanguageContext } from "@/features/create/languageContextContract";
import type { CreateIntent } from "@/features/create/intentFlows";
import type { CreateClaimSafetyResult } from "@/features/create/safety/createClaimSafety";
import type { CreateInputSafetyResult } from "@/features/create/safety/createInputSafety";

export type CreateAnalyzeInputType =
  | "free_text"
  | "quote"
  | "source_url"
  | "upload"
  | "mixed";

export type CreateAnalyzeMatchStrength = "high" | "medium" | "low" | "none";

export type CreateAnalyzeMatchType =
  | "exact_claim"
  | "related_claim"
  | "same_anlassraum"
  | "related_dossier"
  | "duplicate_risk"
  | "no_match";

export type CreateAnalyzeMatchEntityType =
  | "claim"
  | "anlassraum"
  | "dossier"
  | "perspective"
  | "question";

export type CreateAnalyzeCtaId =
  | "zustimmen"
  | "anders_sehen"
  | "dossier_oeffnen"
  | "anlassraum_oeffnen"
  | "perspektive_anhaengen"
  | "neu_anlegen";

export type CreateAnalyzeCtaSuggestion = {
  id: CreateAnalyzeCtaId;
  label: string;
  reason: string;
};

export type CreateAnalyzeMatchItem = {
  id: string;
  matchType: CreateAnalyzeMatchType;
  matchEntityType: CreateAnalyzeMatchEntityType;
  strength: CreateAnalyzeMatchStrength;
  label: string;
  reason: string;
  reasons: string[];
  entityId?: string | null;
  targetRef?: string | null;
};

export type CreateAnalyzeMatchResultInput = {
  matches: CreateAnalyzeMatchItem[];
  matchStrength: CreateAnalyzeMatchStrength;
  matchType?: CreateAnalyzeMatchType;
  matchEntityType?: CreateAnalyzeMatchEntityType;
  reasons: string[];
  suggestedCtas: CreateAnalyzeCtaSuggestion[];
  sourceState: "ok" | "degraded";
  sourceErrors: string[];
  languageMode?: CreateAnalyzeMatchingLanguageMode;
};

export type CreateAnalyzeMatchingLanguageMode = "same_language_only";

export type CreateAnalyzeResponse = {
  schemaVersion: string;
  orchestrator: "create_orchestration";
  runId: string;
  inputRef: string;
  intent: CreateIntent;
  sourceLanguage: string;
  contentLanguage: string;
  uiLocale: string;
  inputType: CreateAnalyzeInputType;
  languages: string[];
  normalizedInputSummary: string;
  claims: unknown[];
  nonCheckableOpinions: unknown[];
  evidenceNeeds: unknown[];
  uncertainties: unknown[];
  matches: CreateAnalyzeMatchItem[];
  matchStrength: CreateAnalyzeMatchStrength;
  matchType?: CreateAnalyzeMatchType;
  matchEntityType?: CreateAnalyzeMatchEntityType;
  reasons: string[];
  suggestedCtas: CreateAnalyzeCtaSuggestion[];
  matchSourceState: "ok" | "degraded";
  matchSourceErrors: string[];
  matchingLanguageMode: CreateAnalyzeMatchingLanguageMode;
  phases: {
    intake: { status: "done"; summary: string };
    quality: { status: "done" | "review_required"; summary: string };
    graph_matching: { status: "done" | "review_required"; summary: string };
    cta_suggestions: { status: "done"; summary: string };
  };
  confidence: number;
  uncertaintyFlags: string[];
  requiresHumanReview: boolean;
  noAutoPublish: true;
  noSilentMerge: true;
  safety?: CreateInputSafetyResult;
  claimSafety?: CreateClaimSafetyResult[];
  provenanceRefs: string[];
  createdAt: string;
};

export function inferCreateAnalyzeInputType(text: string): CreateAnalyzeInputType {
  const value = text.trim();
  if (!value) return "free_text";

  const hasUrl = /(https?:\/\/|www\.)\S+/i.test(value);
  const hasQuote = /["'“”„«»]/.test(value) || /\bZitat\b|\bquote\b/i.test(value);
  const hasUploadHint = /\b(upload|anhang|anlage|pdf|docx|screenshot|bild)\b/i.test(value);

  const featureCount = [hasUrl, hasQuote, hasUploadHint].filter(Boolean).length;
  if (featureCount >= 2) return "mixed";
  if (hasUrl) return "source_url";
  if (hasQuote) return "quote";
  if (hasUploadHint) return "upload";
  return "free_text";
}

export function inferCreateAnalyzeLanguages(text: string, locale?: string | null): string[] {
  const languages = new Set<string>();
  const normalized = text.toLowerCase();

  const localeShort = (locale || "de").slice(0, 2).toLowerCase();
  if (localeShort) languages.add(localeShort);

  if (/[äöüß]/i.test(text) || /\b(und|der|die|das|nicht|mit|fuer|gegen|frage)\b/i.test(normalized)) {
    languages.add("de");
  }
  if (/\b(the|and|with|because|question|claim|evidence|should)\b/i.test(normalized)) {
    languages.add("en");
  }
  if (/[ñáéíóú]/i.test(text) || /\b(que|con|para|pregunta|evidencia|deberia)\b/i.test(normalized)) {
    languages.add("es");
  }
  if (/[àèéìòù]/i.test(text) || /\b(che|con|perche|domanda|prova|dovrebbe)\b/i.test(normalized)) {
    languages.add("it");
  }

  return Array.from(languages);
}

export function summarizeCreateAnalyzeInput(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= 320) return normalized;
  return `${normalized.slice(0, 317).trim()}...`;
}

function buildUncertainties(text: string, claims: unknown[]): string[] {
  const flags: string[] = [];
  if (text.trim().length < 40) flags.push("input_too_thin");
  if (claims.length === 0) flags.push("no_structured_claims");
  if (!/[.!?]/.test(text)) flags.push("low_sentence_boundary_confidence");
  return flags;
}

function buildEvidenceNeeds(result: AnalyzeResult): unknown[] {
  const sourceHints = Array.isArray(result.notes)
    ? result.notes
        .map((note) => (typeof note?.text === "string" ? note.text : ""))
        .filter((value) => /quelle|evidenz|nachweis|source|evidence/i.test(value))
    : [];

  const questionHints = Array.isArray(result.questions)
    ? result.questions
        .map((q) => (typeof q?.text === "string" ? q.text : ""))
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return [...sourceHints, ...questionHints].slice(0, 6);
}

function fallbackNoMatchResult(): CreateAnalyzeMatchResultInput {
  const reasons = ["Kein belastbarer Match aus produktiven Read-Quellen."];
  return {
    matches: [
      {
        id: "no-match",
        matchType: "no_match",
        matchEntityType: "question",
        strength: "none",
        label: "Kein belastbarer Match",
        reason: reasons[0],
        reasons,
        entityId: null,
        targetRef: null,
      },
    ],
    matchStrength: "none",
    matchType: "no_match",
    matchEntityType: "question",
    reasons,
    suggestedCtas: resolveCreateCtaSuggestions({
      matchType: "no_match",
      matchEntityType: "question",
      matchStrength: "none",
    }),
    sourceState: "degraded",
    sourceErrors: ["match_result_missing"],
    languageMode: "same_language_only",
  };
}

export function buildCreateAnalyzeResponse(params: {
  runId: string;
  text: string;
  intent: CreateIntent;
  locale?: string | null;
  languageContext?: {
    uiLocale?: string | null;
    contentLanguage?: string | null;
    sourceLanguage?: string | null;
  } | null;
  result: AnalyzeResult;
  matchResult?: CreateAnalyzeMatchResultInput | null;
}): CreateAnalyzeResponse {
  const { runId, text, intent, locale, result } = params;

  const inputType = inferCreateAnalyzeInputType(text);
  const languages = inferCreateAnalyzeLanguages(text, locale);
  const normalizedInputSummary = summarizeCreateAnalyzeInput(text);
  const claims = Array.isArray(result.claims) ? result.claims : [];
  const nonCheckableOpinions = claims
    .filter((entry) => {
      const raw = typeof (entry as any)?.text === "string" ? (entry as any).text : "";
      return /\b(ich finde|meiner meinung|gefuehl|sollte man|i think|in my opinion)\b/i.test(raw);
    })
    .slice(0, 6);

  const evidenceNeeds = buildEvidenceNeeds(result);
  const uncertainties = buildUncertainties(text, claims);
  const uncertaintyFlags = [...uncertainties];
  const matchResult = params.matchResult ?? fallbackNoMatchResult();

  const confidence = Math.max(
    0.2,
    Math.min(
      0.95,
      0.45 +
        (claims.length > 0 ? 0.2 : 0) +
        (normalizedInputSummary.length > 80 ? 0.1 : 0) -
        uncertainties.length * 0.08,
    ),
  );

  const requiresHumanReview =
    uncertainties.length > 0 ||
    matchResult.matchStrength !== "high" ||
    claims.length === 0 ||
    matchResult.matchType === "duplicate_risk" ||
    matchResult.sourceState === "degraded";

  const createdAt = new Date().toISOString();
  const inferredSourceLanguage = languages[0] ?? "de";
  const languageContext = resolveCreateLanguageContext({
    locale,
    uiLocale: params.languageContext?.uiLocale,
    contentLanguage: params.languageContext?.contentLanguage,
    sourceLanguage: params.languageContext?.sourceLanguage,
    inferredSourceLanguage,
  });

  return {
    schemaVersion: "create_analyze.v1",
    orchestrator: "create_orchestration",
    runId,
    inputRef: runId,
    intent,
    sourceLanguage: languageContext.sourceLanguage,
    contentLanguage: languageContext.contentLanguage,
    uiLocale: languageContext.uiLocale,
    inputType,
    languages,
    normalizedInputSummary,
    claims,
    nonCheckableOpinions,
    evidenceNeeds,
    uncertainties,
    matches: matchResult.matches,
    matchStrength: matchResult.matchStrength,
    matchType: matchResult.matchType,
    matchEntityType: matchResult.matchEntityType,
    reasons: matchResult.reasons,
    suggestedCtas: matchResult.suggestedCtas,
    matchSourceState: matchResult.sourceState,
    matchSourceErrors: matchResult.sourceErrors,
    matchingLanguageMode: matchResult.languageMode ?? "same_language_only",
    phases: {
      intake: {
        status: "done",
        summary: `Input als ${inputType} erkannt; languages=${languages.join(", ") || "-"}.`,
      },
      quality: {
        status: uncertainties.length > 0 ? "review_required" : "done",
        summary: `Claims=${claims.length}, EvidenceNeeds=${evidenceNeeds.length}, Uncertainties=${uncertainties.length}.`,
      },
      graph_matching: {
        status: matchResult.sourceState === "degraded" ? "review_required" : "done",
        summary: `matchStrength=${matchResult.matchStrength}${
          matchResult.matchType ? `, matchType=${matchResult.matchType}` : ""
        }, sourceState=${matchResult.sourceState}.`,
      },
      cta_suggestions: {
        status: "done",
        summary: `suggestedCtas=${matchResult.suggestedCtas.length}.`,
      },
    },
    confidence,
    uncertaintyFlags,
    requiresHumanReview,
    noAutoPublish: true,
    noSilentMerge: true,
    provenanceRefs: [runId],
    createdAt,
  };
}
