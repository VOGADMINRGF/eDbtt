import { describe, expect, it } from "vitest";
import {
  resolveMunicipalProcessStatusContract,
  validateMunicipalProcessTransition,
} from "@features/anlassraum/municipalProcessStatusContract";

describe("municipal process status contract", () => {
  it("builds institutional monitoring status with transitions and explainability requirements", () => {
    const contract = resolveMunicipalProcessStatusContract({
      institutionalContext: true,
      currentStatus: "in_pruefung",
      mandateRef: "mandat-77",
      dueAt: "2026-06-01T10:00:00.000Z",
      progressPercent: 42.4,
      statusReason: "Fachpruefung im Dezernat angestossen.",
    });

    expect(contract.currentStatus).toBe("in_pruefung");
    expect(contract.allowedTransitions).toEqual(
      expect.arrayContaining(["beobachtet", "in_pruefung", "in_bearbeitung"]),
    );
    expect(contract.mandate.progressPercent).toBe(42);
    expect(contract.explainability.statusReasonRequired).toBe(true);
    expect(contract.guardrails.deniesTruthInferenceFromProcessStatus).toBe(true);
  });

  it("forces non-institutional contexts into beobachtet without process privilege", () => {
    const contract = resolveMunicipalProcessStatusContract({
      institutionalContext: false,
      currentStatus: "umgesetzt",
      progressPercent: 90,
    });

    expect(contract.currentStatus).toBe("beobachtet");
    expect(contract.allowedTransitions).toEqual(["beobachtet"]);
    expect(contract.guardrails.requiresMonitoringFirst).toBe(true);
  });

  it("validates transitions and requires reasons for non-trivial state changes", () => {
    const invalidTransition = validateMunicipalProcessTransition({
      institutionalContext: true,
      fromStatus: "beobachtet",
      toStatus: "abgeschlossen",
      statusReason: "Direkter Abschluss",
    });
    expect(invalidTransition.ok).toBe(false);
    if (invalidTransition.ok) return;
    expect(invalidTransition.error).toBe("invalid_status_transition");

    const missingReason = validateMunicipalProcessTransition({
      institutionalContext: true,
      fromStatus: "in_pruefung",
      toStatus: "in_bearbeitung",
      statusReason: null,
    });
    expect(missingReason.ok).toBe(false);
    if (missingReason.ok) return;
    expect(missingReason.error).toBe("status_reason_required");

    const valid = validateMunicipalProcessTransition({
      institutionalContext: true,
      fromStatus: "in_pruefung",
      toStatus: "in_bearbeitung",
      statusReason: "Bearbeitung gestartet",
    });
    expect(valid).toMatchObject({ ok: true, fromStatus: "in_pruefung", toStatus: "in_bearbeitung" });
  });
});
