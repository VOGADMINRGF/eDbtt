// features/tv/components/EventList.tsx
"use client";
import React from "react";

export type TvEvent = { id: string; title: string; time?: string; meta?: string };

export default function EventList({ items = [] as TvEvent[] }: { items?: TvEvent[] }) {
  if (!items.length) {
    return <div className="p-4 text-sm text-gray-500">Keine Events.</div>;
  }
  return (
    <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
      {items.map(e => (
        <li key={e.id} className="p-4">
          <div className="font-medium">{e.title}</div>
          <div className="text-xs text-gray-500">{e.time ?? ""} {e.meta ?? ""}</div>
        </li>
      ))}
    </ul>
  );
}
