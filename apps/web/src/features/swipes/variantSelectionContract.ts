import type { SwipeVotePayload } from "@/features/swipes/types";

type SwipeVariantSelectionInput = {
  eventualityId?: unknown;
  variantWeight?: unknown;
  variantReason?: unknown;
  variantRankedIds?: unknown;
  excludedEventualityIds?: unknown;
};

export type NormalizedSwipeVariantSelection = {
  eventualityId?: string;
  variantWeight?: 1 | 3 | 5;
  variantReason?: string;
  variantRankedIds?: string[];
  excludedEventualityIds?: string[];
};

const MAX_VARIANT_IDS = 24;
const MAX_REASON_LENGTH = 280;

function normalizeVariantId(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  return value.length > 0 ? value : undefined;
}

function normalizeVariantWeight(raw: unknown): 1 | 3 | 5 | undefined {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 3 || raw === "3") return 3;
  if (raw === 5 || raw === "5") return 5;
  return undefined;
}

function normalizeVariantReason(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  if (!value) return undefined;
  return value.length > MAX_REASON_LENGTH ? value.slice(0, MAX_REASON_LENGTH).trimEnd() : value;
}

function normalizeVariantIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    const id = normalizeVariantId(entry);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_VARIANT_IDS) break;
  }
  return ids;
}

export function normalizeSwipeVariantSelection(
  input: SwipeVariantSelectionInput,
): NormalizedSwipeVariantSelection {
  const eventualityId = normalizeVariantId(input.eventualityId);
  if (!eventualityId) {
    return {};
  }

  const excludedSet = new Set(
    normalizeVariantIdList(input.excludedEventualityIds).filter((id) => id !== eventualityId),
  );
  const variantRankedIds = normalizeVariantIdList(input.variantRankedIds).filter(
    (id) => !excludedSet.has(id),
  );
  const excludedEventualityIds = [...excludedSet];
  const variantWeight = normalizeVariantWeight(input.variantWeight) ?? 3;
  const variantReason = normalizeVariantReason(input.variantReason);

  return {
    eventualityId,
    variantWeight,
    variantReason,
    variantRankedIds: variantRankedIds.length ? variantRankedIds : undefined,
    excludedEventualityIds: excludedEventualityIds.length ? excludedEventualityIds : undefined,
  };
}

export function normalizeSwipeVotePayload(payload: SwipeVotePayload): SwipeVotePayload {
  const normalizedVariants = normalizeSwipeVariantSelection(payload);
  return {
    ...payload,
    eventualityId: normalizedVariants.eventualityId,
    variantWeight: normalizedVariants.variantWeight,
    variantReason: normalizedVariants.variantReason,
    variantRankedIds: normalizedVariants.variantRankedIds,
    excludedEventualityIds: normalizedVariants.excludedEventualityIds,
  };
}
