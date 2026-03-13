import { parseDemoPersona } from "@/features/demo/personas";
import { resolveSurfaceContext, readStringParam } from "@/features/surface";
import { MandatSurface } from "@/features/surfaces/mandat";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function DemoMandatPage({
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
      <h1 className="sr-only">Demo Mandat</h1>
      <MandatSurface context={context} persona={persona} searchParams={resolved} basePath="/demo/mandat" />
    </>
  );
}
