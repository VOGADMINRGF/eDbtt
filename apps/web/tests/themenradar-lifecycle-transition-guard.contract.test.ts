import { beforeEach, describe, expect, it } from "vitest";
import {
  createContentPrepForThemenradarItem,
  createShareReadyForThemenradarItem,
  createThemenradarItem,
  setThemenradarRepoForTests,
  updateThemenradarItem,
} from "@features/themenradar/store";
import { createInMemoryThemenradarRepo } from "@features/themenradar/server/repo";

describe("themenradar-lifecycle-transition-guard.contract", () => {
  beforeEach(() => {
    setThemenradarRepoForTests(createInMemoryThemenradarRepo());
  });

  it("blocks invalid or implicit publish/review transitions", async () => {
    const actor = { userId: "admin-1" };
    const item = await createThemenradarItem({
      title: "Wohnen und Nebenkosten",
      rawSignal: "Signal aus Beratungsstellen.",
      sourceType: "news",
    }, actor);

    await expect(
      updateThemenradarItem(item.id, { lifecycleStatus: "review_ready" }, actor),
    ).rejects.toThrow("review_ready_requires_share_ready_action");

    await expect(
      updateThemenradarItem(item.id, { lifecycleStatus: "published", publishIntent: true }, actor),
    ).rejects.toThrow("invalid_lifecycle_transition");

    await expect(createShareReadyForThemenradarItem(item.id, actor)).rejects.toThrow(
      "themenradar_not_qualified_for_share_ready",
    );
  });

  it("keeps content-prep locked once a topic is published", async () => {
    const actor = { userId: "admin-2" };
    const item = await createThemenradarItem({
      title: "Wasserknappheit im Sommer",
      rawSignal: "Signale aus Kommune und Land.",
      sourceType: "community",
    }, actor);

    await createContentPrepForThemenradarItem(item.id, actor);
    await createShareReadyForThemenradarItem(item.id, actor);
    await updateThemenradarItem(
      item.id,
      { lifecycleStatus: "published", publishIntent: true, reviewNote: "Freigegeben" },
      actor,
    );

    await expect(createContentPrepForThemenradarItem(item.id, actor)).rejects.toThrow(
      "themenradar_content_prep_locked_after_publish",
    );
  });
});
