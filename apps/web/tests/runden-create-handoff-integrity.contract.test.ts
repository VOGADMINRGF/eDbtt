import { describe, expect, it } from "vitest";
import {
  buildRundenCreateDraftIntakeContext,
  resolveRundenCreateHandoffIntegrityState,
} from "@/features/create/rundenCreateHandoffIntegrity";
import { createEmptyManualAnlassraumSetup } from "@/features/surfaces/runden/manualAnlassraumSetup";

describe("runden create handoff integrity contract", () => {
  it("marks a loaded manual round draft as server-backed create context", () => {
    const state = resolveRundenCreateHandoffIntegrityState({
      draftId: "65a111111111111111111122",
      serverDraft: {
        draftId: "65a111111111111111111122",
        updatedAt: "2026-07-03T13:00:00.000Z",
        setup: {
          ...createEmptyManualAnlassraumSetup(),
          title: "Sichere Schulwege",
        },
      },
    });

    expect(state).toMatchObject({
      status: "loaded",
      draftId: "65a111111111111111111122",
      usesServerDraft: true,
    });
    expect(state.detail).toContain("serverseitig gespeicherte");
  });

  it("distinguishes missing and invalid draft states without faking server truth", () => {
    const missing = resolveRundenCreateHandoffIntegrityState({
      draftId: "65a111111111111111111122",
      serverDraft: null,
    });
    const invalid = resolveRundenCreateHandoffIntegrityState({
      draftId: "bad-draft-id",
      serverDraft: null,
    });

    expect(missing.status).toBe("missing");
    expect(missing.usesServerDraft).toBe(false);
    expect(invalid.status).toBe("invalid");
    expect(invalid.title).toContain("Draft-ID ist ungültig");
    expect(invalid.detail).toContain("kein serverseitiger Entwurf übernommen");
  });

  it("augments create intake context from the loaded manual round draft", () => {
    const context = buildRundenCreateDraftIntakeContext({
      context: {
        source: "runden",
        signalTitle: null,
        sourceUrl: null,
        sourceLabel: null,
        region: null,
        scope: null,
        clusterHint: null,
        reviewState: null,
        candidateId: null,
        draftId: null,
        reason: "manual_anlassraum_continue_create",
      },
      draftId: "65a111111111111111111122",
      serverDraft: {
        draftId: "65a111111111111111111122",
        updatedAt: "2026-07-03T13:00:00.000Z",
        setup: {
          ...createEmptyManualAnlassraumSetup(),
          title: "Sichere Schulwege",
        },
      },
    });

    expect(context).toMatchObject({
      source: "runden",
      signalTitle: "Sichere Schulwege",
      sourceLabel: "Anlassraum-Entwurf aus /runden/new",
      draftId: "65a111111111111111111122",
      reason: "manual_anlassraum_continue_create",
    });
  });
});
