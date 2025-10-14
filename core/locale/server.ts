import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "./locales";

export async function getServerLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();                      // ← async!
  const cookieLang = cookieStore.get("lang")?.value;
  if (isSupportedLocale(cookieLang)) return cookieLang as SupportedLocale;

  const accept = (await headers()).get("accept-language") || "";
  const primary = accept.split(",")[0]?.trim()?.split(";")[0]?.slice(0, 2) ?? "";
  if (isSupportedLocale(primary)) return primary as SupportedLocale;

  return DEFAULT_LOCALE;
}
