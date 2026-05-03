import { describe, expect, it } from "vitest";
import {
  getMandateById,
  canPerformMandateAction,
  normalizeMandateActorRole,
  resolveMandatePermissionMatrix,
} from "@features/mandate";

function requireMandate() {
  const mandate = getMandateById("vog-mandat-001");
  if (!mandate) {
    throw new Error("missing_test_mandate_fixture");
  }
  return mandate;
}

describe("mandate role/permission contract", () => {
  it("keeps public read open for guests but blocks write actions", () => {
    const mandate = requireMandate();
    const matrix = resolveMandatePermissionMatrix({ role: "guest", mandate });

    expect(matrix.read_mandate).toBe(true);
    expect(matrix.submit_source_hint).toBe(false);
    expect(matrix.submit_objection).toBe(false);
    expect(matrix.submit_followup_question).toBe(false);
    expect(matrix.submit_progress_observation).toBe(false);
    expect(matrix.update_mandate_status).toBe(false);
    expect(matrix.admin_verify_mandate).toBe(false);
  });

  it("allows logged-in citizens to submit source/objection/follow-up/progress without status write rights", () => {
    const mandate = requireMandate();
    const matrix = resolveMandatePermissionMatrix({ role: "citizen", mandate });

    expect(matrix.submit_source_hint).toBe(true);
    expect(matrix.submit_objection).toBe(true);
    expect(matrix.submit_followup_question).toBe(true);
    expect(matrix.submit_progress_observation).toBe(true);
    expect(matrix.submit_factcheck_hint).toBe(false);
    expect(matrix.update_mandate_status).toBe(false);
    expect(matrix.update_mandate_responsibility).toBe(false);
    expect(matrix.update_mandate_resolution_details).toBe(false);
  });

  it("grants factcheck hints to journalist and fachakteur roles", () => {
    const mandate = requireMandate();

    expect(
      canPerformMandateAction({ role: "journalist", mandate }, "submit_factcheck_hint"),
    ).toBe(true);
    expect(
      canPerformMandateAction({ role: "fachakteur", mandate }, "submit_factcheck_hint"),
    ).toBe(true);
  });

  it("allows mandate maintenance only for responsible representatives", () => {
    const mandate = requireMandate();

    const unrelated = resolveMandatePermissionMatrix({
      role: "organisation_representative",
      mandate,
      actorReferenceIds: ["org-unrelated"],
    });

    expect(unrelated.accept_mandate).toBe(false);
    expect(unrelated.update_mandate_status).toBe(false);
    expect(unrelated.update_mandate_responsibility).toBe(false);
    expect(unrelated.update_mandate_resolution_details).toBe(false);

    const responsible = resolveMandatePermissionMatrix({
      role: "mandate_representative",
      mandate,
      actorReferenceIds: [mandate.responsibility.holderId],
    });

    expect(responsible.accept_mandate).toBe(true);
    expect(responsible.update_mandate_status).toBe(true);
    expect(responsible.update_mandate_responsibility).toBe(true);
    expect(responsible.update_mandate_resolution_details).toBe(true);
    expect(responsible.admin_set_visibility).toBe(false);
    expect(responsible.admin_mark_conflict).toBe(false);
  });

  it("grants admin verification and visibility/conflict controls", () => {
    const mandate = requireMandate();
    const matrix = resolveMandatePermissionMatrix({ role: "admin", mandate });

    expect(matrix.admin_verify_mandate).toBe(true);
    expect(matrix.admin_set_visibility).toBe(true);
    expect(matrix.admin_mark_conflict).toBe(true);
    expect(matrix.update_mandate_status).toBe(true);
    expect(matrix.update_mandate_responsibility).toBe(true);
    expect(matrix.update_mandate_resolution_details).toBe(true);
  });

  it("normalizes unknown actor role to guest", () => {
    expect(normalizeMandateActorRole("journalist")).toBe("journalist");
    expect(normalizeMandateActorRole("ADMIN")).toBe("admin");
    expect(normalizeMandateActorRole("unknown_role")).toBe("guest");
    expect(normalizeMandateActorRole(null)).toBe("guest");
  });
});
