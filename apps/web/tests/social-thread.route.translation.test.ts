import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  usersFindOne: vi.fn(),
  requestToArray: vi.fn(),
  messageFindOne: vi.fn(),
  messageInsertOne: vi.fn(),
  runContentTranslationProduction: vi.fn(),
  readSession: vi.fn(),
}));

vi.mock("@core/db/triMongo", async () => {
  const actual = await vi.importActual<typeof import("@core/db/triMongo")>("@core/db/triMongo");

  const requestChain = {
    sort: vi.fn(() => requestChain),
    limit: vi.fn(() => requestChain),
    toArray: (...args: unknown[]) => mocks.requestToArray(...args),
  };

  return {
    ...actual,
    assertStoreConfigured: vi.fn(),
    coreCol: vi.fn(async (name: string) => {
      if (name === "users") {
        return {
          findOne: (...args: unknown[]) => mocks.usersFindOne(...args),
        };
      }
      if (name === "social_friend_requests") {
        return {
          find: vi.fn(() => requestChain),
        };
      }
      if (name === "social_messages") {
        return {
          findOne: (...args: unknown[]) => mocks.messageFindOne(...args),
          insertOne: (...args: unknown[]) => mocks.messageInsertOne(...args),
        };
      }
      throw new Error(`unexpected_collection_${name}`);
    }),
  };
});

vi.mock("@/utils/session", () => ({
  readSession: (...args: unknown[]) => mocks.readSession(...args),
}));

vi.mock("@/lib/social/relationshipState", () => ({
  clean: (value: unknown) => (typeof value === "string" ? value.trim() : ""),
  deriveMessagingCapability: () => ({
    relationshipState: "connected",
    canMessage: true,
    cannotMessageReason: null,
  }),
  idCandidates: (value: string) => [value],
  normalizeId: (value: unknown) => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && "toHexString" in (value as Record<string, unknown>)) {
      return String((value as { toHexString: () => string }).toHexString());
    }
    return "";
  },
  pairFilter: () => ({}),
  summarizePairState: () => ({
    incomingPending: null,
    outgoingPending: null,
  }),
}));

vi.mock("@/features/i18n/contentTranslationProduction", () => ({
  runContentTranslationProduction: (...args: unknown[]) => mocks.runContentTranslationProduction(...args),
}));

import { ObjectId } from "@core/db/triMongo";
import { POST as socialThreadPOST } from "@/app/api/account/social-thread/route";

describe("social-thread translation write-path compatibility", () => {
  const targetUserId = new ObjectId("65f000000000000000000123").toHexString();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSession.mockResolvedValue({ uid: "65f000000000000000000001" });
    mocks.usersFindOne.mockResolvedValue({
      _id: new ObjectId(targetUserId),
      profile: { displayName: "Target User" },
    });
    mocks.requestToArray.mockResolvedValue([]);
    mocks.messageFindOne.mockResolvedValue(null);
    mocks.messageInsertOne.mockResolvedValue({
      insertedId: new ObjectId("65f000000000000000000456"),
    });
    mocks.runContentTranslationProduction.mockResolvedValue({
      content: {
        originalLanguage: null,
        originalText: "Hallo Nachricht",
        translations: {},
        translationStatus: "missing",
        translatedAt: null,
        translationProvider: null,
        translationModel: null,
      },
      targetLocales: ["en"],
      missingLocales: ["en"],
      attemptedLocales: [],
      producedLocales: [],
      failedLocales: [],
    });
  });

  it("keeps message write-path backward-compatible when originalLanguage is omitted", async () => {
    const req = new Request("http://localhost/api/account/social-thread", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetUserId,
        text: "Hallo Nachricht",
      }),
    });

    const res = await socialThreadPOST(req);
    expect(res.status).toBe(200);
    expect(mocks.runContentTranslationProduction).toHaveBeenCalledWith(
      expect.objectContaining({
        originalText: "Hallo Nachricht",
        originalLanguage: null,
      }),
    );
    const inserted = mocks.messageInsertOne.mock.calls[0]?.[0];
    expect(inserted.originalLanguage).toBeNull();
    expect(inserted.originalText).toBe("Hallo Nachricht");
  });

  it("persists provided originalLanguage when available", async () => {
    mocks.runContentTranslationProduction.mockResolvedValue({
      content: {
        originalLanguage: "fr",
        originalText: "Bonjour message",
        translations: { en: "Hello message" },
        translationStatus: "translated",
        translatedAt: "2026-03-22T12:00:00.000Z",
        translationProvider: "openai",
        translationModel: "gpt-4o-mini",
      },
      targetLocales: ["en"],
      missingLocales: [],
      attemptedLocales: ["en"],
      producedLocales: ["en"],
      failedLocales: [],
    });

    const req = new Request("http://localhost/api/account/social-thread", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetUserId,
        text: "Bonjour message",
        originalLanguage: "fr",
      }),
    });

    const res = await socialThreadPOST(req);
    expect(res.status).toBe(200);
    const inserted = mocks.messageInsertOne.mock.calls[0]?.[0];
    expect(inserted.originalLanguage).toBe("fr");
    expect(inserted.translationStatus).toBe("translated");
    expect(inserted.translations.en).toBe("Hello message");
  });
});
