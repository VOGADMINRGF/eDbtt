import type { EDebattePackage } from "@/features/swipes/types";
import { B2B_PACKAGE_IDS, B2G_PACKAGE_IDS, EDEBATTE_PACKAGES_DE, PRIVATE_PACKAGE_IDS } from "@features/pricing";

export const EDEBATTE_PACKAGES: EDebattePackage[] = [
  ...PRIVATE_PACKAGE_IDS,
  ...B2B_PACKAGE_IDS,
  ...B2G_PACKAGE_IDS,
];
export const EDEBATTE_PACKAGES_WITH_NONE: Array<EDebattePackage | "none"> = ["none", ...EDEBATTE_PACKAGES];

const PACKAGE_LABELS = EDEBATTE_PACKAGES_DE.reduce<Record<string, string>>((acc, pkg) => {
  acc[pkg.id] = pkg.titel;
  return acc;
}, {});

export function getEdebatePackageLabel(id?: string | null): string {
  if (!id || id === "none") return "Kein Paket";
  return PACKAGE_LABELS[id] ?? id;
}
