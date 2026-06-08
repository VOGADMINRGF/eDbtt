import type { CreateContributionLedgerEntry } from "@features/create/createContributionLedger";

export type AccountCreateContributionLedgerSlice = {
  createContributionLedger?: CreateContributionLedgerEntry[];
};

export function readAccountCreateContributionLedgerSlice(
  src: unknown,
): AccountCreateContributionLedgerSlice {
  const value =
    src && typeof src === "object"
      ? (src as { createContributionLedger?: unknown }).createContributionLedger
      : undefined;

  return {
    createContributionLedger: Array.isArray(value)
      ? (value as CreateContributionLedgerEntry[])
      : [],
  };
}
