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

  it("uses understandable contribute follow-up wording without classification-flow phrasing", () => {
    const de = getCreateSurfaceTexts("de");
    const en = getCreateSurfaceTexts("en");

    expect(de.startBusyStatus).toBe("Wird eingeordnet …");
    expect(de.startBusyLead).toBe("Wir ordnen deinen Beitrag ein …");
    expect(de.followupContributeTitle).toBe("Haben wir dich richtig verstanden?");
    expect(de.followupContributeLead).toBe(
      "Deine Aussage bleibt reviewpflichtig. Du kannst sie jetzt direkt einreichen oder tiefer ins Thema gehen.",
    );
    expect(de.followupOriginalTextLabel).toBe("Dein Originaltext");
    expect(de.followupUnderstandingLabel).toBe("So haben wir es verstanden");
    expect(de.followupNotPublishedLabel).toBe("Noch nicht veröffentlicht.");
    expect(de.followupNextStepLabel).toBe("Nächster Schritt");

    expect(en.followupContributeTitle).toBe("Did we understand you correctly?");
    expect(en.followupContributeTitle.toLowerCase()).not.toContain("classification flow");
  });
});
