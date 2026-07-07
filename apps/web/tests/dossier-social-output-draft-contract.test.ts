import { describe, expect, it } from "vitest";

import { buildCanonicalSourcePack } from "@/features/create/canonicalSourcePackContract";
import { buildDossierSocialOutputDraft } from "@/features/create/dossierSocialOutputDraftContract";

describe("dossier social output draft contract", () => {
  it("keeps all output drafts as review-first non-published drafts", () => {
    const draft = buildDossierSocialOutputDraft({
      draftId: "draft-1",
      dossierId: "d-1",
      kind: "newsletter_draft",
      title: "Newsletter",
      summary: "Nur Entwurf",
      sourcePack: buildCanonicalSourcePack({
        sourcePackId: "sp-1",
        sources: [{ sourceId: "s-1", title: "Quelle", evidenceState: "supported" }],
      }),
      trustState: "supported",
      preparationStatus: "publish_ready",
    });

    expect(draft.distributionChannels).toEqual(["newsletter_draft"]);
    expect(draft.autoPublish).toBe(false);
    expect(draft.externalApiTriggered).toBe(false);
    expect(draft.publishReadyIsPublished).toBe(false);
  });

  it("keeps short video script drafts provider-free", () => {
    const draft = buildDossierSocialOutputDraft({
      draftId: "draft-2",
      dossierId: "d-2",
      kind: "short_video_script_draft",
      title: "Short Video",
      summary: "Noch kein Rendern",
    });

    expect(draft.outputFormat).toBe("reel_script");
    expect(draft.distributionChannels).toEqual([]);
  });
});
