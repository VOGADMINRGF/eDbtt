import { describe, expect, it } from "vitest";

import { buildCanonicalLanguageBridgeRecord } from "@/features/create/languageBridgeTrustFormatContract";
import { buildCanonicalSourcePack } from "@/features/create/canonicalSourcePackContract";
import {
  buildVoxyHybridRuntimeAdapterDisabledResult,
  buildVoxyHybridRuntimeAdapterRequest,
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

  it("defines a provider-neutral hybrid runtime adapter request that stays disabled", () => {
    const briefing = buildVoxyVideoBriefing({
      briefingId: "briefing-5",
      sourceContextKind: "dossier",
      sourceContextId: "d-5",
      title: "Hybrid Foundation",
      summary: "Nur Contract",
      languageBridge: buildCanonicalLanguageBridgeRecord({
        sourceLanguage: "de",
        contentLanguage: "de",
        uiLocale: "de",
        originalText: "Original",
        summaryText: "Zusammenfassung",
      }),
      sourcePack: buildCanonicalSourcePack({
        sourcePackId: "sp-5",
        sources: [{ sourceId: "s-5", title: "Quelle", evidenceState: "supported" }],
      }),
    });
    const segments = buildVoxyScriptSegments({
      briefingId: briefing.briefingId,
      segments: [{ kind: "intro", text: "Einordnung" }],
    });

    const request = buildVoxyHybridRuntimeAdapterRequest({
      requestId: "hybrid-request-1",
      briefing,
      segments,
      sourceLanguage: "de",
      readingLanguage: "de",
      renderLanguage: "de",
      subtitleLanguage: "de",
      idempotencyKey: "idempotency-1",
    });
    const result = buildVoxyHybridRuntimeAdapterDisabledResult(
      "Hybrid Runtime bleibt review-first deaktiviert.",
    );

    expect(request.path).toBe("hybrid_external_render_adapter");
    expect(request.providerNeutral).toBe(true);
    expect(request.runtimeEnabled).toBe(false);
    expect(request.externalApiCalled).toBe(false);
    expect(request.storageWriteAllowed).toBe(false);
    expect(result.status).toBe("disabled_noop");
    expect(result.foundationReady).toBe(true);
    expect(result.runtimeEnabled).toBe(false);
    expect(result.providerCalled).toBe(false);
    expect(result.storageWritten).toBe(false);
  });
});
