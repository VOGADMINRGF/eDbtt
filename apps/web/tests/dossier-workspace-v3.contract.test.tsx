// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import demoDossier from "@features/dossier/data/demoDossier";
import DossierWorkspace from "@/components/dossier/DossierWorkspace";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function dossierWithLinkedQuestion() {
  return {
    ...demoDossier,
    analyze: {
      ...demoDossier.analyze,
      notes: [
        ...demoDossier.analyze.notes,
        {
          id: "workspace-linked-question",
          kind: "presentation" as const,
          text: JSON.stringify({
            openQuestions: [
              {
                id: "q-linked",
                text: "Welche lokale Messung bestätigt die Übertragbarkeit?",
                status: "in_review",
                responsible: "Fachprüfung",
                lastUpdate: "2026-07-20",
                claimIds: ["stmt-3"],
                findingIds: ["f-2"],
                optionIds: ["opt-d"],
                answerCandidates: ["Vorher-Nachher-Messung im Pilotgebiet"],
              },
            ],
          }),
        },
      ],
    },
  };
}

describe("DOSSIER-WORKSPACE-02", () => {
  it("starts with the debate overview and exposes five focused modes", () => {
    const { container } = render(<DossierWorkspace dossier={demoDossier} demo />);

    expect(screen.getByRole("heading", { name: "Debattenstand auf einen Blick" })).toBeTruthy();
    expect(screen.getAllByRole("tab")).toHaveLength(5);
    expect(screen.getByRole("tab", { name: "Überblick" }).getAttribute("aria-selected")).toBe("true");
    expect(container.querySelectorAll(".btn-primary")).toHaveLength(1);
    expect(container.querySelector('[dir="ltr"]')).toBeTruthy();
    expect(
      container.querySelector('section[aria-label="Dossier-Arbeitsraum"]')?.className,
    ).toContain("max-w-[1560px]");
    expect(container.innerHTML).toContain(
      "xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]",
    );
  });

  it("changes the primary surface and keeps exactly one dominant next action", () => {
    const { container } = render(<DossierWorkspace dossier={demoDossier} demo />);

    fireEvent.click(screen.getByRole("button", { name: "Quellen prüfen" }));

    expect(screen.getByRole("heading", { name: "Quellen und Prüfkontext" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Debattenstand auf einen Blick" })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Quellen" }));
    expect(screen.getByRole("button", { name: "Offene Fragen prüfen" })).toBeTruthy();
    expect(container.textContent).toContain("Details und Einschränkungen");
    expect(container.textContent).toContain("Nicht automatisch ableitbar");
    expect(container.querySelectorAll(".btn-primary")).toHaveLength(1);
  });

  it("supports arrow-key focus and restores the canonical overview after remount", () => {
    const first = render(<DossierWorkspace dossier={demoDossier} demo />);
    const overviewTab = screen.getByRole("tab", { name: "Überblick" });
    overviewTab.focus();
    fireEvent.keyDown(overviewTab, { key: "ArrowRight" });

    const positionsTab = screen.getByRole("tab", { name: "Positionen" });
    expect(document.activeElement).toBe(positionsTab);
    expect(positionsTab.getAttribute("aria-selected")).toBe("true");

    first.unmount();
    render(<DossierWorkspace dossier={demoDossier} demo />);
    expect(screen.getByRole("tab", { name: "Überblick" }).getAttribute("aria-selected")).toBe("true");
  });

  it("sets RTL direction from the dossier content language", () => {
    const arabicDossier = {
      ...demoDossier,
      analyze: {
        ...demoDossier.analyze,
        language: "ar",
      },
    };
    const { container } = render(<DossierWorkspace dossier={arabicDossier} demo />);

    expect(container.querySelector('section[dir="rtl"][lang="ar"]')).toBeTruthy();
  });

  it("shows real graph-derived relationships and accessible compact counts", () => {
    const { container } = render(<DossierWorkspace dossier={demoDossier} demo />);

    expect(screen.getByRole("heading", { name: "Zusammenhänge" })).toBeTruthy();
    expect(screen.getByRole("img", { name: /Mit stützender Quelle:/ })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Quellenstatus und -arten" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Optionen und Abhängigkeiten" })).toBeTruthy();
    expect(screen.getByText("Eine Abdeckungsquote ist nicht verfügbar.", { exact: false })).toBeTruthy();
    expect(screen.getByText("Von Fragen betroffen")).toBeTruthy();
    expect(container.textContent).not.toContain("stmt-");
    expect(container.textContent).not.toContain("evidenceGraph");
  });

  it("navigates a real claim-to-question-to-source-and-option trace", () => {
    render(<DossierWorkspace dossier={dossierWithLinkedQuestion()} demo />);

    const claimSelector = screen.getByRole("button", {
      name: /Internationale Beispiele berichten positive Effekte/,
    });
    fireEvent.click(claimSelector);

    expect(claimSelector.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("heading", { name: "Quellen zur Aussage" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Fragen aus dieser Aussage" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Betroffene Entscheidungsoptionen" }),
    ).toBeTruthy();
    expect(screen.getByText(/Betrifft: Pilotgebiet mit enger Evaluation/)).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", {
        name: /Welche lokale Messung bestätigt die Übertragbarkeit/,
      }),
    );

    expect(screen.getByRole("heading", { name: "Fragen prüfen" })).toBeTruthy();
    expect(screen.getByText("Vorher-Nachher-Messung im Pilotgebiet")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /Barcelona Superblocks/ }),
    );
    expect(screen.getByRole("heading", { name: "Quellen und Prüfkontext" })).toBeTruthy();
    expect(document.activeElement?.textContent).toContain("Barcelona Superblocks");

    fireEvent.click(screen.getByRole("tab", { name: "Offene Fragen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Pilotgebiet mit enger Evaluation" }),
    );
    expect(screen.getByRole("heading", { name: "Zusammenhänge" })).toBeTruthy();
    expect(document.activeElement?.textContent).toContain("Pilotgebiet mit enger Evaluation");
  });

  it("uses the existing clarification endpoint as the single review action per question", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    render(<DossierWorkspace dossier={demoDossier} />);

    fireEvent.click(screen.getByRole("tab", { name: "Offene Fragen" }));
    const actions = screen.getAllByRole("button", { name: /Prüfung anfragen/i });
    expect(actions).toHaveLength(3);
    fireEvent.click(actions[0]);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/dossier/request-clarification");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "POST" });
    expect(
      await screen.findByText(
        "Die Frage wurde an die bestehende redaktionelle Prüfung übergeben.",
      ),
    ).toBeTruthy();
  });

  it("keeps answers unverified and failed or demo review paths read-only", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: false }), {
        status: 503,
        headers: { "content-type": "application/json" },
      }),
    );
    const runtime = render(<DossierWorkspace dossier={demoDossier} />);

    fireEvent.click(screen.getByRole("tab", { name: "Offene Fragen" }));
    expect(
      screen.getByText(
        "Antwort ist dokumentiert; sie gilt nicht automatisch als fachlich geprüft.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: /Prüfung anfragen/i })[0]);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Die Prüfanfrage ist derzeit nicht verfügbar.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Prüfung angefragt" })).toBeNull();

    runtime.unmount();
    render(<DossierWorkspace dossier={demoDossier} demo />);
    fireEvent.click(screen.getByRole("tab", { name: "Offene Fragen" }));
    const demoActions = screen.getAllByRole("button", {
      name: "Prüfanfrage hier nicht verfügbar",
    });
    expect(demoActions).toHaveLength(3);
    expect(demoActions.every((button) => button.hasAttribute("disabled"))).toBe(true);
  });

  it("keeps an honest empty relationship state without generated demo links", () => {
    const emptyDossier = {
      ...demoDossier,
      analyze: {
        ...demoDossier.analyze,
        evidenceGraph: undefined,
        findings: [],
        decisionTrees: [],
        missingPerspectives: [],
        notes: [],
        claims: demoDossier.analyze.claims.map((claim) => ({
          ...claim,
          debateFrame: { ...claim.debateFrame, options: [] },
        })),
      },
    };
    render(<DossierWorkspace dossier={emptyDossier} />);

    expect(
      screen.getByText(/keine belastbaren Beziehungen zwischen Aussagen, Quellen, Fragen oder Optionen/),
    ).toBeTruthy();
    expect(screen.getByText(/keine auswertbaren Quellenbeziehungen/)).toBeTruthy();
  });
});
