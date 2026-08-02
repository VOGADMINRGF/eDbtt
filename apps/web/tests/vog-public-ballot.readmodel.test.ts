import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findSet: vi.fn(),
  findVote: vi.fn(),
  aggregateVotes: vi.fn(),
}));

vi.mock("@core/db/triMongo", () => ({
  coreCol: async () => ({
    findOne: (...args: unknown[]) => mocks.findSet(...args),
  }),
}));

vi.mock("@/models/votes/Vote", () => ({
  VoteModel: async () => ({
    findOne: (...args: unknown[]) => mocks.findVote(...args),
    aggregate: (...args: unknown[]) => ({
      toArray: () => mocks.aggregateVotes(...args),
    }),
  }),
}));

import { getVogPublicBallotReadModel } from "@/features/vog/publicBallotReadModel";

function releasedSet(overrides: Record<string, unknown> = {}) {
  return {
    code: "VOGSET01",
    status: "active",
    questions: [
      {
        id: "question-1",
        options: ["yes", "no", "open"],
        publicAttribution: "hidden",
        allowAnonymousVoting: true,
        vogPublicBallot: {
          contractVersion: "vog-public-ballot-v1",
          publicRelease: true,
          publicVotingEnabled: true,
          accessMode: "public_guest",
          attributionMode: "hidden",
          legitimacyClass: "open_public_consultation",
          status: "open",
          originId: "vog-question-01",
          originalLocale: "de",
          resultsVisibility: "after_vote",
          startsAt: new Date("2026-08-01T00:00:00.000Z"),
          closesAt: new Date("2026-09-01T00:00:00.000Z"),
          localized: {
            de: {
              title: "Soll diese Option priorisiert werden?",
              context: "Kurzer Kontext zur konkreten Frage.",
              optionLabels: ["Ja", "Nein", "Noch offen"],
            },
            en: {
              title: "Should this option be prioritised?",
              context: "Brief context for the concrete question.",
              optionLabels: ["Yes", "No", "Still open"],
            },
          },
          sources: [
            {
              id: "source-1",
              label: { de: "Quelle", en: "Source" },
              href: "https://example.org/source",
            },
          ],
          counterPositions: [
            {
              id: "counter-1",
              label: { de: "Gegenposition", en: "Counterposition" },
              href: "https://example.org/counter",
            },
          ],
        },
      },
    ],
    ...overrides,
  };
}

describe("VOG public ballot readmodel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findSet.mockResolvedValue(releasedSet());
    mocks.findVote.mockResolvedValue(null);
    mocks.aggregateVotes.mockResolvedValue([]);
  });

  it("does not expose an ordinary anonymous QR question as a public VOG ballot", async () => {
    const set = releasedSet();
    delete (set.questions[0] as Record<string, unknown>).vogPublicBallot;
    mocks.findSet.mockResolvedValue(set);

    await expect(
      getVogPublicBallotReadModel({
        code: "VOGSET01",
        questionId: "question-1",
        locale: "de",
      }),
    ).resolves.toBeNull();
    expect(mocks.findVote).not.toHaveBeenCalled();
  });

  it("renders DE/EN from one canonical question while preserving canonical choices", async () => {
    const ballot = await getVogPublicBallotReadModel({
      code: "VOGSET01",
      questionId: "question-1",
      locale: "en",
      now: new Date("2026-08-02T00:00:00.000Z"),
    });

    expect(ballot).toMatchObject({
      locale: "en",
      originalLocale: "de",
      lifecycle: "open",
      title: "Should this option be prioritised?",
      accessMode: "public_guest",
      attributionMode: "hidden",
      legitimacyClass: "open_public_consultation",
      ownSelection: null,
      results: null,
      options: [
        { canonicalChoice: "yes", label: "Yes" },
        { canonicalChoice: "no", label: "No" },
        { canonicalChoice: "open", label: "Still open" },
      ],
    });
  });

  it("projects guest and verified-member legitimacy classes separately after a guest vote", async () => {
    mocks.findVote.mockResolvedValue({ choice: "yes" });
    mocks.aggregateVotes.mockResolvedValue([
      {
        _id: {
          participationClass: "open_guest",
          choice: "yes",
          source: "vote4gov",
        },
        count: 3,
      },
      {
        _id: {
          participationClass: "open_guest",
          choice: "no",
          source: "direct",
        },
        count: 1,
      },
      {
        _id: {
          participationClass: "verified_vog_member",
          choice: "no",
          source: "voiceopengov",
        },
        count: 2,
      },
      {
        _id: {
          participationClass: "legacy_or_unknown",
          choice: "yes",
          source: "vote4gov",
        },
        count: 999,
      },
    ]);

    const ballot = await getVogPublicBallotReadModel({
      code: "VOGSET01",
      questionId: "question-1",
      locale: "de",
      guestTokenHash: "a".repeat(64),
      now: new Date("2026-08-02T00:00:00.000Z"),
    });

    expect(ballot).toMatchObject({
      ownSelection: "yes",
      ownSelectionLabel: "Ja",
      results: {
        totalVotes: 6,
        openGuestVotes: 4,
        verifiedMemberVotes: 2,
        resultStatus: "public_consultation",
        optionCounts: [
          { canonicalChoice: "yes", label: "Ja", count: 3 },
          { canonicalChoice: "no", label: "Nein", count: 3 },
          { canonicalChoice: "open", label: "Noch offen", count: 0 },
        ],
      },
    });
    expect(mocks.findVote).toHaveBeenCalledWith(
      expect.objectContaining({
        participationClass: "open_guest",
        sessionId: "a".repeat(64),
      }),
    );
  });

  it("shows a scheduled or closed read-only state without opening voting", async () => {
    const scheduled = await getVogPublicBallotReadModel({
      code: "VOGSET01",
      questionId: "question-1",
      locale: "de",
      now: new Date("2026-07-01T00:00:00.000Z"),
    });
    expect(scheduled?.lifecycle).toBe("scheduled");

    mocks.findSet.mockResolvedValue(releasedSet({ status: "closed" }));
    const closed = await getVogPublicBallotReadModel({
      code: "VOGSET01",
      questionId: "question-1",
      locale: "de",
      now: new Date("2026-08-02T00:00:00.000Z"),
    });
    expect(closed?.lifecycle).toBe("closed");
  });
});
