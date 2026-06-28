import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import CreateHandoffDraftSummary from "@/features/create/CreateHandoffDraftSummary";
import { createHandoffDraftFromDialogOutcome } from "@/features/create/createHandoffDrafts";
import {
  createReviewQueueItemFromHandoffDraft,
  markReviewQueueItemQueued,
} from "@/features/create/createHandoffReviewQueue";
import { DIALOG_INTELLIGENCE_PREVIEW_FIXTURES } from "@/features/dialog/dialogIntelligenceFixtures";

describe("create handoff review queue panel", () => {
  it("renders the local queue CTA before a draft is queued", () => {
    const draft = createHandoffDraftFromDialogOutcome(
      DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.reviewReadySourceBlocked,
      "factcheck_request",
    );

    const html = renderToStaticMarkup(
      <CreateHandoffDraftSummary draft={draft} onQueueForReview={() => {}} />,
    );

    expect(html).toContain("Zur Prüfung vormerken");
    expect(html).toContain(
      "Review-first: keine automatische Veröffentlichung, Erstellung oder Zusammenführung.",
    );
    expect(html).toContain("Community kann Quellenhinweise beitragen");
  });

  it("renders the queued review item state without any runtime side effects", () => {
    const draft = createHandoffDraftFromDialogOutcome(
      DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.reviewReadySourceBlocked,
      "dossier_candidate",
    );
    const reviewQueueItem = markReviewQueueItemQueued(
      createReviewQueueItemFromHandoffDraft(draft),
    );

    const html = renderToStaticMarkup(
      <CreateHandoffDraftSummary
        draft={draft}
        reviewQueueItem={reviewQueueItem}
        onQueueForReview={() => {}}
        runtimeSubmissionState="submitted"
      />,
    );

    expect(html).toContain("Zur redaktionellen Prüfung übergeben");
    expect(html).toContain(
      "Der Entwurf wurde an die Review Queue übergeben. Noch wurde nichts veröffentlicht, zusammengeführt oder als Dossier/Anlassraum/Beteiligungsraum erstellt.",
    );
    expect(html).toContain("Dossier-Kandidat prüfen");
    expect(html).toContain("zur Prüfung vorgemerkt");
    expect(html).toContain("Audit-Trail");
    expect(html).toContain(
      "approved_for_setup bleibt ein Review-Status und erstellt noch keine finale Runtime-Entität.",
    );
  });

  it("renders factcheck runtime submission as source review instead of confirmed truth", () => {
    const draft = createHandoffDraftFromDialogOutcome(
      DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.reviewReadySourceBlocked,
      "factcheck_request",
    );
    const reviewQueueItem = markReviewQueueItemQueued(
      createReviewQueueItemFromHandoffDraft(draft),
    );

    const html = renderToStaticMarkup(
      <CreateHandoffDraftSummary
        draft={draft}
        reviewQueueItem={reviewQueueItem}
        onQueueForReview={() => {}}
        runtimeSubmissionState="submitted"
      />,
    );

    expect(html).toContain("Zur Quellenprüfung übergeben");
    expect(html).toContain(
      "Die Aussage wurde zur Prüfung vorgemerkt. Es wurde noch keine Wahrheit bestätigt und keine Quelle automatisch bewertet.",
    );
    expect(html).toContain(
      "Diese Aussage ist zur Quellenprüfung vorgemerkt. Andere können Hinweise, Quellen oder Gegenbeispiele beitragen. Diese Hinweise werden geprüft und bestätigen noch keine Wahrheit.",
    );
    expect(html).not.toContain("Wahrheit wurde bestätigt");
  });

  it("keeps CreateVisualFollowup wired to the existing review queue runtime bridge", () => {
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
    const factcheckBridgeSource = readFileSync(
      resolve(process.cwd(), "src/features/create/factcheckSourceAdapterBridge.ts"),
      "utf8",
    );

    expect(followupSource).toContain("setPreparedReviewQueueItem");
    expect(followupSource).toContain("queuePreparedHandoffDraftForReview");
    expect(followupSource).toContain("reviewQueueItem={preparedReviewQueueItem}");
    expect(followupSource).toContain("onQueueForReview={queuePreparedHandoffDraftForReview}");
    expect(followupSource).toContain("submitCreateHandoffReviewQueueItemToRuntime");
    expect(followupSource).toContain("runtimeSubmissionState={reviewQueueRuntimeState}");
    expect(summarySource).toContain("Zur Prüfung vormerken");
    expect(summarySource).toContain("Zur redaktionellen Prüfung übergeben");
    expect(summarySource).toContain("Zur Quellenprüfung übergeben");
    expect(summarySource).toContain("Kontext ergänzen");
    expect(bridgeSource).toContain("/api/create/handoffs");
    expect(factcheckBridgeSource).toContain("/api/factcheck/enqueue");
    expect(followupSource).not.toContain("router.push(");
    expect(followupSource).not.toContain("/api/admin/review");
  });
});
