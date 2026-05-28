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

import { buildStreamPublicRuntime, buildStreamShareContext } from "@features/stream/publicRuntime";

describe("event no live chat autopublish contract", () => {
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
      status: "live",
      isLive: true,
      visibility: "public",
      createdAt: new Date("2026-05-25T10:00:00.000Z"),
      updatedAt: new Date("2026-05-25T18:15:00.000Z"),
    });
    mocks.roomNext.mockResolvedValue({
      _id: { toHexString: () => "65f000000000000000000401" },
      title: "Anlassraum Energie Berlin",
      summary: "Öffentliche Folgefläche",
      dossierId: { toHexString: () => "65f000000000000000000777" },
      status: "active",
      isPublic: true,
    });
    mocks.inputToArray.mockResolvedValue([]);
    mocks.findDossierByAnyId.mockResolvedValue({
      meta: { title: "Dossier Energie Berlin" },
    });
    mocks.buildDossierUpdateReadModel.mockResolvedValue({
      summary: {
        reviewRequired: 0,
        published: 0,
      },
    });
    mocks.loadSocialDistributionQueueReadModel.mockResolvedValue({
      items: [],
    });
  });

  it("keeps qr/share on a review-first event path without live-chat or autopublish claims", async () => {
    const runtime = await buildStreamPublicRuntime("stadtwerke-live-berlin");
    const share = runtime ? buildStreamShareContext(runtime) : null;

    expect(runtime?.guardrails).toMatchObject({
      noAutoPublish: true,
      noAutoSocial: true,
      noAutoMerge: true,
      reviewFirstInput: true,
    });
    expect(share?.sharePrompt).toContain("Fragen, Quellen oder Optionen");
    expect(share?.shareSummary).toContain("Keine automatische");
    expect(share?.shareSummary).toContain("kein Live-Chat");
    expect(share?.shareSummary).toContain("keine ungeprüfte Ergebnisbehauptung");
  });
});
