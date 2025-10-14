// features/report/components/RightSidebar.tsx
"use client";

import React from "react";
import clsx from "clsx";

export type NewsItem = {
  id: string;
  title: string;
  url?: string;
  source?: string;
  at?: string | Date;
};

type Props = {
  news?: NewsItem[];
  className?: string;
};

export default function RightSidebar({ news = [], className }: Props) {
  return (
    <aside
      className={clsx(
        "bg-white border border-neutral-200 rounded-2xl shadow p-4 sm:p-5",
        "flex flex-col gap-4",
        className
      )}
      aria-label="Neuigkeiten & Hinweise"
    >
      <h3 className="font-bold text-neutral-800 text-lg">Neuigkeiten</h3>

      {news.length === 0 && (
        <div className="text-sm text-neutral-500">
          Keine aktuellen Meldungen.
        </div>
      )}

      <ul className="space-y-3">
        {news.map((n) => (
          <li key={n.id} className="text-sm">
            {n.url ? (
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-indigo-700"
              >
                {n.title}
              </a>
            ) : (
              <span className="text-neutral-800">{n.title}</span>
            )}
            <div className="text-[11px] text-neutral-500">
              {n.source ? `${n.source} ` : ""}
              {n.at ? `• ${new Date(n.at).toLocaleDateString()}` : ""}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-2 text-[12px] text-neutral-500">
        Kuratiert für dich – basierend auf deinen Themen.
      </div>
    </aside>
  );
}
