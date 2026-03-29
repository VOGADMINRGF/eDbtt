import { redirect } from "next/navigation";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function buildRundenAliasTarget(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  for (const key of Object.keys(searchParams).sort()) {
    const value = searchParams[key];
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === "string") params.append(key, entry);
      }
      continue;
    }
    if (typeof value === "string") params.append(key, value);
  }

  const query = params.toString();
  return query ? `/runden?${query}` : "/runden";
}

export default async function AnlassraumAliasPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  redirect(buildRundenAliasTarget(resolved));

  return (
    <main>
      <h1 className="sr-only">Anlassraum</h1>
    </main>
  );
}
