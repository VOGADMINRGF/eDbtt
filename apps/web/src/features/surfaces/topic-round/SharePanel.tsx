"use client";

import { useMemo, useState } from "react";
import SocialOutputPreviewPanel from "@/components/share/SocialOutputPreviewPanel";
import {
  buildNeutralCarouselDraft,
  buildShareOutputAsset,
} from "@features/share/socialOutputContract";
import { BRAND } from "@/lib/brand";

type SharePanelProps = {
  title: string;
  description: string;
  publicUrl: string;
  canonicalTopicUrl: string;
  embedUrl: string;
  followUpUrl: string;
  compact?: boolean;
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
  compact = false,
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
  const shareAsset = useMemo(
    () => {
      const loweredUrl = `${publicUrl} ${canonicalTopicUrl}`.toLowerCase();
      const objectType =
        loweredUrl.includes("/companion/")
          ? "companion"
          : loweredUrl.includes("/dossier/")
            ? "dossier"
            : "topic_round";
      return buildShareOutputAsset({
        baseUrl: BRAND.baseUrl,
        canonicalPathOrUrl: canonicalTopicUrl,
        objectType,
        title,
        subtitle: description,
        lane: "standard",
        verificationMode: "none",
        researchUsed: "none",
        sealEligible: false,
        sealGranted: false,
        neutralCtaLabel:
          objectType === "companion"
            ? "Companion öffnen"
            : objectType === "dossier"
              ? "Dossier öffnen"
              : "Themenkontext öffnen",
        deepLinkPath: publicUrl,
      });
    },
    [canonicalTopicUrl, description, publicUrl, title],
  );
  const shareCarousel = useMemo(
    () =>
      buildNeutralCarouselDraft(shareAsset, {
        highlights: [description],
      }),
    [description, shareAsset],
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
    <section className={compact ? "space-y-3" : "space-y-3 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm"}>
      {!compact ? <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Beitrag teilen</h2> : null}
      <p className="text-sm text-[rgb(var(--muted))]">
        Companion-Link, QR, Embed und offener Topic-Link greifen auf dieselbe produktive Logik zu.
      </p>

      <div className={`grid gap-3 ${compact ? "md:grid-cols-1" : "lg:grid-cols-2"}`}>
        <div className="space-y-2 text-xs">
          <button
            type="button"
            className="btn-secondary text-xs w-full justify-center"
            onClick={() => handleCopy(publicUrl, "Companion-Link")}
          >
            Companion-Link kopieren
          </button>
          <button
            type="button"
            className="btn-secondary text-xs w-full justify-center"
            onClick={() => handleCopy(canonicalTopicUrl, "Offener Topic-Link")}
          >
            Offenen Topic-Link kopieren
          </button>
          <button
            type="button"
            className="btn-secondary text-xs w-full justify-center"
            onClick={() => handleCopy(embedSnippet, "Embed-Code")}
          >
            Embed-Code kopieren
          </button>
          <button
            type="button"
            className="btn-secondary text-xs w-full justify-center"
            onClick={() => handleCopy(followUpUrl, "Follow-up-Link")}
          >
            Follow-up Link kopieren
          </button>
          <button
            type="button"
            className="btn-secondary text-xs w-full justify-center"
            onClick={() => handleCopy(shareAsset.sharePayload.text, "Neutraler Teaser")}
          >
            Neutralen Teaser kopieren
          </button>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 flex flex-col items-center gap-2">
          <img src={qrUrl} alt="QR-Code für diesen Kontextzugang" width={compact ? 150 : 180} height={compact ? 150 : 180} className="rounded-md border border-[rgb(var(--border))]" />
          <p className="text-[11px] text-[rgb(var(--muted))] text-center">
            QR startet den Kontextzugang (`entry=qr`) und führt danach in den offenen Themenraum.
          </p>
        </div>
      </div>

      <SocialOutputPreviewPanel asset={shareAsset} carousel={shareCarousel} />

      {message ? (
        <p className="text-xs text-[rgb(var(--muted))]">{message}</p>
      ) : null}
    </section>
  );
}
