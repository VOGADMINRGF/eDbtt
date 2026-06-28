import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import DialogResultsHandoffPanel from "@/features/dialog/DialogResultsHandoffPanel";
import {
  DIALOG_INTELLIGENCE_PREVIEW_FIXTURES,
  buildDialogOutcomePreviewFromCreateFollowup,
} from "@/features/dialog/dialogIntelligenceFixtures";
import type { DialogOutcome } from "@/features/dialog/dialogIntelligenceContract";

function flattenText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(flattenText).join(" ");
  }
  if (React.isValidElement(node)) {
    return flattenText(node.props.children);
  }
  return "";
}

function findButtonByLabel(
  node: React.ReactNode,
  label: string,
): React.ReactElement<{ onClick?: () => void; children?: React.ReactNode }> | null {
  if (!React.isValidElement(node)) {
    if (Array.isArray(node)) {
      for (const child of node) {
        const match = findButtonByLabel(child, label);
        if (match) return match;
      }
    }
    return null;
  }

  if (
    node.type === "button" &&
    flattenText(node.props.children).includes(label) &&
    typeof node.props.onClick === "function"
  ) {
    return node as React.ReactElement<{
      onClick?: () => void;
      children?: React.ReactNode;
    }>;
  }

  return findButtonByLabel(node.props.children, label);
}

function renderPanel(outcome: DialogOutcome): string {
  return renderToStaticMarkup(<DialogResultsHandoffPanel outcome={outcome} />);
}

describe("dialog results handoff panel", () => {
  it("renders the result heading and recognized standpoint", () => {
    const html = renderPanel(DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.clarifyStandpoint);

    expect(html).toContain("Was eDebatte bisher aus deinem Beitrag erkennt");
    expect(html).toContain(
      "Wir versuchen deinen Standpunkt so zu verstehen, wie du ihn meinst.",
    );
    expect(html).toContain(
      "Du kannst ihn einfach zählen lassen - oder gemeinsam mit eDebatte weiter ausbauen.",
    );
    expect(html).toContain("Erkannter Standpunkt");
    expect(html).toContain(
      "Der Beitrag fordert mehr Mitsprache, aber mit klaren Schutzregeln und nachvollziehbaren Zuständigkeiten.",
    );
  });

  it("shows the confirmation hint for needs_user_confirmation", () => {
    const html = renderPanel(DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.clarifyStandpoint);

    expect(html).toContain(
      "Bitte bestätige, ob wir deinen Standpunkt richtig verstanden haben.",
    );
    expect(html).toContain("Standpunkt bestätigen");
  });

  it("shows count-only / low openness without forcing perspectives", () => {
    const html = renderPanel(DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.countOnlyOpinion);

    expect(html).toContain("Meine Meinung so erfassen");
    expect(html).toContain(
      "Bitte bestätige, ob wir deinen Standpunkt richtig verstanden haben.",
    );
    expect(html).toContain(
      "Weitere Blickwinkel sind ein Angebot, keine Pflicht. Du kannst deine Meinung auch einfach so erfassen lassen oder später eigene Beispiele, Quellen und Erfahrungen ergänzen.",
    );
    expect(html).not.toContain("Dossier vorbereiten");
  });

  it("shows perspective offers for medium and high openness", () => {
    const html = renderPanel(DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.clarifyStandpoint);

    expect(html).toContain("Weitere Blickwinkel prüfen");
    expect(html).toContain("Institutionelle Sicht");
    expect(html).toContain("Soll die institutionelle Sicht Institutionelle Sicht als Kontext ergänzt werden?");
    expect(html).toContain(
      "Dabei geht es nicht darum, dich von einer anderen Meinung zu überzeugen.",
    );
  });

  it("renders handoff candidates as preparatory and not as created or published", () => {
    const preview = buildDialogOutcomePreviewFromCreateFollowup({
      result: {
        understanding: {
          summary: "Du möchtest sichere Schulwege im Quartier verbessern.",
          dossierContext: "Sichere Schulwege",
          categories: [{ id: "hint", label: "Hinweis", confidence: "high" as const }],
          topics: [
            { id: "mobility", label: "Mobilität & Stadtentwicklung", confidence: "high" as const },
            { id: "community", label: "Kommunales & Lebensumfeld", confidence: "medium" as const },
          ],
          statements: [
            {
              id: "s1",
              text: "Vor der Schule fehlen sichere Querungen und klare Tempo-30-Kontrollen.",
              kind: "demand" as const,
              stance: "pro" as const,
              confidence: "high" as const,
            },
          ],
          scopes: ["district" as const],
          confidence: "high" as const,
        },
        suggestions: [
          {
            id: "dossier:auto",
            kind: "dossier" as const,
            title: "Sichere Schulwege",
            reason: "Das Thema passt zu einem bestehenden Arbeitsstand.",
            confidence: "high" as const,
            href: "/dossier?topic=schulwege",
            requiresConfirmation: true as const,
          },
        ],
        sourceText: "Vor der Schule fehlen sichere Querungen und klare Tempo-30-Kontrollen.",
        generatedAt: "2026-05-10T12:00:00.000Z",
      },
      isConfirmed: true,
    });

    const html = renderPanel(preview);

    expect(html).toContain("Dossier vorbereiten");
    expect(html).toContain("Anlassraum vorbereiten");
    expect(html).toContain("Beteiligungsraum vorbereiten");
    expect(html).toContain(
      "Nur vorbereitend. Kein Auto-Create, kein Auto-Publish, kein stiller Handoff.",
    );
    expect(html).not.toContain("wurde erstellt");
    expect(html).not.toContain("wurde veröffentlicht");
  });

  it("shows factcheck / source review hints for needs_source claims", () => {
    const html = renderPanel(DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.reviewReadySourceBlocked);

    expect(html).toContain("Quellenprüfung vorbereiten");
    expect(html).toContain(
      "Faktische Claims bleiben reviewpflichtig, bis du passende Quellen, Beispiele oder weitere Nachweise ergänzt hast.",
    );
    expect(html).toContain(
      "Bevor daraus mehr wird, sollten erst Quellen oder Beispiele ergänzt werden.",
    );
  });

  it("blocks preparatory handoffs for rejected outcomes", () => {
    const rejectedOutcome: DialogOutcome = {
      ...DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.clarifyStandpoint,
      resultStatus: "rejected",
      recognizedStandpoint: {
        ...DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.clarifyStandpoint.recognizedStandpoint,
        confirmedByUser: false,
      },
    };

    const html = renderPanel(rejectedOutcome);

    expect(html).toContain("Dieses Ergebnis wurde verworfen.");
    expect(html).toContain("Der Ergebnisstand wurde verworfen.");
  });

  it("invokes optional callbacks on preparatory clicks without auto-creating anything", () => {
    const onConfirmStandpoint = vi.fn();
    const onSelectPerspective = vi.fn();
    const onSelectBranch = vi.fn();
    const onSelectHandoff = vi.fn();

    const element = DialogResultsHandoffPanel({
      outcome: DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.clarifyStandpoint,
      onConfirmStandpoint,
      onSelectPerspective,
      onSelectBranch,
      onSelectHandoff,
    });

    findButtonByLabel(element, "Standpunkt bestätigen")?.props.onClick?.();
    findButtonByLabel(element, "Institutionelle Sicht")?.props.onClick?.();
    findButtonByLabel(element, "Pilotphase zuerst testen")?.props.onClick?.();
    findButtonByLabel(element, "Meine Meinung so erfassen")?.props.onClick?.();

    expect(onConfirmStandpoint).toHaveBeenCalledTimes(1);
    expect(onSelectPerspective).toHaveBeenCalledWith(
      "dialog-fixture-clarify-perspective",
    );
    expect(onSelectBranch).toHaveBeenCalledWith(
      "dialog-fixture-clarify-branch",
    );
    expect(onSelectHandoff).toHaveBeenCalledWith("count_opinion");
  });

  it("includes the dialog slogan without claiming the community already decided", () => {
    const html = renderPanel(DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.clarifyStandpoint);

    expect(html).toContain("eDebatte - lass das stärkste Argument gewinnen.");
    expect(html).toContain(
      "Die Community entscheidet - und das stärkste Argument setzt sich durch.",
    );
    expect(html).not.toContain("Die Community hat bereits entschieden");
  });
});
