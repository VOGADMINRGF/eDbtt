import { EDEBATTE_PACKAGES_DE, EDEBATTE_PACKAGE_IDS } from "./plans.de";
import type { EDebattePackageId } from "./types";

const PACKAGE_ID_SET = new Set<EDebattePackageId>(EDEBATTE_PACKAGE_IDS);

export function normalizePackageId(value?: string | null): EDebattePackageId | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/^edb-/, "");
  if (PACKAGE_ID_SET.has(normalized as EDebattePackageId)) {
    return normalized as EDebattePackageId;
  }
  return null;
}

export function getEdebatePackageById(id: string) {
  return EDEBATTE_PACKAGES_DE.find((pkg) => pkg.id === id) ?? null;
}

export function toEdebatePlanId(id: EDebattePackageId) {
  return `edb-${id}` as const;
}
