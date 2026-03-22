import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createCommunityContribution: vi.fn(),
  listCommunityContributions: vi.fn(),
  runContentTranslationProduction: vi.fn(),
}));

vi.mock("@core/communityContributions", () => ({
  createCommunityContribution: (...args: unknown[]) => mocks.createCommunityContribution(...args),
  listCommunityContributions: (...args: unknown[]) => mocks.listCommunityContributions(...args),
}));

vi.mock("@/features/i18n/contentTranslationProduction", () => ({
  runContentTranslationProduction: (...args: unknown[]) => mocks.runContentTranslationProduction(...args),
}));

import { POST as contributionsPOST } from "@/app/api/community/contributions/route";

describe("community contributions route translation write-path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createCommunityContribution.mockResolvedValue({ id: "c-1", status: "proposed" });
    mocks.runContentTranslationProduction.mockResolvedValue({
      content: {
        originalLanguage: "de",
        originalText: "Originaltext",
        translations: { en: "Translated text" },
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
  });

  it("stores localized content payload with original text fields", async () => {
    mocks.runContentTranslationProduction
      .mockResolvedValueOnce({
        content: {
          originalLanguage: "de",
          originalText: "Originaltitel",
          translations: { en: "Translated title" },
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
      })
      .mockResolvedValueOnce({
        content: {
          originalLanguage: "de",
          originalText: "Originaltext",
          translations: { en: "Translated text" },
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

    const req = new NextRequest("http://localhost/api/community/contributions", {
      method: "POST",
      body: JSON.stringify({
        type: "option",
        topicId: "energie",
        title: "Originaltitel",
        body: "Originaltext",
        originalLanguage: "de",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await contributionsPOST(req);
    expect(res.status).toBe(200);
    expect(mocks.createCommunityContribution).toHaveBeenCalledTimes(1);
    const payload = mocks.createCommunityContribution.mock.calls[0]?.[0];
    expect(payload.titleContent.originalText).toBe("Originaltitel");
    expect(payload.bodyContent.originalText).toBe("Originaltext");
  });

  it("keeps backward-compatible null localized payload when no text exists", async () => {
    mocks.runContentTranslationProduction.mockResolvedValue({
      content: null,
      targetLocales: [],
      missingLocales: [],
      attemptedLocales: [],
      producedLocales: [],
      failedLocales: [],
    });

    const req = new NextRequest("http://localhost/api/community/contributions", {
      method: "POST",
      body: JSON.stringify({
        type: "source",
        topicId: "energie",
        url: "https://example.org/source",
        originalLanguage: "de",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await contributionsPOST(req);
    expect(res.status).toBe(200);
    const payload = mocks.createCommunityContribution.mock.calls[0]?.[0];
    expect(payload.titleContent).toBeNull();
    expect(payload.bodyContent).toBeNull();
  });
});
