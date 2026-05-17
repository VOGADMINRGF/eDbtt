import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/features/create/useCreateHandoffDraft", () => ({
  useCreateHandoffDraft: () => ({
    id: "anlassraum-handoff-1",
    source: "create",
    sourceText: "Tierwohlstandards sollen europaweit und entlang von Importen verschärft werden.",
    plannerResult: {
      plannerTopic: "Tierschutz, Tierhaltung und Agrarstandards",
      plannerCore: "Forderung nach besseren Tierschutz- und Tierhaltungsstandards",
      plannerClusters: [
        "Tierwohl und Haltungsstandards",
        "Import- und Exportregeln",
        "EU-/internationale Mindeststandards",
      ],
    },
    graphMatches: {
      stage: "after_structure",
      prepared: true,
      requiresConfirmation: true,
      searchTerms: ["Tierwohl", "Importstandards"],
      matches: [{ id: "m1", kind: "topic", label: "Tierwohl", relation: "new", requiresConfirmation: true }],
      matchedTopics: [],
      matchedDossiers: [],
      matchedClaims: [],
      matchedAnlassraeume: [],
      matchedVotes: [],
      shouldCreateNewTopic: true,
    },
    selectedAction: "prepare_anlassraum",
    claims: [
      {
        id: "c1",
        text: "Tierprodukte sollten nur mit vergleichbaren Standards importiert und exportiert werden.",
        kind: "policy_claim",
        factcheckEligible: false,
        sourceRefs: [],
      },
    ],
    arguments: [
      {
        id: "a1",
        text: "Der Beitrag verbindet Tierwohl, Handel und Kennzeichnung zu einem reviewbaren Arbeitsstand.",
        stance: "pro",
        supportsClaimIds: ["c1"],
      },
    ],
    openQuestions: [
      {
        id: "q1",
        question: "Welche Standards und Kontrollmechanismen sollen im Anlassraum zuerst geklärt werden?",
        requiredBeforePublish: true,
      },
    ],
    sourceGrounding: [{ id: "s1", label: "Ausgangstext", status: "source_text" }],
    topicSeed: {
      topicKey: "tierschutz-tierhaltung-und-agrarstandards",
      topicLabel: "Tierschutz, Tierhaltung und Agrarstandards",
      jurisdiction: "bund",
      themenradarSourceType: "create_intake",
    },
    resumeHref: "/create?resume=create_handoff&handoffId=anlassraum-handoff-1",
    reviewState: "ready_for_confirmation",
    requiresConfirmation: true,
    createdAt: "2026-05-10T10:00:00.000Z",
  }),
}));

import RundenCreateHandoffBanner from "@/app/runden/RundenCreateHandoffBanner";

describe("create anlassraum handoff contract", () => {
  it("renders the create handoff context in /runden without auto-publish semantics", () => {
    const html = renderToStaticMarkup(
      React.createElement(RundenCreateHandoffBanner, {
        handoffId: "anlassraum-handoff-1",
        createAction: "prepare_anlassraum",
      }),
    );

    expect(html).toContain("Aus /create in den Anlassraum übernommen");
    expect(html).toContain("Topic-Key:");
    expect(html).toContain("Sichtbarkeit: privater Entwurf");
    expect(html).toContain("Keine automatische Veröffentlichung");
    expect(html).toContain("kein stiller Themen- oder Graph-Merge");
    expect(html).toContain("prepare_anlassraum");
  });
});
