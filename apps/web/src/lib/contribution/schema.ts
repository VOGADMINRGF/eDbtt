// apps/web/src/lib/contribution/schema.ts
import { z } from "zod";

export const TopicScoreZ = z.object({
  name: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const UserProfileHintZ = z.object({
  region: z.string().min(1).optional(),
  interests: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
});

export const AnalyzeBodyZ = z.object({
  text: z.string().min(1),
  userProfile: UserProfileHintZ.optional(),
  region: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  translateTo: z.array(z.string().min(2)).optional(),
});

export const LLMStatementZ = z.object({
  text: z.string().min(1),
  type: z.enum(["ja/nein", "skala", "frei"]),
  polarity: z.enum(["niedrig", "mittel", "hoch"]),
});

export const LLMAnalysisZ = z.object({
  region: z.string().nullable().optional(),
  topics: z.array(TopicScoreZ).default([]),
  statements: z.array(LLMStatementZ).default([]),
  suggestions: z.array(z.string()).default([]),
  isNewContext: z.boolean().default(true),
});

export type AnalyzeBody = z.infer<typeof AnalyzeBodyZ>;
export type LLMAnalysis = z.infer<typeof LLMAnalysisZ>;
