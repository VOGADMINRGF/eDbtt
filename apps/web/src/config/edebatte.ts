import type { EDebattePackage } from "@/features/swipes/types";
import { EDEBATTE_PACKAGE_IDS } from "@features/pricing";

export const EDEBATTE_PACKAGES: EDebattePackage[] = [...EDEBATTE_PACKAGE_IDS];
export const EDEBATTE_PACKAGES_WITH_NONE: Array<EDebattePackage | "none"> = ["none", ...EDEBATTE_PACKAGES];
