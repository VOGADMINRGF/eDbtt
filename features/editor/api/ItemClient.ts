// features/editor/api/ItemsClient.ts
import { http, asJson } from "../utils/http";
import type { Item, ItemKind, Region, Topic } from "../types";

export async function listItems(params?: { kind?: ItemKind; take?: number }) {
  const qs = new URLSearchParams();
  if (params?.kind) qs.set("kind", params.kind);
  if (params?.take) qs.set("take", String(params.take));
  return asJson<Item[]>(await http(`/api/editor/items?${qs.toString()}`));
}
export async function getItem(id: string) {
  return asJson<Item>(await http(`/api/editor/items/${id}`));
}
export async function createDraft(kind: ItemKind, topicId: string, locale = "de") {
  return asJson<Item>(await http(`/api/editor/items`, {
    method: "POST",
    json: { kind, topicId, locale, text: "Neues Statement – bitte bearbeiten.", regionMode: "AUTO" },
  }));
}
export async function updateItem(payload: Partial<Item> & { id: string }) {
  const { id, ...body } = payload;
  return asJson<Item>(await http(`/api/editor/items/${id}`, { method: "PATCH", json: body }));
}
export async function deleteItem(id: string) {
  return asJson<{ ok: true }>(await http(`/api/editor/items/${id}`, { method: "DELETE" }));
}
export async function publishItem(id: string) {
  return asJson<{ ok: true }>(await http(`/api/editor/items/${id}/publish`, { method: "POST" }));
}
export async function reorderAnswerOptions(sortOrders: Array<{ id: string; sortOrder: number }>) {
  return asJson<{ ok: true }>(await http(`/api/editor/items/reorder`, { method: "PATCH", json: { sortOrders } }));
}
export async function searchRegions(q = "") {
  return asJson<Region[]>(await http(`/api/editor/regions?q=${encodeURIComponent(q)}`));
}
export async function listTopics(params?: { locale?: string; take?: number }) {
  const qs = new URLSearchParams();
  if (params?.locale) qs.set("locale", params.locale);
  if (params?.take) qs.set("take", String(params.take));
  return asJson<Topic[]>(await http(`/api/topics?${qs.toString()}`));
}
