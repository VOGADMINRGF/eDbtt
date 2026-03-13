import { parseDemoPersona } from "@/features/demo/personas";
import { readSession } from "@/utils/session";
import { resolveSurfaceContext, readStringParam } from "@/features/surface";
import { MandatSurface } from "@/features/surfaces/mandat";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function personaFromRole(role?: string | null) {
  if (role === "admin" || role === "staff") return "administration";
  if (role === "journalist") return "journalist";
  return "citizen";
}

export default async function MandatPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const requested = readStringParam(resolved?.persona);
  const session = await readSession().catch(() => null);
  const persona = parseDemoPersona(requested ?? personaFromRole(session?.role));
  const context = resolveSurfaceContext({
    mode: "live",
    audience:
      persona === "journalist" ? "journalist" : persona === "administration" ? "verwaltung" : "buerger",
    viewerRole:
      persona === "journalist" ? "journalist" : persona === "administration" ? "admin" : "citizen",
    dataSource: "live",
  });

  return (
    <>
      <h1 className="sr-only">Mandat</h1>
      <MandatSurface context={context} persona={persona} searchParams={resolved} basePath="/mandat" />
    </>
  );
}
