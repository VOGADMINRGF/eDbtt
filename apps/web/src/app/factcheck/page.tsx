import type { Metadata } from "next";
import { parseDemoPersona } from "@/features/demo/personas";
import { readSession } from "@/utils/session";
import { readStringParam, resolveSurfaceContext } from "@/features/surface";
import { FactcheckHandoffShell } from "@/features/surfaces/factcheck/FactcheckHandoffShell";
import { buildShareMetadata } from "@/features/share/metadata";
import { getCreateEntitlementsForRequest } from "@/lib/server/entitlements/createEntitlements";

export const metadata: Metadata = buildShareMetadata({
  objectType: "factcheck",
  pathOrUrl: "/factcheck",
  title: "Factcheck",
  description: "Factcheck-Workflow mit transparentem Status und nachvollziehbarer Prüfung.",
  ogType: "article",
});

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function personaFromRole(role?: string | null) {
  if (role === "admin" || role === "staff") return "administration";
  if (role === "journalist") return "journalist";
  return "citizen";
}

export default async function FactcheckPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const requested = readStringParam(resolved?.persona);
  const session = await readSession().catch(() => null);
  const entitlements = await getCreateEntitlementsForRequest().catch(() => ({
    isAuthenticated: false,
    canDeepResearch: false,
  }));
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
      <h1 className="sr-only">Factcheck</h1>
      <FactcheckHandoffShell
        context={context}
        persona={persona}
        handoffId={readStringParam(resolved?.handoffId)}
        access={{
          isAuthenticated: entitlements.isAuthenticated,
          canDeepResearch: entitlements.canDeepResearch,
        }}
      />
    </>
  );
}
