import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createEmptyManualAnlassraumSetup,
  deriveManualAnlassraumSetupFromStartDraft,
  sanitizeManualAnlassraumSetup,
} from "@/features/surfaces/runden/manualAnlassraumSetup";

describe("start draft handoff targets contract", () => {
  it("derives an editable round draft with at least five options for clear schoolway issues", () => {
    const derived = deriveManualAnlassraumSetupFromStartDraft({
      text: "Bei uns fehlt ein sicherer Schulweg vor der Grundschule.",
      preview: {
        possibleTopics: ["Mobilität & öffentlicher Raum"],
        openQuestions: ["Welche Maßnahme hilft zuerst?"],
      },
    });

    const setup = sanitizeManualAnlassraumSetup({
      ...createEmptyManualAnlassraumSetup(),
      title: derived.title,
      votingQuestion: derived.votingQuestion,
      description: derived.description,
      options: derived.options,
    });

    expect(setup.title).toContain("Schulweg");
    expect(setup.votingQuestion).toContain("Welche Maßnahme");
    expect(setup.options.length).toBeGreaterThanOrEqual(5);
    expect(setup.options).toContain("Anderer Vorschlag");
  });

  it("wires draft-aware handoff surfaces into /create, /themen and /runden/new without auto-publish claims", () => {
    const createSource = readFileSync(resolve(process.cwd(), "src/app/create/CreateClient.tsx"), "utf8");
    const createRestoreSource = readFileSync(
      resolve(process.cwd(), "src/app/create/createStartDraftRestore.ts"),
      "utf8",
    );
    const createHandoffSource = readFileSync(
      resolve(process.cwd(), "src/app/create/CreateStartDraftHandoff.tsx"),
      "utf8",
    );
    const themenSource = readFileSync(resolve(process.cwd(), "src/app/themen/ThemenStartDraftAssistant.tsx"), "utf8");
    const rundenSource = readFileSync(resolve(process.cwd(), "src/app/runden/new/AnlassraumSetupForm.tsx"), "utf8");
    const statusSource = readFileSync(resolve(process.cwd(), "src/features/start/GlobalDraftStatusBar.tsx"), "utf8");
    const statusHelperSource = readFileSync(resolve(process.cwd(), "src/features/start/startDraftContext.ts"), "utf8");

    expect(createSource).toContain("CreateStartDraftHandoff");
    expect(createRestoreSource).toContain('getStartDraftForTarget("create")');
    expect(createHandoffSource).toContain("Es gibt bereits einen Entwurf");
    expect(createHandoffSource).toContain("Aus deiner Startseiten-Eingabe übernommen.");
    expect(createHandoffSource).toContain("GlobalDraftStatusBar");
    expect(themenSource).toContain('getStartDraftForTarget("themes")');
    expect(themenSource).toContain("Wir suchen Themen, an die dein Beitrag anknüpfen könnte.");
    expect(themenSource).toContain("Als neues Thema vorschlagen");
    expect(themenSource).toContain("Passende Themen anzeigen");
    expect(rundenSource).toContain('getStartDraftForTarget("rounds")');
    expect(rundenSource).toContain("Runde aus deinem Entwurf vorbereiten");
    expect(rundenSource).toContain("Optionen ergänzen");
    expect(statusSource).toContain("getStartDraftGuardrailSummary");
    expect(statusHelperSource).toContain("Noch nicht veröffentlicht");
    expect(statusHelperSource).toContain("Noch nicht zusammengeführt");
    expect(statusHelperSource).toContain("Noch keine Stimmen");
    expect(statusHelperSource).toContain("Keine automatische Prüfung");

    for (const source of [themenSource, rundenSource]) {
      expect(source).not.toContain("autoPublish");
      expect(source).not.toContain("DeepSearch");
      expect(source).not.toContain("orchestrator");
    }
    expect(createSource).not.toContain("callOpenAI");
    expect(createSource).not.toContain("recordSwipeVoteInGraph");
  });
});
