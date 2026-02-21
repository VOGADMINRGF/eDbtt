"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type MaterialLink = {
  linkId: string;
  dossierId: string;
  kind: "statement" | "contribution";
  itemId: string;
  createdAt: string;
  createdByRole: string;
  createdByUserId?: string;
  note?: string;
  edgeType?: "supports" | "mentions" | "contradicts" | "unknown";
  itemTitle?: string;
  itemExcerpt?: string;
  itemSource?: string;
};

const EDGE_LABEL: Record<string, string> = {
  supports: "stützt",
  mentions: "erwähnt",
  contradicts: "widerspricht",
  unknown: "unklar",
};

const FILTERS = [
  { id: "all", label: "Alle" },
  { id: "statement", label: "Aussagen" },
  { id: "contribution", label: "Beiträge" },
] as const;

function formatDateTime(value?: string | null) {
  if (!value) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("de-DE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

type ViewerRole = "admin" | "staff" | "citizen" | "anonymous" | string;

async function postLink(input: {
  dossierId: string;
  kind: "statement" | "contribution";
  itemId: string;
  edgeType?: MaterialLink["edgeType"];
  note?: string;
}) {
  const res = await fetch("/api/dossier/material/link", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok || json?.ok === false) {
    throw new Error(json?.error || "link_failed");
  }
  return json as { ok: true; link: MaterialLink };
}

export default function MaterialLinksPanel({
  links,
  dossierId,
  viewerRole,
}: {
  links: MaterialLink[] | null | undefined;
  dossierId?: string | null;
  viewerRole?: ViewerRole;
}) {
  const router = useRouter();
  const isEditor = viewerRole === "admin" || viewerRole === "staff";

  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [q, setQ] = useState("");

  const normalized = useMemo(() => (Array.isArray(links) ? links : []), [links]);
  const [local, setLocal] = useState<Record<string, Partial<MaterialLink>>>({});
  const merged = useMemo(
    () => normalized.map((l) => ({ ...l, ...(local[l.linkId] ?? {}) })),
    [normalized, local],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return merged.filter((l) => {
      if (filter !== "all" && l.kind !== filter) return false;
      if (!needle) return true;
      const hay = `${l.kind} ${l.itemId} ${l.note ?? ""} ${l.edgeType ?? ""} ${l.itemTitle ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [merged, filter, q]);

  const [createKind, setCreateKind] = useState<"statement" | "contribution">("statement");
  const [createItemId, setCreateItemId] = useState("");
  const [createEdge, setCreateEdge] = useState<MaterialLink["edgeType"]>("mentions");
  const [createNote, setCreateNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [draftEdge, setDraftEdge] = useState<Record<string, MaterialLink["edgeType"]>>({});
  const [draftNote, setDraftNote] = useState<Record<string, string>>({});

  if (!merged.length && !isEditor) return null;

  return (
    <section
      id="material-links"
      className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Material (serverseitig verknüpft)
          </div>
          <div className="text-sm text-[rgb(var(--fg))]">
            {merged.length} Verknüpfungen · im Audit nachvollziehbar.
          </div>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suchen (ID, Hinweis, Titel …)"
          className="w-full sm:w-[340px] rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        />
      </div>

      {isEditor && dossierId ? (
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Material manuell verknüpfen
          </div>

          <div className="grid gap-2 md:grid-cols-[140px_1fr_200px]">
            <select
              className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
              value={createKind}
              onChange={(e) => setCreateKind(e.target.value as "statement" | "contribution")}
              disabled={busy}
            >
              <option value="statement">Aussage</option>
              <option value="contribution">Beitrag</option>
            </select>

            <input
              className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
              value={createItemId}
              onChange={(e) => setCreateItemId(e.target.value)}
              placeholder="itemId (ObjectId oder String-ID)"
              disabled={busy}
            />

            <select
              className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
              value={createEdge ?? "unknown"}
              onChange={(e) => setCreateEdge(e.target.value as MaterialLink["edgeType"])}
              disabled={busy}
            >
              <option value="supports">stützt</option>
              <option value="mentions">erwähnt</option>
              <option value="contradicts">widerspricht</option>
              <option value="unknown">unklar</option>
            </select>
          </div>

          <textarea
            className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
            rows={2}
            value={createNote}
            onChange={(e) => setCreateNote(e.target.value)}
            placeholder="Hinweis / Kontext (optional)"
            disabled={busy}
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] text-[rgb(var(--muted))]">
              Tipp: Nutze “unklar”, wenn nur die Existenz der Verknüpfung relevant ist.
            </div>
            <button
              type="button"
              className="btn btn-ghost text-xs"
              disabled={busy || !createItemId.trim()}
              onClick={async () => {
                setNotice(null);
                const itemId = createItemId.trim();
                if (!itemId) return;
                setBusy(true);
                try {
                  await postLink({
                    dossierId,
                    kind: createKind,
                    itemId,
                    edgeType: createEdge,
                    note: createNote.trim() || undefined,
                  });
                  setCreateItemId("");
                  setCreateNote("");
                  setNotice("Verknüpft.");
                  router.refresh();
                } catch (error) {
                  setNotice((error as Error)?.message ?? "Verknüpfung fehlgeschlagen");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Verknüpfen
            </button>
          </div>

          {notice ? <div className="text-[11px] text-[rgb(var(--muted))]">{notice}</div> : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`vog-chip ${filter === f.id ? "border-[rgb(var(--fg))] text-[rgb(var(--fg))]" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
        <span className="vog-chip">Treffer: {filtered.length}</span>
      </div>

      {filtered.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((l) => {
            const isEditing = Boolean(editing[l.linkId]);
            const edgeDraft = draftEdge[l.linkId] ?? (l.edgeType ?? "unknown");
            const noteDraft = draftNote[l.linkId] ?? (l.note ?? "");

            return (
              <div
                key={l.linkId}
                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="vog-chip">{l.kind === "statement" ? "Aussage" : "Beitrag"}</span>
                    <span className="vog-chip">{EDGE_LABEL[l.edgeType ?? "unknown"]}</span>
                    {l.itemSource ? <span className="vog-chip">{l.itemSource}</span> : null}
                  </div>
                  <div className="text-[11px] text-[rgb(var(--muted))]">
                    {formatDateTime(l.createdAt)} · {l.createdByRole}
                  </div>
                </div>

                {l.itemTitle ? (
                  <div className="text-sm font-semibold text-[rgb(var(--fg))]">{l.itemTitle}</div>
                ) : null}
                {l.itemExcerpt ? (
                  <div className="text-[11px] text-[rgb(var(--muted))]">{l.itemExcerpt}</div>
                ) : null}

                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] text-[rgb(var(--muted))]">
                    ID: <span className="font-mono text-[rgb(var(--fg))]">{l.itemId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="btn btn-ghost text-xs" onClick={() => void copy(l.itemId)}>
                      Kopieren
                    </button>
                    <Link
                      href={l.kind === "statement" ? `/statements/${l.itemId}` : `/contributions/${l.itemId}`}
                      className="btn btn-ghost text-xs"
                    >
                      Öffnen
                    </Link>
                    {isEditor ? (
                      <button
                        type="button"
                        className="btn btn-ghost text-xs"
                        onClick={() => {
                          setEditing((s) => ({ ...s, [l.linkId]: !s[l.linkId] }));
                          setDraftEdge((s) => ({ ...s, [l.linkId]: (l.edgeType ?? "unknown") as any }));
                          setDraftNote((s) => ({ ...s, [l.linkId]: l.note ?? "" }));
                        }}
                      >
                        {isEditing ? "Schließen" : "Bearbeiten"}
                      </button>
                    ) : null}
                  </div>
                </div>

                {l.note ? (
                  <div className="text-sm text-[rgb(var(--fg))]">{l.note}</div>
                ) : (
                  <div className="text-[11px] text-[rgb(var(--muted))]">Kein Hinweis hinterlegt.</div>
                )}

                {isEditing && dossierId ? (
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 space-y-2">
                    <div className="grid gap-2 md:grid-cols-[220px_1fr]">
                      <select
                        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
                        value={edgeDraft}
                        onChange={(e) =>
                          setDraftEdge((s) => ({ ...s, [l.linkId]: e.target.value as MaterialLink["edgeType"] }))
                        }
                        disabled={busy}
                      >
                        <option value="supports">stützt</option>
                        <option value="mentions">erwähnt</option>
                        <option value="contradicts">widerspricht</option>
                        <option value="unknown">unklar</option>
                      </select>

                      <input
                        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
                        value={noteDraft}
                        onChange={(e) => setDraftNote((s) => ({ ...s, [l.linkId]: e.target.value }))}
                        placeholder="Hinweis (optional)"
                        disabled={busy}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost text-xs"
                        disabled={busy}
                        onClick={() => setEditing((s) => ({ ...s, [l.linkId]: false }))}
                      >
                        Abbrechen
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost text-xs"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            setLocal((s) => ({
                              ...s,
                              [l.linkId]: { edgeType: edgeDraft, note: noteDraft },
                            }));
                            await postLink({
                              dossierId,
                              kind: l.kind,
                              itemId: l.itemId,
                              edgeType: edgeDraft,
                              note: noteDraft.trim() || undefined,
                            });
                            setEditing((s) => ({ ...s, [l.linkId]: false }));
                            router.refresh();
                          } catch (error) {
                            setNotice((error as Error)?.message ?? "Update fehlgeschlagen");
                            setLocal((s) => {
                              const next = { ...s };
                              delete next[l.linkId];
                              return next;
                            });
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Speichern
                      </button>
                    </div>
                  </div>
                ) : null}

                {dossierId ? (
                  <Link
                    href={`/dossier/${encodeURIComponent(dossierId)}#material-links`}
                    className="text-[11px] text-[rgb(var(--muted))] underline"
                  >
                    Im Dossier-Kontext öffnen
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-[rgb(var(--muted))]">Keine Treffer.</div>
      )}

      <p className="text-[11px] text-[rgb(var(--muted))]">
        Hinweis: Liste basiert auf <span className="font-mono">dossier_material_links</span> (institutionell &amp;
        auditierbar).
      </p>
    </section>
  );
}
