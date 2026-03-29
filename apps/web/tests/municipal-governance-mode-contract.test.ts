import { describe, expect, it } from "vitest";
import {
  resolveMunicipalGovernanceModeContract,
  validateMunicipalGovernanceModeTransition,
} from "@features/anlassraum/municipalGovernanceModeContract";

describe("municipal governance mode contract", () => {
  it("builds institutional governance mode with visible gates and audit explainability", () => {
    const contract = resolveMunicipalGovernanceModeContract({
      institutionalContext: true,
      processStatus: "in_bearbeitung",
      followUpStatus: "in_progress",
      releaseStatus: "pending_review",
      mandateRef: "mandat-12",
      dueAt: "2026-06-30T10:00:00.000Z",
      progressPercent: 55.2,
      transitionReason: "Bearbeitung im Amt gestartet",
    });

    expect(contract.governanceMode).toBe("institutional_followup");
    expect(contract.visibleGates).toContain("monitoring_first");
    expect(contract.visibleGates).toContain("release_reason_required");
    expect(contract.explainability.transitionReasonRequired).toBe(true);
    expect(contract.progressPercent).toBe(55);
    expect(contract.guardrails.deniesTruthPrivilege).toBe(true);
  });

  it("forces non-institutional contexts to monitoring-only mode", () => {
    const contract = resolveMunicipalGovernanceModeContract({
      institutionalContext: false,
      processStatus: "abgeschlossen",
      followUpStatus: "done",
      releaseStatus: "approved_for_public_trace",
      transitionReason: "sollte nicht greifen",
    });

    expect(contract.governanceMode).toBe("monitoring_only");
    expect(contract.processStatus).toBe("beobachtet");
    expect(contract.followUpStatus).toBe("none");
    expect(contract.releaseStatus).toBe("not_requested");
    expect(contract.visibleGates).toEqual(["monitoring_first", "no_truth_or_priority_inference"]);
  });

  it("validates reason/audit requirements for governance transitions", () => {
    const invalidNonInstitutional = validateMunicipalGovernanceModeTransition({
      institutionalContext: false,
      previousProcessStatus: "beobachtet",
      nextProcessStatus: "in_pruefung",
      previousFollowUpStatus: "none",
      nextFollowUpStatus: "open",
      previousReleaseStatus: "not_requested",
      nextReleaseStatus: "pending_review",
      transitionReason: "nicht erlaubt",
    });
    expect(invalidNonInstitutional.ok).toBe(false);
    if (invalidNonInstitutional.ok) return;
    expect(invalidNonInstitutional.error).toBe("invalid_non_institutional_transition");

    const missingReason = validateMunicipalGovernanceModeTransition({
      institutionalContext: true,
      previousProcessStatus: "beobachtet",
      nextProcessStatus: "in_pruefung",
      previousFollowUpStatus: "open",
      nextFollowUpStatus: "in_progress",
      previousReleaseStatus: "not_requested",
      nextReleaseStatus: "pending_review",
      transitionReason: null,
    });
    expect(missingReason.ok).toBe(false);
    if (missingReason.ok) return;
    expect(missingReason.error).toBe("transition_reason_required");

    const valid = validateMunicipalGovernanceModeTransition({
      institutionalContext: true,
      previousProcessStatus: "in_pruefung",
      nextProcessStatus: "in_bearbeitung",
      previousFollowUpStatus: "in_progress",
      nextFollowUpStatus: "in_progress",
      previousReleaseStatus: "not_requested",
      nextReleaseStatus: "pending_review",
      transitionReason: "Fachbereich startet Bearbeitung",
    });
    expect(valid).toMatchObject({ ok: true });
  });
});
