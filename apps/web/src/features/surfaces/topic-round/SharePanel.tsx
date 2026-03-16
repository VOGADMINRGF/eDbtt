"use client";

import { useMemo, useState } from "react";

type SharePanelProps = {
  title: string;
  description: string;
  publicUrl: string;
  canonicalTopicUrl: string;
  embedUrl: string;
  followUpUrl: string;
};

async function copyToClipboard(value: string) {
  if (typeof navigator === "undefined") throw new Error("clipboard_unavailable");
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const area = document.createElement("textarea");
  area.value = value;
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
}

export default function SharePanel({
  title,
  description,
  publicUrl,
  canonicalTopicUrl,
  embedUrl,
  followUpUrl,
}: SharePanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const embedSnippet = useMemo(
    () => `<iframe src="${embedUrl}" title="${title}" style="width:100%;height:680px;border:0;" loading="lazy"></iframe>`,
    [embedUrl, title],
  );
  const qrUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(publicUrl)}`,
    [publicUrl],
  );

  async function handleCopy(value: string, label: string) {
    try {
      await copyToClipboard(value);
      setMessage(`${label} kopiert.`);
    } catch {
      setMessage(`Kopieren für ${label} nicht verfügbar.`);
    }
  }

  return (
    <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
      <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Share Panel</h2>
      <p className="text-sm text-[rgb(var(--muted))]">
        Public Link, QR, Embed und Follow-up laufen auf derselben produktiven Topic/Round-Logik.
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2 text-xs">
          <button
            type="button"
            className="btn-secondary text-xs w-full justify-center"
            onClick={() => handleCopy(publicUrl, "Public Link")}
          >
            Public Link kopieren
          </button>
          <button
            type="button"
            className="btn-secondary text-xs w-full justify-center"
            onClick={() => handleCopy(canonicalTopicUrl, "Canonical Topic Link")}
          >
            Canonical Topic Link kopieren
          </button>
          <button
            type="button"
            className="btn-secondary text-xs w-full justify-center"
            onClick={() => handleCopy(embedSnippet, "Embed Snippet")}
          >
            Embed Snippet kopieren
          </button>
          <button
            type="button"
            className="btn-secondary text-xs w-full justify-center"
            onClick={() => handleCopy(followUpUrl, "Follow-up Link")}
          >
            Follow-up Link kopieren
          </button>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 flex flex-col items-center gap-2">
          <img src={qrUrl} alt="QR code for public entry" width={180} height={180} className="rounded-md border border-[rgb(var(--border))]" />
          <p className="text-[11px] text-[rgb(var(--muted))] text-center">
            QR Entry unterstützt `?entry=qr` und source/persona Kontexte.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 space-y-1">
        <p className="text-xs font-semibold text-[rgb(var(--fg))]">Share Preview (OG vorbereitbar)</p>
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{title}</p>
        <p className="text-xs text-[rgb(var(--muted))]">{description}</p>
        <p className="text-[11px] text-[rgb(var(--muted))] break-all">{publicUrl}</p>
      </div>

      {message ? (
        <p className="text-xs text-[rgb(var(--muted))]">{message}</p>
      ) : null}
    </section>
  );
}
