import { describe, expect, it } from "vitest";
import {
  hydrateSocialReviewQueueItemsWithPersistedDecisions,
  mapSocialReviewQueueItems,
  type SocialReviewQueueReadModel,
} from "@features/anlassraum/socialReviewQueueReadModel";
import type { RundenEntryItem } from "@features/topicRound/entrySource";

function buildEntry(overrides: Partial<RundenEntryItem>): RundenEntryItem {
  return {
    id: "seed-1",
    anlassraumId: "65f000000000000000000111",
    isPublic: true,
    title: "Anlass",
    summary: "Zusammenfassung",
    topicKey: "energie",
    anlassraumType: "policy",
    sourceMode: "feed",
    anlassraumStatus: "active",
    outputStatus: "review",
    reviewState: "pending",
    publishTarget: "/round/anlass",
    intakeHref: "/create?mode=source&anlassraumId=65f000000000000000000111",
    operatingHref: "/round/anlass?anlassraumId=65f000000000000000000111",
    resultsHref: null,
    entryHref: "/round/anlass?anlassraumId=65f000000000000000000111",
    lifecycle: "active",
    finished: false,
    finishedAt: null,
    lastAction: null,
    lastActionBy: null,
    lastActionAt: null,
    createdAt: null,
    updatedAt: "2026-04-04T10:00:00.000Z",
    legacyIncomplete: false,
    sourceKind: "output_seed_with_anlassraum",
    shareActions: {
      contextKind: "runde",
      primaryTargetKind: "round_operating_target",
      canonicalTarget: "/round/anlass?anlassraumId=65f000000000000000000111",
      qrTarget: "/round/anlass?anlassraumId=65f000000000000000000111",
      shareTitle: "Anlass teilen",
      sharePrompt: "Prompt",
      shareSummary: "Summary",
      socialCandidate: true,
      needsReviewBeforeOfficialSocial: true,
      socialQualification: "qualified_context",
      factcheckSuggested: true,
      existingContextHint: "Bestehender Kontext vorhanden.",
    },
    relatedDossierHref: null,
    relatedTopicPageHref: null,
    relatedTopicPageTitle: null,
    relatedTopicPageVisibilityLabel: null,
    ...overrides,
  };
}

describe("social review queue readmodel", () => {
  it("maps only review-required social candidates with hints and statuses", () => {
    const candidates = mapSocialReviewQueueItems([
      buildEntry({ id: "seed-1" }),
      buildEntry({
        id: "seed-2",
        shareActions: {
          ...buildEntry({}).shareActions!,
          socialCandidate: false,
        },
      }),
      buildEntry({
        id: "seed-3",
        shareActions: {
          ...buildEntry({}).shareActions!,
          socialQualification: "review_ready_candidate",
          factcheckSuggested: false,
        },
      }),
    ]);

    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toMatchObject({
      id: "social-review:seed-1",
      baseStatus: "qualified_context",
      factcheckStatus: "factcheck_suggested",
      existingContextHint: "Bestehender Kontext vorhanden.",
    });
    expect(candidates[1]).toMatchObject({
      id: "social-review:seed-3",
      baseStatus: "review_required",
      factcheckStatus: "factcheck_optional",
    });
  });

  it("keeps empty queue state compatible with UI expectations", () => {
    const emptyModel: SocialReviewQueueReadModel = {
      generatedAt: "2026-04-04T11:00:00.000Z",
      totals: {
        candidates: 0,
        reviewRequired: 0,
        qualifiedContext: 0,
        factcheckSuggested: 0,
      },
      guardrails: {
        noAutoPostingDefault: true,
        noTruthPrivilege: true,
        noPriorityPrivilege: true,
        curatedOrQualifiedOfficialSocialOnly: true,
      },
      items: [],
    };

    expect(emptyModel.guardrails.noAutoPostingDefault).toBe(true);
    expect(emptyModel.items).toEqual([]);
  });

  it("hydrates persisted review decisions for reload/rehydrate", () => {
    const mapped = mapSocialReviewQueueItems([buildEntry({ id: "seed-1" })]);
    const hydrated = hydrateSocialReviewQueueItemsWithPersistedDecisions(
      mapped,
      new Map([
        [
          "seed-1",
          {
            entryId: "seed-1",
            decision: "held_back",
            note: "Kontext zuerst klären.",
            updatedAt: "2026-04-04T12:00:00.000Z",
            updatedByUserId: "user-1",
          },
        ],
      ]),
      new Map([
        [
          "seed-1",
          [
            {
              entryId: "seed-1",
              decision: "held_back",
              note: "Kontext zuerst klären.",
              updatedAt: "2026-04-04T12:00:00.000Z",
              updatedByUserId: "user-1",
            },
          ],
        ],
      ]),
    );

    expect(hydrated[0]).toMatchObject({
      persistedDecision: "held_back",
      persistedDecisionNote: "Kontext zuerst klären.",
      persistedDecisionUpdatedAt: "2026-04-04T12:00:00.000Z",
      decisionHistory: [
        {
          decision: "held_back",
        },
      ],
    });
  });
});
