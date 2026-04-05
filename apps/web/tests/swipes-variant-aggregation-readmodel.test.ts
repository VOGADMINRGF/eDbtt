import { describe, expect, it } from "vitest";
import { buildSwipeVariantAggregationReadModel } from "@/features/swipes/variantAggregationReadModel";

describe("swipes variant aggregation readmodel", () => {
  it("aggregates selected and ranked rows per statement/eventuality", () => {
    const model = buildSwipeVariantAggregationReadModel({
      selectedRows: [
        {
          _id: { statementId: "stmt-1", eventualityId: "evt-1" },
          selectedCount: 3,
          weightedScore: 13,
        },
        {
          _id: { statementId: "stmt-1", eventualityId: "evt-2" },
          selectedCount: 1,
          weightedScore: 3,
        },
      ],
      rankedRows: [
        {
          _id: { statementId: "stmt-1", eventualityId: "evt-1" },
          rankedMentions: 4,
          rankPositionScore: 7,
        },
      ],
      statementTitles: { "stmt-1": "Statement 1" },
      eventualityLabels: { "evt-1": "Variante A", "evt-2": "Variante B" },
    });

    expect(model).toHaveLength(1);
    expect(model[0].statementId).toBe("stmt-1");
    expect(model[0].title).toBe("Statement 1");
    expect(model[0].totalVariantSelections).toBe(4);
    expect(model[0].eventualities[0]).toMatchObject({
      eventualityId: "evt-1",
      label: "Variante A",
      selectedCount: 3,
      weightedScore: 13,
      averageWeight: 4.33,
      rankedMentions: 4,
      averageRank: 1.75,
    });
  });

  it("keeps ranked-only aggregates transparent without fake selected weight", () => {
    const model = buildSwipeVariantAggregationReadModel({
      selectedRows: [],
      rankedRows: [
        {
          _id: { statementId: "stmt-2", eventualityId: "evt-9" },
          rankedMentions: 2,
          rankPositionScore: 5,
        },
      ],
      statementTitles: { "stmt-2": "Statement 2" },
      eventualityLabels: { "evt-9": "Variante X" },
    });

    expect(model).toHaveLength(1);
    expect(model[0].totalVariantSelections).toBe(0);
    expect(model[0].eventualities[0]).toMatchObject({
      eventualityId: "evt-9",
      selectedCount: 0,
      weightedScore: 0,
      averageWeight: null,
      rankedMentions: 2,
      averageRank: 2.5,
    });
  });

  it("ignores invalid aggregate rows defensively", () => {
    const model = buildSwipeVariantAggregationReadModel({
      selectedRows: [
        {
          _id: { statementId: "", eventualityId: "evt-1" },
          selectedCount: 2,
          weightedScore: 4,
        },
        {
          _id: { statementId: "stmt-3", eventualityId: "" },
          selectedCount: 2,
          weightedScore: 4,
        },
      ],
      rankedRows: [
        {
          _id: { statementId: "stmt-3", eventualityId: "evt-3" },
          rankedMentions: "NaN",
          rankPositionScore: 3,
        },
      ],
    });

    expect(model).toHaveLength(1);
    expect(model[0].statementId).toBe("stmt-3");
    expect(model[0].eventualities[0]).toMatchObject({
      eventualityId: "evt-3",
      selectedCount: 0,
      weightedScore: 0,
      rankedMentions: 0,
      averageRank: null,
    });
  });
});
