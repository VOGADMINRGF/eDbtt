import { getJourneyProfile, type E150JourneyProfile } from "./journeyProfiles";
import { buildSealedLaneContract, type ResearchUsed, type VerificationContract } from "./verificationContract";

export type SealedFactcheckResearchMode = Extract<ResearchUsed, "search" | "deep_search">;

export function getSealedFactcheckJourneyProfile(): E150JourneyProfile {
  return getJourneyProfile("sealed_factcheck");
}

export function resolveSealedFactcheckResearchUsed(params?: {
  deepSearch?: boolean;
  requested?: SealedFactcheckResearchMode | null;
}): SealedFactcheckResearchMode {
  if (params?.requested === "deep_search") return "deep_search";
  if (params?.requested === "search") return "search";
  return params?.deepSearch === true ? "deep_search" : "search";
}

export function buildSealedFactcheckContract(params?: {
  deepSearch?: boolean;
  researchUsed?: SealedFactcheckResearchMode | null;
  sealGranted?: boolean;
}): VerificationContract {
  const researchUsed = resolveSealedFactcheckResearchUsed({
    deepSearch: params?.deepSearch,
    requested: params?.researchUsed ?? null,
  });
  return buildSealedLaneContract({
    researchUsed,
    sealGranted: params?.sealGranted === true,
  });
}
