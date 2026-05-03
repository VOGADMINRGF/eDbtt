import { describe, expect, it } from "vitest";
import {
  buildMandateRegisterHandoff,
  buildMandateRegisterHandoffDisclosure,
  canPrepareMandateRegisterHandoff,
  getMandateById,
  parseMandateRegisterHandoff,
  supportsAutomaticMandateRegisterTransfer,
  supportsAutomaticRoleInferenceFromMandateBehavior,
  supportsImplicitMembershipActivationFromMandate,
  withdrawMandateRegisterHandoff,
} from "@features/mandate";

function requireMandate() {
  const mandate = getMandateById("vog-mandat-001");
  if (!mandate) throw new Error("missing_mandate_fixture");
  return mandate;
}

describe("mandate register handoff contract", () => {
  it("allows handoff preparation only for responsible representatives or admin", () => {
    const mandate = requireMandate();

    expect(
      canPrepareMandateRegisterHandoff({
        role: "guest",
        mandate,
      }),
    ).toBe(false);

    expect(
      canPrepareMandateRegisterHandoff({
        role: "citizen",
        mandate,
        actorReferenceIds: [mandate.responsibility.holderId],
      }),
    ).toBe(false);

    expect(
      canPrepareMandateRegisterHandoff({
        role: "organisation_representative",
        mandate,
        actorReferenceIds: ["org-unrelated"],
      }),
    ).toBe(false);

    expect(
      canPrepareMandateRegisterHandoff({
        role: "mandate_representative",
        mandate,
        actorReferenceIds: [mandate.responsibility.holderId],
      }),
    ).toBe(true);

    expect(
      canPrepareMandateRegisterHandoff({
        role: "admin",
        mandate,
      }),
    ).toBe(true);
  });

  it("builds an explicit opt-in handoff payload with visible consent/role/provenance/revocability", () => {
    const mandate = requireMandate();

    const handoff = buildMandateRegisterHandoff({
      mandate,
      handoffId: "handoff-vog-001",
      roleType: "mandate_representative",
      roleLabel: "Repräsentant:in Klima und Gebäude",
      preparedByReferenceId: mandate.responsibility.holderId,
      consentTextVersion: "vog-consent-v1",
      consentCapturedAt: "2026-05-03T10:00:00.000Z",
      origin: "edebatte_mandate_surface",
      createMembershipEntry: true,
      registerVisibility: "public",
      createdAt: "2026-05-03T10:01:00.000Z",
    });

    expect(handoff.status).toBe("ready_for_review");
    expect(handoff.consent.optInGranted).toBe(true);
    expect(handoff.consent.revocable).toBe(true);
    expect(handoff.provenance.sourceMandateId).toBe(mandate.id);
    expect(handoff.membership.implicitTransfer).toBe(false);
    expect(handoff.membership.implicitRoleInference).toBe(false);

    const disclosure = buildMandateRegisterHandoffDisclosure(handoff);
    expect(disclosure).toEqual({
      consentVisible: true,
      roleVisible: true,
      provenanceVisible: true,
      revocationVisible: true,
    });
  });

  it("supports withdrawal with explicit reason and actor role", () => {
    const mandate = requireMandate();

    const handoff = buildMandateRegisterHandoff({
      mandate,
      handoffId: "handoff-vog-002",
      roleType: "admin_delegate",
      roleLabel: "Admin Delegation",
      preparedByReferenceId: "admin-01",
      consentTextVersion: "vog-consent-v1",
      consentCapturedAt: "2026-05-03T11:00:00.000Z",
      origin: "edebatte_dossier_followup",
      createMembershipEntry: false,
      registerVisibility: "restricted",
      createdAt: "2026-05-03T11:01:00.000Z",
    });

    const withdrawn = withdrawMandateRegisterHandoff({
      handoff,
      withdrawnAt: "2026-05-03T11:22:00.000Z",
      withdrawnByRole: "admin_delegate",
      reason: "Widerruf durch verantwortliche Stelle.",
    });

    expect(withdrawn.status).toBe("withdrawn");
    expect(withdrawn.revocation).not.toBeNull();
    expect(withdrawn.revocation?.withdrawnByRole).toBe("admin_delegate");
    expect(withdrawn.revocation?.reason).toContain("Widerruf");
  });

  it("guards against implicit automatic transfer behaviors", () => {
    expect(supportsAutomaticMandateRegisterTransfer()).toBe(false);
    expect(supportsImplicitMembershipActivationFromMandate()).toBe(false);
    expect(supportsAutomaticRoleInferenceFromMandateBehavior()).toBe(false);
  });

  it("rejects malformed handoff payload without explicit opt-in", () => {
    const mandate = requireMandate();

    expect(() =>
      parseMandateRegisterHandoff({
        id: "handoff-vog-invalid",
        mandateId: mandate.id,
        status: "ready_for_review",
        roleType: "mandate_representative",
        roleLabel: "Repräsentant:in",
        consent: {
          optInGranted: false,
          consentTextVersion: "vog-consent-v1",
          consentCapturedAt: "2026-05-03T12:00:00.000Z",
          revocable: true,
        },
        provenance: {
          origin: "edebatte_mandate_surface",
          sourceMandateId: mandate.id,
          sourceDossierId: mandate.sourceDossierId,
          sourceRoundId: mandate.sourceRoundId,
          sourceAnlassraumId: mandate.sourceAnlassraumId,
          preparedByRole: "mandate_representative",
          preparedByReferenceId: mandate.responsibility.holderId,
        },
        membership: {
          createMembershipEntry: true,
          registerVisibility: "public",
          implicitTransfer: false,
          implicitRoleInference: false,
        },
        revocation: null,
        createdAt: "2026-05-03T12:00:00.000Z",
        updatedAt: "2026-05-03T12:00:00.000Z",
      }),
    ).toThrow();
  });
});
