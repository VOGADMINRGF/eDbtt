import {
  listContentReleaseAuditEventsForRecords,
  listContentReleaseTargetsByType,
  type ContentReleaseAuditEvent,
  type ContentReleaseTargetRecord,
} from "@features/contentReleaseWorkbench";
import {
  getDossierStudioWorkspaceRepo,
  type DossierStudioWorkspace,
  type DossierStudioWorkspaceAuditEvent,
} from "@features/dossier/server/studioPersistence";
import {
  listReviewQueueOperationAuditEventsForItems,
  listReviewQueueOperationRecords,
  reviewQueueOperationActionLabel,
  type ReviewQueueOperationAuditEvent,
} from "@features/reviewQueueOperations";
import {
  getParticipationSignalReviewRuntimeRepo,
  listParticipationSignalsForReviewRuntime,
  type RegionParticipationSignalAuditEvent,
  type RegionParticipationSignalRecord,
} from "@features/region/server/participationSignalReviewRuntime";
import { listRegionSourceTestResults } from "@features/region/server/sourceConnectionRuntime";
import {
  canViewRegionResource,
  type RegionScopeContext,
  type OrganizationScopeStatus,
} from "@features/region/scope";
import { listOperationalRegions } from "@features/region/store";
import {
  listPersistedCreateHandoffRecords,
  type PersistedCreateHandoffRecord,
} from "@/features/create/persistedHandoffReviewQueue";

export const UNIFIED_AUDIT_EVENT_SOURCES = [
  "create_handoff",
  "review_queue_operation",
  "source_result",
  "content_release",
  "official_release",
  "workspace",
] as const;

export type UnifiedAuditEventSource = (typeof UNIFIED_AUDIT_EVENT_SOURCES)[number];

export const UNIFIED_AUDIT_EVENT_TYPES = [
  "create_handoff_persisted",
  "review_operation_applied",
  "source_result_created",
  "content_release_prepared",
  "visibility_made_public",
  "visibility_revoked",
  "content_archived",
  "official_release_granted",
  "official_release_revoked",
] as const;

export type UnifiedAuditEventType = (typeof UNIFIED_AUDIT_EVENT_TYPES)[number];

export type UnifiedAuditActor = {
  userId: string | null;
  label: string;
  authority: string | null;
};

export type UnifiedAuditScope = {
  mode: "global_operator" | "region" | "organization";
  organizationId: string | null;
  regionId: string | null;
  ownerUserId: string | null;
  operatorModeLabel: string | null;
  status: OrganizationScopeStatus | null;
  isGlobal: boolean;
};

export type UnifiedAuditEvent = {
  id: string;
  source: UnifiedAuditEventSource;
  type: UnifiedAuditEventType;
  itemId: string | null;
  at: string;
  title: string;
  detail: string;
  note: string | null;
  actor: UnifiedAuditActor;
  scope: UnifiedAuditScope;
  regionId: string | null;
  organizationId: string | null;
  ownerUserId: string | null;
  sourceRecordId: string | null;
  targetId: string | null;
  targetType: string | null;
};

export type UnifiedAuditReadModel = {
  events: UnifiedAuditEvent[];
  total: number;
  scope: UnifiedAuditScope;
  guardrails: {
    readOnly: true;
    noAutoPublish: true;
    noAutoPublicOfficial: true;
  };
};

export type ListUnifiedAuditEventsQuery = {
  scope?: RegionScopeContext;
  itemIds?: string[];
  itemResources?: Record<
    string,
    {
      organizationId?: string | null;
      regionId?: string | null;
      ownerUserId?: string | null;
    }
  >;
  organizationId?: string | null;
  regionId?: string | null;
  limit?: number;
};

type ItemIdBuckets = {
  all: string[];
  regionSourceResultIds: string[];
  createHandoffIds: string[];
  officialSignalIds: string[];
  officialWorkspaceIds: string[];
  includesReviewQueueItems: boolean;
};

const REGION_SOURCE_RESULT_PREFIX = "region_source_result:";
const CREATE_HANDOFF_ITEM_PREFIX = "create_handoff:persisted:";
const OFFICIAL_SIGNAL_ITEM_PREFIX = "public_official_approval:signal:";
const OFFICIAL_WORKSPACE_ITEM_PREFIX = "public_official_approval:workspace:";

const READSIDE_GUARDRAILS: UnifiedAuditReadModel["guardrails"] = {
  readOnly: true,
  noAutoPublish: true,
  noAutoPublicOfficial: true,
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function normalizeOptionalString(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function buildViewerScope(scope?: RegionScopeContext): UnifiedAuditScope {
  if (!scope) {
    return {
      mode: "global_operator",
      organizationId: null,
      regionId: null,
      ownerUserId: null,
      operatorModeLabel: null,
      status: null,
      isGlobal: true,
    };
  }
  return {
    mode: scope.isAdmin ? "global_operator" : scope.visibleRegionIds.length > 0 ? "region" : "organization",
    organizationId: scope.primaryOrganizationId ?? null,
    regionId: scope.visibleRegionIds[0] ?? null,
    ownerUserId: scope.userId ?? null,
    operatorModeLabel: scope.operatorModeLabel,
    status: scope.status,
    isGlobal: scope.isAdmin,
  };
}

function eventScopeFor(input: {
  organizationId?: string | null;
  regionId?: string | null;
  ownerUserId?: string | null;
}): UnifiedAuditScope {
  const regionId = normalizeOptionalString(input.regionId);
  const organizationId = normalizeOptionalString(input.organizationId);
  const ownerUserId = normalizeOptionalString(input.ownerUserId);
  return {
    mode: regionId ? "region" : organizationId ? "organization" : "organization",
    organizationId,
    regionId,
    ownerUserId,
    operatorModeLabel: null,
    status: null,
    isGlobal: false,
  };
}

function sortChronologically(events: UnifiedAuditEvent[]) {
  return [...events].sort((left, right) => String(left.at).localeCompare(String(right.at)));
}

function takeMostRecentChronologically(events: UnifiedAuditEvent[], limit?: number) {
  if (!limit || limit <= 0) return sortChronologically(events);
  return sortChronologically(events).slice(-limit);
}

function bucketItemIds(itemIds?: string[]): ItemIdBuckets {
  const all = uniqueNonEmpty(itemIds ?? []);
  return {
    all,
    regionSourceResultIds: all
      .filter((itemId) => itemId.startsWith(REGION_SOURCE_RESULT_PREFIX))
      .map((itemId) => itemId.slice(REGION_SOURCE_RESULT_PREFIX.length)),
    createHandoffIds: all
      .filter((itemId) => itemId.startsWith(CREATE_HANDOFF_ITEM_PREFIX))
      .map((itemId) => itemId.slice(CREATE_HANDOFF_ITEM_PREFIX.length)),
    officialSignalIds: all
      .filter((itemId) => itemId.startsWith(OFFICIAL_SIGNAL_ITEM_PREFIX))
      .map((itemId) => itemId.slice(OFFICIAL_SIGNAL_ITEM_PREFIX.length)),
    officialWorkspaceIds: all
      .filter((itemId) => itemId.startsWith(OFFICIAL_WORKSPACE_ITEM_PREFIX))
      .map((itemId) => itemId.slice(OFFICIAL_WORKSPACE_ITEM_PREFIX.length)),
    includesReviewQueueItems: all.length > 0,
  };
}

function matchesExplicitItemFilter(itemId: string | null, itemIds: string[]) {
  if (itemIds.length === 0) return true;
  if (!itemId) return false;
  return itemIds.includes(itemId);
}

function matchesOrganizationFilter(event: UnifiedAuditEvent, organizationId?: string | null) {
  const normalized = normalizeOptionalString(organizationId);
  if (!normalized) return true;
  return event.organizationId === normalized;
}

function matchesRegionFilter(event: UnifiedAuditEvent, regionId?: string | null) {
  const normalized = normalizeOptionalString(regionId);
  if (!normalized) return true;
  return event.regionId === normalized;
}

function viewerCanSeeEvent(scope: RegionScopeContext | undefined, event: UnifiedAuditEvent) {
  if (!scope) return true;
  return canViewRegionResource(scope, {
    ownerUserId: event.ownerUserId,
    organizationId: event.organizationId,
    regionId: event.regionId,
  });
}

function filterEvents(events: UnifiedAuditEvent[], query: ListUnifiedAuditEventsQuery) {
  const itemIds = uniqueNonEmpty(query.itemIds ?? []);
  return events.filter((event) => {
    if (!matchesExplicitItemFilter(event.itemId, itemIds)) return false;
    if (!matchesOrganizationFilter(event, query.organizationId)) return false;
    if (!matchesRegionFilter(event, query.regionId)) return false;
    if (!viewerCanSeeEvent(query.scope, event)) return false;
    return true;
  });
}

function applyItemResourceScopes(
  events: UnifiedAuditEvent[],
  itemResources?: ListUnifiedAuditEventsQuery["itemResources"],
) {
  const inferred = new Map<
    string,
    {
      organizationId: string | null;
      regionId: string | null;
      ownerUserId: string | null;
    }
  >();

  for (const [itemId, resource] of Object.entries(itemResources ?? {})) {
    inferred.set(itemId, {
      organizationId: normalizeOptionalString(resource.organizationId),
      regionId: normalizeOptionalString(resource.regionId),
      ownerUserId: normalizeOptionalString(resource.ownerUserId),
    });
  }

  for (const event of events) {
    if (!event.itemId) continue;
    const existing = inferred.get(event.itemId);
    if (existing) continue;
    if (!event.organizationId && !event.regionId && !event.ownerUserId) continue;
    inferred.set(event.itemId, {
      organizationId: event.organizationId,
      regionId: event.regionId,
      ownerUserId: event.ownerUserId,
    });
  }

  return events.map((event) => {
    if (event.source !== "review_queue_operation" || !event.itemId) return event;
    const resource = inferred.get(event.itemId);
    if (!resource) return event;
    return {
      ...event,
      scope: eventScopeFor(resource),
      organizationId: resource.organizationId,
      regionId: resource.regionId,
      ownerUserId: resource.ownerUserId,
    };
  });
}

function createHandoffItemId(recordId: string) {
  return `${CREATE_HANDOFF_ITEM_PREFIX}${recordId}`;
}

function sourceResultItemId(resultId: string) {
  return `${REGION_SOURCE_RESULT_PREFIX}${resultId}`;
}

function officialSignalItemId(signalId: string) {
  return `${OFFICIAL_SIGNAL_ITEM_PREFIX}${signalId}`;
}

function officialWorkspaceItemId(workspaceId: string) {
  return `${OFFICIAL_WORKSPACE_ITEM_PREFIX}${workspaceId}`;
}

function actorLabel(userId: string | null, authority?: string | null) {
  if (authority) return `${userId ?? "unbekannt"} · ${authority}`;
  return userId ?? "unbekannt";
}

function contentReleaseEventType(
  action: ContentReleaseAuditEvent["action"],
): UnifiedAuditEventType | null {
  switch (action) {
    case "prepared":
      return "content_release_prepared";
    case "visibility_made_public":
      return "visibility_made_public";
    case "visibility_retracted":
      return "visibility_revoked";
    case "archived":
      return "content_archived";
    case "publication_prepared":
    default:
      return null;
  }
}

function unifiedTitle(type: UnifiedAuditEventType) {
  switch (type) {
    case "create_handoff_persisted":
      return "Create-Handoff gespeichert";
    case "review_operation_applied":
      return "Review-Operation angewendet";
    case "source_result_created":
      return "Quellen-Testresultat gespeichert";
    case "content_release_prepared":
      return "Content Release vorbereitet";
    case "visibility_made_public":
      return "Sichtbarkeit freigegeben";
    case "visibility_revoked":
      return "Sichtbarkeit zurückgenommen";
    case "content_archived":
      return "Inhalt archiviert";
    case "official_release_granted":
      return "Official Release erteilt";
    case "official_release_revoked":
      return "Official Release entzogen";
    default:
      return type;
  }
}

function contentReleaseTargetLabel(targetType: ContentReleaseTargetRecord["targetType"]) {
  switch (targetType) {
    case "dossier":
      return "Dossier";
    case "anlassraum":
      return "Anlassraum";
    case "topic_page":
      return "Themenseite";
    default:
      return targetType;
  }
}

async function listCreateHandoffUnifiedEvents(
  buckets: ItemIdBuckets,
): Promise<UnifiedAuditEvent[]> {
  if (buckets.all.length > 0 && buckets.createHandoffIds.length === 0) return [];
  const records = await listPersistedCreateHandoffRecords().catch(
    () => [] as PersistedCreateHandoffRecord[],
  );
  return records
    .filter((record) =>
      buckets.createHandoffIds.length > 0 ? buckets.createHandoffIds.includes(record.id) : true,
    )
    .map((record) => ({
      id: `unified:create_handoff:${record.id}:${record.createdAt}`,
      source: "create_handoff" as const,
      type: "create_handoff_persisted" as const,
      itemId: createHandoffItemId(record.id),
      at: record.createdAt,
      title: unifiedTitle("create_handoff_persisted"),
      detail: record.resumeHref,
      note: null,
      actor: {
        userId: record.createdByUserId,
        label: actorLabel(record.createdByUserId),
        authority: null,
      },
      scope: eventScopeFor({
        organizationId: record.organizationId,
        regionId: record.regionId,
        ownerUserId: record.createdByUserId,
      }),
      regionId: record.regionId ?? null,
      organizationId: record.organizationId ?? null,
      ownerUserId: record.createdByUserId,
      sourceRecordId: record.id,
      targetId: record.dossierId ?? record.anlassraumId ?? null,
      targetType: record.dossierId ? "dossier" : record.anlassraumId ? "anlassraum" : null,
    }));
}

async function listSourceResultUnifiedEvents(
  buckets: ItemIdBuckets,
): Promise<UnifiedAuditEvent[]> {
  if (buckets.all.length > 0 && buckets.regionSourceResultIds.length === 0) return [];
  const results = await listRegionSourceTestResults({ limit: 2000 }).catch(() => []);
  return results
    .filter((result) =>
      buckets.regionSourceResultIds.length > 0
        ? buckets.regionSourceResultIds.includes(result.id)
        : true,
    )
    .map((result) => ({
      id: `unified:source_result:${result.id}:${result.createdAt}`,
      source: "source_result" as const,
      type: "source_result_created" as const,
      itemId: sourceResultItemId(result.id),
      at: result.createdAt,
      title: unifiedTitle("source_result_created"),
      detail: result.title,
      note: null,
      actor: {
        userId: result.testedBy ?? null,
        label: actorLabel(result.testedBy ?? null),
        authority: null,
      },
      scope: eventScopeFor({
        organizationId: result.organizationId ?? null,
        regionId: result.regionId,
      }),
      regionId: result.regionId,
      organizationId: result.organizationId ?? null,
      ownerUserId: null,
      sourceRecordId: result.id,
      targetId: result.connectionId,
      targetType: "source_connection",
    }));
}

async function listReviewQueueOperationUnifiedEvents(
  buckets: ItemIdBuckets,
): Promise<UnifiedAuditEvent[]> {
  const itemIds =
    buckets.includesReviewQueueItems && buckets.all.length > 0
      ? buckets.all
      : (await listReviewQueueOperationRecords()).map((record) => record.itemId);
  if (itemIds.length === 0) return [];
  const auditByItem = await listReviewQueueOperationAuditEventsForItems(itemIds, 20);
  return Object.entries(auditByItem).flatMap(([itemId, events]) =>
    (events ?? []).map((event) => ({
      id: `unified:review_operation:${event.id}`,
      source: "review_queue_operation" as const,
      type: "review_operation_applied" as const,
      itemId,
      at: event.at,
      title: unifiedTitle("review_operation_applied"),
      detail: reviewQueueOperationActionLabel(event.action),
      note: event.note ?? null,
      actor: {
        userId: event.byUserId,
        label: actorLabel(event.byUserId),
        authority: null,
      },
      scope: eventScopeFor({}),
      regionId: null,
      organizationId: null,
      ownerUserId: null,
      sourceRecordId: event.itemId,
      targetId: event.itemId,
      targetType: "review_queue_item",
    })),
  );
}

async function listContentReleaseUnifiedEvents(
  buckets: ItemIdBuckets,
): Promise<UnifiedAuditEvent[]> {
  const needsContentRelease =
    buckets.all.length === 0 ||
    buckets.regionSourceResultIds.length > 0 ||
    buckets.createHandoffIds.length > 0;
  if (!needsContentRelease) return [];

  const records = (
    await Promise.all([
      listContentReleaseTargetsByType("dossier"),
      listContentReleaseTargetsByType("anlassraum"),
      listContentReleaseTargetsByType("topic_page"),
    ])
  ).flatMap((entries) => entries);

  const filteredRecords = records.filter((record) =>
    buckets.all.length > 0 ? buckets.all.includes(record.sourceReviewItemId) : true,
  );
  if (filteredRecords.length === 0) return [];
  const recordById = new Map(filteredRecords.map((record) => [record.id, record]));
  const auditByRecord = await listContentReleaseAuditEventsForRecords(
    filteredRecords.map((record) => record.id),
    20,
  );
  return Object.entries(auditByRecord).flatMap(([recordId, events]) => {
    const record = recordById.get(recordId);
    if (!record) return [];
    const mapped = (events ?? [])
      .map((event) => {
        const type = contentReleaseEventType(event.action);
        if (!type) return null;
        return {
          id: `unified:content_release:${event.id}`,
          source: "content_release" as const,
          type,
          itemId: record.sourceReviewItemId,
          at: event.at,
          title: unifiedTitle(type),
          detail: `${contentReleaseTargetLabel(record.targetType)} · ${record.title}`,
          note: event.note ?? null,
          actor: {
            userId: event.byUserId,
            label: actorLabel(event.byUserId),
            authority: null,
          },
          scope: eventScopeFor({
            organizationId: record.organizationId ?? null,
            regionId: record.regionId ?? null,
          }),
          regionId: record.regionId ?? null,
          organizationId: record.organizationId ?? null,
          ownerUserId: null,
          sourceRecordId: record.id,
          targetId: record.targetId,
          targetType: record.targetType,
        } as UnifiedAuditEvent;
      })
      .filter((event): event is NonNullable<typeof event> => Boolean(event));
    return mapped;
  });
}

function mapParticipationOfficialEvent(
  record: RegionParticipationSignalRecord,
  event: RegionParticipationSignalAuditEvent,
): UnifiedAuditEvent | null {
  if (event.eventType !== "official_approved" && event.eventType !== "official_revoked") {
    return null;
  }
  const type =
    event.eventType === "official_approved"
      ? "official_release_granted"
      : "official_release_revoked";
  return {
    id: `unified:official_signal:${event.id}`,
    source: "official_release",
    type,
    itemId: officialSignalItemId(record.id),
    at: event.createdAt,
    title: unifiedTitle(type),
    detail: record.publicSafeTitle ?? record.title,
    note: event.note ?? null,
    actor: {
      userId: event.createdBy,
      label: actorLabel(event.createdBy, event.authority ?? null),
      authority: event.authority ?? null,
    },
    scope: eventScopeFor({
      organizationId: null,
      regionId: record.regionId ?? event.regionId ?? null,
    }),
    regionId: record.regionId ?? event.regionId ?? null,
    organizationId: null,
    ownerUserId: null,
    sourceRecordId: record.id,
    targetId: record.id,
    targetType: "participation_signal",
  };
}

async function listOfficialSignalUnifiedEvents(
  buckets: ItemIdBuckets,
): Promise<UnifiedAuditEvent[]> {
  if (buckets.all.length > 0 && buckets.officialSignalIds.length === 0) return [];
  const regions = await listOperationalRegions().catch(() => []);
  const records = await listParticipationSignalsForReviewRuntime({
    regions,
    query: { reviewStatus: "all", limit: 2000 },
  }).catch(() => [] as RegionParticipationSignalRecord[]);
  const filteredRecords = records.filter((record) =>
    buckets.officialSignalIds.length > 0 ? buckets.officialSignalIds.includes(record.id) : true,
  );
  if (filteredRecords.length === 0) return [];
  const repo = getParticipationSignalReviewRuntimeRepo();
  const auditByRecord = await Promise.all(
    filteredRecords.map(async (record) => ({
      record,
      events: await repo.listParticipationSignalAuditEvents(record.id).catch(
        () => [] as RegionParticipationSignalAuditEvent[],
      ),
    })),
  );
  return auditByRecord.flatMap(({ record, events }) =>
    events
      .map((event) => mapParticipationOfficialEvent(record, event))
      .filter((event): event is UnifiedAuditEvent => Boolean(event)),
  );
}

function mapWorkspaceOfficialEvent(
  workspace: DossierStudioWorkspace,
  event: DossierStudioWorkspaceAuditEvent,
): UnifiedAuditEvent | null {
  if (event.action !== "official_approved" && event.action !== "official_revoked") {
    return null;
  }
  const type =
    event.action === "official_approved"
      ? "official_release_granted"
      : "official_release_revoked";
  return {
    id: `unified:official_workspace:${event.id}`,
    source: "workspace",
    type,
    itemId: officialWorkspaceItemId(workspace.id),
    at: event.at,
    title: unifiedTitle(type),
    detail: workspace.title,
    note: event.note ?? null,
    actor: {
      userId: event.byUserId,
      label: actorLabel(event.byUserId, event.authority ?? null),
      authority: event.authority ?? null,
    },
    scope: eventScopeFor({
      organizationId: workspace.organizationId ?? null,
      regionId: workspace.regionId ?? null,
    }),
    regionId: workspace.regionId ?? null,
    organizationId: workspace.organizationId ?? null,
    ownerUserId: null,
    sourceRecordId: workspace.id,
    targetId: workspace.dossierId,
    targetType: "dossier_workspace",
  };
}

async function listOfficialWorkspaceUnifiedEvents(
  buckets: ItemIdBuckets,
): Promise<UnifiedAuditEvent[]> {
  if (buckets.all.length > 0 && buckets.officialWorkspaceIds.length === 0) return [];
  const repo = getDossierStudioWorkspaceRepo();
  const workspaces = await repo.listDossierStudioWorkspaces().catch(
    () => [] as DossierStudioWorkspace[],
  );
  const filteredWorkspaces = workspaces.filter((workspace) =>
    buckets.officialWorkspaceIds.length > 0
      ? buckets.officialWorkspaceIds.includes(workspace.id)
      : true,
  );
  if (filteredWorkspaces.length === 0) return [];
  const auditByWorkspace = await Promise.all(
    filteredWorkspaces.map(async (workspace) => ({
      workspace,
      events: await repo.listDossierStudioWorkspaceAuditEvents(workspace.dossierId).catch(
        () => [] as DossierStudioWorkspaceAuditEvent[],
      ),
    })),
  );
  return auditByWorkspace.flatMap(({ workspace, events }) =>
    events
      .map((event) => mapWorkspaceOfficialEvent(workspace, event))
      .filter((event): event is UnifiedAuditEvent => Boolean(event)),
  );
}

export async function listUnifiedAuditEvents(
  query: ListUnifiedAuditEventsQuery = {},
): Promise<UnifiedAuditReadModel> {
  const buckets = bucketItemIds(query.itemIds);
  const events = (
    await Promise.all([
      listCreateHandoffUnifiedEvents(buckets),
      listReviewQueueOperationUnifiedEvents(buckets),
      listSourceResultUnifiedEvents(buckets),
      listContentReleaseUnifiedEvents(buckets),
      listOfficialSignalUnifiedEvents(buckets),
      listOfficialWorkspaceUnifiedEvents(buckets),
    ])
  ).flatMap((entries) => entries);
  const hydrated = applyItemResourceScopes(events, query.itemResources);
  const filtered = filterEvents(hydrated, query);
  const scoped = takeMostRecentChronologically(filtered, query.limit);
  return {
    events: scoped,
    total: filtered.length,
    scope: buildViewerScope(query.scope),
    guardrails: READSIDE_GUARDRAILS,
  };
}

export async function getUnifiedAuditTrailForItem(input: {
  itemId: string;
  scope?: RegionScopeContext;
  limit?: number;
}) {
  const readModel = await listUnifiedAuditEvents({
    scope: input.scope,
    itemIds: [input.itemId],
    limit: input.limit ?? 6,
  });
  return readModel.events;
}

export async function getUnifiedAuditTrailForOrganization(input: {
  organizationId: string;
  scope?: RegionScopeContext;
  limit?: number;
}) {
  const readModel = await listUnifiedAuditEvents({
    scope: input.scope,
    organizationId: input.organizationId,
    limit: input.limit ?? 8,
  });
  return readModel.events;
}

export async function getUnifiedAuditTrailForRegion(input: {
  regionId: string;
  scope?: RegionScopeContext;
  limit?: number;
}) {
  const readModel = await listUnifiedAuditEvents({
    scope: input.scope,
    regionId: input.regionId,
    limit: input.limit ?? 8,
  });
  return readModel.events;
}
