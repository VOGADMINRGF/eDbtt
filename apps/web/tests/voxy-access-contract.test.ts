import { describe, expect, it } from "vitest";

import {
  assertVoxyAccess,
  canUseVoxyCapability,
  getVoxyCapabilitiesForPlan,
  VOXY_CAPABILITIES,
} from "@/features/voxy/accessContract";

describe("voxy access contract", () => {
  it("blocks public users from full co-creation and export capabilities", () => {
    expect(canUseVoxyCapability("public", "voxy_cocreation_full")).toBe(false);
    expect(canUseVoxyCapability("public", "voxy_draft_export")).toBe(false);
  });

  it("keeps member access limited to light intake", () => {
    expect(getVoxyCapabilitiesForPlan("member")).toEqual([
      "topic_submit_public",
      "topic_submit_authenticated",
      "voxy_intake_light",
    ]);
    expect(canUseVoxyCapability("member", "voxy_cocreation_full")).toBe(false);
  });

  it("allows author_plus co-creation work but not editorial review", () => {
    expect(canUseVoxyCapability("author_plus", "voxy_cocreation_full")).toBe(true);
    expect(canUseVoxyCapability("author_plus", "voxy_editorial_review")).toBe(false);
    expect(canUseVoxyCapability("author_plus", "voxy_publish_prepare")).toBe(false);
  });

  it("allows partner campaign workflows but not editorial approval", () => {
    expect(canUseVoxyCapability("partner", "voxy_campaign_manage")).toBe(true);
    expect(canUseVoxyCapability("partner", "voxy_editorial_review")).toBe(false);
    expect(canUseVoxyCapability("partner", "voxy_publish_prepare")).toBe(false);
  });

  it("allows operator review and publish preparation without widening to admin-only power", () => {
    expect(canUseVoxyCapability("operator", "voxy_editorial_review")).toBe(true);
    expect(canUseVoxyCapability("operator", "voxy_publish_prepare")).toBe(true);
  });

  it("grants admin every defined capability", () => {
    expect(getVoxyCapabilitiesForPlan("admin")).toEqual([...VOXY_CAPABILITIES]);
  });

  it("throws when a required capability is missing", () => {
    expect(() => assertVoxyAccess("member", "voxy_draft_export")).toThrow(
      /voxy_draft_export/,
    );
  });
});
