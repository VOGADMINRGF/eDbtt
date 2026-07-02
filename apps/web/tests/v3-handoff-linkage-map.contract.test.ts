import { describe, expect, it } from "vitest";

import {
  V3_HANDOFF_LINK_IDS,
  V3_HANDOFF_LINK_REAL_HREFS,
  buildV3HandoffLinkageMap,
} from "@/features/admin/v3HandoffLinkageMap";

describe("v3 handoff linkage map contract", () => {
  it("contains all canonical A-R links with honest status semantics", () => {
    const readModel = buildV3HandoffLinkageMap();

    expect([...readModel.links.map((entry) => entry.id)].sort()).toEqual(
      [...V3_HANDOFF_LINK_IDS].sort(),
    );
    expect(readModel.summary.wired).toBeGreaterThan(0);
    expect(readModel.summary.endstateReadyCount).toBe(0);

    for (const link of readModel.links) {
      expect(link.maturityTarget).toBe("endstate_ready");
      expect(link.gap.length).toBeGreaterThan(0);
      expect(link.nextSliceId).toMatch(/^V3-/);
      expect(link.guardrails.length).toBeGreaterThan(0);
    }
  });

  it("keeps planned and docs-only links free of fake hrefs and preserves guardrails", () => {
    const readModel = buildV3HandoffLinkageMap();
    const joinedGuardrails = readModel.links.flatMap((entry) => entry.guardrails).join(" ");
    const programm = readModel.links.find((entry) => entry.id === "claims_and_signals_to_programm_candidates");
    const meeting = readModel.links.find((entry) => entry.id === "meeting_link_to_live_or_anlassraum_context");

    expect(joinedGuardrails).toContain("Kein Auto-Publish");
    expect(joinedGuardrails).toContain("Keine Auto-Graph-Write");
    expect(joinedGuardrails).toContain("Keine Auto-Merge");

    for (const link of readModel.links.filter(
      (entry) => entry.status === "planned" || entry.status === "docs_only",
    )) {
      expect(link.adminHref).toBeUndefined();
      expect(link.publicHref).toBeUndefined();
    }

    expect(programm).toMatchObject({
      status: "planned",
      nextSliceId: "V3-PROGRAMM-GROWTH-APPROVAL-PIPELINE-01",
    });
    expect(meeting).toMatchObject({
      status: "planned",
      nextSliceId: "V3-MEETING-LINK-INTEGRATION-LIGHT-01",
    });
  });

  it("uses only real safe href targets when admin or public links are present", () => {
    const readModel = buildV3HandoffLinkageMap();

    for (const entry of readModel.links) {
      for (const href of [entry.adminHref, entry.publicHref]) {
        if (!href) continue;
        expect(V3_HANDOFF_LINK_REAL_HREFS).toContain(href);
        expect(href.startsWith("/")).toBe(true);
        expect(href).not.toContain("://");
        expect(href).not.toBe("#");
      }
    }
  });
});
