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
        "bg-white border border-slate-200 rounded-2xl shadow p-4 sm:p-5 dark:bg-slate-950/80 dark:border-slate-800",
        "flex flex-col gap-4",
        className
      )}
      aria-label="Neuigkeiten & Hinweise"
    >
      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Neuigkeiten</h3>

      {news.length === 0 && (
        <div className="text-sm text-slate-500 dark:text-slate-300">
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
                className="underline text-sky-700 dark:text-sky-400"
              >
                {n.title}
              </a>
            ) : (
              <span className="text-slate-900 dark:text-slate-100">{n.title}</span>
            )}
            <div className="text-[11px] text-slate-500 dark:text-slate-300">
              {n.source ? `${n.source} ` : ""}
              {n.at ? `• ${new Date(n.at).toLocaleDateString()}` : ""}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-2 text-[12px] text-slate-500 dark:text-slate-300">
        Kuratiert für dich – basierend auf deinen Themen.
      </div>
    </aside>
  );
}
