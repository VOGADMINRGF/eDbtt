import { describe, expect, it } from "vitest";
import {
  buildCreatePrimaryIntakeStorageKey,
  buildGuidedWorkspaceText,
  parseCreatePrimaryIntakeSnapshot,
  shouldRenderCreateAnalyzeWorkspace,
  shouldShowCreatePostInputModules,
} from "@/app/create/CreateClient";

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
});
