export type VerificationMode = "none" | "precheck" | "sealed";
export type ResearchUsed = "none" | "lite" | "gemini" | "search" | "deep_search";

export type VerificationContract = {
  verificationMode: VerificationMode;
  researchUsed: ResearchUsed;
  sealEligible: boolean;
  sealGranted: boolean;
};

export type UserFacingVerificationLabel = "analysiert" | "geprueft" | "verifiziert";

export function deriveVerificationLabel(
  contract: Pick<VerificationContract, "verificationMode" | "sealGranted">,
): UserFacingVerificationLabel {
  if (contract.verificationMode === "none") return "analysiert";
  if (contract.verificationMode === "sealed" && contract.sealGranted) return "verifiziert";
  return "geprueft";
}

export function buildStandardLaneContract(params?: {
  verificationMode?: "none" | "precheck";
  researchUsed?: Extract<ResearchUsed, "none" | "lite" | "gemini" | "deep_search">;
}): VerificationContract {
  return {
    verificationMode: params?.verificationMode ?? "none",
    researchUsed: params?.researchUsed ?? "none",
    sealEligible: false,
    sealGranted: false,
  };
}

export function buildSealedLaneContract(params?: {
  researchUsed?: Extract<ResearchUsed, "search" | "deep_search">;
  sealGranted?: boolean;
}): VerificationContract {
  return {
    verificationMode: "sealed",
    researchUsed: params?.researchUsed ?? "search",
    sealEligible: true,
    sealGranted: params?.sealGranted === true,
  };
}
