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

