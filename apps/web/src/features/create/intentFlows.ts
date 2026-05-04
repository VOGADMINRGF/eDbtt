import type { CreateProductMode } from "@/features/create/createProductModes";
import type { CreateMode } from "@/features/create/intents";
import type { CreateEntryIntent, CreateEntryMode } from "@/features/create/orchestratorIntentContract";

export type CreateIntent = "contribute" | "check" | "draft";

export const CREATE_INTENT_VALUES = ["contribute", "check", "draft"] as const;

function normalize(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

export function parseCreateIntent(raw: unknown): CreateIntent | undefined {
  const value = normalize(raw);
  if (!value) return undefined;

  if (value === "contribute" || value === "beitragen" || value === "contribution") {
    return "contribute";
  }
  if (value === "check" || value === "prüfen" || value === "pruefen" || value === "review") {
    return "check";
  }
  if (value === "draft" || value === "entwerfen" || value === "guided") {
    return "draft";
  }
  return undefined;
}

export function mapCreateIntentToProductMode(intent: CreateIntent): CreateProductMode {
  if (intent === "check") return "media";
  if (intent === "draft") return "guided";
  return "analyze";
}

export function mapProductModeToCreateIntent(mode: CreateProductMode): CreateIntent {
  if (mode === "media") return "check";
  if (mode === "guided") return "draft";
  return "contribute";
}

function parseIntentFromLegacyMode(raw: unknown): CreateIntent | undefined {
  const value = normalize(raw);
  if (!value) return undefined;

  if (value === "source" || value === "manual" || value === "contribute") {
    return "contribute";
  }
  if (value === "check" || value === "review" || value === "media") {
    return "check";
  }
  if (value === "draft" || value === "ai" || value === "guided") {
    return "draft";
  }
  return undefined;
}

function parseIntentFromEntryIntent(raw?: CreateEntryIntent): CreateIntent | undefined {
  if (!raw) return undefined;
  if (raw === "content_companion") return "check";
  if (raw === "round_setup" || raw === "org_context_setup") return "draft";
  return "contribute";
}

function parseIntentFromCreateMode(raw?: CreateMode): CreateIntent | undefined {
  if (!raw) return undefined;
  if (raw === "ai") return "draft";
  return "contribute";
}

export function resolveInitialCreateIntent(params: {
  rawIntentParam?: string | null;
  rawModeParam?: string | null;
  initialEntryIntent?: CreateEntryIntent;
  initialEntryMode?: CreateEntryMode;
  initialMode?: CreateMode;
}): CreateIntent {
  const fromIntentParam = parseCreateIntent(params.rawIntentParam);
  if (fromIntentParam) return fromIntentParam;

  const fromModeParam = parseIntentFromLegacyMode(params.rawModeParam);
  if (fromModeParam) return fromModeParam;

  const fromEntryIntent = parseIntentFromEntryIntent(params.initialEntryIntent);
  if (fromEntryIntent) return fromEntryIntent;

  if (params.initialEntryMode === "guided") return "draft";

  const fromCreateMode = parseIntentFromCreateMode(params.initialMode);
  if (fromCreateMode) return fromCreateMode;

  return "contribute";
}

