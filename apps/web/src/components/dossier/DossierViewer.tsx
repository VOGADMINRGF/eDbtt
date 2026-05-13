"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePrivacyGate } from "@/components/privacy/PrivacyGateProvider";
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

type SourceMatrixEntry = {
  id: string;
  title: string;
  source: string;
  canonicalUrl?: string;
  geography?: string;
  period?: string;
  sourceType?: string;
  cluster?: string;
  takeaway?: string;
  notAutomatic?: string;
  evidenceStatus?: string;
  transferability?: string;
  criticalCaveat?: string;
};

type ZahlenAuditEntry = {
  metric: string;
  source: string;
  measured: string;
  denominator: string;
  period: string;
  geography: string;
  method: string;
  controlGroup?: string;
  transferabilityCaveat: string;
  evidenceStatus: string;
};

type BeteiligungsAuditData = {
  section: string;
  score?: { level: string; rationale?: string };
  auditQuestions?: string[];
  mandateRule?: string;
  checklist?: Record<string, boolean>;
};

const DIMENSIONS: DimensionMeta[] = [
  { key: "haushalt", label: "Haushalt" },
  { key: "paedagogik", label: "Pädagogik" },
  { key: "klima", label: "Klima" },
  { key: "bauzeit", label: "Bauzeit" },
];

const OPTION_BUDGET: Record<string, string> = {
  "opt-a": "Regelwerk + Umbau in Stufen",
  "opt-b": "Betriebs- und Logistikfenster",
  "opt-c": "Geringe Umstellungskosten",
  "opt-d": "Pilotbudget (befristet)",
  "opt-e": "Monitoring + Infrastruktur",
  "opt-f": "Ausnahme- und Inklusionsprozess",
};

const OPTION_RISK: Record<string, string> = {
  "opt-a": "mittel",
  "opt-b": "mittel",
  "opt-c": "hoch",
  "opt-d": "mittel",
  "opt-e": "hoch",
  "opt-f": "mittel",
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
  organization: "Organisation (gekennzeichnet)",
  administration: "Verwaltung",
  journalist: "Journalismus",
  research: "Forschung",
  admin: "Administration",
  staff: "Redaktion/Staff",
} as const;

const SOURCE_TYPE_LABELS: Record<string, string> = {
  academic: "Wissenschaft",
  policy: "Policy",
  city_report: "Stadtbericht",
  evaluation: "Evaluation",
  survey: "Umfrage",
  legal_framework: "Rechtsrahmen",
};

const SOURCE_CLUSTER_LABELS: Record<string, string> = {
  air_quality: "Luftqualität",
  traffic_displacement: "Verkehrsverlagerung",
  logistics: "Logistik",
  accessibility: "Barrierefreiheit & Zugang",
  economics: "Ökonomie",
  micromobility: "Mikromobilität",
  participation: "Beteiligung",
  governance: "Governance",
};

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

function isOrganizationLikeLabel(value?: string | null): boolean {
  if (!value) return false;
  return /amt|behörde|dienststelle|ministerium|kammer|verein|verband|organisation|fraktion/i.test(
    value,
  );
}

function formatLanguage(value?: string | null) {
  if (!value) return "-";
  if (value.toLowerCase() === "de") return "Deutsch";
  if (value.toLowerCase() === "en") return "Englisch";
  return value.toUpperCase();
}

function parseJsonContextNote<T>(notes: Dossier["analyze"]["notes"], noteId: string): T | null {
  const note = notes.find((entry) => entry.id === noteId && entry.kind === "context");
  if (!note?.text) return null;
  try {
    return JSON.parse(note.text) as T;
  } catch {
    return null;
  }
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

export function DossierViewer({
  dossier,
  hideExternalCreateLinks = false,
}: {
  dossier: Dossier;
  hideExternalCreateLinks?: boolean;
}) {
  const privacyGate = usePrivacyGate();
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
  const [activeClusterFilter, setActiveClusterFilter] = useState<string | null>(null);

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

  const primaryOrigin = orderedOrigins[primaryOriginIndex] ?? null;
  const secondaryOrigins = useMemo(
    () => orderedOrigins.filter((_, idx) => idx !== primaryOriginIndex).slice(0, 4),
    [orderedOrigins, primaryOriginIndex],
  );

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

  const sourceMatrixData = useMemo(
    () =>
      parseJsonContextNote<{ section?: string; entries?: SourceMatrixEntry[] }>(
        analyze.notes,
        "note-source-matrix",
      ),
    [analyze.notes],
  );
  const sourceMatrixEntries = useMemo(() => sourceMatrixData?.entries ?? [], [sourceMatrixData]);

  const zahlenAuditData = useMemo(
    () =>
      parseJsonContextNote<{ section?: string; entries?: ZahlenAuditEntry[] }>(
        analyze.notes,
        "note-zahlen-audit",
      ),
    [analyze.notes],
  );
  const zahlenAuditEntries = zahlenAuditData?.entries ?? [];

  const beteiligungsAuditData = useMemo(
    () => parseJsonContextNote<BeteiligungsAuditData>(analyze.notes, "note-beteiligungs-audit"),
    [analyze.notes],
  );

  const topTakeaways = useMemo(() => {
    const defaults = [
      "Zugangsrechte statt einfacher Auto-ja/nein-Debatte.",
      "Verkehrsbeschränkungen können wirken, aber Verlagerung bleibt kritisch.",
      "Innenstadtökonomie hängt stark vom Nutzungsmix ab.",
      "Lieferlogistik, Barrierefreiheit und Mikromobilität müssen mitgeplant werden.",
      "Prozentzahlen sind nur mit Grundgesamtheit und Methode belastbar.",
    ];
    const merged = [...(analyze.report.takeaways ?? []), ...defaults];
    return Array.from(new Set(merged)).slice(0, 6);
  }, [analyze.report.takeaways]);

  const topOpenIssues = useMemo(() => {
    const defaults = [
      "Absolute Zahlen hinter Prozentwerten fehlen teilweise.",
      "Teilnehmerzahl und Beteiligungsqualität sind noch nicht vollständig belegt.",
      "Verlagerung auf Randstraßen ist lokal zu prüfen.",
      "Ausnahmen für Mobilitätseinschränkungen sind konkret zu definieren.",
      "E-Autos, E-Mopeds und Lieferfahrzeuge brauchen klare Zugangsgrenzen.",
      "Fahrradstellplätze, Lastenräder und E-Scooter-Zonen sind operativ zu planen.",
    ];
    const merged = [...(analyze.report.openQuestions ?? []), ...defaults];
    return Array.from(new Set(merged)).slice(0, 6);
  }, [analyze.report.openQuestions]);

  const sourceClusters = useMemo(() => {
    const map = new Map<string, SourceMatrixEntry[]>();
    for (const entry of sourceMatrixEntries) {
      const cluster = entry.cluster ?? "governance";
      const list = map.get(cluster) ?? [];
      list.push(entry);
      map.set(cluster, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [sourceMatrixEntries]);

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
    if (!privacyGate.ensureActiveProcessingAllowed("dossier-watchlist")) return;
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

  const contributionPolicy = presentation.contributionPolicy;

  function claimEvidenceCount(claimId: string): number {
    return evidenceCountByClaim.get(claimId) ?? 0;
  }

  function claimReviewStatus(claimId: string): string {
    if (contestedClaimSet.has(claimId)) return "Einspruch offen";
    const count = claimEvidenceCount(claimId);
    if (count <= 0) return "Quellenprüfung offen";
    if (count === 1) return "Einfach belegt";
    return "Mehrfach belegt";
  }

  function isFactLikeClaim(claim: Dossier["analyze"]["claims"][number]): boolean {
    return (claim as { statementType?: string }).statementType === "fact";
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

  const rawCoreClaims = analyze.claims.filter((claim) => claim.importance === 5);
  const rawSecondaryClaims = analyze.claims.filter((claim) => claim.importance !== 5);
  const coreClaims = rawCoreClaims.filter((claim) =>
    activeClusterFilter ? inferClusterFromClaim(claim) === activeClusterFilter : true,
  );
  const secondaryClaims = rawSecondaryClaims.filter((claim) =>
    activeClusterFilter ? inferClusterFromClaim(claim) === activeClusterFilter : true,
  );

  const metaChips = [
    { label: "Thema", value: presentation.topic?.label ?? "-" },
    { label: "Status", value: STATUS_LABELS[meta.status] ?? meta.status },
    { label: UI_DE.level, value: JURISDICTION_LABELS[meta.jurisdiction] ?? meta.jurisdiction },
    { label: UI_DE.municipalityRegion, value: meta.region ?? "-" },
    { label: "Zeitfenster", value: String(timeWindow) },
    { label: "Stand", value: formatDate(meta.updatedAt ?? meta.createdAt) },
  ];

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
      label: "Quellenlage",
      value: evidenceIndex,
      description: "Wie viele Aussagen sind mit Quellen verknüpft?",
    },
    {
      key: "klaerung",
      label: "Was ist noch offen?",
      value: clarificationIndex,
      description: "Welche Fragen sind noch offen oder in Bearbeitung?",
    },
    {
      key: "perspektiven",
      label: "Perspektivenabdeckung",
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
      <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
            Dossier (Demonstrationsfall)
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 font-semibold text-[rgb(var(--fg))]">
              Status: {legitimacyStatus.label}
            </span>
            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-[rgb(var(--muted))]">
              Ebene: {(JURISDICTION_LABELS as any)[meta.jurisdiction] ?? meta.jurisdiction}
            </span>
            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-[rgb(var(--muted))]">
              Region: {meta.region ?? presentation.topic?.municipality ?? "—"}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.24em] text-[rgb(var(--muted))]">Innenstadt-Dossier</p>
            <h1 className="headline-grad text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
              {dossier.meta.title}
            </h1>
          </div>
          <p className="max-w-3xl text-base leading-relaxed text-[rgb(var(--muted))]">
            {analyze.sourceText ?? "Fragestellung des Dossiers."} Warum jetzt? Das Thema hat direkte
            Auswirkungen auf Alltag, Zuständigkeiten und nächste Entscheidungen.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">Wirkungsniveau</p>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{heroImpact}</p>
            </div>
            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">Relevanz</p>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{heroRelevance}</p>
            </div>
            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">Budget</p>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{heroBudget}</p>
            </div>
            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">Abstimmungsmodus</p>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{heroParticipation}</p>
            </div>
          </div>
          <details className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
            <summary className="cursor-pointer font-semibold text-[rgb(var(--fg))]">Mehr Details</summary>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {metaChips.map((chip) => (
                <div key={`${chip.label}-${chip.value}`} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1.5">
                  <p className="uppercase tracking-wide text-[rgb(var(--muted))]">{chip.label}</p>
                  <p className="truncate font-semibold text-[rgb(var(--fg))]">{chip.value}</p>
                </div>
              ))}
            </div>
          </details>
        </div>
        <div className="flex h-full flex-col gap-4">
          {primaryOrigin ? (
            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-soft">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 shrink-0 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-2 text-[rgb(var(--fg))]">
                  {renderOriginIcon(primaryOrigin.kind, primaryOrigin.asset)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    Kommune/Region
                  </p>
                  <p className="truncate text-sm font-semibold text-[rgb(var(--fg))]">
                  {meta.region ?? presentation.topic?.municipality ?? primaryOrigin?.label ?? "—"}                  </p>
                  <p className="text-[11px] text-[rgb(var(--muted))]">{primaryOrigin.subtitle ?? "—"}</p>
                </div>
                <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  {meta.jurisdiction
                    ? (JURISDICTION_LABELS as any)[meta.jurisdiction] ?? meta.jurisdiction
                    : "Kommune"}
                </span>
              </div>

              {secondaryOrigins.length ? (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] uppercase tracking-wide text-[rgb(var(--muted))]">Initiatoren</p>
                  <div className="flex -space-x-2">
                    {secondaryOrigins.map((origin, idx) => (
                      <div
                        key={`${origin.kind}-${origin.label ?? idx}`}
                        title={`${origin.label ?? "—"}${origin.subtitle ? ` · ${origin.subtitle}` : ""}`}
                        className="h-8 w-8 overflow-hidden rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-1 text-[rgb(var(--fg))]"
                      >
                        {renderOriginIcon(origin.kind, origin.asset)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className={`rounded-xl border p-4 ${legitimacyStatus.tone === "positive" ? "border-teal-600/35 bg-teal-600/8" : legitimacyStatus.tone === "warning" ? "border-[rgb(var(--border))] bg-[rgb(var(--card))]" : "border-[rgb(var(--border))] bg-[rgb(var(--card))]"}`}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              Dokumentationsstand
            </p>
            <p className="text-sm font-semibold text-[rgb(var(--fg))]">{legitimacyStatus.label}</p>
            <p className="text-[11px] text-[rgb(var(--muted))]">{legitimacyStatus.text}</p>
          </div>
          <InstitutionalHeader dossierId={meta.id} viewerRole={viewerRole as any} inst={inst} />
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              Status & Protokoll
            </p>
            <div className="text-sm text-[rgb(var(--fg))]">{analysisMethodText}</div>
            <div className="text-[11px] text-[rgb(var(--muted))]">
              Sprache: {formatLanguage(analyze.language)}
            </div>
          </div>
          {canEditOrigins && orderedOrigins.length ? (
            <details className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-soft">
              <summary className="cursor-pointer select-none text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
                Initiatoren & Träger verwalten
              </summary>
              <div className="mt-3 space-y-3">
                <div className="relative mx-auto max-w-[420px] overflow-hidden">
                  <div
                    ref={carouselRef}
                    className="hide-scrollbar flex w-full snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-4 py-3"
                    aria-label="Initiatoren-Karussell"
                    style={{
                      WebkitMaskImage:
                        "linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%)",
                      maskImage:
                        "linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%)",
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
                      const offset = Math.round(curve * 12);
                      const scale = isActive ? 1.06 : distance === 1 ? 0.94 : 0.88;
                      const opacity = isActive ? 1 : distance === 1 ? 0.65 : 0.35;
                      return (
                        <div
                          key={`${origin.kind}-${origin.label ?? index}-${index}`}
                          data-carousel-index={index}
                          className={`relative snap-center rounded-2xl border bg-[rgb(var(--card))] px-4 py-4 text-center shadow-soft transition-transform duration-300 cursor-pointer ${
                            isActive
                              ? "min-w-[240px] border-[rgb(var(--grad-from))] ring-1 ring-[rgb(var(--grad-from))] ring-offset-0 z-10"
                              : "min-w-[190px] border-[rgb(var(--border))]"
                          }`}
                          style={{
                            transform: `translateY(${offset}px) scale(${scale})`,
                            opacity,
                          }}
                          onClick={(event) => {
                            const card = event.currentTarget;
                            card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                          }}
                        >
                          <div className={`mx-auto flex items-center justify-center rounded-full bg-[rgb(var(--bg))] text-[rgb(var(--fg))] ${isActive ? "h-20 w-20" : "h-16 w-16"}`}>
                            {renderOriginIcon(origin.kind, origin.asset)}
                          </div>
                          <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{origin.label ?? "—"}</p>
                          <p className="text-[11px] text-[rgb(var(--muted))]">{origin.subtitle ?? "—"}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <p className="text-[11px] text-[rgb(var(--muted))]">
                  Federführung: Verwaltung (falls übernommen). Danach: Community · Verbände/Vereine · Medien.
                </p>
              </div>
            </details>
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

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="vog-card p-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Warum jetzt?</p>
          <p className="text-sm text-[rgb(var(--fg))]">
            {topTakeaways[0] ?? "Die Debatte wirkt direkt auf Alltag, Ressourcen und nächste Entscheidungen."}
          </p>
        </article>
        <article className="vog-card p-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Was ist noch offen?</p>
          <p className="text-sm text-[rgb(var(--fg))]">
            {topOpenIssues[0] ?? "Offene Fragen und fehlende Quellen sind sichtbar markiert."}
          </p>
        </article>
        <article className="vog-card p-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Welche Folgen sind möglich?</p>
          <p className="text-sm text-[rgb(var(--fg))]">
            Varianten und mögliche Folgen werden im unteren Teil des Dossiers Schritt für Schritt gezeigt.
          </p>
        </article>
        <article className="vog-card p-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Wer kann handeln?</p>
          <p className="text-sm text-[rgb(var(--fg))]">
            {analyze.responsibilityPaths.length
              ? "Verantwortungswege sind benannt und je Aussage nachvollziehbar."
              : "Zuständigkeiten werden ergänzt, sobald belastbare Daten vorliegen."}
          </p>
        </article>
      </section>

      <section id="graph" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Quellenlage & Überblick
          </div>
          <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-[10px] text-[rgb(var(--muted))]">
            First-Screen Orientierung
          </span>
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

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="vog-card p-5 space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-[rgb(var(--fg))]">Was wir aktuell daraus mitnehmen</h2>
          <ul className="space-y-2 text-sm text-[rgb(var(--muted))]">
            {topTakeaways.map((item) => (
              <li key={item} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </article>
        <article className="vog-card p-5 space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-[rgb(var(--fg))]">Was offen bleibt</h2>
          <ul className="space-y-2 text-sm text-[rgb(var(--muted))]">
            {topOpenIssues.map((item) => (
              <li key={item} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section id="smart-sources" className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Quellenlage (Smart Source Cards)</div>
        {sourceClusters.length ? (
          <div className="space-y-3">
            {sourceClusters.map(([cluster, entries]) => (
              <details key={cluster} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4" open>
                <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
                  {SOURCE_CLUSTER_LABELS[cluster] ?? cluster} ({entries.length})
                </summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {entries.map((entry) => (
                    <article key={entry.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                      <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{entry.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                        <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[rgb(var(--muted))]">
                          {SOURCE_TYPE_LABELS[entry.sourceType ?? ""] ?? (entry.sourceType ?? "Quelle")}
                        </span>
                        <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[rgb(var(--muted))]">
                          Quellenstatus: {entry.evidenceStatus ?? "offen"}
                        </span>
                        <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[rgb(var(--muted))]">
                          Übertragbarkeit: {entry.transferability ?? "mittel"}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2 text-xs text-[rgb(var(--muted))]">
                        <p>
                          <span className="font-semibold text-[rgb(var(--fg))]">Nehmen wir daraus mit:</span>{" "}
                          {entry.takeaway ?? "Relevanter Kontextbaustein für die Abwägung."}
                        </p>
                        <p>
                          <span className="font-semibold text-[rgb(var(--fg))]">Nicht automatisch ableitbar:</span>{" "}
                          {entry.notAutomatic ?? "Keine direkte Übertragbarkeit ohne lokale Prüfung."}
                        </p>
                        <p>
                          <span className="font-semibold text-[rgb(var(--fg))]">Kritischer Caveat:</span>{" "}
                          {entry.criticalCaveat ?? "Lokaler Kontext kann die Aussage stark verändern."}
                        </p>
                        <p className="text-[10px]">
                          Quelle: {entry.source} · Raum: {entry.geography ?? "-"} · Zeitraum: {entry.period ?? "-"}
                        </p>
                      </div>
                      {entry.canonicalUrl ? (
                        <a
                          href={entry.canonicalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-block text-xs text-[rgb(var(--grad-from))] underline"
                        >
                          Quelle öffnen
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[rgb(var(--muted))]">Keine strukturierte Quellenmatrix hinterlegt.</p>
        )}
      </section>

      <section id="zahlen-audit" className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Zahlen-Audit</div>
        <div className="grid gap-3 md:grid-cols-2">
          {zahlenAuditEntries.map((entry) => (
            <article key={entry.metric} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 space-y-2">
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{entry.metric}</h3>
              <p className="text-xs text-[rgb(var(--muted))]">Quelle: {entry.source}</p>
              <p className="text-xs text-[rgb(var(--muted))]">
                Gemessen: {entry.measured}
              </p>
              <p className="text-xs text-[rgb(var(--muted))]">
                Grundgesamtheit: {entry.denominator}
              </p>
              <p className="text-xs text-[rgb(var(--muted))]">
                Raum/Zeit: {entry.geography} · {entry.period}
              </p>
              <p className="text-xs text-[rgb(var(--muted))]">
                Methode: {entry.method}
              </p>
              {entry.controlGroup ? (
                <p className="text-xs text-[rgb(var(--muted))]">Kontrolllogik: {entry.controlGroup}</p>
              ) : null}
              <p className="text-xs text-[rgb(var(--muted))]">
                Caveat: {entry.transferabilityCaveat}
              </p>
              <div className="text-[11px] font-semibold text-[rgb(var(--fg))]">
                Quellenstatus: {entry.evidenceStatus}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="beteiligungs-audit" className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Beteiligungs-Audit</div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 space-y-3">
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">
            Beteiligungsqualität: {beteiligungsAuditData?.score?.level ?? "offen"}
          </p>
          {beteiligungsAuditData?.score?.rationale ? (
            <p className="text-xs text-[rgb(var(--muted))]">{beteiligungsAuditData.score.rationale}</p>
          ) : null}
          <ul className="grid gap-2 text-xs text-[rgb(var(--muted))] md:grid-cols-2">
            {(beteiligungsAuditData?.auditQuestions ?? []).map((item) => (
              <li key={item} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs font-semibold text-[rgb(var(--fg))]">
            {beteiligungsAuditData?.mandateRule ?? "Mandatsfähigkeit bleibt zu prüfen."}
          </p>
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
        disableCreateLinks={hideExternalCreateLinks}
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
            onSave={() => {
              if (!privacyGate.ensureActiveProcessingAllowed("dossier-vote")) return;
              void saveSelection();
            }}
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
      <section className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Beitrags- und Rollenhinweise
        </div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm text-[rgb(var(--muted))] space-y-2">
          <p>
            {contributionPolicy?.publicContributionLanguage ??
              "Menschen, Organisationen und verantwortliche Personen können öffentlich beitragen."}
          </p>
          <p>
            {contributionPolicy?.citizenVotesSeparatedFromOrganizationPositions === false
              ? "Abstimmungs- und Rollenlogik wird geprüft."
              : "Öffentliche Bürgerabstimmungen bleiben getrennt von Organisationspositionen."}
          </p>
          {contributionPolicy?.hostedRoomVisibility === "closed_hosted" ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800">
              {contributionPolicy.hostedRoomLabel ??
                "Geschlossener Hosted Room: Ergebnisse gelten nur für den definierten Teilnehmerkreis."}
            </p>
          ) : null}
          <p>
            {contributionPolicy?.hostedRoomPublicOpinionNote ??
              "Ergebnisse aus geschlossenen Hosted Rooms werden nicht als allgemeines öffentliches Meinungsbild dargestellt."}
          </p>
          <p>
            {contributionPolicy?.closedRoomProcessingNote ??
              "Eingaben aus geschlossenen Räumen fließen als Fragen, Claims, Quellen, Varianten, Argumente und offene Punkte in die Dossier-Verarbeitung."}
          </p>
          <p>
            {contributionPolicy?.confidentialHintNote ??
              "Vertrauliche Hinweise werden intern geprüft und nicht automatisch an eine hostende Organisation weitergeleitet."}
          </p>
          <p className="text-xs">
            {contributionPolicy?.noWhistleblowerPromise ??
              "Hinweis: Keine Überzusage zum Whistleblower-Schutz. Für rechtlich sensible Meldungen bitte gesicherte Beratungswege nutzen."}
          </p>
        </div>
      </section>
    </>
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
      <section id="clusters" className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.clusters}
        </div>
        <div className="h-1 w-12 rounded-full bg-brand-grad opacity-70" />
        {clusters.length ? (
          <div className="flex flex-wrap gap-2 text-[11px] text-[rgb(var(--muted))]">
            {clusters.map((cluster) => (
              <button
                key={cluster.label}
                type="button"
                aria-pressed={activeClusterFilter === cluster.label}
                onClick={() =>
                  setActiveClusterFilter((prev) => (prev === cluster.label ? null : cluster.label))
                }
                className={`vog-chip ${
                  activeClusterFilter === cluster.label
                    ? "vog-chip--active"
                    : ""
                }`}
              >
                {cluster.label} ({cluster.count})
              </button>
            ))}
            {activeClusterFilter ? (
              <button
                type="button"
                onClick={() => setActiveClusterFilter(null)}
                className="vog-chip border-[rgb(var(--border))] bg-[rgb(var(--card))]"
              >
                Filter zurücksetzen
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[rgb(var(--muted))]">Keine Cluster hinterlegt.</p>
        )}
        {activeClusterFilter ? (
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
            Aktiver Fokus:{" "}
            <span className="font-semibold text-[rgb(var(--fg))]">{activeClusterFilter}</span>. Die
            Kernaussagen und Teilaspekte werden auf diesen Cluster gefiltert.
          </div>
        ) : (
          <p className="text-xs text-[rgb(var(--muted))]">
            Kein Clusterfilter aktiv. Alle Kernaussagen und Teilaspekte werden angezeigt.
          </p>
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
                  <span className="vog-chip">
                    Quellenlage: {claimEvidenceCount(claim.id)} Quelle
                    {claimEvidenceCount(claim.id) === 1 ? "" : "n"}
                  </span>
                  <span className="vog-chip">Prüfstatus: {claimReviewStatus(claim.id)}</span>
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
                {isFactLikeClaim(claim) && claimEvidenceCount(claim.id) === 0 ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Faktische Aussage ohne belastbaren Quellennachweis: vor prominenter Nutzung zuerst Quellenlage/Factcheck-Status ergänzen.
                  </p>
                ) : null}
                <div>
                  <p className="text-base font-semibold text-[rgb(var(--fg))]">{claim.title ?? "Kernaussage"}</p>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{claim.text}</p>
                </div>
              </article>
            ))}
            {coreClaims.length === 0 ? (
              <p className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--muted))]">
                Keine Kernaussagen für den aktiven Clusterfilter.
              </p>
            ) : null}
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
                  <span className="vog-chip">
                    Quellenlage: {claimEvidenceCount(claim.id)} Quelle
                    {claimEvidenceCount(claim.id) === 1 ? "" : "n"}
                  </span>
                  <span className="vog-chip">Prüfstatus: {claimReviewStatus(claim.id)}</span>
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
                {isFactLikeClaim(claim) && claimEvidenceCount(claim.id) === 0 ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Faktische Aussage ohne belastbaren Quellennachweis: vor prominenter Nutzung zuerst Quellenlage/Factcheck-Status ergänzen.
                  </p>
                ) : null}
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{claim.title ?? "Kernaussage"}</p>
                <p className="text-sm text-[rgb(var(--muted))]">{claim.text}</p>
              </article>
            ))}
            {secondaryClaims.length === 0 ? (
              <p className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--muted))]">
                Keine Teilaspekte für den aktiven Clusterfilter.
              </p>
            ) : null}
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
            Transparenzhinweis: Die Empfehlung basiert auf Quellenlage, offenen Punkten, Perspektiven und Zuständigkeiten.
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
      <section id="akte" className="vog-card p-5 space-y-2">
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
        sectionId="transparenz"
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
          Quellenlage-Überblick
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
      <section id="fragen" className="vog-card p-5 space-y-3">
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
            const answeredByName = (q as { answeredByName?: string }).answeredByName;
            const answeredByRole = (q as { answeredByRole?: string }).answeredByRole;
            const answeredByKind = (q as { answeredByKind?: string }).answeredByKind;
            const sourceNote = (q as { sourceNote?: string }).sourceNote;
            const delegation = delegationByQuestionId.get(q.id);
            const delegationStatus = delegation?.status as string | undefined;
            const delegatedTo = delegation?.delegatedTo as string | undefined;
            const delegatedLevel = delegation?.level as string | undefined;
            const delegatedAt = delegation?.requestedAt as string | undefined;
            const coordination = isOrganizationLikeLabel(responsible)
              ? "Organisation/Fachstelle"
              : responsible
                ? "Benannte Person / Community"
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
                  {status === "beantwortet" || status === "answered" ? (
                    answeredByName ? (
                      <p className="text-[11px] text-[rgb(var(--muted))]">
                        Antwort durch: {answeredByName}
                        {answeredByRole ? ` (${answeredByRole})` : ""}
                        {answeredByKind === "organization"
                          ? " · Hinweis: Antworten müssen als benannte verantwortliche Person geführt werden."
                          : ""}
                      </p>
                    ) : (
                      <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
                        Für Bürgerfragen fehlt eine benannte verantwortliche Person in der Antwortdokumentation.
                      </p>
                    )
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
          Antworten stammen aus benannten verantwortlichen Personen, Fachstellen, Gutachten oder lokalen Quellen. Anfragen werden durch die Plattform koordiniert und dokumentiert.
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
                if (!privacyGate.ensureActiveProcessingAllowed("dossier-clarification")) return;
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
      afterLeft={afterLeft}
      afterSidebar={afterSidebar}
    />
  );
}

export default DossierViewer;
