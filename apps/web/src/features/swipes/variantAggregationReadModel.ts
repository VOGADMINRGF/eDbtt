type VariantSelectionAggregateRow = {
  _id?: { statementId?: unknown; eventualityId?: unknown };
  selectedCount?: unknown;
  weightedScore?: unknown;
};

type VariantRankedAggregateRow = {
  _id?: { statementId?: unknown; eventualityId?: unknown };
  rankedMentions?: unknown;
  rankPositionScore?: unknown;
};

type StatementTitleLookup = Record<string, string | undefined>;
type EventualityLabelLookup = Record<string, string | undefined>;

export type SwipeVariantAggregationEventuality = {
  eventualityId: string;
  label: string;
  selectedCount: number;
  weightedScore: number;
  averageWeight: number | null;
  rankedMentions: number;
  averageRank: number | null;
};

export type SwipeVariantAggregationStatement = {
  statementId: string;
  title: string;
  totalVariantSelections: number;
  eventualities: SwipeVariantAggregationEventuality[];
};

type BuildSwipeVariantAggregationReadModelInput = {
  selectedRows: VariantSelectionAggregateRow[];
  rankedRows: VariantRankedAggregateRow[];
  statementTitles?: StatementTitleLookup;
  eventualityLabels?: EventualityLabelLookup;
};

type MutableEventualityAggregate = {
  eventualityId: string;
  label: string;
  selectedCount: number;
  weightedScore: number;
  rankedMentions: number;
  rankPositionScore: number;
};

function toNonEmptyString(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  return value.length ? value : null;
}

function toNonNegativeInt(raw: unknown): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function createEmptyAggregate(eventualityId: string, label: string): MutableEventualityAggregate {
  return {
    eventualityId,
    label,
    selectedCount: 0,
    weightedScore: 0,
    rankedMentions: 0,
    rankPositionScore: 0,
  };
}

export function buildSwipeVariantAggregationReadModel(
  input: BuildSwipeVariantAggregationReadModelInput,
): SwipeVariantAggregationStatement[] {
  const statementTitles = input.statementTitles ?? {};
  const eventualityLabels = input.eventualityLabels ?? {};
  const byStatement = new Map<string, Map<string, MutableEventualityAggregate>>();

  const ensureAggregate = (statementId: string, eventualityId: string): MutableEventualityAggregate => {
    let statementMap = byStatement.get(statementId);
    if (!statementMap) {
      statementMap = new Map<string, MutableEventualityAggregate>();
      byStatement.set(statementId, statementMap);
    }
    const existing = statementMap.get(eventualityId);
    if (existing) return existing;
    const label = eventualityLabels[eventualityId] || "Eventualität";
    const created = createEmptyAggregate(eventualityId, label);
    statementMap.set(eventualityId, created);
    return created;
  };

  for (const row of input.selectedRows) {
    const statementId = toNonEmptyString(row?._id?.statementId);
    const eventualityId = toNonEmptyString(row?._id?.eventualityId);
    if (!statementId || !eventualityId) continue;
    const aggregate = ensureAggregate(statementId, eventualityId);
    aggregate.selectedCount += toNonNegativeInt(row.selectedCount);
    aggregate.weightedScore += toNonNegativeInt(row.weightedScore);
  }

  for (const row of input.rankedRows) {
    const statementId = toNonEmptyString(row?._id?.statementId);
    const eventualityId = toNonEmptyString(row?._id?.eventualityId);
    if (!statementId || !eventualityId) continue;
    const aggregate = ensureAggregate(statementId, eventualityId);
    aggregate.rankedMentions += toNonNegativeInt(row.rankedMentions);
    aggregate.rankPositionScore += toNonNegativeInt(row.rankPositionScore);
  }

  const statements: SwipeVariantAggregationStatement[] = [];

  for (const [statementId, eventualityMap] of byStatement.entries()) {
    const eventualities = [...eventualityMap.values()]
      .map<SwipeVariantAggregationEventuality>((row) => ({
        eventualityId: row.eventualityId,
        label: row.label,
        selectedCount: row.selectedCount,
        weightedScore: row.weightedScore,
        averageWeight:
          row.selectedCount > 0
            ? Number((row.weightedScore / row.selectedCount).toFixed(2))
            : null,
        rankedMentions: row.rankedMentions,
        averageRank:
          row.rankedMentions > 0
            ? Number((row.rankPositionScore / row.rankedMentions).toFixed(2))
            : null,
      }))
      .sort((a, b) => {
        if (b.selectedCount !== a.selectedCount) return b.selectedCount - a.selectedCount;
        if (b.weightedScore !== a.weightedScore) return b.weightedScore - a.weightedScore;
        if (b.rankedMentions !== a.rankedMentions) return b.rankedMentions - a.rankedMentions;
        return a.eventualityId.localeCompare(b.eventualityId);
      });

    const totalVariantSelections = eventualities.reduce((sum, row) => sum + row.selectedCount, 0);
    statements.push({
      statementId,
      title: statementTitles[statementId] || "Statement",
      totalVariantSelections,
      eventualities,
    });
  }

  return statements.sort((a, b) => {
    if (b.totalVariantSelections !== a.totalVariantSelections) {
      return b.totalVariantSelections - a.totalVariantSelections;
    }
    return a.statementId.localeCompare(b.statementId);
  });
}
