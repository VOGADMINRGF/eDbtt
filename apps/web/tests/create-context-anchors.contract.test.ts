import { describe, expect, it } from "vitest";
import {
  getCreateContextAnchorDefinitions,
  getCreateHelperLinks,
} from "@/features/create/createSurfaceConfig";
import { shouldRenderCreateAnalyzeWorkspace } from "@/app/create/CreateClient";

describe("create context anchors contract", () => {
  it("maps Quelle einreichen to media mode with review-oriented placeholder", () => {
    const anchors = getCreateContextAnchorDefinitions("de");
    const sourceAnchor = anchors.find((entry) => entry.id === "source");

    expect(sourceAnchor?.mode).toBe("media");
    expect(sourceAnchor?.label).toBe("Quelle einreichen");
    expect(sourceAnchor?.placeholder).toContain("geprüft");
  });

  it("maps Option vorschlagen to guided mode with draft-oriented helper", () => {
    const anchors = getCreateContextAnchorDefinitions("de");
    const optionAnchor = anchors.find((entry) => entry.id === "option");

    expect(optionAnchor?.mode).toBe("guided");
    expect(optionAnchor?.label).toBe("Option vorschlagen");
    expect(optionAnchor?.helperText).toContain("Option");
  });

  it("keeps helper links secondary with canonical labels", () => {
    const links = getCreateHelperLinks("de");
    const labels = links.map((entry) => entry.label);

    expect(labels).toContain("So funktioniert's");
    expect(labels).toContain("Dossier & Faktencheck");
    expect(labels).toContain("Preise");
    expect(labels).toContain("Zur Initiative");
  });

  it("never starts analyze workspace from anchor context alone", () => {
    const visible = shouldRenderCreateAnalyzeWorkspace({
      followupActivated: false,
      hasStarted: true,
      intakeText: "Ich reiche eine Quelle ein.",
      productMode: "media",
      guidedBridgeConfirmed: true,
    });

    expect(visible).toBe(false);
  });
});
