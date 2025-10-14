"use client";

import { useEffect, useState } from "react";

type Ev = {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  tags?: string[];
};

export default function ProjektEvents() {
  const [items, setItems] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/events?limit=50", { cache: "no-store" });
    const j = await res.json();
    setItems(j?.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Projekt-Events</h1>
      {loading ? <div>Lade…</div> : (
        <ul className="space-y-3">
          {items.map(ev => (
            <li key={ev.id} className="border rounded p-3">
              <div className="font-medium">{ev.title}</div>
              <div className="text-sm text-gray-600">
                {new Date(ev.startAt).toLocaleString()}
                {ev.endAt ? ` – ${new Date(ev.endAt).toLocaleString()}` : ""}
              </div>
              {ev.description && <p className="mt-2">{ev.description}</p>}
              {ev.tags?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {ev.tags.map(t => <span key={t} className="px-2 py-0.5 text-xs bg-gray-100 rounded">{t}</span>)}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
