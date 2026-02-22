"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Dossier } from "@features/dossier";
import DossierLayout from "./DossierLayout";
import EvidenceField from "./EvidenceField";
import DecisionSpace from "./DecisionSpace";
import InputsPanel from "./InputsPanel";
import VotePanel from "./VotePanel";
import ParticipationStatus from "./ParticipationStatus";
import LegitimacyPanel, { type LegitimacyMetric, type LegitimacyStatus } from "./LegitimacyPanel";
import TransparencyPanel from "./TransparencyPanel";
import AuditTimeline from "./AuditTimeline";
import CorrectionsPanel from "./CorrectionsPanel";
import ExportPanel from "./ExportPanel";
import EditorialInbox from "./EditorialInbox";
import EditorialInboxLive from "./EditorialInboxLive";
import WatchlistPanel from "./WatchlistPanel";
import RoadmapPanel from "./RoadmapPanel";
import MandatePanel from "./MandatePanel";
import MunicipalityMode from "./MunicipalityMode";
import InstitutionalHeader from "./InstitutionalHeader";
import { useDecisionState } from "./useDecisionState";
import { useInstitutionalDossier } from "./useInstitutionalDossier";
import {
  SECTION_TITLES,
  STATUS_LABELS,
  STANCE_LABELS,
  VOTE_POLICY_LABELS,
  JURISDICTION_LABELS,
  UI_DE,
} from "./labels";
import {
  getPresentation,
  type PresentationCluster,
  type PresentationVoteOption,
  type PresentationOrigin,
} from "./presentation";

type DimensionKey = "haushalt" | "paedagogik" | "klima" | "bauzeit";

type DimensionMeta = { key: DimensionKey; label: string };

type OptionCard = {
  id: string;
  label: string;
  type?: string;
  narrative: string;
  touches: string[];
  dimensions: { key: string; label: string; value: number }[];
  chips: string[];
  statementCount: number;
  evidenceCount: number;
  evidenceDensity: number;
  evidenceLevel: "none" | "linked" | "multi";
  evidenceScore: number;
  dimensionLine: string;
  clarifiedCount: number;
  questionTotal: number;
  budgetRange: string;
  riskProfile: string;
  clusterLabel?: string;
  majorityPct?: number;
  dimensionNote?: string;
};

type OptionLink = { optionId: string; claimId: string };

type EvidenceLink = { claimId: string; sourceId: string; weight?: number; kind?: string };

const DIMENSIONS: DimensionMeta[] = [
  { key: "haushalt", label: "Haushalt" },
  { key: "paedagogik", label: "Pädagogik" },
  { key: "klima", label: "Klima" },
  { key: "bauzeit", label: "Bauzeit" },
];

const OPTION_BUDGET: Record<string, string> = {
  "opt-a": "26–32 Mio €",
  "opt-b": "45–55 Mio €",
  "opt-c": "32–40 Mio €",
  "opt-d": "8–12 Mio €",
  "opt-f": "2–4 Mio €",
};

const OPTION_RISK: Record<string, string> = {
  "opt-a": "mittel",
  "opt-b": "hoch",
  "opt-c": "mittel",
  "opt-d": "niedrig",
  "opt-f": "niedrig",
};

const QUESTION_STATUS_LABELS: Record<string, string> = {
  offen: "Offen",
  in_pruefung: "In Prüfung",
  beantwortet: "Beantwortet",
  delegiert: "Delegiert",
  open: "Offen",
  in_review: "In Klärung",
  answered: "Beantwortet",
  closed: "Delegiert",
};

const QUESTION_STATUS_STYLES: Record<string, string> = {
  offen: "border-[rgb(var(--status-open)/0.45)] bg-[rgb(var(--status-open)/0.12)] text-[rgb(var(--fg))]",
  in_pruefung:
    "border-[rgb(var(--status-review)/0.45)] bg-[rgb(var(--status-review)/0.12)] text-[rgb(var(--fg))]",
  beantwortet:
    "border-[rgb(var(--status-done)/0.45)] bg-[rgb(var(--status-done)/0.12)] text-[rgb(var(--fg))]",
  delegiert:
    "border-[rgb(var(--status-delegated)/0.45)] bg-[rgb(var(--status-delegated)/0.12)] text-[rgb(var(--fg))]",
  open: "border-[rgb(var(--status-open)/0.45)] bg-[rgb(var(--status-open)/0.12)] text-[rgb(var(--fg))]",
  in_review:
    "border-[rgb(var(--status-review)/0.45)] bg-[rgb(var(--status-review)/0.12)] text-[rgb(var(--fg))]",
  answered:
    "border-[rgb(var(--status-done)/0.45)] bg-[rgb(var(--status-done)/0.12)] text-[rgb(var(--fg))]",
  closed:
    "border-[rgb(var(--status-delegated)/0.45)] bg-[rgb(var(--status-delegated)/0.12)] text-[rgb(var(--fg))]",
};

const QUESTION_STATUS_ACCENT: Record<string, string> = {
  offen: "border-l-2 border-l-[rgb(var(--status-open)/0.7)]",
  in_pruefung: "border-l-2 border-l-[rgb(var(--status-review)/0.7)]",
  beantwortet: "border-l-2 border-l-[rgb(var(--status-done)/0.7)]",
  delegiert: "border-l-2 border-l-[rgb(var(--status-delegated)/0.7)]",
  open: "border-l-2 border-l-[rgb(var(--status-open)/0.7)]",
  in_review: "border-l-2 border-l-[rgb(var(--status-review)/0.7)]",
  answered: "border-l-2 border-l-[rgb(var(--status-done)/0.7)]",
  closed: "border-l-2 border-l-[rgb(var(--status-delegated)/0.7)]",
};

const STATEMENT_TYPE_LABELS: Record<string, string> = {
  fact: "Tatsache",
  interpretation: "Interpretation",
  value: "Werturteil",
  question: "Offene Frage",
};

const ROLE_LABELS = {
  citizen: "Bürgersicht",
  organization: "Organisation",
  administration: "Verwaltung",
  journalist: "Journalismus",
  research: "Forschung",
  admin: "Administration",
  staff: "Redaktion/Staff",
} as const;

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "2-digit" });
}

function labelList(items?: string[] | null) {
  if (!items || items.length === 0) return "-";
  return items.join(", ");
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatLanguage(value?: string | null) {
  if (!value) return "-";
  if (value.toLowerCase() === "de") return "Deutsch";
  if (value.toLowerCase() === "en") return "Englisch";
  return value.toUpperCase();
}

function deriveStatementStats(claims: Dossier["analyze"]["claims"]) {
  const total = claims.length;
  let pro = 0;
  let neutral = 0;
  let contra = 0;

  for (const claim of claims) {
    if (claim.stance === "pro") pro += 1;
    else if (claim.stance === "contra") contra += 1;
    else neutral += 1;
  }

  return { total, pro, neutral, contra };
}

function getInputValue(inputs: Record<string, unknown> | undefined, keys: string[]) {
  if (!inputs) return undefined;
  for (const key of keys) {
    const value = inputs[key];
    if (value !== undefined) return value;
  }
  return undefined;
}

function normalizeText(value?: string | null) {
  return (value ?? "").toLowerCase();
}

function inferClusterFromClaim(claim: Dossier["analyze"]["claims"][number]) {
  const haystack = `${claim.title ?? ""} ${claim.domain ?? ""} ${(claim.domains ?? []).join(" ")}`;
  const text = normalizeText(haystack);
  if (text.includes("haushalt") || text.includes("kosten") || text.includes("finanz")) {
    return "Kosten/Haushalt";
  }
  if (text.includes("pädagog") || text.includes("raum") || text.includes("bildung")) {
    return "Pädagogik/Raumkonzept";
  }
  if (text.includes("klima") || text.includes("energie") || text.includes("co₂") || text.includes("co2")) {
    return "Klima/Energie";
  }
  if (text.includes("bau") || text.includes("übergang") || text.includes("infrastruktur")) {
    return "Bauzeit/Übergang";
  }
  return undefined;
}

function inferDimensionsFromClaim(claim: Dossier["analyze"]["claims"][number]) {
  const dimensions = new Set<DimensionKey>();
  const haystack = `${claim.title ?? ""} ${claim.domain ?? ""} ${(claim.domains ?? []).join(" ")}`;
  const text = normalizeText(haystack);

  if (text.includes("haushalt") || text.includes("kosten") || text.includes("finanz")) {
    dimensions.add("haushalt");
  }
  if (text.includes("pädagog") || text.includes("raum") || text.includes("bildung")) {
    dimensions.add("paedagogik");
  }
  if (text.includes("klima") || text.includes("energie") || text.includes("co₂") || text.includes("co2")) {
    dimensions.add("klima");
  }
  if (text.includes("bau") || text.includes("übergang") || text.includes("infrastruktur") || text.includes("brandschutz")) {
    dimensions.add("bauzeit");
  }

  return dimensions;
}

function optionNarrative(optionType?: string) {
  switch (optionType) {
    case "reform_strong":
      return "Struktureller Eingriff mit hoher Wirkung und klarer Priorisierung.";
    case "reform_moderate":
      return "Teilmodernisierung mit gestufter Umsetzung und reduzierten Risiken.";
    case "pilot":
      return "Zeitlich befristete Übergangslösung zur Stabilisierung des Betriebs.";
    case "custom":
      return "Flankierende Maßnahme zur Vorbereitung und Absicherung der Entscheidung.";
    default:
      return "Kontextabhängige Maßnahme im Rahmen der Entscheidungsarchitektur.";
  }
}

function dimensionNoteForOption(label: string, type?: string, chipCount = 0) {
  if (chipCount > 0) return undefined;
  const lowered = label.toLowerCase();
  if (lowered.includes("kooperation") || type === "custom") {
    return "Querschnittsthema: governance- oder verfahrensbezogen, ohne dominante Entscheidungsdimension.";
  }
  if (type === "pilot") {
    return "Übergangslösung mit prozessualem Fokus; keine einzelne Entscheidungsdimension dominiert.";
  }
  return "Querschnittsthema ohne dominante Entscheidungsdimension.";
}

function formatDimensionLine(chips: string[]) {
  const mapped = chips.map((chip) => (chip === "Haushalt" ? "Budget" : chip));
  if (!mapped.includes("Risiko")) mapped.push("Risiko");
  if (mapped.length === 1) return `${mapped[0]}`;
  return mapped.join(" · ");
}

function statementLineClass(stance?: string | null) {
  if (stance === "pro") return "border-l-2 border-l-teal-600/70";
  if (stance === "contra") return "border-l-2 border-l-teal-500/55";
  return "border-l-2 border-l-teal-400/45";
}

function uiIcon(
  name:
    | "impact"
    | "relevance"
    | "budget"
    | "vote"
    | "dossier"
    | "protocol"
    | "municipality"
    | "topic"
    | "status"
    | "level"
    | "window"
    | "date",
  className = "h-4 w-4",
) {
  const cls = className;
  switch (name) {
    case "impact":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
          <path d="M4 16l6-6 4 4 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 8h6v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "relevance":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v6l4 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "budget":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
          <path d="M6 7h12a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 10c-1.2 0-2 .6-2 1.4 0 1.9 4 .8 4 2.9 0 .9-.9 1.7-2 1.7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 9v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "vote":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
          <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M8 12l2.5 2.5L16 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "dossier":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
          <path d="M8 4h8l2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M9 10h6M9 14h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "protocol":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
          <path d="M8 4h8l2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M9 9h6M9 13h6M9 17h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "municipality":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
          <path d="M12 3l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V7l7-4Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M8 12h8M8 15h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "topic":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
          <path d="M7 7h10v10H7z" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M4 10V7a3 3 0 0 1 3-3h3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "status":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
          <path d="M6 4v16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M6 5h12l-2.5 4 2.5 4H6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "level":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
          <path d="M12 3l9 5-9 5-9-5 9-5Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M3 16l9 5 9-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "window":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
          <path d="M6 2h12M6 22h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 6h8l-2 3 2 3H8l2-3-2-3Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M10 12l-2 3h8l-2-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "date":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
          <rect x="4" y="5" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M8 3v4M16 3v4M4 9h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}

function metaChipIcon(label: string, className = "h-3.5 w-3.5") {
  const l = label.toLowerCase();
  if (l.includes("thema")) return uiIcon("topic", className);
  if (l.includes("status")) return uiIcon("status", className);
  if (l.includes("ebene") || l.includes("level")) return uiIcon("level", className);
  if (l.includes("kommune") || l.includes("region")) return uiIcon("municipality", className);
  if (l.includes("zeitfenster") || l.includes("window")) return uiIcon("window", className);
  if (l.includes("stand") || l.includes("datum")) return uiIcon("date", className);
  return null;
}


function renderOriginIcon(kind: PresentationOrigin["kind"], asset?: string) {
  if (asset) {
    return <img src={asset} alt="" className="h-full w-full object-contain" />;
  }
  if (kind === "community") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full">
        <path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5Z" fill="currentColor" />
        <path d="M4 21c0-3.9 3.6-7 8-7s8 3.1 8 7" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === "association") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full">
        <path d="M8 12a4 4 0 0 1 4-4h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 12a4 4 0 0 1-4 4H8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 8h4v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "media") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full">
        <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M8 8h8M8 12h8M8 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full">
      <path d="M12 10h40v20c0 16-12 26-20 30-8-4-20-14-20-30V10z" fill="none" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}

function orderOrigins(origins: PresentationOrigin[], fallbackAdmin?: PresentationOrigin) {
  const list = origins.length ? [...origins] : [];
  if (!list.find((origin) => origin.kind === "administration") && fallbackAdmin) {
    list.unshift(fallbackAdmin);
  }
  const order: PresentationOrigin["kind"][] = ["administration", "community", "association", "media"];
  return list.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
}

function buildEvidenceLinks(claimIds: Set<string>, sourceIds: Set<string>, edges: Dossier["analyze"]["evidenceGraph"]["edges"]) {
  const links: EvidenceLink[] = [];
  for (const edge of edges) {
    if (claimIds.has(edge.from) && sourceIds.has(edge.to)) {
      links.push({ claimId: edge.from, sourceId: edge.to, weight: edge.weight, kind: edge.kind });
    } else if (claimIds.has(edge.to) && sourceIds.has(edge.from)) {
      links.push({ claimId: edge.to, sourceId: edge.from, weight: edge.weight, kind: edge.kind });
    }
  }
  return links;
}

function mergeClusters(defaultClusters: PresentationCluster[], derivedClusters: PresentationCluster[]) {
  if (defaultClusters.length) return defaultClusters;
  return derivedClusters;
}

export function DossierViewer({ dossier }: { dossier: Dossier }) {
  const { meta, analyze, voteConfig } = dossier;
  const corrections = useMemo(() => dossier.corrections ?? [], [dossier.corrections]);
  const presentationBundle = useMemo(() => getPresentation(dossier), [dossier]);
  const { presentation, streams, contributions, voteOptions, majorityDemo, traceability, openQuestions } =
    presentationBundle;
  const { selectedOptionId, savedOptionId, savedAt, setSelectedOptionId, saveSelection, saveNotice } =
    useDecisionState(meta.id, {
      onMajorityUpdate: (payload) => {
        if (payload.majorityDemo?.length) setMajorityLive(payload.majorityDemo);
        if (payload.updatedAt) setMajorityUpdatedAt(payload.updatedAt);
        if (typeof payload.totalVotes === "number") setMajorityTotalVotes(payload.totalVotes);
      },
    });
  const [sessionActorRole, setSessionActorRole] = useState<"admin" | "editor" | "member" | null>(null);
  const [sessionRoles, setSessionRoles] = useState<string[] | null>(null);
  const [watchlistActive, setWatchlistActive] = useState<boolean | null>(null);
  const [watchlistBusy, setWatchlistBusy] = useState(false);
  const [clarificationNotice, setClarificationNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/session", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ ok?: boolean; actorRole?: string; roles?: string[] }>)
      .then((data) => {
        if (cancelled) return;
        if (data?.ok) {
          setSessionActorRole((data.actorRole as any) ?? null);
          setSessionRoles(Array.isArray(data.roles) ? data.roles : []);
        }
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!meta.id) return;
    fetch("/api/dossier/watchlist/list", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ ok?: boolean; items?: Array<{ dossierId: string }> }>)
      .then((data) => {
        if (cancelled) return;
        if (data?.ok && Array.isArray(data.items)) {
          setWatchlistActive(data.items.some((item) => item.dossierId === meta.id));
        }
      })
      .catch(() => {
        if (!cancelled) setWatchlistActive(null);
      });
    return () => {
      cancelled = true;
    };
  }, [meta.id]);

  const viewerRole = useMemo(() => {
    if (sessionRoles?.includes("staff")) return "staff";
    if (sessionRoles?.includes("administration")) return "administration";
    if (sessionRoles?.includes("journalist")) return "journalist";
    if (sessionActorRole === "admin") return "admin";
    if (sessionActorRole === "editor") return "journalist";
    return presentation.viewerRole ?? "citizen";
  }, [sessionRoles, sessionActorRole, presentation.viewerRole]);
  const isCitizen = viewerRole === "citizen";
  const roleLabel = ROLE_LABELS[viewerRole] ?? viewerRole;
  const canEditOrigins = viewerRole === "admin" || viewerRole === "staff";
  const canTriggerClarification =
    viewerRole === "organization" ||
    viewerRole === "administration" ||
    viewerRole === "journalist" ||
    viewerRole === "admin" ||
    viewerRole === "staff";
  const displaySavedOptionId = isCitizen ? savedOptionId : null;
  const displaySavedAt = isCitizen ? savedAt : null;
  const recommendation = presentation.recommendation ?? {};
  const allowedRecommendationRoles = recommendation.allowedRoles ?? [
    "organization",
    "administration",
    "journalist",
    "admin",
    "staff",
  ];
  const canSeeRecommendation = allowedRecommendationRoles.includes(viewerRole);
  const inst = useInstitutionalDossier(meta.id);
  const materialLinkCount =
    typeof inst.data?.materialLinks?.length === "number" ? inst.data?.materialLinks?.length : null;
  const materialLinks = inst.data?.materialLinks ?? null;
  const materialEdgeByItemId = useMemo(() => {
    const map = new Map<string, "supports" | "mentions" | "contradicts" | "unknown">();
    for (const link of materialLinks ?? []) {
      if (link.kind !== "statement") continue;
      if (!link.itemId) continue;
      map.set(String(link.itemId), (link.edgeType ?? "unknown") as any);
    }
    return map;
  }, [materialLinks]);
  const fallbackAdminOrigin = presentation.emblem
    ? {
        kind: "administration" as const,
        label: presentation.emblem.label ?? "Verwaltung",
        subtitle: presentation.emblem.subtitle ?? "Gemeinde (Verwaltung)",
        asset: presentation.emblem.asset,
      }
    : undefined;
  const orderedOrigins = orderOrigins(presentation.origins ?? [], fallbackAdminOrigin);
  const loopOrigins = useMemo(
    () => (orderedOrigins.length ? [...orderedOrigins, ...orderedOrigins, ...orderedOrigins] : []),
    [orderedOrigins],
  );
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);


  const primaryOriginIndex = useMemo(() => {
    if (!orderedOrigins.length) return 0;
    const explicit = orderedOrigins.findIndex((origin) => origin.primary);
    if (explicit >= 0) return explicit;
    const adminIndex = orderedOrigins.findIndex((origin) => origin.kind === "administration");
    if (adminIndex >= 0) return adminIndex;
    return 0;
  }, [orderedOrigins]);

  const primaryLoopIndex = useMemo(() => {
    const base = orderedOrigins.length;
    return base ? primaryOriginIndex + base : 0;
  }, [orderedOrigins.length, primaryOriginIndex]);

  useEffect(() => {
    const container = carouselRef.current;
    if (!container || loopOrigins.length === 0) return;

    if (!canEditOrigins) {
      setActiveCarouselIndex(primaryLoopIndex);
      requestAnimationFrame(() => {
        const target = container.querySelector<HTMLElement>(`[data-carousel-index="${primaryLoopIndex}"]`);
        if (target) target.scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" });
      });
      return;
    }

    const updateActive = () => {
      const cards = Array.from(container.querySelectorAll<HTMLElement>("[data-carousel-index]"));
      if (!cards.length) return;
      const center = container.scrollLeft + container.clientWidth / 2;
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const card of cards) {
        const idx = Number(card.dataset.carouselIndex ?? 0);
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(cardCenter - center);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = idx;
        }
      }
      setActiveCarouselIndex(bestIndex);
    };

    const handleScroll = () => {
      const third = container.scrollWidth / 3;
      if (third > 0) {
        if (container.scrollLeft < third * 0.5) container.scrollLeft += third;
        if (container.scrollLeft > third * 1.5) container.scrollLeft -= third;
      }
      updateActive();
    };

    container.scrollLeft = container.scrollWidth / 3;
    updateActive();

    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateActive);
    };
  }, [loopOrigins.length, canEditOrigins, primaryLoopIndex]);

  const derivedStats = deriveStatementStats(analyze.claims);
  const statementStats = presentation.statementStats ?? derivedStats;
  const clusters = mergeClusters(
    presentation.clusters ?? [],
    presentation.statementStats?.clusters ?? [],
  );

  const inputs = presentation.inputs ?? {};
  const timeWindow =
    getInputValue(inputs, ["zeitfenster", "updatedWindow"]) ??
    (presentation.topic?.windowDays ? `${presentation.topic.windowDays} Tage` : "-");

  const rawStreamCount = getInputValue(inputs, ["streams"]);
  const rawContributionCount = getInputValue(inputs, ["beiträge", "beitraege", "contributions"]);
  const streamCount = streams.length || (typeof rawStreamCount === "number" ? rawStreamCount : 0);
  const contributionCount =
    contributions.length || (typeof rawContributionCount === "number" ? rawContributionCount : 0);

  const sources = dossier.sourceSet.length ? dossier.sourceSet : analyze.runReceipt?.sourceSet ?? [];

  const statementTitleById = new Map(analyze.claims.map((claim) => [claim.id, claim.title ?? claim.id]));

  const questionsForDisplay =
    openQuestions.length > 0
      ? openQuestions
      : analyze.questions.map((q) => ({ id: q.id, text: q.text }));

  const delegationEntries = useMemo(() => {
    if (inst.data?.delegations?.length) return inst.data.delegations;
    return presentation.openIssueManagement?.issues ?? [];
  }, [inst.data?.delegations, presentation.openIssueManagement?.issues]);
  const delegationByQuestionId = useMemo(() => {
    const map = new Map<string, any>();
    for (const item of delegationEntries) {
      const qid = (item as any).questionId;
      if (qid) map.set(String(qid), item);
    }
    return map;
  }, [delegationEntries]);

  const canManageWatchlist = watchlistActive !== null;

  const toggleWatchlist = async () => {
    if (watchlistBusy || !meta.id) return;
    setWatchlistBusy(true);
    try {
      const res = await fetch("/api/dossier/watchlist/toggle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dossierId: meta.id }),
      });
      const json = (await res.json()) as { ok?: boolean; watching?: boolean };
      if (json?.ok) setWatchlistActive(Boolean(json.watching));
    } finally {
      setWatchlistBusy(false);
    }
  };

  const clarifiedCount = questionsForDisplay.filter((q) => {
    const status = (q as { status?: string }).status;
    return status === "beantwortet" || status === "answered";
  }).length;
  const questionTotal = questionsForDisplay.length;

  const optionStatementIds = new Map<string, string[]>();
  for (const claim of analyze.claims) {
    const options = claim.debateFrame?.options ?? [];
    for (const option of options) {
      const list = optionStatementIds.get(option.id) ?? [];
      list.push(claim.id);
      optionStatementIds.set(option.id, list);
    }
  }

  const optionTouchedTitles = new Map<string, string[]>();
  for (const [optionId, ids] of optionStatementIds.entries()) {
    optionTouchedTitles.set(
      optionId,
      ids.map((id) => statementTitleById.get(id) ?? id),
    );
  }

  for (const option of presentation.options ?? []) {
    if (option.touchesStatements?.length) {
      optionTouchedTitles.set(
        option.id,
        option.touchesStatements.map((id) => statementTitleById.get(id) ?? id),
      );
    }
  }

  const optionCatalog = presentation.options ?? [];
  const baseVotingOptions: PresentationVoteOption[] = voteOptions.length
    ? voteOptions
    : presentation.vote?.options?.length
      ? presentation.vote.options
      : optionCatalog.map((option) => ({ id: option.id, label: option.label, type: option.type }));

  const voteOptionMap = new Map(baseVotingOptions.map((item) => [item.id, item]));
  for (const option of optionCatalog) {
    if (voteOptionMap.size >= 5) break;
    if (!voteOptionMap.has(option.id)) {
      voteOptionMap.set(option.id, { id: option.id, label: option.label, type: option.type });
    }
  }
  if (voteOptionMap.size < 5) {
    for (const optionId of optionStatementIds.keys()) {
      if (voteOptionMap.size >= 5) break;
      if (!voteOptionMap.has(optionId)) {
        voteOptionMap.set(optionId, { id: optionId, label: optionId, type: "custom" });
      }
    }
  }
  const votingOptions: PresentationVoteOption[] = Array.from(voteOptionMap.values());

  const votingOptionIds = useMemo(() => votingOptions.map((opt) => opt.id).join("|"), [votingOptions]);
  const fallbackMajority = useMemo(() => {
    if (!votingOptionIds) return [];
    return votingOptionIds
      .split("|")
      .filter(Boolean)
      .map((id) => ({ id, pct: 0 }));
  }, [votingOptionIds]);
  const baseMajority = useMemo(
    () => (majorityDemo.length ? majorityDemo : presentation.vote?.majorityDemo ?? fallbackMajority),
    [majorityDemo, presentation.vote?.majorityDemo, fallbackMajority],
  );
  const baseMajorityKey = useMemo(() => {
    return [...baseMajority]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((item) => `${item.id}:${item.pct}`)
      .join("|");
  }, [baseMajority]);
  const [majorityLive, setMajorityLive] = useState(baseMajority);
  const majorityLiveKey = useMemo(() => {
    return [...majorityLive]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((item) => `${item.id}:${item.pct}`)
      .join("|");
  }, [majorityLive]);
  const [majorityUpdatedAt, setMajorityUpdatedAt] = useState(presentation.vote?.updatedAt);
  const [majorityTotalVotes, setMajorityTotalVotes] = useState(presentation.vote?.totalVotes);

  useEffect(() => {
    if (majorityLiveKey !== baseMajorityKey) {
      setMajorityLive(baseMajority);
    }
    setMajorityUpdatedAt((prev) => (prev === presentation.vote?.updatedAt ? prev : presentation.vote?.updatedAt));
    setMajorityTotalVotes((prev) => (prev === presentation.vote?.totalVotes ? prev : presentation.vote?.totalVotes));
  }, [
    meta.id,
    baseMajorityKey,
    majorityLiveKey,
    baseMajority,
    presentation.vote?.updatedAt,
    presentation.vote?.totalVotes,
  ]);

  const majorityMap = new Map(majorityLive.map((item) => [item.id, item.pct]));

  const claimIds = new Set(analyze.claims.map((claim) => claim.id));
  const sourceIds = new Set(
    (analyze.evidenceGraph?.nodes ?? []).filter((node) => node.type === "evidence").map((node) => node.id),
  );

  const evidenceLinks = analyze.evidenceGraph?.edges
    ? buildEvidenceLinks(claimIds, sourceIds, analyze.evidenceGraph.edges)
    : [];

  const evidenceCountByClaim = new Map<string, number>();
  for (const link of evidenceLinks) {
    evidenceCountByClaim.set(link.claimId, (evidenceCountByClaim.get(link.claimId) ?? 0) + 1);
  }

  const optionCards: OptionCard[] = votingOptions.map((vote) => {
    const full = optionCatalog.find((item) => item.id === vote.id);
    const statementIds = full?.touchesStatements?.length
      ? full.touchesStatements
      : optionStatementIds.get(vote.id) ?? [];
    const touches = optionTouchedTitles.get(vote.id) ?? [];

    const dimensionCounts: Record<DimensionKey, number> = {
      haushalt: 0,
      paedagogik: 0,
      klima: 0,
      bauzeit: 0,
    };

    const clusterCounts = new Map<string, number>();
    let evidenceCount = 0;

    for (const statementId of statementIds) {
      const claim = analyze.claims.find((item) => item.id === statementId);
      if (!claim) continue;
      const dims = inferDimensionsFromClaim(claim);
      for (const dim of dims) dimensionCounts[dim] += 1;
      const cluster = inferClusterFromClaim(claim);
      if (cluster) clusterCounts.set(cluster, (clusterCounts.get(cluster) ?? 0) + 1);
      evidenceCount += evidenceCountByClaim.get(statementId) ?? 0;
    }

    const dimensions = DIMENSIONS.map((dim) => {
      const count = dimensionCounts[dim.key];
      const value = count > 0 ? Math.min(0.9, 0.25 + count * 0.2) : 0.2;
      return { key: dim.key, label: dim.label, value };
    });

    const chips = DIMENSIONS.filter((dim) => dimensionCounts[dim.key] > 0).map((dim) => dim.label);
    const dimensionNote = dimensionNoteForOption(vote.label, full?.type ?? vote.type, chips.length);

    const clusterLabel = Array.from(clusterCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    const computedLevel =
      evidenceCount === 0 ? "none" : evidenceCount > 1 ? "multi" : "linked";

    const evidenceScore = evidenceCount === 0 ? 0 : evidenceCount === 1 ? 1 : 2;
    const dimensionLine = formatDimensionLine(chips);

    return {
      id: vote.id,
      label: vote.label,
      type: full?.type ?? vote.type,
      narrative: optionNarrative(full?.type ?? vote.type),
      touches,
      dimensions,
      chips,
      statementCount: statementIds.length,
      evidenceCount,
      evidenceDensity: 0,
      evidenceLevel: full?.evidenceLevel ?? computedLevel,
      evidenceScore,
      dimensionLine,
      clarifiedCount,
      questionTotal,
      budgetRange: OPTION_BUDGET[vote.id] ?? "—",
      riskProfile: OPTION_RISK[vote.id] ?? "mittel",
      clusterLabel,
      majorityPct: majorityMap.get(vote.id),
      dimensionNote,
    };
  });

  const maxEvidence = optionCards.reduce((max, card) => Math.max(max, card.evidenceCount), 0);
  const matrixOptions = optionCards.map((card) => ({
    ...card,
    evidenceDensity: maxEvidence > 0 ? card.evidenceCount / maxEvidence : 0,
  }));

  const optionLinkSet = new Set<string>();
  const optionLinks: OptionLink[] = [];
  for (const [optionId, ids] of optionStatementIds.entries()) {
    for (const claimId of ids) {
      const key = `${optionId}:${claimId}`;
      if (optionLinkSet.has(key)) continue;
      optionLinkSet.add(key);
      optionLinks.push({ optionId, claimId });
    }
  }
  for (const option of presentation.options ?? []) {
    for (const claimId of option.touchesStatements ?? []) {
      const key = `${option.id}:${claimId}`;
      if (optionLinkSet.has(key)) continue;
      optionLinkSet.add(key);
      optionLinks.push({ optionId: option.id, claimId });
    }
  }

  const contestedClaimIds = useMemo(
    () =>
      corrections
        .filter(
          (item) => item.kind === "objection" && item.targetType === "claim" && item.status === "open",
        )
        .map((item) => item.targetId),
    [corrections],
  );

  const contestedClaimSet = useMemo(() => new Set(contestedClaimIds), [contestedClaimIds]);

  const coreClaims = analyze.claims.filter((claim) => claim.importance === 5);
  const secondaryClaims = analyze.claims.filter((claim) => claim.importance !== 5);

  const metaChips = [
    { label: "Thema", value: presentation.topic?.label ?? "-" },
    { label: "Status", value: STATUS_LABELS[meta.status] ?? meta.status },
    { label: UI_DE.level, value: JURISDICTION_LABELS[meta.jurisdiction] ?? meta.jurisdiction },
    { label: UI_DE.municipalityRegion, value: meta.region ?? "-" },
    { label: "Zeitfenster", value: String(timeWindow) },
    { label: "Stand", value: formatDate(meta.updatedAt ?? meta.createdAt) },
  ];

  const jurisdictionLabel = JURISDICTION_LABELS[meta.jurisdiction] ?? meta.jurisdiction;
  const municipalityLabel =
    meta.region ??
    presentation.emblem?.label ??
    presentation.topic?.municipality ??
    "-";


  const heroImpact = presentation.hero?.impactLevel ?? "Hoch";
  const heroRelevance = presentation.hero?.relevance ?? "10–20 Jahre";
  const heroBudget = presentation.hero?.budgetRange ?? "30–50 Mio €";
  const heroParticipation =
    presentation.hero?.participation ??
    `Bürgerbeteiligung (mindestens ${voteConfig?.minOptions ?? 5} Optionen)`;
  const analysisMethodText = analyze.runReceipt?.pipelineVersion
    ? `Analyseverfahren: ${analyze.runReceipt.pipelineVersion}`
    : UI_DE.analysisMethod;

  const claimNodes = analyze.claims.map((claim) => ({
    id: claim.id,
    label: claim.title ?? claim.id,
    cluster: inferClusterFromClaim(claim),
    importance: claim.importance,
    domain: claim.domain,
    statementType: (claim as { statementType?: string }).statementType ?? null,
  }));

  const graphNodes = analyze.evidenceGraph?.nodes ?? [];
  const sourceExcerpts = presentation.sourceExcerpts ?? {};
  const sourceNodes = graphNodes
    .filter((node) => node.type === "evidence")
    .map((node) => ({ id: node.id, label: node.label, excerpt: sourceExcerpts[node.id], url: node.url }));

  const graphEdges = useMemo(() => {
    const edges = analyze.evidenceGraph?.edges ?? [];
    if (!edges.length || materialEdgeByItemId.size === 0) return edges;
    return edges.map((edge) => {
      const claimId = materialEdgeByItemId.has(edge.from)
        ? edge.from
        : materialEdgeByItemId.has(edge.to)
          ? edge.to
          : null;
      if (!claimId) return edge;
      const kind = materialEdgeByItemId.get(claimId);
      return kind && kind !== edge.kind ? { ...edge, kind } : edge;
    });
  }, [analyze.evidenceGraph?.edges, materialEdgeByItemId]);

  const evidenceSummary = analyze.evidenceGraph?.summary;
  const claimCount = evidenceSummary?.claimCount ?? analyze.claims.length;
  const linkedClaimCount = evidenceSummary?.linkedClaimCount ?? 0;
  const unlinkedClaimCount =
    evidenceSummary?.unlinkedClaimCount ?? Math.max(0, claimCount - linkedClaimCount);

  const evidenceIndex = clampScore(
    (claimCount ? (linkedClaimCount / claimCount) * 70 : 0) +
      Math.min(20, sources.length * 5) -
      (claimCount ? (unlinkedClaimCount / claimCount) * 20 : 0),
  );

  const questionsWithStatus = questionsForDisplay.filter((q) => (q as { status?: string }).status);
  const totalQuestions = questionsForDisplay.length;
  const answeredQuestions = questionsForDisplay.filter((q) => {
    const status = (q as { status?: string }).status;
    return status === "beantwortet" || status === "answered";
  }).length;
  const inReviewQuestions = questionsForDisplay.filter((q) => {
    const status = (q as { status?: string }).status;
    return status === "in_pruefung" || status === "in_review" || status === "delegiert";
  }).length;

  const clarificationIndex = clampScore(
    totalQuestions === 0
      ? 90
      : questionsWithStatus.length
        ? (answeredQuestions / totalQuestions) * 70 + (inReviewQuestions / totalQuestions) * 15 + 15
        : 100 - Math.min(80, totalQuestions * 12),
  );

  const missingPerspectiveCount = analyze.missingPerspectives?.length ?? 0;
  const participationCandidateCount = analyze.participationCandidates?.length ?? 0;
  const perspectivesIndex = clampScore(60 + participationCandidateCount * 8 - missingPerspectiveCount * 15);

  const transparencyIndex = clampScore(
    (analyze.runReceipt ? 35 : 0) +
      Math.min(30, sources.filter((src) => src.publisher && src.canonicalUrl).length * 10) +
      (meta.createdAt && meta.updatedAt ? 10 : 0) +
      (analyze.runReceipt?.promptVersion || analyze.runReceipt?.snapshotId ? 15 : 0) +
      (analyze.runReceipt?.contentPolicy ? 10 : 0),
  );

  let legitimacyStatus: LegitimacyStatus = {
    label: "vorläufig",
    text: "Dokumentationsstand: vorläufig (Grundlage im Aufbau).",
    tone: "neutral",
  };

  if (clarificationIndex < 50 || totalQuestions > 0) {
    legitimacyStatus = {
      label: "in Klärung",
      text: "Dokumentationsstand: in Klärung (offene Fragen vorhanden).",
      tone: "warning",
    };
  } else if (evidenceIndex >= 60 && transparencyIndex >= 70 && clarificationIndex >= 50) {
    legitimacyStatus = {
      label: "abstimmungsreif",
      text: "Dokumentationsstand: abstimmungsreif (ausreichende Beleglage und Protokolltiefe).",
      tone: "positive",
    };
  } else if (transparencyIndex >= 70 && evidenceIndex < 60) {
    legitimacyStatus = {
      label: "dokumentiert",
      text: "Dokumentationsstand: dokumentiert (Transparenz gegeben, Beleglage ausbaufähig).",
      tone: "neutral",
    };
  }

  const legitimacyMetrics: LegitimacyMetric[] = [
    {
      key: "evidenz",
      label: "Evidenz (Beleglage)",
      value: evidenceIndex,
      description: "Wie viele Aussagen sind mit Quellen verknüpft?",
    },
    {
      key: "klaerung",
      label: "Klärung (offene Punkte)",
      value: clarificationIndex,
      description: "Welche Fragen sind noch offen oder in Bearbeitung?",
    },
    {
      key: "perspektiven",
      label: "Perspektiven (Beteiligung)",
      value: perspectivesIndex,
      description: "Welche Gruppen sollten mitreden oder eingebunden werden?",
    },
    {
      key: "transparenz",
      label: "Transparenz (Protokoll)",
      value: transparencyIndex,
      description: "Ist nachvollziehbar, wie das Ergebnis entstanden ist?",
    },
  ];

  const header = (
    <header className="space-y-8 border-b border-[rgb(var(--border))] pb-10">
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
            Dossier (Demonstrationsfall)
          </p>
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[rgb(var(--muted))]">
              Kommunale Bildungsinfrastruktur
            </p>
            <h1 className="headline-grad text-5xl font-extrabold leading-[1.02] tracking-tight md:text-7xl">
              Sanierung oder Neubau einer bestehenden Schule
            </h1>
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[rgb(var(--muted))]">[ Kontext · Evidenz · Optionen · Beteiligung ]</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="vog-card group p-4 transition hover:shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] uppercase tracking-wide text-[rgb(var(--muted))]">
                  Wirkungsniveau
                </p>
                <span className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-1.5 text-[rgb(var(--grad-from))]">
                  {uiIcon("impact")}
                </span>
              </div>
              <p className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">{heroImpact}</p>
              <p className="text-[11px] text-[rgb(var(--muted))]">Priorität & Reichweite</p>
            </div>

            <div className="vog-card group p-4 transition hover:shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] uppercase tracking-wide text-[rgb(var(--muted))]">
                  Entscheidungsrelevanz
                </p>
                <span className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-1.5 text-[rgb(var(--grad-from))]">
                  {uiIcon("relevance")}
                </span>
              </div>
              <p className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">{heroRelevance}</p>
              <p className="text-[11px] text-[rgb(var(--muted))]">Zeithorizont</p>
            </div>

            <div className="vog-card group p-4 transition hover:shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] uppercase tracking-wide text-[rgb(var(--muted))]">
                  Budgetdimension
                </p>
                <span className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-1.5 text-[rgb(var(--grad-from))]">
                  {uiIcon("budget")}
                </span>
              </div>
              <p className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">{heroBudget}</p>
              <p className="text-[11px] text-[rgb(var(--muted))]">Investitionsrahmen</p>
            </div>

            <div className="vog-card group p-4 transition hover:shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] uppercase tracking-wide text-[rgb(var(--muted))]">
                  Abstimmungsmodus
                </p>
                <span className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-1.5 text-[rgb(var(--grad-from))]">
                  {uiIcon("vote")}
                </span>
              </div>
              <p className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">{heroParticipation}</p>
              <p className="text-[11px] text-[rgb(var(--muted))]">Beteiligung & Optionen</p>
            </div>
          </div>
          <p className="max-w-prose text-lg leading-relaxed text-[rgb(var(--muted))]">
            {analyze.sourceText ?? "Fragestellung des Dossiers."} Dieses Demonstrationsdossier zeigt eine digitale Entscheidungsakte: strukturierte Kernaussagen, normierter Optionenraum, Evidenzverknüpfung und Zuständigkeitswege.
          </p>
          <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">
            Die Abstimmungsdarstellung ist in dieser Demo simuliert und dient der Veranschaulichung der Beteiligungsebene.
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] text-[rgb(var(--muted))]">
            {metaChips.map((chip) => {
              const icon = metaChipIcon(chip.label);
              return (
                <span
                  key={`${chip.label}-${chip.value}`}
                  className="vog-chip inline-flex items-center gap-2"
                >
                  {icon ? <span className="text-[rgb(var(--muted))]">{icon}</span> : null}
                  <span>
                    {chip.label}:{" "}
                    <span className="font-semibold text-[rgb(var(--fg))]">{chip.value}</span>
                  </span>
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-2 text-[rgb(var(--grad-from))]">
                {presentation.emblem?.asset ? (
                  <img src={presentation.emblem.asset} alt="" className="h-full w-full object-contain" />
                ) : (
                  uiIcon("municipality", "h-full w-full")
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  Kommune/Region
                </p>
                <p className="truncate text-sm font-semibold text-[rgb(var(--fg))]">{municipalityLabel}</p>
                {presentation.emblem?.subtitle ? (
                  <p className="truncate text-[11px] text-[rgb(var(--muted))]">{presentation.emblem.subtitle}</p>
                ) : null}
              </div>
            </div>
            <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[11px] uppercase tracking-wide text-[rgb(var(--muted))]">
              {jurisdictionLabel}
            </span>
          </div>
          <div className={`rounded-xl border p-4 ${legitimacyStatus.tone === "positive" ? "border-teal-600/35 bg-teal-600/8" : legitimacyStatus.tone === "warning" ? "border-[rgb(var(--border))] bg-[rgb(var(--card))]" : "border-[rgb(var(--border))] bg-[rgb(var(--card))]"}`}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              <span className="inline-flex items-center gap-2">
                <span className="text-[rgb(var(--grad-from))]">{uiIcon("dossier", "h-4 w-4")}</span>
                Dokumentationsstand
              </span>
            </p>
            <p className="text-sm font-semibold text-[rgb(var(--fg))]">{legitimacyStatus.label}</p>
            <p className="text-[11px] text-[rgb(var(--muted))]">{legitimacyStatus.text}</p>
          </div>
          <InstitutionalHeader dossierId={meta.id} viewerRole={viewerRole as any} inst={inst} />
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              <span className="inline-flex items-center gap-2">
                <span className="text-[rgb(var(--grad-from))]">{uiIcon("protocol", "h-4 w-4")}</span>
                Status & Protokoll
              </span>
            </p>
            <div className="text-sm text-[rgb(var(--fg))]">{analysisMethodText}</div>
            <div className="text-sm text-[rgb(var(--fg))]">
              Stand: {formatDate(meta.updatedAt ?? meta.createdAt)}
            </div>
            <div className="text-[11px] text-[rgb(var(--muted))]">
              Sprache: {formatLanguage(analyze.language)}
            </div>
          </div>
          {orderedOrigins.length > 1 ? (
            <div className="flex min-h-[220px] flex-1 flex-col items-center justify-center gap-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
                Initiatoren & Träger
              </p>
              <div className="w-full">
                <div className="relative mx-auto max-w-[360px] overflow-hidden">
                  <div
                    ref={carouselRef}
                    className={`hide-scrollbar flex w-full snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-6 py-4 ${
                      canEditOrigins ? "" : "pointer-events-none"
                    }`}
                    aria-label="Initiatoren-Karussell"
                    style={{
                      WebkitMaskImage:
                        "linear-gradient(90deg, transparent 0%, black 14%, black 86%, transparent 100%)",
                      maskImage:
                        "linear-gradient(90deg, transparent 0%, black 14%, black 86%, transparent 100%)",
                    }}
                  >
                    {loopOrigins.map((origin, index) => {
                      const loopLen = loopOrigins.length;
                      const distance = Math.min(
                        Math.abs(index - activeCarouselIndex),
                        Math.abs(index - activeCarouselIndex + loopLen),
                        Math.abs(index - activeCarouselIndex - loopLen),
                      );
                      const isActive = index === activeCarouselIndex;
                      const curve = Math.max(0, 1 - distance / 2.6);
                      const offset = Math.round(curve * 16);
                      const scale = isActive ? 1.08 : distance === 1 ? 0.95 : 0.88;
                      const opacity = isActive ? 1 : distance === 1 ? 0.65 : 0.35;
                      const showPrimary = !canEditOrigins && index === primaryLoopIndex;
                      return (
                        <div
                          key={`${origin.kind}-${origin.label ?? index}-${index}`}
                          data-carousel-index={index}
                          className={`relative snap-center rounded-2xl border bg-[rgb(var(--card))] px-4 py-4 text-center shadow-soft transition-transform duration-300 cursor-pointer ${
                            isActive || showPrimary
                              ? "min-w-[240px] border-[rgb(var(--grad-from))] ring-1 ring-[rgb(var(--grad-from))] ring-offset-0 z-10"
                              : "min-w-[190px] border-[rgb(var(--border))]"
                          }`}
                          style={{
                            transform: `translateY(${offset}px) scale(${scale})`,
                            opacity,
                            backgroundImage: isActive
                              ? "radial-gradient(circle_at_top, rgba(14,165,233,0.12), rgba(15,23,42,0.05))"
                              : undefined,
                          }}
                          onClick={(event) => {
                            if (!canEditOrigins) return;
                            const card = event.currentTarget;
                            card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                          }}
                        >
                          <div
                            className={`mx-auto flex items-center justify-center rounded-full bg-[rgb(var(--bg))] text-[rgb(var(--fg))] ${
                              isActive ? "h-24 w-24" : "h-16 w-16"
                            }`}
                          >
                            {renderOriginIcon(origin.kind, origin.asset)}
                          </div>
                          <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{origin.label ?? "—"}</p>
                          <p className="text-[11px] text-[rgb(var(--muted))]">{origin.subtitle ?? "—"}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="max-w-md space-y-1 text-[11px] text-[rgb(var(--muted))]">
                <p>Federführung: Verwaltung (falls übernommen). Danach: Community · Verbände/Vereine · Medien.</p>
                <p>Statusvergabe: nur Admin/Staff. Sonst gilt die Hauptquelle, aus der das Thema hervorging.</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );

  const mainLeft = (
    <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="#streams"
          className="vog-card p-4 space-y-2 transition hover:shadow-soft"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Themenströme
          </div>
          <div className="text-2xl font-semibold text-[rgb(var(--fg))]">{streamCount || "-"}</div>
          <div className="text-[11px] text-[rgb(var(--muted))]">Alle Themenströme anzeigen</div>
        </Link>
        <Link
          href="#beitraege"
          className="vog-card p-4 space-y-2 transition hover:shadow-soft"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Beiträge</div>
          <div className="text-2xl font-semibold text-[rgb(var(--fg))]">{contributionCount || "-"}</div>
          <div className="text-[11px] text-[rgb(var(--muted))]">Alle Beiträge anzeigen</div>
        </Link>
        <div className="vog-card p-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{UI_DE.coreStatements}</div>
          <div className="text-2xl font-semibold text-[rgb(var(--fg))]">
            {statementStats.total ?? derivedStats.total}
          </div>
          <div className="text-[11px] text-[rgb(var(--muted))]">
            Pro/Neutral/Contra: {statementStats.pro ?? derivedStats.pro}/
            {statementStats.neutral ?? derivedStats.neutral}/{statementStats.contra ?? derivedStats.contra}
          </div>
        </div>
        <div className="vog-card p-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Quellen</div>
          <div className="text-2xl font-semibold text-[rgb(var(--fg))]">{sources.length}</div>
        </div>
      </section>

      <InputsPanel
        streams={streams}
        contributions={contributions}
        traceability={traceability}
        statementTitleById={statementTitleById}
        dossierId={meta.id}
        materialLinkCount={materialLinkCount}
        materialLinks={materialLinks}
        viewerRole={viewerRole}
      />

      <MunicipalityMode regionalSuggestions={presentation.regionalSuggestions} viewerRole={viewerRole as any} />

      <section className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.options}
        </div>
        <DecisionSpace
          options={matrixOptions}
          ctaHref="#vote"
          traceHref="#graph"
          selectedOptionId={selectedOptionId}
          onSelect={(optionId) => setSelectedOptionId(optionId)}
          optionRanking={majorityMap}
        />
      </section>

      <LegitimacyPanel
        metrics={legitimacyMetrics}
        status={legitimacyStatus}
        footnote={
          <p className="text-[11px] text-[rgb(var(--muted))]">
            Die Werte dienen der Einordnung im Demo-Dossier und ersetzen keine fachliche Prüfung.
          </p>
        }
      />

      <section id="vote" className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Abstimmung & Mehrheitsdynamik
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <VotePanel
            options={votingOptions}
            selectedOptionId={selectedOptionId}
            savedOptionId={savedOptionId}
            onSelect={setSelectedOptionId}
            onSave={() => void saveSelection()}
            saveNotice={saveNotice}
            savedAt={savedAt}
            canVote={isCitizen}
            roleLabel={roleLabel}
          />
          <ParticipationStatus
            options={votingOptions}
            majorityDemo={majorityLive}
            savedOptionId={displaySavedOptionId}
            savedAt={displaySavedAt}
            totalVotes={majorityTotalVotes}
            updatedAt={majorityUpdatedAt}
            history={presentation.vote?.history}
            showUserVote={isCitizen}
          />
        </div>
      </section>
    </>
  );

  const fullWidth = (
    <section id="graph" className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        Evidenz-Topologie
      </div>
      <EvidenceField
        options={votingOptions.map((opt) => ({ id: opt.id, label: opt.label }))}
        claims={claimNodes}
        sources={sourceNodes}
        edges={graphEdges}
        optionLinks={optionLinks}
        optionRanking={majorityMap}
        contestedClaimIds={contestedClaimIds}
        findings={analyze.findings}
      />
    </section>
  );

  const afterLeft = (
    <>
      <section className="space-y-2 border-t border-[rgb(var(--border))] pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
          Argumentationslandschaft
        </p>
        <div className="h-1 w-16 rounded-full bg-brand-grad opacity-80" />
        <p className="text-sm text-[rgb(var(--muted))]">
          Einordnung der Kernpositionen, Teilaspekte, Spannungsfelder und offenen Fragen.
        </p>
      </section>
      <section className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.clusters}
        </div>
        <div className="h-1 w-12 rounded-full bg-brand-grad opacity-70" />
        {clusters.length ? (
          <div className="flex flex-wrap gap-2 text-[11px] text-[rgb(var(--muted))]">
            {clusters.map((cluster) => (
              <span key={cluster.label} className="vog-chip">
                {cluster.label} ({cluster.count})
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[rgb(var(--muted))]">Keine Cluster hinterlegt.</p>
        )}
        {analyze.knots.length ? (
          <div className="space-y-2 text-sm text-[rgb(var(--fg))]">
            {analyze.knots.map((knot) => (
              <div key={knot.id} className="vog-card p-4">
                <p className="text-sm font-semibold">{knot.label}</p>
                <p className="text-sm text-[rgb(var(--muted))]">{knot.description}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.statements}
        </div>
        <div className="h-1 w-12 rounded-full bg-brand-grad opacity-70" />

        <div className="space-y-4">
          <div className="text-sm font-semibold text-[rgb(var(--fg))]">Kernpositionen</div>
          <div className="grid gap-3">
            {coreClaims.map((claim) => (
              <article
                key={claim.id}
                id={`stmt-${claim.id}`}
                className={`vog-card p-5 space-y-3 ${statementLineClass(claim.stance)}`}
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
                  <span className="vog-chip">Position: {STANCE_LABELS[claim.stance ?? ""] ?? "-"}</span>
                  <span className="vog-chip">Wichtigkeit: {claim.importance ?? "-"}</span>
                  <span className="vog-chip">Zuständigkeit: {claim.responsibility ?? "-"}</span>
                  {(claim as { statementType?: string }).statementType ? (
                    <span className="vog-chip">
                      Typ:{" "}
                      {STATEMENT_TYPE_LABELS[(claim as { statementType?: string }).statementType ?? ""] ??
                        (claim as { statementType?: string }).statementType}
                    </span>
                  ) : null}
                  {contestedClaimSet.has(claim.id) ? (
                    <span className="vog-chip border-rose-400/50 bg-rose-500/10 text-rose-200">
                      Einspruch offen
                    </span>
                  ) : null}
                </div>
                <div>
                  <p className="text-base font-semibold text-[rgb(var(--fg))]">{claim.title ?? "Kernaussage"}</p>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{claim.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-[rgb(var(--fg))]">Teilaspekte</div>
          <div className="grid gap-3">
            {secondaryClaims.map((claim) => (
              <article
                key={claim.id}
                id={`stmt-${claim.id}`}
                className={`vog-card p-5 space-y-2 ${statementLineClass(claim.stance)}`}
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
                  <span className="vog-chip">Position: {STANCE_LABELS[claim.stance ?? ""] ?? "-"}</span>
                  <span className="vog-chip">Wichtigkeit: {claim.importance ?? "-"}</span>
                  <span className="vog-chip">Zuständigkeit: {claim.responsibility ?? "-"}</span>
                  {(claim as { statementType?: string }).statementType ? (
                    <span className="vog-chip">
                      Typ:{" "}
                      {STATEMENT_TYPE_LABELS[(claim as { statementType?: string }).statementType ?? ""] ??
                        (claim as { statementType?: string }).statementType}
                    </span>
                  ) : null}
                  {contestedClaimSet.has(claim.id) ? (
                    <span className="vog-chip border-rose-400/50 bg-rose-500/10 text-rose-200">
                      Einspruch offen
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{claim.title ?? "Kernaussage"}</p>
                <p className="text-sm text-[rgb(var(--muted))]">{claim.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.report}
        </div>
        <div className="h-1 w-12 rounded-full bg-brand-grad opacity-70" />
        <div className="vog-card p-5 space-y-4">
          <p className="text-sm text-[rgb(var(--fg))]">{analyze.report.summary ?? "-"}</p>
          <div className="text-[11px] text-[rgb(var(--muted))]">
            Spannungen: {labelList(analyze.report.keyConflicts)}
          </div>
          <div className="text-[11px] text-[rgb(var(--muted))]">
            Erkenntnisse: {labelList(analyze.report.takeaways)}
          </div>
        </div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-[11px] text-[rgb(var(--muted))]">
          Hinweis: Ein Dossier ist kein Wahrheitsurteil. Es zeigt transparent, was belegt ist – und was noch offen bleibt.
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.decisionTrees}
        </div>
        <div className="h-1 w-12 rounded-full bg-brand-grad opacity-70" />
        <div className="grid gap-4">
          {analyze.decisionTrees.map((tree) => (
            <div key={tree.id ?? tree.rootStatementId} className="vog-card p-5 space-y-3">
              <div className="text-sm text-[rgb(var(--fg))]">
                Ausgangspunkt: <span className="font-semibold">{tree.rootStatementId}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                  <p className="text-xs font-semibold text-[rgb(var(--fg))]">Pro</p>
                  <p className="text-[11px] text-[rgb(var(--muted))]">{tree.options.pro.narrative}</p>
                </div>
                <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                  <p className="text-xs font-semibold text-[rgb(var(--fg))]">Contra</p>
                  <p className="text-[11px] text-[rgb(var(--muted))]">{tree.options.contra.narrative}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Empfehlung (Kurzansicht)
        </div>
        <div className="h-1 w-12 rounded-full bg-brand-grad opacity-70" />
        <div className="vog-card p-5 space-y-3">
          <p className="text-[11px] text-[rgb(var(--muted))]">
            Transparenzhinweis: Die Empfehlung basiert auf Evidenzlage, Klärungsstand, Perspektiven und Zuständigkeiten.
          </p>
          {canSeeRecommendation ? (
            <>
              <p className="text-sm leading-relaxed text-[rgb(var(--fg))]">
                {recommendation.fullText ??
                  "Konsolidierte Empfehlung: Eine gestufte Hybridlösung (Teilneubau + Bestand) mit vorgelagertem Gutachtenpaket bietet im aktuellen Dokumentationsstand das robusteste Verhältnis aus Umsetzbarkeit, Belastungssteuerung und Nachvollziehbarkeit."}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn btn-ghost text-xs">
                  {recommendation.ctaLabel ?? "Vollständige Empfehlung öffnen"}
                </button>
                <span className="text-[11px] text-[rgb(var(--muted))]">
                  {recommendation.ctaHint ?? "Zugriff limitiert auf berechtigte Gruppen und Lizenzstufen."}
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-[rgb(var(--fg))] line-clamp-3 opacity-70 blur-[1.2px]">
                {recommendation.teaser ??
                  "In der Kurzansicht wird eine konsolidierte Empfehlung angedeutet, die die Ergebnisse des Dossiers zusammenführt. Die vollständige Begründung umfasst Gewichtungen, Abwägungen und eine formalisierte Entscheidungsmatrix."}
              </p>
              <p className="text-[11px] text-[rgb(var(--muted))]">
                Vollzugang ist limitiert und in dieser Rollenansicht („{roleLabel}“) nicht freigeschaltet.
              </p>
            </>
          )}
        </div>
      </section>
    </>
  );

  const sidebar = (
    <>
      <section className="vog-card p-5 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.metadata}
        </div>
        <div className="text-sm text-[rgb(var(--fg))]">Status: {STATUS_LABELS[meta.status] ?? meta.status}</div>
        <div className="text-sm text-[rgb(var(--fg))]">
          {UI_DE.level}: {JURISDICTION_LABELS[meta.jurisdiction] ?? meta.jurisdiction}
        </div>
        <div className="text-sm text-[rgb(var(--fg))]">Region: {meta.region ?? "-"}</div>
        <div className="text-sm text-[rgb(var(--fg))]">Zeitfenster: {timeWindow as string}</div>
        <div className="text-sm text-[rgb(var(--fg))]">Letztes Update: {formatDate(meta.updatedAt ?? meta.createdAt)}</div>
        {voteConfig ? (
          <>
            <div className="text-sm text-[rgb(var(--fg))]">
              Abstimmungsmodus: {VOTE_POLICY_LABELS[voteConfig.policy] ?? voteConfig.policy}
            </div>
            <div className="text-sm text-[rgb(var(--fg))]">Mindestoptionen: {voteConfig.minOptions}</div>
            <div className="text-sm text-[rgb(var(--fg))]">
              {UI_DE.communityOptions}: {voteConfig.allowCommunityOptions ? "aktiv" : "deaktiviert"}
            </div>
          </>
        ) : null}
      </section>
      <TransparencyPanel
        sources={sources}
        runReceipt={analyze.runReceipt}
        createdAt={meta.createdAt}
        updatedAt={meta.updatedAt}
        revision={meta.revision}
      />
      <CorrectionsPanel items={corrections} />
      <AuditTimeline events={inst.data?.auditTrail ?? []} />
      <ExportPanel dossierId={meta.id} />
      <MandatePanel viewerRole={viewerRole as any} />
      {viewerRole === "admin" || viewerRole === "staff" ? (
        <EditorialInboxLive enabled />
      ) : (
        <EditorialInbox items={presentation.editorialInbox} />
      )}
      {canManageWatchlist ? (
        <section className="vog-card p-5 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Beobachtungsliste
          </div>
          <button
            type="button"
            className="btn btn-ghost text-xs"
            onClick={() => void toggleWatchlist()}
            disabled={watchlistBusy}
          >
            {watchlistActive ? "Nicht mehr beobachten" : "Beobachten"}
          </button>
          <p className="text-[11px] text-[rgb(var(--muted))]">
            Updates werden in der Beobachtungsliste gesammelt.
          </p>
        </section>
      ) : null}
      <WatchlistPanel items={presentation.watchlist} />
      <RoadmapPanel items={presentation.roadmap} />

      <section className="vog-card p-5 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Evidenz-Überblick
        </div>
        <div className="text-sm text-[rgb(var(--fg))]">
          Kernaussagen: {analyze.evidenceGraph?.summary.claimCount ?? analyze.claims.length}
        </div>
        <div className="text-sm text-[rgb(var(--fg))]">Quellen: {analyze.evidenceGraph?.summary.evidenceCount ?? sources.length}</div>
        <div className="text-sm text-[rgb(var(--fg))]">Kanten: {graphEdges.length}</div>
        <div className="text-sm text-[rgb(var(--fg))]">
          Verknüpfte Kernaussagen: {analyze.evidenceGraph?.summary.linkedClaimCount ?? "-"}
        </div>
      </section>
    </>
  );

  const afterSidebar = (
    <>
      <section className="vog-card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.questions}
        </div>
        <div className="space-y-3">
          {questionsForDisplay.map((q) => {
            const status = (q as { status?: string }).status ?? "open";
            const responsible = (q as { responsible?: string }).responsible;
            const supportActors = (q as { supportActors?: string[] }).supportActors ?? [];
            const lastUpdate = (q as { lastUpdate?: string }).lastUpdate;
            const resolution = (q as { resolution?: string }).resolution;
            const sourceNote = (q as { sourceNote?: string }).sourceNote;
            const delegation = delegationByQuestionId.get(q.id);
            const delegationStatus = delegation?.status as string | undefined;
            const delegatedTo = delegation?.delegatedTo as string | undefined;
            const delegatedLevel = delegation?.level as string | undefined;
            const delegatedAt = delegation?.requestedAt as string | undefined;
            const coordination =
              responsible && /amt|behörde|dienststelle|ministerium|kammer/i.test(responsible)
                ? "Behörde/Fachstelle"
                : responsible
                  ? "Plattform/Community"
                  : "Plattform";
            const statusNote =
              status === "beantwortet" || status === "answered"
                ? "Antwort dokumentiert."
                : status === "in_pruefung" || status === "in_review"
                  ? "Anfrage gestellt, Rückmeldung ausstehend."
                  : status === "delegiert" || status === "closed"
                    ? "Zuständigkeit delegiert, Klärung läuft."
                    : "Noch keine Antwort dokumentiert.";
            return (
              <div
                key={q.id}
                className={`rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 ${
                  QUESTION_STATUS_ACCENT[status] ?? ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      QUESTION_STATUS_STYLES[status] ?? "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]"
                    }`}
                  >
                    {QUESTION_STATUS_LABELS[status] ?? "Offen"}
                  </span>
                  {lastUpdate ? (
                    <span className="text-[11px] text-[rgb(var(--muted))]">Stand: {formatDate(lastUpdate)}</span>
                  ) : null}
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-[rgb(var(--fg))]">{q.text}</p>
                  <p className="text-[11px] text-[rgb(var(--muted))]">{statusNote}</p>
                  {resolution ? (
                    <p className="text-[11px] text-[rgb(var(--muted))]">
                      Antwortdokumentation: {resolution}
                    </p>
                  ) : null}
                  {sourceNote ? (
                    <p className="text-[11px] text-[rgb(var(--muted))]">Hinweis: {sourceNote}</p>
                  ) : null}
                  {responsible ? (
                    <p className="text-[11px] text-[rgb(var(--muted))]">
                      Zuständig für Klärung: {responsible}
                    </p>
                  ) : null}
                  <p className="text-[11px] text-[rgb(var(--muted))]">
                    Zuständigkeitstyp: {coordination}
                  </p>
                  {supportActors.length ? (
                    <p className="text-[11px] text-[rgb(var(--muted))]">
                      Unterstützend: {supportActors.join(", ")}
                    </p>
                  ) : null}
                  {delegatedTo ? (
                    <p className="text-[11px] text-[rgb(var(--muted))]">
                      Delegiert an: {delegatedTo}
                      {delegatedLevel ? ` (${delegatedLevel})` : ""}
                    </p>
                  ) : null}
                  {delegationStatus ? (
                    <p className="text-[11px] text-[rgb(var(--muted))]">
                      Delegationsstatus: {delegationStatus}
                    </p>
                  ) : !responsible ? (
                    <p className="text-[11px] text-[rgb(var(--muted))]">
                      Zuständigkeit: noch nicht zugeordnet.
                    </p>
                  ) : null}
                  {delegatedAt ? (
                    <p className="text-[11px] text-[rgb(var(--muted))]">
                      Angefragt am: {formatDate(delegatedAt)}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-[rgb(var(--muted))]">
          Antworten können aus Fachbehörden, Gutachten oder lokalen Quellen stammen. Anfragen werden durch die Plattform koordiniert und dokumentiert.
        </p>
        {canTriggerClarification ? (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-ghost text-xs">
              Klärung anstoßen
            </button>
            <span className="text-[11px] text-[rgb(var(--muted))]">Anfragen an Behörden stellt die Plattform.</span>
          </div>
        ) : isCitizen ? (
          <div className="mt-2 space-y-2">
            <button
              type="button"
              className="btn btn-ghost text-xs"
              onClick={async () => {
                setClarificationNotice(null);
                const questionText =
                  questionsForDisplay[0]?.text ?? "Bitte klären: Offene Frage im Dossier";
                try {
                  const res = await fetch("/api/dossier/request-clarification", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      dossierId: meta.id,
                      questionText,
                      context: "Bürgeranfrage über Dossier-Ansicht",
                    }),
                  });
                  const json = (await res.json()) as { ok?: boolean };
                  setClarificationNotice(
                    json?.ok
                      ? "Anfrage wurde an die Redaktion übermittelt."
                      : "Anfrage konnte nicht gesendet werden.",
                  );
                } catch {
                  setClarificationNotice("Anfrage konnte nicht gesendet werden.");
                }
              }}
            >
              Klärung anfragen (an Redaktion)
            </button>
            <p className="text-[11px] text-[rgb(var(--muted))]">
              Die Plattform koordiniert Anfragen. Es werden keine Einzelanfragen an Behörden ausgelöst.
            </p>
            {clarificationNotice ? (
              <p className="text-[11px] text-[rgb(var(--muted))]">{clarificationNotice}</p>
            ) : null}
          </div>
        ) : (
          <span className="text-[11px] text-[rgb(var(--muted))]">
            Klärung anstoßen ist in dieser Rollenansicht nicht freigeschaltet.
          </span>
        )}
      </section>

      <section className="vog-card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.responsibilityPaths}
        </div>
        <div className="space-y-3 text-sm text-[rgb(var(--fg))]">
          {analyze.responsibilityPaths.map((path) => (
            <div key={path.id} className="space-y-1">
              <div className="text-[11px] text-[rgb(var(--muted))]">
                {statementTitleById.get(path.statementId) ?? path.statementId}
              </div>
              <div className="text-sm text-[rgb(var(--fg))]">
                {path.nodes.map((node) => node.displayName).join(" → ")}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  return (
    <DossierLayout
      header={header}
      mainLeft={mainLeft}
      sidebar={sidebar}
      fullWidth={fullWidth}
      afterLeft={afterLeft}
      afterSidebar={afterSidebar}
    />
  );
}

export default DossierViewer;
