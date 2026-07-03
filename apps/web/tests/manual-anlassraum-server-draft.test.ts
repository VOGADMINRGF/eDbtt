import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readSession: vi.fn(),
  coreCol: vi.fn(),
  findOne: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/utils/session", () => ({
  readSession: (...args: unknown[]) => mocks.readSession(...args),
}));

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return {
    ObjectId: mongodb.ObjectId,
    coreCol: (...args: unknown[]) => mocks.coreCol(...args),
  };
});

import { ObjectId } from "@core/db/triMongo";
import {
  MANUAL_ANLASSRAUM_SERVER_DRAFT_SCHEMA_VERSION,
  MANUAL_ANLASSRAUM_SERVER_DRAFT_SOURCE,
  createEmptyManualAnlassraumSetup,
} from "@/features/surfaces/runden/manualAnlassraumSetup";
import { readManualAnlassraumServerDraftForCurrentUser } from "@/features/surfaces/runden/manualAnlassraumServerDraft";

describe("manual anlassraum server draft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSession.mockResolvedValue({
      uid: "65a111111111111111111111",
    });
    mocks.coreCol.mockResolvedValue({
      findOne: mocks.findOne,
    });
  });

  it("loads the authenticated user's saved manual round draft from the existing drafts collection", async () => {
    const setup = {
      ...createEmptyManualAnlassraumSetup(),
      title: "Sichere Schulwege",
      votingQuestion: "Welche Maßnahme soll zuerst kommen?",
      description: " Eltern und Schule melden offene Querungen. ",
      options: ["Zebrastreifen", "Tempo 30"],
    };
    const draftId = "65a111111111111111111122";
    mocks.findOne.mockResolvedValue({
      _id: new ObjectId(draftId),
      userId: "65a111111111111111111111",
      source: MANUAL_ANLASSRAUM_SERVER_DRAFT_SOURCE,
      updatedAt: new Date("2026-07-03T12:00:00.000Z"),
      analysis: {
        manualAnlassraumDraft: {
          schemaVersion: MANUAL_ANLASSRAUM_SERVER_DRAFT_SCHEMA_VERSION,
          sourceSurface: "/runden/new",
          setup,
          noAiRunStarted: true,
          noAiUsageEvent: true,
          noDeepSearchStarted: true,
          reviewFirstOnly: true,
        },
      },
    });

    const result = await readManualAnlassraumServerDraftForCurrentUser(draftId);

    expect(result).toMatchObject({
      draftId,
      updatedAt: "2026-07-03T12:00:00.000Z",
      setup: {
        title: "Sichere Schulwege",
        votingQuestion: "Welche Maßnahme soll zuerst kommen?",
        description: "Eltern und Schule melden offene Querungen.",
      },
    });
    expect(mocks.findOne).toHaveBeenCalledWith({
      _id: expect.any(ObjectId),
      userId: "65a111111111111111111111",
      source: MANUAL_ANLASSRAUM_SERVER_DRAFT_SOURCE,
    });
  });

  it("refuses to load a draft without a valid authenticated user scope", async () => {
    mocks.readSession.mockResolvedValue(null);

    const result = await readManualAnlassraumServerDraftForCurrentUser(
      "65a111111111111111111122",
    );

    expect(result).toBeNull();
    expect(mocks.coreCol).not.toHaveBeenCalled();
  });

  it("ignores drafts that do not carry the manual round draft schema", async () => {
    mocks.findOne.mockResolvedValue({
      _id: new ObjectId("65a111111111111111111122"),
      userId: "65a111111111111111111111",
      source: MANUAL_ANLASSRAUM_SERVER_DRAFT_SOURCE,
      analysis: {
        manualAnlassraumDraft: {
          schemaVersion: "wrong-schema",
        },
      },
    });

    const result = await readManualAnlassraumServerDraftForCurrentUser(
      "65a111111111111111111122",
    );

    expect(result).toBeNull();
  });
});
