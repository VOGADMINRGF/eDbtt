import { describe, expect, it } from "vitest";
import {
  getRegionalActorById,
  listRegionalActors,
  normalizeRegionalActorType,
  normalizeRegionalActorVerificationStatus,
  parseRegionalActor,
  REGIONAL_ACTOR_TYPES,
  REGIONAL_ACTOR_VERIFICATION_STATUSES,
  supportsRegionalActorAutomaticPoliticalAssignment,
  supportsRegionalActorAutomaticVoiceOpenGovMembership,
} from "@features/region";

describe("regional actor register contract", () => {
  it("covers the required actor types and keeps guardrails explicit", () => {
    expect(REGIONAL_ACTOR_TYPES).toEqual([
      "verein",
      "initiative",
      "lose_gruppe",
      "bewegung",
      "sozialtraeger",
      "schule",
      "gewerbe",
      "verwaltung",
      "sonstige",
    ]);
    expect(REGIONAL_ACTOR_VERIFICATION_STATUSES).toEqual([
      "unverified",
      "review_required",
      "verified",
    ]);
    expect(supportsRegionalActorAutomaticPoliticalAssignment()).toBe(false);
    expect(supportsRegionalActorAutomaticVoiceOpenGovMembership()).toBe(false);
  });

  it("keeps reinickendorf and kommune actors region-scoped and status-based", () => {
    const initiative = getRegionalActorById("actor-reinickendorf-klimaforum");
    const municipalOffice = getRegionalActorById("actor-beispielstadt-verkehr");

    expect(initiative).not.toBeNull();
    expect(initiative?.actorType).toBe("initiative");
    expect(initiative?.verificationStatus).toBe("verified");

    expect(municipalOffice).not.toBeNull();
    expect(municipalOffice?.regionId).toBe("kommune-beispielstadt");
    expect(municipalOffice?.actorType).toBe("verwaltung");
  });

  it("normalizes actor type and verification status safely", () => {
    expect(normalizeRegionalActorType("BEWEGUNG")).toBe("bewegung");
    expect(normalizeRegionalActorType("unknown")).toBe("sonstige");

    expect(normalizeRegionalActorVerificationStatus("VERIFIED")).toBe("verified");
    expect(normalizeRegionalActorVerificationStatus("not-valid")).toBe("review_required");
  });

  it("rejects duplicate tags and unknown shadow fields", () => {
    const fixture = listRegionalActors()[0];
    expect(fixture).toBeDefined();

    expect(() =>
      parseRegionalActor({
        ...fixture,
        id: "actor-invalid-duplicate-tags",
        tags: ["klima", "klima"],
      }),
    ).toThrow(/duplicate_actor_tag/);

    expect(() =>
      parseRegionalActor({
        ...fixture,
        id: "actor-invalid-shadow-field",
        politicalAlignment: "green",
      }),
    ).toThrow();
  });
});
