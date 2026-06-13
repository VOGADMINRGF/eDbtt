import type { FactcheckJobDoc } from "@features/factcheck/db";

export type AccountFactcheckJobSlice = {
  factcheckJobs?: FactcheckJobDoc[];
};

export function readAccountFactcheckJobSlice(src: unknown): AccountFactcheckJobSlice {
  const value =
    src && typeof src === "object"
      ? (src as { factcheckJobs?: unknown }).factcheckJobs
      : undefined;

  return {
    factcheckJobs: Array.isArray(value) ? (value as FactcheckJobDoc[]) : [],
  };
}
