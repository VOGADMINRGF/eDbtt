import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Dossier } from "@features/dossier";

vi.mock("@/components/dossier/DossierViewer", () => ({
  DossierViewer: ({ dossier }: { dossier: Dossier }) => <div>DossierViewer:{dossier.meta?.title}</div>,
}));

vi.mock("@/components/ai/RouteBoundCompanionPanel", () => ({
  default: () => <div>RouteBoundCompanionPanel</div>,
}));

vi.mock("@/components/mobile/ShareDeepLinkActions", () => ({
  default: () => <div>ShareDeepLinkActions</div>,
}));

vi.mock("@/components/share/SocialOutputPreviewPanel", () => ({
  default: () => <div>SocialOutputPreviewPanel</div>,
}));

import { DossierPagePublicBody } from "@/app/dossier/[id]/ui";

describe("dossier public handoff linking contract", () => {
  it("keeps dossier linking on public paths and explains the dossier as context surface", () => {
    const html = renderToStaticMarkup(
      <DossierPagePublicBody
        dossierId="dossier-1"
        handoffDraft={{
          id: "dossier-handoff-1",
          source: "create",
          sourceText: "Mehr Sicherheit vor der Grundschule.",
          plannerResult: {
            plannerTopic: "Schulwegsicherheit rund um die Grundschule",
            plannerCore: "Mehr Sicherheit vor der Grundschule",
            plannerClusters: ["Verkehr", "Schulweg"],
            plannerScope: ["municipal"],
          },
          graphMatches: {
            stage: "after_structure",
            prepared: true,
            requiresConfirmation: true,
            searchTerms: ["Schulweg"],
            matches: [],
            matchedTopics: [],
            matchedDossiers: [],
            matchedClaims: [],
            matchedAnlassraeume: [],
            matchedVotes: [],
            shouldCreateNewTopic: true,
          },
          selectedAction: "append_to_dossier",
          claims: [],
          arguments: [],
          openQuestions: [],
          sourceGrounding: [{ id: "s1", label: "Ausgangstext", status: "source_text" }],
          topicSeed: {
            topicKey: "schulwegsicherheit-rund-um-die-grundschule",
            topicLabel: "Schulwegsicherheit rund um die Grundschule",
            jurisdiction: "kommune",
            themenradarSourceType: "create_intake",
          },
          resumeHref: "/create?resume=create_handoff&handoffId=dossier-handoff-1",
          reviewState: "ready_for_confirmation",
          visibilityState: "private_draft",
          requiresConfirmation: true,
          createdAt: "2026-05-25T10:00:00.000Z",
        } as any}
        dossier={{
          meta: {
            id: "dossier-1",
            title: "Dossier Schulwegsicherheit",
            region: "Berlin",
          },
          analyze: {
            summary: "Öffentlicher Dossierstand.",
            claims: [{ title: "Erste Aussage" }],
          },
        } as unknown as Dossier}
        loadState="ready"
      />,
    );

    expect(html).toContain("im Dossier-Kontext");
    expect(html).toContain("Quellenlage");
    expect(html).toContain("Offene Fragen");
    expect(html).toContain("Verschiedene Perspektiven");
    expect(html).toContain("Stand und Update");
    expect(html).toContain("Öffentlich lesbarer Dossierstand");
    expect(html).toContain("ShareDeepLinkActions");
    expect(html).toContain("SocialOutputPreviewPanel");
    expect(html).toContain("RouteBoundCompanionPanel");
    expect(html).toContain("DossierViewer:Dossier Schulwegsicherheit");
  });
});
