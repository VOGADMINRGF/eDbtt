"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS, TOTAL_NAV_ITEMS } from "./adminNav";

export default function AdminSidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const filteredSections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return NAV_SECTIONS;
    const terms = normalized.split(/\s+/).filter(Boolean);

    return NAV_SECTIONS.map((section) => {
      const items = section.items.filter((item) => {
        const haystack = [
          item.label,
          item.description ?? "",
          item.href,
          ...(item.keywords ?? []),
        ]
          .join(" ")
          .toLowerCase();
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
    <div className="flex h-full flex-col gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600">Admin</p>
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">eDebatte</p>
        <p className="text-xs text-[rgb(var(--muted))] truncate">{userEmail ?? "admin"}</p>
      </div>

      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen (z.B. users, reports, telemetry)"
          className="w-full bg-transparent text-xs text-[rgb(var(--muted))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
          aria-label="Admin Navigation durchsuchen"
        />
        <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">{summaryLabel}</p>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto pr-1 text-sm font-semibold text-[rgb(var(--fg))]">
        {filteredSections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{section.title}</p>
            <div className="space-y-2">
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
                    className={`block rounded-2xl border px-3 py-2 transition ${
                      active
                        ? "border-sky-200 bg-sky-50 text-[rgb(var(--fg))]"
                        : "border-[rgb(var(--border))] hover:border-sky-200 hover:bg-sky-50"
                    }`}
                  >
                    <div className="text-sm font-semibold text-[rgb(var(--fg))]">{item.label}</div>
                    {item.description && (
                      <div className="text-[11px] text-[rgb(var(--muted))]">{item.description}</div>
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
