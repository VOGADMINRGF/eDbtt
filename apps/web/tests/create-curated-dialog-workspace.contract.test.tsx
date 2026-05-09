import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
    expect(clientSource).toContain("embeddedWorkspace");
    expect(clientSource).toContain("max-w-6xl");
    expect(clientSource).toContain("color-mix(in_oklab,white_76%,rgb(var(--card))_24%)");
    expect(followupSource).toContain("create-chat-workspace");
    expect(followupSource).toContain("create-chat-spine");
    expect(followupSource).toContain("create-chat-message");
    expect(followupSource).toContain("UserContributionBubble");
    expect(followupSource).toContain("AssistantUnderstandingBubble");
    expect(followupSource).toContain("StructuredWorkstateBlock");
    expect(followupSource).toContain("StructureBranchList");
    expect(followupSource).toContain("StructureBranchCard");
    expect(followupSource).toContain("StructureOverviewRail");
    expect(followupSource).toContain("NextStepChecklist");
    expect(followupSource).toContain("FollowupActionRail");
    expect(followupSource).toContain("DetailsAccordion");
    expect(followupSource).toContain("Deine Struktur auf einen Blick");
    expect(followupSource).toContain("data-focus-card-overview");
    expect(followupSource).toContain("data-focus-card-rail");
    expect(followupSource).toContain("data-mobile-inline-create-actions");
    expect(followupSource).toContain("color-mix(in_oklab,white_58%,rgb(var(--card))_42%)");
    expect(followupSource).toContain("role=\"tabpanel\"");
    expect(followupSource).toContain("aria-controls={`create-overview-panel-${card.id}`}");
    expect(followupSource).toContain("aria-controls={`create-branch-panel-${branch.id}`}");
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
    expect(followupSource).toContain("Nächster Schritt");
    expect(followupSource).toContain("Vorgeschlagener Arbeitsstand");
    expect(followupSource).toContain("Prioritäten");
    expect(followupSource).toContain("Themencluster");
    expect(followupSource).toContain("Fragen & Abstimmung");
    expect(followupSource).toContain("Nächste Schritte");
    expect(followupSource).toContain("Strukturäste");
    expect(followupSource).toContain("Übergeordnetes Thema");
    expect(followupSource).toContain("Focus Card");
    expect(followupSource).toContain("Knapper Bedarf");
    expect(followupSource).toContain("Wichtigste Frage");
    expect(followupSource).toContain("resolveSaveActionLabel");
    expect(followupSource).toContain("Arbeitsstand gespeichert");
    expect(followupSource).toContain("Einordnung im Themenkatalog");
    expect(followupSource).toContain("Mögliche Aussagen");
    expect(followupSource).toContain("Offene Prüfpunkte");
    expect(followupSource).toContain("Ast bearbeiten");
    expect(followupSource).toContain("Weitere Details zum Ast");
    expect(followupSource).toContain("Schreib einfach weiter");
    expect(followupSource).toContain("Antwort fortsetzen");
    expect(followupSource).toContain("Ja, Struktur übernehmen");
    expect(followupSource).toContain("Arbeitsstand speichern");
    expect(followupSource).toContain("Faktencheck / Deep Search starten");
    expect(followupSource).toContain("Ändern");
    expect(followupSource).toContain("Original oben anzeigen");
    expect(followupSource).toContain("Keine automatische Stimme");
    expect(followupSource).toContain("Keine automatische Veröffentlichung");
    expect(followupSource).toContain("Keine automatische Kostenbuchung");
    expect(followupSource).not.toContain("Dossier-Kontext");
    expect(followupSource).not.toContain("Mögliche Claims");
    expect(followupSource).not.toContain("Für später speichern");
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

    const coreIndex = followupSource.indexOf(">Vorgeschlagener Arbeitsstand</p>");
    const overviewIndex = followupSource.indexOf("<StructureOverviewRail cards={overviewCards}");
    const confirmIndex = followupSource.indexOf("Bestätige den Vorschlag, ändere einzelne Punkte oder schreib einfach weiter.");
    const continueIndex = followupSource.indexOf("<ContinueWritingComposer");
    const detailsCallIndex = followupSource.lastIndexOf("<DetailsAccordion");
    const detailsIndex = followupSource.indexOf("Gelesene Sinnabschnitte");
    const impactIndex = followupSource.lastIndexOf("CREATE_VISUAL_FOLLOWUP_COPY.impactTitle");

    expect(coreIndex).toBeGreaterThan(-1);
    expect(overviewIndex).toBeGreaterThan(-1);
    expect(confirmIndex).toBeGreaterThan(-1);
    expect(continueIndex).toBeGreaterThan(-1);
    expect(detailsCallIndex).toBeGreaterThan(-1);
    expect(detailsIndex).toBeGreaterThan(-1);
    expect(impactIndex).toBeGreaterThan(-1);
    expect(coreIndex).toBeLessThan(confirmIndex);
    expect(overviewIndex).toBeGreaterThan(coreIndex);
    expect(confirmIndex).toBeLessThan(continueIndex);
    expect(continueIndex).toBeLessThan(detailsCallIndex);
    expect(detailsIndex).toBeLessThan(impactIndex);
    expect(followupSource).toContain("summary className=\"cursor-pointer");
    expect(followupSource).toContain("Wird erst nach deiner Bestätigung vorbereitet.");
    expect(followupSource).toContain("Guardrails bleiben kompakt sichtbar");
    expect(followupSource).toContain("Kann jetzt unter");
    expect(followupSource).not.toContain("Details zum Originaltext");
    expect(followupSource).not.toContain("Zusatzservices (optional)");
    expect(followupSource).not.toContain("bg-cyan-50/80");
    expect(followupSource).not.toContain("bg-white/94");
    expect(followupSource).not.toContain("bg-white/92");
  });

  it("keeps multi-topic branches in a focus-card selector instead of a long equal-weight list", () => {
    const followupSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"),
      "utf8",
    );
    const contractSource = readFileSync(
      resolve(process.cwd(), "src/features/create/intelligentFollowupContract.ts"),
      "utf8",
    );

    const contextIndex = followupSource.indexOf("Übergeordnetes Thema");
    const branchesIndex = followupSource.indexOf("<StructureBranchList");
    const branchActionIndex = followupSource.indexOf("Aussage ergänzen");
    const selectorIndex = followupSource.indexOf("data-focus-card-branch-selector");
    const detailIndex = followupSource.indexOf("data-focus-card-detail");

    expect(followupSource).toContain("buildCreateStructureBranches");
    expect(contractSource).toContain("part06CategoryKeys");
    expect(contractSource).toContain("part06CategoryLabels");
    expect(contractSource).toContain("topicTags");
    expect(contractSource).toContain("Wohnen und Genehmigungen");
    expect(contractSource).toContain("Verkehr, Klima und Alltagstauglichkeit");
    expect(contractSource).toContain("Bildung, Integration und Sicherheit");
    expect(contextIndex).toBeGreaterThan(-1);
    expect(branchesIndex).toBeGreaterThan(-1);
    expect(branchActionIndex).toBeGreaterThan(-1);
    expect(selectorIndex).toBeGreaterThan(-1);
    expect(detailIndex).toBeGreaterThan(-1);
    expect(contextIndex).toBeLessThan(branchesIndex);
    expect(followupSource).not.toContain("Dossier ansehen");
    expect(followupSource).not.toContain("Dossier ansehen pro Thema");
  });
});
