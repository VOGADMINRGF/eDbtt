import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getDraft } from "@/server/draftStore";
import CreateClient from "./CreateClient";
import type { CreateIntakeContext } from "./CreateClient";
import { getCreateEntitlementsForRequest } from "@/lib/server/entitlements/createEntitlements";
import { getAccountOverview } from "@features/account/service";
import { parseCreateIntent, parseCreateMode, type CreateMode } from "@/features/create/intents";
import { formatRelevanceScopeLabel } from "@/features/relevanceFraming";
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "@/config/locales";
import {
  getOperatorSystemTexts,
  resolveOperatorLocale,
  type OperatorLocale,
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

function mapIntent(raw?: string | null): "statement" | "contribution" | undefined {
  const parsed = parseCreateIntent(raw);
  if (!parsed) return undefined;
  return parsed === "claim" ? "statement" : "contribution";
}

function mapMode(raw?: string | null): CreateMode | undefined {
  return parseCreateMode(raw);
}

function normalizeContextValue(value?: string | null, maxLen = 160) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLen);
}

function normalizeContextUrl(value?: string | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString().slice(0, 1000);
  } catch {
    return null;
  }
}

function buildCreateIntakeContext(resolved: Record<string, string | string[] | undefined>): CreateIntakeContext {
  return {
    source: normalizeContextValue(readParam(resolved.source), 64),
    signalTitle: normalizeContextValue(decodeMaybe(readParam(resolved.signalTitle)), 160),
    sourceUrl: normalizeContextUrl(decodeMaybe(readParam(resolved.sourceUrl))),
    sourceLabel: normalizeContextValue(decodeMaybe(readParam(resolved.sourceLabel)), 120),
    region: normalizeContextValue(decodeMaybe(readParam(resolved.region)), 64),
    scope: normalizeContextValue(decodeMaybe(readParam(resolved.scope)), 64),
    clusterHint: normalizeContextValue(decodeMaybe(readParam(resolved.clusterHint)), 120),
    reviewState: normalizeContextValue(decodeMaybe(readParam(resolved.reviewState)), 64),
    candidateId: normalizeContextValue(readParam(resolved.candidateId), 64),
    draftId: normalizeContextValue(readParam(resolved.draftId), 64),
    reason: normalizeContextValue(decodeMaybe(readParam(resolved.reason)), 200),
  };
}

function hasCreateIntakeContext(context: CreateIntakeContext): boolean {
  return (
    !!context.source ||
    !!context.signalTitle ||
    !!context.sourceUrl ||
    !!context.sourceLabel ||
    !!context.region ||
    !!context.scope ||
    !!context.clusterHint ||
    !!context.reviewState ||
    !!context.candidateId ||
    !!context.draftId ||
    !!context.reason
  );
}

function buildIntakeContextPrefill(
  context: CreateIntakeContext,
  anlassraumId: string | null | undefined,
  locale: OperatorLocale,
): string | null {
  if (!hasCreateIntakeContext(context) && !anlassraumId) return null;
  const text = getOperatorSystemTexts(locale).create;
  const workGoalTitle = locale === "en" ? "Work goal:" : "Arbeitsziel:";
  const workGoalLines =
    locale === "en"
      ? [
          "- Review signal context in a structured way",
          "- Attach to an Anlassraum or create a candidate deliberately",
          "- Continue dossier work only as a follow-up",
        ]
      : [
          "- Signal strukturiert prüfen",
          "- Anlassraum zuordnen oder Kandidat sauber neu anlegen",
          "- Dossier erst nachgelagert weiterführen",
        ];

  const lines = [
    `${text.intakeContextTitle} (Anlassraum-first):`,
    context.sourceLabel ? `${text.openPrimarySource}: ${context.sourceLabel}` : null,
    context.sourceUrl ? `${text.openPrimarySource} URL: ${context.sourceUrl}` : null,
    context.region ? `${text.regionLabel}: ${context.region}` : null,
    context.scope ? `${text.scopeLabel}: ${formatRelevanceScopeLabel(context.scope, context.scope)}` : null,
    context.source ? `${text.signalTrailLabel}: ${context.source}` : null,
    context.signalTitle ? `${text.signalLabel}: ${context.signalTitle}` : null,
    context.clusterHint ? `${text.clusterLabel}: ${context.clusterHint}` : null,
    context.reviewState ? `${text.reviewLabel}: ${context.reviewState}` : null,
    context.reason ? `${text.handoffLabel}: ${context.reason}` : null,
    anlassraumId ? `${text.anlassraumIdLabel}: ${anlassraumId}` : null,
    context.candidateId ? `${text.candidateIdLabel}: ${context.candidateId}` : null,
    context.draftId ? `${text.draftIdLabel}: ${context.draftId}` : null,
    "",
    workGoalTitle,
    ...workGoalLines,
  ].filter((entry): entry is string => typeof entry === "string" && entry.length > 0);

  return lines.join("\n");
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
  const createText = getOperatorSystemTexts(pageLocale).create;

  const entitlements = await getCreateEntitlementsForRequest();
  if (!entitlements.isAuthenticated || !entitlements.userId) {
    redirect(`/login?next=${encodeURIComponent(query ? `/create?${query}` : "/create")}`);
  }

  const overview = await getAccountOverview(entitlements.userId);
  if (!overview) {
    redirect(`/login?next=${encodeURIComponent(query ? `/create?${query}` : "/create")}`);
  }

  const intent = mapIntent(readParam(resolved.intent));
  const mode = mapMode(readParam(resolved.mode));
  const dossierId = readParam(resolved.dossierId) ?? null;
  const anlassraumId = readParam(resolved.anlassraumId) ?? null;
  const intakeContext = buildCreateIntakeContext(resolved);
  const prefillText = decodeMaybe(readParam(resolved.prefill) ?? readParam(resolved.text));
  const draftId = readParam(resolved.draftId);

  let initialText = prefillText ?? null;
  if (!initialText && draftId) {
    const draft = await getDraft(draftId).catch(() => null);
    initialText = draft?.text ?? null;
  }
  if (!initialText) {
    initialText = buildIntakeContextPrefill(intakeContext, anlassraumId, pageLocale);
  }

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <h1 className="sr-only">{createText.srOnlyCreate}</h1>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8">
        <LocaleProvider initialLocale={pageLocale}>
          <CreateClient
            initialEntitlements={entitlements}
            overview={overview}
            dossierId={dossierId}
            initialAnlassraumId={anlassraumId}
            initialIntent={intent}
            initialMode={mode}
            initialText={initialText}
            initialIntakeContext={intakeContext}
          />
        </LocaleProvider>
      </div>
    </main>
  );
}
