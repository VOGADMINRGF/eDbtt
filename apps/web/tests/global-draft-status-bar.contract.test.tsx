import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import GlobalDraftStatusBar from "@/features/start/GlobalDraftStatusBar";
import {
  createStartDraftContext,
  getStartDraftGuardrailSummary,
  getStartDraftStatusLabel,
  getStartDraftSurfaceLabel,
} from "@/features/start/startDraftContext";

describe("global draft status bar contract", () => {
  it("uses canonical labels and guardrails for shared draft states", () => {
    const draft = createStartDraftContext({
      text: "Bei uns fehlt ein sicherer Schulweg vor der Grundschule.",
      origin: "start_create_light",
      intent: "problem",
      targetHint: "create",
      preview: {
        relevance: "public_relevant",
      },
    });

    expect(getStartDraftStatusLabel(draft)).toBe("Analyse-Entwurf");
    expect(getStartDraftSurfaceLabel("themes")).toBe("Passende Themen finden");
    expect(getStartDraftGuardrailSummary(draft, "create")).toContain("Noch nicht veröffentlicht");
    expect(getStartDraftGuardrailSummary(draft, "create")).toContain("Analyse-Entwurf");
    expect(getStartDraftGuardrailSummary(draft, "create")).toContain("Keine Quellenprüfung gestartet");
    expect(getStartDraftGuardrailSummary(draft, "rounds")).toContain("Noch keine Stimmen");
  });

  it("renders a compact shared status block without productive claims", () => {
    const draft = createStartDraftContext({
      text: "Ich möchte einen neuen Radweg in der Clara-Pankower Allee anregen.",
      origin: "start_create_light",
      intent: "proposal",
      targetHint: "rounds",
      preview: {
        relevance: "public_relevant",
      },
    });

    const html = renderToStaticMarkup(
      <GlobalDraftStatusBar
        draft={draft!}
        surface="rounds"
        title="Runde aus deinem Entwurf vorbereiten"
        body="Dein Entwurf bleibt ein Arbeitsstand."
        primaryAction={{ label: "Weiterarbeiten" }}
      />,
    );

    expect(html).toContain("Runde aus deinem Entwurf vorbereiten");
    expect(html).toContain("Analyse-Entwurf");
    expect(html).toContain("Runde vorbereiten");
    expect(html).toContain("Noch nicht veröffentlicht");
    expect(html).toContain("Noch keine Stimmen");
    expect(html).toContain("Keine Quellenprüfung gestartet");
    expect(html).toContain("Keine automatische Prüfung");
    expect(html).toContain("Du bestätigst den nächsten Schritt");
    expect(html).not.toContain("DeepSearch");
    expect(html).not.toContain("veröffentlicht jetzt");
  });
});
