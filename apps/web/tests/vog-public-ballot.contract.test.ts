import { describe, expect, it } from "vitest";
import {
  buildVogPublicBallotHref,
  normalizeVogOriginMetadata,
  resolveVogPublicBallotLifecycle,
  validateVogPublicBallotQuestion,
  VogPublicBallotReleaseSchema,
} from "@features/vog/publicBallotContract";

function release(overrides: Record<string, unknown> = {}) {
  return {
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
    startsAt: "2026-08-01T00:00:00.000Z",
    closesAt: "2026-09-01T00:00:00.000Z",
    localized: {
      de: {
        title: "Soll diese Option priorisiert werden?",
        context: "Kurzer belegter Kontext zur öffentlichen VOG-Frage.",
        optionLabels: ["Ja", "Nein", "Noch offen"],
      },
      en: {
        title: "Should this option be prioritised?",
        context: "Brief evidenced context for the public VOG question.",
        optionLabels: ["Yes", "No", "Still open"],
      },
    },
    sources: [
      {
        id: "source-1",
        label: { de: "Primärquelle", en: "Primary source" },
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
    ...overrides,
  };
}

function question(overrides: Record<string, unknown> = {}) {
  return {
    id: "question-1",
    title: "Legacy title",
    options: ["yes", "no", "open"],
    publicAttribution: "hidden",
    allowAnonymousVoting: true,
    vogPublicBallot: release(),
    ...overrides,
  };
}

describe("VOG public ballot contract", () => {
  it("requires a separate explicit release in addition to existing QR guest settings", () => {
    expect(validateVogPublicBallotQuestion(question())).toMatchObject({
      id: "question-1",
      canonicalOptions: ["yes", "no", "open"],
      release: { originId: "vog-question-01" },
    });
    expect(
      validateVogPublicBallotQuestion(question({ vogPublicBallot: undefined })),
    ).toBeNull();
    expect(
      validateVogPublicBallotQuestion(
        question({ publicAttribution: "public" }),
      ),
    ).toBeNull();
    expect(
      validateVogPublicBallotQuestion(
        question({ allowAnonymousVoting: false }),
      ),
    ).toBeNull();
    expect(
      validateVogPublicBallotQuestion(
        question({
          vogPublicBallot: release({ publicVotingEnabled: false }),
        }),
      ),
    ).toBeNull();
  });

  it("requires DE/EN option parity, HTTPS evidence and at least one counterposition", () => {
    expect(
      VogPublicBallotReleaseSchema.safeParse(
        release({
          localized: {
            de: {
              title: "Deutsche Frage",
              context: "Kontext der Frage",
              optionLabels: ["Ja", "Nein", "Offen"],
            },
            en: {
              title: "English question",
              context: "Question context",
              optionLabels: ["Yes", "No"],
            },
          },
        }),
      ).success,
    ).toBe(false);
    expect(
      VogPublicBallotReleaseSchema.safeParse(
        release({
          sources: [
            {
              id: "source-1",
              label: { de: "Quelle", en: "Source" },
              href: "http://example.org/insecure",
            },
          ],
        }),
      ).success,
    ).toBe(false);
    expect(
      VogPublicBallotReleaseSchema.safeParse(
        release({ counterPositions: [] }),
      ).success,
    ).toBe(false);
  });

  it("treats source, origin, origin_id and locale as metadata only", () => {
    const metadata = normalizeVogOriginMetadata(
      {
        source: "vote4gov",
        origin: "voiceopengov",
        origin_id: "attacker-controlled-release-id",
        locale: "en-US",
      },
      "vog-question-01",
    );

    expect(metadata).toEqual({
      source: "vote4gov",
      origin: "voiceopengov",
      originId: "vog-question-01",
      locale: "en",
    });
    expect(
      normalizeVogOriginMetadata(
        { source: "admin", origin: "https://attacker.example", locale: "fr" },
        "vog-question-01",
      ),
    ).toEqual({
      source: "direct",
      origin: "edebatte",
      originId: "vog-question-01",
      locale: "de",
    });
  });

  it("resolves schedule and closure fail-closed", () => {
    const parsed = VogPublicBallotReleaseSchema.parse(release());
    expect(
      resolveVogPublicBallotLifecycle({
        setStatus: "active",
        release: parsed,
        now: new Date("2026-08-02T00:00:00.000Z"),
      }),
    ).toBe("open");
    expect(
      resolveVogPublicBallotLifecycle({
        setStatus: "draft",
        release: parsed,
        now: new Date("2026-08-02T00:00:00.000Z"),
      }),
    ).toBe("closed");
    expect(
      resolveVogPublicBallotLifecycle({
        setStatus: "active",
        release: parsed,
        now: new Date("2026-07-01T00:00:00.000Z"),
      }),
    ).toBe("scheduled");
  });

  it("builds the canonical additive external route without using the QR resolver", () => {
    expect(
      buildVogPublicBallotHref({
        code: "VOGSET01",
        questionId: "question-1",
        source: "vote4gov",
        origin: "voiceopengov",
        originId: "vog-question-01",
        locale: "de",
      }),
    ).toBe(
      "/vog/fragen/VOGSET01/question-1?source=vote4gov&origin=voiceopengov&origin_id=vog-question-01&locale=de",
    );
  });
});
