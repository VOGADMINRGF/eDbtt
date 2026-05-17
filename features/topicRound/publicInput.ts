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
import { z } from "zod";

export const PUBLIC_ANLASSRAUM_INPUT_KINDS = [
  "frage",
  "quelle",
  "perspektive",
  "option",
  "hinweis",
] as const;

export type PublicAnlassraumInputKind =
  (typeof PUBLIC_ANLASSRAUM_INPUT_KINDS)[number];

export const PublicAnlassraumInputPayloadSchema = z
  .object({
    anlassraumId: z.string().trim().regex(/^[a-f0-9]{24}$/i),
    kind: z.enum(PUBLIC_ANLASSRAUM_INPUT_KINDS),
    text: z.string().trim().min(8).max(2400),
    sourceUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  })
  .strict();

export type PublicAnlassraumInputPayload = z.infer<
  typeof PublicAnlassraumInputPayloadSchema
>;

export type PublicAnlassraumInputRoomContext = {
  anlassraumId: string;
  title: string;
  summary: string | null;
  isPublic: boolean;
  regionKey?: string | null;
};

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

function looksLikeSourceHint(value: string): boolean {
  const normalized = compactWhitespace(value).toLowerCase();
  return /quelle|quellen|beleg|belege|nachweis|nachweise|https?:\/\//.test(
    normalized,
  );
}

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((entry) => compactWhitespace(entry ?? "")).filter(Boolean)),
  );
}

function deriveRoomRegionHint(
  room: PublicAnlassraumInputRoomContext,
  regions: Region[],
): string | null {
  const parsedRegionKey = parseRegionKey(room.regionKey ?? "");
  const candidateHints = uniqueNonEmpty([
    room.regionKey,
    parsedRegionKey?.municipalityCode
      ? `${parsedRegionKey.countryCode}:${parsedRegionKey.subRegionCode ?? ""}:${parsedRegionKey.municipalityCode}`
      : null,
    parsedRegionKey?.municipalityCode ?? null,
    parsedRegionKey?.subRegionCode ?? null,
    room.title,
  ]);

  for (const hint of candidateHints) {
    const assignment = inferParticipationRegionAssignment({
      text: hint,
      explicitRegionHint: hint,
      regions,
    });
    if (assignment.regionId && !assignment.needsRegionReview) {
      return hint;
    }
  }

  return candidateHints[0] ?? null;
}

function mapInputKindToSourceType(
  kind: PublicAnlassraumInputKind,
  text: string,
  sourceUrl?: string | null,
): RegionParticipationSignalSourceType {
  if (kind === "frage") return "public_question";
  if (kind === "quelle") return "public_source_hint";
  if (kind === "perspektive") return "public_contribution";
  if (kind === "option") return "public_claim";
  if (sourceUrl || looksLikeSourceHint(text)) return "public_source_hint";
  if (looksLikeQuestion(text)) return "public_question";
  return "public_contribution";
}

function privacyModeFromSourceType(
  sourceType: RegionParticipationSignalSourceType,
): RegionParticipationPrivacyMode {
  if (sourceType === "public_source_hint") return "review_restricted";
  return "no_personal_data";
}

function labelForInputKind(kind: PublicAnlassraumInputKind): string {
  switch (kind) {
    case "frage":
      return "Frage";
    case "quelle":
      return "Quelle";
    case "perspektive":
      return "Perspektive";
    case "option":
      return "Option";
    case "hinweis":
      return "Hinweis";
  }
}

function buildSignalTitle(
  kind: PublicAnlassraumInputKind,
  roomTitle: string,
  text: string,
): string {
  const preview = truncate(text, 96);
  if (kind === "frage") {
    return looksLikeQuestion(preview) ? preview : `Frage zu ${roomTitle}`;
  }
  if (kind === "quelle") return `Quellenhinweis zu ${roomTitle}`;
  if (kind === "perspektive") return `Perspektive zu ${roomTitle}`;
  if (kind === "option") return `Option zu ${roomTitle}`;
  return preview || `Hinweis zu ${roomTitle}`;
}

function buildSignalSummary(params: {
  kind: PublicAnlassraumInputKind;
  roomTitle: string;
  text: string;
  sourceUrl?: string | null;
}): string {
  const body = truncate(params.text, 720);
  const url = compactWhitespace(params.sourceUrl ?? "");
  if (!url) return body;
  return truncate(`${body} Quelle: ${url}`, 720);
}

function deriveTopics(params: {
  kind: PublicAnlassraumInputKind;
  room: PublicAnlassraumInputRoomContext;
  text: string;
}): string[] {
  return uniqueNonEmpty([
    labelForInputKind(params.kind),
    params.room.title,
    ...compactWhitespace(params.text)
      .split(/[.!?]/)
      .slice(0, 1),
  ]).slice(0, 3);
}

export async function buildPublicAnlassraumParticipationSignal(params: {
  payload: PublicAnlassraumInputPayload;
  room: PublicAnlassraumInputRoomContext;
  id: string;
}): Promise<RegionParticipationSignal> {
  const text = compactWhitespace(params.payload.text);
  const sourceUrl = compactWhitespace(params.payload.sourceUrl ?? "") || null;
  const regions = await listOperationalRegions();
  const explicitRegionHint = deriveRoomRegionHint(params.room, regions);
  const sourceType = mapInputKindToSourceType(
    params.payload.kind,
    text,
    sourceUrl,
  );
  const assignment = inferParticipationRegionAssignment({
    text: [params.room.title, params.room.summary ?? "", text].join(" "),
    explicitRegionHint,
    detectedPlaces: uniqueNonEmpty([params.room.title]),
    regions,
  });
  const reviewStatus = assignment.regionId
    ? "needs_review"
    : "needs_region_review";

  return parseRegionParticipationSignal({
    id: params.id,
    regionId: assignment.regionId ?? NEEDS_REGION_REVIEW_REGION_ID,
    sourceClass: "participation",
    sourceType,
    title: buildSignalTitle(params.payload.kind, params.room.title, text),
    summary: buildSignalSummary({
      kind: params.payload.kind,
      roomTitle: params.room.title,
      text,
      sourceUrl,
    }),
    relatedClaimIds: [],
    relatedContributionIds: [],
    relatedStatementIds: [],
    relatedDossierIds: [],
    relatedAnlassraumIds: [params.room.anlassraumId],
    detectedTopics: deriveTopics({
      kind: params.payload.kind,
      room: params.room,
      text,
    }),
    detectedPlaces: assignment.matchedPlaces,
    matchedPlaces: assignment.matchedPlaces,
    matchedRegionIds: assignment.matchedRegionIds,
    needsRegionReview: assignment.needsRegionReview,
    aggregationMode: "single_review_item",
    privacyMode: privacyModeFromSourceType(sourceType),
    reviewStatus,
    confidence: assignment.regionId ? 0.66 : 0.29,
    source: {
      sourceKind: "runtime",
      sourceCollection: "anlassraum_public_inputs",
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
