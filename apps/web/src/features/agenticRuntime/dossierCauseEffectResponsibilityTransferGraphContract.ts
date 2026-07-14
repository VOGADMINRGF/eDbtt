import type {
  ClaimsFactcheckAgentGraphIntegrationContract,
  ClaimsFactcheckClaimEntry,
} from "@/features/agenticRuntime/claimsFactcheckAgentGraphIntegrationContract";
import type { ResearchTransferabilityEntry } from "@/features/agenticRuntime/researchSourceTransferabilityAgentContract";
import {
  AGENT_SAFE_TRACE_CONFIDENCE_LABELS,
  buildAgentSafeTraceStep,
  type AgentSafeTraceStep,
} from "@/features/agenticRuntime/agentRunArtifactSafeTraceContract";

export type DossierCauseEffectCandidate = {
  id: string;
  label: string;
  derivedFromClaimId: string | null;
  reviewState: "candidate_only";
};

export type DossierResponsibilityCandidate = {
  id: string;
  label: string;
  institutionalVerification: "required";
  reviewState: "candidate_only";
};

export type DossierTransferabilityCandidate = {
  sourceId: string;
  title: string;
  decision: ResearchTransferabilityEntry["decision"];
  approvedComparison: false;
  reviewState: "candidate_only";
};

export type DossierCauseEffectResponsibilityTransferGraphContract = {
  causeCandidates: DossierCauseEffectCandidate[];
  effectCandidates: DossierCauseEffectCandidate[];
  responsibilityCandidates: DossierResponsibilityCandidate[];
  transferabilityCandidates: DossierTransferabilityCandidate[];
  reviewRequired: true;
  noAutoGraphWrite: true;
  noAutoDossierPublish: true;
  safeTrace: AgentSafeTraceStep[];
};

function toCauseCandidate(
  claim: ClaimsFactcheckClaimEntry,
  index: number,
): DossierCauseEffectCandidate {
  return {
    id: `cause-${index + 1}`,
    label: claim.text,
    derivedFromClaimId: claim.id,
    reviewState: "candidate_only",
  };
}

function toEffectCandidate(
  claim: ClaimsFactcheckClaimEntry,
  index: number,
): DossierCauseEffectCandidate {
  return {
    id: `effect-${index + 1}`,
    label: claim.text,
    derivedFromClaimId: claim.id,
    reviewState: "candidate_only",
  };
}

export function buildDossierCauseEffectResponsibilityTransferGraphContract(input: {
  claimsModel: ClaimsFactcheckAgentGraphIntegrationContract;
  responsibilityHints: string[];
}): DossierCauseEffectResponsibilityTransferGraphContract {
  const sourceClaims = input.claimsModel.claims.filter(
    (claim) => claim.semanticType === "claim_candidate",
  );
  const causeCandidates = sourceClaims.map(toCauseCandidate);
  const effectCandidates = sourceClaims.map(toEffectCandidate);
  const responsibilityCandidates = input.responsibilityHints.map((label, index) => ({
    id: `responsibility-${index + 1}`,
    label,
    institutionalVerification: "required" as const,
    reviewState: "candidate_only" as const,
  }));
  const transferabilityCandidates = input.claimsModel.sourceCandidates
    .filter((source) => source.decision !== "local_reference")
    .map((source) => ({
      sourceId: source.sourceId,
      title: source.title,
      decision: source.decision,
      approvedComparison: false as const,
      reviewState: "candidate_only" as const,
    }));

  const safeTrace: AgentSafeTraceStep[] = [
    buildAgentSafeTraceStep({
      taskId: "V3-DOSSIER-CAUSE-EFFECT-RESPONSIBILITY-TRANSFER-GRAPH-01",
      stepId: "dossier_cause_effect_candidate_gate",
      surface: "/dossier/[id]",
      userSafeLabel:
        "Ursache, Wirkung und Verantwortung bleiben review-first Kandidaten. Ein Dossier-Zweig ist noch kein finaler Befund.",
      status: "review_required",
      confidenceLabel: AGENT_SAFE_TRACE_CONFIDENCE_LABELS[1],
      requiredHumanAction: "review_before_publish",
      inputArtifacts: sourceClaims.map((claim) => ({
        id: claim.id,
        type: "review_handoff",
        label: claim.text,
        reviewState: "review_required",
      })),
      outputArtifacts: [
        {
          id: "dossier-cause-effect-candidates",
          type: "review_handoff",
          label: `${causeCandidates.length + effectCandidates.length} cause/effect candidates`,
          reviewState: "review_required",
        },
      ],
      evidenceRefs: [...causeCandidates, ...effectCandidates].map((candidate) => candidate.id),
      primaryRole: "dossier_briefing",
      supportingRoles: ["research_source", "claims_factcheck", "governance_compliance"],
    }),
    buildAgentSafeTraceStep({
      taskId: "V3-DOSSIER-CAUSE-EFFECT-RESPONSIBILITY-TRANSFER-GRAPH-01",
      stepId: "dossier_responsibility_transferability_gate",
      surface: "/dossier/[id]",
      userSafeLabel:
        "Verantwortungs- und Transferkandidaten bleiben getrennt von amtlich verifizierter Verantwortung oder freigegebener Vergleichsaussage.",
      status: "review_required",
      confidenceLabel: AGENT_SAFE_TRACE_CONFIDENCE_LABELS[0],
      requiredHumanAction: "assess_transferability",
      inputArtifacts: [
        {
          id: "dossier-transferability-input",
          type: "transferability_candidate",
          label: `${transferabilityCandidates.length} Transferability candidates`,
          reviewState: "review_required",
        },
      ],
      outputArtifacts: [
        {
          id: "dossier-responsibility-transfer-contract",
          type: "review_handoff",
          label: "Responsibility and transfer remain candidate_only",
          reviewState: "review_required",
        },
      ],
      evidenceRefs: [
        ...responsibilityCandidates.map((candidate) => candidate.id),
        ...transferabilityCandidates.map((candidate) => candidate.sourceId),
      ],
      primaryRole: "dossier_briefing",
      supportingRoles: ["research_source", "claims_factcheck", "governance_compliance"],
    }),
  ];

  return {
    causeCandidates,
    effectCandidates,
    responsibilityCandidates,
    transferabilityCandidates,
    reviewRequired: true,
    noAutoGraphWrite: true,
    noAutoDossierPublish: true,
    safeTrace,
  };
}
