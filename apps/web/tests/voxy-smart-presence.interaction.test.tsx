// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import VoxyHelpTrigger from "@/components/voxy/VoxyHelpTrigger";
import VoxySmartDock from "@/components/voxy/VoxySmartDock";
import type { VoxySmartPresenceContext } from "@/features/voxy/smartPresenceContract";

const context: VoxySmartPresenceContext = {
  surface: "dossier",
  objectType: "source",
  objectId: "source-1",
  objectLabel: "Kommunaler Bericht",
  helpTopic: "unreviewed_source",
  status: "Ungeprüft",
  allowedActions: [
    {
      id: "open-claim",
      label: "Betroffene Aussage prüfen",
      kind: "navigate",
      target: { view: "positions", objectType: "claim", objectId: "claim-1" },
    },
  ],
  languageContext: {
    contentLanguage: "ar",
    interfaceLanguage: "de",
    direction: "rtl",
  },
  permissionContext: {
    canRead: true,
    canNavigate: true,
    canMutate: false,
  },
};

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("Voxy smart presence interaction", () => {
  it("opens a non-modal peek, handles Escape and returns focus", () => {
    render(<VoxyHelpTrigger context={context} blockId="source-source-1" />);
    const trigger = screen.getByRole("button", {
      name: "Voxy-Hilfe zu Kommunaler Bericht",
    });

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBe("false");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Hilfe schließen" }),
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps one trigger in its fachlicher block and dispatches only a typed action", () => {
    const onAction = vi.fn();
    const { container } = render(
      <VoxyHelpTrigger context={context} blockId="source-source-1" onAction={onAction} />,
    );
    expect(container.querySelectorAll('[data-voxy-help-block-id="source-source-1"]')).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Voxy-Hilfe/ }));
    fireEvent.click(screen.getByRole("button", { name: "Betroffene Aussage prüfen" }));
    expect(onAction).toHaveBeenCalledWith(context.allowedActions[0]);
  });

  it("starts minimized and supports mute, hide and restore without an overlay", () => {
    const { container } = render(<VoxySmartDock context={context} />);
    const dock = container.querySelector("[data-voxy-smart-dock]");
    expect(dock?.getAttribute("data-voxy-smart-dock")).toBe("minimized");
    expect(dock?.getAttribute("data-full-screen-overlay")).toBe("false");
    expect(dock?.className).toContain("safe-area-inset-bottom");

    fireEvent.click(screen.getByRole("button", { name: "Hinweise stummschalten" }));
    expect(screen.getByRole("button", { name: "Hinweise aktivieren" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ausblenden" }));
    expect(screen.getByRole("button", { name: "Voxy wieder anzeigen" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Voxy wieder anzeigen" }));
    expect(screen.getByRole("button", { name: "Voxy-Hilfe öffnen" })).toBeTruthy();
  });
});
