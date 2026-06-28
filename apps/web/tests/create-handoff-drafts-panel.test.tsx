import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import CreateHandoffDraftSummary from "@/features/create/CreateHandoffDraftSummary";
import { createHandoffDraftFromDialogOutcome } from "@/features/create/createHandoffDrafts";
import { DIALOG_INTELLIGENCE_PREVIEW_FIXTURES } from "@/features/dialog/dialogIntelligenceFixtures";

describe("create handoff draft summary panel", () => {
  it("renders preparation copy, review hint and guardrail for a local draft", () => {
    const draft = createHandoffDraftFromDialogOutcome(
      DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.reviewReadySourceBlocked,
      "factcheck_request",
    );

    const html = renderToStaticMarkup(
      <CreateHandoffDraftSummary draft={draft} onQueueForReview={() => {}} />,
    );

    expect(html).toContain("Vorbereitung gespeichert");
    expect(html).toContain(
      "Noch wurde nichts veröffentlicht, zusammengeführt oder als Dossier/Anlassraum erstellt.",
    );
    expect(html).toContain("Zieltyp");
    expect(html).toContain("Status:");
    expect(html).toContain("Offene Fragen");
    expect(html).toContain("Zur Prüfung vormerken");
    expect(html).toContain("Community Source Review");
    expect(html).toContain("Community kann Quellenhinweise beitragen");
    expect(html).toContain("Quelle vorschlagen");
    expect(html).toContain("Review-first: keine automatische Veröffentlichung oder Erstellung.");
  });

  it("keeps CreateVisualFollowup wired to the review queue bridge without a direct route call in the component", () => {
    const followupSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"),
      "utf8",
    );
    const summarySource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateHandoffDraftSummary.tsx"),
      "utf8",
    );
    const bridgeSource = readFileSync(
      resolve(process.cwd(), "src/features/create/createHandoffReviewQueueRuntimeBridge.ts"),
      "utf8",
    );

    expect(followupSource).toContain("CreateHandoffDraftSummary");
    expect(followupSource).toContain("setPreparedHandoffDraft");
    expect(followupSource).toContain("onSelectHandoff={prepareDialogHandoffDraft}");
    expect(followupSource).toContain("onSelectBranch={prepareDialogBranchDraft}");
    expect(followupSource).toContain("onStartNewBranch={prepareNewBranchDraft}");
    expect(followupSource).toContain("setPreparedReviewQueueItem");
    expect(followupSource).toContain("queuePreparedHandoffDraftForReview");
    expect(followupSource).toContain("submitCreateHandoffReviewQueueItemToRuntime");
    expect(summarySource).toContain("Vorbereitung gespeichert");
    expect(summarySource).toContain("Zur Prüfung vormerken");
    expect(summarySource).toContain("Zur redaktionellen Prüfung übergeben");
    expect(summarySource).toContain("Community Source Review");
    expect(summarySource).toContain("Gegenbeleg vorschlagen");
    expect(bridgeSource).toContain("/api/create/handoffs");
    expect(followupSource).not.toContain("router.push(");
  });
});
