import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("branch workspace handoff contract", () => {
  it("offers all next-step work modes from the shared workspace chooser", () => {
    const chooserSource = readFileSync(
      resolve(process.cwd(), "src/features/start/StartDraftWorkspaceChooser.tsx"),
      "utf8",
    );

    expect(chooserSource).toContain("Was möchtest du als Nächstes tun?");
    expect(chooserSource).toContain("Arbeitsmodus");
  });

  it("wires preview and downstream surfaces into the same draft-aware work modes", () => {
    const startSource = readFileSync(
      resolve(process.cwd(), "src/features/start/LandingCreateLightEntry.tsx"),
      "utf8",
    );
    const createSource = readFileSync(
      resolve(process.cwd(), "src/app/create/CreateClient.tsx"),
      "utf8",
    );
    const createHandoffSource = readFileSync(
      resolve(process.cwd(), "src/app/create/CreateStartDraftHandoff.tsx"),
      "utf8",
    );
    const themenSource = readFileSync(
      resolve(process.cwd(), "src/app/themen/ThemenStartDraftAssistant.tsx"),
      "utf8",
    );
    const rundenSource = readFileSync(
      resolve(process.cwd(), "src/app/runden/new/AnlassraumSetupForm.tsx"),
      "utf8",
    );

    for (const source of [startSource, createHandoffSource, themenSource, rundenSource]) {
      expect(source).toContain("StartDraftWorkspaceChooser");
      expect(source).toContain("Beitrag ausarbeiten");
      expect(source).toContain("Passende Themen finden");
      expect(source).toContain("Runde vorbereiten");
      expect(source).toContain("Redaktionelle Prüfung anfragen");
      expect(source).toContain("Später weiterarbeiten");
      expect(source).not.toContain("DeepSearch");
      expect(source).not.toContain("recordSwipeVoteInGraph");
      expect(source).not.toContain("autoPublish");
    }

    expect(startSource).toContain('data-testid="start-create-light-editorial-mode"');
    expect(startSource).toContain('buildLandingEditorialReviewResumeHref()');
    expect(createSource).toContain("CreateStartDraftHandoff");
    expect(createHandoffSource).toContain('updateStartDraftContext({ targetHint: "themes" })');
    expect(createHandoffSource).toContain('updateStartDraftContext({ targetHint: "rounds" })');
    expect(themenSource).toContain('href: "/create?startDraft=1"');
    expect(rundenSource).toContain("Optionen weiterbearbeiten");
  });

  it("keeps the manual round path editable instead of turning it into a frozen vote flow", () => {
    const rundenSource = readFileSync(
      resolve(process.cwd(), "src/app/runden/new/AnlassraumSetupForm.tsx"),
      "utf8",
    );
    const manualSetupSource = readFileSync(
      resolve(process.cwd(), "src/features/surfaces/runden/manualAnlassraumSetup.ts"),
      "utf8",
    );

    expect(rundenSource).toContain("Runde vorbereiten");
    expect(manualSetupSource).toContain("Anderer Vorschlag");
    expect(manualSetupSource).not.toContain("publishedAt:");
    expect(manualSetupSource).not.toContain("voteNow");
  });
});
