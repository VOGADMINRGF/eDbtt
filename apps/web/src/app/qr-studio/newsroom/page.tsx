"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  NEWSROOM_CTA_LABELS,
  NEWSROOM_CTA_PRESETS,
  NEWSROOM_FORMAT_OPTIONS,
  buildNewsroomEmbedBundle,
  type NewsroomCtaPreset,
  type NewsroomFormat,
} from "@features/embed";
import { JOURNALISM_ANLASS_NOTE, JOURNALISM_COMPANION_LINES } from "@features/journalism";

function toAbsolute(origin: string, path: string) {
  const base = origin.trim();
  if (!base) return path;
  return `${base}${path}`;
}

const FORMAT_LABELS: Record<NewsroomFormat, string> = {
  article: "Artikel",
  print: "Print",
  video: "Video",
  podcast: "Podcast",
  talkshow: "Talkshow",
};

export default function NewsroomQrStudioPage() {
  const [origin, setOrigin] = useState("");
  const [dossierId, setDossierId] = useState("");
  const [anchorId, setAnchorId] = useState("");
  const [medium, setMedium] = useState("");
  const [format, setFormat] = useState<NewsroomFormat>("article");
  const [publishedAt, setPublishedAt] = useState("");
  const [ctaPreset, setCtaPreset] = useState<NewsroomCtaPreset>("offenes_dossier");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      const today = new Date().toISOString().slice(0, 10);
      setPublishedAt(today);
    }
  }, []);

  const bundle = useMemo(() => {
    const id = dossierId.trim();
    if (!id) return null;
    return buildNewsroomEmbedBundle({
      dossierId: id,
      anchorId: anchorId.trim() || undefined,
      medium: medium.trim() || undefined,
      format,
      publishedAt: publishedAt.trim() || undefined,
      cta: ctaPreset,
    });
  }, [anchorId, ctaPreset, dossierId, format, medium, publishedAt]);

  const urls = useMemo(() => {
    if (!bundle) return null;
    return {
      dossier: toAbsolute(origin, bundle.dossierPath),
      companion: toAbsolute(origin, bundle.companionPath),
      embed: toAbsolute(origin, bundle.embedPath),
      short: toAbsolute(origin, bundle.shortPath),
    };
  }, [bundle, origin]);

  useEffect(() => {
    async function renderQr() {
      if (!urls?.short) {
        setQrDataUrl(null);
        return;
      }
      try {
        const data = await QRCode.toDataURL(urls.short, { width: 260, margin: 1 });
        setQrDataUrl(data);
      } catch {
        setQrDataUrl(null);
      }
    }
    void renderQr();
  }, [urls?.short]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-6 px-4 py-10 text-[rgb(var(--fg))]">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          QR Studio · Journalismus
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Embed, Short-Link und QR für offene Dossiers</h1>
        <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">{JOURNALISM_ANLASS_NOTE}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-[rgb(var(--muted))]">
          <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1">
            Anlass ≠ Wahrheit
          </span>
          <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1">
            Kein Redaktions-Silo
          </span>
          <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1">
            QR/Embed führt ins offene Dossier
          </span>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-soft">
          <h2 className="text-base font-semibold">1) Anlass und Zielraum festlegen</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-[rgb(var(--muted))]">Dossier-ID *</span>
              <input
                value={dossierId}
                onChange={(event) => setDossierId(event.target.value)}
                placeholder="z. B. dossier_demo_school_2026"
                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[rgb(var(--muted))]">Anchor-ID (optional)</span>
              <input
                value={anchorId}
                onChange={(event) => setAnchorId(event.target.value)}
                placeholder="z. B. article_2026_03_13"
                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[rgb(var(--muted))]">Medium / Formatname</span>
              <input
                value={medium}
                onChange={(event) => setMedium(event.target.value)}
                placeholder="z. B. Lokalzeit Nord"
                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[rgb(var(--muted))]">Formattyp</span>
              <select
                value={format}
                onChange={(event) => setFormat(event.target.value as NewsroomFormat)}
                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
              >
                {NEWSROOM_FORMAT_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {FORMAT_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[rgb(var(--muted))]">Veröffentlichungsdatum</span>
              <input
                value={publishedAt}
                onChange={(event) => setPublishedAt(event.target.value)}
                placeholder="YYYY-MM-DD"
                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[rgb(var(--muted))]">CTA-Typ</span>
              <select
                value={ctaPreset}
                onChange={(event) => setCtaPreset(event.target.value as NewsroomCtaPreset)}
                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
              >
                {NEWSROOM_CTA_PRESETS.map((item) => (
                  <option key={item} value={item}>
                    {NEWSROOM_CTA_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-4 text-xs text-[rgb(var(--muted))]">
            Unterstützt für journalistische Einstiege: Artikel, Print (QR), Video, Podcast, Talkshow.
          </p>
        </div>

        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-soft">
          <h2 className="text-base font-semibold">2) Companion-Output</h2>
          {!bundle || !urls ? (
            <p className="mt-3 text-sm text-[rgb(var(--muted))]">
              Dossier-ID eintragen, um QR, Short-Link und Embed-Link zu erzeugen.
            </p>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-xs">
                <p className="font-semibold text-[rgb(var(--fg))]">Begleittext für Redaktion</p>
                <p className="mt-1 text-[rgb(var(--muted))]">{bundle.editorialLead}</p>
              </div>
              <div className="space-y-2 text-xs">
                <p className="font-semibold text-[rgb(var(--fg))]">Output-Varianten</p>
                <p className="text-[rgb(var(--muted))] break-all">Short URL: {urls.short}</p>
                <p className="text-[rgb(var(--muted))] break-all">Embed-Link: {urls.embed}</p>
                <p className="text-[rgb(var(--muted))] break-all">Companion-Link: {urls.companion}</p>
                <p className="text-[rgb(var(--muted))] break-all">Offener Dossier-Link: {urls.dossier}</p>
              </div>
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR-Code für offenen Companion-Link"
                  className="h-52 w-52 rounded-xl border border-[rgb(var(--border))] bg-white p-2"
                />
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Link href={bundle.companionPath} className="btn btn-primary text-sm">
                  Companion öffnen
                </Link>
                <Link href={bundle.embedPath} className="btn-secondary text-sm">
                  Embed öffnen
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-soft">
        <h2 className="text-base font-semibold">3) Companion-Block (optional im Artikel)</h2>
        <ul className="mt-3 grid gap-2 text-sm text-[rgb(var(--muted))] sm:grid-cols-2">
          <li className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
            {JOURNALISM_COMPANION_LINES.mentionedInArticle}
          </li>
          <li className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
            {JOURNALISM_COMPANION_LINES.availableInDossier}
          </li>
          <li className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
            {JOURNALISM_COMPANION_LINES.stillOpen}
          </li>
          <li className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
            {JOURNALISM_COMPANION_LINES.hasContradiction}
          </li>
        </ul>
      </section>
    </main>
  );
}
