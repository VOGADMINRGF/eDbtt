import type { SurfaceAudience, SurfaceMode } from "@/features/surface";

type DetailRouteContext = {
  mode?: SurfaceMode;
  audience?: SurfaceAudience;
};

function demoPersonaByAudience(audience?: SurfaceAudience) {
  if (audience === "journalist") return "journalist";
  if (audience === "verwaltung") return "administration";
  return "citizen";
}

export function buildSwipeDossierHref(statementId: string, context?: DetailRouteContext) {
  if (statementId.startsWith("seed-")) {
    const persona = demoPersonaByAudience(context?.audience);
    return `/demo/dossier?persona=${encodeURIComponent(persona)}&mode=lesen&anchor=${encodeURIComponent(statementId)}`;
  }
  return `/dossier/${encodeURIComponent(statementId)}`;
}

export function buildSwipeEvidenceHref(statementId: string, context?: DetailRouteContext) {
  if (statementId.startsWith("seed-")) {
    const persona = demoPersonaByAudience(context?.audience);
    return `/demo/dossier?persona=${encodeURIComponent(persona)}&mode=lesen&anchor=${encodeURIComponent(statementId)}#material`;
  }
  return `/dossier/${encodeURIComponent(statementId)}#material`;
}

export function buildSwipeVotingHref(
  statementId: string,
  context?: DetailRouteContext,
  options?: { title?: string | null },
) {
  const query = new URLSearchParams();
  if (options?.title) query.set("q", options.title);
  if (!statementId.startsWith("seed-")) {
    query.set("statementId", statementId);
    const suffix = query.toString();
    return `/abstimmungen${suffix ? `?${suffix}` : ""}`;
  }
  const persona = demoPersonaByAudience(context?.audience);
  query.set("persona", persona);
  const suffix = query.toString();
  return `/demo/abstimmungen${suffix ? `?${suffix}` : ""}`;
}
