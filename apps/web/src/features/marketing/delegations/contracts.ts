import { z } from "zod";

export const MARKETING_DELEGATION_ITEM_TYPES = ["campaign", "opportunity"] as const;
export const MARKETING_DELEGATION_AGENT_ROLES = [
  "marketing_operator",
  "research_operator",
  "content_operator",
  "analytics_operator",
] as const;
export const MARKETING_DELEGATION_STATUS_VALUES = [
  "queued",
  "in_progress",
  "review_required",
  "completed",
  "cancelled",
] as const;

const idSchema = z.string().trim().min(1).max(160);
const isoDateSchema = z.string().datetime({ offset: true });

export const MarketingDelegationRequestSchema = z
  .object({
    itemType: z.enum(MARKETING_DELEGATION_ITEM_TYPES),
    itemId: idSchema,
    agentRole: z.enum(MARKETING_DELEGATION_AGENT_ROLES),
  })
  .strict();

export const MarketingDelegationRecordSchema = z
  .object({
    id: idSchema,
    itemType: z.enum(MARKETING_DELEGATION_ITEM_TYPES),
    itemId: idSchema,
    itemTitle: z.string().trim().min(1).max(240),
    agentRole: z.enum(MARKETING_DELEGATION_AGENT_ROLES),
    status: z.enum(MARKETING_DELEGATION_STATUS_VALUES),
    goal: z.string().trim().min(1).max(2000),
    expectedOutputs: z.array(z.string().trim().min(1).max(300)).min(1).max(8),
    requestedByUserId: idSchema,
    requestedAt: isoDateSchema,
    updatedAt: isoDateSchema,
    requiresHumanReview: z.literal(true),
    autoExecute: z.literal(false),
    autoPublish: z.literal(false),
  })
  .strict();

export type MarketingDelegationRequest = z.infer<typeof MarketingDelegationRequestSchema>;
export type MarketingDelegationRecord = z.infer<typeof MarketingDelegationRecordSchema>;
export type MarketingDelegationAgentRole = MarketingDelegationRecord["agentRole"];
export type MarketingDelegationStatus = MarketingDelegationRecord["status"];
