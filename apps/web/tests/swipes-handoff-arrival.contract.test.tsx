import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/features/create/useCreateHandoffDraft", () => ({
  useCreateHandoffDraft: () => ({
    id: "swipe-handoff-1",
    source: "create",
    sourceText: "Der Schulweg vor der Grundschule ist morgens zu gefährlich.",
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
      matches: [{ id: "m1", kind: "vote", label: "Tempo 30", relation: "new", requiresConfirmation: true }],
      matchedTopics: [],
      matchedDossiers: [],
      matchedClaims: [],
      matchedAnlassraeume: [],
      matchedVotes: [],
      shouldCreateNewTopic: true,
    },
    selectedAction: "prepare_vote",
    claims: [
      {
        id: "c1",
        text: "Vor dem Schuleingang kommt es morgens zu unsicheren Situationen.",
        kind: "factual_claim",
        factcheckEligible: true,
        sourceRefs: [],
      },
    ],
    arguments: [
      {
        id: "a1",
        text: "Der Beitrag soll in eine Beteiligungsfrage überführt werden.",
        stance: "pro",
        supportsClaimIds: ["c1"],
      },
    ],
    openQuestions: [],
    sourceGrounding: [{ id: "s1", label: "Ausgangstext", status: "source_text" }],
    topicSeed: {
      topicKey: "schulwegsicherheit-rund-um-die-grundschule",
      topicLabel: "Schulwegsicherheit rund um die Grundschule",
      jurisdiction: "kommune",
      themenradarSourceType: "create_intake",
    },
    resumeHref: "/create?resume=create_handoff&handoffId=swipe-handoff-1",
    reviewState: "ready_for_confirmation",
    visibilityState: "private_draft",
    requiresConfirmation: true,
    createdAt: "2026-05-25T10:00:00.000Z",
  }),
}));

vi.mock("@/features/surfaces/swipes", () => ({
  SwipesSurface: () => <div>SwipesSurface</div>,
}));

import { SwipesHandoffShell } from "@/features/surfaces/swipes/SwipesHandoffShell";

describe("swipes handoff arrival contract", () => {
  it("frames the arrival as a matching participation surface without fake auto-actions", () => {
    const html = renderToStaticMarkup(
      <SwipesHandoffShell
        context={{ mode: "live", audience: "none", dataSource: "live" } as any}
        handoffId="swipe-handoff-1"
        fromCreate
      />,
    );

    expect(html).toContain("Beteiligungsfrage aus /create vorbereitet");
    expect(html).toContain("für Swipes vorbereitet");
    expect(html).toContain("Das passt zu deinem Beitrag");
    expect(html).toContain("Du kannst hier zustimmen, anders sehen oder zum Anlassraum beziehungsweise Dossier weitergehen.");
    expect(html).toContain("Zu Swipes");
    expect(html).toContain("Zum Anlassraum");
    expect(html).toContain("Zum Dossier");
    expect(html).toContain("Keine automatische Veröffentlichung");
    expect(html).toContain("SwipesSurface");
  });
});
