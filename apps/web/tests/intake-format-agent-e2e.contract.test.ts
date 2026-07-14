import { describe, expect, it } from "vitest";
import { buildIntakeFormatAgentContract } from "@/features/agenticRuntime/intakeFormatAgentE2EContract";

describe("intake format agent e2e contract", () => {
  it("keeps observation, interpretation, hypothesis and evidence separate", () => {
    const model = buildIntakeFormatAgentContract({
      rawInput:
        "Vor unserer Schule fehlen sichere Uebergaenge, und Eltern berichten von gefaehrlichen Situationen am Morgen.",
      followup: {
        understanding: {
          summary: "Gefaehrliche Schulwege rund um eine Schule sollen strukturiert geprueft werden.",
          categories: [{ id: "c1", label: "Forderung", confidence: "medium" }],
          topics: [{ id: "t1", label: "Schulwege", confidence: "medium" }],
          statements: [],
          scopes: ["district"],
          confidence: "medium",
          openQuestion: "Welche Stelle ist fuer die Querung zustaendig?",
        },
        suggestions: [
          {
            id: "s1",
            kind: "dossier",
            title: "Dossier vorbereiten",
            reason: "Mehrere Hinweise sprechen fuer einen review-first Dossierpfad.",
            confidence: "medium",
            requiresConfirmation: true,
          },
        ],
        sourceText:
          "Vor unserer Schule fehlen sichere Uebergaenge, und Eltern berichten von gefaehrlichen Situationen am Morgen.",
        generatedAt: "2026-07-13T08:00:00.000Z",
      },
    });

    expect(model.classification).toEqual([
      expect.objectContaining({
        stage: "visible_observation",
        state: "present",
      }),
      expect.objectContaining({
        stage: "user_interpretation",
        value: "Gefaehrliche Schulwege rund um eine Schule sollen strukturiert geprueft werden.",
      }),
      expect.objectContaining({
        stage: "possible_hypothesis",
        state: "review_required",
      }),
      expect.objectContaining({
        stage: "source_backed_fact",
        value: null,
      }),
    ]);
    expect(model.topicAssignment).toEqual(["Schulwege"]);
    expect(model.affectedGroupCandidates).toEqual(
      expect.arrayContaining(["Schuelerinnen und Schueler", "Eltern und Familien"]),
    );
    expect(model.formatRecommendation).toMatchObject({
      type: "create_dossier",
      requiresConfirmation: true,
    });
    expect(model.safeTrace[0]).toMatchObject({
      roleId: "intake_format",
      requiredHumanAction: "confirm_intake_split",
    });
  });
});
