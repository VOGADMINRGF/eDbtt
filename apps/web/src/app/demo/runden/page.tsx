import { redirect } from "next/navigation";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

type RoundEntryView = "active" | "mine" | "results" | "organize";

function readStringParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseView(value?: string): RoundEntryView | null {
  if (value === "active" || value === "mine" || value === "results" || value === "organize") {
    return value;
  }
  return null;
}

function buildCompatHref(view: RoundEntryView | null) {
  const params = new URLSearchParams({ compat: "demo_runden" });
  if (view) params.set("view", view);
  return `/runden?${params.toString()}`;
}

export default async function DemoRundenCompatibilityPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const view = parseView(readStringParam(resolved?.view));
  const targetHref = buildCompatHref(view);

  redirect(targetHref);

  return (
    <main>
      <h1 className="sr-only">Runden</h1>
    </main>
  );
}
