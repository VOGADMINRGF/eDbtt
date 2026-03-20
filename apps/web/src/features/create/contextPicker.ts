import { ObjectId } from "@core/db/triMongo";
import { listRundenEntryItems } from "@features/topicRound/entrySource";

export type CreateContextPickerItem = {
  anlassraumId: string;
  title: string;
  summary: string;
  topicKey: string | null;
  anlassraumType: string | null;
  anlassraumStatus: string | null;
  sourceMode: string | null;
  outputStatus: string;
  updatedAt: string | null;
};

export type ListCreateContextPickerItemsInput = {
  limit?: number;
};

const DEFAULT_LIMIT = 40;

export async function listCreateContextPickerItems(
  input: ListCreateContextPickerItemsInput = {},
): Promise<CreateContextPickerItem[]> {
  try {
    const entries = await listRundenEntryItems({ limit: normalizeLimit(input.limit) });
    const deduped = new Map<string, CreateContextPickerItem>();
    for (const entry of entries) {
      if (!entry.anlassraumId) continue;
      if (entry.lifecycle !== "active") continue;
      if (deduped.has(entry.anlassraumId)) continue;
      deduped.set(entry.anlassraumId, {
        anlassraumId: entry.anlassraumId,
        title: entry.title,
        summary: entry.summary,
        topicKey: entry.topicKey,
        anlassraumType: entry.anlassraumType,
        anlassraumStatus: entry.anlassraumStatus,
        sourceMode: entry.sourceMode,
        outputStatus: entry.outputStatus,
        updatedAt: entry.updatedAt,
      });
    }
    return Array.from(deduped.values());
  } catch {
    throw new Error("create_context_source_unavailable");
  }
}

export function normalizeSelectedAnlassraumId(value: unknown): string | null {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (!ObjectId.isValid(normalized)) return null;
  return new ObjectId(normalized).toHexString();
}

function normalizeLimit(limit: number | undefined): number {
  const numeric = Number(limit);
  if (!Number.isFinite(numeric) || numeric <= 0) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(100, Math.floor(numeric)));
}
