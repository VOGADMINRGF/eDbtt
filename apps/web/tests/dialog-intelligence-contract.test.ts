import { describe, expect, it } from "vitest";

import {
  DIALOG_OUTCOME_GUARDRAILS,
  canCountOpinion,
  canPrepareAnlassraumCandidate,
  canPrepareDossierCandidate,
  getDialogHandoffCandidates,
  getDialogNextQuestions,
  getNewBranchSuggestions,
  getPerspectivePrompts,
  summarizeRecognizedStandpoint,
  type DialogOutcome,
} from "@/features/dialog/dialogIntelligenceContract";

function createOutcome(
  overrides: Partial<DialogOutcome> = {},
): DialogOutcome {
  return {
    id: "dialog-outcome-1",
    topicTitle: "Bürgerbeteiligung im Quartier",
    engagementMode: "clarify_standpoint",
    userOpenness: "medium",
    recognizedStandpoint: {
      summary: "Der Beitrag befürwortet mehr lokale Mitsprache mit klaren Schutzregeln.",
      confidence: "medium",
      confirmedByUser: false,
      userCorrection: null,
    },
    arguments: [],
    perspectives: [],
    branches: [],
    openQuestions: [],
    resultStatus: "needs_user_confirmation",
    handoffTargets: [
      "count_opinion",
      "dossier_candidate",
      "anlassraum_candidate",
      "participation_space_candidate",
      "editorial_review",
      "factcheck_request",
    ],
    ...overrides,
  };
}

describe("dialog intelligence result contract", () => {
  it("allows count-only opinion capture without forcing elaboration", () => {
    const outcome = createOutcome({
      engagementMode: "count_only",
      userOpenness: "low",
      resultStatus: "draft",
    });

    expect(canCountOpinion(outcome)).toBe(true);
    expect(getPerspectivePrompts(outcome)).toEqual([]);
    expect(getDialogNextQuestions(outcome)).toContain(
      "Trifft der erkannte Standpunkt deinen Beitrag?",
    );

    const candidates = getDialogHandoffCandidates(outcome);
    expect(
      candidates.find((candidate) => candidate.target === "count_opinion"),
    ).toMatchObject({
      eligible: true,
      requiresReview: true,
      autoCreate: false,
      autoPublish: false,
    });
  });

  it("creates follow-up questions and optional perspective prompts for medium and high openness", () => {
    const outcome = createOutcome({
      engagementMode: "explore_perspectives",
      userOpenness: "high",
      perspectives: [
        {
          id: "p-opposing",
          label: "Gegenperspektive aus der Verwaltung",
          summary: "Mehr Beteiligung darf den Entscheidungsprozess nicht blockieren.",
          relation: "opposing",
          isPresentedToUser: false,
          userResponse: null,
        },
      ],
    });

    expect(getDialogNextQuestions(outcome)).toContain(
      "Welche Rückfrage sollte eDebatte als Nächstes stellen?",
    );
    expect(getDialogNextQuestions(outcome)).toContain(
      "Möchtest du eine Gegenperspektive oder betroffene Sichtweise prüfen?",
    );
    expect(getPerspectivePrompts(outcome)).toEqual([
      {
        perspectiveId: "p-opposing",
        label: "Gegenperspektive aus der Verwaltung",
        relation: "opposing",
        prompt:
          "Möchtest du die Gegenperspektive Gegenperspektive aus der Verwaltung prüfen?",
        optional: true,
      },
    ]);
  });

  it("requires user confirmation before dossier or anlassraum candidates are prepared", () => {
    const outcome = createOutcome({
      engagementMode: "prepare_dossier_or_space",
      arguments: [
        {
          id: "arg-1",
          claim: "Mehr lokale Mitsprache stärkt die Legitimität.",
          type: "value",
          source: "user",
          verificationStatus: "unverified_user_claim",
          linkedPerspectiveIds: [],
        },
      ],
    });

    expect(canPrepareDossierCandidate(outcome)).toBe(false);
    expect(canPrepareAnlassraumCandidate(outcome)).toBe(false);

    const candidates = getDialogHandoffCandidates(outcome);
    expect(
      candidates.find((candidate) => candidate.target === "dossier_candidate")
        ?.blockedReasons,
    ).toContain("standpoint_confirmation_required");
    expect(
      candidates.find((candidate) => candidate.target === "anlassraum_candidate")
        ?.blockedReasons,
    ).toContain("standpoint_confirmation_required");
  });

  it("blocks direct result handoffs when fact claims still need sources", () => {
    const outcome = createOutcome({
      engagementMode: "prepare_dossier_or_space",
      resultStatus: "review_ready",
      recognizedStandpoint: {
        summary: "Der Beitrag behauptet belastbare Gesundheitsfolgen und fordert Reformen.",
        confidence: "high",
        confirmedByUser: true,
        userCorrection: null,
      },
      arguments: [
        {
          id: "arg-claim",
          claim: "Die Maßnahme führt sicher zu messbaren Gesundheitsgewinnen.",
          type: "evidence_needed",
          source: "user",
          verificationStatus: "needs_source",
          linkedPerspectiveIds: [],
        },
      ],
    });

    expect(canPrepareDossierCandidate(outcome)).toBe(false);
    expect(canPrepareAnlassraumCandidate(outcome)).toBe(false);
    expect(getDialogNextQuestions(outcome)).toContain(
      "Welche überprüfbaren Quellen oder Belege fehlen noch?",
    );

    const candidates = getDialogHandoffCandidates(outcome);
    expect(
      candidates.find((candidate) => candidate.target === "factcheck_request"),
    ).toMatchObject({
      eligible: true,
      requiresReview: true,
      autoCreate: false,
      autoPublish: false,
    });
  });

  it("models counter perspectives as an offer instead of a forced step", () => {
    const outcome = createOutcome({
      engagementMode: "explore_perspectives",
      userOpenness: "medium",
      perspectives: [
        {
          id: "p-affected",
          label: "Sicht einer betroffenen Nachbarschaft",
          summary: "Die Maßnahme bringt Vorteile, aber auch Lärm- und Verdrängungsrisiken.",
          relation: "affected_group",
          isPresentedToUser: true,
          userResponse: null,
        },
      ],
    });

    const prompts = getPerspectivePrompts(outcome);

    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toMatchObject({
      optional: true,
      relation: "affected_group",
      prompt: "Wie möchtest du auf Sicht einer betroffenen Nachbarschaft reagieren?",
    });
  });

  it("keeps new branches as suggested or parked instead of publishing them", () => {
    const outcome = createOutcome({
      userOpenness: "high",
      branches: [
        {
          id: "branch-1",
          title: "Regeln für Pilotphasen",
          reason: "Die Debatte trennt Pilotversuche von flächendeckender Einführung.",
          parentTopicId: "topic-1",
          status: "suggested",
        },
        {
          id: "branch-2",
          title: "Perspektive betroffener Einrichtungen",
          reason: "Weitere Betroffenengruppen sollen separat betrachtet werden.",
          parentTopicId: "topic-1",
          status: "parked",
        },
        {
          id: "branch-3",
          title: "Bereits review-bereiter Zweig",
          reason: "Wurde separat vorbereitet.",
          parentTopicId: "topic-1",
          status: "review_ready",
        },
      ],
    });

    expect(getNewBranchSuggestions(outcome)).toEqual([
      outcome.branches[0],
      outcome.branches[1],
    ]);
  });

  it("keeps dossier, anlassraum and participation-space handoffs as review-first candidates", () => {
    const outcome = createOutcome({
      engagementMode: "prepare_dossier_or_space",
      resultStatus: "review_ready",
      recognizedStandpoint: {
        summary: "Der Beitrag möchte einen strukturierten Beteiligungsraum mit klaren Leitplanken vorbereiten.",
        confidence: "high",
        confirmedByUser: true,
        userCorrection: "Bitte zuerst lokale Schutzregeln und offene Fragen sichtbar machen.",
      },
      arguments: [
        {
          id: "arg-1",
          claim: "Ein klarer Beteiligungsrahmen verbessert die Anschlussfähigkeit.",
          type: "reform",
          source: "system_prompted",
          verificationStatus: "reviewed",
          linkedPerspectiveIds: ["p-inst"],
        },
      ],
      perspectives: [
        {
          id: "p-inst",
          label: "Institutionelle Umsetzungslogik",
          summary: "Ein Beteiligungsraum braucht klare Regeln und Review-Kanten.",
          relation: "institutional",
          isPresentedToUser: true,
          userResponse: "interested",
        },
      ],
      openQuestions: ["Welche lokale Pilotregion ist zuerst sinnvoll?"],
    });

    expect(summarizeRecognizedStandpoint(outcome)).toBe(
      "Bitte zuerst lokale Schutzregeln und offene Fragen sichtbar machen.",
    );
    expect(canPrepareDossierCandidate(outcome)).toBe(true);
    expect(canPrepareAnlassraumCandidate(outcome)).toBe(true);

    const candidates = getDialogHandoffCandidates(outcome);
    for (const target of [
      "dossier_candidate",
      "anlassraum_candidate",
      "participation_space_candidate",
    ] as const) {
      expect(
        candidates.find((candidate) => candidate.target === target),
      ).toMatchObject({
        eligible: true,
        requiresReview: true,
        autoCreate: false,
        autoPublish: false,
      });
    }
  });

  it("keeps no helper path capable of auto-publish, auto-dossier, auto-anlassraum or auto-graph", () => {
    const outcome = createOutcome({
      engagementMode: "co_create_argumentation",
      resultStatus: "confirmed_by_user",
      recognizedStandpoint: {
        summary: "Der Beitrag will Argumente und Gegenargumente sichtbar machen.",
        confidence: "medium",
        confirmedByUser: true,
        userCorrection: null,
      },
      arguments: [
        {
          id: "arg-1",
          claim: "Mehr Transparenz hilft bei der Abwägung.",
          type: "safeguard",
          source: "editorial",
          verificationStatus: "reviewed",
          linkedPerspectiveIds: [],
        },
      ],
    });

    expect(DIALOG_OUTCOME_GUARDRAILS).toMatchObject({
      noAutoPublish: true,
      noAutoDossier: true,
      noAutoAnlassraum: true,
      noAutoGraph: true,
      noAutoFactAssertion: true,
    });

    expect(
      getDialogHandoffCandidates(outcome).every(
        (candidate) =>
          candidate.requiresReview &&
          candidate.autoCreate === false &&
          candidate.autoPublish === false,
      ),
    ).toBe(true);
  });
});
