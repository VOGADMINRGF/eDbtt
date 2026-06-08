import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("closed cosmos ux audit contract", () => {
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
  const accountSource = readFileSync(
    resolve(process.cwd(), "src/app/account/AccountResumeWorkbenchSection.tsx"),
    "utf8",
  );

  it("keeps the same draft-first status language across start, create, themes, rounds and account", () => {
    expect(startSource).toContain("Noch nicht veröffentlicht");
    expect(startSource).toContain("Zur redaktionellen Prüfung geben");

    expect(createSource).toContain("CreateStartDraftHandoff");
    expect(createHandoffSource).toContain("Aus deiner Startseiten-Eingabe übernommen");
    expect(createSource).toContain("Arbeitsstand gesichert. Noch nicht veröffentlicht.");
    expect(createSource).toContain("Arbeitsstand zur Prüfung vorgemerkt. Keine automatische Veröffentlichung.");

    expect(themenSource).toContain("Wir suchen Themen, an die dein Beitrag anknüpfen könnte.");
    expect(themenSource).toContain("Als neues Thema vorschlagen");

    expect(rundenSource).toContain("Runde aus deinem Entwurf vorbereiten");
    expect(rundenSource).toContain("Dein lokal gesicherter Entwurf wurde wieder geöffnet.");

    expect(accountSource).toContain("Meine Arbeitsstände");
    expect(accountSource).toContain("lokale und dauerhaft gesicherte Entwürfe");
    expect(accountSource).toContain("Lokaler Entwurf");
    expect(accountSource).toContain("Weiterarbeiten");
  });

  it("avoids drift into auto-process, publish or misleading submission wording on the audited surfaces", () => {
    for (const source of [startSource, createSource, themenSource, rundenSource, accountSource]) {
      expect(source).not.toContain("DeepSearch");
      expect(source).not.toContain("recordSwipeVoteInGraph");
      expect(source).not.toContain("autoPublish");
    }

    expect(createSource).not.toContain("Arbeitsstand eingereicht");
    expect(createSource).not.toContain("Eingereicht, aber noch nicht veröffentlicht");
    expect(createSource).not.toContain("autoRunOrchestrator");
  });

  it("keeps the work mode switch available across the audited surfaces without text-loss framing", () => {
    for (const source of [startSource, createHandoffSource, themenSource, rundenSource]) {
      expect(source).toContain("StartDraftWorkspaceChooser");
      expect(source).toContain("Beitrag ausarbeiten");
      expect(source).toContain("Passende Themen finden");
      expect(source).toContain("Runde vorbereiten");
      expect(source).toContain("Redaktionelle Prüfung anfragen");
      expect(source).toContain("Später weiterarbeiten");
    }
  });
});
