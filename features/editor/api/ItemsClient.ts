// features/editor/api/ItemsClient.ts
import { http, asJson } from "../utils/http";
import type { Item, ItemKind, Region, Topic } from "../types";

/** --- Funktionale API ---------------------------------------------------- */

export async function listItems(params?: { kind?: ItemKind; take?: number }): Promise<Item[]> {
  const qs = new URLSearchParams();
  if (params?.kind) qs.set("kind", params.kind);
  if (params?.take) qs.set("take", String(params.take));
  const url = qs.toString() ? `/api/editor/items?${qs.toString()}` : `/api/editor/items`;
  return asJson<Item[]>(await http(url));
}

export async function getItem(id: string): Promise<Item> {
  return asJson<Item>(await http(`/api/editor/items/${encodeURIComponent(id)}`));
}

export async function createDraft(kind: ItemKind, topicId: string, locale = "de"): Promise<Item> {
  return asJson<Item>(
    await http(`/api/editor/items`, {
      method: "POST",
      json: { kind, topicId, locale, text: "Neues Statement – bitte bearbeiten.", regionMode: "AUTO" },
    })
  );
}

export async function updateItem(payload: Partial<Item> & { id: string }): Promise<Item> {
  const { id, ...body } = payload;
  return asJson<Item>(await http(`/api/editor/items/${encodeURIComponent(id)}`, { method: "PATCH", json: body }));
}

export async function deleteItem(id: string): Promise<{ ok: true }> {
  return asJson<{ ok: true }>(await http(`/api/editor/items/${encodeURIComponent(id)}`, { method: "DELETE" }));
}

export async function publishItem(id: string): Promise<{ ok: true }> {
  return asJson<{ ok: true }>(await http(`/api/editor/items/${encodeURIComponent(id)}/publish`, { method: "POST" }));
}

export async function reorderAnswerOptions(sortOrder: Array<{ id: string; sortOrder: number }>): Promise<{ ok: true }> {
  return asJson<{ ok: true }>(await http(`/api/editor/items/reorder`, { method: "PATCH", json: { sortOrder } }));
}

export async function searchRegions(q = ""): Promise<Region[]> {
  const url = q ? `/api/editor/regions?q=${encodeURIComponent(q)}` : `/api/editor/regions`;
  return asJson<Region[]>(await http(url));
}

export async function listTopics(params?: { locale?: string; take?: number }): Promise<Topic[]> {
  const qs = new URLSearchParams();
  if (params?.locale) qs.set("locale", params.locale);
  if (params?.take) qs.set("take", String(params.take));
  const url = qs.toString() ? `/api/topics?${qs.toString()}` : `/api/topics`;
  return asJson<Topic[]>(await http(url));
}

/** --- Klassen-API (Wrapper um die Funktionen) ---------------------------- */

export class ItemsClient {
  list = listItems;
  get = getItem;
  createDraft = createDraft;
  update = updateItem;
  delete = deleteItem;
  publish = publishItem;
  reorder = reorderAnswerOptions;
  searchRegions = searchRegions;
  listTopics = listTopics;
}

export default ItemsClient;
