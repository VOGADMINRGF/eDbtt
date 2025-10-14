// core/schemas/editor.ts
import { z } from "zod";

export const PublishSchema = z.object({
  action: z.enum(["publish", "unpublish"]),
  regionMode: z.enum(["GLOBAL", "REGIONAL"]).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const ReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const ItemUpdateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  summary: z.string().max(2000).optional(),
  content: z.string().optional(),
  tags: z.array(z.string().min(1)).max(20).optional(),
});
