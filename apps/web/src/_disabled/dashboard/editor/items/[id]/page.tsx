// apps/web/src/app/dashboard/editor/items/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  EditorGate,
  getItem,
  updateItem,
  publishItem,
  searchRegions,
} from "@features";
import type { Item, Region, AnswerOption } from "@features";

export default function ItemEditor() {
  const { id } = useParams<{ id: string }>();
  const [it, setIt] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState<Region[]>([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setIt(await getItem(String(id)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [id]);

  const addOption = () =>
    it &&
    setIt({
      ...it,
      answerOptions: [
        ...(it.answerOptions || []),
        { label: "Neu", value: "new", exclusive: false },
      ],
    });
  const removeOption = (idx: number) =>
    it &&
    setIt({
      ...it,
      answerOptions: it.answerOptions.filter((_, i) => i !== idx),
    });
  const move = (idx: number, dir: -1 | 1) => {
    if (!it) return;
    const copy = [...(it.answerOptions || [])];
    const ni = idx + dir;
    if (ni < 0 || ni >= copy.length) return;
    const [x] = copy.splice(idx, 1);
    copy.splice(ni, 0, x);
    setIt({ ...it, answerOptions: copy });
  };

  const loadRegions = async (q: string) => setRegions(await searchRegions(q));
  useEffect(() => {
    loadRegions("");
  }, []);

  const onSave = async () => {
    if (!it) return;
    setSaving(true);
    try {
      const saved = await updateItem({
        id: it.id,
        kind: it.kind,
        text: it.text,
        title: it.title,
        richText: it.richText,
        locale: it.locale,
        topicId: it.topicId,
        regionMode: it.regionMode,
        regionManualId:
          it.regionMode === "MANUAL" ? (it.regionManualId ?? null) : null,
        publishAt: it.publishAt,
        expireAt: it.expireAt,
        status: it.status,
        answerOptions: (it.answerOptions || []).map((o, idx) => ({
          ...o,
          order: idx,
        })),
      });
      setIt(saved);
    } catch (e: any) {
      alert(e.message || "Fehler");
    } finally {
      setSaving(false);
    }
  };

  const onPublish = async () => {
    if (!it) return;
    setPublishing(true);
    try {
      await publishItem(it.id);
      await load();
    } catch (e: any) {
      alert(e.message || "Publish fehlgeschlagen");
    } finally {
      setPublishing(false);
    }
  };

  const warnings = useMemo(() => it?.validation?.warnings ?? [], [it]);
  const errors = useMemo(() => it?.validation?.errors ?? [], [it]);

  if (loading || !it)
    return (
      <EditorGate>
        <div className="p-6">Lade…</div>
      </EditorGate>
    );

  return (
    <EditorGate>
      <div className="mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Item bearbeiten</h1>
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="border rounded px-3 py-2"
              disabled={saving}
            >
              {saving ? "Speichere…" : "Speichern"}
            </button>
            <button
              onClick={onPublish}
              className="border rounded px-3 py-2"
              disabled={publishing}
            >
              {publishing ? "Veröffentliche…" : "Publish"}
            </button>
          </div>
        </div>

        {/* … (Form wie zuvor, unverändert) … */}
        {/* Um Platz zu sparen: übernimm einfach den Body aus deiner letzten Version – die Logik oben bleibt gleich. */}
      </div>
    </EditorGate>
  );
}
