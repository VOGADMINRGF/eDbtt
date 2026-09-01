import { z } from "zod";
import { callMistral } from "@features/ai/providers/mistral";
import { callAnthropic } from "@features/ai/providers/anthropic";
import { LANE_ROUTING_POLICY } from "@/features/ai/providerRoleRouting";
import type { MaterialGraphFirstContext } from "@/features/material/materialGraphFirstContext";

export const MATERIAL_ANALYSIS_UNIT_CHARS = 60_000;
export const MATERIAL_ANALYSIS_MAX_CHUNKS = 12;

export type MaterialAnalysisUsage = {
  characterCount: number;
  chunkCount: number;
  unitSizeChars: number;
  estimatedAnalysisUnits: number;
  requiresVolumeApproval: boolean;
  approved: boolean;
};

export type MaterialStructuredQuestionDraft = {
  id: string;
  theme: string;
  text: string;
  rationale: string;
  sourceAnchors: string[];
  reviewState: "draft";
};

export type MaterialStructuredOptionDraft = {
  questionRef: string;
  text: string;
  source: "document" | "ai_suggestion";
  needsReview: true;
};

export type MaterialStructuredDraftResult = {
  provider: "mistral" | "anthropic" | "mixed" | "none";
  status: "generated" | "blocked" | "failed";
  themes: string[];
  decisionPoints: string[];
  questions: MaterialStructuredQuestionDraft[];
  options: MaterialStructuredOptionDraft[];
  claimsOrSourceHints: Array<{ text: string; sourceAnchors: string[] }>;
  uncertainties: string[];
  provenance: string[];
  analysisUsage: MaterialAnalysisUsage;
  reviewRequired: true;
  draftOnly: true;
  publicOutputAllowed: false;
  noAutoPublish: true;
  noAutoCreateRound: true;
  noAutoGraphWrite: true;
  noAutoMerge: true;
  error: string | null;
};

const shortText = z.string().trim().min(1).max(800);
const ProviderPayloadSchema = z
  .object({
    themes: z.array(shortText.max(160)).max(16),
    decisionPoints: z.array(shortText).max(20),
    questions: z
      .array(
        z
          .object({
            id: z.string().trim().regex(/^q-[a-z0-9-]{1,48}$/),
            theme: shortText.max(160),
            text: shortText.max(500).refine((value) => value.endsWith("?"), "question_mark_required"),
            rationale: shortText,
            sourceAnchors: z.array(shortText).min(1).max(8),
          })
          .strict(),
      )
      .max(20),
    options: z
      .array(
        z
          .object({
            questionRef: z.string().trim().regex(/^q-[a-z0-9-]{1,48}$/),
            text: shortText.max(300),
            source: z.enum(["document", "ai_suggestion"]),
            needsReview: z.literal(true),
          })
          .strict(),
      )
      .max(120),
    claimsOrSourceHints: z
      .array(
        z
          .object({
            text: shortText,
            sourceAnchors: z.array(shortText).min(1).max(8),
          })
          .strict(),
      )
      .max(24),
    uncertainties: z.array(shortText).max(20),
  })
  .strict();

type ParsedDrafts = Omit<
  MaterialStructuredDraftResult,
  | "provider"
  | "status"
  | "analysisUsage"
  | "reviewRequired"
  | "draftOnly"
  | "publicOutputAllowed"
  | "noAutoPublish"
  | "noAutoCreateRound"
  | "noAutoGraphWrite"
  | "noAutoMerge"
  | "error"
>;

function normalizeForGrounding(value: string) {
  return value.toLocaleLowerCase("de-DE").replace(/\s+/g, " ").trim();
}

function groundedInDocument(anchor: string, documentText: string) {
  const normalizedAnchor = normalizeForGrounding(anchor);
  return normalizedAnchor.length >= 4 && normalizeForGrounding(documentText).includes(normalizedAnchor);
}

function uniqueStrings(values: string[], max = Number.POSITIVE_INFINITY) {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    const key = normalizeForGrounding(normalized);
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    output.push(normalized);
    if (output.length >= max) break;
  }
  return output;
}

export function splitMaterialTextForAnalysis(text: string, maxChars = MATERIAL_ANALYSIS_UNIT_CHARS) {
  const normalized = String(text ?? "").trim();
  if (!normalized) return [];
  if (normalized.length <= maxChars) return [normalized];

  const paragraphs = normalized.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      flush();
      for (let start = 0; start < paragraph.length; start += maxChars) {
        chunks.push(paragraph.slice(start, start + maxChars).trim());
      }
      continue;
    }
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length > maxChars) {
      flush();
      current = paragraph;
    } else {
      current = candidate;
    }
  }
  flush();
  return chunks;
}

function analysisUsageFor(text: string, approveCost: boolean): MaterialAnalysisUsage {
  const chunks = splitMaterialTextForAnalysis(text);
  return {
    characterCount: text.length,
    chunkCount: chunks.length,
    unitSizeChars: MATERIAL_ANALYSIS_UNIT_CHARS,
    estimatedAnalysisUnits: chunks.length,
    requiresVolumeApproval: chunks.length > 1,
    approved: chunks.length <= 1 || approveCost,
  };
}

export function parseMaterialStructuredDraftPayload(input: {
  providerText: string;
  documentText: string;
  graphProvenance?: string[];
}): ParsedDrafts {
  const raw = ProviderPayloadSchema.parse(JSON.parse(input.providerText));
  const questions = raw.questions
    .filter((question) => question.sourceAnchors.every((anchor) => groundedInDocument(anchor, input.documentText)))
    .map((question) => ({ ...question, reviewState: "draft" as const }));
  const questionIds = new Set(questions.map((question) => question.id));
  const options = raw.options.filter(
    (option) =>
      questionIds.has(option.questionRef) &&
      (option.source === "ai_suggestion" || groundedInDocument(option.text, input.documentText)),
  );
  const claimsOrSourceHints = raw.claimsOrSourceHints.filter((hint) =>
    hint.sourceAnchors.every((anchor) => groundedInDocument(anchor, input.documentText)),
  );

  if (questions.length === 0 && raw.themes.length === 0) {
    throw new Error("empty_structured_output");
  }

  return {
    themes: raw.themes,
    decisionPoints: raw.decisionPoints,
    questions,
    options,
    claimsOrSourceHints,
    uncertainties: raw.uncertainties,
    provenance: Array.from(new Set(["material_full_text", ...(input.graphProvenance ?? [])])),
  };
}

function promptFor(input: {
  text: string;
  graph: MaterialGraphFirstContext;
  chunkIndex: number;
  chunkCount: number;
}) {
  const graphSummary = {
    matchedTopicIds: input.graph.matchedTopicIds,
    matchedDossierIds: input.graph.matchedDossierIds,
    matchedRoundIds: input.graph.matchedRoundIds,
    recommendedAction: input.graph.recommendedAction,
    coverageSummary: input.graph.coverageSummary,
    gapSummary: input.graph.gapSummary,
  };
  return `Du strukturierst Teil ${input.chunkIndex + 1} von ${input.chunkCount} eines privaten Dokuments für einen menschlichen eDebatte-Review. Du veröffentlichst nichts, entscheidest nicht über Wahrheit und erzeugst keine Runde. Faktenbehauptungen sind Quellenhinweise, niemals Abstimmungsfragen. Fragen betreffen nur Entscheidungen, Prioritäten, Bewertungen oder Erfahrungen. Bestehendes eDebatte-Wissen wird zuerst wiederverwendet, weitergeführt oder ergänzt; neue Fragen nur für echte Lücken. Dokumentoptionen müssen wörtlich im vorliegenden Dokumentteil vorkommen. Ergänzende Optionen erhalten source="ai_suggestion" und dürfen nicht als Dokumentinhalt erscheinen. Jeder sourceAnchor muss ein kurzes wörtliches Zitat aus dem vorliegenden Dokumentteil sein. Keine Quellen, Gegenpositionen oder Mehrheiten erfinden.\n\nGraph-Kontext:\n${JSON.stringify(graphSummary)}\n\nDokumentteil ${input.chunkIndex + 1}/${input.chunkCount}:\n${input.text}\n\nAntworte ausschließlich als valides JSON ohne Markdown und exakt mit diesen Feldern:\n{"themes":["..."],"decisionPoints":["..."],"questions":[{"id":"q-kurze-id","theme":"...","text":"...?","rationale":"...","sourceAnchors":["wörtlicher Textanker"]}],"options":[{"questionRef":"q-kurze-id","text":"...","source":"document","needsReview":true}],"claimsOrSourceHints":[{"text":"...","sourceAnchors":["wörtlicher Textanker"]}],"uncertainties":["..."]}\nFür source ist ausschließlich "document" oder "ai_suggestion" zulässig.\nMaximal 20 Fragen pro Dokumentteil. Jede Frage und Option bleibt ein KI-Entwurf für menschliche Auswahl und Bearbeitung.`;
}

function emptyResult(
  status: "blocked" | "failed",
  error: string | null,
  analysisUsage: MaterialAnalysisUsage,
): MaterialStructuredDraftResult {
  return {
    provider: "none",
    status,
    themes: [],
    decisionPoints: [],
    questions: [],
    options: [],
    claimsOrSourceHints: [],
    uncertainties: [],
    provenance: [],
    analysisUsage,
    reviewRequired: true,
    draftOnly: true,
    publicOutputAllowed: false,
    noAutoPublish: true,
    noAutoCreateRound: true,
    noAutoGraphWrite: true,
    noAutoMerge: true,
    error,
  };
}

function scopeChunkDrafts(parsed: ParsedDrafts, chunkIndex: number): ParsedDrafts {
  const idMap = new Map(parsed.questions.map((question) => [question.id, `q-c${chunkIndex + 1}-${question.id.slice(2)}`]));
  return {
    ...parsed,
    questions: parsed.questions.map((question) => ({ ...question, id: idMap.get(question.id) ?? question.id })),
    options: parsed.options
      .map((option) => ({ ...option, questionRef: idMap.get(option.questionRef) ?? "" }))
      .filter((option) => Boolean(option.questionRef)),
  };
}

function mergeChunkDrafts(chunks: ParsedDrafts[]): ParsedDrafts {
  return {
    themes: uniqueStrings(chunks.flatMap((chunk) => chunk.themes), 48),
    decisionPoints: uniqueStrings(chunks.flatMap((chunk) => chunk.decisionPoints), 80),
    questions: chunks.flatMap((chunk) => chunk.questions).slice(0, 200),
    options: chunks.flatMap((chunk) => chunk.options).slice(0, 600),
    claimsOrSourceHints: chunks.flatMap((chunk) => chunk.claimsOrSourceHints).slice(0, 160),
    uncertainties: uniqueStrings(chunks.flatMap((chunk) => chunk.uncertainties), 80),
    provenance: uniqueStrings(chunks.flatMap((chunk) => chunk.provenance)),
  };
}

export async function generateMaterialStructuredDrafts(input: {
  text: string | null;
  graph: MaterialGraphFirstContext;
  approveCost?: boolean;
}): Promise<MaterialStructuredDraftResult> {
  const text = String(input.text ?? "").trim();
  const approveCost = input.approveCost === true;
  const usage = analysisUsageFor(text, approveCost);
  if (!text) return emptyResult("blocked", "material_full_text_missing", usage);

  const chunks = splitMaterialTextForAnalysis(text);
  if (chunks.length > MATERIAL_ANALYSIS_MAX_CHUNKS) {
    return emptyResult("blocked", "material_analysis_volume_too_large", usage);
  }
  if (usage.requiresVolumeApproval && !approveCost) {
    return emptyResult("blocked", "material_analysis_volume_approval_required", usage);
  }

  const materialRouting = LANE_ROUTING_POLICY.find((entry) => entry.lane === "material_grounding");
  const providerOrder = materialRouting?.primaryAnalyzeCandidates ?? [];
  const providers = {
    mistral: (prompt: string) => callMistral({ prompt, maxOutputTokens: 4_000 }),
    anthropic: (prompt: string) => callAnthropic({ prompt, maxOutputTokens: 4_000 }),
  } as const;

  const parsedChunks: ParsedDrafts[] = [];
  const providersUsed = new Set<"mistral" | "anthropic">();
  let lastError: string | null = null;

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    const chunk = chunks[chunkIndex];
    const prompt = promptFor({ text: chunk, graph: input.graph, chunkIndex, chunkCount: chunks.length });
    let parsedForChunk: ParsedDrafts | null = null;

    for (const provider of providerOrder) {
      if (provider !== "mistral" && provider !== "anthropic") continue;
      try {
        const result = await providers[provider](prompt);
        const parsed = parseMaterialStructuredDraftPayload({
          providerText: result.text,
          documentText: chunk,
          graphProvenance: input.graph.provenance,
        });
        parsedForChunk = scopeChunkDrafts(parsed, chunkIndex);
        providersUsed.add(provider);
        break;
      } catch (error) {
        lastError = `${provider}:chunk_${chunkIndex + 1}:${error instanceof Error ? error.message : "provider_failed"}`;
      }
    }

    if (!parsedForChunk) {
      return emptyResult("failed", lastError ?? `material_grounding_chunk_${chunkIndex + 1}_failed`, usage);
    }
    parsedChunks.push(parsedForChunk);
  }

  const merged = mergeChunkDrafts(parsedChunks);
  const provider = providersUsed.size > 1 ? "mixed" : providersUsed.has("mistral") ? "mistral" : providersUsed.has("anthropic") ? "anthropic" : "none";

  return {
    provider,
    status: "generated",
    ...merged,
    analysisUsage: usage,
    reviewRequired: true,
    draftOnly: true,
    publicOutputAllowed: false,
    noAutoPublish: true,
    noAutoCreateRound: true,
    noAutoGraphWrite: true,
    noAutoMerge: true,
    error: null,
  };
}
