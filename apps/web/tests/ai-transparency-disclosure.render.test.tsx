import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  AiTransparencyLabel,
  VoxyAiSystemDisclosure,
} from "@/components/ai/AiTransparencyDisclosure";

describe("AI transparency disclosure rendering", () => {
  it("shows the exact German first-contact disclosure with an accessible detail link", () => {
    const html = renderToStaticMarkup(<VoxyAiSystemDisclosure locale="de" />);
    expect(html).toContain(
      "Voxy ist ein KI-System. Antworten und Vorschläge können unvollständig oder fehlerhaft sein. Inhalte werden nicht automatisch veröffentlicht.",
    );
    expect(html).toContain('data-ai-system-disclosure="voxy"');
    expect(html).toContain('href="/ki-transparenz#voxy"');
    expect(html).toContain("KI-Transparenzhinweis");
    expect(html).toContain("max-w-full");
    expect(html).toContain("min-h-8");
    expect(html).toContain("focus-visible:ring-2");
    expect(html).not.toContain("aria-live");
  });

  it("shows the exact English first-contact disclosure", () => {
    const html = renderToStaticMarkup(<VoxyAiSystemDisclosure locale="en" compact />);
    expect(html).toContain(
      "Voxy is an AI system. Responses and suggestions may be incomplete or incorrect. Content is never published automatically.",
    );
    expect(html).toContain("AI transparency notice");
  });

  it("renders text, media, and deepfake labels as semantic visible text", () => {
    const html = renderToStaticMarkup(
      <div>
        <AiTransparencyLabel locale="de" status="ai_generated_reviewed" contentKind="text" humanReviewed />
        <AiTransparencyLabel locale="de" status="ai_manipulated_media" contentKind="image" />
        <AiTransparencyLabel locale="en" status="deepfake_disclosure_required" contentKind="video" />
      </div>,
    );
    expect(html).toContain("KI-generiert · redaktionell geprüft");
    expect(html).toContain("KI-generiertes oder KI-bearbeitetes Bild");
    expect(html).toContain("Deepfake disclosure · AI-generated or AI-edited video");
    expect(html).toContain('data-content-kind="video"');
    expect(html).toContain("whitespace-normal");
  });

  it("renders no AI label for human-only content", () => {
    const html = renderToStaticMarkup(
      <AiTransparencyLabel locale="de" status="human_only" contentKind="text" />,
    );
    expect(html).toBe("");
  });

  it("places the first-contact disclosure before the shared companion input", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/ai/RouteBoundCompanionPanel.tsx"),
      "utf8",
    );
    expect(source.indexOf("<VoxyAiSystemDisclosure")).toBeGreaterThan(-1);
    expect(source.indexOf("<VoxyAiSystemDisclosure")).toBeLessThan(
      source.indexOf("<textarea"),
    );
    expect(source).toContain("<AiTransparencyLabel");
  });
});
