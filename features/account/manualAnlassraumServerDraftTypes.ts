import type { ManualAnlassraumServerDraftSnapshot } from "@/features/surfaces/runden/manualAnlassraumSetup";

export type AccountManualAnlassraumServerDraftSlice = {
  manualAnlassraumServerDrafts?: ManualAnlassraumServerDraftSnapshot[];
};

export function readAccountManualAnlassraumServerDraftSlice(
  src: unknown,
): AccountManualAnlassraumServerDraftSlice {
  const value =
    src && typeof src === "object"
      ? (src as { manualAnlassraumServerDrafts?: unknown }).manualAnlassraumServerDrafts
      : undefined;

  return {
    manualAnlassraumServerDrafts: Array.isArray(value)
      ? (value as ManualAnlassraumServerDraftSnapshot[])
      : [],
  };
}
