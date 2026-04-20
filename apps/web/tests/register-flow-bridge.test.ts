import { describe, expect, it } from "vitest";
import { resolveRegisterBridge } from "@/app/register/registerFlowBridge";

describe("register flow bridge", () => {
  it("returns create-specific bridge copy", () => {
    const bridge = resolveRegisterBridge("/create?mode=manual");
    expect(bridge).not.toBeNull();
    expect(bridge?.text).toContain("Eingabe-Flow");
  });

  it("returns membership-specific bridge copy", () => {
    const bridge = resolveRegisterBridge("/mitglied-antrag?betrag=20");
    expect(bridge).not.toBeNull();
    expect(bridge?.text).toContain("Mitgliedschafts-Flow");
  });

  it("returns generic bridge copy for unknown internal targets", () => {
    const bridge = resolveRegisterBridge("/community");
    expect(bridge).not.toBeNull();
    expect(bridge?.text).toContain("sicher weiterbearbeiten");
  });

  it("returns null when no next target exists", () => {
    expect(resolveRegisterBridge(null)).toBeNull();
  });
});
