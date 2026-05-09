import {
  collectCreateSafetyLexicon,
  redactCreateSafetySensitiveText,
  sanitizeCreateSafetyExcerpt,
} from "@/features/create/safety/createSafetyLexicon";
import {
  evaluateCreateInputSafety,
  type CreateInputSafetyDecision,
  type CreateInputSafetyFindingKind,
} from "@/features/create/safety/createInputSafety";

export type CreateClaimKind =
  | "observation"
  | "opinion"
  | "question"
  | "policy_request"
  | "factual_claim"
  | "allegation"
  | "not_checkable"
  | "unsafe";

export type CreateClaimTruthStatus =
  | "not_checked"
  | "open"
  | "supported"
  | "contested"
  | "refuted"
  | "not_checkable";

export type CreateClaimPublicationStatus =
  | "publishable"
  | "publishable_as_question"
  | "publishable_as_opinion"
  | "needs_rewrite"
  | "factcheck_required"
  | "graph_review_required"
  | "moderation_required"
  | "blocked";

export type CreateClaimSafetyResult = {
  claimId: string | null;
  text: string;
  safeText: string;
  kind: CreateClaimKind;
  truthStatus: CreateClaimTruthStatus;
  publicationStatus: CreateClaimPublicationStatus;
  safetyDecision: CreateInputSafetyDecision;
  findingKinds: CreateInputSafetyFindingKind[];
  factCheckCandidateIds: string[];
  graphReviewRequired: boolean;
  noAutoPublish: true;
  noSilentMerge: true;
};

const CLAIM_OPINION_RE =
  /\b(ich\s+finde|ich\s+denke|ich\s+glaube|meiner\s+meinung|meines\s+erachtens|für\s+mich|fuer\s+mich|wirkt\s+wie|scheint\s+wie|i\s+think|i\s+believe|in\s+my\s+opinion|to\s+me|it\s+seems)\b/iu;
const CLAIM_POLICY_REQUEST_RE =
  /\b(wir\s+sollten|man\s+sollte|sollte\s+die|fordern|forderung|muss|müssen|muessen|brauchen|bitte|lasst\s+uns|let's|we\s+should|should|must|need\s+to)\b/iu;
const CLAIM_VALUE_JUDGEMENT_RE =
  /\b(unfair|ungerecht|chaotisch|inakzeptabel|peinlich|lächerlich|laecherlich|problematisch|gut|schlecht|falsch|richtig|outrageous|terrible|bad|good|unacceptable)\b/iu;
const CLAIM_OBSERVATION_RE =
  /\b(ich\s+sehe|ich\s+habe\s+gesehen|bei\s+uns|vor\s+ort|heute|gestern|im\s+viertel|an\s+der\s+haltestelle|es\s+gibt|there\s+is|there\s+are|i\s+saw)\b/iu;

function cleanLang(value?: string | null, fallback = "de"): string {
  const raw = String(value ?? "").trim().toLowerCase();
  const short = raw.split(/[-_]/)[0] ?? "";
  if (/^[a-z]{2,16}$/.test(short)) return short;
  return fallback;
}

function normalizeClaimText(text: string): string {
  return redactCreateSafetySensitiveText(text).replace(/\s+/g, " ").trim();
}

function resolveClaimKind(params: {
  text: string;
  findingKinds: CreateInputSafetyFindingKind[];
  safetyDecision: CreateInputSafetyDecision;
  factCheckCandidateIds: string[];
}): CreateClaimKind {
  const normalized = params.text.trim();
  const findingSet = new Set(params.findingKinds);

  if (params.safetyDecision === "blocked" || params.safetyDecision === "moderation_required") {
    return "unsafe";
  }
  if (normalized.includes("?")) return "question";
  if (findingSet.has("unsupported_allegation") || findingSet.has("corruption_or_capture_claim") || findingSet.has("source_bluffing")) {
    return "allegation";
  }
  if (CLAIM_OPINION_RE.test(normalized)) return "opinion";
  if (CLAIM_POLICY_REQUEST_RE.test(normalized)) return "policy_request";
  if (findingSet.has("political_framing")) return "opinion";
  if (findingSet.has("unverified_number") || params.factCheckCandidateIds.length > 0) {
    return "factual_claim";
  }
  if (CLAIM_VALUE_JUDGEMENT_RE.test(normalized) && !CLAIM_OBSERVATION_RE.test(normalized)) {
    return "not_checkable";
  }
  if (CLAIM_OBSERVATION_RE.test(normalized)) return "observation";
  return "observation";
}

function resolveTruthStatus(params: {
  kind: CreateClaimKind;
  publicationStatus: CreateClaimPublicationStatus;
}): CreateClaimTruthStatus {
  if (params.kind === "opinion" || params.kind === "not_checkable") {
    return "not_checkable";
  }
  if (
    params.kind === "question" ||
    params.publicationStatus === "factcheck_required" ||
    params.publicationStatus === "graph_review_required"
  ) {
    return "open";
  }
  return "not_checked";
}

function resolvePublicationStatus(params: {
  kind: CreateClaimKind;
  safetyDecision: CreateInputSafetyDecision;
  findingKinds: CreateInputSafetyFindingKind[];
}): CreateClaimPublicationStatus {
  const findingSet = new Set(params.findingKinds);

  if (params.safetyDecision === "blocked") return "blocked";
  if (params.safetyDecision === "moderation_required") return "moderation_required";
  if (params.safetyDecision === "graph_review_required") return "graph_review_required";
  if (params.safetyDecision === "factcheck_required") return "factcheck_required";
  if (params.kind === "question") return "publishable_as_question";
  if (params.kind === "opinion" || params.kind === "not_checkable") {
    return "publishable_as_opinion";
  }
  if (
    findingSet.size === 1 &&
    findingSet.has("low_readability")
  ) {
    return "needs_rewrite";
  }
  return "publishable";
}

export function evaluateCreateClaimSafety(input: {
  claimId?: string | null;
  text: string;
  locale?: string | null;
  sourceLanguage?: string | null;
  contentLanguage?: string | null;
}): CreateClaimSafetyResult {
  const text = String(input.text ?? "").trim();
  const locale = cleanLang(input.locale, "de");
  const sourceLanguage = cleanLang(input.sourceLanguage, locale);
  const contentLanguage = cleanLang(input.contentLanguage, locale);
  const safety = evaluateCreateInputSafety({
    text,
    locale,
    sourceLanguage,
    contentLanguage,
    routeStage: "analyze",
  });
  const lexicon = collectCreateSafetyLexicon(text);
  const findingKinds = safety.findings.map((finding) => finding.kind);
  const factCheckCandidateIds = safety.factCheckCandidates.map((candidate) => candidate.id);
  const kind = resolveClaimKind({
    text,
    findingKinds,
    safetyDecision: safety.decision,
    factCheckCandidateIds,
  });
  const publicationStatus = resolvePublicationStatus({
    kind,
    safetyDecision: safety.decision,
    findingKinds,
  });
  const normalizedText = normalizeClaimText(text);
  const safeText = sanitizeCreateSafetyExcerpt(
    normalizedText || safety.redactedText || safety.safeRewrite,
    280,
  );

  return {
    claimId: input.claimId ? String(input.claimId) : null,
    text: sanitizeCreateSafetyExcerpt(normalizedText, 280),
    safeText,
    kind,
    truthStatus: resolveTruthStatus({ kind, publicationStatus }),
    publicationStatus,
    safetyDecision: safety.decision,
    findingKinds,
    factCheckCandidateIds,
    graphReviewRequired:
      safety.crossLingualRisk ||
      publicationStatus === "graph_review_required" ||
      lexicon.languageRiskHints.some((language) => language !== contentLanguage),
    noAutoPublish: true,
    noSilentMerge: true,
  };
}
