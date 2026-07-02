import { describe, expect, it } from "vitest";

import {
  V3_CONTROL_CENTER_CAPABILITY_IDS,
  V3_CONTROL_CENTER_REAL_HREFS,
  buildV3ControlCenterReadModel,
} from "@/features/admin/v3ControlCenterReadModel";

describe("v3 control center readmodel contract", () => {
  it("contains all canonical V3 capabilities and points them toward endstate_ready", () => {
    const readModel = buildV3ControlCenterReadModel();

    expect([...readModel.capabilities.map((entry) => entry.id)].sort()).toEqual(
      [...V3_CONTROL_CENTER_CAPABILITY_IDS].sort(),
    );

    for (const capability of readModel.capabilities) {
      expect(capability.maturityTarget).toBe("endstate_ready");
      if (capability.status === "partially_built") {
        expect(capability.isEndstateReady).toBe(false);
      }
      expect(capability.isBlocked).toBe(false);
    }
  });

  it("keeps global guardrails explicit and does not overstate docs-only capabilities", () => {
    const readModel = buildV3ControlCenterReadModel();
    const joinedGuardrails = readModel.guardrails.join(" ");
    const adminHandout = readModel.capabilities.find((entry) => entry.id === "admin_handout_usage_guide");
    const liveClaims = readModel.capabilities.find((entry) => entry.id === "live_claims_social_programm");
    const pricing = readModel.capabilities.find((entry) => entry.id === "pricing_credits_limits");

    expect(joinedGuardrails).toContain("Kein Auto-Publish");
    expect(joinedGuardrails).toContain("Keine hidden Cost Paths");
    expect(adminHandout).toMatchObject({
      status: "docs_only",
      isEndstateReady: false,
    });
    expect(liveClaims).toBeTruthy();
    expect(pricing).toMatchObject({
      status: "operational_basic",
      nextSliceId: "V3-DEEPSEARCH-COST-GOVERNANCE-01",
    });
  });

  it("uses only real existing href targets when links are present", () => {
    const readModel = buildV3ControlCenterReadModel();

    for (const entry of readModel.capabilities) {
      for (const href of [entry.primaryAdminHref, entry.secondaryHref]) {
        if (!href) continue;
        expect(V3_CONTROL_CENTER_REAL_HREFS).toContain(href);
        expect(href.startsWith("/")).toBe(true);
        expect(href).not.toContain("://");
        expect(href).not.toBe("#");
      }
    }
  });
});
