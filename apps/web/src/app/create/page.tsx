import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getDraft } from "@/server/draftStore";
import CreateClient from "./CreateClient";
import { getCreateEntitlementsForRequest } from "@/lib/server/entitlements/createEntitlements";
import { getAccountOverview } from "@features/account/service";
import { parseCreateMode, type CreateMode } from "@/features/create/intents";
import {
  parseCreateEntryIntent,
  parseCreateEntryMode,
  type CreateEntryIntent,
  type CreateEntryMode,
} from "@/features/create/orchestratorIntentContract";
import {
  parseCreateIntakeContextFromQuery,
} from "@/features/create/intakeContext";
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "@/config/locales";
import {
  getOperatorCreateTexts,
  resolveOperatorLocale,
} from "@/features/i18n/operatorSystemTexts";
import { LocaleProvider } from "@/context/LocaleContext";

export const metadata: Metadata = {
  title: "Erstellen - eDebatte",
  description: "Einheitlicher Einstieg für Statements, Beiträge und weitere Intents.",
};

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function readParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function decodeMaybe(value?: string) {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function mapMode(raw?: string | null): CreateMode | undefined {
  return parseCreateMode(raw);
}

function mapEntryIntent(raw?: string | null): CreateEntryIntent | undefined {
  return parseCreateEntryIntent(raw);
}

function mapEntryMode(raw?: string | null): CreateEntryMode | undefined {
  return parseCreateEntryMode(raw);
}

async function detectPageLocale(): Promise<SupportedLocale> {
  try {
    const cookieStore = await cookies();
    const cookieLang = cookieStore.get("lang")?.value;
    if (isSupportedLocale(cookieLang)) return cookieLang;
  } catch {
    // Falls outside request scope (e.g. isolated unit tests).
  }

  try {
    const headerStore = await headers();
    const acceptLanguage = headerStore.get("accept-language");
    if (acceptLanguage) {
      const primary = acceptLanguage.split(",")[0]?.split(";")[0]?.trim().slice(0, 2).toLowerCase();
      if (isSupportedLocale(primary)) return primary;
    }
  } catch {
    // Falls outside request scope (e.g. isolated unit tests).
  }

  return DEFAULT_LOCALE;
}

function toQueryString(resolved: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  Object.entries(resolved).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "string") params.append(key, item);
      });
      return;
    }
    if (typeof value === "string") params.set(key, value);
  });
  return params.toString();
}

export default async function CreatePage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const query = toQueryString(resolved);
  const pageLocale = resolveOperatorLocale(await detectPageLocale());
  const createText = getOperatorCreateTexts(pageLocale);

  const entitlements = await getCreateEntitlementsForRequest();
  if (!entitlements.isAuthenticated || !entitlements.userId) {
    redirect(`/login?next=${encodeURIComponent(query ? `/create?${query}` : "/create")}`);
  }

  const overview = await getAccountOverview(entitlements.userId);
  if (!overview) {
    redirect(`/login?next=${encodeURIComponent(query ? `/create?${query}` : "/create")}`);
  }

  const mode = mapMode(readParam(resolved.mode));
  const entryIntent =
    mapEntryIntent(readParam(resolved.entryIntent) ?? readParam(resolved.entry_intent)) ??
    mapEntryIntent(readParam(resolved.intent));
  const entryMode =
    mapEntryMode(readParam(resolved.entryMode) ?? readParam(resolved.entry_mode)) ??
    mapEntryMode(readParam(resolved.mode));
  const dossierId = readParam(resolved.dossierId) ?? null;
  const anlassraumId = readParam(resolved.anlassraumId) ?? null;
  const returnTo = readParam(resolved.returnTo) ?? null;
  const intakeContext = parseCreateIntakeContextFromQuery(resolved);
  const prefillText = decodeMaybe(readParam(resolved.prefill) ?? readParam(resolved.text));
  const draftId = readParam(resolved.draftId);

  let initialText = prefillText ?? null;
  if (!initialText && draftId) {
    const draft = await getDraft(draftId).catch(() => null);
    initialText = draft?.text ?? null;
  }

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <h1 className="sr-only">{createText.srOnlyCreate}</h1>
      <div className="mx-auto w-full max-w-[1560px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-11">
        <LocaleProvider initialLocale={pageLocale}>
          <CreateClient
            initialEntitlements={entitlements}
            overview={overview}
            dossierId={dossierId}
            initialAnlassraumId={anlassraumId}
            initialMode={mode}
            initialEntryIntent={entryIntent}
            initialEntryMode={entryMode}
            initialText={initialText}
            initialIntakeContext={intakeContext}
            initialReturnTo={returnTo}
          />
        </LocaleProvider>
      </div>
    </main>
  );
}
