import { describe, expect, it } from "vitest";
import {
  buildAgenticCivicE2EStatusHint,
  buildB2GFirstLoginJurisdictionCockpitContract,
  buildB2GFirstLoginSummaryCards,
  buildMunicipalHandoffDecisionBoundaryHint,
} from "@/features/agenticRuntime/b2gFirstLoginJurisdictionCockpitContract";

describe("b2g first login jurisdiction cockpit contract", () => {
  it("keeps first login, jurisdiction match and activation separate", () => {
    const contract = buildB2GFirstLoginJurisdictionCockpitContract({
      authorityFirstLoginState: "verified_authority_first_login",
      jurisdictionMatchState: "public_jurisdiction_match",
      matchedJurisdictionLabels: ["Berlin Reinickendorf"],
    });

    expect(contract.segment).toBe("b2g");
    expect(contract.personalVoxyForced).toBe(false);
    expect(contract.verifiedAuthorityFirstLogin.activationConfirmed).toBe(false);
    expect(contract.verifiedAuthorityFirstLogin.summary).toContain(
      "keine verifizierte Authority-Aktivierung",
    );
    expect(contract.jurisdiction.jurisdictionAuthorityVerified).toBe(false);
    expect(contract.jurisdiction.summary).toContain("verifiziert aber noch keine Zuständigkeit");
    expect(contract.publicDebattenstandRemainsFree).toBe(true);
  });

  it("keeps available Debattenstand, adoption, topic candidates and participation separate", () => {
    const contract = buildB2GFirstLoginJurisdictionCockpitContract({
      availableDebattenstaende: [
        {
          id: "dossier-1",
          title: "Schulwege Reinickendorf",
          jurisdictionLabel: "Berlin Reinickendorf",
        },
      ],
      suggestedAdoptions: [
        {
          id: "adoption-1",
          title: "Interne Prüfung Schulwege Reinickendorf",
          basedOnPublicDebattenstandId: "dossier-1",
        },
      ],
      reviewedTopicCandidates: [
        {
          id: "topic-1",
          title: "Schulwegsicherheit",
        },
      ],
      participationSuggestions: [
        {
          id: "participation-1",
          title: "Möglichen Beteiligungsprozess prüfen",
          basedOnTopicCandidateId: "topic-1",
        },
      ],
    });

    expect(contract.availableDebattenstaende[0]?.availablePublicly).toBe(true);
    expect(contract.availableDebattenstaende[0]?.adoptedInternally).toBe(false);
    expect(contract.suggestedAdoptions[0]?.adoptedInternally).toBe(false);
    expect(contract.reviewedTopicCandidates[0]?.officialAuthorityProcess).toBe(false);
    expect(contract.participationSuggestions[0]?.launchedParticipation).toBe(false);

    const summaryCards = buildB2GFirstLoginSummaryCards(contract);
    expect(summaryCards.find((card) => card.id === "available_vs_adopted")?.body).toContain(
      "Interne Adoption bleibt ein bewusster Review-Schritt",
    );
  });

  it("keeps municipal handoff as decision boundary and blocks the civic e2e pilot until resolved", () => {
    const contract = buildB2GFirstLoginJurisdictionCockpitContract({
      municipalHandoffStatus: "needs_decision",
    });

    expect(contract.municipalHandoff.status).toBe("needs_decision");
    expect(contract.municipalHandoff.summary).toContain("Recipient Verification");
    expect(contract.agenticCivicE2E.status).toBe("blocked");
    expect(buildMunicipalHandoffDecisionBoundaryHint()).toContain("External Notification Workflow");
    expect(buildAgenticCivicE2EStatusHint(contract)).toContain("blocked");
  });
});
