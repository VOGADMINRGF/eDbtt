"use client";

import { useEffect, useState } from "react";

type Item = {
  itemId: string;
  requestId: string;
  title: string;
  subtitle?: string;
  status: "open" | "accepted" | "rejected";
  createdAt: string;
};

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "2-digit" });
}

export default function EditorialInboxLive({ enabled }: { enabled: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/editorial/inbox", { cache: "no-store" });
        const json = (await res.json()) as { ok?: boolean; items?: Item[] };
        if (!cancelled) setItems(json.items ?? []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled) return null;

  async function decide(requestId: string, decision: "accept" | "reject") {
    try {
      let note: string | undefined;
      if (decision === "reject") {
        const input = window.prompt("Ablehnungsgrund (Pflichtfeld)", "");
        if (!input || input.trim().length < 3) return;
        note = input.trim();
      }
      const res = await fetch("/api/admin/editorial/decide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestId,
          decision,
          createDossier: decision === "accept",
          note,
        }),
      });
      if (decision === "accept") {
        const json = (await res.json()) as { linkedDossierId?: string };
        if (json?.linkedDossierId) {
          window.location.href = `/dossier/${json.linkedDossierId}`;
          return;
        }
      }
    } finally {
      const res = await fetch("/api/admin/editorial/inbox", { cache: "no-store" });
      const json = (await res.json()) as { items?: Item[] };
      setItems(json.items ?? []);
    }
  }

  return (
    <section className="vog-card p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Editorial Inbox
        </div>
        <div className="text-[11px] text-[rgb(var(--muted))]">
          {loading ? "Lädt …" : `${items.length} Einträge`}
        </div>
      </div>

      <div className="space-y-3">
        {items.map((it) => (
          <div
            key={it.itemId}
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[rgb(var(--fg))]">{it.title}</div>
                <div className="text-[11px] text-[rgb(var(--muted))]">{it.subtitle ?? "–"}</div>
                <div className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                  Eingang: {formatDate(it.createdAt)}
                </div>
              </div>
              <span className="vog-chip">{it.status}</span>
            </div>

            {it.status === "open" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="btn btn-ghost text-xs"
                  onClick={() => void decide(it.requestId, "accept")}
                >
                  Annehmen
                </button>
                <button
                  className="btn btn-ghost text-xs"
                  onClick={() => void decide(it.requestId, "reject")}
                >
                  Ablehnen
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
