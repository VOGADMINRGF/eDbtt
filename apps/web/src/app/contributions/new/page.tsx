import { redirect } from "next/navigation";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

const ALLOWED_CREATE_QUERY_KEYS = new Set([
  "intent",
  "mode",
  "dossierId",
  "statementId",
  "anlassraumId",
  "draftId",
  "candidateId",
  "signalTitle",
  "sourceUrl",
  "sourceLabel",
  "region",
  "scope",
  "clusterHint",
  "reviewState",
  "reason",
  "prefill",
  "text",
  "source",
  "next",
]);

function toQueryString(resolved: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  Object.entries(resolved).forEach(([key, value]) => {
    if (!ALLOWED_CREATE_QUERY_KEYS.has(key)) return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "string") params.append(key, item);
      });
      return;
    }
    if (typeof value === "string") params.set(key, value);
  });
  if (!params.has("intent")) params.set("intent", "source");
  return params.toString();
}

export default async function ContributionNewPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const query = toQueryString(resolved);
  redirect(query ? `/create?${query}` : "/create?intent=source");

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <h1 className="sr-only">Beitrag analysieren</h1>
    </main>
  );
}
