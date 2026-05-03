import { beforeEach, describe, expect, it } from "vitest";
import {
  createContentPrepForThemenradarItem,
  createShareReadyForThemenradarItem,
  createThemenradarItem,
  createThemenradarManualExport,
  setThemenradarRepoForTests,
} from "@features/themenradar/store";
import { createInMemoryThemenradarRepo } from "@features/themenradar/server/repo";

describe("themenradar-export.contract", () => {
  beforeEach(() => {
    setThemenradarRepoForTests(createInMemoryThemenradarRepo());
  });

  it("blocks exports before review_ready", async () => {
    const item = await createThemenradarItem({
      title: "Quartiersverkehr und Schulwege",
      rawSignal: "Rueckmeldungen aus Stadtteilforen.",
      sourceType: "community",
    });
    await createContentPrepForThemenradarItem(item.id);

    await expect(
      createThemenradarManualExport(item.id, "post"),
    ).rejects.toThrow("themenradar_export_requires_review_ready");
  });

  it("creates manual review-bound exports without tracking fields", async () => {
    const item = await createThemenradarItem({
      title: "Hitzeplaene in der Innenstadt",
      rawSignal: "Mehrere Hinweise aus Kommune und Gesundheitsnetz.",
      sourceType: "news",
      linkedAnlassraumId: "anlass_77",
      linkedDossierId: "dossier_77",
    });
    await createContentPrepForThemenradarItem(item.id);
    await createShareReadyForThemenradarItem(item.id);

    const post = await createThemenradarManualExport(item.id, "post");
    const carousel = await createThemenradarManualExport(item.id, "carousel");
    const script = await createThemenradarManualExport(item.id, "script");

    expect(post.payload.kind).toBe("post");
    expect(carousel.payload.kind).toBe("carousel");
    expect(script.payload.kind).toBe("script");
    expect(post.manualReleaseOnly).toBe(true);
    expect(post.reviewRequired).toBe(true);
    expect(post.autoPostEligible).toBe(false);
    expect(post.officialSocialAutoPosting).toBe(false);
    expect(post.distributionHandoff.guardrails.manualReleaseOnly).toBe(true);
    expect(post.distributionHandoff.guardrails.externalAutopostAllowed).toBe(false);
    expect(post.distributionHandoff.targets.themenradarAdmin).toBe(
      `/admin/themenradar/${item.id}`,
    );
    expect(post.distributionHandoff.targets.dossierStudio).toBe(
      `/dossier/${item.linkedDossierId}/studio`,
    );
    expect(post.distributionHandoff.routeFlow).toEqual([
      "themenradar_admin",
      "dossier_studio",
      "share_export_manual",
    ]);

    const flattened = JSON.stringify({ post, carousel, script }).toLowerCase();
    expect(flattened).not.toContain("session");
    expect(flattened).not.toContain("tracking");
    expect(flattened).not.toContain("pixel");
    expect(flattened).not.toContain("visitor");
    expect(flattened).not.toContain("fingerprint");
  });
});
