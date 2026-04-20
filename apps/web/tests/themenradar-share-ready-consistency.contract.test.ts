import { beforeEach, describe, expect, it } from "vitest";
import {
  parseShareReadyAssetContract,
  validateShareReadyAssetConsistency,
} from "@features/anlassraum/shareReadyAssetContract";
import {
  createContentPrepForThemenradarItem,
  createShareReadyForThemenradarItem,
  createThemenradarItem,
  setThemenradarRepoForTests,
} from "@features/themenradar/store";
import { createInMemoryThemenradarRepo } from "@features/themenradar/server/repo";

describe("themenradar share-ready consistency", () => {
  beforeEach(() => {
    setThemenradarRepoForTests(createInMemoryThemenradarRepo());
  });

  it("stores a share-ready snapshot that matches the canonical contract", async () => {
    const item = await createThemenradarItem({
      title: "Wohnungsmarkt und Nachverdichtung",
      rawSignal: "Signal aus Create-Intake und News.",
      sourceType: "create_intake",
      jurisdiction: "kommune",
      linkedAnlassraumId: "65f000000000000000000007",
      campaignKey: "wohnen-nachverdichtung",
    });

    await createContentPrepForThemenradarItem(item.id);
    const detail = await createShareReadyForThemenradarItem(item.id);
    expect(detail.item.lifecycleStatus).toBe("review_ready");
    expect(detail.item.shareContractSnapshot).toBeTruthy();

    const parsed = parseShareReadyAssetContract(detail.item.shareContractSnapshot);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const consistency = validateShareReadyAssetConsistency({
      contract: parsed.value,
    });
    expect(consistency.ok).toBe(true);
    expect(consistency.issues).toEqual([]);
  });
});
