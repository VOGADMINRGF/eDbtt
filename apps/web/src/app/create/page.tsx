import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDraft } from "@/server/draftStore";
import CreateClient from "./CreateClient";
import type { CreateIntakeContext } from "./CreateClient";
import { getCreateEntitlementsForRequest } from "@/lib/server/entitlements/createEntitlements";
import { getAccountOverview } from "@features/account/service";
import { parseCreateIntent, parseCreateMode, type CreateMode } from "@/features/create/intents";
import { formatRelevanceScopeLabel } from "@/features/relevanceFraming";

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

function buildIntakeContextPrefill(context: CreateIntakeContext, anlassraumId?: string | null): string | null {
  if (!hasCreateIntakeContext(context) && !anlassraumId) return null;

  const lines = [
    "Intake-Kontext (Anlassraum-first):",
    context.signalTitle ? `Signal: ${context.signalTitle}` : null,
    context.sourceLabel ? `Quelle: ${context.sourceLabel}` : null,
    context.sourceUrl ? `Quelle-URL: ${context.sourceUrl}` : null,
    context.region ? `Region/Bezug: ${context.region}` : null,
    context.scope ? `Relevanzraum: ${formatRelevanceScopeLabel(context.scope, context.scope)}` : null,
    context.clusterHint ? `Cluster-Hinweis: ${context.clusterHint}` : null,
    anlassraumId ? `Anlassraum-Kontext: ${anlassraumId}` : null,
    context.candidateId ? `Candidate-ID: ${context.candidateId}` : null,
    context.draftId ? `Draft-ID: ${context.draftId}` : null,
    context.reviewState ? `Review-State: ${context.reviewState}` : null,
    context.reason ? `Handoff: ${context.reason}` : null,
    "",
    "Arbeitsziel:",
    "- Signal strukturiert pruefen",
    "- Anlassraum zuordnen oder Kandidat sauber neu anlegen",
    "- Dossier erst nachgelagert weiterfuehren",
  ].filter((entry): entry is string => typeof entry === "string" && entry.length > 0);

  return lines.join("\n");
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
    initialText = buildIntakeContextPrefill(intakeContext, anlassraumId);
  }

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <h1 className="sr-only">Erstellen</h1>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8">
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
      </div>
    </main>
  );
}
