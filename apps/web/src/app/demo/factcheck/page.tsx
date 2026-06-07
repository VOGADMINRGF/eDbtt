import { parseDemoPersona } from "@/features/demo/personas";
import { readStringParam, resolveSurfaceContext } from "@/features/surface";
import { FactcheckSurface } from "@/features/surfaces/factcheck";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function DemoFactcheckPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const persona = parseDemoPersona(readStringParam(resolved?.persona));
  const context = resolveSurfaceContext({
    mode: "demo",
    audience:
      persona === "journalist" ? "journalist" : persona === "administration" ? "verwaltung" : "buerger",
    dataSource: "seed",
  });

  return (
    <>
      <h1 className="sr-only">Demo Factcheck</h1>
      <FactcheckSurface
        context={context}
        persona={persona}
        access={{ isAuthenticated: false, canDeepResearch: false }}
      />
    </>
  );
}
