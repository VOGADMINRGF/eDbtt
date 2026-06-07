export type VerificationMode = "none" | "precheck" | "sealed";
export type ResearchUsed = "none" | "lite" | "gemini" | "search" | "deep_search";
export type TruthStatus =
  | "draft_analysis"
  | "source_open"
  | "source_grounded"
  | "review_required"
  | "factcheck_requested"
  | "factcheck_passed"
  | "sealed_verified";
export type SourceSupport = "none" | "open" | "inferred" | "partial" | "sourced" | "sealed";

export type VerificationContract = {
  verificationMode: VerificationMode;
  researchUsed: ResearchUsed;
  sealEligible: boolean;
  sealGranted: boolean;
};

export type UserFacingVerificationLabel = "analysiert" | "geprueft" | "verifiziert";
export type TruthGuardLane = "standard" | "sealed_factcheck" | "material_grounding";

export type TruthGuardContract = {
  verificationLabel: UserFacingVerificationLabel;
  truthStatus: TruthStatus;
  sourceSupport: SourceSupport;
  sourceStatus: string;
  reviewRecommended: boolean;
  noTruthPromotion: true;
  noAutoGraphPromotion: true;
};

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

type TruthGuardParams = Pick<VerificationContract, "verificationMode" | "sealGranted"> & {
  lane?: TruthGuardLane | null;
  fallbackUsed?: boolean;
  reviewRecommended?: boolean;
  disagreement?: {
    present?: boolean;
    missingSpecialists?: unknown[];
  } | null;
  confidence?: {
    bucket?: "low" | "medium" | "high";
  } | null;
  sourceGrounding?: {
    sourceInventory?: { total?: number } | null;
    synthesis?: {
      documentGroundedClaims?: number;
      webGroundedClaims?: number;
      inferredClaims?: number;
      openClaims?: number;
    } | null;
    noSourceBluffing?: { passed?: boolean } | null;
    requiresManualReview?: boolean;
  } | null;
};

function resolveLaneAwareVerification(params: TruthGuardParams): {
  lane: TruthGuardLane;
  verificationMode: VerificationMode;
  sealGranted: boolean;
  laneMismatch: boolean;
} {
  const lane = params.lane ?? "standard";
  const laneAllowsSealed = lane === "sealed_factcheck";
  const laneMismatch = params.verificationMode === "sealed" && !laneAllowsSealed;

  return {
    lane,
    verificationMode: laneMismatch ? "precheck" : params.verificationMode,
    sealGranted: laneAllowsSealed && params.verificationMode === "sealed" && params.sealGranted,
    laneMismatch,
  };
}

function deriveSourceSupport(params: TruthGuardParams): SourceSupport {
  const laneAware = resolveLaneAwareVerification(params);
  if (laneAware.verificationMode === "sealed" && laneAware.sealGranted) return "sealed";

  const sourceInventoryTotal = params.sourceGrounding?.sourceInventory?.total ?? null;
  if (sourceInventoryTotal === null) return "none";
  if (sourceInventoryTotal <= 0) return "open";

  const documentGroundedClaims = params.sourceGrounding?.synthesis?.documentGroundedClaims ?? 0;
  const webGroundedClaims = params.sourceGrounding?.synthesis?.webGroundedClaims ?? 0;
  const inferredClaims = params.sourceGrounding?.synthesis?.inferredClaims ?? 0;
  const openClaims = params.sourceGrounding?.synthesis?.openClaims ?? 0;
  const groundedClaims = documentGroundedClaims + webGroundedClaims;
  const noSourceBluffingPassed = params.sourceGrounding?.noSourceBluffing?.passed !== false;

  if (!noSourceBluffingPassed) return groundedClaims > 0 ? "partial" : "open";
  if (groundedClaims > 0 && (inferredClaims > 0 || openClaims > 0)) return "partial";
  if (groundedClaims > 0) return "sourced";
  if (inferredClaims > 0) return "inferred";
  if (openClaims > 0) return "open";
  return "open";
}

function deriveReviewRecommended(
  params: TruthGuardParams,
  sourceSupport: SourceSupport,
): boolean {
  const laneAware = resolveLaneAwareVerification(params);
  return Boolean(
    params.reviewRecommended ||
      laneAware.laneMismatch ||
      params.fallbackUsed === true ||
      params.disagreement?.present === true ||
      (params.disagreement?.missingSpecialists?.length ?? 0) > 0 ||
      params.sourceGrounding?.requiresManualReview === true ||
      params.sourceGrounding?.noSourceBluffing?.passed === false ||
      (params.sourceGrounding?.synthesis?.inferredClaims ?? 0) > 0 ||
      (params.confidence?.bucket === "low" &&
        (laneAware.verificationMode !== "none" || sourceSupport !== "none")),
  );
}

function deriveTruthStatus(params: {
  verificationMode: VerificationMode;
  sealGranted: boolean;
  sourceSupport: SourceSupport;
  reviewRecommended: boolean;
}): TruthStatus {
  if (params.verificationMode === "sealed" && params.sealGranted) return "sealed_verified";
  if (params.verificationMode === "sealed") {
    return params.sourceSupport === "sourced" && !params.reviewRecommended
      ? "factcheck_passed"
      : "factcheck_requested";
  }
  if (params.reviewRecommended) return "review_required";
  if (params.sourceSupport === "sourced") return "source_grounded";
  if (
    params.sourceSupport === "open" ||
    params.sourceSupport === "inferred" ||
    params.sourceSupport === "partial"
  ) {
    return "source_open";
  }
  return "draft_analysis";
}

function deriveSourceStatus(params: {
  truthStatus: TruthStatus;
  sourceSupport: SourceSupport;
  sealGranted: boolean;
  sourceInventoryTotal: number | null;
}): string {
  if (params.sealGranted) return "Siegel verifiziert";
  if (params.truthStatus === "factcheck_requested") return "Faktencheck angefordert";
  if (params.truthStatus === "factcheck_passed") return "Quellenprüfung abgeschlossen";
  if (params.sourceInventoryTotal === null || params.sourceInventoryTotal <= 0) {
    return "Keine Quellenprüfung gestartet";
  }
  if (params.sourceSupport === "sourced") return "Quellenprüfung vorhanden";
  if (params.sourceSupport === "partial") return "Quellenprüfung teilweise vorhanden";
  if (params.sourceSupport === "inferred") return "Claims bleiben teilweise unbelegt";
  if (params.sourceSupport === "open") return "Quellenprüfung offen";
  return "Analyseentwurf ohne Quellenpflicht";
}

export function deriveTruthGuardContract(params: TruthGuardParams): TruthGuardContract {
  const laneAware = resolveLaneAwareVerification(params);
  const sourceSupport = deriveSourceSupport(params);
  const reviewRecommended = deriveReviewRecommended(params, sourceSupport);
  const truthStatus = deriveTruthStatus({
    verificationMode: laneAware.verificationMode,
    sealGranted: laneAware.sealGranted,
    sourceSupport,
    reviewRecommended,
  });
  const sourceInventoryTotal = params.sourceGrounding?.sourceInventory?.total ?? null;

  const canPresentAsChecked =
    laneAware.verificationMode !== "none" &&
    params.fallbackUsed !== true &&
    params.disagreement?.present !== true &&
    params.sourceGrounding?.noSourceBluffing?.passed !== false &&
    sourceSupport === "sourced";

  return {
    verificationLabel:
      laneAware.verificationMode === "sealed" && laneAware.sealGranted
        ? "verifiziert"
        : canPresentAsChecked
          ? "geprueft"
          : "analysiert",
    truthStatus,
    sourceSupport,
    sourceStatus: deriveSourceStatus({
      truthStatus,
      sourceSupport,
      sealGranted: params.sealGranted,
      sourceInventoryTotal,
    }),
    reviewRecommended,
    noTruthPromotion: true,
    noAutoGraphPromotion: true,
  };
}
