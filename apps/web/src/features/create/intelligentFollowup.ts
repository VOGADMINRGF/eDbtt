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
  const fallbackKind = inferStatementKind(normalized);
  const fallbackLabel =
    fallbackKind === "question"
      ? "Frage"
      : fallbackKind === "demand"
        ? "Forderung"
        : fallbackKind === "source"
          ? "Quelle"
          : fallbackKind === "option"
            ? "Option"
            : fallbackKind === "objection"
              ? "Widerspruch"
              : fallbackKind === "hint"
                ? "Hinweis"
                : fallbackKind === "argument"
                  ? "Argument"
                  : "Aussage";

  return {
    summary: summarizeText(normalized),
    categories: [{ id: fallbackKind, label: fallbackLabel, confidence: "low" }],
    topics: [{ id: "topic-fallback", label: "Thema wird nach Bestätigung präzisiert", confidence: "low" }],
    statements: [
      {
        id: "fallback-1",
        text: summarizeText(normalized),
        kind: fallbackKind,
        stance: "unclear",
        confidence: "low",
      },
    ],
    scopes: ["unclear"],
    openQuestion: "Welche Zuordnung passt aus deiner Sicht am besten?",
    confidence: "low",
  };
}

export async function buildCreateIntelligentFollowup(
  input: BuildCreateIntelligentFollowupInput,
): Promise<CreateIntelligentFollowupResult> {
  const text = input.text.trim();
  const generatedAt = new Date().toISOString();
  try {
    const result = await analyzeContribution({
      text,
      locale: input.locale,
      analysisMode: "analyze",
      journeyHint: input.intent === "check" ? "media" : input.intent === "draft" ? "guided" : "analyze",
      maxClaims: 6,
    });
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
