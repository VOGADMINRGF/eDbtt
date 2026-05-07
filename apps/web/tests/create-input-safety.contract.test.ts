import { describe, expect, it } from "vitest";
import {
  evaluateCreateInputSafety,
} from "@/features/create/safety/createInputSafety";
import { CREATE_SAFETY_STRESS_INPUT_DE } from "./fixtures/createSafetyStressInput.de";

describe("create input safety contract", () => {
  it("keeps broken civic german as revise/allow but not blocked", () => {
    const result = evaluateCreateInputSafety({
      text: "ich hab frage wegen bus und miete bitte hilfe wir sollten das klären",
      locale: "de",
    });
    expect(result.decision).not.toBe("blocked");
    expect(result.noAutoPublish).toBe(true);
    expect(result.noSilentMerge).toBe(true);
  });

  it("extracts a safe rewrite for long rambling civic input", () => {
    const result = evaluateCreateInputSafety({
      text: CREATE_SAFETY_STRESS_INPUT_DE,
      locale: "de",
    });
    expect(result.safeRewrite.length).toBeGreaterThan(20);
    expect(result.factCheckCandidates.length).toBeGreaterThan(0);
  });

  it("redacts self pii", () => {
    const result = evaluateCreateInputSafety({
      text: "Meine Mail ist max.mustermann@example.org und meine Nummer ist +49 171 1234567.",
      locale: "de",
    });
    expect(result.redactedText).not.toContain("example.org");
    expect(result.redactedText).toContain("[E-MAIL ENTFERNT]");
    expect(result.redactedText).toContain("[TELEFON ENTFERNT]");
  });

  it("flags third-party pii with call-to-action as blocked or moderation", () => {
    const result = evaluateCreateInputSafety({
      text: "Ruft ihn unter +49 171 9999999 an, er ist korrupt und wohnt in der Musterstraße 4.",
      locale: "de",
    });
    expect(["blocked", "moderation_required"]).toContain(result.decision);
  });

  it("classifies insult against administration as revise_required", () => {
    const result = evaluateCreateInputSafety({
      text: "Diese Verwaltung ist nur ein Haufen Idioten.",
      locale: "de",
    });
    expect(result.decision).toBe("revise_required");
  });

  it("classifies vague self-justice threat as moderation_required", () => {
    const result = evaluateCreateInputSafety({
      text: "Wenn nichts passiert, regeln wir das mit Selbstjustiz.",
      locale: "de",
    });
    expect(result.decision).toBe("moderation_required");
  });

  it("blocks concrete threat", () => {
    const result = evaluateCreateInputSafety({
      text: "Ich bringe dich um, wenn das so weitergeht.",
      locale: "de",
    });
    expect(result.decision).toBe("blocked");
  });

  it("marks investor/corruption/media-control allegation as factcheck_required", () => {
    const result = evaluateCreateInputSafety({
      text: "Die Presse schreibt nur für Investoren, das ist Korruption.",
      locale: "de",
    });
    expect(result.decision).toBe("factcheck_required");
  });

  it("marks unverified number as factcheck_required", () => {
    const result = evaluateCreateInputSafety({
      text: "Das kostet 40 Millionen, keine Ahnung ob die Zahl stimmt.",
      locale: "de",
    });
    expect(result.decision).toBe("factcheck_required");
  });

  it("does not treat political framing alone as factual block", () => {
    const result = evaluateCreateInputSafety({
      text: "Das wirkt wie typisches Lagerdenken der Altparteien.",
      locale: "de",
    });
    expect(result.decision).not.toBe("blocked");
    expect(result.decision).not.toBe("moderation_required");
  });

  it("flags mixed language as graph review risk without blocking by default", () => {
    const result = evaluateCreateInputSafety({
      text: "Wir brauchen bessere Lösungen in der Kommune, but the claim data is unclear.",
      locale: "de",
      contentLanguage: "de",
      sourceLanguage: "en",
    });
    expect(result.crossLingualRisk).toBe(true);
    expect(result.decision).toBe("graph_review_required");
  });
});
