import type {
  CreateArgumentDraft,
  CreateClaimDraft,
  CreateHandoffDraft,
  CreateOpenQuestionDraft,
} from "@/features/create/createHandoff";
import type {
  ResearchSourceTransferabilityContract,
  ResearchTransferabilityEntry,
} from "@/features/agenticRuntime/researchSourceTransferabilityAgentContract";
import {
  AGENT_SAFE_TRACE_CONFIDENCE_LABELS,
  buildAgentSafeTraceStep,
  type AgentSafeTraceStep,
} from "@/features/agenticRuntime/agentRunArtifactSafeTraceContract";

export const CLAIMS_FACTCHECK_SEMANTIC_TYPES = [
  "claim_candidate",
  "interpretation_candidate",
  "policy_candidate",
  "hypothesis_candidate",
] as const;

export type ClaimsFactcheckSemanticType =
  (typeof CLAIMS_FACTCHECK_SEMANTIC_TYPES)[number];

export type ClaimsFactcheckClaimEntry = {
  id: string;
  text: string;
  semanticType: ClaimsFactcheckSemanticType;
  claimIsFact: false;
  interpretationIsEvidence: false;
  hypothesisIsVerification: false;
  factcheckStatus: "candidate_only" | "not_applicable";
  graphWriteState: "candidate_only";
  sourceCandidateState: "review_required";
  evidenceRefIds: string[];
};

export type ClaimsFactcheckGraphEdgeCandidate = {
  id: string;
  fromClaimId: string;
  toSourceId: string;
  relation: "supported_by" | "qualified_by" | "needs_source_review";
  candidateOnly: true;
};

export type ClaimsFactcheckAgentGraphIntegrationContract = {
  claims: ClaimsFactcheckClaimEntry[];
  arguments: Array<{
    id: string;
    text: string;
    stance: CreateArgumentDraft["stance"];
    supportsClaimIds: string[];
    reviewRequired: true;
  }>;
  openQuestions: CreateOpenQuestionDraft[];
  sourceCandidates: ResearchTransferabilityEntry[];
  graphEdgeCandidates: ClaimsFactcheckGraphEdgeCandidate[];
  reviewRequired: true;
  translationIsEvidence: false;
  noAutoGraphMerge: true;
  noFakeFactcheck: true;
  noFakeSource: true;
  safeTrace: AgentSafeTraceStep[];
};

function mapClaimSemanticType(
  claim: CreateClaimDraft,
): ClaimsFactcheckSemanticType {
  if (claim.kind === "factual_claim") return "claim_candidate";
  if (claim.kind === "policy_claim") return "policy_candidate";
  if (claim.factcheckEligible) return "claim_candidate";
  return "interpretation_candidate";
}

function buildClaimEntry(claim: CreateClaimDraft): ClaimsFactcheckClaimEntry {
  const semanticType = mapClaimSemanticType(claim);
  const factcheckStatus =
    semanticType === "claim_candidate" && claim.factcheckEligible
      ? "candidate_only"
      : "not_applicable";

  return {
    id: claim.id,
    text: claim.text,
    semanticType,
    claimIsFact: false,
    interpretationIsEvidence: false,
    hypothesisIsVerification: false,
    factcheckStatus,
    graphWriteState: "candidate_only",
    sourceCandidateState: "review_required",
    evidenceRefIds: claim.sourceRefs,
  };
}

function buildGraphEdgeCandidates(input: {
  claims: ClaimsFactcheckClaimEntry[];
  sourceCandidates: ResearchTransferabilityEntry[];
}): ClaimsFactcheckGraphEdgeCandidate[] {
  return input.claims.flatMap((claim) =>
    input.sourceCandidates.map((source) => ({
      id: `${claim.id}:${source.sourceId}`,
      fromClaimId: claim.id,
      toSourceId: source.sourceId,
      relation:
        claim.semanticType === "claim_candidate" &&
        source.decision === "local_reference"
          ? "supported_by"
          : source.decision === "translation_reading_only"
            ? "qualified_by"
            : "needs_source_review",
      candidateOnly: true as const,
    })),
  );
}

export function buildClaimsFactcheckAgentGraphIntegrationContract(input: {
  draft: CreateHandoffDraft;
  research: ResearchSourceTransferabilityContract;
}): ClaimsFactcheckAgentGraphIntegrationContract {
  const claims = input.draft.claims.map(buildClaimEntry);
  const graphEdgeCandidates = buildGraphEdgeCandidates({
    claims,
    sourceCandidates: input.research.entries,
  });
  const safeTrace: AgentSafeTraceStep[] = [
    buildAgentSafeTraceStep({
      taskId: "V3-CLAIMS-FACTCHECK-AGENT-GRAPH-INTEGRATION-01",
      stepId: "claims_factcheck_candidate_split",
      surface: "/factcheck",
      userSafeLabel:
        "Claim, Interpretation, Hypothese und Quellenkandidat bleiben getrennt. Faktencheck und Graph bleiben review-first Kandidaten.",
      status: "review_required",
      confidenceLabel: AGENT_SAFE_TRACE_CONFIDENCE_LABELS[1],
      requiredHumanAction: "verify_source_provenance",
      inputArtifacts: claims.map((claim) => ({
        id: claim.id,
        type: "review_handoff",
        label: claim.text,
        reviewState: "review_required",
      })),
      outputArtifacts: [
        {
          id: "claims-factcheck-contract",
          type: "review_handoff",
          label: "Claim / factcheck / graph candidate split",
          reviewState: "review_required",
        },
      ],
      evidenceRefs: input.research.entries.map((entry) => entry.sourceId),
      primaryRole: "claims_factcheck",
      supportingRoles: ["research_source", "governance_compliance"],
    }),
    buildAgentSafeTraceStep({
      taskId: "V3-CLAIMS-FACTCHECK-AGENT-GRAPH-INTEGRATION-01",
      stepId: "claims_graph_candidate_gate",
      surface: "/dossier/[id]",
      userSafeLabel:
        "Graph-Kandidaten bleiben nur review-first Verknuepfungen. Es gibt keinen automatischen Graph-Write und kein stilles offizielles Urteil.",
      status: "review_required",
      confidenceLabel: AGENT_SAFE_TRACE_CONFIDENCE_LABELS[0],
      requiredHumanAction: "review_before_publish",
      inputArtifacts: [
        {
          id: "claims-factcheck-graph-input",
          type: "review_handoff",
          label: `${graphEdgeCandidates.length} Graph-Kandidaten`,
          reviewState: "review_required",
        },
      ],
      outputArtifacts: [
        {
          id: "claims-factcheck-graph-candidates",
          type: "review_handoff",
          label: "Graph write remains candidate_only",
          reviewState: "review_required",
        },
      ],
      evidenceRefs: graphEdgeCandidates.map((edge) => edge.id),
      primaryRole: "claims_factcheck",
      supportingRoles: ["research_source", "governance_compliance"],
    }),
  ];

  return {
    claims,
    arguments: input.draft.arguments.map((argument) => ({
      id: argument.id,
      text: argument.text,
      stance: argument.stance,
      supportsClaimIds: argument.supportsClaimIds,
      reviewRequired: true,
    })),
    openQuestions: input.draft.openQuestions,
    sourceCandidates: input.research.entries,
    graphEdgeCandidates,
    reviewRequired: true,
    translationIsEvidence: false,
    noAutoGraphMerge: true,
    noFakeFactcheck: true,
    noFakeSource: true,
    safeTrace,
  };
}
