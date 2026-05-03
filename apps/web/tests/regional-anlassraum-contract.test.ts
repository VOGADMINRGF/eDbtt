import { describe, expect, it } from "vitest";
import {
  getRegionalAnlassraumById,
  listRegionalAnlassraeume,
  normalizeRegionalAnlassraumStatus,
  parseRegionalAnlassraum,
  REGIONAL_ANLASSRAUM_SCOPE_KEYS,
  supportsRegionalAnlassraumAutomaticDossierCreation,
  supportsRegionalAnlassraumAutomaticPoliticalAssignment,
  supportsRegionalAnlassraumAutomaticRoundCreation,
  supportsRegionalAnlassraumAutomaticVoiceOpenGovMembership,
  supportsRegionalAnlassraumAutoMandate,
  supportsRegionalAnlassraumAutoPublish,
  supportsRegionalAnlassraumScrapingByDefault,
} from "@features/region";

describe("regional anlassraum contract", () => {
  it("keeps guardrails strict and disables auto assumptions", () => {
    expect(supportsRegionalAnlassraumAutoPublish()).toBe(false);
    expect(supportsRegionalAnlassraumAutoMandate()).toBe(false);
    expect(supportsRegionalAnlassraumAutomaticPoliticalAssignment()).toBe(false);
    expect(supportsRegionalAnlassraumScrapingByDefault()).toBe(false);
    expect(supportsRegionalAnlassraumAutomaticDossierCreation()).toBe(false);
    expect(supportsRegionalAnlassraumAutomaticRoundCreation()).toBe(false);
    expect(supportsRegionalAnlassraumAutomaticVoiceOpenGovMembership()).toBe(false);
  });

  it("models reinickendorf as active regional operating room", () => {
    const room = getRegionalAnlassraumById("regional-anlassraum-reinickendorf");

    expect(room).not.toBeNull();
    expect(room?.regionId).toBe("bezirk-berlin-reinickendorf");
    expect(room?.status).toBe("active");
    expect(room?.guidelineProfile).toBe("berlin_participation_guidelines");
    expect(room?.scope).toEqual([...REGIONAL_ANLASSRAUM_SCOPE_KEYS]);
    expect(room?.ownershipModel).toBe("reference_only");
  });

  it("keeps dossier/round/mandate references compatible and non-owning", () => {
    const room = getRegionalAnlassraumById("regional-anlassraum-reinickendorf");
    if (!room) throw new Error("missing_reinickendorf_room_fixture");

    expect(room.links.dossierIds.length).toBeGreaterThanOrEqual(2);
    expect(room.links.roundIds.length).toBeGreaterThanOrEqual(2);
    expect(room.links.mandateIds.length).toBeGreaterThanOrEqual(1);

    expect(room.links.dossierIds).toContain("dossier-31");
    expect(room.links.roundIds).toContain("round-energie-2026-01");
    expect(room.links.mandateIds).toContain("vog-mandat-001");
  });

  it("normalizes status safely", () => {
    expect(normalizeRegionalAnlassraumStatus("ACTIVE")).toBe("active");
    expect(normalizeRegionalAnlassraumStatus("invalid")).toBe("draft");
  });

  it("rejects scope gaps and duplicate references", () => {
    const draftFixture = listRegionalAnlassraeume()[0];
    expect(draftFixture).toBeDefined();

    expect(() =>
      parseRegionalAnlassraum({
        ...draftFixture,
        id: "regional-anlassraum-invalid-scope",
        scope: ["signals", "topics"],
      }),
    ).toThrow(/missing_scope_actors/);

    expect(() =>
      parseRegionalAnlassraum({
        ...draftFixture,
        id: "regional-anlassraum-invalid-duplicates",
        links: {
          ...draftFixture.links,
          dossierIds: ["dossier-31", "dossier-31"],
        },
      }),
    ).toThrow(/duplicate_reference_in_dossierIds/);
  });
});
