import { describe, expect, it } from "vitest";

import {
  EXISTING_TOPIC_MATCH_GUARDRAIL_NOTE,
  createExistingTopicMatchPanelPreviewFromDialogOutcome,
} from "@/features/create/existingTopicMatches";
import { DIALOG_INTELLIGENCE_PREVIEW_FIXTURES } from "@/features/dialog/dialogIntelligenceFixtures";

describe("create existing topic matches", () => {
  it("keeps preview-derived matches explicitly marked as preview and review-first", () => {
    const model = createExistingTopicMatchPanelPreviewFromDialogOutcome(
      DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.reviewReadySourceBlocked,
    );

    expect(model.sourceKind).toBe("preview");
    expect(model.sourceLabel).toBe("Preview auf Basis lokaler Beispieldaten");
    expect(model.emptyStateText).toBeNull();
    expect(model.guardrailNote).toBe(EXISTING_TOPIC_MATCH_GUARDRAIL_NOTE);
    expect(model.matches.some((match) => match.requiresReview)).toBe(true);
    expect(model.matches.some((match) => match.kind === "source_question")).toBe(
      true,
    );
  });
});
