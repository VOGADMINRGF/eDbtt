import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearStartDraftContext,
  createStartDraftContext,
  getStartDraftForTarget,
  getStartDraftGuardrailSummary,
  getStartDraftStatusLabel,
  getStartDraftSurfaceLabel,
  matchStartDraftTopics,
  readStartDraftContext,
  saveStartDraftContext,
  updateStartDraftContext,
} from "@/features/start/startDraftContext";

function installSessionStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    sessionStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
  });
}

describe("start draft context contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores a valid start draft as session-scoped handoff context", () => {
    installSessionStorage();
    const draft = createStartDraftContext({
      text: "Bei uns fehlt ein sicherer Schulweg vor der Grundschule.",
      origin: "start_create_light",
      intent: "problem",
      targetHint: "create",
      preview: {
        contributionType: "Problem",
        possibleTopics: ["Mobilität & öffentlicher Raum"],
        openQuestions: ["Wer ist betroffen?"],
        suggestedNextSteps: ["Themen erkennen"],
        relevance: "public_relevant",
      },
    });

    const saved = saveStartDraftContext(draft);

    expect(saved).not.toBeNull();
    expect(readStartDraftContext()?.text).toContain("sicherer Schulweg");
    expect(getStartDraftForTarget("create")?.targetHint).toBe("create");
    expect(getStartDraftForTarget("themes")).toBeNull();
  });

  it("blocks spam-suspected drafts from downstream handoff targets", () => {
    installSessionStorage();
    saveStartDraftContext(
      createStartDraftContext({
        text: "Jetzt kaufen https://spam.example/a https://spam.example/b",
        origin: "start_create_light",
        intent: "unknown",
        targetHint: "create",
        preview: {
          relevance: "spam_suspected",
        },
      }),
    );

    expect(getStartDraftForTarget("create")).toBeNull();
  });

  it("matches start draft keywords against existing topics without inventing fake hits", () => {
    const matches = matchStartDraftTopics(
      {
        text: "Bei uns fehlt ein sicherer Schulweg vor der Grundschule.",
        preview: {
          possibleTopics: ["Mobilität & öffentlicher Raum"],
        },
      },
      [
        {
          slug: "bezahlbare-energie-und-waermewende-berlin",
          title: "Bezahlbare Energie und belastbare Wärmewende in Berlin",
          framingQuestion: "Wie sichern wir bezahlbare Heiz- und Stromkosten?",
        },
        {
          slug: "sichere-schulwege-im-kiez",
          title: "Sichere Schulwege im Kiez",
          framingQuestion: "Welche Maßnahmen helfen rund um Grundschulen zuerst?",
        },
      ],
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]?.slug).toBe("sichere-schulwege-im-kiez");
    expect(matches[0]?.matchedKeywords).toContain("schulweg");
  });

  it("clears the session-scoped draft context on explicit discard", () => {
    installSessionStorage();
    saveStartDraftContext(
      createStartDraftContext({
        text: "Ein längerer Text für den Handoff.",
        origin: "start_create_light",
        intent: "contribution",
        targetHint: "themes",
      }),
    );

    clearStartDraftContext();

    expect(readStartDraftContext()).toBeNull();
  });

  it("switches work modes without losing the same draft text", () => {
    installSessionStorage();
    saveStartDraftContext(
      createStartDraftContext({
        text: "Bei uns fehlt ein sicherer Schulweg vor der Grundschule.",
        origin: "start_create_light",
        intent: "problem",
        targetHint: "create",
      }),
    );

    updateStartDraftContext({ targetHint: "themes" });

    expect(readStartDraftContext()?.text).toBe(
      "Bei uns fehlt ein sicherer Schulweg vor der Grundschule.",
    );
    expect(getStartDraftForTarget("create")).toBeNull();
    expect(getStartDraftForTarget("themes")?.text).toContain("sicherer Schulweg");
  });

  it("uses shared status helpers instead of per-surface copy drift", () => {
    const draft = createStartDraftContext({
      text: "Bei uns fehlt ein sicherer Schulweg vor der Grundschule.",
      origin: "start_create_light",
      intent: "problem",
      targetHint: "themes",
      preview: {
        relevance: "public_relevant",
      },
    });

    expect(getStartDraftStatusLabel(draft)).toBe("Analyse-Entwurf");
    expect(getStartDraftSurfaceLabel("rounds")).toBe("Runde vorbereiten");
    expect(getStartDraftGuardrailSummary(draft, "themes")).toContain("Noch nicht zusammengeführt");
    expect(getStartDraftGuardrailSummary(draft, "create")).toContain("Keine automatische Prüfung");
  });

  it("persists optional campaign metadata and qr origins without breaking downstream handoffs", () => {
    installSessionStorage();
    saveStartDraftContext(
      createStartDraftContext({
        text: "Ich möchte aus dem QR-Einstieg eine offene Frage zur Versorgung im Stadtteil klären.",
        origin: "campaign_qr",
        intent: "question",
        targetHint: "themes",
        campaign: {
          campaignId: "demo-pflege-vor-ort",
          title: "Pflege vor Ort 2026",
          contextLabel: "Pflege und Versorgung im Stadtteil",
          regionLabel: "Berlin · Pankow",
          sourceLabel: "QR / Kampagnenlink",
        },
      }),
    );

    expect(readStartDraftContext()?.campaign?.campaignId).toBe("demo-pflege-vor-ort");
    expect(readStartDraftContext()?.campaign?.title).toBe("Pflege vor Ort 2026");
    expect(getStartDraftForTarget("themes")?.origin).toBe("campaign_qr");
  });
});
