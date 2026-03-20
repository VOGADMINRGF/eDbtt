import { ObjectId, coreCol } from "@core/db/triMongo";
import { feedStatementsCol } from "@features/feeds/db";
import { dossiersCol } from "@features/dossier/db";
import {
  buildCommunityHref,
  normalizeCommunityDeepLinkParams,
  type CommunityDeepLinkParamRecord,
  type CommunityGroupScope,
  type CommunityGroupType,
} from "@/features/community/deepLinkContract";
import {
  deriveMessagingCapability,
  idCandidates,
  normalizeId,
  pairFilter,
  summarizePairState,
  type SocialRelationshipState,
} from "@/lib/social/relationshipState";

export type OriginType = CommunityGroupType;
export type OriginScope = CommunityGroupScope;

export type GroupContext = {
  key: string;
  label: string;
  type: OriginType;
  scope: OriginScope;
  topicKey?: string | null;
  topicLabel?: string | null;
  dossierId?: string | null;
  dossierTitle?: string | null;
  regionLabel?: string | null;
  reasonLabel?: string | null;
};

type UserDoc = {
  _id: ObjectId;
  name?: string | null;
  email?: string | null;
  profile?: {
    displayName?: string | null;
    avatarUrl?: string | null;
    publicShareId?: string | null;
    tagline?: string | null;
    topTopics?: Array<{ key?: string | null; title?: string | null }> | null;
    publicLocation?: {
      city?: string | null;
      region?: string | null;
    } | null;
  } | null;
};

type SocialFriendRequestDoc = {
  _id: ObjectId;
  fromUserId?: string | ObjectId | null;
  toUserId?: string | ObjectId | null;
};

export type FeedStatementPreview = {
  id: string;
  title: string;
  summary: string;
};

export type DossierPreview = {
  dossierId: string;
  title: string;
  status: string;
} | null;

export type GroupMember = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  shareId: string | null;
  tagline: string | null;
  locationLabel: string | null;
  relationshipState: SocialRelationshipState;
  canMessage: boolean;
  reasonLabel: string | null;
};

export type CommunityDiscoveryGroup = {
  key: string;
  title: string;
  hint: string;
  href: string;
};

export type CommunitySourceState = {
  unavailable: boolean;
  error: "community_group_source_unavailable" | null;
};

export type CommunityGroupSurfaceModel =
  | {
      mode: "discovery";
      groups: CommunityDiscoveryGroup[];
      source: CommunitySourceState;
    }
  | {
      mode: "group";
      context: GroupContext;
      members: GroupMember[];
      statements: FeedStatementPreview[];
      dossier: DossierPreview;
      topicHref: string;
      dossierHref: string | null;
      source: CommunitySourceState;
    };

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function titleCaseFromSlug(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9aeoeuess]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTopicList(input: unknown): Array<{ key: string; label: string }> {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const list: Array<{ key: string; label: string }> = [];
  for (const entry of input) {
    const key = clean((entry as { key?: unknown } | null)?.key).toLowerCase();
    const label = clean((entry as { title?: unknown } | null)?.title) || key;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    list.push({ key, label });
  }
  return list;
}

function normalizeLocation(city?: string | null, region?: string | null): string | null {
  const cityLabel = clean(city);
  const regionLabel = clean(region);
  if (cityLabel && regionLabel && cityLabel.toLowerCase() !== regionLabel.toLowerCase()) {
    return `${cityLabel} · ${regionLabel}`;
  }
  return cityLabel || regionLabel || null;
}

export function validateCommunityGroupParams(params: CommunityDeepLinkParamRecord) {
  const normalized = normalizeCommunityDeepLinkParams(params);
  if (!normalized.ok) return normalized;
  return { ok: true as const };
}

export function parseGroupContext(params: CommunityDeepLinkParamRecord): GroupContext | null {
  const normalized = normalizeCommunityDeepLinkParams(params);
  if (!normalized.ok || normalized.value.mode !== "group") return null;
  const canonical = normalized.value.params;
  const group = canonical.group;
  const topicKey = canonical.topicKey ?? null;
  const topicLabel = canonical.topicLabel ?? null;
  const dossierId = canonical.dossierId ?? null;
  const dossierTitle = canonical.dossierTitle ?? null;
  const regionLabel = canonical.regionLabel ?? null;
  const reasonLabel = canonical.reasonLabel ?? null;
  const label = canonical.communityLabel ?? titleCaseFromSlug(group);
  const typeRaw = canonical.type ?? null;
  const scopeRaw = canonical.scope ?? null;

  let type: OriginType = "interest_match";
  if (
    typeRaw === "interest_match" ||
    typeRaw === "dossier" ||
    typeRaw === "topic_round" ||
    typeRaw === "regional_group" ||
    typeRaw === "founder" ||
    typeRaw === "system"
  ) {
    type = typeRaw;
  } else if (group.includes("founder")) {
    type = "founder";
  } else if (group.includes("system")) {
    type = "system";
  } else if (dossierId) {
    type = "dossier";
  } else if (regionLabel) {
    type = "regional_group";
  }

  let scope: OriginScope = "ueberregional";
  if (scopeRaw === "regional" || scopeRaw === "ueberregional") {
    scope = scopeRaw;
  } else if (type === "regional_group") {
    scope = "regional";
  }

  return {
    key: group,
    label,
    type,
    scope,
    topicKey,
    topicLabel,
    dossierId,
    dossierTitle,
    regionLabel,
    reasonLabel,
  };
}

async function loadViewerProfile(userId: string | null): Promise<UserDoc | null> {
  if (!userId || !ObjectId.isValid(userId)) return null;
  const usersCol = await coreCol<UserDoc>("users");
  return usersCol.findOne(
    { _id: new ObjectId(userId) },
    {
      projection: {
        name: 1,
        email: 1,
        "profile.displayName": 1,
        "profile.topTopics": 1,
        "profile.publicLocation.city": 1,
        "profile.publicLocation.region": 1,
      },
    },
  );
}

function buildDiscoveryGroups(params: {
  viewer: UserDoc | null;
}): CommunityDiscoveryGroup[] {
  const list: CommunityDiscoveryGroup[] = [];
  const topics = normalizeTopicList(params.viewer?.profile?.topTopics).slice(0, 3);
  const regionLabel = normalizeLocation(
    params.viewer?.profile?.publicLocation?.city,
    params.viewer?.profile?.publicLocation?.region,
  );

  for (const topic of topics) {
    const regional = regionLabel ? `${topic.label} · ${regionLabel}` : `${topic.label} ueberregional`;
    const key = slugify(regional);
    const reason = regionLabel
      ? `Menschen mit aehnlichen Interessen in ${regionLabel}`
      : `Menschen mit dem Schwerpunkt ${topic.label} ueberregional`;
    const href = buildCommunityHref({
      group: key,
      type: regionLabel ? "regional_group" : "interest_match",
      topicKey: topic.key,
      topicLabel: topic.label,
      scope: regionLabel ? "regional" : "ueberregional",
      communityLabel: regional,
      reasonLabel: reason,
      regionLabel: regionLabel ?? undefined,
    });
    list.push({
      key,
      title: regional,
      hint: "Abgeleitet aus Interessen und Profilkontext.",
      href,
    });
  }

  list.push({
    key: "founder-channel",
    title: "Founder-Kanal",
    hint: "Produkt-Onboarding, Updates und Hinweise.",
    href: buildCommunityHref({
      group: "founder-channel",
      type: "founder",
      scope: "ueberregional",
      communityLabel: "Founder-Channel",
    }),
  });

  return list;
}

async function loadGroupMembers(params: {
  context: GroupContext;
  viewerId: string | null;
}): Promise<GroupMember[]> {
  const usersCol = await coreCol<UserDoc>("users");
  const filters: Record<string, unknown>[] = [];

  if (params.context.topicKey) {
    filters.push({ "profile.topTopics.key": params.context.topicKey });
  }
  if (params.context.type === "regional_group" && params.context.regionLabel) {
    const primary = params.context.regionLabel.split("·")[0]?.trim() || params.context.regionLabel.trim();
    if (primary) {
      const expr = new RegExp(`^${escapeRegex(primary)}$`, "i");
      filters.push({
        $or: [{ "profile.publicLocation.city": expr }, { "profile.publicLocation.region": expr }],
      });
    }
  }

  const query: Record<string, unknown> = filters.length > 0 ? { $and: filters } : {};
  if (params.viewerId && ObjectId.isValid(params.viewerId)) {
    query._id = { $ne: new ObjectId(params.viewerId) };
  }

  const candidates = await usersCol
    .find(query, {
      projection: {
        name: 1,
        email: 1,
        "profile.displayName": 1,
        "profile.avatarUrl": 1,
        "profile.publicShareId": 1,
        "profile.tagline": 1,
        "profile.topTopics": 1,
        "profile.publicLocation.city": 1,
        "profile.publicLocation.region": 1,
      },
    })
    .limit(14)
    .toArray();

  if (candidates.length === 0) return [];

  const currentUserIds = params.viewerId ? idCandidates(params.viewerId) : [];
  const currentUserSet = new Set(currentUserIds.map((candidate) => normalizeId(candidate)));
  const requestsCol = await coreCol<SocialFriendRequestDoc>("social_friend_requests");
  const pairDocs =
    currentUserIds.length > 0
      ? await requestsCol
          .find(pairFilter(currentUserIds, candidates.flatMap((candidate) => idCandidates(String(candidate._id)))))
          .sort({ _id: -1 })
          .limit(260)
          .toArray()
      : [];

  return candidates.slice(0, 10).map((candidate) => {
    const id = String(candidate._id);
    const candidateIdSet = new Set(idCandidates(id).map((entry) => normalizeId(entry)));
    const relatedDocs = pairDocs.filter((doc) => {
      const fromId = normalizeId(doc.fromUserId);
      const toId = normalizeId(doc.toUserId);
      const outgoing = currentUserSet.has(fromId) && candidateIdSet.has(toId);
      const incoming = candidateIdSet.has(fromId) && currentUserSet.has(toId);
      return outgoing || incoming;
    });
    const pairState =
      params.viewerId && currentUserIds.length > 0
        ? summarizePairState(relatedDocs, params.viewerId, id)
        : { connected: false, incomingPending: null, outgoingPending: null };
    const capability =
      params.viewerId && currentUserIds.length > 0
        ? deriveMessagingCapability({
            pairState,
            currentUserId: params.viewerId,
            targetUserId: id,
            targetKnown: true,
          })
        : {
            relationshipState: "none" as SocialRelationshipState,
            canMessage: false,
          };
    const displayName =
      clean(candidate.profile?.displayName) || clean(candidate.name) || clean(candidate.email) || "Mitglied";
    const locationLabel = normalizeLocation(
      candidate.profile?.publicLocation?.city,
      candidate.profile?.publicLocation?.region,
    );
    const topicList = normalizeTopicList(candidate.profile?.topTopics);
    const reasonLabel = params.context.topicLabel
      ? topicList.some((topic) => topic.key === params.context.topicKey)
        ? `${params.context.topicLabel}${locationLabel ? ` · ${locationLabel}` : ""}`
        : params.context.topicLabel
      : locationLabel;

    return {
      id,
      displayName,
      avatarUrl: clean(candidate.profile?.avatarUrl) || null,
      shareId: clean(candidate.profile?.publicShareId) || null,
      tagline: clean(candidate.profile?.tagline) || null,
      locationLabel,
      relationshipState: capability.relationshipState,
      canMessage: capability.canMessage,
      reasonLabel: reasonLabel || null,
    };
  });
}

async function loadRelevantStatements(context: GroupContext): Promise<FeedStatementPreview[]> {
  const col = await feedStatementsCol();
  const query: Record<string, unknown> = { status: "readyForLive" };
  if (context.topicKey || context.topicLabel) {
    const tokens = [context.topicLabel, context.topicKey]
      .map((entry) => clean(entry))
      .filter(Boolean);
    if (tokens.length > 0) {
      query.$or = tokens.map((token) => {
        const expr = new RegExp(escapeRegex(token), "i");
        return { $or: [{ title: expr }, { summary: expr }] };
      });
    }
  }
  const rows = await col
    .find(query, { projection: { title: 1, summary: 1, claims: { $slice: 1 } } })
    .sort({ createdAt: -1 })
    .limit(4)
    .toArray();
  return rows.map((row: any) => ({
    id: String(row?._id),
    title: clean(row?.title) || "Debatte",
    summary: clean(row?.summary) || clean(row?.claims?.[0]?.text) || "Kurzzusammenfassung folgt.",
  }));
}

async function loadDossierPreview(context: GroupContext): Promise<DossierPreview> {
  const col = await dossiersCol();
  if (context.dossierId) {
    const byId = await col.findOne(
      { dossierId: context.dossierId },
      { projection: { dossierId: 1, title: 1, status: 1 } },
    );
    if (byId?.dossierId) {
      return {
        dossierId: byId.dossierId,
        title: clean(byId.title) || "Dossier",
        status: clean(byId.status) || "active",
      };
    }
  }
  if (context.topicLabel) {
    const byTopic = await col.findOne(
      { title: new RegExp(escapeRegex(context.topicLabel), "i") },
      { projection: { dossierId: 1, title: 1, status: 1 }, sort: { updatedAt: -1, createdAt: -1 } as any },
    );
    if (byTopic?.dossierId) {
      return {
        dossierId: byTopic.dossierId,
        title: clean(byTopic.title) || "Dossier",
        status: clean(byTopic.status) || "active",
      };
    }
  }
  return null;
}

export async function resolveCommunityGroupSurface(params: {
  searchParams: Record<string, string | string[] | undefined>;
  viewerId: string | null;
}): Promise<CommunityGroupSurfaceModel> {
  const context = parseGroupContext(params.searchParams);
  let viewer: UserDoc | null = null;
  let unavailable = false;

  try {
    viewer = await loadViewerProfile(params.viewerId);
  } catch {
    unavailable = true;
  }

  if (!context) {
    const groups = buildDiscoveryGroups({ viewer });
    return {
      mode: "discovery",
      groups,
      source: {
        unavailable,
        error: unavailable ? "community_group_source_unavailable" : null,
      },
    };
  }

  let members: GroupMember[] = [];
  let statements: FeedStatementPreview[] = [];
  let dossier: DossierPreview = null;

  try {
    [members, statements, dossier] = await Promise.all([
      loadGroupMembers({ context, viewerId: params.viewerId }),
      loadRelevantStatements(context),
      loadDossierPreview(context),
    ]);
  } catch {
    unavailable = true;
  }

  const topicHref = context.topicKey
    ? `/swipes?topic=${encodeURIComponent(context.topicKey)}`
    : "/swipes";
  const dossierHref = dossier?.dossierId
    ? `/dossier/${encodeURIComponent(dossier.dossierId)}`
    : context.dossierId
      ? `/dossier/${encodeURIComponent(context.dossierId)}`
      : null;

  return {
    mode: "group",
    context,
    members,
    statements,
    dossier,
    topicHref,
    dossierHref,
    source: {
      unavailable,
      error: unavailable ? "community_group_source_unavailable" : null,
    },
  };
}
