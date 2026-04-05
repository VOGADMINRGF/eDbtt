import { z } from "zod";
import { ObjectId } from "@core/db/triMongo";
import { CREATE_MODE_VALUES, parseCreateMode } from "@/features/create/intents";
import { resolveCreateLanguageContext } from "@/features/create/languageContextContract";

/**
 * Backwards-compatible request parser for /api/contributions/analyze.
 *
 * Supports:
 * - legacy: { text, locale }
 * - newer clients: { textOriginal, textPrepared, locale, uiLocale, contentLanguage, sourceLanguage, maxClaims, detailPreset, evidenceItems }
 */
export const AnalyzeRequestSchemaV2 = z
  .object({
    // legacy
    text: z.string().optional(),

    // newer clients
    textOriginal: z.string().optional(),
    textPrepared: z.string().optional(),
    preparedText: z.string().optional(),

    locale: z.string().min(2).max(8).optional(),
    uiLocale: z.string().min(2).max(16).optional(),
    contentLanguage: z.string().min(2).max(16).optional(),
    sourceLanguage: z.string().min(2).max(16).optional(),
    maxClaims: z.number().int().min(1).max(30).optional(),
    detailPreset: z.number().int().min(1).max(4).optional(),
    evidenceItems: z.array(z.any()).optional(),
    stream: z.boolean().optional(),
    live: z.boolean().optional(),

    // existing compatibility hooks
    test: z.string().optional(),
    contributionId: z.string().min(3).max(100).optional(),
    dossierId: z.string().min(1).max(120).optional(),
    createMode: z.preprocess(
      (value) => {
        if (typeof value !== "string") return value;
        const parsed = parseCreateMode(value);
        return parsed ?? value.toLowerCase().trim();
      },
      z.enum(CREATE_MODE_VALUES).optional(),
    ),
    anlassraumId: z.preprocess(
      (value) => {
        if (typeof value !== "string") return value;
        const normalized = value.trim().toLowerCase();
        return normalized || undefined;
      },
      z
        .string()
        .refine((value) => ObjectId.isValid(value), "invalid_anlassraum_id")
        .optional(),
    ),
  })
  .superRefine((val, ctx) => {
    if (val.test === "ping") return;
    const candidate = (val.textPrepared ?? val.preparedText ?? val.text ?? val.textOriginal ?? "").trim();
    if (!candidate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Feld 'text' ist erforderlich.",
        path: ["text"],
      });
      return;
    }
    if (candidate.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 10,
        inclusive: true,
        type: "string",
        origin: "string",
        message: "Text ist zu kurz (min. 10 Zeichen).",
        path: ["text"],
      });
    }
  })
  .transform((val) => {
    const effectiveText = (val.textPrepared ?? val.preparedText ?? val.text ?? val.textOriginal ?? "").trim();
    const languageContext = resolveCreateLanguageContext({
      locale: val.locale,
      uiLocale: val.uiLocale,
      contentLanguage: val.contentLanguage,
      sourceLanguage: val.sourceLanguage,
    });
    return {
      ...val,
      text: effectiveText,
      locale: languageContext.uiLocale,
      uiLocale: languageContext.uiLocale,
      contentLanguage: languageContext.contentLanguage,
      sourceLanguage: languageContext.sourceLanguage,
    };
  });

export type AnalyzeRequestParsed = z.infer<typeof AnalyzeRequestSchemaV2>;

export function parseAnalyzeRequestBody(
  raw: unknown,
):
  | { ok: true; value: AnalyzeRequestParsed }
  | { ok: false; error: { message: string; issues?: unknown } } {
  const parsed = AnalyzeRequestSchemaV2.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        message: parsed.error?.issues?.[0]?.message ?? "Ungültige Eingabe für die Analyse.",
        issues: parsed.error.issues,
      },
    };
  }
  return { ok: true, value: parsed.data };
}
