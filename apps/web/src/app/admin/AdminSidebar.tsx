"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS, TOTAL_NAV_ITEMS } from "./adminNav";
import { normalizeGermanSearchText } from "@features/common/utils/textNormalization";

export default function AdminSidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const filteredSections = useMemo(() => {
    const normalized = normalizeGermanSearchText(query);
    if (!normalized) return NAV_SECTIONS;
    const terms = normalized.split(/\s+/).filter(Boolean);

    return NAV_SECTIONS.map((section) => {
      const items = section.items.filter((item) => {
        const haystack = normalizeGermanSearchText([
          item.label,
          item.description ?? "",
          item.href,
          ...(item.keywords ?? []),
        ].join(" "));
        return terms.every((term) => haystack.includes(term));
      });
      return { ...section, items };
    }).filter((section) => section.items.length > 0);
  }, [query]);

  const resultCount = useMemo(
    () => filteredSections.reduce((sum, section) => sum + section.items.length, 0),
    [filteredSections],
  );

  const summaryLabel = query.trim()
    ? `${resultCount} Treffer`
    : `${TOTAL_NAV_ITEMS} Bereiche`;

  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-600 dark:text-sky-300">Admin</p>
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">eDebatte</p>
        <p className="text-xs text-[rgb(var(--muted))] truncate">{userEmail ?? "admin"}</p>
      </div>

      <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]/90 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen (z.B. users, reports, telemetry)"
          className="w-full bg-transparent text-xs text-[rgb(var(--fg))] placeholder:text-slate-500 dark:placeholder:text-slate-300 focus:outline-none"
          aria-label="Admin Navigation durchsuchen"
        />
        <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">{summaryLabel}</p>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto pr-1 text-sm font-semibold text-[rgb(var(--fg))]">
        {filteredSections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{section.title}</p>
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const match = item.match ?? "prefix";
                const active =
                  match === "exact"
                    ? pathname === item.href
                    : pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-xl border px-2.5 py-1.5 transition ${
                      active
                        ? "border-sky-300 bg-sky-100/80 text-slate-900 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.45)] dark:border-sky-300/45 dark:bg-sky-500/20 dark:text-sky-50"
                        : "border-[rgb(var(--border))] bg-[rgb(var(--card))]/70 hover:border-sky-300/70 hover:bg-sky-100/60 dark:hover:border-sky-300/45 dark:hover:bg-sky-500/12"
                    }`}
                  >
                    <div className="text-[13px] font-semibold leading-tight text-[rgb(var(--fg))]">{item.label}</div>
                    {item.description && (
                      <div className="mt-0.5 truncate text-[10px] text-slate-600 dark:text-slate-300">{item.description}</div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {filteredSections.length === 0 && (
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
            Keine Treffer. Andere Begriffe probieren.
          </div>
        )}
      </nav>
    </div>
  );
}
