import { describe, expect, it } from "vitest";
import { getCreateSurfaceTexts } from "@/features/create/createSurfaceConfig";

describe("create follow-up i18n contract", () => {
  it("localizes guided follow-up copy", () => {
    const de = getCreateSurfaceTexts("de");
    const en = getCreateSurfaceTexts("en");

    expect(de.guidedTitle).not.toBe(en.guidedTitle);
    expect(de.guidedCta).toBe("Arbeitsstand starten");
    expect(en.guidedCta).toBe("Start working state");
    expect(en.guidedLead).toContain("core conflict");
    expect(de.guidedWorkspacePrefix).toBe("Geführter Fokus");
    expect(en.guidedWorkspacePrefix).toBe("Guided focus");
  });

  it("localizes round-context banner copy", () => {
    const de = getCreateSurfaceTexts("de");
    const en = getCreateSurfaceTexts("en");

    expect(de.rundenContextTitle).toContain("Anlass");
    expect(en.rundenContextTitle).toContain("round");
    expect(en.rundenContextWithLabel("Climate")).toBe("Context: Climate.");
  });
});
