import {
  evaluateCreateInputSafety,
  type CreateInputSafetyFindingKind,
} from "@/features/create/safety/createInputSafety";

export type PublicQuestionGeneralizationOutcome =
  | "already_generalized"
  | "generalized_from_named_actor"
  | "actor_context_retained"
  | "entity_specific_procedure_review_required"
  | "personal_targeting_blocked"
  | "accusation_or_character_judgment_blocked"
  | "fact_or_truth_question_blocked"
  | "actor_context_evidence_review_required"
  | "named_actor_targeting_review_required";

export type PublicQuestionActorType =
  | "person"
  | "company"
  | "party"
  | "organization"
  | "public_body"
  | "media"
  | "other";

export type PublicQuestionActorRole =
  | "source"
  | "initiator"
  | "affected_party"
  | "competent_authority"
  | "position_holder"
  | "documented_case"
  | "procedure_subject"
  | "context"
  | "target";

export type PublicQuestionActorContext = {
  id: string;
  name: string;
  type: PublicQuestionActorType;
  role: PublicQuestionActorRole;
  evidenceRefs: string[];
};

export type PublicQuestionProcedureContext = {
  kind:
    | "permit"
    | "procurement"
    | "merger"
    | "statute"
    | "parliamentary_procedure"
    | "administrative_procedure"
    | "other";
  entityBindingNecessary: boolean;
  evidenceRefs: string[];
};

export type PublicQuestionReleaseState = "draft_allowed" | "review_required" | "blocked";

export type PublicQuestionGeneralizationResult = {
  originalInput: string;
  publicQuestion: string | null;
  outcome: PublicQuestionGeneralizationOutcome;
  releaseState: PublicQuestionReleaseState;
  actorContexts: PublicQuestionActorContext[];
  findingKinds: CreateInputSafetyFindingKind[];
  reasons: string[];
  explanation: string;
  requiresHumanReview: boolean;
  noAutoPublish: true;
  noPositionInference: true;
  noBiasOrTrustInference: true;
};

export type EvaluatePublicQuestionGeneralizationInput = {
  originalInput: string;
  candidatePublicQuestion?: string | null;
  actorContexts: PublicQuestionActorContext[];
  procedure?: PublicQuestionProcedureContext | null;
  locale?: string | null;
  sourceLanguage?: string | null;
  contentLanguage?: string | null;
};

const FACT_OR_TRUTH_QUESTION_RE =
  /^(?:stimmt\s+es|stimmt|trifft\s+es\s+zu|ist\s+es\s+(?:wahr|richtig)|is\s+it\s+true|is\s+the\s+claim\s+correct|did|does|do)\b.*\?$/iu;
const DECISION_QUESTION_RE =
  /\b(soll(?:te|ten)?|muss|müssen|darf|dürfen|welche\s+(?:regel|regeln|maßnahme|maßnahmen|option|optionen|priorität|prioritäten)|unter\s+welchen\s+voraussetzungen|bis\s+zu\s+welchem|should|must|may|which\s+(?:rule|rules|measure|measures|option|options|priority|priorities)|under\s+which\s+conditions)\b/iu;
const NORMATIVE_EVALUATION_QUESTION_RE =
  /^(?:ist|sind|is|are)\b.*\b(sinnvoll|gerecht|vertretbar|angemessen|wünschenswert|wuenschenswert|fair|reasonable|appropriate|desirable)\s*\?$/iu;
const CHARACTER_OR_SANCTION_RE =
  /\b(schuldig\w*|schuld|charakter|ehrlich\w*|unehrlich\w*|vertrauenswürdig\w*|unvertrauenswürdig\w*|beliebt\w*|unbeliebt\w*|zurücktreten|zuruecktreten|bestraft\w*|boykott\w*|ausschließ\w*|ausschliess\w*|ausgeschlossen|kündig\w*|kuendig\w*|guilty|character|honest|dishonest|trustworthy|resign|punish\w*|boycott\w*|exclude\w*|fire)\b/iu;

const ACCUSATION_FINDINGS = new Set<CreateInputSafetyFindingKind>([
  "insult_public_actor",
  "insult_private_person",
  "unsupported_allegation",
  "corruption_or_capture_claim",
  "source_bluffing",
]);

function cleanText(value: string | null | undefined): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalized(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("de-DE")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesActorName(question: string, actor: PublicQuestionActorContext): boolean {
  const questionKey = normalized(question);
  const actorKey = normalized(actor.name);
  return actorKey.length > 1 && (` ${questionKey} `).includes(` ${actorKey} `);
}

function isFactOrTruthQuestion(question: string): boolean {
  return FACT_OR_TRUTH_QUESTION_RE.test(cleanText(question));
}

function isDecisionQuestion(question: string): boolean {
  const value = cleanText(question);
  return (
    value.endsWith("?") &&
    (DECISION_QUESTION_RE.test(value) || NORMATIVE_EVALUATION_QUESTION_RE.test(value)) &&
    !isFactOrTruthQuestion(value)
  );
}

function result(
  input: EvaluatePublicQuestionGeneralizationInput,
  params: {
    outcome: PublicQuestionGeneralizationOutcome;
    releaseState: PublicQuestionReleaseState;
    publicQuestion: string | null;
    findingKinds: CreateInputSafetyFindingKind[];
    reasons: string[];
    explanation: string;
  },
): PublicQuestionGeneralizationResult {
  return {
    originalInput: String(input.originalInput ?? ""),
    publicQuestion: params.publicQuestion,
    outcome: params.outcome,
    releaseState: params.releaseState,
    actorContexts: input.actorContexts.map((actor) => ({
      ...actor,
      id: cleanText(actor.id),
      name: cleanText(actor.name),
      evidenceRefs: actor.evidenceRefs.map(cleanText).filter(Boolean),
    })),
    findingKinds: params.findingKinds,
    reasons: params.reasons,
    explanation: params.explanation,
    requiresHumanReview: params.releaseState !== "draft_allowed",
    noAutoPublish: true,
    noPositionInference: true,
    noBiasOrTrustInference: true,
  };
}

/**
 * Guard contract shared by Create/Voxy and every public QuestionDraft producer.
 * Entity recognition remains an upstream concern: this boundary evaluates the
 * explicit actor role and evidence instead of guessing identities from a name
 * blacklist. It returns a draft decision only and can never publish content.
 */
export function evaluatePublicQuestionGeneralization(
  input: EvaluatePublicQuestionGeneralizationInput,
): PublicQuestionGeneralizationResult {
  const originalInput = cleanText(input.originalInput);
  const candidatePublicQuestion = cleanText(input.candidatePublicQuestion ?? originalInput);
  const safety = evaluateCreateInputSafety({
    text: originalInput,
    locale: input.locale,
    sourceLanguage: input.sourceLanguage,
    contentLanguage: input.contentLanguage,
    routeStage: "analyze",
  });
  const candidateSafety = evaluateCreateInputSafety({
    text: candidatePublicQuestion,
    locale: input.locale,
    sourceLanguage: input.sourceLanguage,
    contentLanguage: input.contentLanguage,
    routeStage: "analyze",
  });
  const findingKinds = Array.from(
    new Set([...safety.findings, ...candidateSafety.findings].map((finding) => finding.kind)),
  );
  const targetActors = input.actorContexts.filter((actor) => actor.role === "target");
  const procedureActors = input.actorContexts.filter((actor) => actor.role === "procedure_subject");
  const namedActorsInInput = input.actorContexts.filter(
    (actor) => includesActorName(originalInput, actor) || includesActorName(candidatePublicQuestion, actor),
  );
  const candidateStillTargetsNamedActor = targetActors.some((actor) =>
    includesActorName(candidatePublicQuestion, actor),
  );
  const hasAccusationOrCharacterJudgment =
    findingKinds.some((kind) => ACCUSATION_FINDINGS.has(kind)) ||
    CHARACTER_OR_SANCTION_RE.test(originalInput) ||
    CHARACTER_OR_SANCTION_RE.test(candidatePublicQuestion);

  if (isFactOrTruthQuestion(candidatePublicQuestion)) {
    return result(input, {
      outcome: "fact_or_truth_question_blocked",
      releaseState: "blocked",
      publicQuestion: null,
      findingKinds,
      reasons: ["facts_and_truth_are_not_preference_ballots"],
      explanation: "Fakten- und Wahrheitsfragen werden nicht als öffentliche Präferenzabstimmung erzeugt.",
    });
  }

  if (
    input.actorContexts.some(
      (actor) => actor.evidenceRefs.map(cleanText).filter(Boolean).length === 0,
    )
  ) {
    return result(input, {
      outcome: "actor_context_evidence_review_required",
      releaseState: "review_required",
      publicQuestion: null,
      findingKinds,
      reasons: ["named_actor_context_requires_evidence"],
      explanation: "Eine Akteursnennung benötigt einen belegten Kontext, bevor ein öffentlicher Entwurf entstehen kann.",
    });
  }

  const procedure = input.procedure;
  if (
    procedure?.entityBindingNecessary === true &&
    procedure.evidenceRefs.some((ref) => cleanText(ref).length > 0) &&
    procedureActors.length > 0 &&
    isDecisionQuestion(candidatePublicQuestion) &&
    !hasAccusationOrCharacterJudgment &&
    candidateSafety.decision !== "blocked" &&
    candidateSafety.decision !== "moderation_required"
  ) {
    return result(input, {
      outcome: "entity_specific_procedure_review_required",
      releaseState: "review_required",
      publicQuestion: candidatePublicQuestion,
      findingKinds,
      reasons: ["entity_binding_is_procedure_specific", "human_review_before_public_release"],
      explanation: "Die Akteursbindung ist verfahrensbezogen und muss vor einer öffentlichen Freigabe geprüft werden.",
    });
  }

  const hasValidGeneralization =
    targetActors.length > 0 &&
    normalized(candidatePublicQuestion) !== normalized(originalInput) &&
    !candidateStillTargetsNamedActor &&
    isDecisionQuestion(candidatePublicQuestion) &&
    candidateSafety.decision !== "blocked" &&
    candidateSafety.decision !== "moderation_required" &&
    candidateSafety.decision !== "factcheck_required" &&
    !CHARACTER_OR_SANCTION_RE.test(candidatePublicQuestion);

  if (hasValidGeneralization) {
    return result(input, {
      outcome: "generalized_from_named_actor",
      releaseState: "draft_allowed",
      publicQuestion: candidatePublicQuestion,
      findingKinds,
      reasons: ["named_actor_removed_from_ballot_target", "general_rule_or_measure_retained"],
      explanation:
        "Ich habe die Frage auf die allgemeine Regel dahinter formuliert, damit nicht ein einzelner Akteur zum Abstimmungsziel wird.",
    });
  }

  if (namedActorsInInput.length > 0 && hasAccusationOrCharacterJudgment) {
    return result(input, {
      outcome: "accusation_or_character_judgment_blocked",
      releaseState: "blocked",
      publicQuestion: null,
      findingKinds,
      reasons: ["accusation_character_or_sanction_targets_named_actor"],
      explanation: "Anschuldigungen, Charakterurteile und Sanktionen gegen benannte Akteure werden nicht als öffentliche Abstimmung erzeugt.",
    });
  }

  if (targetActors.some((actor) => actor.type === "person")) {
    return result(input, {
      outcome: "personal_targeting_blocked",
      releaseState: "blocked",
      publicQuestion: null,
      findingKinds,
      reasons: ["person_is_ballot_target"],
      explanation: "Eine Person darf nicht Ziel einer normalen öffentlichen Abstimmung sein.",
    });
  }

  if (targetActors.length > 0) {
    return result(input, {
      outcome: "named_actor_targeting_review_required",
      releaseState: "review_required",
      publicQuestion: null,
      findingKinds,
      reasons: ["named_actor_remains_ballot_target", "generalization_missing_or_invalid"],
      explanation: "Vor einem öffentlichen Entwurf ist eine sachliche Generalisierung erforderlich.",
    });
  }

  if (input.actorContexts.length > 0) {
    return result(input, {
      outcome: "actor_context_retained",
      releaseState: "draft_allowed",
      publicQuestion: candidatePublicQuestion,
      findingKinds,
      reasons: ["actor_is_context_not_ballot_target"],
      explanation: "Der Akteur bleibt als belegter Kontext erhalten und ist nicht das Abstimmungsziel.",
    });
  }

  if (!isDecisionQuestion(candidatePublicQuestion)) {
    return result(input, {
      outcome: "named_actor_targeting_review_required",
      releaseState: "review_required",
      publicQuestion: null,
      findingKinds,
      reasons: ["decision_question_missing_or_unclear"],
      explanation: "Die Eingabe benötigt eine überprüfbare Formulierung als Entscheidungsfrage.",
    });
  }

  return result(input, {
    outcome: "already_generalized",
    releaseState: "draft_allowed",
    publicQuestion: candidatePublicQuestion,
    findingKinds,
    reasons: ["general_rule_measure_or_priority_is_ballot_target"],
    explanation: "Die Frage richtet sich bereits auf eine allgemeine Regel, Maßnahme oder Priorität.",
  });
}
