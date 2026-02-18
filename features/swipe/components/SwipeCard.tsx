"use client";

import React, { useState, useMemo } from "react";
import ImpactIndicator from "./ImpactIndicator";
import VoteBar from "@features/vote/components/VoteBar";
import CountryAccordion from "@features/vote/components/CountryAccordion";
import { badgeColors } from "@/ui/design/badgeColor";
import clsx from "clsx";

const TYPE_CONFIG = {
  community: { label: "Community", color: "bg-turquoise-100 text-turquoise-800" },
  ki: { label: "KI", color: "bg-violet-100 text-violet-700" },
  redaktion: { label: "Redaktion", color: "bg-coral-100 text-coral-700" },
} as const;

type VoteVal = "agree" | "neutral" | "disagree";

const VOTE_MAP: { value: VoteVal; icon: string; label: string; color: string }[] = [
  { value: "agree", icon: "👍", label: "Zustimmen", color: "border-turquoise-500 text-turquoise-600" },
  { value: "neutral", icon: "🤔", label: "Neutral", color: "border-violet-500 text-violet-700" },
  { value: "disagree", icon: "👎", label: "Ablehnen", color: "border-coral-500 text-coral-600" },
];

type Alt = { text: string; type: keyof typeof TYPE_CONFIG | string };
type Statement = {
  id?: string;
  _id?: string;
  statementId?: string;
  dossierId?: string;
  title?: string;
  statement?: string;
  plainStatement?: string;
  translations?: Record<string, { title?: string }>;
  scope?: "hauptthema" | "unterthema" | "kampagne" | string;
  topicKey?: string;
  regionScope?: unknown[];
  tags?: string[];
  category?: string;
  votes?: Record<string, number>;
  impactLogic?: unknown[];
  alternatives?: Alt[];
  related?: { label?: string; relation?: string; href?: string; id?: string; title?: string; kind?: string }[];
  relatedStatements?: { id?: string; title?: string; relation?: string }[];
  graphContext?: { related?: { label?: string; relation?: string; href?: string; id?: string; title?: string }[] };
  contextPanel?: {
    reason?: string;
    related?: { label: string; relation?: string; href?: string }[];
    dossierHref?: string;
  };
  accessibilityStatus?: string;
  barrierescore?: number;
  aiAnnotations?: {
    toxicity?: number | null;
    sentiment?: string | null;
    subjectAreas?: string[];
  };
};

type Props = {
  statement: Statement | null | undefined;
  userHash?: string;
  onVote?: (vote: VoteVal) => void;
  userCountry?: string;
  language?: string;
};

export default function SwipeCard({
  statement,
  userHash,
  onVote,
  userCountry = "Deutschland",
  language = "de",
}: Props) {
  if (!statement) return null;

  const translated = useMemo(
    () => statement.translations?.[language] ?? {},
    [statement, language]
  );

  const plainStatement = statement.plainStatement || statement.statement || "";
  const regionScope = statement.regionScope || [];
  const barrierescore = statement.barrierescore;
  const accessibilityStatus = statement.accessibilityStatus;
  const ai = statement.aiAnnotations || {};
  const contextPanel = statement.contextPanel;
  const derivedRelatedRaw =
    contextPanel?.related ??
    statement.related ??
    statement.relatedStatements?.map((r) => ({
      label: r.title,
      relation: r.relation,
      id: r.id,
    })) ??
    statement.graphContext?.related ??
    [];
  const related = derivedRelatedRaw
    .map((item: any) => ({
      label: item.label ?? item.title ?? item.name,
      relation: item.relation ?? item.kind ?? item.type,
      href: item.href ?? (item.id ? `/dossier/${encodeURIComponent(item.id)}` : undefined),
    }))
    .filter((item: any) => item.label);
  const autoDossierId =
    statement.dossierId ?? statement.statementId ?? statement.id ?? statement._id;
  const autoDossierHref = autoDossierId ? `/dossier/${encodeURIComponent(String(autoDossierId))}` : undefined;
  const fallbackReason =
    contextPanel?.reason ||
    (statement.topicKey
      ? `Thema: ${statement.topicKey}`
      : statement.category || (statement.tags?.length ?? 0) > 0
        ? `Einordnung: ${statement.category ? statement.category : "Thema"}${statement.tags?.length ? ` · Tags: ${statement.tags.join(", ")}` : ""}`
        : undefined);
  const scopeLabel =
    statement.scope === "hauptthema"
      ? "Hauptthema"
      : statement.scope === "unterthema"
        ? "Unterthema"
        : statement.scope
          ? String(statement.scope)
          : undefined;
  const hasContext =
    Boolean(scopeLabel) ||
    Boolean(contextPanel?.reason) ||
    Boolean(fallbackReason) ||
    Boolean(contextPanel?.dossierHref || autoDossierHref) ||
    related.length > 0;
  const hasAI =
    ai &&
    (ai.toxicity != null ||
      ai.sentiment != null ||
      (Array.isArray(ai.subjectAreas) && ai.subjectAreas.length > 0));

  const [mainVote, setMainVote] = useState<VoteVal | "">("");
  const [showAlt, setShowAlt] = useState(false);
  const [altVotes, setAltVotes] = useState<Record<number, VoteVal | "">>({});

  function handleVote(type: VoteVal) {
    setMainVote(type);
    onVote?.(type);
    if ((type === "neutral" || type === "disagree") && (statement?.alternatives?.length ?? 0)) {
      setTimeout(() => setShowAlt(true), 200);
    }
  }

  function handleAltVote(idx: number, val: VoteVal) {
    setAltVotes((old) => ({ ...old, [idx]: old[idx] === val ? "" : val }));
  }

  return (
    <div className="bg-[rgb(var(--card))] rounded-3xl shadow-lg p-7 max-w-2xl mx-auto my-10 relative">
      {/* Header: Tags & Kategorie */}
      <div className="flex gap-2 mb-2 flex-wrap">
        {statement.tags?.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className={clsx("px-3 py-1 rounded-full text-xs font-bold border", (Array.isArray(badgeColors) ? badgeColors : Object.values(badgeColors as any))[i % (Array.isArray(badgeColors) ? badgeColors.length : Object.values(badgeColors as any).length)])}
          >
            {t}
          </span>
        ))}
        {scopeLabel && (
          <span className="px-3 py-1 rounded-full bg-[rgb(var(--bg))] text-[rgb(var(--muted))] text-xs font-semibold">
            {scopeLabel}
          </span>
        )}
        {statement.category && (
          <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold">
            {statement.category}
          </span>
        )}
      </div>

      {/* Farbverlauf-Titel */}
      <h2
        className="text-3xl font-bold mb-1 leading-snug"
        style={{
          background: "linear-gradient(90deg, #2396F3 10%, #00B3A6 60%, #FF6F61 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {translated.title || statement.title}
      </h2>

      {plainStatement && plainStatement !== statement.statement && (
        <div className="italic text-xs text-gray-500 mb-2">{plainStatement}</div>
      )}

      {/* Länder-/Region-Kontext (report.* entfernt, nur regionScope) */}
      <CountryAccordion countries={[]} regionScope={regionScope as any} userCountry={userCountry as any} />

      {/* VoteBar */}
      <VoteBar {...({ votes: (statement as any)?.votes || {} } as any)} />

      {/* Impact-Indicators */}
      {Array.isArray(statement.impactLogic) && statement.impactLogic.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {statement.impactLogic.map((impact, i) => (
            <ImpactIndicator impact={impact as any} key={i} />
          ))}
        </div>
      )}

      {/* Abstimmungs-Buttons */}
      <div className="flex gap-6 mb-6 mt-3 justify-center items-center">
        {VOTE_MAP.map((btn) => (
          <button
            key={btn.value}
            className={clsx(
              "w-48 h-16 flex items-center justify-center border-2 rounded-full font-bold text-lg gap-2 bg-[rgb(var(--card))]",
              btn.color,
              mainVote === btn.value && "scale-110 shadow-md"
            )}
            onClick={() => handleVote(btn.value)}
          >
            <span className="text-2xl">{btn.icon}</span>
            {btn.label}
          </button>
        ))}
      </div>

      {/* Alternativen */}
      {showAlt && (statement?.alternatives?.length ?? 0) ? (
        <div className="mb-3">
          <b className="block mb-2">Eventualziele & Alternativen:</b>
          <div className="flex flex-col gap-2">
            {(statement.alternatives ?? []).map((alt, idx) => (
              <div key={`${alt.text}-${idx}`} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2">
                <span
                  className={clsx(
                    "px-2 py-1 rounded-full text-xs font-semibold",
                    TYPE_CONFIG[(alt.type as keyof typeof TYPE_CONFIG) || "community"]?.color || "bg-gray-100"
                  )}
                >
                  {TYPE_CONFIG[(alt.type as keyof typeof TYPE_CONFIG) || "community"]?.label || alt.type}
                </span>
                <span className="flex-1">{alt.text}</span>
                <span className="flex gap-1">
                  {VOTE_MAP.map((v) => (
                    <button
                      key={v.value}
                      className={clsx(
                        "w-8 h-8 rounded-full border-2 text-lg font-bold flex items-center justify-center",
                        v.color,
                        altVotes[idx] === v.value ? "bg-gray-200 scale-110" : "bg-[rgb(var(--card))]"
                      )}
                      onClick={() => handleAltVote(idx, v.value)}
                    >
                      {v.icon}
                    </button>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Accessibility */}
      {(accessibilityStatus || typeof barrierescore === "number") && (
        <div className="flex gap-2 items-center text-xs mb-1" aria-label="Barrierefreiheit">
          {accessibilityStatus && <span className="rounded bg-green-50 text-green-700 px-2 py-1 font-bold">Accessibility: {accessibilityStatus}</span>}
          {typeof barrierescore === "number" && <span>Barrierefreiheits-Score: {barrierescore}/100</span>}
        </div>
      )}

      {/* KI-Analyse */}
      {hasAI && (
        <div className="text-xs text-gray-500 mt-1" aria-label="KI-Analyse">
          {ai.toxicity != null && <>Toxizität: {(ai.toxicity * 100).toFixed(2)} % </>}
          {ai.sentiment != null && <>Stimmung: {ai.sentiment} </>}
          {Array.isArray(ai.subjectAreas) && ai.subjectAreas.length > 0 && <>Themen: {ai.subjectAreas.join(", ")}</>}
        </div>
      )}

      {/* Kontext / Graph-Randinfo */}
      {hasContext && (
        <details className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
          <summary className="cursor-pointer list-none font-semibold text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border))] rounded-lg px-1 py-0.5">
            Warum sehe ich das?
          </summary>
          <div className="mt-2 space-y-2">
            {fallbackReason && (
              <p className="text-sm text-[rgb(var(--muted))]">{fallbackReason}</p>
            )}
            {related.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Verwandte Punkte</p>
                <ul className="mt-1 space-y-1">
                  {related.map((item, idx) => (
                    <li key={`${item.label}-${idx}`} className="flex items-center justify-between gap-2 text-sm">
                      {item.href ? (
                        <a className="font-semibold text-sky-700 underline" href={item.href}>
                          {item.label}
                        </a>
                      ) : (
                        <span className="font-semibold text-[rgb(var(--fg))]">{item.label}</span>
                      )}
                      {item.relation && (
                        <span className="rounded-full bg-[rgb(var(--card))] px-2 py-0.5 text-[11px] font-semibold text-[rgb(var(--muted))]">
                          {item.relation}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(contextPanel?.dossierHref || autoDossierHref) && (
              <a
                href={contextPanel?.dossierHref ?? autoDossierHref}
                className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))] hover:border-[rgb(var(--border))]"
              >
                Dossier öffnen
              </a>
            )}
          </div>
        </details>
      )}

      {/* Hinweis / CTA */}
      <input className="rounded-xl w-full bg-gray-100 mt-3 px-3 py-2 text-gray-400" value="Nur für Mitglieder" disabled />
      <div className="text-xs text-gray-500 mt-1 mb-2">Nur als registriertes Mitglied kannst du Alternativen einreichen.</div>
      <div className="bg-violet-50 p-3 mt-2 rounded-xl text-violet-700 text-sm font-semibold">
        <span className="mr-2">📈 Live-Auswertung (Trends, Argumente, Pro/Contra):</span>
        <a href="/mitglied" className="underline font-bold">
          Jetzt als Mitglied freischalten
        </a>
      </div>
      <div className="text-xs text-gray-400 mt-2 text-center">Beiträge & Alternativen werden durch Community, Redaktion & KI validiert.</div>
    </div>
  );
}
