// features/report/components/ReportCard.tsx
// Finale Version 28. September 2025
"use client";

import React, { useMemo, useState } from "react";
import clsx from "clsx";
import * as Tooltip from "@radix-ui/react-tooltip";
import { FiBookmark, FiChevronDown, FiDownload, FiEdit3, FiFlag, FiInfo, FiShare2, FiUser } from "react-icons/fi";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import CountryAccordion from "../../vote/components/CountryAccordion";
import VoteBar from "@features/vote/components/VoteBar";
import MiniLineChart from "@features/report/components/MiniLineChart";
import VotingRuleBadge from "@features/vote/components/VotingRuleBadge";
import { getNationalFlag, getLanguageName } from "@features/stream/utils/nationalFlag";
import { badgeColors } from "@ui/design/badgeColor";

/* ──────────────────────────────────────────────────────────────────
 * Typen (V2 hinzugefügt)
 * ────────────────────────────────────────────────────────────────── */

export type Editor = {
  id?: string;
  name?: string;
  avatarUrl?: string;
  role?: string;
  contactable?: boolean;
};

export type NewsItem = {
  id?: string;
  url?: string;
  title?: string;
  source?: string;
  time?: string | number | Date;
};

export type Report = {
  id?: string;
  title?: string;
  subtitle?: string;
  translations?: Record<string, { title?: string; subtitle?: string; summary?: string; recommendation?: string }>;
  analytics?: {
    trendData?: number[];
    votes?: Record<string, number>;
    geoDistribution?: Record<string, unknown>;
  };
  trustScore?: number;
  reviewedBy?: string[];
  facts?: Array<{ text: string; source?: { url?: string; name?: string; trustScore?: number } }>;
  topArguments?: { pro?: string[]; contra?: string[]; neutral?: string[] };
  regionalVoices?: unknown[];
  editors?: Editor[];
  tags?: string[];
  votingRule?: { description?: string } & Record<string, unknown>;
  status?: "draft" | "published" | "archived";
  updatedAt?: string | Date | null;
  trailerUrl?: string;
  imageUrl?: string;
  regionScope?: Array<string | { name: string; iso: string }>;
  languages?: string[];
  createdAt?: string | Date;
  author?: string;
  impactLogic?: Array<{ type: string; description?: { einfach?: string; eloquent?: string } }>;
  news?: NewsItem[];
  modLog?: Array<{ action?: string; by?: string; date?: string | number | Date }>;
  barrierescore?: number;
  accessibilityStatus?: string;
  aiAnnotations?: {
    toxicity?: number | null;
    sentiment?: string | null;
    subjectAreas?: string[];
  } | null;
};

/* ──────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────── */

function formatRelativeTime(time: string | number | Date): string {
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return "";
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "jetzt";
  if (diff < 3600) return `${Math.floor(diff / 60)} Min.`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} Std.`;
  return date.toLocaleDateString("de-DE");
}

async function exportAsPDFPNG(elementId: string, type: "pdf" | "png" = "pdf", fileName = "report") {
  const el = document.getElementById(elementId);
  if (!el) return;

  // Canvas rendern (Skalierung für bessere Qualität)
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });

  if (type === "png") {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${fileName}.png`;
    link.click();
    return;
  }

  // PDF (A4, Hochformat)
  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const imgW = canvas.width * ratio;
  const imgH = canvas.height * ratio;

  const x = (pageWidth - imgW) / 2;

  if (imgH <= pageHeight) {
    pdf.addImage(imgData, "JPEG", x, 0, imgW, imgH);
  } else {
    // Mehrseitig
    let remaining = imgH;
    let sY = 0;
    const pageCanvas = document.createElement("canvas");
    const pageCtx = pageCanvas.getContext("2d")!;
    const sliceH = Math.floor(pageHeight / ratio);

    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceH;

    while (remaining > 0) {
      pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageCtx.drawImage(canvas, 0, sY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      const pageImg = pageCanvas.toDataURL("image/jpeg", 0.95);
      if (sY > 0) pdf.addPage();
      pdf.addImage(pageImg, "JPEG", x, 0, imgW, pageHeight);
      sY += sliceH;
      remaining -= pageHeight;
    }
  }

  pdf.save(`${fileName}.pdf`);
}

/* ──────────────────────────────────────────────────────────────────
 * UI-Bausteine (typisiert)
 * ────────────────────────────────────────────────────────────────── */

function TrustBadge({
  trustScore = 0,
  reviewedBy = [],
  reviewedAt,
}: {
  trustScore?: number;
  reviewedBy?: string[];
  reviewedAt?: string | Date | null | undefined;
}) {
  const scorePercent = (Math.max(0, Math.min(1, trustScore)) * 100).toFixed(1);
  const reviewedNames = Array.isArray(reviewedBy) && reviewedBy.length ? reviewedBy.join(", ") : "–";
  const reviewedAtString = reviewedAt ? new Date(reviewedAt).toLocaleDateString("de-DE") : "–";

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <span
          className="flex items-center gap-1 bg-turquoise text-white px-3 py-1 rounded-full text-xs font-bold cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-turquoise"
          tabIndex={0}
          aria-label={`Vertrauens-Score: ${scorePercent}%`}
        >
          Redaktionell geprüft
          <FiInfo className="ml-1 text-white/90 text-xs" />
        </span>
      </Tooltip.Trigger>
      <Tooltip.Content
        className="z-50 rounded-lg px-4 py-3 bg-white shadow-lg border text-neutral-900 max-w-xs text-xs"
        sideOffset={6}
        align="center"
      >
        <div className="mb-1">
          Geprüft von: <span className="font-semibold">{reviewedNames}</span>
        </div>
        <div className="mb-1">
          Letzte Prüfung: <span className="font-semibold">{reviewedAtString}</span>
        </div>
        <div className="text-neutral-500">
          Mehr Infos zu Prüfregeln:{" "}
          <a className="underline text-turquoise" href="/faq#trustscore" target="_blank" rel="noopener noreferrer">
            Hier
          </a>
        </div>
        <Tooltip.Arrow className="fill-white" />
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

function RedaktionAccordion({ editors, lang = "de" }: { editors?: Editor[]; lang?: string }) {
  const [open, setOpen] = useState(false);
  if (!editors?.length) return null;
  return (
    <div className="my-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-indigo-700 text-sm font-bold mb-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded transition"
        aria-expanded={open}
        aria-controls="editor-list"
        type="button"
      >
        <FiChevronDown className={clsx("transition-transform duration-200", open && "rotate-180")} />
        Redaktion & Autoren ({editors.length})
      </button>
      {open && (
        <div id="editor-list" className="mt-2 flex flex-col gap-2">
          {editors.map((editor, idx) => (
            <div key={editor.id || editor.name || `editor-${idx}`} className="flex gap-2 items-center">
              {editor.avatarUrl ? (
                <img
                  src={editor.avatarUrl}
                  className="w-7 h-7 rounded-full border"
                  alt={editor.name || "Redakteur:in"}
                  loading="lazy"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center text-xl text-indigo-700">
                  <FiUser />
                </div>
              )}
              <span className="font-semibold">{editor.name || "Redaktion"}</span>
              <span className="text-xs text-neutral-500">{editor.role || ""}</span>
              {editor.contactable && (
                <button
                  className="ml-2 px-3 py-1 bg-neutral-100 rounded-full text-xs font-semibold border focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  type="button"
                  title={`Kontakt zu ${editor.name || "Redakteur:in"}`}
                >
                  Kontakt
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentsPanel({ reportId }: { reportId?: string }) {
  return (
    <div className="bg-neutral-100 rounded-lg px-4 py-3 text-xs text-neutral-600">
      Kommentarbereich (in Entwicklung) für Report: {reportId || "—"}
    </div>
  );
}

function NewsTrendWidget({ news }: { news?: NewsItem[] }) {
  if (!news?.length) return null;
  const MAX = 7;
  const displayNews = news.slice(0, MAX);
  return (
    <aside className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 mt-4" aria-label="Aktuelle News und Trends">
      <div className="font-bold text-sm mb-1">Aktuelle News & Trends</div>
      <ul className="space-y-1">
        {displayNews.map((n, i) => (
          <li key={n.id || n.url || i} className="flex gap-2 text-xs items-start">
            <span className="text-xl" aria-hidden="true">📰</span>
            <span>
              <a
                href={n.url || "#"}
                className="underline text-indigo-700 hover:text-coral"
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={n.url ? 0 : -1}
                aria-label={n.title ? `News: ${n.title}` : "News-Link"}
              >
                {n.title || "Ohne Titel"}
              </a>
              {n.source && <span className="ml-1 bg-neutral-200 rounded px-1">{n.source}</span>}
              {n.time && <span className="ml-1 text-neutral-500">{formatRelativeTime(n.time)}</span>}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ──────────────────────────────────────────────────────────────────
 * Hauptkomponente
 * ────────────────────────────────────────────────────────────────── */

export default function ReportCard({
  report,
  userHash,
  onEdit,
  onShare,
  onVote,
  language = "de",
}: {
  report: Report;
  userHash?: string;
  onEdit?: (r: Report) => void;
  onShare?: (r: Report) => void;
  onVote?: (vote: "agree" | "neutral" | "disagree") => void;
  language?: string;
}) {
  const translated = useMemo(() => report.translations?.[language] ?? {}, [report, language]);

  const trend = report.analytics?.trendData && report.analytics.trendData.length > 0
    ? report.analytics.trendData
    : [7000, 7700, 8000, 8500, 8700];

  const trustScore = report.trustScore ?? 0;
  const reviewedBy = report.reviewedBy ?? [];
  const facts = report.facts ?? [];
  const argumentsPro = report.topArguments?.pro ?? [];
  const argumentsContra = report.topArguments?.contra ?? [];
  const argumentsNeutral = report.topArguments?.neutral ?? [];
  const regionalVoices = report.regionalVoices ?? [];
  const editors = report.editors ?? [];
  const tags = report.tags ?? [];
  const votingRule = report.votingRule ?? {};
  const exportId = `reportcard-${report.id || Math.random().toString(36).slice(2)}`;
  const trending = trend.length > 1 && (trend.at(-1)! > (trend.at(-2)! * 1.07));
  const barrierescore = report.barrierescore;
  const accessibilityStatus = report.accessibilityStatus;
  const ai = report.aiAnnotations ?? null;
  const hasAI =
    !!ai &&
    (ai.toxicity != null || ai.sentiment != null || (Array.isArray(ai.subjectAreas) && ai.subjectAreas.length > 0));

  const regions = (report.regionScope ?? []).map((r) =>
    typeof r === "string" ? { name: r, iso: r } : r
  );
  const languages = report.languages ?? ["de"];
  const [lang, setLang] = useState(language);

  return (
    <div className="min-h-screen bg-neutral-50 pb-8">
      {/* Sprachauswahl */}
      {languages.length > 1 && (
        <div className="flex justify-end max-w-2xl mx-auto py-2">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="border rounded px-2 py-1 text-sm focus:outline-indigo-500"
            aria-label="Sprache wählen"
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {getLanguageName(l, language)}
              </option>
            ))}
          </select>
        </div>
      )}

      <article
        id={exportId}
        aria-label="Report Card"
        className="relative bg-white rounded-2xl shadow-card max-w-2xl mx-auto my-10 overflow-visible transition-all border border-gray-200"
      >
        {/* STATUS, TREND, TRUST */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {report.status === "draft" && (
            <span className="bg-yellow-100 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">Entwurf</span>
          )}
          {report.status === "published" && (
            <span className="bg-turquoise text-white px-3 py-1 rounded-full text-xs font-bold">Live</span>
          )}
          {report.status === "archived" && (
            <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">Archiviert</span>
          )}
          {trending && (
            <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-xs font-bold">🔥 Trending</span>
          )}
          {trustScore > 0 && (
            <TrustBadge trustScore={trustScore} reviewedBy={reviewedBy} reviewedAt={report.updatedAt ?? null} />
          )}
        </div>

        {/* Titelbild / Trailer */}
        <div className="w-full rounded-t-2xl overflow-hidden aspect-[5/3] bg-gray-100 flex items-center justify-center">
          {report.trailerUrl ? (
            <video src={report.trailerUrl} controls className="w-full h-full object-cover rounded-t-2xl" />
          ) : report.imageUrl ? (
            <img
              src={report.imageUrl}
              alt={translated.title || report.title || "Report Bild"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-5xl text-gray-200">🎬</div>
          )}
        </div>

        {/* HEADER */}
        <div className="px-7 py-4 flex flex-col gap-1">
          <div className="flex flex-wrap gap-2 mb-1 overflow-x-auto scrollbar-hide">
            {tags.map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className={clsx("px-3 py-1 rounded-xl text-xs font-semibold border", badgeColors[i % badgeColors.length])}
              >
                {tag}
              </span>
            ))}
          </div>

          <h2
            className="text-3xl font-bold mb-1 leading-snug"
            style={{
              background: "linear-gradient(90deg, #2396F3 10%, #00B3A6 60%, #FF6F61 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {translated.title || report.title}
          </h2>

          {report.subtitle && (
            <div className="text-md text-neutral-400 mb-1">{translated.subtitle || report.subtitle}</div>
          )}

          <div className="flex flex-wrap gap-2 items-center text-xs text-neutral-500 mb-1">
            {regions.map((region) => (
              <span key={`${region.iso}-${region.name}`} className="flex items-center gap-1">
                <span className="text-lg">{getNationalFlag(region.iso)}</span>
                {region.name}
              </span>
            ))}
            {report.createdAt && <span>• {new Date(report.createdAt).toLocaleDateString("de-DE")}</span>}
            {report.author && <span>• {report.author}</span>}
          </div>

          <div className="flex items-center gap-2">
            <VotingRuleBadge votingRule={votingRule} />
            {votingRule?.description && <div className="text-xs text-neutral-500">{votingRule.description}</div>}
            <MiniLineChart data={trend} color="#04bfbf" />
            <span className="text-xs text-neutral-400">
              Trend: {trend.at(-1)} Stimmen {trending && <span className="text-turquoise font-semibold">↑</span>}
            </span>
          </div>

          <div className="mt-2">
            <VoteBar {...({ votes: report.analytics?.votes || {} } as any)} />
          </div>

          {report.analytics?.geoDistribution && Object.keys(report.analytics.geoDistribution).length > 0 && (
            <CountryAccordion countries={report.analytics.geoDistribution} userCountry="DE" />
          )}
        </div>

        {/* Barrierefreiheit & KI */}
        {(report.accessibilityStatus || typeof report.barrierescore === "number") && (
          <div className="flex gap-2 items-center text-xs mb-1 px-7" aria-label="Barrierefreiheit">
            {report.accessibilityStatus && (
              <span className="rounded bg-green-50 text-green-700 px-2 py-1 font-bold">
                Accessibility: {report.accessibilityStatus}
              </span>
            )}
            {typeof report.barrierescore === "number" && <span>Barrierefreiheits-Score: {report.barrierescore}/100</span>}
          </div>
        )}
        {hasAI && (
          <div className="text-xs text-gray-500 mt-1 px-7" aria-label="KI-Analyse">
            {ai?.toxicity != null && <>Toxizität: {(ai.toxicity * 100).toFixed(2)} % </>}
            {ai?.sentiment != null && <>Stimmung: {ai.sentiment} </>}
            {Array.isArray(ai?.subjectAreas) && ai!.subjectAreas.length > 0 && <>Themen: {ai!.subjectAreas.join(", ")}</>}
          </div>
        )}

        {/* SUMMARY, IMPACT, RECOMMENDATION */}
        <div className="px-7 pb-4">
          {(translated as any).summary || (report as any).summary ? (
            <div className="text-lg mb-2">{(translated as any).summary || (report as any).summary}</div>
          ) : null}

          {(translated as any).recommendation || (report as any).recommendation ? (
            <div className="bg-turquoise/10 border-l-4 border-turquoise px-3 py-2 rounded mb-2 text-turquoise-900 font-bold">
              Empfehlung: {(translated as any).recommendation || (report as any).recommendation}
            </div>
          ) : null}

          {report.impactLogic?.length ? (
            <div className="mb-2">
              <b>Impact:</b>
              <ul className="list-disc ml-6 text-sm mt-1">
                {report.impactLogic.map((i, idx) => (
                  <li key={idx}>
                    {i.type}: {i.description?.einfach || i.description?.eloquent || ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* ARGUMENTE */}
        <div className="px-7 pb-4 flex gap-3">
          <div className="flex-1">
            <b className="text-positive">Pro:</b>
            <ul className="list-disc ml-5 text-sm">{argumentsPro.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>
          <div className="flex-1">
            <b className="text-negative">Contra:</b>
            <ul className="list-disc ml-5 text-sm">{argumentsContra.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>
          {argumentsNeutral.length > 0 && (
            <div className="flex-1">
              <b className="text-warning">Neutral:</b>
              <ul className="list-disc ml-5 text-sm">{argumentsNeutral.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )}
        </div>

        {/* FAKTEN */}
        {facts.length > 0 && (
          <div className="px-7 pb-4">
            <div className="font-bold text-sm mb-1">Fakten & Studien:</div>
            <ul className="list-disc ml-5 text-xs text-neutral-700">
              {facts.map((f, i) => (
                <li key={i}>
                  {f.text}{" "}
                  {f.source?.url && (
                    <a
                      href={f.source.url}
                      className="underline hover:text-coral"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {f.source.name || f.source.url}
                    </a>
                  )}
                  {typeof f.source?.trustScore === "number" && (
                    <span className="ml-2 text-[10px] text-neutral-500">TrustScore: {f.source.trustScore}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* REGIONALE STIMMEN */}
        {regionalVoices.length > 0 && (
          <div className="px-7 pb-4">
            <div className="font-bold text-sm mb-1">Regionale Stimmen:</div>
            <div className="text-xs">VoicesList-Komponente einbinden</div>
          </div>
        )}

        {/* REDAKTION */}
        <div className="px-7 pb-4">
          <RedaktionAccordion editors={editors} />
        </div>

        {/* KOMMENTARE */}
        <div className="px-7 pb-3">
          <CommentsPanel reportId={report.id} />
        </div>

        {/* ACTION BAR */}
        <div className="flex flex-wrap gap-2 px-7 pb-7">
          <button
            className="flex-1 bg-coral text-white rounded-full py-3 font-bold text-base shadow-button"
            onClick={() => (onVote ? onVote("agree") : alert("Jetzt abstimmen (Modal folgt)"))}
          >
            Jetzt abstimmen
          </button>

          <button
            className="bg-white border border-coral text-coral rounded-full px-4 py-3 font-bold flex items-center gap-2 shadow-button"
            onClick={() =>
              onShare
                ? onShare(report)
                : (navigator as any).share && (navigator as any).share({ title: report.title, url: window.location.href })
            }
          >
            <FiShare2 /> Teilen
          </button>

          <button
            className="bg-white border border-indigo-200 text-indigo-700 rounded-full px-4 py-3 font-bold flex items-center gap-2 shadow-button"
            onClick={() => (onEdit ? onEdit(report) : alert("Bald verfügbar: Statement ergänzen!"))}
          >
            <FiEdit3 /> Statement ergänzen
          </button>

          <button
            className="bg-white border border-indigo-200 text-indigo-700 rounded-full px-4 py-3 font-bold flex items-center gap-2 shadow-button"
            onClick={() => exportAsPDFPNG(exportId, "pdf")}
          >
            <FiDownload /> Export PDF
          </button>

          <button
            className="bg-white border border-indigo-200 text-indigo-700 rounded-full px-4 py-3 font-bold flex items-center gap-2 shadow-button"
            onClick={() => exportAsPDFPNG(exportId, "png")}
          >
            <FiDownload /> Export PNG
          </button>

          <button
            className="bg-white border border-neutral-300 text-indigo-700 rounded-full px-4 py-3 font-bold flex items-center gap-2 shadow-button"
            title="Bookmark/Favorit (in Entwicklung)"
            type="button"
          >
            <FiBookmark />
          </button>

          <button
            className="bg-white border border-neutral-300 text-red-600 rounded-full px-4 py-3 font-bold flex items-center gap-2 shadow-button"
            title="Melden (in Entwicklung)"
            type="button"
          >
            <FiFlag />
          </button>
        </div>

        {/* NEWS/TRENDS */}
        <div className="px-7 pb-4">
          <NewsTrendWidget news={report.news} />
        </div>

        {/* AUDITLOG */}
        {report.modLog && report.modLog.length > 0 && (
          <details className="px-7 pb-4 mt-2">
            <summary className="text-xs underline text-gray-500 cursor-pointer">Redaktions-/Auditlog anzeigen</summary>
            <ul className="text-xs pl-4">
              {report.modLog.map((log, idx) => (
                <li key={idx}>
                  {log.action} – {log.by} – {log.date ? new Date(log.date).toLocaleString() : ""}
                </li>
              ))}
            </ul>
          </details>
        )}
      </article>
    </div>
  );
}
