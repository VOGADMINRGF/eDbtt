import type {
  FactcheckAuditEvent,
  FactcheckAuditEventType,
  FactcheckResearchMode,
  FactcheckSealDecision,
  FactcheckSealEligibility,
  FactcheckSourceRef,
  FactcheckStatus,
  FactcheckVerificationMode,
} from "./db";
import type {
  ResearchUsed,
  VerificationMode,
} from "@features/ai/e150/verificationContract";

const URL_PATTERN = /https?:\/\/[^\s<>"')]+/gi;

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function classifySourceType(url: string): FactcheckSourceRef["sourceType"] {
  const normalized = url.toLowerCase();
  if (
    normalized.includes("youtube.com/") ||
    normalized.includes("youtu.be/") ||
    normalized.includes("vimeo.com/")
  ) {
    return "youtube_video_url";
  }
  if (normalized.endsWith(".pdf")) return "document_url";
  return "link";
}

export function extractSourceRefsFromText(text: string): FactcheckSourceRef[] {
  const urls = String(text ?? "").match(URL_PATTERN) ?? [];
  return uniqueNonEmpty(urls).map((url, index) => ({
    id: `source-${index + 1}`,
    label: url,
    url,
    sourceType: classifySourceType(url),
  }));
}

export function deriveFactcheckResearchMode(input: {
  requestedDeepResearch: boolean;
  requestedProviderRun?: boolean;
}): FactcheckResearchMode {
  if (input.requestedDeepResearch) return "deep_research_requested";
  if (input.requestedProviderRun) return "provider_assisted";
  return "none";
}

export function deriveFactcheckVerificationMode(input: {
  status: FactcheckStatus;
  researchMode: FactcheckResearchMode;
  hasSourceRefs: boolean;
  sealDecision: FactcheckSealDecision;
}): FactcheckVerificationMode {
  if (input.sealDecision === "granted" || input.status === "sealed") return "sealed";
  if (input.status === "completed" || input.status === "needs_manual_review") {
    if (
      input.researchMode === "provider_assisted" ||
      input.researchMode === "deep_research_approved"
    ) {
      return "provider_assisted";
    }
    if (input.hasSourceRefs) return "operator_verified";
    return "manual_review";
  }
  if (
    input.status === "requested" ||
    input.status === "queued" ||
    input.status === "running"
  ) {
    return input.hasSourceRefs ? "manual_review" : "intake_only";
  }
  if (input.status === "seal_review_required") return "operator_verified";
  return input.hasSourceRefs ? "manual_review" : "intake_only";
}

export function deriveFactcheckSealEligibility(input: {
  status: FactcheckStatus;
  hasSourceRefs: boolean;
  hasClaims: boolean;
}): FactcheckSealEligibility {
  if (!input.hasClaims || !input.hasSourceRefs) return "not_eligible";
  if (
    input.status === "completed" ||
    input.status === "needs_manual_review" ||
    input.status === "seal_review_required" ||
    input.status === "sealed"
  ) {
    return "eligible";
  }
  if (input.status === "not_seal_eligible") return "not_eligible";
  return "needs_review";
}

export function factcheckVerificationModeToCompatibilityMode(
  mode: FactcheckVerificationMode,
): VerificationMode {
  switch (mode) {
    case "sealed":
      return "sealed";
    case "manual_review":
    case "provider_assisted":
    case "operator_verified":
      return "precheck";
    case "intake_only":
    case "none":
    default:
      return "none";
  }
}

export function factcheckResearchModeToCompatibilityResearchUsed(
  mode: FactcheckResearchMode,
): ResearchUsed {
  switch (mode) {
    case "light_metadata":
      return "lite";
    case "provider_assisted":
      return "search";
    case "deep_research_requested":
    case "deep_research_approved":
      return "deep_search";
    case "manual_review":
      return "lite";
    case "none":
    default:
      return "none";
  }
}

export function factcheckStatusLabel(status: FactcheckStatus): string {
  switch (status) {
    case "draft":
      return "Entwurf";
    case "requested":
      return "Prüfung angefragt";
    case "queued":
      return "Quellenprüfung angefragt";
    case "provider_review_required":
      return "Provider-Freigabe erforderlich";
    case "running":
      return "Quellenprüfung läuft";
    case "needs_source":
      return "Quellen fehlen";
    case "completed":
      return "Ergebnis liegt vor";
    case "failed":
      return "Prüfung fehlgeschlagen / erneut prüfen";
    case "cancelled":
      return "Abgebrochen";
    case "needs_manual_review":
      return "Manuelle Prüfung erforderlich";
    case "rejected":
      return "Abgelehnt";
    case "seal_review_required":
      return "Siegelprüfung erforderlich";
    case "sealed":
      return "Versiegelt";
    case "not_seal_eligible":
      return "Nicht siegelfähig";
    case "archived":
      return "Archiviert";
    default:
      return status;
  }
}

export function factcheckSealDecisionLabel(decision: FactcheckSealDecision): string {
  switch (decision) {
    case "requested":
      return "Siegelprüfung angefragt";
    case "granted":
      return "Siegel erteilt";
    case "revoked":
      return "Siegel widerrufen";
    case "none":
    default:
      return "Kein Siegel";
  }
}

export function factcheckLimitationsForRequest(input: {
  sourceRefs: FactcheckSourceRef[];
  researchMode: FactcheckResearchMode;
}): string[] {
  const limitations = [
    "Kein automatischer DeepSearch-Lauf.",
    "Kein automatischer kostenpflichtiger Provider-Lauf.",
    "Kein automatisches Siegel und kein Auto-Publish.",
  ];
  if (input.sourceRefs.length === 0) {
    limitations.push("Für eine belastbare Prüfung fehlen noch überprüfbare Quellenhinweise.");
  }
  if (input.researchMode === "provider_assisted") {
    limitations.push("Provider-gestützte Recherche braucht eine explizite Betreiberfreigabe.");
  }
  if (input.researchMode === "deep_research_requested") {
    limitations.push("Deep Research wurde nur angefragt und noch nicht freigegeben.");
  }
  return limitations;
}

export function createFactcheckAuditEvent(input: {
  eventType: FactcheckAuditEventType;
  actorId: string;
  actorLabel: string;
  actorMode: FactcheckAuditEvent["actorMode"];
  note?: string | null;
  createdAt?: string;
}): FactcheckAuditEvent {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const eventKey = `${input.eventType}_${input.actorId}_${createdAt}_${input.note ?? ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 48);
  return {
    id: `factcheck_audit_${eventKey || "event"}`,
    eventType: input.eventType,
    actorId: input.actorId,
    actorLabel: input.actorLabel,
    actorMode: input.actorMode,
    note: input.note?.trim() || null,
    createdAt,
  };
}
