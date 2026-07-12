import type { CanonicalPreparationStatus } from "@/features/create/canonicalPreparationStatusContract";
import type { DossierSocialOutputDraft } from "@/features/create/dossierSocialOutputDraftContract";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { ThemenradarItem } from "@features/themenradar/contracts";
import type { ThemenradarContentPrep } from "@features/themenradar/contentPrep";
import type { ThemenradarMembershipEntry } from "@features/themenradar/membershipCta";

export const EDITORIAL_SERIES_STAGES = [
  "draft",
  "review_ready",
  "approved",
  "published",
] as const;

export type EditorialSeriesStageId =
  (typeof EDITORIAL_SERIES_STAGES)[number];

export type EditorialSeriesStageStatus = "completed" | "current" | "pending";

export type EditorialSeriesStage = {
  id: EditorialSeriesStageId;
  label: string;
  note: string;
  status: EditorialSeriesStageStatus;
};

export type EditorialSeriesEpisode = {
  id: "context" | "claims" | "sources" | "cta";
  label: string;
  windowLabel: string;
  focus: string;
  targetAudience: string;
  callToAction: string;
  sourceContext: string[];
  claimContext: string[];
  reviewGates: string[];
  exportFormats: string[];
};

export type EditorialSeriesModel = {
  title: string;
  summary: string;
  clusterLabel: string;
  cadenceLabel: string;
  currentStage: EditorialSeriesStageId;
  currentStageLabel: string;
  audienceLabel: string;
  callToActionLabel: string;
  routeHints: string[];
  reviewGates: string[];
  exportFormats: string[];
  stages: EditorialSeriesStage[];
  episodes: EditorialSeriesEpisode[];
  sourceContextVisible: true;
  claimContextVisible: true;
  reviewRequired: true;
  noAutoPublish: true;
  noTracking: true;
};

type BuildEditorialSeriesModelInput = {
  title: string;
  summary: string;
  clusterLabel: string;
  cadenceLabel: string;
  currentStage: EditorialSeriesStageId;
  audienceLabel: string;
  callToActionLabel: string;
  routeHints?: readonly string[];
  reviewGates?: readonly string[];
  exportFormats?: readonly string[];
  sourceContext?: readonly string[];
  claimContext?: readonly string[];
};

function unique(values: readonly (string | null | undefined)[]): string[] {
  return Array.from(
    new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)),
  );
}

function stageLabel(value: EditorialSeriesStageId): string {
  if (value === "draft") return "Entwurf";
  if (value === "review_ready") return "Review-ready";
  if (value === "approved") return "Approved";
  return "Published";
}

function stageNote(value: EditorialSeriesStageId): string {
  if (value === "draft") {
    return "Arbeitsstand vorbereiten, Quellen und Zielgruppe sichtbar halten.";
  }
  if (value === "review_ready") {
    return "Für Review und Export vorbereitet, aber noch nicht freigegeben.";
  }
  if (value === "approved") {
    return "Menschlich freigegeben für den nächsten Schritt, aber noch nicht veröffentlicht.";
  }
  return "Veröffentlicht; Quellen- und Claim-Kontext bleiben nachvollziehbar.";
}

function stageStatus(
  currentStage: EditorialSeriesStageId,
  stageId: EditorialSeriesStageId,
): EditorialSeriesStageStatus {
  const currentIndex = EDITORIAL_SERIES_STAGES.indexOf(currentStage);
  const stageIndex = EDITORIAL_SERIES_STAGES.indexOf(stageId);
  if (stageIndex < currentIndex) return "completed";
  if (stageIndex === currentIndex) return "current";
  return "pending";
}

function resolveFocus(primary: string | null | undefined, fallback: string): string {
  const normalized = String(primary ?? "").trim();
  return normalized || fallback;
}

function mapDossierDraftKindToSeriesFormat(
  kind: DossierSocialOutputDraft["kind"],
): string {
  if (kind === "website_update_draft") return "Website-Update";
  if (kind === "newsletter_draft") return "Newsletter";
  if (kind === "linkedin_draft") return "LinkedIn";
  if (kind === "short_video_script_draft") return "Kurzvideo-Skript";
  if (kind === "carousel_draft") return "Carousel";
  return "Pressenotiz";
}

function deriveStageFromPreparationStatuses(
  statuses: readonly CanonicalPreparationStatus[],
  queueStates: readonly string[],
): EditorialSeriesStageId {
  if (
    statuses.some((status) => status === "active_or_published") ||
    queueStates.includes("published")
  ) {
    return "published";
  }
  if (
    statuses.some(
      (status) =>
        status === "publish_ready" || status === "scheduled_after_review",
    ) ||
    queueStates.includes("approved") ||
    queueStates.includes("publish_ready")
  ) {
    return "approved";
  }
  if (
    statuses.some((status) => status === "review_ready") ||
    queueStates.includes("review_ready") ||
    queueStates.includes("approval_required") ||
    queueStates.includes("queued_for_review") ||
    queueStates.includes("in_review")
  ) {
    return "review_ready";
  }
  return "draft";
}

function buildEditorialSeriesModel(
  input: BuildEditorialSeriesModelInput,
): EditorialSeriesModel {
  const routeHints = unique(input.routeHints ?? []).slice(0, 4);
  const sourceContext = unique(input.sourceContext ?? []).slice(0, 3);
  const claimContext = unique(input.claimContext ?? []).slice(0, 3);
  const reviewGates = unique([
    ...(input.reviewGates ?? []),
    "Review-ready ist nicht approved.",
    "Approved ist nicht published.",
    "Kein Auto-Publish, kein Tracking und kein Social Posting.",
  ]).slice(0, 6);
  const exportFormats = unique(input.exportFormats ?? []).slice(0, 4);
  const stages = EDITORIAL_SERIES_STAGES.map((stage) => ({
    id: stage,
    label: stageLabel(stage),
    note: stageNote(stage),
    status: stageStatus(input.currentStage, stage),
  }));

  return {
    title: input.title,
    summary: input.summary,
    clusterLabel: input.clusterLabel,
    cadenceLabel: input.cadenceLabel,
    currentStage: input.currentStage,
    currentStageLabel: stageLabel(input.currentStage),
    audienceLabel: input.audienceLabel,
    callToActionLabel: input.callToActionLabel,
    routeHints,
    reviewGates,
    exportFormats,
    stages,
    episodes: [
      {
        id: "context",
        label: "Woche 1 · Kontext",
        windowLabel: "Einordnung",
        focus: resolveFocus(
          sourceContext[0],
          input.summary,
        ),
        targetAudience: input.audienceLabel,
        callToAction: "Kontext prüfen und Ausgangslage für Review festhalten.",
        sourceContext,
        claimContext,
        reviewGates: reviewGates.slice(0, 2),
        exportFormats,
      },
      {
        id: "claims",
        label: "Woche 2 · Claims",
        windowLabel: "Behauptungen und Gegenpositionen",
        focus: resolveFocus(
          claimContext[0],
          "Claims, Gegenpositionen und Reibungspunkte sauber trennen.",
        ),
        targetAudience: input.audienceLabel,
        callToAction: "Claim-Kontext schärfen und Gegenpositionen sichtbar halten.",
        sourceContext,
        claimContext,
        reviewGates: [
          "Behauptungen und Gegenpositionen bleiben getrennt sichtbar.",
          "Keine Behauptung ohne vorhandenen Review- oder Quellenkontext.",
        ],
        exportFormats,
      },
      {
        id: "sources",
        label: "Woche 3 · Quellen",
        windowLabel: "Beleglage und offene Fragen",
        focus: resolveFocus(
          sourceContext[1],
          "Quellenlage, Lücken und offene Fragen explizit markieren.",
        ),
        targetAudience: "Redaktion, Review und fachliche Gegenprüfung",
        callToAction: "Quellen nachziehen, Lücken benennen, Review-Gates halten.",
        sourceContext,
        claimContext,
        reviewGates: [
          "Quellen- und Claim-Kontext bleiben sichtbar.",
          "Offene Fragen werden nicht als gelöst dargestellt.",
        ],
        exportFormats,
      },
      {
        id: "cta",
        label: "Woche 4 · CTA",
        windowLabel: "Mitwirkung und nächster Schritt",
        focus: resolveFocus(
          claimContext[1],
          input.callToActionLabel,
        ),
        targetAudience: input.audienceLabel,
        callToAction: input.callToActionLabel,
        sourceContext,
        claimContext,
        reviewGates: [
          "CTA bleibt freiwillig und review-first.",
          "Kein Publish-, Schedule- oder Posting-Schritt wird ausgelöst.",
        ],
        exportFormats,
      },
    ],
    sourceContextVisible: true,
    claimContextVisible: true,
    reviewRequired: true,
    noAutoPublish: true,
    noTracking: true,
  };
}

export function buildEditorialSeriesFromThemenradar(input: {
  item: ThemenradarItem;
  contentPrep: ThemenradarContentPrep | null;
  membershipEntry: ThemenradarMembershipEntry | null;
}): EditorialSeriesModel {
  const currentStage =
    input.item.lifecycleStatus === "published"
      ? "published"
      : input.item.lifecycleStatus === "review_ready"
        ? "review_ready"
        : "draft";
  const audienceLabel =
    input.membershipEntry?.membershipSignalLevel === "high"
      ? "Interessierte, potenzielle Mitglieder und lokale Entscheidungsträger:innen"
      : input.membershipEntry?.membershipSignalLevel === "medium"
        ? "Interessierte, lokale Entscheidungsträger:innen und Mitwirkende"
        : "Interessierte und lokale Kontextträger:innen";
  const callToActionLabel =
    input.contentPrep?.dossierOrAnlassraumCta ??
    input.membershipEntry?.callsToAction[0]?.label ??
    "Im Dossier oder Anlassraum review-first weiterarbeiten.";

  return buildEditorialSeriesModel({
    title: `${input.item.title} · Editorial Series`,
    summary:
      input.contentPrep?.socialHook ??
      `${input.item.title} bleibt als review-first Themenfolge vorbereitet und wird nicht automatisch veröffentlicht.`,
    clusterLabel: input.item.campaignKey
      ? `Kampagnenkontext: ${input.item.campaignKey}`
      : "Themenradar-Wochenserie",
    cadenceLabel: "4-teilige Wochen-/Kampagnenfolge",
    currentStage,
    audienceLabel,
    callToActionLabel,
    routeHints: [
      `/admin/themenradar/${encodeURIComponent(input.item.id)}`,
      input.item.linkedDossierId
        ? `/dossier/${encodeURIComponent(input.item.linkedDossierId)}/studio`
        : null,
      input.item.linkedAnlassraumId
        ? `/anlassraum?anlassraumId=${encodeURIComponent(input.item.linkedAnlassraumId)}`
        : null,
      input.item.shareContractSnapshot?.canonicalPublicTarget ?? null,
    ],
    reviewGates: [
      "Themenradar bleibt review-first und exportgebunden.",
      "Menschliche Freigabe bleibt vor jedem öffentlichen Schritt separat.",
      input.membershipEntry?.separationHint ?? null,
    ],
    exportFormats: ["Post", "Carousel", "Script"],
    sourceContext: [
      input.item.rawSignal,
      input.contentPrep?.captionVariants[0] ?? null,
      input.contentPrep?.captionVariants[1] ?? null,
    ],
    claimContext: [
      input.contentPrep?.socialHook ?? null,
      input.contentPrep?.dossierOrAnlassraumCta ?? null,
      input.contentPrep?.membershipCta ?? null,
    ],
  });
}

export function buildEditorialSeriesFromReviewContext(
  context: V3ReviewQueueWiringContext,
  options: {
    audience: "workspace" | "admin" | "account";
    dossierRef?: {
      id: string;
      title: string;
      href?: string | null;
    } | null;
  },
): EditorialSeriesModel | null {
  const queueStates = unique([
    context.primaryUnifiedItem?.queueState ?? null,
    ...context.unifiedItems.map((item) => item.queueState),
  ]);
  const preparationStatuses = [
    ...(context.primaryUnifiedItem?.preparationStatus
      ? [context.primaryUnifiedItem.preparationStatus]
      : []),
    ...context.socialOutputDrafts.map((draft) => draft.preparationStatus),
    ...context.unifiedItems.map((item) => item.preparationStatus),
  ];
  const currentStage = deriveStageFromPreparationStatuses(
    preparationStatuses,
    queueStates,
  );
  const draftFormats = unique(
    context.socialOutputDrafts.map((draft) =>
      mapDossierDraftKindToSeriesFormat(draft.kind),
    ),
  );
  const routeHints = unique([
    options.dossierRef?.href ?? null,
    context.primaryUnifiedItem?.source === "create_handoff"
      ? `/create?resume=${encodeURIComponent(context.primaryUnifiedItem.sourceId)}`
      : null,
  ]);
  const sourceContext = unique([
    ...(context.sourcePack?.sources ?? []).map((source) => source.title),
    ...(context.dossierWorkspaceSurface?.sections.openQuestions ?? []),
  ]);
  const claimContext = unique([
    ...(context.dossierWorkspaceSurface?.sections.claims ?? []),
    ...(context.dossierWorkspaceSurface?.sections.counterPositions ?? []),
  ]);

  if (
    !options.dossierRef &&
    !context.primaryUnifiedItem &&
    sourceContext.length === 0 &&
    claimContext.length === 0 &&
    context.socialOutputDrafts.length === 0
  ) {
    return null;
  }

  const audienceLabel =
    options.audience === "admin"
      ? "Review, Redaktion und Organisationsverantwortliche"
      : options.audience === "account"
        ? "Account-Kontext, Review und spätere Redaktion"
        : "Redaktion, Dossier-Verantwortliche und beteiligte Organisationen";
  const firstDraft = context.socialOutputDrafts[0] ?? null;
  const callToActionLabel =
    context.participationCandidates[0]?.prompt ??
    firstDraft?.summary ??
    "Dossier-Entwurf prüfen, Export vorbereiten und bewusst reviewen.";
  const titleBase =
    options.dossierRef?.title ??
    context.primaryUnifiedItem?.title ??
    "Editorial Series";

  return buildEditorialSeriesModel({
    title: `${titleBase} · Editorial Series`,
    summary:
      context.primaryUnifiedItem?.summary ??
      `${titleBase} bleibt eine review-first Export-Serie ohne Autopublish oder Tracking.`,
    clusterLabel: options.dossierRef
      ? `Dossier-Kontext: ${options.dossierRef.id}`
      : "Review-/Export-Serie",
    cadenceLabel: "4-teilige Review-/Export-Folge",
    currentStage,
    audienceLabel,
    callToActionLabel,
    routeHints,
    reviewGates: [
      "Dossier, Claims und Quellen bleiben im selben Review-Kontext sichtbar.",
      "Export-Drafts bleiben review-first und nicht veröffentlicht.",
      "Freigabe und Veröffentlichung bleiben getrennte Schritte.",
    ],
    exportFormats:
      draftFormats.length > 0
        ? draftFormats
        : unique(
            context.socialOutputDrafts.map((draft) =>
              mapDossierDraftKindToSeriesFormat(draft.kind),
            ),
          ),
    sourceContext,
    claimContext,
  });
}
