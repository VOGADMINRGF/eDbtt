import { describe, expect, it } from "vitest";
import {
  collectCreateSafetyLexicon,
  redactCreateSafetySensitiveText,
} from "@/features/create/safety/createSafetyLexicon";
import { CREATE_SAFETY_ADVERSARIAL_FIXTURES } from "./fixtures/createSafetyAdversarialFixtures";

describe("create input safety lexicon contract", () => {
  it("detects doxxing-adjacent pii and call-to-action markers", () => {
    const lexicon = collectCreateSafetyLexicon(
      CREATE_SAFETY_ADVERSARIAL_FIXTURES.thirdPartyPiiAccusation,
    );

    expect(lexicon.phones.length).toBeGreaterThan(0);
    expect(lexicon.streetAddresses.length).toBeGreaterThan(0);
    expect(lexicon.callToActionMatches.length).toBeGreaterThan(0);
    expect(lexicon.corruptionOrCaptureClaimMatches.length).toBeGreaterThan(0);
  });

  it("detects verification framing separately from allegation signals", () => {
    const lexicon = collectCreateSafetyLexicon(
      CREATE_SAFETY_ADVERSARIAL_FIXTURES.safeQuestionOnUnsafeClaim,
    );

    expect(lexicon.corruptionOrCaptureClaimMatches.length).toBeGreaterThan(0);
    expect(lexicon.questionMatches.length).toBeGreaterThan(0);
    expect(lexicon.evidenceMatches.length).toBeGreaterThan(0);
  });

  it("flags placeholder language hints without assuming german-only safety", () => {
    const lexicon = collectCreateSafetyLexicon(CREATE_SAFETY_ADVERSARIAL_FIXTURES.arPlaceholder);
    expect(lexicon.languageRiskHints).toContain("ar");
  });

  it("detects vague local context and editorial review requests without requiring exact private addresses", () => {
    const localLexicon = collectCreateSafetyLexicon(CREATE_SAFETY_ADVERSARIAL_FIXTURES.vagueOwnStreet);
    const editorialLexicon = collectCreateSafetyLexicon(
      CREATE_SAFETY_ADVERSARIAL_FIXTURES.editorialReviewRequested,
    );

    expect(localLexicon.vaguePlaceMatches.length).toBeGreaterThan(0);
    expect(localLexicon.privateAddressRiskMatches.length).toBeGreaterThan(0);
    expect(localLexicon.streetAddresses).toHaveLength(0);
    expect(editorialLexicon.editorialReviewRequestMatches.length).toBeGreaterThan(0);
  });

  it("redaction is idempotent and removes raw contact fragments", () => {
    const once = redactCreateSafetySensitiveText(
      CREATE_SAFETY_ADVERSARIAL_FIXTURES.thirdPartyPiiAccusation,
    );
    const twice = redactCreateSafetySensitiveText(once);

    expect(once).toContain("[TELEFON ENTFERNT]");
    expect(once).toContain("[ADRESSE ENTFERNT]");
    expect(once).not.toContain("9999999");
    expect(once).not.toContain("Musterstraße 4");
    expect(twice).toBe(once);
  });
});
