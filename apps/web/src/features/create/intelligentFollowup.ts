import { analyzeContribution } from "@features/analyze/analyzeContribution";
import type { AnalyzeResult } from "@features/analyze/schemas";
import type { CreateIntent } from "@/features/create/intentFlows";
import { buildCreateConnectionSuggestions } from "@/features/create/createConnectionSuggestions";
import type {
  CreateIntelligentFollowupResult,
  CreateUnderstandingStatementKind,
  CreateUnderstandingResult,
  FollowupConfidence,
} from "@/features/create/intelligentFollowupContract";

type BuildCreateIntelligentFollowupInput = {
  text: string;
  locale: string;
  intent?: CreateIntent;
  userId?: string | null;
  anlassraumId?: string | null;
  dossierId?: string | null;
  maxSuggestions?: number;
};

const DEFAULT_FAST_FOLLOWUP_TIMEOUT_MS = 2_800;

class CreateFollowupTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`create_followup_timeout_after_${timeoutMs}ms`);
    this.name = "CreateFollowupTimeoutError";
  }
}

function resolveFastFollowupTimeoutMs(): number {
  const raw = Number(process.env.CREATE_INTELLIGENT_FOLLOWUP_TIMEOUT_MS ?? DEFAULT_FAST_FOLLOWUP_TIMEOUT_MS);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_FAST_FOLLOWUP_TIMEOUT_MS;
  return Math.min(8_000, Math.max(800, Math.floor(raw)));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new CreateFollowupTimeoutError(timeoutMs)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function normalizeConfidence(score: number): FollowupConfidence {
  if (score >= 0.74) return "high";
  if (score >= 0.44) return "medium";
  return "low";
}

function mapStance(raw: AnalyzeResult["claims"][number]["stance"]): "pro" | "contra" | "mixed" | "open" | "unclear" {
  if (raw === "pro") return "pro";
  if (raw === "contra") return "contra";
  if (raw === "neutral") return "open";
  return "unclear";
}

function inferStatementKind(text: string, fallback?: string | null): CreateUnderstandingStatementKind {
  const normalized = text.toLowerCase();
  if (fallback === "question" || /\?/.test(text)) return "question";
  if (/https?:\/\/|www\./.test(normalized) || /quelle|bericht|dokument|studie/.test(normalized)) return "source";
  if (/soll|muss|fordern|fordere|verlangen/.test(normalized)) return "demand";
  if (/option|variante|alternativ|lösung|loesung/.test(normalized)) return "option";
  if (/widerspruch|dagegen|kritik|zweifel/.test(normalized)) return "objection";
  if (/hinweis|beobachtung|erfahrung/.test(normalized)) return "hint";
  if (/weil|daher|deshalb|darum/.test(normalized)) return "argument";
  return "claim";
}

function inferScopes(result: AnalyzeResult, sourceText: string): CreateUnderstandingResult["scopes"] {
  const values = new Set<CreateUnderstandingResult["scopes"][number]>();
  const joined = `${sourceText} ${result.claims.map((claim) => claim.responsibility ?? "").join(" ")}`.toLowerCase();
  if (/bezirk/.test(joined)) values.add("district");
  if (/kommune|kommunal|stadt|gemeinde/.test(joined)) values.add("municipal");
  if (/landtag|landes/.test(joined)) values.add("state");
  if (/bund|bundes/.test(joined)) values.add("federal");
  if (/\beu\b|europa/.test(joined)) values.add("eu");
  if (/international|weltweit|global|un/.test(joined)) values.add("international");
  if (/lokal|nachbarschaft|kiez|viertel/.test(joined)) values.add("local");
  if (values.size === 0) values.add("unclear");
  return Array.from(values).slice(0, 3);
}

function summarizeText(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 280) return normalized;
  return `${normalized.slice(0, 277).trim()}...`;
}

type FallbackTopicRule = {
  label: string;
  pattern: RegExp;
};

const FALLBACK_TOPIC_RULES: readonly FallbackTopicRule[] = [
  { label: "Politische Verantwortung", pattern: /verantwort|pflicht/ },
  { label: "Amtsträger", pattern: /minister|repr[aä]sentant|amtstr[aä]ger|mandat/ },
  { label: "Qualifikation", pattern: /qualifikation|vorausbildung|mindestanforderung|kompetenz/ },
  { label: "Sanktionen", pattern: /sanktion|streichen|entzug|konsequenz/ },
  { label: "Gesetzgebung", pattern: /gesetzesentwurf|gesetzgebung|gesetz/ },
  { label: "Option", pattern: /option\s*[a-z]|option b|option c|vorschlag/ },
  { label: "Abstimmung", pattern: /abstimm|wertung|entscheidung/ },
  { label: "Themenagenda", pattern: /agenda|themenagenda/ },
];

function buildFallbackTopics(normalizedText: string): Array<{ id: string; label: string; confidence: FollowupConfidence }> {
  const topics: Array<{ id: string; label: string; confidence: FollowupConfidence }> = [];
  const pushTopic = (label: string, confidence: FollowupConfidence = "medium") => {
    if (topics.some((topic) => topic.label === label)) return;
    topics.push({
      id: `topic-${topics.length + 1}`,
      label,
      confidence,
    });
  };
  for (const rule of FALLBACK_TOPIC_RULES) {
    if (!rule.pattern.test(normalizedText)) continue;
    pushTopic(rule.label);
  }
  if (
    /minister|repr[aä]sentant|amtstr[aä]ger|mandat|gesetzesentwurf|gesetzgebung/.test(normalizedText)
  ) {
    pushTopic("Politische Verantwortung");
  }
  if (topics.length === 0) {
    pushTopic("Öffentliches Anliegen", "low");
  }
  return topics;
}

function buildFallbackCategories(
  normalizedText: string,
  fallbackKind: CreateUnderstandingStatementKind,
): Array<{ id: string; label: string; confidence: FollowupConfidence }> {
  const categories: Array<{ id: string; label: string; confidence: FollowupConfidence }> = [];
  const pushIfMissing = (id: string, label: string, confidence: FollowupConfidence) => {
    if (categories.some((item) => item.id === id)) return;
    categories.push({ id, label, confidence });
  };

  if (/soll|muss|fordern|fordere|verlangen|mindestanforderung/.test(normalizedText)) {
    pushIfMissing("demand", "Forderung", "medium");
  }
  if (/kritik|zweifel|problem|fehlt|zu wenig|ungeeignet|widerspruch|wertung|verstö|verstoß|verstoe|verstoss/.test(normalizedText)) {
    pushIfMissing("objection", "Kritik", "medium");
  }
  if (/vorschlag|option|agenda|alternativ/.test(normalizedText)) {
    pushIfMissing("option", "Vorschlag", "medium");
  }

  if (categories.length > 0) return categories;
  if (fallbackKind === "demand") return [{ id: "demand", label: "Forderung", confidence: "low" }];
  if (fallbackKind === "objection") return [{ id: "objection", label: "Kritik", confidence: "low" }];
  if (fallbackKind === "option") return [{ id: "option", label: "Vorschlag", confidence: "low" }];
  if (fallbackKind === "question") return [{ id: "question", label: "Frage", confidence: "low" }];
  if (fallbackKind === "source") return [{ id: "source", label: "Quelle", confidence: "low" }];
  if (fallbackKind === "argument") return [{ id: "argument", label: "Argument", confidence: "low" }];
  return [{ id: "hint", label: "Hinweis", confidence: "low" }];
}

function buildFallbackSummary(
  normalizedText: string,
  normalizedLower: string,
  topics: Array<{ label: string }>,
): string {
  if (
    /minister|amtstr[aä]ger|gesetzesentwurf|gesetzgebung/.test(normalizedLower) &&
    /mindestanforderung|qualifikation|konsequenz|sanktion/.test(normalizedLower)
  ) {
    return "Du forderst klarere Mindestanforderungen und Konsequenzen für gewählte oder ernannte Amtsträger, insbesondere bei Ministerämtern und Gesetzgebung.";
  }
  if (topics.length > 0) {
    return `Du benennst Handlungsbedarf zu ${topics
      .slice(0, 3)
      .map((topic) => topic.label.toLowerCase())
      .join(", ")}.`;
  }
  return summarizeText(normalizedText);
}

function mapAnalyzeResultToUnderstanding(text: string, result: AnalyzeResult): CreateUnderstandingResult {
  const statements = result.claims.slice(0, 6).map((claim, index) => {
    const statementText = claim.text?.trim() || `Aussage ${index + 1}`;
    const kind = inferStatementKind(statementText, claim.statementType ?? null);
    const confidenceScore =
      typeof claim.importance === "number" ? Math.min(1, Math.max(0.2, claim.importance / 5)) : 0.55;
    return {
      id: claim.id || `statement-${index + 1}`,
      text: statementText,
      kind,
      stance: mapStance(claim.stance),
      confidence: normalizeConfidence(confidenceScore),
      sourceExcerpt: kind === "source" ? statementText.slice(0, 180) : undefined,
    };
  });

  const topicsSeen = new Set<string>();
  const topics = result.claims
    .flatMap((claim) => [claim.topic, claim.domain, ...(claim.domains ?? [])])
    .map((value) => String(value ?? "").trim())
    .filter((value) => value.length > 0)
    .filter((value) => {
      const key = value.toLowerCase();
      if (topicsSeen.has(key)) return false;
      topicsSeen.add(key);
      return true;
    })
    .slice(0, 6)
    .map((label, index) => ({
      id: `topic-${index + 1}`,
      label,
      confidence: normalizeConfidence(0.6 - index * 0.06),
    }));

  const categorySet = new Map<string, { label: string; weight: number }>();
  for (const statement of statements) {
    const weight = statement.confidence === "high" ? 0.9 : statement.confidence === "medium" ? 0.6 : 0.35;
    const categoryId = statement.kind;
    const label =
      categoryId === "question"
        ? "Frage"
        : categoryId === "demand"
          ? "Forderung"
          : categoryId === "source"
            ? "Quelle"
            : categoryId === "option"
              ? "Option"
              : categoryId === "objection"
                ? "Widerspruch"
                : categoryId === "hint"
                  ? "Hinweis"
                  : categoryId === "argument"
                    ? "Argument"
                    : "Aussage";
    const existing = categorySet.get(categoryId);
    if (!existing || weight > existing.weight) {
      categorySet.set(categoryId, { label, weight });
    }
  }
  if (categorySet.size === 0) {
    categorySet.set("hint", { label: "Hinweis", weight: 0.4 });
  }

  const categories = Array.from(categorySet.entries())
    .slice(0, 5)
    .map(([id, item]) => ({
      id,
      label: item.label,
      confidence: normalizeConfidence(item.weight),
    }));

  const openQuestion = result.questions[0]?.text?.trim() || null;
  const confidence = normalizeConfidence(
    Math.min(
      0.95,
      0.3 + statements.length * 0.08 + categories.length * 0.07 + (topics.length > 0 ? 0.1 : 0),
    ),
  );

  return {
    summary: result.report?.summary?.trim() || summarizeText(text),
    categories,
    topics: topics.length > 0 ? topics : [{ id: "topic-1", label: "Thema noch offen", confidence: "low" }],
    statements,
    scopes: inferScopes(result, text),
    openQuestion,
    confidence,
  };
}

function buildFallbackUnderstanding(text: string): CreateUnderstandingResult {
  const normalized = text.replace(/\s+/g, " ").trim();
  const normalizedLower = normalized.toLowerCase();
  const fallbackKind = inferStatementKind(normalized);
  const topics = buildFallbackTopics(normalizedLower);
  const categories = buildFallbackCategories(normalizedLower, fallbackKind);
  const inferredStance: "pro" | "contra" | "mixed" | "open" | "unclear" = /mindestanforderung|qualifikation|konsequenz|sanktion/.test(
    normalizedLower,
  )
    ? "pro"
    : /dagegen|ablehnen|nicht sinnvoll/.test(normalizedLower)
      ? "contra"
      : "open";
  const scopes: CreateUnderstandingResult["scopes"] = [];
  if (/minister|gesetzesentwurf|gesetzgebung|bund|bundes/.test(normalizedLower)) scopes.push("federal");
  if (/bezirk/.test(normalizedLower)) scopes.push("district");
  if (/kommune|stadt|gemeinde/.test(normalizedLower)) scopes.push("municipal");
  if (scopes.length === 0) scopes.push("unclear");

  return {
    summary: buildFallbackSummary(normalized, normalizedLower, topics),
    categories,
    topics,
    statements: [
      {
        id: "fallback-1",
        text: summarizeText(normalized),
        kind: fallbackKind,
        stance: inferredStance,
        confidence: "medium",
      },
    ],
    scopes,
    openQuestion: null,
    confidence: "medium",
  };
}

export async function buildCreateIntelligentFollowup(
  input: BuildCreateIntelligentFollowupInput,
): Promise<CreateIntelligentFollowupResult> {
  const text = input.text.trim();
  const generatedAt = new Date().toISOString();
  try {
    const result = await withTimeout(
      analyzeContribution({
        text,
        locale: input.locale,
        analysisMode: "analyze",
        journeyHint: input.intent === "check" ? "media" : input.intent === "draft" ? "guided" : "analyze",
        maxClaims: 6,
      }),
      resolveFastFollowupTimeoutMs(),
    );
    const understanding = mapAnalyzeResultToUnderstanding(text, result as AnalyzeResult);
    const suggestions = buildCreateConnectionSuggestions({
      text,
      intent: input.intent,
      understanding,
      anlassraumId: input.anlassraumId,
      dossierId: input.dossierId,
      maxSuggestions: input.maxSuggestions,
    });
    return {
      understanding,
      suggestions,
      sourceText: text,
      generatedAt,
      degraded: false,
      degradedReason: null,
    };
  } catch (error: unknown) {
    const understanding = buildFallbackUnderstanding(text);
    const suggestions = buildCreateConnectionSuggestions({
      text,
      intent: input.intent,
      understanding,
      anlassraumId: input.anlassraumId,
      dossierId: input.dossierId,
      maxSuggestions: input.maxSuggestions,
    });
    return {
      understanding,
      suggestions,
      sourceText: text,
      generatedAt,
      degraded: true,
      degradedReason: error instanceof Error ? error.message : "fallback_used",
    };
  }
}
