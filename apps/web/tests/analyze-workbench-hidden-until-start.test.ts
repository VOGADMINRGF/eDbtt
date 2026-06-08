import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CREATE_INTELLIGENT_FOLLOWUP_SECTION_LABELS,
  buildCreateLightweightFollowupSnapshot,
  buildCreatePrimaryIntakeStorageKey,
  buildGuidedWorkspaceText,
  hasPrimaryIntakeText,
  parseCreatePrimaryIntakeSnapshot,
  resolveCreatePostStartSectionOrder,
  resolveFollowupSurfaceOnStart,
  shouldShowCreateFollowupQuestionCard,
  shouldRenderCreateIntelligentFollowup,
  shouldRenderCreateAnalyzeWorkspace,
  shouldShowCreatePostInputModules,
} from "@/app/create/CreateClient";
import { CREATE_VISUAL_FOLLOWUP_COPY } from "@/features/create/CreateVisualFollowup";
import { detectCreateLinkIntake } from "@/features/create/linkIntake";

describe("analyze workbench progressive disclosure", () => {
  it("keeps post-input modules hidden before explicit start", () => {
    expect(
      shouldShowCreatePostInputModules({
        hasStarted: false,
        intakeText: "Vollständiger Beitrag",
      }),
    ).toBe(false);
  });

  it("shows post-input modules only after start with non-empty text", () => {
    expect(
      shouldShowCreatePostInputModules({
        hasStarted: true,
        intakeText: "Vollständiger Beitrag",
      }),
    ).toBe(true);
    expect(hasPrimaryIntakeText(" https://youtu.be/demo123 ")).toBe(true);
  });

  it("keeps post-input modules visible for material-backed create runs even with minimal freetext", () => {
    expect(
      shouldShowCreatePostInputModules({
        hasStarted: true,
        intakeText: "",
        hasMaterialContext: true,
      }),
    ).toBe(true);
  });

  it("classifies link-only intake separately from link-plus-context input", () => {
    const linkOnly = detectCreateLinkIntake("https://youtu.be/demo123");
    expect(linkOnly.hasLink).toBe(true);
    expect(linkOnly.mostlyLinkOnly).toBe(true);

    const linkWithContext = detectCreateLinkIntake(
      "Bitte prüft diesen Artikel zur Schulwegsicherheit und die Aussage zur Finanzierung: https://example.com/artikel",
    );
    expect(linkWithContext.hasLink).toBe(true);
    expect(linkWithContext.mostlyLinkOnly).toBe(false);
  });

  it("keeps guided analyze workspace hidden until guided bridge is confirmed", () => {
    expect(
      shouldRenderCreateAnalyzeWorkspace({
        followupActivated: true,
        hasStarted: true,
        intakeText: "Vollständiger Beitrag",
        productMode: "guided",
        guidedBridgeConfirmed: false,
      }),
    ).toBe(false);
    expect(
      shouldRenderCreateAnalyzeWorkspace({
        followupActivated: true,
        hasStarted: true,
        intakeText: "Vollständiger Beitrag",
        productMode: "guided",
        guidedBridgeConfirmed: true,
      }),
    ).toBe(true);
  });

  it("builds guided workspace text with bridge answer only after confirmation", () => {
    expect(
      buildGuidedWorkspaceText({
        intakeText: "Ausgangstext",
        guidedBridgeAnswer: "",
      }),
    ).toBe("Ausgangstext");

    expect(
      buildGuidedWorkspaceText({
        intakeText: "Ausgangstext",
        guidedBridgeAnswer: "Kernkonflikt und Entscheidungspunkt.",
      }),
    ).toContain("Geführter Fokus");

    expect(
      buildGuidedWorkspaceText({
        intakeText: "Seed text",
        guidedBridgeAnswer: "Clarify the pending trade-off.",
        guidedWorkspacePrefix: "Guided focus",
      }),
    ).toContain("Guided focus");
  });

  it("uses stable per-user local draft keys for primary intake persistence", () => {
    expect(buildCreatePrimaryIntakeStorageKey("user-1")).toBe("vog_create_primary_intake_v1:user-1");
    expect(buildCreatePrimaryIntakeStorageKey("")).toBe("vog_create_primary_intake_v1:anon");
    expect(buildCreatePrimaryIntakeStorageKey(null)).toBe("vog_create_primary_intake_v1:anon");
  });

  it("parses valid primary intake snapshots and ignores empty/no-op payloads", () => {
    const parsed = parseCreatePrimaryIntakeSnapshot(
      JSON.stringify({
        intakeText: "Beitrag bleibt erhalten",
        hasStarted: true,
        updatedAt: "2026-04-22T10:00:00.000Z",
      }),
    );
    expect(parsed).toMatchObject({
      intakeText: "Beitrag bleibt erhalten",
      hasStarted: true,
      updatedAt: "2026-04-22T10:00:00.000Z",
    });

    const ignored = parseCreatePrimaryIntakeSnapshot(
      JSON.stringify({
        intakeText: "   ",
        hasStarted: false,
      }),
    );
    expect(ignored).toBeNull();
  });

  it("keeps analyze workspace hidden until follow-up explicitly activates review", () => {
    expect(
      shouldRenderCreateAnalyzeWorkspace({
        followupActivated: false,
        hasStarted: true,
        intakeText: "Persistierter Beitrag",
        productMode: "analyze",
        guidedBridgeConfirmed: true,
      }),
    ).toBe(false);
    expect(
      shouldRenderCreateAnalyzeWorkspace({
        followupActivated: true,
        hasStarted: true,
        intakeText: "Persistierter Beitrag",
        productMode: "media",
        guidedBridgeConfirmed: true,
      }),
    ).toBe(true);
    expect(
      shouldRenderCreateAnalyzeWorkspace({
        followupActivated: true,
        hasStarted: true,
        intakeText: "",
        hasMaterialContext: true,
        productMode: "media",
        guidedBridgeConfirmed: true,
      }),
    ).toBe(true);
  });

  it("maps mode-specific follow-up surfaces so Beitragen stays lightweight by default", () => {
    expect(resolveFollowupSurfaceOnStart("analyze")).toBe("lightweight");
    expect(resolveFollowupSurfaceOnStart("media")).toBe("analysis");
    expect(resolveFollowupSurfaceOnStart("guided")).toBe("none");

    expect(
      shouldRenderCreateAnalyzeWorkspace({
        followupActivated: resolveFollowupSurfaceOnStart("analyze") === "analysis",
        hasStarted: true,
        intakeText: "Beitragstext",
        productMode: "analyze",
        guidedBridgeConfirmed: true,
      }),
    ).toBe(false);
  });

  it("builds a lightweight follow-up snapshot with original text and understandable classification", () => {
    const snapshot = buildCreateLightweightFollowupSnapshot({
      intakeText: "  Neuer Radweg entlang der Schule  ",
      modeLabel: "Beitragen",
      contextAnchorLabel: "Offene Frage",
      surfaceTexts: {
        followupUnderstandingLine: (label) => `Eingeordnet als: ${label}`,
      },
    });

    expect(snapshot.originalText).toBe("Neuer Radweg entlang der Schule");
    expect(snapshot.understandingLine).toBe("Eingeordnet als: Offene Frage");
  });

  it("keeps intelligent follow-up hidden before start and shows it after start in Beitragen mode", () => {
    expect(
      shouldRenderCreateIntelligentFollowup({
        hasStarted: false,
        productMode: "analyze",
        followup: null,
      }),
    ).toBe(false);

    expect(
      shouldRenderCreateIntelligentFollowup({
        hasStarted: true,
        productMode: "analyze",
        followup: {
          understanding: {
            summary: "Kurzfassung",
            categories: [],
            topics: [],
            statements: [],
            scopes: ["unclear"],
            confidence: "low",
          },
          suggestions: [],
          sourceText: "Text",
          generatedAt: "2026-05-05T00:00:00.000Z",
        },
      }),
    ).toBe(true);
    expect(CREATE_INTELLIGENT_FOLLOWUP_SECTION_LABELS.understanding).toBe(
      "eDebatte hat deinen Beitrag strukturiert",
    );
    expect(CREATE_INTELLIGENT_FOLLOWUP_SECTION_LABELS.connections).toBe("Passende nächste Schritte");
    expect(CREATE_INTELLIGENT_FOLLOWUP_SECTION_LABELS.voteNotice).toContain(
      "nicht automatisch abgegeben",
    );
    expect(CREATE_VISUAL_FOLLOWUP_COPY.structureTitle).toBe("Vorläufig verstanden");
    expect(CREATE_VISUAL_FOLLOWUP_COPY.coreTitle).toBe("Kern erkannt");
    expect(CREATE_VISUAL_FOLLOWUP_COPY.graphTitle).toBe("So könnte der Arbeitsstand aussehen");
    expect(CREATE_VISUAL_FOLLOWUP_COPY.confirmTitle).toBe("Wie möchtest du weitergehen?");
    expect(CREATE_VISUAL_FOLLOWUP_COPY.guardrail).toContain("Keine automatische Veröffentlichung");
    expect(CREATE_VISUAL_FOLLOWUP_COPY.freeWriteHint).toContain("Schreib einfach weiter");
    expect(CREATE_VISUAL_FOLLOWUP_COPY.pendingPreparationHint).toContain("Nach deiner Bestätigung");
    expect(Object.values(CREATE_VISUAL_FOLLOWUP_COPY).join(" ")).not.toContain("Systemprüfung");
  });

  it("hides legacy follow-up question card in Beitragen mode after start", () => {
    expect(
      shouldShowCreateFollowupQuestionCard({
        showPostInputModules: true,
        productMode: "analyze",
      }),
    ).toBe(false);
    expect(
      shouldShowCreateFollowupQuestionCard({
        showPostInputModules: true,
        productMode: "media",
      }),
    ).toBe(true);
  });

  it("keeps intelligent response before legacy post-start modules in section order", () => {
    const order = resolveCreatePostStartSectionOrder({
      showIntelligentFollowup: true,
      showPostInputModules: true,
      showFollowupQuestionCard: false,
      pickerEnabled: true,
    });
    expect(order[0]).toBe("intelligent-followup");
    expect(order).not.toContain("followup-question");
  });

  it("keeps visual follow-up light/dark readable and sticky action wording", () => {
    const clientSource = readFileSync(
      resolve(process.cwd(), "src/app/create/CreateClient.tsx"),
      "utf8",
    );
    const workspaceSource = readFileSync(
      resolve(process.cwd(), "src/components/analyze/AnalyzeWorkspace.tsx"),
      "utf8",
    );
    const linkIntakeSource = readFileSync(
      resolve(process.cwd(), "src/features/create/linkIntake.ts"),
      "utf8",
    );
    const source = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"),
      "utf8",
    );
    expect(clientSource).toContain("CreateLinkIntakeClarification");
    expect(clientSource).toContain("buildCreateLinkSourceNotice");
    expect(linkIntakeSource).toContain("Der Link bleibt vorerst ein Quellenhinweis. Der Inhalt wurde noch nicht automatisch ausgewertet.");
    expect(source).toContain("UserContributionBubble");
    expect(source).toContain("AssistantUnderstandingBubble");
    expect(source).toContain("StructuredWorkstateBlock");
    expect(source).toContain("StructureProposalPanel");
    expect(source).toContain("NextStepPanel");
    expect(source).toContain("create-chat-workspace");
    expect(source).toContain("create-chat-spine");
    expect(source).toContain("create-chat-message");
    expect(source).toContain("Du");
    expect(source).toContain("eDebatte");
    expect(source).toContain("Wie möchtest du tiefer ins Thema gehen?");
    expect(source).toContain("Ja, so einreichen");
    expect(source).toContain("Ich möchte tiefer ins Thema");
    expect(source).toContain("Redaktionell prüfen lassen");
    expect(source).toContain("Deine Struktur auf einen Blick");
    expect(source).toContain("data-structure-overview-grid");
    expect(source).toContain("mt-4 grid gap-2 md:grid-cols-3");
    expect(source).toContain("Fragen & Abstimmung");
    expect(source).toContain("Gelesene Sinnabschnitte");
    expect(source).toContain("Welche kommunalen Prioritäten sollen zuerst bearbeitet werden?");
    expect(source).toContain("Faktencheck / Deep Search");
    expect(source).not.toContain("Details zum Originaltext");
    expect(source).toContain("Gelesene Sinnabschnitte");
    expect(source).toContain("Original oben anzeigen");
    expect(source).not.toContain("Was ich nach deiner Bestätigung vorbereiten kann");
    expect(source).toContain("Keine automatische Stimme.");
    expect(source).toContain("Keine automatische Veröffentlichung.");
    expect(source).toContain("Keine automatische Kostenbuchung.");
    expect(source).toContain("Änderungsvorschläge werden zur Prüfung vorbereitet.");
    expect(source).toContain("Abstimmungsfrage bearbeiten");
    expect(source).toContain("Thema ändern");
    expect(source).toContain("Haltung ändern");
    expect(source).toContain("Ebene ändern");
    expect(source).toContain("welchen nächsten Schritt ich anpassen soll");
    expect(source).toContain("welche Quelle noch fehlt");
    expect(source).toContain("Schreib einfach weiter");
    expect(source).toContain("Antwort fortsetzen");
    expect(clientSource).toContain("setChatContinuationText");
    expect(clientSource).toContain("handleContinueConversation");
    expect(clientSource).toContain("CreateInlineAnalysisScene");
    expect(clientSource).toContain("Prüfmodus jetzt im selben Arbeitsraum geöffnet.");
    expect(workspaceSource).toContain("shouldRenderCompactEmbeddedWorkspaceHeader");
    expect(workspaceSource).toContain("shouldUseInlineCreateActionBar");
    expect(workspaceSource).toContain("Im selben Arbeitsraum");
    expect(workspaceSource).toContain("lg:sticky lg:bottom-3");
    expect(clientSource).not.toContain("details className=\"rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4\">\n          <summary className=\"cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]\">{text.quotasTitle}</summary>");
    const handoffSource = readFileSync(
      resolve(process.cwd(), "src/app/create/CreateStartDraftHandoff.tsx"),
      "utf8",
    );
    const nextActionGateSource = readFileSync(
      resolve(process.cwd(), "src/app/create/CreateDraftNextActionGate.tsx"),
      "utf8",
    );
    expect(clientSource).toContain("CreateStartDraftHandoff");
    expect(handoffSource).toContain('href: "/account"');
    expect(nextActionGateSource).toContain("data-testid=\"create-draft-next-action-gate\"");
    expect(source).not.toContain("Für später speichern");
    expect(source).not.toContain("Dossiers & Abstimmungen ansehen");
    expect(source).not.toContain("Zusatzservices (optional)");
    expect(source).not.toContain("Nicht passend");
    expect(source).toContain("dedupeCreateFollowupSections");
    expect(source).toContain("Redaktionelle Prüfung anfragen");
    expect(source).toContain("disabled:cursor-not-allowed");
    expect(source).not.toContain("bg-cyan-50/80");
    expect(source).toContain("dark:bg-[rgb(var(--card))]");
    expect(source).toContain("border-cyan-500/35 bg-cyan-50 text-cyan-950");
    expect(source).toContain("dark:border-cyan-300/60 dark:bg-cyan-500/15 dark:text-cyan-50");
    expect(source).not.toContain("Dossier-Kontext / Oberthema");
    expect(source).not.toContain("Mögliche Claims");
    expect(source).not.toContain("topics.slice(0, 6)");
    expect(source).toContain("resultChangeKey");
    expect(source).toContain("setActiveFocusArea(initialFocusArea)");
    expect(source).toContain("resolveNextIndexFromKey");
    expect(source).toContain("role=\"tablist\"");
    expect(source).toContain("role=\"tabpanel\"");
    expect(source).toContain("color-mix(in_oklab,white_58%,rgb(var(--card))_42%)");
    expect(source).toContain("data-mobile-inline-create-actions");
    expect(source).not.toContain("data-mobile-sticky-create-actions");
    expect(source).not.toContain('className="text-cyan-50"');
    expect(source).not.toContain("bg-white/94");
    expect(source).not.toContain("Abschnitt 1");
    expect(source).not.toContain("Teil 1");
  });

  it("keeps create entry mode selection optional instead of dominant first view", () => {
    const clientSource = readFileSync(resolve(process.cwd(), "src/app/create/CreateClient.tsx"), "utf8");
    const composerSource = readFileSync(resolve(process.cwd(), "src/features/create/SharedCreateComposer.tsx"), "utf8");
    expect(clientSource).toContain("collapseModeSelector");
    expect(clientSource).toContain("create-dialog-workspace");
    expect(clientSource).toContain("embeddedWorkspace");
    expect(clientSource).toContain("create-start-chat-preview");
    expect(composerSource).toContain("alternateModeLabel");
    expect(composerSource).toContain("attachmentsDisclosureLabel");
  });

  it("makes review request and factcheck paths explicit in the create client", () => {
    const clientSource = readFileSync(resolve(process.cwd(), "src/app/create/CreateClient.tsx"), "utf8");
    expect(clientSource).toContain("/api/create/save");
    expect(clientSource).toContain("manualReviewRequested");
    expect(clientSource).toContain("Arbeitsstand zur Prüfung vorgemerkt. Keine automatische Veröffentlichung.");
    expect(clientSource).toContain("Prüfmodus geöffnet. Faktencheck / Deep Search startet erst nach deiner weiteren Bestätigung.");
    expect(clientSource).toContain("setReviewRequestState(\"saving\")");
    expect(clientSource).toContain("setFactcheckMessage(");
  });
});
