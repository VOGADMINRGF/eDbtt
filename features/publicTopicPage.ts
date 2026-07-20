import {
  getContentReleasePersistenceState,
  getContentReleaseTargetRecordByTargetId,
  listContentReleaseTargetsByType,
  listContentReleaseTargetsForSourceResult,
  type ContentPublishStatus,
  type ContentReleasePersistenceState,
  type ContentReleaseSourceKind,
  type ContentReleaseTargetRecord,
  type ContentReleaseTopicPageData,
} from "@features/contentReleaseWorkbench";
import {
  isPublicVisibilityState,
  publicationVisibilityLabel,
  type RegionPublicationVisibilityState,
} from "@features/region/publicationRiskLadder";
import { buildQrStudioEntryHref } from "@features/qr";

export type PublicTopicPageStatus = ContentPublishStatus;

export type PublicTopicPageSource = {
  sourceKind: ContentReleaseSourceKind;
  sourceId: string;
  regionId: string | null;
  organizationId: string | null;
  reviewRequired: true;
};

export type PublicTopicPageLink = {
  kind: "public" | "share" | "qr" | "preview";
  href: string;
  label: string;
};

export type PublicTopicPageRelatedContent = {
  kind: "dossier" | "anlassraum";
  id: string;
  title: string;
  href: string | null;
  visibilityState: RegionPublicationVisibilityState;
  visibilityLabel: string;
  prepared: true;
};

export type PublicTopicPageAction = {
  id: "add_hint" | "add_perspective" | "add_source" | "add_question";
  label: string;
  href: string;
};

export type PublicTopicPage = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  regionId: string | null;
  organizationId: string | null;
  visibilityState: RegionPublicationVisibilityState;
  reviewStatus: ContentReleaseTopicPageData["reviewStatus"];
  status: PublicTopicPageStatus;
  statusLabel: string;
  claimCandidates: ContentReleaseTopicPageData["claimCandidates"];
  evidenceHints: ContentReleaseTopicPageData["evidenceHints"];
  openQuestions: string[];
  relatedDossiers: PublicTopicPageRelatedContent[];
  relatedAnlassraeume: PublicTopicPageRelatedContent[];
  publicUrl: string | null;
  shareUrl: string | null;
  qrAvailable: boolean;
  links: PublicTopicPageLink[];
  actions: PublicTopicPageAction[];
  source: PublicTopicPageSource;
  previewMode: boolean;
  guardrails: {
    noAutoPublish: true;
    noAutoPublicOfficial: true;
    officialReleaseOnlyForPublicOfficial: true;
    noAutoDossierFinalization: true;
    noAutoAnlassraumFinalization: true;
  };
};

export type RelatedTopicPageTarget = {
  slug: string;
  title: string;
  previewHref: string;
  publicHref: string;
  visibilityState: RegionPublicationVisibilityState;
  visibilityLabel: string;
};

export type PublicTopicPageRepository = {
  getBySlug(slug: string): Promise<ContentReleaseTargetRecord | null>;
  getVisibleBySlug(slug: string): Promise<PublicTopicPage | null>;
  getPreviewableBySlug(params: {
    slug: string;
    allowInternalPreview: boolean;
  }): Promise<PublicTopicPage | null>;
  getRelatedTopicPageForDossier(dossierId: string): Promise<RelatedTopicPageTarget | null>;
  listVisibleTopicPagesForAnlassraumIds(
    anlassraumIds: string[],
  ): Promise<Map<string, RelatedTopicPageTarget>>;
  getPersistenceState(): ContentReleasePersistenceState;
};

const TOPIC_PAGE_GUARDRAILS: PublicTopicPage["guardrails"] = {
  noAutoPublish: true,
  noAutoPublicOfficial: true,
  officialReleaseOnlyForPublicOfficial: true,
  noAutoDossierFinalization: true,
  noAutoAnlassraumFinalization: true,
};

function statusForVisibility(
  visibilityState: RegionPublicationVisibilityState,
): PublicTopicPageStatus {
  switch (visibilityState) {
    case "public_unverified":
      return "public_unverified";
    case "public_reviewed":
      return "public_reviewed";
    case "public_official":
      return "public_official";
    case "archived":
      return "archived";
    case "blocked":
      return "blocked";
    case "private_draft":
      return "draft";
    case "internal_review":
    default:
      return "internal_review";
  }
}

function statusLabelForVisibility(
  visibilityState: RegionPublicationVisibilityState,
): string {
  switch (visibilityState) {
    case "public_unverified":
      return "sichtbar, aber nicht geprüft";
    case "public_reviewed":
      return "geprüft";
    case "public_official":
      return "amtlich freigegeben";
    case "archived":
      return "archiviert";
    case "blocked":
      return "blockiert";
    case "private_draft":
    case "internal_review":
    default:
      return "Arbeitsstand";
  }
}

function topicActionHref(slug: string, title: string, reason: string) {
  const params = new URLSearchParams();
  params.set("mode", "source");
  params.set("entryIntent", "issue_signal");
  params.set("entryMode", "guided");
  params.set("source", "public_topic_page");
  params.set("reason", reason);
  params.set("signalTitle", title.slice(0, 160));
  params.set("returnTo", `/topic/${encodeURIComponent(slug)}`);
  return `/create?${params.toString()}`;
}

function mapRelatedContent(record: ContentReleaseTargetRecord): PublicTopicPageRelatedContent {
  const href = isPublicVisibilityState(record.visibilityState) ? record.publicHref : null;
  return {
    kind: record.targetType === "dossier" ? "dossier" : "anlassraum",
    id: record.targetId,
    title: record.title,
    href,
    visibilityState: record.visibilityState,
    visibilityLabel: publicationVisibilityLabel(record.visibilityState),
    prepared: true,
  };
}

async function buildPublicTopicPageFromRecord(
  record: ContentReleaseTargetRecord,
  previewMode: boolean,
): Promise<PublicTopicPage | null> {
  const topicPageData = record.topicPageData;
  if (!topicPageData) return null;

  const relatedRecords = await listContentReleaseTargetsForSourceResult(
    record.sourceKind,
    record.sourceResultId,
  );
  const relatedDossiers = relatedRecords
    .filter((entry) => entry.targetType === "dossier")
    .map(mapRelatedContent);
  const relatedAnlassraeume = relatedRecords
    .filter((entry) => entry.targetType === "anlassraum")
    .map(mapRelatedContent);

  const links: PublicTopicPageLink[] = previewMode
    ? [{ kind: "preview", href: record.previewHref, label: "Vorschau" }]
    : [];
  if (isPublicVisibilityState(record.visibilityState)) {
    links.push({ kind: "public", href: record.publicHref, label: "Öffentliche URL" });
    links.push({ kind: "share", href: record.publicHref, label: "Share-Link" });
    links.push({
      kind: "qr",
      href: buildQrStudioEntryHref({ target: record.publicHref }),
      label: "QR-Link",
    });
  }

  return {
    id: record.id,
    slug: record.targetId,
    title: topicPageData.title,
    summary: topicPageData.summary,
    regionId: record.regionId ?? null,
    organizationId: record.organizationId ?? null,
    visibilityState: record.visibilityState,
    reviewStatus: topicPageData.reviewStatus,
    status: statusForVisibility(record.visibilityState),
    statusLabel: statusLabelForVisibility(record.visibilityState),
    claimCandidates: topicPageData.claimCandidates.map((claim) => ({
      text: claim.text,
      excerpt: claim.excerpt ?? null,
    })),
    evidenceHints: topicPageData.evidenceHints.map((hint) => ({
      label: hint.label,
      url: hint.url ?? null,
      excerpt: hint.excerpt ?? null,
    })),
    openQuestions: topicPageData.openQuestions.map((question) => String(question)),
    relatedDossiers,
    relatedAnlassraeume,
    publicUrl: isPublicVisibilityState(record.visibilityState) ? record.publicHref : null,
    shareUrl: isPublicVisibilityState(record.visibilityState) ? record.publicHref : null,
    qrAvailable: isPublicVisibilityState(record.visibilityState),
    links,
    actions: [
      {
        id: "add_hint",
        label: "Hinweis ergänzen",
        href: topicActionHref(record.targetId, topicPageData.title, "topic_hint"),
      },
      {
        id: "add_perspective",
        label: "Perspektive ergänzen",
        href: topicActionHref(record.targetId, topicPageData.title, "topic_perspective"),
      },
      {
        id: "add_source",
        label: "Quelle ergänzen",
        href: topicActionHref(record.targetId, topicPageData.title, "topic_source"),
      },
      {
        id: "add_question",
        label: "Frage ergänzen",
        href: topicActionHref(record.targetId, topicPageData.title, "topic_question"),
      },
    ],
    source: {
      sourceKind: record.sourceKind,
      sourceId: record.sourceResultId,
      regionId: record.regionId ?? null,
      organizationId: record.organizationId ?? null,
      reviewRequired: true,
    },
    previewMode,
    guardrails: TOPIC_PAGE_GUARDRAILS,
  };
}

export async function getPublicTopicPageRecordBySlug(slug: string) {
  return getContentReleaseTargetRecordByTargetId("topic_page", slug);
}

export async function buildVisiblePublicTopicPageBySlug(slug: string) {
  const record = await getPublicTopicPageRecordBySlug(slug);
  if (!record || !isPublicVisibilityState(record.visibilityState)) return null;
  return buildPublicTopicPageFromRecord(record, false);
}

export async function buildPreviewablePublicTopicPageBySlug(params: {
  slug: string;
  allowInternalPreview: boolean;
}) {
  const record = await getPublicTopicPageRecordBySlug(params.slug);
  if (!record) return null;
  if (!params.allowInternalPreview && !isPublicVisibilityState(record.visibilityState)) {
    return null;
  }
  return buildPublicTopicPageFromRecord(
    record,
    params.allowInternalPreview && !isPublicVisibilityState(record.visibilityState),
  );
}

export async function getRelatedTopicPageForDossier(dossierId: string) {
  const dossierRecords = await listContentReleaseTargetsByType("dossier");
  const relatedDossierRecord = dossierRecords.find((record) => record.targetId === dossierId);
  if (!relatedDossierRecord) return null;
  const topicPageRecords = await listContentReleaseTargetsByType("topic_page");
  const relatedTopicPageRecord = topicPageRecords.find(
    (record) =>
      record.sourceKind === relatedDossierRecord.sourceKind &&
      record.sourceResultId === relatedDossierRecord.sourceResultId,
  );
  if (!relatedTopicPageRecord) return null;
  return {
    slug: relatedTopicPageRecord.targetId,
    title: relatedTopicPageRecord.title,
    previewHref: relatedTopicPageRecord.previewHref,
    publicHref: relatedTopicPageRecord.publicHref,
    visibilityState: relatedTopicPageRecord.visibilityState,
    visibilityLabel: publicationVisibilityLabel(relatedTopicPageRecord.visibilityState),
  } satisfies RelatedTopicPageTarget;
}

export async function listVisibleTopicPagesForAnlassraumIds(anlassraumIds: string[]) {
  const normalizedIds = Array.from(
    new Set(anlassraumIds.map((value) => String(value ?? "").trim()).filter(Boolean)),
  );
  if (normalizedIds.length === 0) return new Map<string, RelatedTopicPageTarget>();

  const [anlassraumRecords, topicPageRecords] = await Promise.all([
    listContentReleaseTargetsByType("anlassraum"),
    listContentReleaseTargetsByType("topic_page"),
  ]);

  const topicRecordBySource = new Map(
    topicPageRecords
      .filter((record) => isPublicVisibilityState(record.visibilityState))
      .map((record) => [`${record.sourceKind}:${record.sourceResultId}`, record] as const),
  );

  const result = new Map<string, RelatedTopicPageTarget>();
  for (const anlassraumId of normalizedIds) {
    const anlassraumRecord = anlassraumRecords.find((record) => record.targetId === anlassraumId);
    if (!anlassraumRecord) continue;
    const topicPageRecord = topicRecordBySource.get(
      `${anlassraumRecord.sourceKind}:${anlassraumRecord.sourceResultId}`,
    );
    if (!topicPageRecord) continue;
    result.set(anlassraumId, {
      slug: topicPageRecord.targetId,
      title: topicPageRecord.title,
      previewHref: topicPageRecord.previewHref,
      publicHref: topicPageRecord.publicHref,
      visibilityState: topicPageRecord.visibilityState,
      visibilityLabel: publicationVisibilityLabel(topicPageRecord.visibilityState),
    });
  }
  return result;
}

export function getPublicTopicPageRepository(): PublicTopicPageRepository {
  return {
    getBySlug: getPublicTopicPageRecordBySlug,
    getVisibleBySlug: buildVisiblePublicTopicPageBySlug,
    getPreviewableBySlug: buildPreviewablePublicTopicPageBySlug,
    getRelatedTopicPageForDossier,
    listVisibleTopicPagesForAnlassraumIds,
    getPersistenceState: getContentReleasePersistenceState,
  };
}
