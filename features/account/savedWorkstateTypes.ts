import type { CreateSavedWorkstateRecord } from "@/features/create/createSavedWorkstateContract";

export type AccountSavedWorkstateSlice = {
  savedWorkstates?: CreateSavedWorkstateRecord[];
};

export function readAccountSavedWorkstateSlice(
  src: unknown,
): AccountSavedWorkstateSlice {
  const value =
    src && typeof src === "object"
      ? (src as { savedWorkstates?: unknown }).savedWorkstates
      : undefined;

  return {
    savedWorkstates: Array.isArray(value)
      ? (value as CreateSavedWorkstateRecord[])
      : [],
  };
}
