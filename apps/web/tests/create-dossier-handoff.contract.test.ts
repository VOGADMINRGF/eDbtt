import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/features/create/useCreateHandoffDraft", () => ({
  useCreateHandoffDraft: () => ({
    id: "dossier-handoff-1",
    source: "create",
    sourceText: "Tierwohlstandards sollen verschärft werden.",
    plannerResult: {
      plannerTopic: "Tierschutz, Tierhaltung und Agrarstandards",
      plannerCore: "Forderung nach besseren Tierschutz- und Tierhaltungsstandards",
      plannerClusters: ["Tierwohl und Haltungsstandards", "Import- und Exportregeln"],
    },
    graphMatches: {
      stage: "after_structure",
      prepared: true,
      requiresConfirmation: true,
      searchTerms: ["Tierwohl"],
      matches: [{ id: "m1", kind: "topic", label: "Tierwohl", relation: "new", requiresConfirmation: true }],
      matchedTopics: [],
      matchedDossiers: [],
      matchedClaims: [],
      matchedAnlassraeume: [],
      matchedVotes: [],
      shouldCreateNewTopic: true,
    },
    selectedAction: "create_dossier",
    claims: [
      {
        id: "c1",
        text: "Forderung nach besseren Tierschutz- und Tierhaltungsstandards",
        kind: "policy_claim",
        factcheckEligible: false,
        sourceRefs: [],
      },
    ],
    arguments: [
      {
        id: "a1",
        text: "Der Beitrag fordert vergleichbare Standards entlang von Import und Export.",
        stance: "pro",
        supportsClaimIds: ["c1"],
      },
    ],
    openQuestions: [
      {
        id: "q1",
        question: "Welche Produkte, Länder, Standards und Kontrollmechanismen sind gemeint?",
        requiredBeforePublish: true,
      },
    ],
    sourceGrounding: [
      { id: "s1", label: "Ausgangstext", status: "source_text" },
      { id: "s2", label: "Link 1", status: "link_reference", detail: "https://example.org/tierwohl-standard" },
    ],
    topicSeed: {
      topicKey: "tierschutz-tierhaltung-und-agrarstandards",
      topicLabel: "Tierschutz, Tierhaltung und Agrarstandards",
      jurisdiction: "bund",
      themenradarSourceType: "create_intake",
    },
    resumeHref: "/create?resume=create_handoff&handoffId=dossier-handoff-1",
    reviewState: "ready_for_confirmation",
    requiresConfirmation: true,
    createdAt: "2026-05-10T10:00:00.000Z",
  }),
}));

import DossierIndexClient from "@/app/dossier/ui";
import { buildCreateHandoffTargetHref } from "@/features/create/createHandoff";

describe("create dossier handoff contract", () => {
  it("passes a handoff draft into dossier preparation and renders the handoff box", () => {
    const html = renderToStaticMarkup(
      React.createElement(DossierIndexClient, {
        handoffId: "dossier-handoff-1",
        createAction: "create_dossier",
        seedTopic: "Tierwohl",
      }),
    );
    const href = buildCreateHandoffTargetHref({
      baseHref: "/dossier",
      handoffId: "dossier-handoff-1",
      action: "create_dossier",
    });

    expect(href).toContain("handoffId=dossier-handoff-1");
    expect(html).toContain("Aus deinem Beitrag vorbereitet");
    expect(html).toContain("Keine automatische Anheftung an bestehende Dossiers");
    expect(html).toContain("requiresConfirmation");
    expect(html).toContain("Sichtbarkeit: privater Entwurf");
    expect(html).toContain("Topic-Key:");
    expect(html).toContain("https://example.org/tierwohl-standard");
    expect(html).toContain("In /create weiter bearbeiten");
  });
});
