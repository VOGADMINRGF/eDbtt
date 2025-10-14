// core/gpt/schemas.ts
import { z } from "zod";

/** Shared atoms */
const NonEmpty = z.string().min(1);
const URLString = z.string().url().optional();

export const ConfidenceNum = z.number().min(0).max(1).default(0.6);
export const ConfidenceEnum = z.enum(["low", "medium", "high"]);
export const Confidence = z.union([ConfidenceNum, ConfidenceEnum]).transform((v) => {
  if (typeof v === "number") return v;
  return v === "low" ? 0.25 : v === "medium" ? 0.6 : 0.85;
});

export const SourceItem = z.object({
  title: NonEmpty,
  url: URLString,
  publisher: z.string().optional(),
  date: z.string().optional(), // ISO-String empfohlen
});

/** Impact */
export const ImpactItemSchema = z.object({
  claim: NonEmpty,
  direction: z.enum(["increase", "decrease", "unclear", "none"]).default("unclear"),
  magnitude: z.number().min(0).max(1).default(0.5),
  timeframe: z.string().optional(),
  affected: z.array(NonEmpty).default([]),
  assumptions: z.array(NonEmpty).default([]),
  caveats: z.array(NonEmpty).default([]),
  confidence: Confidence,
  sources: z.array(SourceItem).default([]),
});

export const ImpactSchema = z.object({
  type: z.literal("impact"),
  summary: NonEmpty,
  items: z.array(ImpactItemSchema).min(1),
  overallConfidence: Confidence.default(0.6),
});

/** Alternatives */
export const AlternativeSchema = z.object({
  title: NonEmpty,
  description: NonEmpty,
  pros: z.array(NonEmpty).default([]),
  cons: z.array(NonEmpty).default([]),
  tradeoffs: z.array(NonEmpty).default([]),
  feasibility: z.enum(["low", "medium", "high"]).default("medium"),
  expectedImpact: z.enum(["low", "medium", "high"]).default("medium"),
  confidence: Confidence,
  sources: z.array(SourceItem).default([]),
});

export const AlternativesSchema = z.object({
  type: z.literal("alternatives"),
  summary: NonEmpty,
  options: z.array(AlternativeSchema).min(1),
  ranking: z.array(z.number()).optional(),
});

/** Factcheck */
export const FactCheckItemSchema = z.object({
  claim: NonEmpty,
  verdict: z.enum(["true", "false", "mixed", "unverified"]),
  rationale: NonEmpty,
  confidence: Confidence,
  sources: z.array(SourceItem).default([]),
});

export const FactCheckSchema = z.object({
  type: z.literal("factcheck"),
  summary: NonEmpty,
  items: z.array(FactCheckItemSchema).min(1),
});

/** Union */
export const AnyAnalysisSchema = z.union([ImpactSchema, AlternativesSchema, FactCheckSchema]);

export type Impact = z.infer<typeof ImpactSchema>;
export type Alternatives = z.infer<typeof AlternativesSchema>;
export type Factcheck = z.infer<typeof FactCheckSchema>;
export type AnyAnalysis = z.infer<typeof AnyAnalysisSchema>;
