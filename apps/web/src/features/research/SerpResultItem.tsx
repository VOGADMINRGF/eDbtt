// apps/web/src/features/research/SerpResultItem.tsx
import React from "react";

export type SerpResult = {
  url?: string; // optional: may be empty for "source categories"
  title: string;
  snippet?: string;
  siteName?: string;
  breadcrumb?: string;
  faviconUrl?: string;
  publishedAt?: string;
};

function hostOf(url?: string): string {
  if (!url || url === "#") return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isRealUrl(url?: string): boolean {
  return Boolean(url && url !== "#");
}

export function SerpResultItem({
  result,
  view = "serp",
}: {
  result: SerpResult;
  view?: "serp" | "cards";
}) {
  const host = hostOf(result.url);
  const displaySite = result.siteName || host || "Prüfplan";
  const initial = (displaySite?.[0] || "?").toUpperCase();
  const visible = host ? `${host}${result.breadcrumb ? ` › ${result.breadcrumb}` : ""}` : result.breadcrumb || "";

  const containerClass =
    view === "cards" ? "rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 shadow-sm space-y-1" : "py-2";

  const metaClass = "flex items-center gap-2 text-[11px] text-[rgb(var(--muted))]";
  const titleClass = "block text-sm font-semibold text-sky-700 hover:underline";
  const snippetClass = "text-[12px] leading-relaxed text-[rgb(var(--muted))]";

  const Wrap = isRealUrl(result.url) ? "a" : "div";
  const wrapProps = isRealUrl(result.url)
    ? ({ href: result.url, target: "_blank", rel: "noreferrer noopener" } as any)
    : ({} as any);

  return (
    <div className={containerClass}>
      <div className={metaClass}>
        {result.faviconUrl && isRealUrl(result.url) ? (
          <img src={result.faviconUrl} alt={host || displaySite} className="h-4 w-4 rounded" />
        ) : (
          <div className="flex h-4 w-4 items-center justify-center rounded bg-[rgb(var(--bg))] text-[9px] font-semibold text-[rgb(var(--muted))]">
            {initial}
          </div>
        )}
        <span className="font-semibold text-[rgb(var(--muted))]">{displaySite}</span>
        {visible ? <span className="text-[rgb(var(--muted))]">· {visible}</span> : null}
      </div>

      <Wrap {...wrapProps} className={titleClass}>
        {result.title}
      </Wrap>

      {result.snippet ? <p className={snippetClass + " line-clamp-3"}>{result.snippet}</p> : null}
      {result.publishedAt ? <p className="text-[10px] text-[rgb(var(--muted))]">Aktualisiert: {result.publishedAt}</p> : null}
    </div>
  );
}

export default SerpResultItem;
