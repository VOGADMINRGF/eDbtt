import { normalizePackageId } from "./helpers";
import {
  normalizePricingSegmentId,
  resolvePricingSegmentForPackage,
} from "./journey.de";
import type { EDebattePackageId, PricingSegmentId } from "./types";
import type { PricingLocale } from "./i18n";

export const ORDER_SEGMENT_ORDER: readonly PricingSegmentId[] = [
  "privat",
  "journalismus",
  "organisationen",
  "kommunen",
] as const;

export type PricingOrderEntrySelection = {
  segmentId: PricingSegmentId;
  packageId: EDebattePackageId | null;
  preselected: boolean;
};

export function resolvePricingOrderEntrySelection(input: {
  segmentId?: string | null;
  packageId?: string | null;
}): PricingOrderEntrySelection {
  const packageId = normalizePackageId(input.packageId ?? null);
  const directSegment = normalizePricingSegmentId(input.segmentId ?? null);
  const packageSegment = packageId ? resolvePricingSegmentForPackage(packageId) : null;
  return {
    segmentId: directSegment ?? packageSegment ?? "privat",
    packageId,
    preselected: Boolean(directSegment || packageId),
  };
}

export function buildOrderEntryHref(args: {
  segmentId: PricingSegmentId;
  packageId?: EDebattePackageId | null;
  locale?: PricingLocale;
}) {
  const params = new URLSearchParams();
  params.set("segment", args.segmentId);
  if (args.packageId) params.set("paket", args.packageId);
  if (args.locale === "en") params.set("lang", "en");
  return `/order?${params.toString()}`;
}
