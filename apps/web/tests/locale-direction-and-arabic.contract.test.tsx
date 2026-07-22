import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDir, isSupportedLocale } from "@/config/locales";
import { LocalizedContentDisplay } from "@/components/i18n/LocalizedContentDisplay";

const ARABIC_ORIGINAL = "هذا نص عربي لاختبار عرض المصدر الأصلي.";
const GERMAN_TRANSLATION = "Dies ist ein arabischer Text zum Test der Originalquelle.";

describe("locale direction and Arabic language bridge contract", () => {
  it("treats Arabic as a supported RTL locale", () => {
    expect(isSupportedLocale("ar")).toBe(true);
    expect(getDir("ar")).toBe("rtl");
    expect(getDir("de")).toBe("ltr");
    expect(getDir("en")).toBe("ltr");
  });

  it("keeps Arabic base messages Arabic instead of English placeholders", () => {
    const raw = readFileSync(resolve(process.cwd(), "src/app/messages/ar.json"), "utf8");
    const messages = JSON.parse(raw) as Record<string, Record<string, string>>;
    const values = Object.values(messages).flatMap((group) => Object.values(group));

    expect(values.length).toBeGreaterThan(0);
    expect(values.every((value) => /[\u0600-\u06FF]/u.test(value))).toBe(true);
    expect(raw).not.toContain('"Join now"');
    expect(raw).not.toContain('"Contribute"');
    expect(raw).not.toContain('"Privacy"');
  });

  it("renders the reading translation and Arabic original with independent language directions", () => {
    const html = renderToStaticMarkup(
      <LocalizedContentDisplay
        preferredLocale="de"
        showLanguageBridgeMeta
        content={{
          originalLanguage: "ar",
          originalText: ARABIC_ORIGINAL,
          translations: { de: GERMAN_TRANSLATION },
          translationStatus: "translated",
          translationProvider: "contract-test",
          translationModel: "contract-test",
        }}
      />,
    );

    expect(html).toContain('lang="de"');
    expect(html).toContain('dir="ltr"');
    expect(html).toContain(GERMAN_TRANSLATION);
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain(ARABIC_ORIGINAL);
  });
});
