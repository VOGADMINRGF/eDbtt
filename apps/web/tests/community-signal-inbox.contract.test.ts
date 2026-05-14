import { describe, expect, it } from "vitest";
import {
  getCommunitySignalById,
  listCommunitySignals,
  normalizeCommunitySignalReviewStatus,
  normalizeCommunitySignalSubmitterMode,
  normalizeCommunitySignalType,
  parseCommunitySignal,
  COMMUNITY_SIGNAL_REVIEW_STATUSES,
  COMMUNITY_SIGNAL_SUBMITTER_MODES,
  COMMUNITY_SIGNAL_TYPES,
  supportsCommunitySignalAutomaticDossierCreation,
  supportsCommunitySignalAutoMandate,
  supportsCommunitySignalAutoPublish,
  supportsCommunitySignalComplexProfileRequirement,
} from "@features/region";

describe("community signal inbox contract", () => {
  it("stays low-threshold and review-first", () => {
    expect(COMMUNITY_SIGNAL_TYPES).toEqual(["hint", "source", "local_knowledge", "topic_proposal"]);
    expect(COMMUNITY_SIGNAL_REVIEW_STATUSES).toEqual([
      "submitted",
      "in_review",
      "accepted",
      "rejected",
    ]);
    expect(COMMUNITY_SIGNAL_SUBMITTER_MODES).toEqual([
      "anonymous",
      "lightweight_contact",
      "registered_reference",
    ]);
    expect(supportsCommunitySignalComplexProfileRequirement()).toBe(false);
    expect(supportsCommunitySignalAutoPublish()).toBe(false);
    expect(supportsCommunitySignalAutoMandate()).toBe(false);
    expect(supportsCommunitySignalAutomaticDossierCreation()).toBe(false);
  });

  it("keeps anonymous, lightweight and registered submissions compatible", () => {
    const anonymous = getCommunitySignalById("signal-tegel-ortswissen-001");
    const lightweight = getCommunitySignalById("signal-reinickendorf-schulweg-001");
    const registered = getCommunitySignalById("signal-beispielstadt-quellenvorschlag-001");

    expect(anonymous?.submitter.mode).toBe("anonymous");
    expect(anonymous?.sourceActorId).toBeNull();

    expect(lightweight?.submitter.mode).toBe("lightweight_contact");
    expect(lightweight?.submitter.contactChannel).toContain("@");
    expect(lightweight?.reviewStatus).toBe("in_review");

    expect(registered?.submitter.mode).toBe("registered_reference");
    expect(registered?.sourceActorId).toBe("actor-beispielstadt-verkehr");
  });

  it("normalizes signal type, review status and submitter mode safely", () => {
    expect(normalizeCommunitySignalType("LOCAL_KNOWLEDGE")).toBe("local_knowledge");
    expect(normalizeCommunitySignalType("invalid")).toBe("hint");

    expect(normalizeCommunitySignalReviewStatus("ACCEPTED")).toBe("accepted");
    expect(normalizeCommunitySignalReviewStatus("invalid")).toBe("submitted");

    expect(normalizeCommunitySignalSubmitterMode("REGISTERED_REFERENCE")).toBe(
      "registered_reference",
    );
    expect(normalizeCommunitySignalSubmitterMode("invalid")).toBe("anonymous");
  });

  it("rejects missing contact for lightweight submissions and duplicate sources", () => {
    const fixture = listCommunitySignals()[0];
    expect(fixture).toBeDefined();

    expect(() =>
      parseCommunitySignal({
        ...fixture,
        id: "signal-invalid-contact",
        submitter: {
          ...fixture.submitter,
          mode: "lightweight_contact",
          contactChannel: null,
        },
      }),
    ).toThrow(/lightweight_contact_requires_contact_channel/);

    expect(() =>
      parseCommunitySignal({
        ...fixture,
        id: "signal-invalid-duplicate-source",
        sourceUrls: ["https://example.org/a", "https://example.org/a"],
      }),
    ).toThrow(/duplicate_source_url/);

    expect(() =>
      parseCommunitySignal({
        ...fixture,
        id: "signal-invalid-registered-reference",
        submitter: {
          ...fixture.submitter,
          mode: "registered_reference",
        },
        sourceActorId: null,
      }),
    ).toThrow(/registered_reference_requires_source_actor_id/);
  });
});
