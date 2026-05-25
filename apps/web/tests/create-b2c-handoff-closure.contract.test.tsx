import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { CreateHandoffPanel } from "@/features/create/CreateHandoffPanel";

describe("create b2c handoff closure contract", () => {
  it("shows shared citizen status language, destination and next step for dossier handoffs", () => {
    const html = renderToStaticMarkup(
      <CreateHandoffPanel
        draft={{
          id: "create-handoff-b2c-1",
          source: "create",
          sourceText:
            "Die Schulwegsicherheit rund um die Grundschule muss verbessert werden, besonders an der Kreuzung vor dem Eingang.",
          plannerResult: {
            plannerTopic: "Schulwegsicherheit rund um die Grundschule",
            plannerCore: "Mehr Sicherheit vor der Grundschule",
            plannerClusters: ["Verkehr", "Schulweg", "Sicherheit"],
            plannerScope: ["municipal"],
          },
          graphMatches: {
            stage: "after_structure",
            prepared: true,
            requiresConfirmation: true,
            searchTerms: ["Schulweg", "Grundschule"],
            matches: [{ id: "m1", kind: "topic", label: "Schulweg", relation: "new", requiresConfirmation: true }],
            matchedTopics: [],
            matchedDossiers: [],
            matchedClaims: [],
            matchedAnlassraeume: [],
            matchedVotes: [],
            shouldCreateNewTopic: true,
          },
          selectedAction: "append_to_dossier",
          claims: [
            {
              id: "c1",
              text: "Die Kreuzung vor der Schule ist morgens unübersichtlich.",
              kind: "factual_claim",
              factcheckEligible: true,
              sourceRefs: ["source-1"],
            },
          ],
          arguments: [
            {
              id: "a1",
              text: "Der Beitrag verbindet Verkehrsführung, Elternperspektive und Sicherheitslage zu einem gemeinsamen Arbeitsstand.",
              stance: "pro",
              supportsClaimIds: ["c1"],
            },
          ],
          openQuestions: [
            {
              id: "q1",
              question: "Welche Maßnahmen sind kurzfristig und welche nur nach Umbau realistisch?",
              requiredBeforePublish: true,
            },
          ],
          sourceGrounding: [
            { id: "s1", label: "Ausgangstext", status: "source_text" },
            { id: "s2", label: "Link 1", status: "link_reference", detail: "https://example.com/schulweg" },
          ],
          topicSeed: {
            topicKey: "schulwegsicherheit-rund-um-die-grundschule",
            topicLabel: "Schulwegsicherheit rund um die Grundschule",
            jurisdiction: "kommune",
            themenradarSourceType: "create_intake",
          },
          resumeHref: "/create?resume=create_handoff&handoffId=create-handoff-b2c-1",
          reviewState: "clarification_required",
          visibilityState: "internal_review",
          requiresConfirmation: true,
          createdAt: "2026-05-25T10:00:00.000Z",
        } as any}
      />,
    );

    expect(html).toContain("eingereicht");
    expect(html).toContain("in Prüfung");
    expect(html).toContain("im Dossier-Kontext");
    expect(html).toContain("Geht jetzt weiter nach");
    expect(html).toContain("Dossier");
    expect(html).toContain("Nächster Schritt");
    expect(html).toContain("Im Dossier vertiefen");
    expect(html).toContain("Review und Veröffentlichung");
    expect(html).toContain("Keine automatische Veröffentlichung");
    expect(html).toContain("Zum Dossier");
    expect(html).toContain("Anlassraum dazu öffnen");
    expect(html).toContain("Swipes dazu öffnen");
  });
});
