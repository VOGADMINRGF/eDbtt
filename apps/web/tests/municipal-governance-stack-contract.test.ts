import { describe, expect, it } from "vitest";
import { resolveMunicipalResponsibilityGuardrails } from "@features/anlassraum/municipalResponsibilityGuardrails";
import { resolveMunicipalProcessStatusContract } from "@features/anlassraum/municipalProcessStatusContract";
import { resolveMunicipalGovernanceModeContract } from "@features/anlassraum/municipalGovernanceModeContract";
import {
  resolveMunicipalRoleGovernanceContract,
  validateMunicipalRoleGovernanceConsistency,
} from "@features/anlassraum/municipalRoleGovernanceContract";

describe("municipal governance stack contract", () => {
  it("keeps responsibility/process/mode/role contracts aligned for institutional admin baseline", () => {
    const responsibility = resolveMunicipalResponsibilityGuardrails({
      ownerType: "municipality",
      roomType: "official",
    });
    const process = resolveMunicipalProcessStatusContract({
      institutionalContext: responsibility.institutionalContext,
      currentStatus: "beobachtet",
      statusReason: "monitoring-baseline",
    });
    const mode = resolveMunicipalGovernanceModeContract({
      institutionalContext: responsibility.institutionalContext,
      processStatus: process.currentStatus,
      followUpStatus: "open",
      releaseStatus: "not_requested",
      transitionReason: "monitoring-baseline",
    });
    const role = resolveMunicipalRoleGovernanceContract({
      institutionalContext: responsibility.institutionalContext,
      actorRole: "admin",
      responsibilityScope: "dezernat",
      governanceMode: mode.governanceMode,
    });
    const consistency = validateMunicipalRoleGovernanceConsistency({
      contract: role,
      processStatus: process.currentStatus,
      releaseStatus: mode.releaseStatus,
    });

    expect(responsibility.institutionalContext).toBe(true);
    expect(mode.governanceMode).toBe("institutional_followup");
    expect(role.roleProfile).toBe("institution_leadership");
    expect(consistency).toMatchObject({ ok: true });
  });

  it("keeps non-institutional contexts in monitoring-only stack", () => {
    const responsibility = resolveMunicipalResponsibilityGuardrails({
      ownerType: "community",
      roomType: "community",
    });
    const process = resolveMunicipalProcessStatusContract({
      institutionalContext: responsibility.institutionalContext,
      currentStatus: "in_pruefung",
    });
    const mode = resolveMunicipalGovernanceModeContract({
      institutionalContext: responsibility.institutionalContext,
      processStatus: process.currentStatus,
      followUpStatus: "open",
      releaseStatus: "pending_review",
    });
    const role = resolveMunicipalRoleGovernanceContract({
      institutionalContext: responsibility.institutionalContext,
      actorRole: "editorial_actor",
      governanceMode: mode.governanceMode,
    });
    const consistency = validateMunicipalRoleGovernanceConsistency({
      contract: role,
      processStatus: process.currentStatus,
      releaseStatus: mode.releaseStatus,
    });

    expect(process.currentStatus).toBe("beobachtet");
    expect(mode.governanceMode).toBe("monitoring_only");
    expect(role.roleProfile).toBe("public_monitoring");
    expect(consistency.ok).toBe(true);
  });
});
