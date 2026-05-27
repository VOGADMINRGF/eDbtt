export type AiExecutionActorId =
  | "system_graph"
  | "policy_orchestrator"
  | "validator"
  | "openai"
  | "anthropic"
  | "mistral"
  | "gemini"
  | "ari"
  | "perplexity"
  | "openai_deep_research";

export type AiExecutionActorKind = "system" | "provider";

export type AiProviderRole =
  | "graph_context"
  | "strict_analyze"
  | "draft_analysis"
  | "editorial_perspective"
  | "summarization"
  | "material_extraction"
  | "research_discovery"
  | "fallback"
  | "presentation_pass";

export type AiV2Lane =
  | "standard"
  | "material_extraction"
  | "feed_signal"
  | "themenradar_cluster"
  | "sealed_factcheck"
  | "research_addon"
  | "fallback_only";

export type AiSmokeStatusCode =
  | "ok"
  | "skipped_not_needed"
  | "skipped_not_in_lane"
  | "failed"
  | "timeout"
  | "schema_failed"
  | "degraded"
  | "fallback_used"
  | "cost_blocked"
  | "missing_secret";

export type AiQualityGateDecision =
  | "blocked"
  | "factcheck_required"
  | "review_required"
  | "draft_only"
  | "ready_for_review";

export type AiFlowId =
  | "themenradar"
  | "feed_signal"
  | "material_extraction"
  | "dossier_update"
  | "sealed_factcheck"
  | "standard_analyze";

export type AiExecutionActorContract = {
  actorId: AiExecutionActorId;
  displayName: string;
  kind: AiExecutionActorKind;
  roles: readonly AiProviderRole[];
  mayTriggerExternalCost: boolean;
  requiresExplicitApproval: boolean;
  reviewFirstOnly: boolean;
  notes: readonly string[];
};

export type AiLanePolicy = {
  lane: AiV2Lane;
  label: string;
  description: string;
  allowedActors: readonly AiExecutionActorId[];
  maxLatencyHintMs: number;
  budgetHint: "tiny" | "standard" | "elevated" | "premium";
  researchAllowed: boolean;
  costApprovalRequired: boolean;
  reviewRequired: boolean;
  sealEligible: boolean;
  publicOutputAllowed: boolean;
  draftOnly: boolean;
};

export type AiSmokeStatusCopy = {
  code: AiSmokeStatusCode;
  label: string;
  description: string;
};

export type AiQualityGateSummary = {
  schemaValid: boolean;
  safeEnough: boolean;
  reviewRequired: boolean;
  factcheckRequired: boolean;
  blocked: boolean;
  draftOnly: boolean;
  readyForReview: boolean;
  decision: AiQualityGateDecision;
  label: string;
  description: string;
};

export type AiFlowIntegrationSummary = {
  flow: AiFlowId;
  lane: AiV2Lane;
  laneLabel: string;
  reviewRequired: boolean;
  draftOnly: boolean;
  publicOutputAllowed: boolean;
  factcheckRequired: boolean;
  researchAllowed: boolean;
  costApprovalRequired: boolean;
  sealEligible: boolean;
  nextSuggestedAction: string;
  outputLabel: string;
};

export const AI_EXECUTION_ACTORS: readonly AiExecutionActorContract[] = [
  {
    actorId: "system_graph",
    displayName: "Graph-Kontext",
    kind: "system",
    roles: ["graph_context"],
    mayTriggerExternalCost: false,
    requiresExplicitApproval: false,
    reviewFirstOnly: true,
    notes: [
      "Liefert Wissen, Kontext und State.",
      "Wählt keine Provider und löst keine externen Kostenpfade aus.",
    ],
  },
  {
    actorId: "policy_orchestrator",
    displayName: "Policy-Orchestrator",
    kind: "system",
    roles: ["fallback"],
    mayTriggerExternalCost: false,
    requiresExplicitApproval: false,
    reviewFirstOnly: true,
    notes: [
      "Entscheidet deterministisch über Lane, Provider und Guardrails.",
      "Veröffentlicht nichts und vergibt kein Siegel.",
    ],
  },
  {
    actorId: "validator",
    displayName: "Qualitätsgate",
    kind: "system",
    roles: ["presentation_pass"],
    mayTriggerExternalCost: false,
    requiresExplicitApproval: false,
    reviewFirstOnly: true,
    notes: [
      "Prüft Schema, Safety und Review-Pflichten.",
      "Hebt Drafts nicht automatisch in öffentliche Wahrheit.",
    ],
  },
  {
    actorId: "openai",
    displayName: "GPT / OpenAI",
    kind: "provider",
    roles: ["strict_analyze", "draft_analysis", "presentation_pass"],
    mayTriggerExternalCost: true,
    requiresExplicitApproval: false,
    reviewFirstOnly: true,
    notes: [
      "Bevorzugter Strict-Analyze-Pfad.",
      "Kein automatischer DeepSearch- oder Veröffentlichungsweg.",
    ],
  },
  {
    actorId: "anthropic",
    displayName: "Claude / Anthropic",
    kind: "provider",
    roles: ["draft_analysis", "editorial_perspective", "summarization"],
    mayTriggerExternalCost: true,
    requiresExplicitApproval: false,
    reviewFirstOnly: true,
    notes: [
      "Editorial- und Zusammenfassungsrolle.",
      "Bleibt Draft-/Review-first und ist kein Siegelpfad.",
    ],
  },
  {
    actorId: "mistral",
    displayName: "Mistral",
    kind: "provider",
    roles: ["draft_analysis", "material_extraction", "fallback"],
    mayTriggerExternalCost: true,
    requiresExplicitApproval: false,
    reviewFirstOnly: true,
    notes: [
      "Fallback- und Material-Extraktionsrolle.",
      "Erzeugt nur Drafts, Hinweise und Review-Kandidaten.",
    ],
  },
  {
    actorId: "gemini",
    displayName: "Gemini",
    kind: "provider",
    roles: ["summarization", "material_extraction", "editorial_perspective"],
    mayTriggerExternalCost: true,
    requiresExplicitApproval: false,
    reviewFirstOnly: true,
    notes: [
      "Optional für große Kontexte und Material-Zusammenfassungen.",
      "Nicht als stiller Research- oder Publish-Pfad verwenden.",
    ],
  },
  {
    actorId: "perplexity",
    displayName: "Perplexity",
    kind: "provider",
    roles: ["research_discovery"],
    mayTriggerExternalCost: true,
    requiresExplicitApproval: true,
    reviewFirstOnly: true,
    notes: [
      "Optionaler Research-Discovery-Provider.",
      "Nur mit bewusster Lane/Freigabe und nie als Standard-Analyze.",
    ],
  },
  {
    actorId: "ari",
    displayName: "ARI",
    kind: "provider",
    roles: ["research_discovery"],
    mayTriggerExternalCost: true,
    requiresExplicitApproval: true,
    reviewFirstOnly: true,
    notes: [
      "Premium-Research-/Arbiter-nahe Rolle.",
      "Nie automatisch, nie als Factcheck-Siegel und nie ohne Freigabe.",
    ],
  },
  {
    actorId: "openai_deep_research",
    displayName: "OpenAI Deep Research",
    kind: "provider",
    roles: ["research_discovery"],
    mayTriggerExternalCost: true,
    requiresExplicitApproval: true,
    reviewFirstOnly: true,
    notes: [
      "Optionaler Premium-Research-Pfad.",
      "Getrennt vom normalen OpenAI-Analyze-Provider und nie automatisch.",
    ],
  },
] as const;

export const AI_V2_LANE_POLICIES: readonly AiLanePolicy[] = [
  {
    lane: "standard",
    label: "Standard-Analyse",
    description: "Normale Analyse- und Draft-Pfade ohne Premium-Recherche.",
    allowedActors: ["system_graph", "policy_orchestrator", "validator", "openai", "anthropic", "mistral", "gemini"],
    maxLatencyHintMs: 12000,
    budgetHint: "standard",
    researchAllowed: false,
    costApprovalRequired: false,
    reviewRequired: true,
    sealEligible: false,
    publicOutputAllowed: false,
    draftOnly: true,
  },
  {
    lane: "material_extraction",
    label: "Material-Extraktion",
    description: "Text-/Transkript-Extraktion für Material Intake, nur als Draft und Review-Hinweis.",
    allowedActors: ["system_graph", "policy_orchestrator", "validator", "mistral", "anthropic", "gemini"],
    maxLatencyHintMs: 16000,
    budgetHint: "standard",
    researchAllowed: false,
    costApprovalRequired: false,
    reviewRequired: true,
    sealEligible: false,
    publicOutputAllowed: false,
    draftOnly: true,
  },
  {
    lane: "feed_signal",
    label: "Feed-Signal",
    description: "Strukturiert Feed- und Quellen-Signale für Review, ohne Veröffentlichung oder DeepSearch.",
    allowedActors: ["system_graph", "policy_orchestrator", "validator", "openai", "anthropic", "mistral"],
    maxLatencyHintMs: 10000,
    budgetHint: "tiny",
    researchAllowed: false,
    costApprovalRequired: false,
    reviewRequired: true,
    sealEligible: false,
    publicOutputAllowed: false,
    draftOnly: true,
  },
  {
    lane: "themenradar_cluster",
    label: "Themenradar-Cluster",
    description: "Bündelt Claims, Fragen und Optionen zu Review-Kandidaten für das Themenradar.",
    allowedActors: ["system_graph", "policy_orchestrator", "validator", "openai", "anthropic", "mistral", "gemini"],
    maxLatencyHintMs: 12000,
    budgetHint: "standard",
    researchAllowed: false,
    costApprovalRequired: false,
    reviewRequired: true,
    sealEligible: false,
    publicOutputAllowed: false,
    draftOnly: true,
  },
  {
    lane: "sealed_factcheck",
    label: "Versiegelter Faktencheck",
    description: "Expliziter Review-/Research-Pfad für späteres Siegeln, nie automatisch.",
    allowedActors: [
      "system_graph",
      "policy_orchestrator",
      "validator",
      "openai",
      "anthropic",
      "mistral",
      "gemini",
      "perplexity",
      "ari",
      "openai_deep_research",
    ],
    maxLatencyHintMs: 30000,
    budgetHint: "elevated",
    researchAllowed: true,
    costApprovalRequired: true,
    reviewRequired: true,
    sealEligible: true,
    publicOutputAllowed: false,
    draftOnly: true,
  },
  {
    lane: "research_addon",
    label: "Research-Add-on",
    description: "Bewusst freigegebener Zusatzpfad für Recherche, Berichte und Discovery.",
    allowedActors: [
      "system_graph",
      "policy_orchestrator",
      "validator",
      "perplexity",
      "ari",
      "openai_deep_research",
      "anthropic",
      "gemini",
    ],
    maxLatencyHintMs: 45000,
    budgetHint: "premium",
    researchAllowed: true,
    costApprovalRequired: true,
    reviewRequired: true,
    sealEligible: false,
    publicOutputAllowed: false,
    draftOnly: true,
  },
  {
    lane: "fallback_only",
    label: "Fallback-only",
    description: "Nur Diagnose-/Fallback-Pfad ohne zusätzlichen Research- oder Veröffentlichungsanspruch.",
    allowedActors: ["system_graph", "policy_orchestrator", "validator", "mistral", "anthropic", "openai"],
    maxLatencyHintMs: 8000,
    budgetHint: "tiny",
    researchAllowed: false,
    costApprovalRequired: false,
    reviewRequired: true,
    sealEligible: false,
    publicOutputAllowed: false,
    draftOnly: true,
  },
] as const;

export function listAiExecutionActors(): readonly AiExecutionActorContract[] {
  return AI_EXECUTION_ACTORS;
}

export function getAiExecutionActor(actorId: AiExecutionActorId): AiExecutionActorContract {
  const actor = AI_EXECUTION_ACTORS.find((entry) => entry.actorId === actorId);
  if (!actor) throw new Error(`unknown_ai_execution_actor:${actorId}`);
  return actor;
}

export function getAiLanePolicy(lane: AiV2Lane): AiLanePolicy {
  const policy = AI_V2_LANE_POLICIES.find((entry) => entry.lane === lane);
  if (!policy) throw new Error(`unknown_ai_lane:${lane}`);
  return policy;
}

export function mapLegacyLaneToAiV2Lane(
  lane:
    | "fast_draft"
    | "standard_analyze"
    | "material_grounding"
    | "dossier_enrichment"
    | "sealed_factcheck"
    | "premium_deep_research",
): AiV2Lane {
  switch (lane) {
    case "fast_draft":
      return "fallback_only";
    case "material_grounding":
      return "material_extraction";
    case "sealed_factcheck":
      return "sealed_factcheck";
    case "premium_deep_research":
      return "research_addon";
    case "dossier_enrichment":
      return "standard";
    case "standard_analyze":
    default:
      return "standard";
  }
}

export function resolveAiFlowLane(flow: AiFlowId): AiV2Lane {
  switch (flow) {
    case "material_extraction":
      return "material_extraction";
    case "feed_signal":
      return "feed_signal";
    case "themenradar":
      return "themenradar_cluster";
    case "sealed_factcheck":
      return "sealed_factcheck";
    case "standard_analyze":
      return "standard";
    case "dossier_update":
    default:
      return "standard";
  }
}

export function resolveAiSmokeStatusCopy(input: {
  status: "ok" | "skipped" | "failed" | "degraded" | "config_missing";
  journeyDecision?:
    | "selected"
    | "skipped"
    | "fallback_not_needed"
    | "not_in_plan"
    | "disabled"
    | "config_missing";
  errorKind?: string | null;
  providerErrorCode?: string | null;
  finalContractStatus?: "strict_ok" | "built_valid" | "repaired_degraded" | "failed" | "blocked" | "not_started";
}): AiSmokeStatusCopy {
  if (input.status === "ok" && input.finalContractStatus === "strict_ok") {
    return {
      code: "ok",
      label: "OK",
      description: "Provider und Contract liefen wie erwartet.",
    };
  }
  if (input.journeyDecision === "fallback_not_needed") {
    return {
      code: "skipped_not_needed",
      label: "Übersprungen, nicht nötig",
      description: "Der Provider wurde bewusst nicht gebraucht, weil der primäre Pfad gereicht hat.",
    };
  }
  if (input.journeyDecision === "not_in_plan") {
    return {
      code: "skipped_not_in_lane",
      label: "Übersprungen, nicht in dieser Lane",
      description: "Der Provider gehört bewusst nicht zu diesem Lane-/Journey-Pfad.",
    };
  }
  if (input.status === "config_missing" || input.journeyDecision === "config_missing") {
    return {
      code: "missing_secret",
      label: "Konfiguration fehlt",
      description: "Secrets oder ENV-Konfiguration fehlen; der Pfad wurde nicht gestartet.",
    };
  }
  if (input.providerErrorCode === "PAYMENT_REQUIRED" || input.providerErrorCode === "CONFIG_MISSING_COST_APPROVAL") {
    return {
      code: "cost_blocked",
      label: "Kostenpfad blockiert",
      description: "Der Lane-Pfad braucht eine bewusste Freigabe oder ein gültiges Kosten-/Credit-Gate.",
    };
  }
  if (input.errorKind === "TIMEOUT") {
    return {
      code: "timeout",
      label: "Timeout",
      description: "Der Provider hat nicht rechtzeitig geantwortet.",
    };
  }
  if (input.finalContractStatus === "repaired_degraded" || input.status === "degraded") {
    return {
      code: "degraded",
      label: "Degradiert",
      description: "Ein Ergebnis war nutzbar, aber nur mit degradierter Contract-Qualität.",
    };
  }
  if (input.finalContractStatus === "built_valid") {
    return {
      code: "fallback_used",
      label: "Fallback genutzt",
      description: "Der strikte Pfad war nicht sauber, aber ein kontrollierter Fallback blieb nutzbar.",
    };
  }
  if (input.errorKind === "BAD_JSON" || input.providerErrorCode === "SCHEMA_INVALID") {
    return {
      code: "schema_failed",
      label: "Schema fehlgeschlagen",
      description: "Der Provider antwortete, aber der JSON-/Schema-Contract hielt nicht.",
    };
  }
  if (input.status === "failed" || input.finalContractStatus === "failed" || input.finalContractStatus === "blocked") {
    return {
      code: "failed",
      label: "Fehlgeschlagen",
      description: "Der Lauf konnte nicht nutzbar abgeschlossen werden und braucht Prüfung.",
    };
  }
  return {
    code: "ok",
    label: "OK",
    description: "Kein zusätzlicher Handlungsbedarf erkannt.",
  };
}

export function resolveAiQualityGate(input: {
  lane: AiV2Lane;
  schemaValid: boolean;
  safeEnough: boolean;
  blocked?: boolean;
  factcheckRequired?: boolean;
  reviewRequired?: boolean;
  publicOutputAllowed?: boolean;
}): AiQualityGateSummary {
  const lanePolicy = getAiLanePolicy(input.lane);
  const blocked = input.blocked === true || !input.safeEnough;
  const factcheckRequired = input.factcheckRequired === true || lanePolicy.sealEligible;
  const reviewRequired = input.reviewRequired ?? lanePolicy.reviewRequired;
  const publicOutputAllowed = input.publicOutputAllowed ?? lanePolicy.publicOutputAllowed;
  const schemaValid = input.schemaValid;
  const safeEnough = input.safeEnough;

  let decision: AiQualityGateDecision = "ready_for_review";
  let label = "Bereit für Review";
  let description = "Output bleibt review-first und kann in den bestehenden Prüfpfad gehen.";

  if (blocked) {
    decision = "blocked";
    label = "Blockiert";
    description = "Output darf nicht weiterlaufen, bis Safety-, Contract- oder Kostenprobleme geklärt sind.";
  } else if (factcheckRequired) {
    decision = "factcheck_required";
    label = "Faktencheck nötig";
    description = "Vor jedem Siegel oder Wahrheitsanspruch ist ein expliziter Faktencheck nötig.";
  } else if (reviewRequired && !publicOutputAllowed) {
    decision = "draft_only";
    label = "Nur Draft";
    description = "Output darf nur als Draft, Hinweis oder Vorschlag in Prüfung weiterlaufen.";
  } else if (reviewRequired) {
    decision = "review_required";
    label = "Review nötig";
    description = "Output kann vorbereitet werden, bleibt aber bis zur Prüfung nicht öffentlich.";
  }

  return {
    schemaValid,
    safeEnough,
    reviewRequired,
    factcheckRequired,
    blocked,
    draftOnly: decision === "draft_only",
    readyForReview: decision === "ready_for_review" || decision === "review_required",
    decision,
    label,
    description,
  };
}

export function resolveAiFlowIntegration(flow: AiFlowId): AiFlowIntegrationSummary {
  const lane = resolveAiFlowLane(flow);
  const policy = getAiLanePolicy(lane);
  const qualityGate = resolveAiQualityGate({
    lane,
    schemaValid: true,
    safeEnough: true,
    factcheckRequired: flow === "sealed_factcheck",
  });

  let nextSuggestedAction = "Review-Queue öffnen";
  let outputLabel = "Nur als Draft in Prüfung";

  if (flow === "themenradar") {
    nextSuggestedAction = "Themenradar-Cluster prüfen";
    outputLabel = "Claims, Fragen und Optionen bleiben Themenvorschläge in Prüfung.";
  } else if (flow === "feed_signal") {
    nextSuggestedAction = "Feed-Signale prüfen";
    outputLabel = "Feed-Signale werden strukturiert, aber nicht automatisch veröffentlicht.";
  } else if (flow === "material_extraction") {
    nextSuggestedAction = "Extraktionsjob prüfen";
    outputLabel = "Extraktion erzeugt nur Hinweise, Drafts und Review-Kandidaten.";
  } else if (flow === "dossier_update") {
    nextSuggestedAction = "Dossier-Vorschlag prüfen";
    outputLabel = "Dossier-Updates bleiben Vorschläge in Prüfung und werden nicht live angewendet.";
  } else if (flow === "sealed_factcheck") {
    nextSuggestedAction = "Faktencheck und Siegelpfad bewusst prüfen";
    outputLabel = "Ein Siegel ist nie automatisch; der Pfad bleibt review- und research-gated.";
  }

  return {
    flow,
    lane,
    laneLabel: policy.label,
    reviewRequired: qualityGate.reviewRequired,
    draftOnly: qualityGate.draftOnly,
    publicOutputAllowed: policy.publicOutputAllowed,
    factcheckRequired: qualityGate.factcheckRequired,
    researchAllowed: policy.researchAllowed,
    costApprovalRequired: policy.costApprovalRequired,
    sealEligible: policy.sealEligible,
    nextSuggestedAction,
    outputLabel,
  };
}
