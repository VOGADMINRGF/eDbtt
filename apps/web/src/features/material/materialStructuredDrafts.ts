import { callMistral } from "@features/ai/providers/mistral";
import { callAnthropic } from "@features/ai/providers/anthropic";
import type { MaterialGraphFirstContext } from "@/features/material/materialGraphFirstContext";

export type MaterialStructuredQuestionDraft = {
  theme: string;
  question: string;
  options: string[];
  rationale: string;
  sourceGrounding: string[];
  aiSuggestedOptions: string[];
  reviewState: "draft";
};

export type MaterialStructuredDraftResult = {
  provider: "mistral" | "anthropic" | "none";
  status: "generated" | "blocked" | "failed";
  themes: string[];
  questions: MaterialStructuredQuestionDraft[];
  openPoints: string[];
  reviewRequired: true;
  noAutoPublish: true;
  noAutoCreateRound: true;
  error: string | null;
};

type ProviderPayload = {
  themes?: unknown;
  questions?: unknown;
  openPoints?: unknown;
};

function strings(value: unknown, max = 12) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean)
    .slice(0, max);
}

function parsePayload(text: string): Omit<MaterialStructuredDraftResult, "provider" | "status" | "reviewRequired" | "noAutoPublish" | "noAutoCreateRound" | "error"> {
  const raw = JSON.parse(text) as ProviderPayload;
  const questions = Array.isArray(raw.questions)
    ? raw.questions
        .map((entry): MaterialStructuredQuestionDraft | null => {
          if (!entry || typeof entry !== "object") return null;
          const item = entry as Record<string, unknown>;
          const question = String(item.question ?? "").trim();
          if (!question) return null;
          return {
            theme: String(item.theme ?? "").trim() || "Allgemein",
            question,
            options: strings(item.options, 8),
            rationale: String(item.rationale ?? "").trim(),
            sourceGrounding: strings(item.sourceGrounding, 8),
            aiSuggestedOptions: strings(item.aiSuggestedOptions, 8),
            reviewState: "draft",
          };
        })
        .filter((entry): entry is MaterialStructuredQuestionDraft => Boolean(entry))
        .slice(0, 20)
    : [];
  return {
    themes: strings(raw.themes, 16),
    questions,
    openPoints: strings(raw.openPoints, 16),
  };
}

function promptFor(input: { text: string; graph: MaterialGraphFirstContext }) {
  const graphSummary = {
    matchedTopicIds: input.graph.matchedTopicIds,
    matchedDossierIds: input.graph.matchedDossierIds,
    matchedRoundIds: input.graph.matchedRoundIds,
    recommendedAction: input.graph.recommendedAction,
    coverageSummary: input.graph.coverageSummary,
    gapSummary: input.graph.gapSummary,
  };
  return `Du strukturierst ein privates, reviewpflichtiges Dokument für eDebatte. Erzeuge KEINE Veröffentlichung und entscheide NICHT über Wahrheit. Faktenbehauptungen dürfen nicht als Abstimmungsfrage formuliert werden. Ziel sind echte Entscheidungs-, Priorisierungs-, Bewertungs- oder Erfahrungsfragen. Bestehendes eDebatte-Wissen soll bevorzugt wiederverwendet, weitergeführt oder ergänzt werden; neue Fragen nur für echte Lücken. Zusätzliche Antwortoptionen, die nicht wörtlich aus dem Dokument stammen, müssen ausschließlich im Feld aiSuggestedOptions stehen. sourceGrounding enthält kurze, konkrete Textanker aus dem Dokument, keine erfundenen Quellen.

Graph-Kontext:
${JSON.stringify(graphSummary)}

Dokument:
${input.text.slice(0, 120_000)}

Antworte ausschließlich als JSON mit exakt dieser Struktur:
{"themes":["..."],"questions":[{"theme":"...","question":"...?","options":["nur im Dokument gestützte Optionen"],"rationale":"warum diese Frage entscheidungsrelevant ist","sourceGrounding":["kurzer Textanker"],"aiSuggestedOptions":["klar als KI-Vorschlag getrennte zusätzliche Option"]}],"openPoints":["...:"]}
Maximal 20 Fragen. Vermeide Dubletten und banale Überschriften-zu-Frage-Konvertierung.`;
}

export async function generateMaterialStructuredDrafts(input: {
  text: string | null;
  graph: MaterialGraphFirstContext;
}): Promise<MaterialStructuredDraftResult> {
  const text = String(input.text ?? "").trim();
  if (!text) {
    return {
      provider: "none",
      status: "blocked",
      themes: [],
      questions: [],
      openPoints: [],
      reviewRequired: true,
      noAutoPublish: true,
      noAutoCreateRound: true,
      error: "material_full_text_missing",
    };
  }

  const prompt = promptFor({ text, graph: input.graph });
  const attempts: Array<["mistral" | "anthropic", () => Promise<{ text: string }>]> = [
    ["mistral", () => callMistral({ prompt, maxOutputTokens: 4_000 })],
    ["anthropic", () => callAnthropic({ prompt, maxOutputTokens: 4_000 })],
  ];

  let lastError: string | null = null;
  for (const [provider, run] of attempts) {
    try {
      const result = await run();
      const parsed = parsePayload(result.text);
      if (parsed.questions.length === 0 && parsed.themes.length === 0) {
        lastError = `${provider}:empty_structured_output`;
        continue;
      }
      return {
        provider,
        status: "generated",
        ...parsed,
        reviewRequired: true,
        noAutoPublish: true,
        noAutoCreateRound: true,
        error: null,
      };
    } catch (error) {
      lastError = `${provider}:${error instanceof Error ? error.message : "provider_failed"}`;
    }
  }

  return {
    provider: "none",
    status: "failed",
    themes: [],
    questions: [],
    openPoints: [],
    reviewRequired: true,
    noAutoPublish: true,
    noAutoCreateRound: true,
    error: lastError,
  };
}
