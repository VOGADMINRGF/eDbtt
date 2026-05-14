export type RuntimeDataSourceKind = "runtime" | "fixture" | "demo" | "seed" | "local_storage";

export type RuntimeDataGuardrail = {
  isFixture: boolean;
  isPilotFixture: boolean;
  notRealNews: boolean;
  notProductionData: boolean;
  demoOnly: boolean;
  localOnly: boolean;
  reviewRequired: boolean;
  sourceKind: RuntimeDataSourceKind;
};

type SwipeFallbackContext = {
  fromDraftId?: string | null;
  regionId?: string | null;
  adminContext?: boolean;
  reviewContext?: boolean;
};

export function buildRuntimeDataGuardrail(sourceKind: RuntimeDataSourceKind): RuntimeDataGuardrail {
  return {
    isFixture: sourceKind === "fixture",
    isPilotFixture: sourceKind === "fixture",
    notRealNews: sourceKind === "fixture",
    notProductionData: sourceKind === "fixture" || sourceKind === "demo" || sourceKind === "seed",
    demoOnly: sourceKind === "demo",
    localOnly: sourceKind === "local_storage",
    reviewRequired: sourceKind !== "runtime",
    sourceKind,
  };
}

export function isRegionDraftDossierId(value: string | null | undefined): boolean {
  return String(value || "").trim().toLowerCase().startsWith("dossier-draft-");
}

export function isExplicitDemoDossierId(value: string | null | undefined): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "demo" || normalized === "demo-dossier" || normalized === "dossier_demo_mobility_berlin";
}

export function shouldAllowDemoDossierFallback(dossierId: string | null | undefined): boolean {
  return isExplicitDemoDossierId(dossierId);
}

export function shouldAllowSwipeSeedFallback(context: SwipeFallbackContext | null | undefined): boolean {
  if (!context) return true;
  if (String(context.fromDraftId || "").trim()) return false;
  if (String(context.regionId || "").trim()) return false;
  if (context.adminContext) return false;
  if (context.reviewContext) return false;
  return true;
}
