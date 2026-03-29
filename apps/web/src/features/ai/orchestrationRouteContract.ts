export type OrchestrationRouteContractMode =
  | "strict_staged_mainflow"
  | "strict_staged_wrapper"
  | "legacy_direct_provider_exception";

export type OrchestrationRouteContract = {
  route: string;
  mode: OrchestrationRouteContractMode;
  notes: string;
};

export const ORCHESTRATION_ROUTE_CONTRACTS: ReadonlyArray<OrchestrationRouteContract> = [
  {
    route: "/api/contributions/analyze",
    mode: "strict_staged_mainflow",
    notes: "Produktiver strict-staged Hauptfluss (Analyze -> Match -> CTA).",
  },
  {
    route: "/api/create/analyze",
    mode: "strict_staged_wrapper",
    notes: "Kanonischer Wrapper auf /api/contributions/analyze; keine eigene Analyze-Produktlogik.",
  },
  {
    route: "/api/contributions/analyze/save",
    mode: "legacy_direct_provider_exception",
    notes: "Direkter Providerpfad ausserhalb des strict-staged Hauptflusses (Legacy/Ausnahme).",
  },
  {
    route: "/api/contributions/refine",
    mode: "legacy_direct_provider_exception",
    notes: "Direkter Providerpfad ausserhalb des strict-staged Hauptflusses (Legacy/Ausnahme).",
  },
  {
    route: "/api/quality/clarify",
    mode: "legacy_direct_provider_exception",
    notes: "Direkter Providerpfad ausserhalb des strict-staged Hauptflusses (Legacy/Ausnahme).",
  },
  {
    route: "/api/_diag/gpt",
    mode: "legacy_direct_provider_exception",
    notes: "Diagnosepfad mit direktem Providerzugriff (Ops/Diagnostik, kein Hauptfluss).",
  },
  {
    route: "/api/admin/ai/orchestrator-smoke",
    mode: "legacy_direct_provider_exception",
    notes: "Admin-Smokepfad; kein produktiver Hauptfluss fuer Create/Analyze.",
  },
  {
    route: "/api/news/survey-topics",
    mode: "legacy_direct_provider_exception",
    notes: "News-/Survey-Hilfspfad mit direktem Providerzugriff; kein staged Hauptfluss.",
  },
  {
    route: "/api/quality/polish",
    mode: "legacy_direct_provider_exception",
    notes: "Quality-Hilfspfad mit direktem Providerzugriff; kein staged Hauptfluss.",
  },
];

export const LEGACY_DIRECT_PROVIDER_ROUTES = ORCHESTRATION_ROUTE_CONTRACTS
  .filter((entry) => entry.mode === "legacy_direct_provider_exception")
  .map((entry) => entry.route);

export function resolveOrchestrationRouteContract(
  route: string,
): OrchestrationRouteContract | null {
  return ORCHESTRATION_ROUTE_CONTRACTS.find((entry) => entry.route === route) ?? null;
}

export function isLegacyDirectProviderRoute(route: string): boolean {
  return LEGACY_DIRECT_PROVIDER_ROUTES.includes(route);
}
