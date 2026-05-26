import { getCol, ObjectId } from "@core/db/triMongo";
import { evidenceClaimsCol } from "@core/evidence/db";
import { anlassraumCol } from "@features/anlassraum/db";
import { voteDraftsCol } from "@features/feeds/db";
import type { VoteDraftDoc } from "@features/feeds/types";
import {
  buildPersistedCreateHandoffSummary,
  listPersistedCreateHandoffRecords,
  persistedCreateHandoffStatementId,
  type PersistedCreateHandoffRecord,
} from "@/features/create/persistedHandoffReviewQueue";
import {
  dossierSuggestionsCol,
  dossiersCol,
} from "./db";
import { findDossierByAnyId } from "./lookup";
import type {
  DossierDoc,
  DossierSuggestionDoc,
  SuggestionType,
} from "./schemas";
import {
  dossierUpdateOriginLabel,
  dossierUpdateSectionLabel,
  resolveDossierUpdateStatus,
  resolveDossierUpdateStatusMeta,
  type DossierUpdateOrigin,
  type DossierUpdateSection,
  type DossierUpdateStatus,
} from "./updateStatusContract";

type StatementProposalDoc = {
  _id?: ObjectId;
  dossierId?: string | null;
  draftId?: ObjectId | string | null;
  anlassraumId?: string | null;
  title?: string | null;
  text?: string | null;
  topic?: string | null;
  responsibility?: string | null;
  stance?: string | null;
  importance?: number | null;
  status?: string | null;
  createdAt?: Date | null;
};

type AnlassraumSnapshot = {
  _id?: ObjectId;
  dossierId?: ObjectId | null;
  title?: string | null;
  summary?: string | null;
  status?: string | null;
  sourceMode?: string | null;
  isPublic?: boolean | null;
  updatedAt?: Date | null;
  createdAt?: Date | null;
  riskFlags?: string[] | null;
};

export type DossierUpdateSuggestion = {
  id: string;
  dossierId: string;
  statementId: string;
  title: string;
  summary: string;
  origin: DossierUpdateOrigin;
  originLabel: string;
  section: DossierUpdateSection;
  sectionLabel: string;
  status: DossierUpdateStatus;
  statusLabel: string;
  statusDescription: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
  moderationStatus: "pending" | "accepted" | "rejected";
  reviewRequired: boolean;
  reviewHint: string;
  riskHint: string;
  nextAction: string;
  dossierHref: string;
  anlassraumHref: string | null;
  swipesHref: string | null;
  sourceHref: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DossierPublicUpdateContext = {
  checkedStandLabel: string;
  checkedStandHint: string;
  latestPublicUpdateAt: string | null;
  latestReviewUpdateAt: string | null;
  publishedItems: DossierUpdateSuggestion[];
  reviewItems: DossierUpdateSuggestion[];
  originSummary: Array<{ origin: DossierUpdateOrigin; label: string; count: number }>;
  sectionSummary: Array<{ section: DossierUpdateSection; label: string; count: number }>;
  relatedContext: {
    dossierHref: string;
    anlassraumHref: string | null;
    anlassraumLabel: string | null;
    swipesHref: string | null;
    swipesLabel: string | null;
  };
};

export type DossierUpdateReadModel = {
  dossierId: string;
  statementId: string;
  items: DossierUpdateSuggestion[];
  publicContext: DossierPublicUpdateContext;
  summary: {
    total: number;
    reviewRequired: number;
    published: number;
    rejected: number;
  };
};

type DossierSuggestionPayload = {
  title?: string;
  summary?: string;
  origin?: DossierUpdateOrigin;
  section?: DossierUpdateSection;
  sourceHref?: string | null;
  swipesHref?: string | null;
  anlassraumHref?: string | null;
  reviewHint?: string;
  riskHint?: string;
  nextAction?: string;
  statementId?: string;
  relatedAnlassraumTitle?: string | null;
  superseded?: boolean;
  archived?: boolean;
  hasError?: boolean;
};

type DerivedSuggestionSeed = {
  suggestionId: string;
  type: SuggestionType;
  title: string;
  summary: string;
  origin: DossierUpdateOrigin;
  section: DossierUpdateSection;
  sourceHref?: string | null;
  swipesHref?: string | null;
  anlassraumHref?: string | null;
  reviewHint: string;
  riskHint: string;
  nextAction: string;
  statementId: string;
  relatedAnlassraumTitle?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type BuildSeedsInput = {
  dossier: DossierDoc;
  createHandoffs: PersistedCreateHandoffRecord[];
  feedDrafts: VoteDraftDoc[];
  swipeProposals: StatementProposalDoc[];
  anlassraeume: AnlassraumSnapshot[];
  evidenceClaims: Array<{
    claimId: string;
    text: string;
    sourceType?: string | null;
    updatedAt?: Date | null;
    createdAt?: Date | null;
  }>;
};

type RuntimeContext = {
  dossier: DossierDoc;
  publicVisible: boolean;
  archived: boolean;
  relatedAnlassraum: AnlassraumSnapshot | null;
};

function normalizeString(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function toHex(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value.toHexString();
  const raw = normalizeString(value);
  if (!raw || !ObjectId.isValid(raw)) return null;
  return new ObjectId(raw).toHexString();
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function toDate(value: Date | string | null | undefined): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function sortByNewest<T extends { updatedAt?: string | null; createdAt?: string | null }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.updatedAt ?? left.createdAt ?? 0).getTime();
    const rightTime = new Date(right.updatedAt ?? right.createdAt ?? 0).getTime();
    return rightTime - leftTime;
  });
}

function sectionFromSuggestionType(type: SuggestionType): DossierUpdateSection {
  if (type === "source") return "sources";
  if (type === "claim") return "claim";
  if (type === "counter" || type === "perspective") return "perspective";
  if (type === "question") return "question";
  if (type === "update") return "update";
  return "update";
}

function typeFromSection(section: DossierUpdateSection): SuggestionType {
  if (section === "sources") return "source";
  if (section === "claim") return "claim";
  if (section === "perspective") return "perspective";
  if (section === "question") return "question";
  return "update";
}

function isCreateHandoffForDossier(record: PersistedCreateHandoffRecord, dossier: DossierDoc): boolean {
  const directMatch =
    normalizeString(record.dossierId) === dossier.dossierId ||
    normalizeString(record.dossierId) === dossier.statementId;
  if (directMatch) return true;
  const candidates = new Set(
    [
      dossier.dossierId,
      dossier.statementId,
      toHex(dossier._id),
    ].filter((value): value is string => Boolean(value)),
  );
  return record.graphMatches.matchedDossiers.some((value) => {
    const normalized = normalizeString(value);
    return normalized ? candidates.has(normalized) : false;
  });
}

export function createDerivedDossierUpdateSeeds(input: BuildSeedsInput): DerivedSuggestionSeed[] {
  const seeds: DerivedSuggestionSeed[] = [];
  const statementId = input.dossier.statementId;

  for (const record of input.createHandoffs) {
    if (!isCreateHandoffForDossier(record, input.dossier)) continue;
    const sourceHasLink = record.sourceGrounding.some(
      (entry) => entry.status === "link_reference" || entry.id.startsWith("material-reference-"),
    );
    const section: DossierUpdateSection =
      record.openQuestions.length > 0 && record.claims.length === 0
        ? "question"
        : sourceHasLink
          ? "sources"
          : "claim";
    const riskHint = record.claims.some((claim) => claim.factcheckEligible)
      ? "Mindestens ein Claim ist als prüfbedürftig markiert."
      : "Create-Handoff bleibt bestätigungspflichtig und darf nicht still zum Dossierstand werden.";

    seeds.push({
      suggestionId: `du:create:${record.id}`,
      type: typeFromSection(section),
      title: record.topicSeed.topicLabel || "Create-Hinweis",
      summary: buildPersistedCreateHandoffSummary(record),
      origin: "create",
      section,
      sourceHref: record.resumeHref,
      swipesHref: `/swipes?from=create&handoffId=${encodeURIComponent(record.id)}`,
      anlassraumHref: record.anlassraumId
        ? `/runden?anlassraumId=${encodeURIComponent(record.anlassraumId)}`
        : null,
      reviewHint: "Aus Create übernommen. Review und bewusste Übernahme bleiben Pflicht.",
      riskHint,
      nextAction: "Im Dossier prüfen, bestätigen oder zurück in Create nachschärfen.",
      statementId,
      createdAt: toDate(record.createdAt),
      updatedAt: toDate(record.updatedAt),
    });
  }

  for (const draft of input.feedDrafts) {
    const roomId = toHex(draft.anlassraumId);
    const firstClaim = draft.claims?.[0];
    const riskHint =
      draft.weakSignal?.flagged
        ? `Schwaches Signal: ${normalizeString(draft.weakSignal.reason) ?? "Review empfohlen"}.`
        : draft.status === "published"
          ? "Als Feed-Update sichtbar, aber nicht automatisch Dossierwahrheit."
          : "Feed-Draft bleibt reviewpflichtig und darf nicht still veröffentlicht werden.";
    seeds.push({
      suggestionId: `du:feed:${toHex(draft._id) ?? draft.title}`,
      type: "update",
      title: draft.title || "Feed-Update",
      summary: normalizeString(draft.summary) ?? normalizeString(firstClaim?.text) ?? "Feed-Hinweis ohne Kurzfassung.",
      origin: "feed",
      section: draft.status === "published" ? "result" : "update",
      sourceHref: toHex(draft._id) ? `/admin/feeds/drafts/${encodeURIComponent(toHex(draft._id) as string)}` : null,
      swipesHref: toHex(draft._id) ? `/swipes?fromDraft=${encodeURIComponent(toHex(draft._id) as string)}` : null,
      anlassraumHref: roomId ? `/runden?anlassraumId=${encodeURIComponent(roomId)}` : null,
      reviewHint: "Feed-Radar erzeugt nur einen Vorschlag. Dossier-Übernahme bleibt ein eigener Review-Schritt.",
      riskHint,
      nextAction: "Feed-Hinweis mit Quellenlage und Anlassraum-Kontext abgleichen.",
      statementId,
      createdAt: draft.createdAt ?? new Date(),
      updatedAt: draft.updatedAt ?? draft.publishedAt ?? draft.createdAt ?? new Date(),
    });
  }

  for (const proposal of input.swipeProposals) {
    const hasStance = Boolean(normalizeString(proposal.stance));
    const section: DossierUpdateSection = hasStance ? "perspective" : "claim";
    const proposalId = toHex(proposal._id) ?? normalizeString(proposal.title) ?? "proposal";
    const roomId = normalizeString(proposal.anlassraumId);
    seeds.push({
      suggestionId: `du:swipe:${proposalId}`,
      type: typeFromSection(section),
      title:
        normalizeString(proposal.title) ??
        normalizeString(proposal.topic) ??
        "Statement-Vorschlag",
      summary:
        normalizeString(proposal.text) ??
        "Aussage aus Swipes beziehungsweise Statement-Vorschlag.",
      origin: "swipe",
      section,
      sourceHref: proposalId ? `/statements/${encodeURIComponent(proposalId)}` : null,
      swipesHref: proposalId ? `/swipes/${encodeURIComponent(proposalId)}` : null,
      anlassraumHref: roomId ? `/runden?anlassraumId=${encodeURIComponent(roomId)}` : null,
      reviewHint: "Aus Swipes oder Statement-Vorschlag. Keine automatische Dossierfreigabe.",
      riskHint:
        hasStance
          ? "Perspektivische Aussage: als Sichtweise markieren, nicht als amtliche Wahrheit."
          : "Bürgeraussage bleibt ein Vorschlag und braucht bewusste Einordnung.",
      nextAction: "Als Claim oder Perspektive übernehmen und mit Quellenlage abgleichen.",
      statementId,
      createdAt: proposal.createdAt ?? new Date(),
      updatedAt: proposal.createdAt ?? new Date(),
    });
  }

  for (const room of input.anlassraeume) {
    const roomId = toHex(room._id);
    const roomStatus = normalizeString(room.status) ?? "draft";
    seeds.push({
      suggestionId: `du:anlassraum:${roomId ?? room.title ?? "room"}`,
      type: "update",
      title: normalizeString(room.title) ?? "Anlassraum-Update",
      summary:
        normalizeString(room.summary) ??
        "Anlassraum-Signal ohne zusätzliche Kurzbeschreibung.",
      origin: "anlassraum",
      section: roomStatus === "closed" || roomStatus === "archived" ? "result" : "update",
      sourceHref: roomId ? `/runden?anlassraumId=${encodeURIComponent(roomId)}` : null,
      swipesHref: statementId ? `/swipes/${encodeURIComponent(statementId)}` : null,
      anlassraumHref: roomId ? `/runden?anlassraumId=${encodeURIComponent(roomId)}` : null,
      reviewHint: "Der Anlassraum liefert Kontext und Verlauf, aber keine automatische Dossierfreigabe.",
      riskHint:
        Array.isArray(room.riskFlags) && room.riskFlags.length > 0
          ? `Anlassraum-Risiken: ${room.riskFlags.slice(0, 3).join(", ")}.`
          : "Anlassraumbezug ist sichtbar, aber Review bleibt Pflicht.",
      nextAction: "Anlassraumstand mit Quellen, offenen Fragen und Ergebnisbezug abgleichen.",
      statementId,
      relatedAnlassraumTitle: normalizeString(room.title),
      createdAt: room.createdAt ?? new Date(),
      updatedAt: room.updatedAt ?? room.createdAt ?? new Date(),
    });
  }

  for (const claim of input.evidenceClaims) {
    seeds.push({
      suggestionId: `du:evidence:${claim.claimId}`,
      type: "claim",
      title: "Evidenzhinweis aus dem Wissensgraphen",
      summary: claim.text,
      origin: "evidence",
      section: "claim",
      sourceHref: null,
      swipesHref: statementId ? `/swipes/${encodeURIComponent(statementId)}` : null,
      anlassraumHref: null,
      reviewHint: "Der Evidenzgraph liefert nur einen Hinweis. Dossier-Übernahme bleibt Review-Sache.",
      riskHint:
        normalizeString(claim.sourceType) === "feed"
          ? "Hinweis stammt aus einem Feed-Signal und ist nicht automatisch verifiziert."
          : "Hinweis aus abgeleiteter Evidenz. Quellenlage weiter prüfen.",
      nextAction: "Claim gegen vorhandene Quellenlage und offene Fragen spiegeln.",
      statementId,
      createdAt: claim.createdAt ?? new Date(),
      updatedAt: claim.updatedAt ?? claim.createdAt ?? new Date(),
    });
  }

  return seeds;
}

function buildSuggestionPayload(seed: DerivedSuggestionSeed): Record<string, unknown> {
  return {
    title: seed.title,
    summary: seed.summary,
    origin: seed.origin,
    section: seed.section,
    sourceHref: seed.sourceHref ?? null,
    swipesHref: seed.swipesHref ?? null,
    anlassraumHref: seed.anlassraumHref ?? null,
    reviewHint: seed.reviewHint,
    riskHint: seed.riskHint,
    nextAction: seed.nextAction,
    statementId: seed.statementId,
    relatedAnlassraumTitle: seed.relatedAnlassraumTitle ?? null,
  } satisfies DossierSuggestionPayload;
}

function statusNeedsReview(status: DossierUpdateStatus): boolean {
  return !(
    status === "published_in_dossier" ||
    status === "attached_to_dossier" ||
    status === "accepted" ||
    status === "rejected" ||
    status === "archived" ||
    status === "superseded"
  );
}

export function mapDossierSuggestionDocToUpdateSuggestion(
  doc: DossierSuggestionDoc,
  context: RuntimeContext,
): DossierUpdateSuggestion {
  const payload = ((doc.payload ?? {}) as DossierSuggestionPayload) ?? {};
  const section = payload.section ?? sectionFromSuggestionType(doc.type);
  const origin = payload.origin ?? "manual";
  const status = resolveDossierUpdateStatus({
    moderationStatus: doc.status,
    section,
    publicVisible: context.publicVisible,
    attachedToDossier: true,
    archived: context.archived || payload.archived === true,
    superseded: payload.superseded === true,
    hasError: payload.hasError === true,
  });
  const meta = resolveDossierUpdateStatusMeta(status);
  return {
    id: doc.suggestionId,
    dossierId: doc.dossierId,
    statementId: payload.statementId ?? context.dossier.statementId,
    title: normalizeString(payload.title) ?? `${dossierUpdateSectionLabel(section)} · ${dossierUpdateOriginLabel(origin)}`,
    summary:
      normalizeString(payload.summary) ??
      normalizeString((doc.payload as Record<string, unknown> | undefined)?.text) ??
      "Reviewpflichtiger Dossier-Vorschlag ohne Kurzbeschreibung.",
    origin,
    originLabel: dossierUpdateOriginLabel(origin),
    section,
    sectionLabel: dossierUpdateSectionLabel(section),
    status,
    statusLabel: meta.label,
    statusDescription: meta.description,
    tone: meta.tone,
    moderationStatus: doc.status,
    reviewRequired: statusNeedsReview(status),
    reviewHint:
      normalizeString(payload.reviewHint) ??
      "Reviewpflichtiger Vorschlag. Keine automatische Veröffentlichung.",
    riskHint:
      normalizeString(payload.riskHint) ??
      "Ohne Review keine automatische Übernahme in den öffentlichen Dossierstand.",
    nextAction:
      normalizeString(payload.nextAction) ??
      (doc.status === "pending"
        ? "Im Admin-Dossier prüfen und bewusst übernehmen oder ablehnen."
        : "Verlauf und Dossierstand weiter beobachten."),
    dossierHref: `/dossier/${encodeURIComponent(doc.dossierId)}`,
    anlassraumHref: normalizeString(payload.anlassraumHref),
    swipesHref: normalizeString(payload.swipesHref),
    sourceHref: normalizeString(payload.sourceHref),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function buildDossierPublicUpdateContext(params: {
  dossierId: string;
  items: DossierUpdateSuggestion[];
  publicVisible: boolean;
  archived: boolean;
  relatedAnlassraum: AnlassraumSnapshot | null;
  statementId: string;
}): DossierPublicUpdateContext {
  const items = sortByNewest(params.items);
  const publishedItems = items.filter((item) =>
    item.status === "published_in_dossier" ||
    item.status === "attached_to_dossier" ||
    item.status === "accepted",
  );
  const reviewItems = items.filter((item) => item.reviewRequired);

  const originSummary = Array.from(
    items.reduce((map, item) => {
      map.set(item.origin, (map.get(item.origin) ?? 0) + 1);
      return map;
    }, new Map<DossierUpdateOrigin, number>()),
  )
    .map(([origin, count]) => ({ origin, label: dossierUpdateOriginLabel(origin), count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

  const sectionSummary = Array.from(
    items.reduce((map, item) => {
      map.set(item.section, (map.get(item.section) ?? 0) + 1);
      return map;
    }, new Map<DossierUpdateSection, number>()),
  )
    .map(([section, count]) => ({ section, label: dossierUpdateSectionLabel(section), count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

  const relatedRoomId = toHex(params.relatedAnlassraum?._id);
  const relatedRoomTitle = normalizeString(params.relatedAnlassraum?.title);

  return {
    checkedStandLabel: params.archived
      ? "Archivierter Dossierstand"
      : params.publicVisible
        ? "Geprüfter und sichtbarer Arbeitsstand"
        : "Interner Arbeitsstand",
    checkedStandHint: params.archived
      ? "Das Dossier bleibt dokumentiert, ist aber kein aktiver Folgepfad mehr."
      : params.publicVisible
        ? "Öffentlich sichtbar ist nur der aktuelle Arbeitsstand. Neue Hinweise bleiben separat in Prüfung."
        : "Ohne sichtbare Viewer-Fassung bleibt das Dossier intern und reviewpflichtig.",
    latestPublicUpdateAt: publishedItems[0]?.updatedAt ?? null,
    latestReviewUpdateAt: reviewItems[0]?.updatedAt ?? null,
    publishedItems: publishedItems.slice(0, 3),
    reviewItems: reviewItems.slice(0, 4),
    originSummary,
    sectionSummary,
    relatedContext: {
      dossierHref: `/dossier/${encodeURIComponent(params.dossierId)}`,
      anlassraumHref: relatedRoomId ? `/runden?anlassraumId=${encodeURIComponent(relatedRoomId)}` : null,
      anlassraumLabel: relatedRoomTitle
        ? `Beteiligung läuft im Anlassraum „${relatedRoomTitle}“`
        : null,
      swipesHref: params.statementId ? `/swipes/${encodeURIComponent(params.statementId)}` : null,
      swipesLabel: params.statementId ? "Zur passenden Swipe-Karte" : null,
    },
  };
}

async function materializeDerivedSuggestions(params: {
  dossier: DossierDoc;
  seeds: DerivedSuggestionSeed[];
}) {
  const col = await dossierSuggestionsCol();
  for (const seed of params.seeds) {
    await col.updateOne(
      { dossierId: params.dossier.dossierId, suggestionId: seed.suggestionId },
      {
        $set: {
          type: seed.type,
          payload: buildSuggestionPayload(seed),
          updatedAt: seed.updatedAt,
        },
        $setOnInsert: {
          suggestionId: seed.suggestionId,
          dossierId: params.dossier.dossierId,
          status: "pending",
          createdAt: seed.createdAt,
        },
      },
      { upsert: true },
    );
  }
}

async function loadFeedDraftsForRooms(roomIds: string[]) {
  if (roomIds.length === 0) return [] as VoteDraftDoc[];
  return (await (await voteDraftsCol())
    .find({
      anlassraumId: { $in: roomIds.map((id) => new ObjectId(id)) },
      status: { $in: ["draft", "review", "published"] },
    } as Record<string, unknown>)
    .sort({ updatedAt: -1, publishedAt: -1, createdAt: -1 })
    .limit(12)
    .toArray()) as VoteDraftDoc[];
}

async function loadSwipeProposalsForDossier(dossierId: string) {
  const col = await getCol<StatementProposalDoc>("statement_proposals");
  return col
    .find({ dossierId, status: { $in: ["proposed", null] } } as Record<string, unknown>)
    .sort({ createdAt: -1 })
    .limit(12)
    .toArray();
}

async function loadEvidenceClaimsForStatement(statementId: string) {
  return (await (await evidenceClaimsCol())
    .find({ "sourceRef.statementId": statementId } as Record<string, unknown>)
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(12)
    .project({
      claimId: 1,
      text: 1,
      sourceType: 1,
      updatedAt: 1,
      createdAt: 1,
    })
    .toArray()) as Array<{
    claimId: string;
    text: string;
    sourceType?: string | null;
    updatedAt?: Date | null;
    createdAt?: Date | null;
  }>;
}

export async function buildDossierUpdateReadModel(input: {
  dossierId: string;
  materialize?: boolean;
  publicVisible?: boolean;
}): Promise<DossierUpdateReadModel | null> {
  const dossier = await findDossierByAnyId(input.dossierId);
  if (!dossier) return null;

  const dossierObjectId = toHex(dossier._id);
  const archived = dossier.status === "archived";
  const publicVisible = input.publicVisible ?? false;
  const roomFilter =
    dossierObjectId && ObjectId.isValid(dossierObjectId)
      ? { dossierId: new ObjectId(dossierObjectId) }
      : { dossierId: null };
  const anlassraeume = dossierObjectId
    ? ((await (await anlassraumCol())
        .find(roomFilter as Record<string, unknown>)
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(8)
        .toArray()) as AnlassraumSnapshot[])
    : [];
  const roomIds = anlassraeume
    .map((room) => toHex(room._id))
    .filter((value): value is string => Boolean(value));

  const [createHandoffs, feedDrafts, swipeProposals, evidenceClaims] = await Promise.all([
    listPersistedCreateHandoffRecords(),
    loadFeedDraftsForRooms(roomIds),
    loadSwipeProposalsForDossier(dossier.dossierId),
    loadEvidenceClaimsForStatement(dossier.statementId),
  ]);

  const seeds = createDerivedDossierUpdateSeeds({
    dossier,
    createHandoffs,
    feedDrafts,
    swipeProposals,
    anlassraeume,
    evidenceClaims,
  });

  if (input.materialize !== false && seeds.length > 0) {
    await materializeDerivedSuggestions({ dossier, seeds });
  }

  const suggestionDocs = await (await dossierSuggestionsCol())
    .find({ dossierId: dossier.dossierId })
    .sort({ status: 1, updatedAt: -1, createdAt: -1 })
    .toArray();

  const relatedAnlassraum = anlassraeume[0] ?? null;
  const runtimeContext: RuntimeContext = {
    dossier,
    publicVisible,
    archived,
    relatedAnlassraum,
  };
  const items = sortByNewest(
    suggestionDocs.map((doc) => mapDossierSuggestionDocToUpdateSuggestion(doc, runtimeContext)),
  );
  const publicContext = buildDossierPublicUpdateContext({
    dossierId: dossier.dossierId,
    items,
    publicVisible,
    archived,
    relatedAnlassraum,
    statementId: dossier.statementId,
  });

  return {
    dossierId: dossier.dossierId,
    statementId: dossier.statementId,
    items,
    publicContext,
    summary: {
      total: items.length,
      reviewRequired: items.filter((item) => item.reviewRequired).length,
      published: items.filter((item) => item.status === "published_in_dossier").length,
      rejected: items.filter((item) => item.status === "rejected").length,
    },
  };
}

export async function getLatestDossierUpdateSummaryByDossierIds(dossierIds: string[]) {
  const ids = Array.from(new Set(dossierIds.map((value) => normalizeString(value)).filter(Boolean)));
  if (ids.length === 0) return new Map<string, { label: string; updatedAt: string | null }>();

  const docs = await (await dossiersCol())
    .find({ dossierId: { $in: ids } } as Record<string, unknown>, {
      projection: { dossierId: 1, updatedAt: 1, lastRevisionAt: 1, status: 1 } as Record<string, 1>,
    })
    .toArray();

  return new Map(
    docs.map((doc) => {
      const updatedAt = toIso(doc.lastRevisionAt ?? doc.updatedAt ?? doc.createdAt ?? null);
      const label = doc.status === "archived" ? "Dossier archiviert" : "Dossier-Kontext aktiv";
      return [doc.dossierId, { label, updatedAt }] as const;
    }),
  );
}

export function dossierUpdateSwipesHrefForStatement(statementId: string | null | undefined) {
  const normalized = normalizeString(statementId);
  if (!normalized) return null;
  if (normalized.startsWith("create-handoff:")) {
    return `/swipes?from=create&claim=${encodeURIComponent(normalized)}`;
  }
  if (normalized.startsWith("seed-")) {
    return `/swipes?statementId=${encodeURIComponent(normalized)}`;
  }
  return `/swipes/${encodeURIComponent(normalized)}`;
}

export function dossierUpdateCreateFallbackStatementId(record: PersistedCreateHandoffRecord) {
  return persistedCreateHandoffStatementId(record.id);
}
