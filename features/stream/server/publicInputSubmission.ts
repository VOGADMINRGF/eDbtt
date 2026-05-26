import { parseRegionKey } from "@core/regions/types";
import {
  NEEDS_REGION_REVIEW_REGION_ID,
  inferParticipationRegionAssignment,
  listOperationalRegions,
  parseRegionParticipationSignal,
  type Region,
  type RegionParticipationPrivacyMode,
  type RegionParticipationSignal,
  type RegionParticipationSignalSourceType,
} from "@features/region";
import type {
  StreamPublicInputContext,
  StreamPublicInputKind,
  StreamPublicInputPayload,
} from "../publicInput";
import { streamPublicInputKindLabel } from "../publicInput";

function compactWhitespace(value: string): string {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function truncate(value: string, max: number): string {
  const normalized = compactWhitespace(value);
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function looksLikeQuestion(value: string): boolean {
  const normalized = compactWhitespace(value).toLowerCase();
  return (
    normalized.includes("?") ||
    /^(wer|wie|wann|warum|wieso|welche|welcher|welches|was)\b/.test(normalized)
  );
}

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((entry) => compactWhitespace(entry ?? "")).filter(Boolean)),
  );
}

function deriveRegionHint(context: StreamPublicInputContext, regions: Region[]): string | null {
  const parsedRegionKey = parseRegionKey(context.regionCode ?? "");
  const candidateHints = uniqueNonEmpty([
    context.regionCode,
    parsedRegionKey?.municipalityCode
      ? `${parsedRegionKey.countryCode}:${parsedRegionKey.subRegionCode ?? ""}:${parsedRegionKey.municipalityCode}`
      : null,
    parsedRegionKey?.municipalityCode ?? null,
    parsedRegionKey?.subRegionCode ?? null,
    context.anlassraumTitle,
    context.title,
  ]);

  for (const hint of candidateHints) {
    const assignment = inferParticipationRegionAssignment({
      text: hint,
      explicitRegionHint: hint,
      regions,
    });
    if (assignment.regionId && !assignment.needsRegionReview) return hint;
  }

  return candidateHints[0] ?? null;
}

function mapInputKindToSourceType(
  kind: StreamPublicInputKind,
  text: string,
  sourceUrl?: string | null,
): RegionParticipationSignalSourceType {
  if (kind === "question") return "public_question";
  if (kind === "source_hint") return "public_source_hint";
  if (kind === "option") return "public_claim";
  if (kind === "support") return "support_signal";
  if (kind === "correction" && sourceUrl) return "public_source_hint";
  if (looksLikeQuestion(text)) return "public_question";
  return "public_contribution";
}

function privacyModeFromSourceType(
  sourceType: RegionParticipationSignalSourceType,
): RegionParticipationPrivacyMode {
  if (sourceType === "public_source_hint") return "review_restricted";
  return "no_personal_data";
}

function buildSignalTitle(
  kind: StreamPublicInputKind,
  context: StreamPublicInputContext,
  text: string,
): string {
  const preview = truncate(text, 96);
  if (kind === "question") {
    return looksLikeQuestion(preview) ? preview : `Frage zu ${context.title}`;
  }
  if (kind === "source_hint") return `Quellenhinweis zu ${context.title}`;
  if (kind === "perspective") return `Perspektive zu ${context.title}`;
  if (kind === "option") return `Option zu ${context.title}`;
  if (kind === "concern") return `Bedenken zu ${context.title}`;
  if (kind === "correction") return `Korrekturhinweis zu ${context.title}`;
  if (kind === "support") return `Unterstützungssignal zu ${context.title}`;
  return preview || `Hinweis zu ${context.title}`;
}

function buildSignalSummary(params: {
  text: string;
  sourceUrl?: string | null;
}): string {
  const body = truncate(params.text, 720);
  const url = compactWhitespace(params.sourceUrl ?? "");
  if (!url) return body;
  return truncate(`${body} Quelle: ${url}`, 720);
}

function deriveTopics(params: {
  kind: StreamPublicInputKind;
  context: StreamPublicInputContext;
  text: string;
}): string[] {
  return uniqueNonEmpty([
    streamPublicInputKindLabel(params.kind),
    params.context.topicKey,
    params.context.title,
    ...compactWhitespace(params.text)
      .split(/[.!?]/)
      .slice(0, 1),
  ]).slice(0, 4);
}

export async function buildStreamParticipationSignal(params: {
  payload: StreamPublicInputPayload;
  context: StreamPublicInputContext;
  id: string;
}): Promise<RegionParticipationSignal> {
  const text = compactWhitespace(params.payload.text);
  const sourceUrl = compactWhitespace(params.payload.sourceUrl ?? "") || null;
  const regions = await listOperationalRegions();
  const explicitRegionHint = deriveRegionHint(params.context, regions);
  const sourceType = mapInputKindToSourceType(
    params.payload.kind,
    text,
    sourceUrl,
  );
  const assignment = inferParticipationRegionAssignment({
    text: [
      params.context.title,
      params.context.summary ?? "",
      params.context.anlassraumTitle ?? "",
      params.context.regionCode ?? "",
      text,
    ].join(" "),
    explicitRegionHint,
    detectedPlaces: uniqueNonEmpty([params.context.anlassraumTitle, params.context.title]),
    regions,
  });
  const reviewStatus = assignment.regionId ? "needs_review" : "needs_region_review";

  return parseRegionParticipationSignal({
    id: params.id,
    regionId: assignment.regionId ?? NEEDS_REGION_REVIEW_REGION_ID,
    sourceClass: "participation",
    sourceType,
    title: buildSignalTitle(params.payload.kind, params.context, text),
    summary: buildSignalSummary({
      text,
      sourceUrl,
    }),
    relatedClaimIds: [],
    relatedContributionIds: [],
    relatedStatementIds: [],
    relatedDossierIds: params.context.dossierId ? [params.context.dossierId] : [],
    relatedAnlassraumIds: params.context.anlassraumId ? [params.context.anlassraumId] : [],
    detectedTopics: deriveTopics({
      kind: params.payload.kind,
      context: params.context,
      text,
    }),
    detectedPlaces: assignment.matchedPlaces,
    matchedPlaces: assignment.matchedPlaces,
    matchedRegionIds: assignment.matchedRegionIds,
    needsRegionReview: assignment.needsRegionReview,
    aggregationMode: "single_review_item",
    privacyMode: privacyModeFromSourceType(sourceType),
    reviewStatus,
    confidence: assignment.regionId ? 0.67 : 0.31,
    source: {
      sourceKind: "runtime",
      sourceCollection: "stream_public_inputs",
      sourceRefId: params.id,
      isFixture: false,
      isPilotFixture: false,
      notRealNews: false,
      notProductionData: false,
      notOfficial: true,
      notRepresentative: true,
    },
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  });
}
