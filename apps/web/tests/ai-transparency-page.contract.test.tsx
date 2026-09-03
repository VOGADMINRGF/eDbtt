import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AiTransparencyPage from "@/app/ki-transparenz/page";
import { LocaleProvider } from "@/context/LocaleContext";

function renderPage(locale: "de" | "en") {
  return renderToStaticMarkup(
    <LocaleProvider initialLocale={locale}>
      <AiTransparencyPage />
    </LocaleProvider>,
  );
}

describe("/ki-transparenz public contract", () => {
  it("explains the stricter eDebatte, VoiceOpenGov, and Vote4Gov standard in German", () => {
    const html = renderPage("de");
    expect(html).toContain("Nachvollziehbar, wo KI beteiligt ist");
    expect(html).toContain("eDebatte, VoiceOpenGov und Vote4Gov");
    expect(html).toContain("Mit KI unterstützt · redaktionell geprüft");
    expect(html).toContain("KI-generiert · redaktionell geprüft");
    expect(html).toContain("KI-generierter Inhalt · nicht redaktionell geprüft");
    expect(html).toContain("C2PA");
    expect(html).toContain("derzeit nicht belegt");
    expect(html).toContain("keine automatische Massenkennzeichnung");
  });

  it("renders the same central truth in English", () => {
    const html = renderPage("en");
    expect(html).toContain("See clearly where AI is involved");
    expect(html).toContain("AI-assisted · editorially reviewed");
    expect(html).toContain("AI-generated · editorially reviewed");
    expect(html).toContain("AI-generated content · not editorially reviewed");
    expect(html).toContain("not currently established");
    expect(html).toContain("no automatic mass labelling");
  });
});
