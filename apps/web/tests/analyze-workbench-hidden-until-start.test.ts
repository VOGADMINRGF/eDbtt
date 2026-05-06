import { describe, expect, it } from "vitest";
import {
  CREATE_INTELLIGENT_FOLLOWUP_SECTION_LABELS,
  buildCreateLightweightFollowupSnapshot,
  buildCreatePrimaryIntakeStorageKey,
  buildGuidedWorkspaceText,
  parseCreatePrimaryIntakeSnapshot,
  resolveCreatePostStartSectionOrder,
  resolveFollowupSurfaceOnStart,
  shouldShowCreateFollowupQuestionCard,
  shouldRenderCreateIntelligentFollowup,
  shouldRenderCreateAnalyzeWorkspace,
  shouldShowCreatePostInputModules,
} from "@/app/create/CreateClient";
import { CREATE_VISUAL_FOLLOWUP_COPY } from "@/features/create/CreateVisualFollowup";

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
    expect(CREATE_INTELLIGENT_FOLLOWUP_SECTION_LABELS.connections).toBe(
      "Dort könnte dein Beitrag Wirkung bekommen",
    );
    expect(CREATE_INTELLIGENT_FOLLOWUP_SECTION_LABELS.voteNotice).toContain(
      "nicht automatisch abgegeben",
    );
    expect(CREATE_VISUAL_FOLLOWUP_COPY.graphTitle).toBe("Aus deinem Text entsteht diese Struktur");
    expect(CREATE_VISUAL_FOLLOWUP_COPY.confirmTitle).toBe("Stimmt diese Einordnung?");
    expect(CREATE_VISUAL_FOLLOWUP_COPY.guardrail).toContain("Keine automatische Veröffentlichung");
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
});
