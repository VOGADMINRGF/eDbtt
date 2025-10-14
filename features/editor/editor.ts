// features/editor/editor.ts
export type EditorItem = { id: string; title?: string; content?: string };

export function hydrateEditorItem(raw: any): EditorItem {
  return {
    id: String(raw?.id ?? raw?._id ?? ""),
    title: raw?.title ?? "",
    content: raw?.content ?? raw?.text ?? "",
  };
}
