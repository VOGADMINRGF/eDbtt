import { describe, expect, it } from "vitest";
import {
  resolveMunicipalRoleGovernanceContract,
  validateMunicipalRoleGovernanceConsistency,
} from "@features/anlassraum/municipalRoleGovernanceContract";

describe("municipal role governance contract", () => {
  it("maps admin in institutional followup mode to leadership profile", () => {
    const contract = resolveMunicipalRoleGovernanceContract({
      institutionalContext: true,
      actorRole: "admin",
      responsibilityScope: "dezernat",
      governanceMode: "institutional_followup",
    });

    expect(contract.roleProfile).toBe("institution_leadership");
    expect(contract.allowedActions).toContain("approve_public_trace_release");
    expect(contract.allowedActions).toContain("assign_responsibility_scope");
    expect(contract.reasonAuditRequiredActions).toContain("set_release_status");
    expect(contract.guardrails.monitoringFirst).toBe(true);
  });

  it("maps institutional actor in office scope to office operator profile", () => {
    const contract = resolveMunicipalRoleGovernanceContract({
      institutionalContext: true,
      actorRole: "institutional_actor",
      responsibilityScope: "amt",
      governanceMode: "institutional_followup",
    });

    expect(contract.roleProfile).toBe("office_operator");
    expect(contract.allowedActions).toContain("set_process_status");
    expect(contract.allowedActions).not.toContain("approve_public_trace_release");
  });

  it("keeps non-institutional contexts in public monitoring profile and flags inconsistent states", () => {
    const contract = resolveMunicipalRoleGovernanceContract({
      institutionalContext: false,
      actorRole: "editorial_actor",
      responsibilityScope: "dezernat",
      governanceMode: "monitoring_only",
    });

    expect(contract.roleProfile).toBe("public_monitoring");
    expect(contract.allowedActions).toEqual(["view_monitoring_meta"]);

    const consistency = validateMunicipalRoleGovernanceConsistency({
      contract,
      processStatus: "in_pruefung",
      releaseStatus: "not_requested",
    });
    expect(consistency.ok).toBe(false);
    expect(consistency.issues).toContain(
      "public_monitoring_profile_cannot_drive_non_monitoring_process_status",
    );
  });
});
