export type { AdminConfig, PricingConfig, PipelineLimits, RegionPilot } from "../../../../packages/config/admin-config";
export { adminConfig } from "../../../../packages/config/admin-config";
export default adminConfig;

// VOG Analyse-Modus Schalter
export const ANALYZE_MODE_FLAG = process.env.VOG_ANALYZE_MODE || "gpt"; // "gpt" | "multi"
