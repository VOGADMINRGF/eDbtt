"use client";

import { useEffect, useMemo, useState } from "react";
import { VogSystemIcon } from "@/components/pricing/VogSystemIcons";
import type { PricingSegmentId, PricingTargetGroupDefinition } from "@features/pricing";

type Props = {
  items: readonly PricingTargetGroupDefinition[];
  anchorKey: "pricingAnchor" | "vormerkenAnchor";
  title?: string;
  openSegmentLabel?: string;
  queryParamName?: string;
  queryParams?: Record<string, string | null | undefined>;
  activeSegmentId?: PricingSegmentId | null;
};

function extractId(href: string) {
  const normalized = href.trim();
  const hashIndex = normalized.indexOf("#");
  if (hashIndex < 0) return null;
  const id = normalized.slice(hashIndex + 1);
  return id || null;
}

export default function TargetGroupNavigator({
  items,
  anchorKey,
  title = "Zielgruppen-Navigator",
  openSegmentLabel = "Segment öffnen",
  queryParamName,
  queryParams,
  activeSegmentId = null,
}: Props) {
  const entries = useMemo(
    () =>
      items.map((item) => {
        if (!queryParamName) {
          if (queryParams) {
            const params = new URLSearchParams();
            Object.entries(queryParams).forEach(([key, value]) => {
              if (!value) return;
              params.set(key, value);
            });
            const query = params.toString();
            const href = query ? `?${query}#${item[anchorKey]}` : `#${item[anchorKey]}`;
            return { item, href, targetId: extractId(href) };
          }
          const href = `#${item[anchorKey]}`;
          return { item, href, targetId: extractId(href) };
        }
        const params = new URLSearchParams();
        Object.entries(queryParams || {}).forEach(([key, value]) => {
          if (!value) return;
          params.set(key, value);
        });
        params.set(queryParamName, item.segmentId);
        const href = `?${params.toString()}#${item[anchorKey]}`;
        return { item, href, targetId: extractId(href) };
      }),
    [items, anchorKey, queryParamName, queryParams],
  );

  const fallback = entries[0]?.targetId ?? null;
  const [activeTargetId, setActiveTargetId] = useState<string | null>(fallback);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateFromHash = () => {
      const fromHash = window.location.hash ? window.location.hash.slice(1) : "";
      if (!fromHash) return;
      if (entries.some((entry) => entry.targetId === fromHash)) {
        setActiveTargetId(fromHash);
      }
    };

    updateFromHash();
    window.addEventListener("hashchange", updateFromHash);
    return () => window.removeEventListener("hashchange", updateFromHash);
  }, [entries]);

  useEffect(() => {
    if (!activeSegmentId) return;
    const target = entries.find((entry) => entry.item.segmentId === activeSegmentId);
    if (target?.targetId) {
      setActiveTargetId(target.targetId);
    }
  }, [activeSegmentId, entries]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));

        const top = visible[0];
        if (!top) return;

        const id = top.target.getAttribute("id");
        if (id) setActiveTargetId(id);
      },
      {
        root: null,
        threshold: [0.2, 0.45, 0.7],
        rootMargin: "-25% 0px -45% 0px",
      },
    );

    entries.forEach((entry) => {
      if (!entry.targetId) return;
      const node = document.getElementById(entry.targetId);
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [entries]);

  return (
    <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{title}</p>
      <div className="mt-3 grid gap-3 grid-cols-2 lg:grid-cols-4">
        {entries.map(({ item, href, targetId }) => {
          const active = targetId !== null && targetId === activeTargetId;
          return (
            <a
              key={item.id}
              href={href}
              onClick={() => {
                if (targetId) setActiveTargetId(targetId);
              }}
              aria-current={active ? "true" : undefined}
              className={[
                "group rounded-2xl border px-3 py-3 text-left transition sm:px-4 sm:py-4",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70",
                active
                  ? "border-sky-300 bg-sky-500/10 ring-1 ring-sky-200/80"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] hover:border-sky-200 hover:bg-sky-500/5",
              ].join(" ")}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={[
                    "inline-flex h-9 w-9 items-center justify-center rounded-lg border",
                    active ? "border-sky-300 text-sky-700" : "border-[rgb(var(--border))] text-[rgb(var(--muted))] group-hover:text-sky-700",
                  ].join(" ")}
                >
                  <VogSystemIcon icon={item.icon} className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold leading-tight text-[rgb(var(--fg))]">{item.title}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--muted))]">{item.benefit}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{openSegmentLabel}</p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
