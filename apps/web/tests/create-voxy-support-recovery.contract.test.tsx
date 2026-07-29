import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import CreateVisualFollowup from "@/features/create/CreateVisualFollowup";
import CreateWorkspaceShell from "@/features/create/CreateWorkspaceShell";
import { buildCreateTechnicalFollowup } from "@/features/create/intelligentFollowupResults";
import {
  deriveVoxyGreetingName,
  getCreateVoxyCopy,
} from "@/features/create/createVoxySupportCopy";

const NOOP = () => {};

describe("/create Voxy and support recovery contract", () => {
  it("uses a safe first name and falls back for unsuitable account values", () => {
    expect(deriveVoxyGreetingName("Renée Beispiel")).toBe("Renée");
    expect(deriveVoxyGreetingName("user@example.org")).toBeNull();
    expect(deriveVoxyGreetingName("anonymous")).toBeNull();
    expect(getCreateVoxyCopy("de", "Renée Beispiel").greeting).toBe("Hallo Renée,");
    expect(getCreateVoxyCopy("de", "user@example.org").greeting).toBe(
      "Hallo Nachbar,",
    );
  });

  it("renders the truthful ticket recovery message without another save action", () => {
    const result = buildCreateTechnicalFollowup({
      text: "Vor der Schule fehlen sichere Querungen.",
      analysisState: "ai_failed",
      sourceType: "text",
      sourceLoaded: true,
      userMessage: "Analyse nicht verfügbar.",
    });
    const html = renderToStaticMarkup(
      <CreateVisualFollowup
        result={result}
        locale="de"
        supportHandoff={{
          status: "created",
          ticket: {
            ticketNumber: "EDB-20260729-ABC12345",
            status: "open",
            safeUserMessage: "Fall angelegt.",
            viewHref: "/account?ticket=EDB-20260729-ABC12345#support-tickets",
            notificationLinked: true,
          },
        }}
        onConfirm={NOOP}
        onEdit={NOOP}
        onPrepareSubmission={NOOP}
        onPrepareAnlassraum={NOOP}
        onOpenDossierAppend={NOOP}
        onOpenDossierCreate={NOOP}
        onPrepareVote={NOOP}
        onRetryPlanner={NOOP}
        onSaveOnly={NOOP}
        onDeferWork={NOOP}
        continuationValue=""
        onContinuationChange={NOOP}
        onContinueConversation={NOOP}
      />,
    );

    expect(html).toContain("Voxy");
    expect(html).toContain("Deinen Beitrag habe ich gespeichert.");
    expect(html).toContain("Ich habe die Meldung an unser IT-Team übergeben.");
    expect(html).toContain("EDB-20260729-ABC12345");
    expect(html).toContain("Ticket ansehen");
    expect(html).not.toContain("Eingabe speichern");
  });

  it("keeps the initial shell focused and places the no-publish guardrail by the composer", () => {
    const html = renderToStaticMarkup(
      <CreateWorkspaceShell
        locale="de"
        activeStage="input"
        phase="initial"
        chatThread={<p>Hallo Nachbar,</p>}
        notice={<p>Hinweis</p>}
        composer={<textarea aria-label="Beitrag" />}
      />,
    );
    expect(html).not.toContain("data-create-shell-pipeline");
    expect(html).toContain("Kein Auto-Publish");
    expect(html.indexOf("Hinweis")).toBeLessThan(html.indexOf("Beitrag"));
  });

  it("saves before analysis and carries draft and correlation identifiers", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/create/CreateClient.tsx"),
      "utf8",
    );
    const startFlow = source.slice(
      source.indexOf("const startCreateFlow"),
      source.indexOf("const handleStart"),
    );
    expect(startFlow.indexOf('fetch("/api/create/save"')).toBeLessThan(
      startFlow.indexOf('fetch("/api/create/intelligent-followup"'),
    );
    expect(startFlow).toContain("analysisRunInFlightRef.current");
    expect(startFlow).toContain("correlationId");
    expect(startFlow).toContain("draftId: runDraftId");
    expect(startFlow).toContain("autoPublish: false");
  });
});
