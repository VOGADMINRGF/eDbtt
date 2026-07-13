import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LocalizedContentDisplay from "@/components/i18n/LocalizedContentDisplay";
import { resolveLocalizedContentForReader } from "@/features/i18n/contentTranslations";

describe("reader-locale content translation rendering", () => {
  it("renders preferred locale translation first when available", () => {
    const html = renderToStaticMarkup(
      <LocalizedContentDisplay
        preferredLocale="en"
        content={{
          originalLanguage: "de",
          originalText: "Originalnachricht",
          translations: { en: "Translated message" },
          translationStatus: "translated",
          translatedAt: "2026-03-22T12:00:00.000Z",
          translationProvider: "test-provider",
          translationModel: "test-model",
        }}
        textClassName="body"
        metaClassName="meta"
        originalTextClassName="original"
        showLanguageBridgeMeta
      />,
    );

    expect(html).toContain("Translated message");
    expect(html).toContain("Translated from de");
    expect(html).toContain("UI locale: English");
    expect(html).toContain("Original language: Deutsch");
    expect(html).toContain("Reading version: English");
    expect(html).toContain("Status: Reading version available");
    expect(html).toContain(
      "The original remains the evidence and review basis.",
    );
  });

  it("falls back to original content when preferred locale equals original language", () => {
    const resolved = resolveLocalizedContentForReader({
      preferredLocale: "de",
      content: {
        originalLanguage: "de",
        originalText: "Nur Original",
        translations: { en: "Only translation" },
        translationStatus: "translated",
      },
    });

    expect(resolved?.state).toBe("original");
    expect(resolved?.displayText).toBe("Nur Original");
  });

  it("keeps original text visible through disclosure when translated text is shown", () => {
    const html = renderToStaticMarkup(
      <LocalizedContentDisplay
        preferredLocale="en"
        content={{
          originalLanguage: "de",
          originalText: "Originaltext sichtbar",
          translations: { en: "Visible translation" },
          translationStatus: "translated",
        }}
        showLanguageBridgeMeta
      />,
    );

    expect(html).toContain("Show original");
    expect(html).toContain("Originaltext sichtbar");
  });

  it("shows missing translation state and keeps original when translation is unavailable", () => {
    const html = renderToStaticMarkup(
      <LocalizedContentDisplay
        preferredLocale="fr"
        content={{
          originalLanguage: "de",
          originalText: "Kein FR-Text",
          translations: { en: "English only" },
          translationStatus: "missing",
        }}
        showLanguageBridgeMeta
      />,
    );

    expect(html).toContain("Kein FR-Text");
    expect(html).toContain("Aucune traduction pour FR.");
    expect(html).toContain("Langue de l&#x27;interface: Français");
    expect(html).toContain("Version de lecture manquante");
  });

  it("keeps preferred-locale fallback stable for unsupported locale inputs", () => {
    const resolved = resolveLocalizedContentForReader({
      preferredLocale: "xx",
      content: {
        originalLanguage: "en",
        originalText: "English original",
        translations: { de: "Deutsche Uebersetzung" },
        translationStatus: "translated",
      },
    });

    expect(resolved?.preferredLocale).toBe("de");
    expect(resolved?.state).toBe("translated");
    expect(resolved?.displayText).toBe("Deutsche Uebersetzung");
  });
});
