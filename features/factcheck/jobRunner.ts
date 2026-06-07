import {
  deriveTruthGuardContract,
  type ResearchUsed,
  type SourceSupport,
  type TruthStatus,
  type UserFacingVerificationLabel,
  type VerificationMode,
} from "@features/ai/e150/verificationContract";
import type {
  E150ConfidenceMeta,
  E150DisagreementMeta,
} from "@features/ai/e150/disagreementConfidence";
import {
  getFactcheckWorkflowRepo,
  type FactcheckJobDoc,
  type FactcheckProviderMatrix,
  type FactcheckRequestedAction,
  type FactcheckResult,
} from "./db";
import {
  deriveFactcheckSealEligibility,
  deriveFactcheckVerificationMode,
  factcheckResearchModeToCompatibilityResearchUsed,
  factcheckVerificationModeToCompatibilityMode,
} from "./workflow";

function normalizeText(value: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s:/.-]/gu, " ")
    .replace(/\s+/g, " ");
}

function buildProviderMatrix(job: FactcheckJobDoc): FactcheckProviderMatrix {
  const requestedAction = job.requestedAction ?? "factcheck";
  const deepResearchRequested = requestedAction === "deep_research";
  const searchRequested =
    requestedAction === "source_check" ||
    requestedAction === "deep_research" ||
    requestedAction === "sealed_factcheck";
  const providerRunAllowed =
    Boolean(job.gate?.entitlementConfirmed) && Boolean(job.gate?.userConfirmed);
  const deepResearchAllowed =
    deepResearchRequested &&
    providerRunAllowed &&
    Boolean(job.gate?.pricingConfirmed);

  const notes = [
    providerRunAllowed
      ? "Kein Auto-Publish und kein Auto-Graph-Merge."
      : "Provider-Lauf ist nicht freigeschaltet.",
  ];
  if (deepResearchRequested && !deepResearchAllowed) {
    notes.push("Deep Research bleibt ohne bestätigtes Gate deaktiviert.");
  }

  return {
    requestedAction,
    searchRequested,
    deepResearchRequested,
    providerRunAllowed,
    deepResearchAllowed,
    usedProviders: deepResearchAllowed
      ? ["deep_search"]
      : searchRequested && providerRunAllowed
        ? ["search"]
        : [],
    notes,
  };
}

function deriveResearchUsed(job: FactcheckJobDoc): ResearchUsed {
  if (job.researchUsed) return job.researchUsed;
  if (
    job.factcheckResearchMode === "deep_research_requested" ||
    job.factcheckResearchMode === "deep_research_approved"
  ) {
    return "deep_search";
  }
  if (job.requestedAction === "deep_research") return "deep_search";
  if (
    job.requestedAction === "source_check" ||
    job.requestedAction === "sealed_factcheck"
  ) {
    return "search";
  }
  return factcheckResearchModeToCompatibilityResearchUsed(job.factcheckResearchMode);
}

function deriveConfidence(job: FactcheckJobDoc): E150ConfidenceMeta {
  if (job.orchestrationConfidence) return job.orchestrationConfidence;
  const noSources = (job.sourceRefs ?? []).length === 0;
  const disagreementPresent = job.disagreement?.present === true;
  const fallbackUsed = job.fallbackUsed === true;
  const score = noSources ? 0.31 : disagreementPresent || fallbackUsed ? 0.44 : 0.68;
  const bucket = score >= 0.75 ? "high" : score >= 0.45 ? "medium" : "low";
  return {
    score,
    bucket,
    reasons: noSources
      ? ["missing_sources"]
      : disagreementPresent
        ? ["provider_disagreement"]
        : fallbackUsed
          ? ["fallback_used"]
          : ["review_first_factcheck"],
  };
}

function deriveDisagreement(job: FactcheckJobDoc): E150DisagreementMeta | null {
  if (job.disagreement) return job.disagreement;
  return null;
}

function buildResult(job: FactcheckJobDoc): FactcheckResult {
  const sources = job.sourceRefs ?? [];
  const claims = job.claims ?? [];
  const disagreement = deriveDisagreement(job);
  const confidence = deriveConfidence(job);
  const requestedAction = job.requestedAction ?? "factcheck";
  const verificationMode: VerificationMode =
    requestedAction === "sealed_factcheck" && job.sealGranted === true ? "sealed" : "precheck";
  const sourceGrounding =
    sources.length === 0
      ? {
          sourceInventory: { total: 0 },
          synthesis: {
            documentGroundedClaims: 0,
            webGroundedClaims: 0,
            inferredClaims: 0,
            openClaims: Math.max(1, claims.length),
          },
          requiresManualReview: true,
          noSourceBluffing: { passed: true },
        }
      : {
          sourceInventory: { total: sources.length },
          synthesis: {
            documentGroundedClaims: 0,
            webGroundedClaims: Math.max(1, claims.length),
            inferredClaims: 0,
            openClaims: 0,
          },
          requiresManualReview: false,
          noSourceBluffing: { passed: true },
        };
  const truthView = deriveTruthGuardContract({
    lane: requestedAction === "sealed_factcheck" ? "sealed_factcheck" : "material_grounding",
    verificationMode,
    sealGranted: job.sealGranted === true,
    fallbackUsed: job.fallbackUsed === true,
    disagreement,
    confidence,
    reviewRecommended:
      sources.length === 0 ||
      disagreement?.present === true ||
      job.status === "needs_manual_review" ||
      confidence.bucket === "low",
    sourceGrounding,
  });
  const reviewRecommended =
    truthView.reviewRecommended ||
    sources.length === 0 ||
    disagreement?.present === true ||
    job.status === "needs_manual_review";
  const sourceStatus =
    sources.length === 0
      ? "Quellenprüfung offen"
      : reviewRecommended
        ? "Quellenprüfung erfolgt, manuelle Prüfung bleibt erforderlich"
        : "Quellenprüfung vorhanden";
  const summary =
    sources.length === 0
      ? "Quellenprüfung als Arbeitsstand angelegt. Belastbare Quellen fehlen noch."
      : reviewRecommended
        ? "Quellenprüfung als Arbeitsstand abgeschlossen. Das Ergebnis bleibt review-first."
        : "Quellenprüfung abgeschlossen. Das Ergebnis ist noch nicht veröffentlicht.";
  const openQuestions =
    sources.length === 0
      ? ["Welche belastbaren Quellen oder Dokumente stützen den Beitrag?"]
      : disagreement?.present === true
        ? ["Welche Quelle soll für die manuelle Prüfung priorisiert werden?"]
        : [];

  return {
    jobId: job.jobId,
    claims,
    sources,
    sourceSupport: truthView.sourceSupport,
    sourceStatus,
    truthStatus: truthView.truthStatus,
    verificationLabel:
      requestedAction === "sealed_factcheck" && job.sealGranted === true
        ? "verifiziert"
        : reviewRecommended
          ? "analysiert"
          : truthView.verificationLabel,
    researchUsed: deriveResearchUsed(job),
    providerMatrix: job.providerMatrix ?? buildProviderMatrix(job),
    disagreement,
    confidence,
    reviewRecommended,
    summary,
    openQuestions,
    limitations: job.limitations ?? [],
    noTruthPromotion: true,
    noAutoGraphPromotion: true,
  };
}

export function refreshFactcheckJobState(job: FactcheckJobDoc): FactcheckJobDoc {
  const next = { ...job };
  if (!next.normalizedText) {
    next.normalizedText = normalizeText(next.inputText);
  }
  next.providerMatrix = next.providerMatrix ?? buildProviderMatrix(next);

  if (
    next.status === "completed" ||
    next.status === "needs_manual_review" ||
    next.status === "sealed"
  ) {
    next.result = buildResult(next);
    next.truthStatus = next.result.truthStatus;
    next.sourceSupport = next.result.sourceSupport;
    next.sourceStatus = next.result.sourceStatus;
    next.verificationLabel = next.result.verificationLabel;
    next.confidenceScore = next.result.confidence?.score ?? next.confidenceScore ?? 0;
    next.verdict =
      next.requestedAction === "sealed_factcheck" && next.sealGranted === true
        ? "LIKELY_TRUE"
        : next.verdict ?? "UNDETERMINED";
  } else if (next.status === "queued" || next.status === "running") {
    next.result = null;
    next.truthStatus = "factcheck_requested";
    next.sourceSupport = (next.sourceRefs ?? []).length > 0 ? "sourced" : "open";
    next.sourceStatus =
      next.status === "running" ? "Quellenprüfung läuft" : "Quellenprüfung angefragt";
    next.verificationLabel = "analysiert";
  } else if (next.status === "failed" || next.status === "cancelled") {
    next.result = null;
    next.truthStatus = "review_required";
    next.sourceSupport = (next.sourceRefs ?? []).length > 0 ? "sourced" : "open";
    next.sourceStatus =
      next.status === "failed" ? "Quellenprüfung fehlgeschlagen" : "Quellenprüfung abgebrochen";
    next.verificationLabel = "analysiert";
  }

  next.factcheckSealEligibility = deriveFactcheckSealEligibility({
    status: next.status,
    hasSourceRefs: (next.sourceRefs ?? []).length > 0,
    hasClaims: (next.claims ?? []).length > 0,
  });
  next.factcheckVerificationMode = deriveFactcheckVerificationMode({
    status: next.status,
    researchMode: next.factcheckResearchMode,
    hasSourceRefs: (next.sourceRefs ?? []).length > 0,
    sealDecision: next.factcheckSealDecision,
  });
  next.verificationMode = factcheckVerificationModeToCompatibilityMode(
    next.factcheckVerificationMode,
  );
  next.researchUsed = deriveResearchUsed(next);
  next.sealEligible =
    next.factcheckSealEligibility === "eligible" ||
    next.factcheckSealEligibility === "needs_review";
  next.sealGranted = next.factcheckSealDecision === "granted";
  next.noAutoPublish = true;
  next.noAutoGraphPromotion = true;
  next.noAutoDossier = true;
  next.noAutoAnlassraum = true;
  next.noAutoVote = true;
  return next;
}

export async function runFactcheckJob(jobId: string) {
  const repo = getFactcheckWorkflowRepo();
  const current = await repo.get(jobId);
  if (!current) {
    throw new Error("factcheck_job_not_found");
  }
  if (current.status === "cancelled" || current.status === "archived") {
    return refreshFactcheckJobState(current);
  }

  const startedAt = new Date();
  const running = refreshFactcheckJobState({
    ...current,
    status: "running",
    updatedAt: startedAt,
  });
  await repo.save(running);

  const disagreementPresent = running.disagreement?.present === true;
  const completedAt = new Date();
  const completed = refreshFactcheckJobState({
    ...running,
    status:
      disagreementPresent || (running.sourceRefs ?? []).length === 0
        ? "needs_manual_review"
        : "completed",
    updatedAt: completedAt,
    completedAt,
    finishedAt: completedAt,
    error: null,
  });
  await repo.save(completed);
  return completed;
}
