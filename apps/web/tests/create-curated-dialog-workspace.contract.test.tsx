import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import CreateVisualFollowup from "@/features/create/CreateVisualFollowup";

const FOLLOWUP_RESULT = {
  understanding: {
    summary: "Du möchtest sichere Schulwege im Quartier verbessern.",
    dossierContext: "Sichere Schulwege",
    categories: [{ id: "hint", label: "Hinweis", confidence: "high" as const }],
    topics: [
      { id: "mobility", label: "Mobilität & Stadtentwicklung", confidence: "high" as const },
      { id: "community", label: "Kommunales & Lebensumfeld", confidence: "medium" as const },
    ],
    statements: [
      {
        id: "s1",
        text: "Vor der Schule fehlen sichere Querungen und klare Tempo-30-Kontrollen.",
        kind: "demand" as const,
        stance: "pro" as const,
        confidence: "high" as const,
      },
    ],
    scopes: ["district" as const],
    confidence: "high" as const,
  },
  suggestions: [
    {
      id: "dossier:auto",
      kind: "dossier" as const,
      title: "Sichere Schulwege",
      reason: "Das Thema passt zu einem bestehenden Arbeitsstand.",
      confidence: "high" as const,
      href: "/dossier?topic=schulwege",
      requiresConfirmation: true as const,
    },
  ],
  sourceText: "Vor der Schule fehlen sichere Querungen und klare Tempo-30-Kontrollen.",
  generatedAt: "2026-05-10T12:00:00.000Z",
};

describe("create curated dialog workspace contract", () => {
  it("keeps composer and curated dialog follow-up in a single flow", () => {
    const clientSource = readFileSync(
      resolve(process.cwd(), "src/app/create/CreateClient.tsx"),
      "utf8",
    );
    const followupSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"),
      "utf8",
    );
    const linkClarificationSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateLinkIntakeClarification.tsx"),
      "utf8",
    );
    const linkIntakeSource = readFileSync(
      resolve(process.cwd(), "src/features/create/linkIntake.ts"),
      "utf8",
    );

    expect(clientSource).toContain("SharedCreateComposer");
    expect(clientSource).toContain("CreateVisualFollowup");
    expect(clientSource).toContain("CreateLinkIntakeClarification");
    expect(clientSource).toContain("create-dialog-workspace");
    expect(clientSource).toContain("create-start-chat-preview");
    expect(clientSource).toContain("CreateSubmittedContributionBubble");
    expect(clientSource).toContain("CreateAssistantStatusBubble");
    expect(clientSource).toContain("CreateStructureOverview");
    expect(clientSource).toContain("deriveCreateStructureOverviewMetrics");
    expect(clientSource).toContain("embeddedWorkspace");
    expect(clientSource).toContain("experienceVariant=\"create_minimal\"");
    expect(clientSource).toContain("What is on your mind?");
    expect(clientSource).toContain("create-public-shell create-dialog-workspace public-dialog-surface");
    expect(followupSource).toContain("create-chat-workspace");
    expect(followupSource).toContain("CreateStructureOverviewCard");
    expect(followupSource).toContain("CreateStructureOverview");
    expect(followupSource).toContain("UserContributionBubble");
    expect(followupSource).toContain("AssistantUnderstandingBubble");
    expect(followupSource).toContain("DialogResultsHandoffPanel");
    expect(followupSource).toContain("ExistingTopicMatchesPanel");
    expect(followupSource).toContain("CreateHandoffDraftSummary");
    expect(followupSource).toContain("CompactPreviewCard");
    expect(followupSource).toContain("PlaceClarificationPanel");
    expect(followupSource).toContain("StructureProposalPanel");
    expect(followupSource).toContain("NextStepPanel");
    expect(followupSource).toContain("StructuredWorkstateBlock");
    expect(followupSource).toContain("data-mobile-compact-details");
    expect(followupSource).toContain("Deine Struktur auf einen Blick");
    expect(followupSource).toContain("data-structure-overview-grid");
    expect(followupSource).toContain("flex flex-wrap items-center gap-2.5");
    expect(followupSource).toContain("data-mobile-inline-create-actions");
    expect(linkClarificationSource).toContain("Ich habe einen Quellenhinweis erkannt. Was soll ich daraus vorbereiten?");
    expect(linkClarificationSource).toContain("create-chat-message");
    expect(linkClarificationSource).toContain("eDebatte");
    expect(linkIntakeSource).toContain("Als Quelle vormerken");
  });

  it("renders dialog roles and keeps primary action explicit", () => {
    const followupSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"),
      "utf8",
    );
    const linkClarificationSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateLinkIntakeClarification.tsx"),
      "utf8",
    );

    expect(followupSource).toContain("Du");
    expect(followupSource).toContain("eDebatte");
    expect(followupSource).toContain("Haben wir dich richtig verstanden?");
    expect(followupSource).toContain("Kern");
    expect(followupSource).toContain("Thema");
    expect(followupSource).toContain("Noch offen");
    expect(followupSource).toContain("Details ansehen");
    expect(followupSource).toContain("Ja, so einreichen");
    expect(followupSource).toContain("Ich möchte tiefer ins Thema");
    expect(followupSource).toContain("Alle Themen vertiefen");
    expect(followupSource).toContain("Später im Account weiterarbeiten");
    expect(followupSource).toContain("Redaktionell prüfen lassen");
    expect(followupSource).toContain("Factcheck / Quellenprüfung vorbereiten");
    expect(followupSource).toContain("QR-/Live-Kontext vorbereiten");
    expect(followupSource).toContain("queuePreparedHandoffDraftForReview");
    expect(followupSource).toContain("Ändern");
    expect(followupSource).toContain("Keine automatische Stimme");
    expect(followupSource).toContain("Keine automatische Veröffentlichung");
    expect(followupSource).toContain("Keine automatische Kostenbuchung");
    expect(followupSource).toContain("setPreparedHandoffDraft");
    expect(followupSource).not.toContain("Dossier-Kontext");
    expect(followupSource).not.toContain("Mögliche Claims");
    expect(followupSource).not.toContain("Arbeitsstand speichern");
    expect(followupSource).not.toContain("Dossiers & Abstimmungen ansehen");
    expect(followupSource).not.toContain("Nicht passend");
    expect(linkClarificationSource).toContain("YouTube-Link erkannt.");
    expect(linkClarificationSource).toContain("Ich bereite diesen nächsten Schritt vor. Der Inhalt wurde noch nicht automatisch ausgewertet.");
  });

  it("keeps details progressively disclosed after the core workstate", () => {
    const followupSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"),
      "utf8",
    );
    const html = renderToStaticMarkup(
      <CreateVisualFollowup
        result={FOLLOWUP_RESULT}
        onConfirm={() => {}}
        onEdit={() => {}}
        onPrepareSubmission={() => {}}
        onPrepareAnlassraum={() => {}}
        onOpenDossierAppend={() => {}}
        onOpenDossierCreate={() => {}}
        onPrepareVote={() => {}}
        onRequestEditorialReview={() => {}}
        onStartOptionalService={() => {}}
        onSaveOnly={() => {}}
        continuationValue=""
        onContinuationChange={() => {}}
        onContinueConversation={() => {}}
      />,
    );

    const coreIndex = followupSource.indexOf("Haben wir dich richtig verstanden?");
    const confirmIndex = followupSource.indexOf("Ja, so einreichen");
    const detailsToggleIndex = followupSource.indexOf("Details ansehen");
    const continueIndex = followupSource.indexOf("<ContinueWritingComposer");
    const detailsIndex = followupSource.indexOf("<StructuredWorkstateBlock");

    expect(coreIndex).toBeGreaterThan(-1);
    expect(confirmIndex).toBeGreaterThan(-1);
    expect(detailsToggleIndex).toBeGreaterThan(-1);
    expect(continueIndex).toBeGreaterThan(-1);
    expect(detailsIndex).toBeGreaterThan(-1);
    expect(coreIndex).toBeLessThan(confirmIndex);
    expect(detailsToggleIndex).toBeGreaterThan(confirmIndex);
    expect(detailsIndex).toBeGreaterThan(detailsToggleIndex);
    expect(html).toContain("Details ansehen");
    expect(html).toContain("Was eDebatte bisher aus deinem Beitrag erkennt");
    expect(html).toContain("Dazu gibt es bereits ähnliche Themen");
    expect(html).not.toContain("Du/eDebatte-Protokoll");
    expect(html).not.toContain("Original oben anzeigen");
    expect(html).not.toContain("Vorgeschlagener Arbeitsstand");
    expect(html).not.toContain("Kompakte Details");
    expect(followupSource).toContain("aria-expanded={detailsOpen}");
    expect(followupSource).toContain("{detailsOpen ? (");
    expect(followupSource).toContain("lg:hidden");
    expect(followupSource).toContain("hidden lg:block");
  });

  it("keeps the heavy structure explorer behind the explicit details toggle", () => {
    const followupSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"),
      "utf8",
    );
    const clientSource = readFileSync(
      resolve(process.cwd(), "src/app/create/CreateClient.tsx"),
      "utf8",
    );
    const contractSource = readFileSync(
      resolve(process.cwd(), "src/features/create/intelligentFollowupContract.ts"),
      "utf8",
    );

    expect(followupSource).toContain("buildCreateStructureBranches");
    expect(contractSource).toContain("part06CategoryKeys");
    expect(contractSource).toContain("part06CategoryLabels");
    expect(contractSource).toContain("topicTags");
    expect(contractSource).toContain("Wohnen und Genehmigungen");
    expect(contractSource).toContain("Verkehr, Klima und Alltagstauglichkeit");
    expect(contractSource).toContain("Bildung, Integration und Sicherheit");
    expect(followupSource).toContain("<StructuredWorkstateBlock");
    expect(followupSource).toContain("data-mobile-compact-details");
    expect(followupSource).not.toContain("result.clarifications");
    expect(followupSource).not.toContain("qualityGate");
    expect(followupSource).not.toContain("editorial_review_required");
    expect(followupSource).not.toContain("editorial_review_requested");
    expect(clientSource).not.toContain("qualityGate");
    expect(clientSource).not.toContain("editorial_review_requested");
    expect(clientSource).not.toContain("result.clarifications");
    expect(contractSource).not.toContain("CreateInputSafetyClarification");
    expect(contractSource).not.toContain("CreateInputSafetyQualityGate");
    expect(followupSource).not.toContain("Dossier ansehen");
    expect(followupSource).not.toContain("Dossier ansehen pro Thema");
  });

  it("keeps tab controls aligned with persistent tabpanels", () => {
    const followupSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"),
      "utf8",
    );

    expect(followupSource).toContain("aria-controls={`create-branch-panel-${branch.id}`}");
    expect(followupSource).toContain("id={`create-branch-panel-${branch.id}`}");
    expect(followupSource).toContain("hidden={!isActive}");
    expect(followupSource).toContain("aria-controls={`create-overview-panel-${card.id}`}");
    expect(followupSource).toContain("id={`create-overview-panel-${focusArea}`}");
    expect(followupSource).toContain("{FOCUS_AREA_ORDER.map((focusArea) => {");
  });
});
