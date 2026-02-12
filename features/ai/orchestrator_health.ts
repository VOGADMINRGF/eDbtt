// features/ai/orchestrator_health.ts
// Thin wrapper around the unified health registry for orchestrator scoring.

export {
  Health,
  healthScore,
  withMetrics,
  getMetricsSnapshot,
  resetMetrics,
  defaultFailureClassifier,
} from "./health";

export type { ProviderId } from "./health";
