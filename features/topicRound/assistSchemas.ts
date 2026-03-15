import { z } from "zod";
import {
  ROUND_ASSIST_REVIEW_DECISIONS,
  ROUND_ASSIST_RUN_STATUSES,
  ROUND_ASSIST_SUGGESTION_KINDS,
  ROUND_ASSIST_SUGGESTION_STATUSES,
} from "./assistTypes";

export const RoundAssistSuggestionKindSchema = z.enum(ROUND_ASSIST_SUGGESTION_KINDS);
export const RoundAssistRunStatusSchema = z.enum(ROUND_ASSIST_RUN_STATUSES);
export const RoundAssistSuggestionStatusSchema = z.enum(ROUND_ASSIST_SUGGESTION_STATUSES);
export const RoundAssistReviewDecisionSchema = z.enum(ROUND_ASSIST_REVIEW_DECISIONS);
export const RoundAssistConfidenceSchema = z.enum(["low", "medium", "high"]);

export const AssistSuggestionOutputSchema = z
  .object({
    title: z.string().min(1).max(180),
    text: z.string().min(1).max(800),
    confidence: RoundAssistConfidenceSchema.default("medium"),
    targetHint: z.string().min(1).max(180).optional(),
  })
  .strict();
export type AssistSuggestionOutput = z.infer<typeof AssistSuggestionOutputSchema>;

export const RoundAssistOutputSchema = z
  .object({
    suggestedClaims: z.array(AssistSuggestionOutputSchema).max(8).default([]),
    suggestedQuestions: z.array(AssistSuggestionOutputSchema).max(8).default([]),
    suggestedSourceLinks: z.array(AssistSuggestionOutputSchema).max(8).default([]),
    suggestedOptionRefinements: z.array(AssistSuggestionOutputSchema).max(8).default([]),
    suggestedRoadmapItems: z.array(AssistSuggestionOutputSchema).max(10).default([]),
    duplicateAndClusterHints: z.array(AssistSuggestionOutputSchema).max(8).default([]),
    personaSummaries: z.array(AssistSuggestionOutputSchema).max(6).default([]),
  })
  .strict();
export type RoundAssistOutput = z.infer<typeof RoundAssistOutputSchema>;

export const RoundAssistDecisionBodySchema = z
  .object({
    decision: RoundAssistReviewDecisionSchema,
    editedText: z.string().min(1).max(800).optional(),
    linkedEntityId: z.string().min(1).max(180).optional(),
    reviewNote: z.string().min(1).max(400).optional(),
  })
  .strict();
export type RoundAssistDecisionBody = z.infer<typeof RoundAssistDecisionBodySchema>;
