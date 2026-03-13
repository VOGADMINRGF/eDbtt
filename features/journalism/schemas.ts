import { z } from "zod";

export const SourceAnchorTypeSchema = z.enum([
  "article",
  "print",
  "video",
  "podcast",
  "talkshow",
  "social_post",
]);
export type SourceAnchorType = z.infer<typeof SourceAnchorTypeSchema>;

export const SourceAnchorSchema = z
  .object({
    id: z.string().min(1),
    type: SourceAnchorTypeSchema,
    title: z.string().min(1).max(220),
    medium: z.string().min(1).max(120),
    format: z.string().min(1).max(120).optional(),
    url: z.string().url().optional(),
    reference: z.string().min(1).max(280).optional(),
    publishedAt: z.string().optional(),
    triggerClaim: z.string().min(1).max(500),
    publicPath: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    if (!value.url && !value.reference) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "source_anchor_requires_url_or_reference",
        path: ["url"],
      });
    }
  });
export type SourceAnchor = z.infer<typeof SourceAnchorSchema>;
