import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import ExistingTopicMatchesPanel from "@/features/create/ExistingTopicMatchesPanel";
import {
  createExistingTopicMatchPanelPreviewFromDialogOutcome,
  getPrimaryExistingTopicMatch,
  getVisibleExistingTopicMatches,
} from "@/features/create/existingTopicMatches";
import {
  EXISTING_TOPIC_MATCH_PANEL_PREVIEW_MODEL,
} from "@/features/create/existingTopicMatchesFixtures";
import { DIALOG_INTELLIGENCE_PREVIEW_FIXTURES } from "@/features/dialog/dialogIntelligenceFixtures";

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

describe("existing topic matches panel", () => {
  it("renders the heading and every preview match kind", () => {
    const html = renderToStaticMarkup(
      <ExistingTopicMatchesPanel model={EXISTING_TOPIC_MATCH_PANEL_PREVIEW_MODEL} />,
    );

    expect(html).toContain("Dazu gibt es bereits ähnliche Themen");
    expect(html).toContain("topic");
    expect(html).toContain("branch");
    expect(html).toContain("participation_space");
    expect(html).toContain("dossier");
    expect(html).toContain("opinion_cluster");
    expect(html).toContain("source_question");
  });

  it("shows the no-auto-merge guardrail and never claims a merge or graph", () => {
    const html = renderToStaticMarkup(
      <ExistingTopicMatchesPanel model={EXISTING_TOPIC_MATCH_PANEL_PREVIEW_MODEL} />,
    );

    expect(html).toContain("Preview auf Basis lokaler Beispieldaten");
    expect(html).toContain("Das sind Anschlussvorschläge, keine automatische Zusammenführung.");
    expect(html).not.toContain("zusammengeführt");
    expect(html).not.toContain("Graph erstellt");
    expect(html).not.toContain("Auto-Merge");
  });

  it("shows an explicit empty state when no runtime match is strong enough", () => {
    const html = renderToStaticMarkup(
      <ExistingTopicMatchesPanel
        model={{
          ...EXISTING_TOPIC_MATCH_PANEL_PREVIEW_MODEL,
          matches: [],
          sourceKind: "runtime",
          sourceLabel: "Gefundene Anschlüsse aus vorhandenen eDebatte-Strukturen",
          emptyStateText:
            "Aus vorhandenen eDebatte-Strukturen wurde kein belastbarer Anschluss gefunden. Du kannst bewusst einen neuen Zweig starten.",
        }}
      />,
    );

    expect(html).toContain("Gefundene Anschlüsse aus vorhandenen eDebatte-Strukturen");
    expect(html).toContain("kein belastbarer Anschluss gefunden");
    expect(html).not.toContain("fixture-topic-weak");
  });

  it("keeps opinion clusters carefully worded and shows source review need", () => {
    const html = renderToStaticMarkup(
      <ExistingTopicMatchesPanel model={EXISTING_TOPIC_MATCH_PANEL_PREVIEW_MODEL} />,
    );

    expect(html).toContain("Ähnliche Meinungen bisher gezählt: 14.");
    expect(html).toContain("Das ist keine repräsentative Statistik.");
    expect(html).toContain("Quellenprüfungsbedarf");
  });

  it("hides rejected matches from selectable recommendations", () => {
    const model = {
      ...EXISTING_TOPIC_MATCH_PANEL_PREVIEW_MODEL,
      matches: [
        ...EXISTING_TOPIC_MATCH_PANEL_PREVIEW_MODEL.matches,
        {
          id: "fixture-rejected",
          kind: "branch" as const,
          title: "Verworfener Anschluss",
          summary: "Soll nicht angezeigt werden.",
          strength: "strong" as const,
          status: "rejected" as const,
          reason: "Verworfen.",
          requiresReview: false,
        },
      ],
    };

    const html = renderToStaticMarkup(<ExistingTopicMatchesPanel model={model} />);

    expect(getVisibleExistingTopicMatches(model).some((match) => match.id === "fixture-rejected")).toBe(false);
    expect(html).not.toContain("Verworfener Anschluss");
  });

  it("fires only optional callbacks for connect, count and start-new-branch actions", () => {
    const onSelectMatch = vi.fn();
    const onStartNewBranch = vi.fn();
    const onCountSimilarOpinion = vi.fn();
    const onPrepareReview = vi.fn();

    const element = ExistingTopicMatchesPanel({
      model: EXISTING_TOPIC_MATCH_PANEL_PREVIEW_MODEL,
      onSelectMatch,
      onStartNewBranch,
      onCountSimilarOpinion,
      onPrepareReview,
    });

    findButtonByLabel(element, "An bestehenden Zweig anknüpfen")?.props.onClick?.();
    findButtonByLabel(element, "Als ähnliche Meinung zählen")?.props.onClick?.();
    findButtonByLabel(element, "Für Redaktion vormerken")?.props.onClick?.();
    findButtonByLabel(element, "Eigenen Zweig starten")?.props.onClick?.();

    expect(onSelectMatch).toHaveBeenCalledWith("fixture-topic-weak");
    expect(onCountSimilarOpinion).toHaveBeenCalledWith("fixture-opinion-cluster");
    expect(onPrepareReview).toHaveBeenCalledWith("fixture-source-question");
    expect(onStartNewBranch).toHaveBeenCalledTimes(1);
  });

  it("keeps dossier and participation suggestions review-first and preparatory", () => {
    const html = renderToStaticMarkup(
      <ExistingTopicMatchesPanel model={EXISTING_TOPIC_MATCH_PANEL_PREVIEW_MODEL} />,
    );

    expect(html).toContain("Dossier-Anknüpfung prüfen");
    expect(html).toContain("Beteiligungsraum ansehen");
    expect(html).toContain(
      "Review-first: Dossier-, Anlass- und Beteiligungsanschlüsse bleiben vorbereitend und brauchen eine bewusste Prüfung.",
    );
  });

  it("builds a dialog preview model without enabling rejected branch starts", () => {
    const rejectedModel = createExistingTopicMatchPanelPreviewFromDialogOutcome({
      ...DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.clarifyStandpoint,
      resultStatus: "rejected",
    });
    const reviewReadyModel = createExistingTopicMatchPanelPreviewFromDialogOutcome(
      DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.reviewReadySourceBlocked,
    );

    expect(rejectedModel.outcomeResultStatus).toBe("rejected");
    expect(reviewReadyModel.matches.some((match) => match.kind === "source_question")).toBe(true);
    expect(reviewReadyModel.matches.some((match) => match.kind === "participation_space")).toBe(true);
    expect(reviewReadyModel.matches.some((match) => match.kind === "dossier")).toBe(true);
    expect(getPrimaryExistingTopicMatch(reviewReadyModel)?.kind).toMatch(
      /participation_space|dossier|source_question/,
    );
  });
});
