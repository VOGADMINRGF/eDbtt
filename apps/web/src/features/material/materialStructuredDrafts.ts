import { z } from "zod";
import { callMistral } from "@features/ai/providers/mistral";
import { callAnthropic } from "@features/ai/providers/anthropic";
import { LANE_ROUTING_POLICY } from "@/features/ai/providerRoleRouting";
import type { MaterialGraphFirstContext } from "@/features/material/materialGraphFirstContext";

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
  provider: "mistral" | "anthropic" | "none";
  status: "generated" | "blocked" | "failed";
  themes: string[];
  decisionPoints: string[];
  questions: MaterialStructuredQuestionDraft[];
  options: MaterialStructuredOptionDraft[];
  claimsOrSourceHints: Array<{ text: string; sourceAnchors: string[] }>;
  uncertainties: string[];
  provenance: string[];
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

function promptFor(input: { text: string; graph: MaterialGraphFirstContext }) {
  const graphSummary = {
    matchedTopicIds: input.graph.matchedTopicIds,
    matchedDossierIds: input.graph.matchedDossierIds,
    matchedRoundIds: input.graph.matchedRoundIds,
    recommendedAction: input.graph.recommendedAction,
    coverageSummary: input.graph.coverageSummary,
    gapSummary: input.graph.gapSummary,
  };
  return `Du strukturierst ein privates Dokument für einen menschlichen eDebatte-Review. Du veröffentlichst nichts, entscheidest nicht über Wahrheit und erzeugst keine Runde. Faktenbehauptungen sind Quellenhinweise, niemals Abstimmungsfragen. Fragen betreffen nur Entscheidungen, Prioritäten, Bewertungen oder Erfahrungen. Bestehendes eDebatte-Wissen wird zuerst wiederverwendet, weitergeführt oder ergänzt; neue Fragen nur für echte Lücken. Dokumentoptionen müssen wörtlich im Dokument vorkommen. Ergänzende Optionen erhalten source="ai_suggestion" und dürfen nicht als Dokumentinhalt erscheinen. Jeder sourceAnchor muss ein kurzes wörtliches Zitat aus dem Dokument sein. Keine Quellen, Gegenpositionen oder Mehrheiten erfinden.

Graph-Kontext:
${JSON.stringify(graphSummary)}

Dokument:
${input.text.slice(0, 120_000)}

Antworte ausschließlich als valides JSON ohne Markdown und exakt mit diesen Feldern:
{"themes":["..."],"decisionPoints":["..."],"questions":[{"id":"q-kurze-id","theme":"...","text":"...?","rationale":"...","sourceAnchors":["wörtlicher Textanker"]}],"options":[{"questionRef":"q-kurze-id","text":"...","source":"document","needsReview":true}],"claimsOrSourceHints":[{"text":"...","sourceAnchors":["wörtlicher Textanker"]}],"uncertainties":["..."]}
Für source ist ausschließlich "document" oder "ai_suggestion" zulässig.
Maximal 20 Fragen. Jede Frage und Option bleibt ein KI-Entwurf für menschliche Auswahl und Bearbeitung.`;
}

function emptyResult(status: "blocked" | "failed", error: string | null): MaterialStructuredDraftResult {
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

export async function generateMaterialStructuredDrafts(input: {
  text: string | null;
  graph: MaterialGraphFirstContext;
}): Promise<MaterialStructuredDraftResult> {
  const text = String(input.text ?? "").trim();
  if (!text) return emptyResult("blocked", "material_full_text_missing");

  const prompt = promptFor({ text, graph: input.graph });
  const materialRouting = LANE_ROUTING_POLICY.find((entry) => entry.lane === "material_grounding");
  const providerOrder = materialRouting?.primaryAnalyzeCandidates ?? [];
  const providers = {
    mistral: () => callMistral({ prompt, maxOutputTokens: 4_000 }),
    anthropic: () => callAnthropic({ prompt, maxOutputTokens: 4_000 }),
  } as const;

  let lastError: string | null = null;
  for (const provider of providerOrder) {
    if (provider !== "mistral" && provider !== "anthropic") continue;
    try {
      const result = await providers[provider]();
      const parsed = parseMaterialStructuredDraftPayload({
        providerText: result.text,
        documentText: text,
        graphProvenance: input.graph.provenance,
      });
      return {
        provider,
        status: "generated",
        ...parsed,
        reviewRequired: true,
        draftOnly: true,
        publicOutputAllowed: false,
        noAutoPublish: true,
        noAutoCreateRound: true,
        noAutoGraphWrite: true,
        noAutoMerge: true,
        error: null,
      };
    } catch (error) {
      lastError = `${provider}:${error instanceof Error ? error.message : "provider_failed"}`;
    }
  }

  return emptyResult("failed", lastError ?? "material_grounding_provider_unavailable");
}
