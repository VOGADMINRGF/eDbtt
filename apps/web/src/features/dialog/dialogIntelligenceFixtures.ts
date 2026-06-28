import type { CreateIntelligentFollowupResult } from "@/features/create/intelligentFollowupContract";
import type {
  DialogArgument,
  DialogBranch,
  DialogHandoffTarget,
  DialogOutcome,
  DialogPerspective,
} from "@/features/dialog/dialogIntelligenceContract";

// Preview- und Test-Fixtures. Sie duerfen nicht als produktive
// Dialoganalyse oder persistierter Nutzerstand gelesen werden.
export const DIALOG_INTELLIGENCE_PREVIEW_FIXTURES = {
  countOnlyOpinion: {
    id: "dialog-preview-fixture-count-only",
    topicTitle: "Verkehr vor Schulen",
    engagementMode: "count_only",
    userOpenness: "low",
    recognizedStandpoint: {
      summary: "Der Beitrag möchte vor Schulen zuerst sichere Querungen und klarere Regeln sehen.",
      confidence: "medium",
      confirmedByUser: false,
      userCorrection: null,
    },
    arguments: [],
    perspectives: [],
    branches: [],
    openQuestions: [],
    resultStatus: "needs_user_confirmation",
    handoffTargets: ["count_opinion", "editorial_review"],
  } satisfies DialogOutcome,
  clarifyStandpoint: {
    id: "dialog-preview-fixture-clarify",
    topicTitle: "Kommunale Beteiligung",
    engagementMode: "clarify_standpoint",
    userOpenness: "medium",
    recognizedStandpoint: {
      summary: "Der Beitrag fordert mehr Mitsprache, aber mit klaren Schutzregeln und nachvollziehbaren Zuständigkeiten.",
      confidence: "medium",
      confirmedByUser: false,
      userCorrection: null,
    },
    arguments: [
      {
        id: "dialog-fixture-clarify-arg",
        claim: "Beteiligung soll verbindlicher werden, ohne Verfahren zu blockieren.",
        type: "value",
        source: "user",
        verificationStatus: "unverified_user_claim",
        linkedPerspectiveIds: ["dialog-fixture-clarify-perspective"],
      },
    ],
    perspectives: [
      {
        id: "dialog-fixture-clarify-perspective",
        label: "Institutionelle Sicht",
        summary: "Verwaltung und Politik brauchen klare Review-Schritte und keine stillen Automatismen.",
        relation: "institutional",
        isPresentedToUser: false,
        userResponse: null,
      },
    ],
    branches: [
      {
        id: "dialog-fixture-clarify-branch",
        title: "Pilotphase zuerst testen",
        reason: "Der Beitrag trennt Pilotversuche von einer späteren breiteren Einführung.",
        parentTopicId: "dialog-topic-beteiligung",
        status: "suggested",
      },
    ],
    openQuestions: [
      "Welche Schutzregel sollte zuerst verbindlich beschrieben werden?",
    ],
    resultStatus: "needs_user_confirmation",
    handoffTargets: [
      "count_opinion",
      "dossier_candidate",
      "anlassraum_candidate",
      "participation_space_candidate",
      "editorial_review",
    ],
  } satisfies DialogOutcome,
  reviewReadySourceBlocked: {
    id: "dialog-preview-fixture-review-ready-source-blocked",
    topicTitle: "Beteiligungsraum mit Quellenprüfung",
    engagementMode: "prepare_dossier_or_space",
    userOpenness: "high",
    recognizedStandpoint: {
      summary: "Der Beitrag will einen Beteiligungsraum vorbereiten, verweist aber auf noch unbelegte Wirkbehauptungen.",
      confidence: "high",
      confirmedByUser: true,
      userCorrection: null,
    },
    arguments: [
      {
        id: "dialog-fixture-review-ready-source-arg",
        claim: "Die vorgeschlagene Maßnahme werde sicher zu nachweisbaren Verbesserungen führen.",
        type: "evidence_needed",
        source: "system_prompted",
        verificationStatus: "needs_source",
        linkedPerspectiveIds: ["dialog-fixture-review-ready-source-perspective"],
      },
    ],
    perspectives: [
      {
        id: "dialog-fixture-review-ready-source-perspective",
        label: "Gegenperspektive aus der Verwaltung",
        summary: "Vor einer Übernahme in Dossier oder Raum müssen Wirkbehauptungen belegt werden.",
        relation: "opposing",
        isPresentedToUser: true,
        userResponse: null,
      },
    ],
    branches: [
      {
        id: "dialog-fixture-review-ready-source-branch",
        title: "Quellenlage separat klären",
        reason: "Die Debatte sollte einen eigenen Prüfzweig für belastbare Evidenz erhalten.",
        parentTopicId: "dialog-topic-participation-space",
        status: "parked",
      },
    ],
    openQuestions: [
      "Welche überprüfbaren Quellen belegen die erwartete Wirkung?",
    ],
    resultStatus: "review_ready",
    handoffTargets: [
      "count_opinion",
      "dossier_candidate",
      "anlassraum_candidate",
      "participation_space_candidate",
      "editorial_review",
      "factcheck_request",
    ],
  } satisfies DialogOutcome,
} as const;

function unique(values: readonly string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function hasLinkLikeText(value: string): boolean {
  return /https?:\/\//i.test(value);
}

function mapStatementToArgument(
  statement: CreateIntelligentFollowupResult["understanding"]["statements"][number],
): DialogArgument {
  const type =
    statement.kind === "argument"
      ? "counterargument"
      : statement.kind === "demand"
        ? "reform"
        : statement.kind === "question"
          ? "evidence_needed"
          : statement.kind === "objection"
            ? "risk"
            : statement.kind === "source"
              ? "evidence_needed"
              : statement.kind === "hint"
                ? "safeguard"
                : "value";

  const verificationStatus = statement.sourceExcerpt
    ? "reviewed"
    : statement.kind === "source"
      ? "needs_source"
      : "unverified_user_claim";

  return {
    id: `dialog-preview-argument-${statement.id}`,
    claim: statement.text,
    type,
    source: "user",
    verificationStatus,
    linkedPerspectiveIds: [],
  };
}

function buildPreviewPerspectives(
  result: CreateIntelligentFollowupResult,
): DialogPerspective[] {
  const perspectives: DialogPerspective[] = [];

  if (result.suggestions.some((suggestion) => suggestion.kind === "dossier")) {
    perspectives.push({
      id: "dialog-preview-perspective-institutional",
      label: "Institutionelle Anschlusslogik",
      summary: "Dieses Thema könnte später review-first an einen bestehenden Dossierpfad andocken.",
      relation: "institutional",
      isPresentedToUser: false,
      userResponse: null,
    });
  }

  if (result.understanding.topics.length > 1) {
    perspectives.push({
      id: "dialog-preview-perspective-adjacent",
      label: result.understanding.topics[1]?.label ?? "Benachbartes Thema",
      summary: "Neben dem Kernanliegen ist ein weiterer Themenaspekt erkennbar.",
      relation: "adjacent",
      isPresentedToUser: false,
      userResponse: null,
    });
  }

  return perspectives;
}

function buildPreviewBranches(
  result: CreateIntelligentFollowupResult,
): DialogBranch[] {
  return result.understanding.topics.slice(1, 3).map((topic, index) => ({
    id: `dialog-preview-branch-${topic.id}`,
    title: topic.label,
    reason:
      index === 0
        ? "Der Beitrag deutet einen weiteren Themenzweig an, der getrennt vertieft werden könnte."
        : "Ein zusätzlicher Themenzweig bleibt als spätere Vertiefung geparkt.",
    parentTopicId: result.understanding.topics[0]?.id ?? null,
    status: index === 0 ? "suggested" : "parked",
  }));
}

export function buildDialogOutcomePreviewFromCreateFollowup(input: {
  result: CreateIntelligentFollowupResult;
  isConfirmed?: boolean;
}): DialogOutcome {
  const { result, isConfirmed = false } = input;
  const summary = result.understanding.summary.trim();
  const topicTitle =
    result.understanding.dossierContext?.trim() ||
    result.understanding.topics[0]?.label ||
    "Öffentliches Thema";
  const argumentsFromStatements = result.understanding.statements
    .slice(0, 3)
    .map(mapStatementToArgument);
  const needsSourceClaim =
    argumentsFromStatements.some(
      (argument) => argument.verificationStatus === "needs_source",
    ) || hasLinkLikeText(result.sourceText);

  const argumentsList = needsSourceClaim && argumentsFromStatements.length === 0
    ? [
        {
          id: "dialog-preview-needs-source",
          claim: "Zum Beitrag gehört mindestens ein Quell- oder Linkhinweis, der noch geprüft werden muss.",
          type: "evidence_needed",
          source: "system_prompted",
          verificationStatus: "needs_source",
          linkedPerspectiveIds: [],
        } satisfies DialogArgument,
      ]
    : argumentsFromStatements;

  const perspectives = buildPreviewPerspectives(result);
  const branches = buildPreviewBranches(result);
  const openQuestions = unique(
    [
      result.understanding.openQuestion ?? "",
      ...(result.meta?.planner?.plannerOpenQuestions ?? []),
      ...(result.meta?.planner?.openQuestions ?? []),
      needsSourceClaim ? "Welche überprüfbaren Quellen oder Belege fehlen noch?" : "",
    ].filter(Boolean),
  ).slice(0, 4);

  let engagementMode: DialogOutcome["engagementMode"] = "clarify_standpoint";
  if (
    result.suggestions.some(
      (suggestion) =>
        suggestion.kind === "dossier" ||
        suggestion.kind === "anlassraum" ||
        suggestion.kind === "new_anlassraum",
    )
  ) {
    engagementMode = "prepare_dossier_or_space";
  } else if (perspectives.length > 0 || branches.length > 0) {
    engagementMode = "explore_perspectives";
  } else if (!openQuestions.length && result.understanding.topics.length <= 1) {
    engagementMode = "count_only";
  }

  let userOpenness: DialogOutcome["userOpenness"] = "low";
  if (result.understanding.topics.length > 1 || openQuestions.length > 0) {
    userOpenness = "medium";
  }
  if (
    result.understanding.topics.length > 2 ||
    perspectives.length > 1 ||
    branches.length > 1
  ) {
    userOpenness = "high";
  }

  const handoffTargets: DialogHandoffTarget[] = [
    "count_opinion",
    "editorial_review",
  ];
  if (engagementMode !== "count_only") {
    handoffTargets.push(
      "dossier_candidate",
      "anlassraum_candidate",
      "participation_space_candidate",
    );
  }
  if (needsSourceClaim) {
    handoffTargets.push("factcheck_request");
  }

  return {
    id: `dialog-preview-${topicTitle.toLowerCase().replace(/\s+/g, "-")}`,
    topicTitle,
    engagementMode,
    userOpenness,
    recognizedStandpoint: {
      summary,
      confidence:
        result.understanding.confidence === "high" ? "high" : "medium",
      confirmedByUser: isConfirmed,
      userCorrection: null,
    },
    arguments: argumentsList,
    perspectives,
    branches,
    openQuestions,
    resultStatus: isConfirmed ? "confirmed_by_user" : "needs_user_confirmation",
    handoffTargets,
  };
}

export function getDialogOutcomePreviewFixture(
  key: keyof typeof DIALOG_INTELLIGENCE_PREVIEW_FIXTURES,
): DialogOutcome {
  return DIALOG_INTELLIGENCE_PREVIEW_FIXTURES[key];
}
