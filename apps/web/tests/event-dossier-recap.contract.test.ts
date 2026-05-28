import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sessionFindOne: vi.fn(),
  roomNext: vi.fn(),
  inputToArray: vi.fn(),
  findDossierByAnyId: vi.fn(),
  buildDossierUpdateReadModel: vi.fn(),
  loadSocialDistributionQueueReadModel: vi.fn(),
}));

vi.mock("@features/stream/db", () => ({
  streamSessionsCol: async () => ({
    findOne: (...args: unknown[]) => mocks.sessionFindOne(...args),
    find: () => ({
      sort: () => ({
        limit: () => ({
          toArray: async () => [],
        }),
      }),
    }),
  }),
  streamPublicInputsCol: async () => ({
    find: () => ({
      sort: () => ({
        limit: () => ({
          toArray: (...args: unknown[]) => mocks.inputToArray(...args),
        }),
      }),
    }),
  }),
}));

vi.mock("@features/anlassraum/db", () => ({
  anlassraumCol: async () => ({
    find: () => ({
      sort: () => ({
        limit: () => ({
          next: (...args: unknown[]) => mocks.roomNext(...args),
        }),
      }),
    }),
  }),
}));

vi.mock("@features/dossier/lookup", () => ({
  findDossierByAnyId: (...args: unknown[]) => mocks.findDossierByAnyId(...args),
}));

vi.mock("@features/dossier/updateReadModel", () => ({
  buildDossierUpdateReadModel: (...args: unknown[]) => mocks.buildDossierUpdateReadModel(...args),
}));

vi.mock("@features/outputEngine/socialDistributionQueueReadModel", () => ({
  loadSocialDistributionQueueReadModel: (...args: unknown[]) =>
    mocks.loadSocialDistributionQueueReadModel(...args),
}));

import { buildStreamPublicRuntime } from "@features/stream/publicRuntime";

describe("event dossier recap contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessionFindOne.mockResolvedValue({
      _id: { toHexString: () => "65f000000000000000000901" },
      slug: "stadtwerke-live-berlin",
      creatorId: "user-1",
      title: "Livestream Stadtwerke Berlin",
      description: "Öffentliche Energierunde",
      topicKey: "energie-berlin",
      regionCode: "berlin",
      startsAt: new Date("2026-05-25T18:00:00.000Z"),
      status: "ended",
      isLive: false,
      followUp: {
        updates: [
          {
            id: "follow-1",
            status: "in_review",
            note: "Zusammenfassung wird geprüft.",
            createdAt: new Date("2026-05-25T20:10:00.000Z"),
          },
        ],
      },
      visibility: "public",
      createdAt: new Date("2026-05-25T10:00:00.000Z"),
      updatedAt: new Date("2026-05-25T20:20:00.000Z"),
      endedAt: new Date("2026-05-25T20:00:00.000Z"),
    });
    mocks.roomNext.mockResolvedValue({
      _id: { toHexString: () => "65f000000000000000000401" },
      title: "Anlassraum Energie Berlin",
      summary: "Öffentlicher Anlassraum",
      dossierId: { toHexString: () => "65f000000000000000000777" },
      status: "active",
      isPublic: true,
    });
    mocks.inputToArray.mockResolvedValue([
      {
        inputId: "stream-public-input-1",
        kind: "question",
        text: "Welche Daten folgen nach dem Event?",
        sourceUrl: null,
        reviewState: "needs_review",
        visibilityState: "public_unverified",
        riskHint: "Bleibt in Prüfung.",
        createdAt: new Date("2026-05-25T19:00:00.000Z"),
      },
    ]);
    mocks.findDossierByAnyId.mockResolvedValue({
      meta: { title: "Dossier Energie Berlin" },
    });
    mocks.buildDossierUpdateReadModel.mockResolvedValue({
      summary: {
        reviewRequired: 2,
        published: 1,
      },
    });
    mocks.loadSocialDistributionQueueReadModel.mockResolvedValue({
      items: [
        {
          originLabel: "Dossier-Update",
          statusLabel: "Prüfung nötig",
          dossierId: "65f000000000000000000777",
          anlassraumHref: "/runden?anlassraumId=65f000000000000000000401",
        },
      ],
    });
  });

  it("keeps event recap on dossier, Anlassraum and social draft follow-up without auto publication", async () => {
    const runtime = await buildStreamPublicRuntime("stadtwerke-live-berlin");

    expect(runtime?.session.resolvedStatus).toBe("dossier_update_suggested");
    expect(runtime?.context.anlassraumHref).toBe("/runden?anlassraumId=65f000000000000000000401");
    expect(runtime?.context.dossierHref).toBe("/dossier/65f000000000000000000777");
    expect(runtime?.recap.reviewHint).toContain("review-first");
    expect(runtime?.recap.dossierUpdateHint).toContain("2 Dossier-Hinweise");
    expect(runtime?.recap.anlassraumUpdateHint).toContain("öffentliche Folgefläche");
    expect(runtime?.recap.socialDraftHint).toContain("Prüfung nötig");
    expect(runtime?.guardrails.noAutoPublish).toBe(true);
    expect(runtime?.guardrails.noAutoSocial).toBe(true);
  });
});
