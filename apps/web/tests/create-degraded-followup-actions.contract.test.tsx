import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import CreateVisualFollowup from "@/features/create/CreateVisualFollowup";
import { buildCreateTechnicalFollowup } from "@/features/create/intelligentFollowupResults";

describe("create degraded followup actions contract", () => {
  it("replaces semantic fallback actions with an honest technical state", () => {
    const html = renderToStaticMarkup(
      <CreateVisualFollowup
        result={buildCreateTechnicalFollowup({
          text: "In Rahnsdorf fehlen sichere Querungen an Kita, Straße und Haltestelle.",
          analysisState: "ai_failed",
          sourceType: "text",
          sourceLoaded: true,
          userMessage:
            "Der Inhalt wurde geladen, konnte aber noch nicht durch das KI-Orchester analysiert werden. Es wurden keine Themen abgeleitet.",
        })}
        onConfirm={() => {}}
        onEdit={() => {}}
        onPrepareSubmission={() => {}}
        onPrepareAnlassraum={() => {}}
        onOpenDossierAppend={() => {}}
        onOpenDossierCreate={() => {}}
        onPrepareVote={() => {}}
        onRequestEditorialReview={() => {}}
        onStartOptionalService={() => {}}
        onRetryPlanner={() => {}}
        onSaveOnly={() => {}}
        continuationValue=""
        onContinuationChange={() => {}}
        onContinueConversation={() => {}}
      />,
    );

    expect(html).toContain("Analyse noch nicht abgeschlossen");
    expect(html).toContain("Es wurden keine Themen abgeleitet.");
    expect(html).toContain("Erneut versuchen");
    expect(html).toContain("Eingabe speichern");
    expect(html).toContain("Details &amp; Transparenz");
    expect(html).not.toContain("Ich habe diese Themen erkannt.");
    expect(html).not.toContain("Verkehrssicherheit");
    expect(html).not.toContain("Kita-/Schulweg &amp; Barrierefreiheit");
    expect(html).not.toContain("Stadtplanung &amp; Finanzierung");
    expect(html).not.toContain("Themenstruktur bestätigen");
  });

  it("keeps retry on the same planner route and avoids reload-based recovery", () => {
    const html = renderToStaticMarkup(
      <CreateVisualFollowup
        result={buildCreateTechnicalFollowup({
          text: "Mehrthemenbeitrag",
          analysisState: "ai_failed",
          sourceType: "text",
          sourceLoaded: true,
          userMessage:
            "Die KI-Analyse konnte noch nicht durchgeführt werden. Es wurden keine Themen abgeleitet.",
        })}
        onConfirm={() => {}}
        onEdit={() => {}}
        onPrepareSubmission={() => {}}
        onPrepareAnlassraum={() => {}}
        onOpenDossierAppend={() => {}}
        onOpenDossierCreate={() => {}}
        onPrepareVote={() => {}}
        onRequestEditorialReview={() => {}}
        onStartOptionalService={() => {}}
        onRetryPlanner={() => {}}
        isRetryPlannerPending
        onSaveOnly={() => {}}
        continuationValue=""
        onContinuationChange={() => {}}
        onContinueConversation={() => {}}
      />,
    );

    expect(html).toContain("Details &amp; Transparenz");
    expect(html).toContain("Erneut versuchen");
    expect(html).not.toContain("Einordnung wird erneut versucht …");

    const clientSource = readFileSync(resolve(process.cwd(), "src/app/create/CreateClient.tsx"), "utf8");
    expect(clientSource).toContain('fetch("/api/create/intelligent-followup"');
    expect(clientSource).toContain("setIsRetryPlannerPending(true);");
    expect(clientSource).toContain("setIsRetryPlannerPending(false);");
    expect(clientSource).not.toContain("window.location.reload");
  });
});
