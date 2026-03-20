import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDraft } from "@/server/draftStore";
import CreateClient from "./CreateClient";
import { getCreateEntitlementsForRequest } from "@/lib/server/entitlements/createEntitlements";
import { getAccountOverview } from "@features/account/service";
import { parseCreateIntent, parseCreateMode, type CreateMode } from "@/features/create/intents";

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
  const prefillText = decodeMaybe(readParam(resolved.prefill) ?? readParam(resolved.text));
  const draftId = readParam(resolved.draftId);

  let initialText = prefillText ?? null;
  if (!initialText && draftId) {
    const draft = await getDraft(draftId).catch(() => null);
    initialText = draft?.text ?? null;
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
        />
      </div>
    </main>
  );
}
