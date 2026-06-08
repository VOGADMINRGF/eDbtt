import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createStartDraftContext } from "@/features/start/startDraftContext";
import {
  parseCreateDraftNextActionParam,
  resolveDraftNextActionsForResumeItem,
  resolveDraftNextActionsForStartDraft,
  resolveDraftNextActionStatusLabel,
} from "@/features/start/draftNextActionGate";

describe("draft to review analyze gate contract", () => {
  it("offers light analysis as an explicit draft-only next action", () => {
    const draft = createStartDraftContext({
      text: "Ich möchte einen neuen Radweg vor der Grundschule anregen.",
      origin: "start_create_light",
      intent: "proposal",
      targetHint: "create",
      preview: { relevance: "public_relevant" },
    });

    const gate = resolveDraftNextActionsForStartDraft(draft!, {
      isAuthenticated: true,
      canDeepResearch: false,
    });
    const action = gate.actions.find((entry) => entry.kind === "run_light_analysis");

    expect(action).toMatchObject({
      label: "Leichte Einordnung starten",
      costGateRequired: false,
      confirmationRequired: true,
      statusLabel: "Analyse-Entwurf · Noch nicht veröffentlicht · Keine Quellenprüfung gestartet",
    });
    expect(action?.description).not.toContain("DeepSearch");
  });

  it("keeps editorial review explicit and protected for guests", () => {
    const draft = createStartDraftContext({
      text: "Freibier für alle, eigentlich geht es mir um soziale Teilhabe bei öffentlichen Veranstaltungen.",
      origin: "start_relevance_review",
      intent: "needs_reframe",
      targetHint: "register",
      preview: { relevance: "needs_reframe" },
    });

    const gate = resolveDraftNextActionsForStartDraft(draft!, {
      isAuthenticated: false,
      canDeepResearch: false,
    });
    const reviewAction = gate.actions.find((entry) => entry.kind === "request_editorial_review");

    expect(gate.statusLabel).toBe("Öffentliche Relevanz klären");
    expect(reviewAction).toMatchObject({
      label: "Zur redaktionellen Prüfung geben",
      loginRequired: true,
      costGateRequired: false,
      statusLabel: "Zur manuellen Prüfung vorgemerkt",
    });
    expect(reviewAction?.href).toContain("/login?next=");
    expect(reviewAction?.href).toContain(encodeURIComponent("/start?review=editorial"));
  });

  it("marks factcheck as confirmation- and pricing-gated without silent costs", () => {
    const draft = createStartDraftContext({
      text: "Ich möchte die Zahlen zur Krankenhausversorgung prüfen lassen.",
      origin: "start_create_light",
      intent: "question",
      targetHint: "create",
      preview: { relevance: "public_relevant" },
    });

    const gate = resolveDraftNextActionsForStartDraft(draft!, {
      isAuthenticated: true,
      canDeepResearch: false,
    });
    const factcheckAction = gate.actions.find((entry) => entry.kind === "require_pricing");

    expect(factcheckAction).toMatchObject({
      label: "Faktencheck später starten",
      costGateRequired: true,
      confirmationRequired: true,
      statusLabel: "Vertiefte Prüfung benötigt Bestätigung",
    });
  });

  it("does not open review, analyze or factcheck actions for blocked spam inputs", () => {
    const draft = createStartDraftContext({
      text: "Jetzt kaufen https://spam.example/a https://spam.example/b bester Bonuscode heute",
      origin: "start_create_light",
      intent: "unknown",
      targetHint: "create",
      preview: { relevance: "spam_suspected" },
    });

    const gate = resolveDraftNextActionsForStartDraft(draft!, {
      isAuthenticated: true,
      canDeepResearch: false,
    });

    expect(gate.statusLabel).toBe("Kein weiterer Schritt ohne Überarbeitung");
    expect(gate.actions).toHaveLength(0);
  });

  it("builds account resume next actions without starting costly processes automatically", () => {
    const draft = createStartDraftContext({
      text: "Ich möchte einen neuen Radweg vorschlagen.",
      origin: "start_create_light",
      intent: "proposal",
      targetHint: "create",
      preview: { relevance: "public_relevant" },
    });

    const gate = resolveDraftNextActionsForResumeItem({
      category: "Beitrag",
      isAuthenticated: true,
      canDeepResearch: false,
      draft,
    });

    expect(gate.actions.map((entry) => entry.label)).toEqual(
      expect.arrayContaining([
        "Leichte Einordnung starten",
        "Zur redaktionellen Prüfung geben",
        "Faktencheck später starten",
      ]),
    );
  });

  it("keeps create and account surfaces on the new gate wording", () => {
    const createSource = readFileSync(
      resolve(process.cwd(), "src/app/create/CreateDraftNextActionGate.tsx"),
      "utf8",
    );
    const accountSource = readFileSync(
      resolve(process.cwd(), "src/app/account/AccountResumeWorkbenchSection.tsx"),
      "utf8",
    );

    expect(createSource).toContain('data-testid="create-draft-next-action-gate"');
    expect(createSource).toContain("Leichte Einordnung starten");
    expect(createSource).toContain("Vertiefte Prüfung benötigt Bestätigung");
    expect(createSource).toContain("Pakete ansehen");
    expect(accountSource).toContain("Sinnvolle nächste Schritte");
    expect(accountSource).toContain("Weiterarbeiten");
  });

  it("keeps status labels distinct between analysis, review and factcheck gates", () => {
    expect(resolveDraftNextActionStatusLabel("analysis_draft")).toContain("Analyse-Entwurf");
    expect(resolveDraftNextActionStatusLabel("review_pending")).toBe(
      "Zur manuellen Prüfung vorgemerkt",
    );
    expect(resolveDraftNextActionStatusLabel("pricing_confirmation")).toBe(
      "Vertiefte Prüfung benötigt Bestätigung",
    );
  });

  it("parses only the allowed create next-action gate params", () => {
    expect(parseCreateDraftNextActionParam("light_analysis")).toBe("light_analysis");
    expect(parseCreateDraftNextActionParam("factcheck")).toBe("factcheck");
    expect(parseCreateDraftNextActionParam("deepsearch")).toBeNull();
  });
});
