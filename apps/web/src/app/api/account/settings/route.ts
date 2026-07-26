import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateAccountSettings } from "@features/account/service";
import type { AccountSettingsUpdate } from "@features/account/types";
import { ACCOUNT_FEATURE_INTEREST_KEYS } from "@features/account/types";
import { isSupportedLocale } from "@core/locale/locales";
import { readSession } from "@/utils/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  displayName: z
    .union([
      z
        .string()
        .min(2, "Name zu kurz")
        .max(80, "Name zu lang"),
      z.literal("").transform(() => null),
      z.null(),
    ])
    .optional(),
  uiLocale: z
    .string()
    .refine((val) => isSupportedLocale(val), { message: "locale_invalid" })
    .optional(),
  readingLocale: z
    .string()
    .refine((val) => isSupportedLocale(val), { message: "locale_invalid" })
    .optional(),
  preferredOutputLocales: z
    .array(z.string().refine((val) => isSupportedLocale(val), { message: "locale_invalid" }))
    .max(5)
    .optional(),
  showOriginalByDefault: z.boolean().optional(),
  preferredLocale: z
    .string()
    .refine((val) => isSupportedLocale(val), { message: "locale_invalid" })
    .optional(),
  newsletterOptIn: z.boolean().optional(),
  featureInterests: z
    .array(z.enum(ACCOUNT_FEATURE_INTEREST_KEYS))
    .max(ACCOUNT_FEATURE_INTEREST_KEYS.length)
    .optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await readSession();
  const userId = session?.uid ?? null;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "validation_error" },
      { status: 400 },
    );
  }

  const payload: AccountSettingsUpdate = {
    displayName:
      parsed.data.displayName !== undefined ? parsed.data.displayName : undefined,
    uiLocale:
      parsed.data.uiLocale !== undefined
        ? (parsed.data.uiLocale as AccountSettingsUpdate["uiLocale"])
        : undefined,
    readingLocale:
      parsed.data.readingLocale !== undefined
        ? (parsed.data.readingLocale as AccountSettingsUpdate["readingLocale"])
        : undefined,
    preferredOutputLocales:
      parsed.data.preferredOutputLocales !== undefined
        ? (parsed.data.preferredOutputLocales as AccountSettingsUpdate["preferredOutputLocales"])
        : undefined,
    showOriginalByDefault: parsed.data.showOriginalByDefault,
    preferredLocale:
      parsed.data.preferredLocale !== undefined
        ? (parsed.data.preferredLocale as AccountSettingsUpdate["preferredLocale"])
        : undefined,
    newsletterOptIn: parsed.data.newsletterOptIn,
    featureInterests: parsed.data.featureInterests,
  };

  const overview = await updateAccountSettings(userId, payload);
  if (!overview) {
    return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, overview });
}
