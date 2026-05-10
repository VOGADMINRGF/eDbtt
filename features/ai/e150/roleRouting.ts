import {
  getJourneyProfile,
  type E150JourneyKey,
  type E150JourneyProfile,
} from "./journeyProfiles";

type E150AnalysisMode = "analyze" | "media" | "guided";

export type E150RoleRoutingInput = {
  analysisMode?: string | null;
  audienceRole?: "citizen" | "staff" | "institution" | null;
  routePath?: string | null;
  pipeline?: string | null;
  journeyHint?: E150JourneyKey | null;
  sealedFactcheck?: boolean;
};

function normalizeJourneyHint(value?: string | null): E150JourneyKey | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "analyze" ||
    normalized === "media" ||
    normalized === "guided" ||
    normalized === "sealed_factcheck" ||
    normalized === "material_grounding"
  ) {
    return normalized as E150JourneyKey;
  }
  return null;
}

function normalizeAnalysisMode(value?: string | null): E150AnalysisMode {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "media") return "media";
  if (normalized === "guided") return "guided";
  return "analyze";
}

export function resolveJourneyKey(input: E150RoleRoutingInput): E150JourneyKey {
  const journeyHint = normalizeJourneyHint(input.journeyHint);
  if (journeyHint) return journeyHint;
  if (input.sealedFactcheck === true) return "sealed_factcheck";

  const pipeline = (input.pipeline ?? "").trim().toLowerCase();
  if (pipeline.includes("factcheck")) return "sealed_factcheck";

  const routePath = (input.routePath ?? "").trim().toLowerCase();
  if (routePath.includes("/factcheck/")) return "sealed_factcheck";

  return normalizeAnalysisMode(input.analysisMode);
}

export function resolveJourneyProfile(input: E150RoleRoutingInput): E150JourneyProfile {
  return getJourneyProfile(resolveJourneyKey(input));
}
