import { getPackagesByIds, PRIVATE_PACKAGE_IDS, toEdebatePlanId } from "@features/pricing";

export type BillingInterval = "month" | "year";

export type VOGMembershipPlan = {
  id: "vog-membership";
  label: string;
  description: string;
  suggestedPerPersonPerMonth: number;
};

type PrivatePackageId = (typeof PRIVATE_PACKAGE_IDS)[number];
export type EDebattePlanId = `edb-${PrivatePackageId}`;

export type EDebattePlan = {
  id: EDebattePlanId;
  label: string;
  description: string;
  listPrice: {
    amount: number;
    interval: BillingInterval;
  };
  /**
   * Hilfsflag für UI/Anzeige – z. B. Badge „kostenfrei“,
   * Rabattberechnung ignoriert freie Pakete automatisch.
   */
  isFree?: boolean;
};

export const VOG_MEMBERSHIP_PLAN: VOGMembershipPlan = {
  id: "vog-membership",
  label: "eDebatte-Mitgliedschaft",
  description:
    "Trägt den Aufbau und Betrieb der weltweiten Entscheidungsstruktur – unabhängig von Stiftungen, Großvermögen oder staatlichen Förderprogrammen.",
  suggestedPerPersonPerMonth: 5.63,
};

export const EDEBATTE_PLANS: EDebattePlan[] = getPackagesByIds(PRIVATE_PACKAGE_IDS).map((pkg) => ({
  id: toEdebatePlanId(pkg.id) as EDebattePlanId,
  label: pkg.titel,
  description: pkg.beschreibungKurz,
  listPrice: { amount: pkg.preisMonat ?? 0, interval: "month" },
  isFree: pkg.preisMonat === 0,
}));
