// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import demoDossier from "@features/dossier/data/demoDossier";
import DossierWorkspace from "@/components/dossier/DossierWorkspace";
import { buildDossierWorkspaceModel } from "@/components/dossier/workspaceModel";

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

function dossierWithUnreviewedSource() {
  return {
    ...demoDossier,
    analyze: {
      ...demoDossier.analyze,
      notes: demoDossier.analyze.notes.map((note) => {
        if (note.id !== "note-source-matrix") return note;
        const matrix = JSON.parse(note.text) as {
          entries: Array<Record<string, unknown>>;
        };
        return {
          ...note,
          text: JSON.stringify({
            ...matrix,
            entries: matrix.entries.map((entry, index) =>
              index === 0 ? { ...entry, evidenceStatus: "offen" } : entry,
            ),
          }),
        };
      }),
    },
  };
}

function dossierWithDirectQuestionSource(includeConcreteFinding: boolean) {
  const finding = demoDossier.analyze.findings.find(
    (item) => item.finding === "supports" || item.finding === "contradicts",
  );
  if (!finding) throw new Error("Konkretes Demo-Finding fehlt");
  return {
    dossier: {
      ...demoDossier,
      analyze: {
        ...demoDossier.analyze,
        notes: [
          ...demoDossier.analyze.notes,
          {
            id: `workspace-direct-source-${includeConcreteFinding}`,
            kind: "presentation" as const,
            text: JSON.stringify({
              openQuestions: [
                {
                  id: "q-source-priority",
                  text: "Wie ist diese Quelle für die Frage einzuordnen?",
                  status: "open",
                  claimIds: [finding.claimId],
                  sourceIds: [finding.sourceId],
                  findingIds: includeConcreteFinding ? [finding.id] : [],
                },
              ],
            }),
          },
        ],
      },
    },
    finding,
  };
}

function claimSelector(name: RegExp) {
  const button = screen
    .getAllByRole("button", { name })
    .find((item) => item.hasAttribute("aria-pressed"));
  if (!button) throw new Error("Aussageauswahl nicht gefunden");
  return button;
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

  it("keeps the compact workspace navigation sticky and horizontally reachable", () => {
    const previousScrollIntoView = HTMLElement.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    const { container } = render(<DossierWorkspace dossier={demoDossier} demo />);
    const navigation = container.querySelector(
      '[data-sticky-workspace-navigation="true"]',
    );
    const tablist = screen.getByRole("tablist", { name: "Dossier-Bereiche" });

    expect(navigation?.className).toContain("sticky");
    expect(navigation?.className).toContain("top-16");
    expect(navigation?.className).toContain("overflow-x-auto");
    expect(tablist.className).toContain("min-w-max");
    expect(screen.getByRole("tab", { name: "Überblick" }).className).toContain(
      "focus-visible:ring-2",
    );

    fireEvent.click(screen.getByRole("tab", { name: "Beteiligung" }));
    expect(screen.getByRole("tab", { name: "Beteiligung" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(scrollIntoView).toHaveBeenLastCalledWith(
      expect.objectContaining({ block: "nearest", inline: "center" }),
    );
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: previousScrollIntoView,
    });
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

  it("uses labeled semantic states with local dark-mode and reduced-motion contracts", () => {
    const { container } = render(<DossierWorkspace dossier={demoDossier} demo />);
    const semanticStates = Array.from(
      container.querySelectorAll<HTMLElement>("[data-semantic-tone]"),
    );

    expect(semanticStates.length).toBeGreaterThan(0);
    expect(semanticStates.some((item) => item.textContent?.includes("Beleglage"))).toBe(true);
    expect(semanticStates.some((item) => item.className.includes("dark:"))).toBe(true);
    expect(container.innerHTML).toContain("motion-reduce:transition-none");
    expect(container.textContent).toContain("Eine Abdeckungsquote ist nicht verfügbar.");
    expect(
      screen
        .getAllByRole("img")
        .every((item) => !(item.getAttribute("aria-label") ?? "").includes("%")),
    ).toBe(true);
  });

  it("navigates a real claim-to-question-to-source-and-option trace", () => {
    render(<DossierWorkspace dossier={dossierWithLinkedQuestion()} demo />);

    const selectedClaim = claimSelector(
      /Internationale Beispiele berichten positive Effekte/,
    );
    fireEvent.click(selectedClaim);

    expect(selectedClaim.getAttribute("aria-pressed")).toBe("true");
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

  it("highlights related objects, retains the claim selection and announces it", () => {
    const { container } = render(<DossierWorkspace dossier={dossierWithLinkedQuestion()} demo />);
    const selectedClaim = claimSelector(
      /Internationale Beispiele berichten positive Effekte/,
    );
    fireEvent.click(selectedClaim);

    expect(selectedClaim.getAttribute("data-related")).toBe("selected");
    expect(container.querySelector('[data-related="unrelated"]')).toBeTruthy();
    const sourceLane = screen
      .getByRole("heading", { name: "Quellen zur Aussage" })
      .closest("section");
    expect(sourceLane?.querySelector('[data-related="related"]')).toBeTruthy();
    expect(sourceLane?.querySelector('[data-related="unrelated"]')).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Aussage ausgewählt");

    fireEvent.click(screen.getByRole("tab", { name: "Quellen" }));
    fireEvent.click(screen.getByRole("tab", { name: "Überblick" }));

    expect(
      claimSelector(
        /Internationale Beispiele berichten positive Effekte/,
      ).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("filters sources only by real status and relation data", () => {
    render(<DossierWorkspace dossier={dossierWithUnreviewedSource()} demo />);
    fireEvent.click(screen.getByRole("tab", { name: "Quellen" }));

    const unreviewed = screen.getByRole("button", { name: /Ungeprüft \(/ });
    expect(unreviewed.hasAttribute("disabled")).toBe(false);
    fireEvent.click(unreviewed);

    expect(unreviewed.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getAllByText(/Quellenstatus:/).length).toBeGreaterThan(0);
    expect(screen.getByRole("group", { name: "Quellen filtern" })).toBeTruthy();
  });

  it("prefers a concrete finding over a generic question-source link", () => {
    const concrete = dossierWithDirectQuestionSource(true);
    const concreteQuestion = buildDossierWorkspaceModel(concrete.dossier).questions.find(
      (question) => question.id === "q-source-priority",
    );
    const concreteLinks = concreteQuestion?.sourceLinks.filter(
      (link) => link.sourceId === concrete.finding.sourceId,
    );

    expect(concreteLinks).toEqual([
      expect.objectContaining({
        relation:
          concrete.finding.finding === "supports" ? "supports" : "contradicts",
      }),
    ]);

    const generic = dossierWithDirectQuestionSource(false);
    const genericQuestion = buildDossierWorkspaceModel(generic.dossier).questions.find(
      (question) => question.id === "q-source-priority",
    );
    expect(
      genericQuestion?.sourceLinks.filter(
        (link) => link.sourceId === generic.finding.sourceId,
      ),
    ).toEqual([
      expect.objectContaining({
        relation: "unclear",
        relationLabel: "zur Prüfung zugeordnet",
      }),
    ]);
  });

  it("keeps participation productive and read-only without inventing a round", () => {
    render(<DossierWorkspace dossier={demoDossier} demo />);
    fireEvent.click(screen.getByRole("tab", { name: "Beteiligung" }));

    expect(screen.getByRole("heading", { name: /Kein realer Beteiligungspfad/ })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Dokumentierte betroffene Gruppen/ })).toBeTruthy();
    expect(screen.getByText(/Menschen mit Mobilitätseinschränkungen/)).toBeTruthy();
    expect(screen.getByText(/Freigabe- oder Bereitschaftsstatus: nicht verfügbar/)).toBeTruthy();
    expect(screen.getByText(/Keine automatische Übergabe/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Offene Fragen prüfen" })).toBeTruthy();
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
