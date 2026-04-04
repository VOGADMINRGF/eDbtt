import { z } from "zod";
import { resolveShareReadyAssetContract } from "@features/anlassraum/shareReadyAssetContract";
import { preferredPathFromDraftState, type SignalToAnlassraumPath } from "@features/feeds/signalDecisioning";

const FeedAnlassraumSurfaceCompositionSchema = z
  .object({
    anlass: z
      .object({
        hasExistingContext: z.boolean(),
        title: z.string().trim().min(1).max(180),
        summary: z.string().trim().min(1).max(500).nullable(),
        anlassraumType: z.string().trim().min(1).max(80).nullable(),
        scope: z.string().trim().min(1).max(80).nullable(),
        regionCode: z.string().trim().min(1).max(20).nullable(),
        status: z.string().trim().min(1).max(80).nullable(),
        maturity: z.string().trim().min(1).max(80).nullable(),
      })
      .strict(),
    anlassgeber: z
      .object({
        sourcePipeline: z.string().trim().min(1).max(120).nullable(),
        sourceUrl: z.string().trim().min(1).max(600).nullable(),
        feedReviewState: z.string().trim().min(1).max(80).nullable(),
        signalPathHint: z.enum([
          "ignore",
          "attach_to_existing_anlassraum",
          "create_anlassraum_candidate",
          "manual_fast_path_via_create",
        ]),
        originType: z.string().trim().min(1).max(80).nullable(),
        sourceMode: z.string().trim().min(1).max(80).nullable(),
        sourceAnchorContext: z.boolean(),
      })
      .strict(),
    beteiligteKontexte: z
      .object({
        labels: z.array(z.string().trim().min(1).max(120)).max(16),
        hasAssociationContext: z.boolean(),
        hasInitiativeContext: z.boolean(),
        hasOrganizationContext: z.boolean(),
        hasEditorialPublisherContext: z.boolean(),
        hasExpertVoiceContext: z.boolean(),
        hasCivicCreatorContext: z.boolean(),
      })
      .strict(),
    anschlussflaechen: z
      .object({
        canonicalPublicTarget: z.string().trim().min(1).max(600),
        qrTarget: z.string().trim().min(1).max(600),
        anlassTarget: z.string().trim().min(1).max(600).nullable(),
        roundOperatingTarget: z.string().trim().min(1).max(600).nullable(),
        roundResultsTarget: z.string().trim().min(1).max(600).nullable(),
        dossierTarget: z.string().trim().min(1).max(600).nullable(),
        companionTarget: z.string().trim().min(1).max(600).nullable(),
      })
      .strict(),
    andockhinweise: z
      .object({
        existingContextExists: z.boolean(),
        pathHint: z.enum([
          "ignore",
          "attach_to_existing_anlassraum",
          "create_anlassraum_candidate",
          "manual_fast_path_via_create",
        ]),
        contextSuggestionHint: z.string().trim().min(1).max(280).nullable(),
        optionalFactcheckHint: z.boolean(),
        nonBlockingHint: z.literal(true),
      })
      .strict(),
    guardrails: z
      .object({
        feedIsSignalSourceOnly: z.literal(true),
        noAutoPublish: z.literal(true),
        noTruthPrivilegeFromContext: z.literal(true),
        noPriorityPrivilegeFromContext: z.literal(true),
        noVotingPrivilegeFromContext: z.literal(true),
        keepsTopicRegionSeparated: z.literal(true),
        keepsDossierAsUpperContext: z.literal(true),
        keepsRoundAsProcessContext: z.literal(true),
        keepsCompanionAsFormatContext: z.literal(true),
      })
      .strict(),
  })
  .strict();

export type FeedAnlassraumSurfaceComposition = z.infer<
  typeof FeedAnlassraumSurfaceCompositionSchema
>;

type ResolveFeedAnlassraumSurfaceCompositionInput = {
  draftTitle: string;
  draftSummary?: string | null;
  draftStatus?: string | null;
  feedReviewState?: string | null;
  weakSignalFlagged?: boolean;
  sourceUrl?: string | null;
  sourcePipeline?: string | null;
  anlassraumId?: string | null;
  anlassraumType?: string | null;
  anlassraumScope?: string | null;
  regionCode?: string | null;
  anlassraumStatus?: string | null;
  anlassraumMaturity?: string | null;
  ownerType?: string | null;
  roomType?: string | null;
  originType?: string | null;
  sourceMode?: string | null;
  dossierId?: string | null;
  publishTarget?: string | null;
  factcheckSuggested?: boolean;
};

function normalize(value: unknown): string | null {
  const out = typeof value === "string" ? value.trim() : "";
  return out ? out : null;
}

function dedupe(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((v) => String(v || "").trim()).filter(Boolean)));
}

function resolveContextLabels(input: {
  ownerType: string | null;
  roomType: string | null;
  sourceMode: string | null;
  originType: string | null;
}): string[] {
  const labels: string[] = [];
  const owner = input.ownerType;
  const roomType = input.roomType;
  const sourceMode = input.sourceMode;
  const originType = input.originType;

  if (owner === "association") labels.push("verein_oder_verband");
  if (owner === "initiative" || owner === "community") labels.push("initiative_oder_civic");
  if (
    owner === "organization" ||
    owner === "company" ||
    owner === "municipality" ||
    owner === "government" ||
    owner === "ngo"
  ) {
    labels.push("organisation_oder_institution");
  }
  if (owner === "media" || owner === "editorial" || roomType === "editorial") {
    labels.push("redaktion_publisher_team");
  }
  if (originType === "official" || sourceMode === "single_source") {
    labels.push("fachstimme_oder_expertenhinweis");
  }
  if (sourceMode === "feed" || sourceMode === "cluster") {
    labels.push("feed_signal_kontext");
  }

  return dedupe(labels);
}

function boolFromLabel(labels: readonly string[], needle: string): boolean {
  return labels.includes(needle);
}

function resolveSignalPathHint(input: {
  anlassraumId: string | null;
  weakSignalFlagged: boolean;
  feedReviewState: string | null;
}): SignalToAnlassraumPath {
  return preferredPathFromDraftState({
    anlassraumId: input.anlassraumId,
    weakSignalFlagged: input.weakSignalFlagged,
    feedReviewState: input.feedReviewState,
  });
}

export function resolveFeedAnlassraumSurfaceComposition(
  input: ResolveFeedAnlassraumSurfaceCompositionInput,
): FeedAnlassraumSurfaceComposition {
  const title = normalize(input.draftTitle) ?? "Signal-Anlass";
  const summary = normalize(input.draftSummary);
  const anlassraumId = normalize(input.anlassraumId);
  const ownerType = normalize(input.ownerType);
  const roomType = normalize(input.roomType);
  const sourceMode = normalize(input.sourceMode);
  const originType = normalize(input.originType);
  const feedReviewState = normalize(input.feedReviewState);
  const weakSignalFlagged = input.weakSignalFlagged === true;
  const signalPathHint = resolveSignalPathHint({
    anlassraumId,
    weakSignalFlagged,
    feedReviewState,
  });

  const labels = resolveContextLabels({
    ownerType,
    roomType,
    sourceMode,
    originType,
  });

  const shareReady = resolveShareReadyAssetContract({
    anlassraumId,
    publishTarget: normalize(input.publishTarget),
    dossierId: normalize(input.dossierId),
    title,
    summary,
    lifecycleStatus: normalize(input.anlassraumStatus),
    outputStatus: normalize(input.draftStatus),
    isPublic: true,
    factcheckSuggested: input.factcheckSuggested === true,
    existingContextHint: anlassraumId
      ? "Aehnlicher oder bestehender Anlassraum ist bereits vorhanden."
      : null,
  });

  return FeedAnlassraumSurfaceCompositionSchema.parse({
    anlass: {
      hasExistingContext: !!anlassraumId,
      title,
      summary,
      anlassraumType: normalize(input.anlassraumType),
      scope: normalize(input.anlassraumScope),
      regionCode: normalize(input.regionCode),
      status: normalize(input.anlassraumStatus),
      maturity: normalize(input.anlassraumMaturity),
    },
    anlassgeber: {
      sourcePipeline: normalize(input.sourcePipeline),
      sourceUrl: normalize(input.sourceUrl),
      feedReviewState,
      signalPathHint,
      originType,
      sourceMode,
      sourceAnchorContext: originType === "source_anchor",
    },
    beteiligteKontexte: {
      labels,
      hasAssociationContext: boolFromLabel(labels, "verein_oder_verband"),
      hasInitiativeContext: boolFromLabel(labels, "initiative_oder_civic"),
      hasOrganizationContext: boolFromLabel(labels, "organisation_oder_institution"),
      hasEditorialPublisherContext: boolFromLabel(labels, "redaktion_publisher_team"),
      hasExpertVoiceContext: boolFromLabel(labels, "fachstimme_oder_expertenhinweis"),
      hasCivicCreatorContext: boolFromLabel(labels, "initiative_oder_civic"),
    },
    anschlussflaechen: {
      canonicalPublicTarget: shareReady.canonicalPublicTarget,
      qrTarget: shareReady.qrTarget,
      anlassTarget: shareReady.targets.anlassPublicTarget,
      roundOperatingTarget: shareReady.targets.roundOperatingTarget,
      roundResultsTarget: shareReady.targets.roundResultsTarget,
      dossierTarget: shareReady.targets.dossierPublicTarget,
      companionTarget: shareReady.targets.companionPublicTarget,
    },
    andockhinweise: {
      existingContextExists: !!anlassraumId,
      pathHint: signalPathHint,
      contextSuggestionHint: shareReady.qualityHints.existingContextHint,
      optionalFactcheckHint: shareReady.qualityHints.factcheckSuggested || weakSignalFlagged,
      nonBlockingHint: true,
    },
    guardrails: {
      feedIsSignalSourceOnly: true,
      noAutoPublish: true,
      noTruthPrivilegeFromContext: true,
      noPriorityPrivilegeFromContext: true,
      noVotingPrivilegeFromContext: true,
      keepsTopicRegionSeparated: true,
      keepsDossierAsUpperContext: true,
      keepsRoundAsProcessContext: true,
      keepsCompanionAsFormatContext: true,
    },
  });
}
