import { describe, expect, it } from "vitest";

import { buildCanonicalLanguageBridgeRecord } from "@/features/create/languageBridgeTrustFormatContract";
import { buildCanonicalSourcePack } from "@/features/create/canonicalSourcePackContract";
import {
  buildVoxyPublishDraft,
  buildVoxyScriptSegments,
  buildVoxyVideoBriefing,
  resolveVoxyRenderJob,
} from "@/features/voxyVideo";

describe("voxy video contract", () => {
  it("builds a review-first briefing and script path without binding a provider", () => {
    const briefing = buildVoxyVideoBriefing({
      briefingId: "briefing-1",
      sourceContextKind: "dossier",
      sourceContextId: "d-1",
      title: "Voxy Briefing",
      summary: "Nur Vorbereitung",
      languageBridge: buildCanonicalLanguageBridgeRecord({
        sourceLanguage: "de",
        contentLanguage: "de",
        uiLocale: "de",
        originalText: "Original",
        summaryText: "Summary",
      }),
      sourcePack: buildCanonicalSourcePack({
        sourcePackId: "sp-1",
        sources: [{ sourceId: "s-1", title: "Quelle", evidenceState: "supported" }],
      }),
    });
    const segments = buildVoxyScriptSegments({
      briefingId: briefing.briefingId,
      segments: [
        { kind: "intro", text: "Einordnung" },
        { kind: "claim", text: "These" },
      ],
    });

    expect(briefing.mascotDisclosure).toBe("voxy_is_avatar_not_person");
    expect(briefing.providerBound).toBe(false);
    expect(segments).toHaveLength(2);
    expect(segments[0]?.reviewRequired).toBe(true);
  });

  it("blocks rendering when provider or secret truth is missing", () => {
    expect(
      resolveVoxyRenderJob({
        briefingId: "briefing-2",
        approvalGranted: true,
        providerConfigured: false,
      }).status,
    ).toBe("blocked_by_provider");
    expect(
      resolveVoxyRenderJob({
        briefingId: "briefing-3",
        approvalGranted: true,
        providerConfigured: true,
        secretAvailable: false,
      }).status,
    ).toBe("blocked_by_secret");
  });

  it("keeps publish drafts non-published even when publish_ready", () => {
    const draft = buildVoxyPublishDraft({
      briefingId: "briefing-4",
      publishApproved: true,
      runtimeReady: true,
      targetHints: ["website_update"],
    });

    expect(draft.status).toBe("publish_ready");
    expect(draft.autoPublish).toBe(false);
    expect(draft.publishReadyIsPublished).toBe(false);
    expect(draft.externalPublishTriggered).toBe(false);
  });
});
