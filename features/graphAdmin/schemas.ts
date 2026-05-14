import { z } from "zod";
import { GRAPH_REPAIR_TYPES, GRAPH_REPAIR_STATUSES, GRAPH_REPAIR_SEVERITIES } from "./types";

export const GraphRepairTypeSchema = z.enum(GRAPH_REPAIR_TYPES);
export const GraphRepairStatusSchema = z.enum(GRAPH_REPAIR_STATUSES);
export const GraphRepairSeveritySchema = z.enum(GRAPH_REPAIR_SEVERITIES);

export const GraphMergeSuggestSchema = z.object({
  aId: z.string().min(2),
  bId: z.string().min(2),
  reason: z.string().min(3).max(300).optional(),
});

export const GraphRelinkSchema = z.object({
  fromId: z.string().min(2),
  toId: z.string().min(2),
  reason: z.string().min(3).max(300).optional(),
});

export const GraphRepairApplySchema = z.object({
  reason: z.string().min(3).max(300).optional(),
});
