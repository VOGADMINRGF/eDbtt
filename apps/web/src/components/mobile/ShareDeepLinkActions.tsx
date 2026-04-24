"use client";

import { useEffect, useMemo, useState } from "react";
import { buildDeepLinkUrl, normalizeDeepLinkPath } from "@/features/mobile/deepLink";

type CopyState = "idle" | "copied" | "failed";

type ShareDeepLinkActionsProps = {
  path: string;
  title?: string;
  text?: string;
  className?: string;
};

export default function ShareDeepLinkActions({ path, title, text, className }: ShareDeepLinkActionsProps) {
  const normalizedPath = useMemo(() => normalizeDeepLinkPath(path), [path]);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [canShare, setCanShare] = useState(false);
  const absoluteUrl = useMemo(() => {
    if (typeof window === "undefined") return normalizedPath;
    return buildDeepLinkUrl(window.location.origin, normalizedPath);
  }, [normalizedPath]);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function handleShare() {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") return;
    await navigator.share({
      title: title ?? "eDebatte",
      text: text ?? "Öffne diesen Pfad in eDebatte.",
      url: absoluteUrl,
    });
  }

  async function handleCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyState("failed");
      return;
    }
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 1600);
    }
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-[11px] text-[rgb(var(--muted))] ${className ?? ""}`.trim()}
    >
      <span className="truncate font-medium text-[rgb(var(--fg))]" title={normalizedPath}>
        Deep-Link: {normalizedPath}
      </span>
      <div className="ml-auto flex flex-wrap gap-2">
        {canShare ? (
          <button
            type="button"
            onClick={() => void handleShare().catch(() => undefined)}
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2.5 py-1 font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
          >
            Teilen
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2.5 py-1 font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
        >
          {copyState === "copied" ? "Kopiert" : copyState === "failed" ? "Kopieren fehlgeschlagen" : "Link kopieren"}
        </button>
      </div>
    </div>
  );
}
