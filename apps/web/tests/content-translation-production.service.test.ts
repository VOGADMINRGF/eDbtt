import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  translateBatchOpenAI: vi.fn(),
}));

vi.mock("@/lib/i18n/translateOpenAI", () => ({
  translateBatchOpenAI: (...args: unknown[]) => mocks.translateBatchOpenAI(...args),
}));

import {
  applyContentTranslationLifecycle,
  detectMissingTranslationLocales,
  markContentTranslationPending,
  prepareContentTranslationForWrite,
  runContentTranslationProduction,
} from "@/features/i18n/contentTranslationProduction";

describe("content translation production lifecycle", () => {
  const originalOpenAIKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalOpenAIKey;
  });

  it("prepares write-path content with originalText and backward-compatible fields", () => {
    const prepared = prepareContentTranslationForWrite({
      originalText: "Neuer Beitrag",
      originalLanguage: "de",
      targetLocales: ["de", "en", "fr"],
    });

    expect(prepared.content?.originalText).toBe("Neuer Beitrag");
    expect(prepared.content?.originalLanguage).toBe("de");
    expect(prepared.content?.translationStatus).toBe("missing");
    expect(prepared.targetLocales).toEqual(["en", "fr"]);
  });

  it("detects missing translations and never marks original language as missing", () => {
    const missing = detectMissingTranslationLocales({
      content: {
        originalLanguage: "de",
        originalText: "Original",
        translations: { en: "Original in EN" },
        translationStatus: "missing",
      },
      targetLocales: ["de", "en", "fr"],
      originalLanguage: "de",
    });

    expect(missing).toEqual(["fr"]);
  });

  it("supports lifecycle transitions pending -> translated", () => {
    const prepared = prepareContentTranslationForWrite({
      originalText: "Signaltext",
      originalLanguage: "de",
      targetLocales: ["en"],
    });
    const pending = markContentTranslationPending(prepared.content);
    expect(pending?.translationStatus).toBe("pending");

    const finalized = applyContentTranslationLifecycle({
      content: pending,
      targetLocales: prepared.targetLocales,
      producedTranslations: { en: "Signal text" },
      attemptedLocales: ["en"],
      failedLocales: [],
      provider: "openai",
      model: "gpt-4o-mini",
    });

    expect(finalized.content?.translationStatus).toBe("translated");
    expect(finalized.content?.translations?.en).toBe("Signal text");
    expect(finalized.missingLocales).toEqual([]);
  });

  it("marks failed when translation attempt was made but no missing locale could be produced", () => {
    const prepared = prepareContentTranslationForWrite({
      originalText: "Kurztext",
      originalLanguage: "de",
      targetLocales: ["en"],
    });
    const finalized = applyContentTranslationLifecycle({
      content: prepared.content,
      targetLocales: prepared.targetLocales,
      producedTranslations: {},
      attemptedLocales: ["en"],
      failedLocales: ["en"],
      provider: "openai",
      model: "gpt-4o-mini",
    });

    expect(finalized.content?.translationStatus).toBe("failed");
    expect(finalized.missingLocales).toEqual(["en"]);
  });

  it("does not overwrite existing translations during production", async () => {
    mocks.translateBatchOpenAI.mockResolvedValue({ content: "Neue EN Uebersetzung" });

    const result = await runContentTranslationProduction({
      originalText: "Original",
      originalLanguage: "de",
      existingContent: {
        originalLanguage: "de",
        originalText: "Original",
        translations: { en: "Bestehende EN Uebersetzung" },
        translationStatus: "missing",
      },
      targetLocales: ["en", "fr"],
    });

    expect(result.content?.translations?.en).toBe("Bestehende EN Uebersetzung");
    expect(result.content?.translations?.fr).toBe("Neue EN Uebersetzung");
    expect(result.content?.originalText).toBe("Original");
  });

  it("keeps missing status when provider is not configured", async () => {
    process.env.OPENAI_API_KEY = "";
    const result = await runContentTranslationProduction({
      originalText: "Original",
      originalLanguage: "de",
      targetLocales: ["en"],
    });

    expect(result.content?.translationStatus).toBe("missing");
    expect(result.attemptedLocales).toEqual([]);
  });
});
