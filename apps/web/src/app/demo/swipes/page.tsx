import { parseDemoPersona } from "@/features/demo/personas";
import { readStringParam, resolveSurfaceContext } from "@/features/surface";
import { SwipesSurface } from "@/features/surfaces/swipes";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function DemoSwipesPage({
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
    viewerRole:
      persona === "journalist" ? "journalist" : persona === "administration" ? "admin" : "citizen",
    dataSource: "seed",
  });

  return (
    <>
      <h1 className="sr-only">Demo Swipes</h1>
      <SwipesSurface
        context={context}
        edebattePackage="none"
        initialTopic={typeof resolved?.topic === "string" ? resolved.topic : ""}
        requireAuthAfterFreeVotes={false}
      />
    </>
  );
}
