export const COMMUNITY_GROUP_TYPES = [
  "interest_match",
  "dossier",
  "topic_round",
  "regional_group",
  "founder",
  "system",
] as const;

export const COMMUNITY_GROUP_SCOPES = ["regional", "ueberregional"] as const;

export type CommunityGroupType = (typeof COMMUNITY_GROUP_TYPES)[number];
export type CommunityGroupScope = (typeof COMMUNITY_GROUP_SCOPES)[number];

export type CommunityDeepLinkParamRecord = Record<string, string | string[] | undefined>;

export type CanonicalCommunityGroupParams = {
  group: string;
  type?: CommunityGroupType;
  scope?: CommunityGroupScope;
  topicKey?: string;
  topicLabel?: string;
  dossierId?: string;
  dossierTitle?: string;
  regionLabel?: string;
  reasonLabel?: string;
  communityLabel?: string;
};

export type CanonicalCommunityDeepLink =
  | { mode: "discovery" }
  | { mode: "group"; params: CanonicalCommunityGroupParams };

export type CommunityDeepLinkValidationError =
  | "invalid_group_type"
  | "invalid_group_scope"
  | "invalid_group_context";

export type CommunityDeepLinkValidation =
  | { ok: true; value: CanonicalCommunityDeepLink }
  | { ok: false; error: CommunityDeepLinkValidationError };

export type CommunityDeepLinkInput = Partial<CanonicalCommunityGroupParams> & {
  communityKey?: string | null;
  topic?: string | null;
  dossier?: string | null;
  region?: string | null;
  reason?: string | null;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readParam(params: CommunityDeepLinkParamRecord, key: string): string | null {
  const value = params[key];
  if (typeof value === "string") return clean(value) || null;
  if (Array.isArray(value)) return clean(value[0]) || null;
  return null;
}

function isCommunityType(value: string): value is CommunityGroupType {
  return (COMMUNITY_GROUP_TYPES as readonly string[]).includes(value);
}

function isCommunityScope(value: string): value is CommunityGroupScope {
  return (COMMUNITY_GROUP_SCOPES as readonly string[]).includes(value);
}

export function toCommunityParamRecord(url: URL): CommunityDeepLinkParamRecord {
  const out: CommunityDeepLinkParamRecord = {};
  for (const [key, value] of url.searchParams.entries()) {
    const prev = out[key];
    if (typeof prev === "string") {
      out[key] = [prev, value];
      continue;
    }
    if (Array.isArray(prev)) {
      out[key] = [...prev, value];
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function normalizeCommunityDeepLinkParams(params: CommunityDeepLinkParamRecord): CommunityDeepLinkValidation {
  const group = readParam(params, "group") ?? readParam(params, "communityKey");
  const topicKey = readParam(params, "topicKey") ?? readParam(params, "topic");
  const dossierId = readParam(params, "dossierId") ?? readParam(params, "dossier");
  const regionLabel = readParam(params, "regionLabel") ?? readParam(params, "region");
  const reasonLabel = readParam(params, "reasonLabel") ?? readParam(params, "reason");
  const topicLabel = readParam(params, "topicLabel");
  const dossierTitle = readParam(params, "dossierTitle");
  const communityLabel = readParam(params, "communityLabel");

  const typeRaw = readParam(params, "type");
  if (typeRaw && !isCommunityType(typeRaw)) {
    return { ok: false, error: "invalid_group_type" };
  }
  const scopeRaw = readParam(params, "scope");
  if (scopeRaw && !isCommunityScope(scopeRaw)) {
    return { ok: false, error: "invalid_group_scope" };
  }

  const hasGroupContext =
    Boolean(typeRaw) ||
    Boolean(scopeRaw) ||
    Boolean(topicKey) ||
    Boolean(topicLabel) ||
    Boolean(dossierId) ||
    Boolean(dossierTitle) ||
    Boolean(regionLabel) ||
    Boolean(reasonLabel) ||
    Boolean(communityLabel);

  if (!group) {
    if (hasGroupContext) return { ok: false, error: "invalid_group_context" };
    return { ok: true, value: { mode: "discovery" } };
  }

  if (typeRaw === "regional_group" && scopeRaw === "ueberregional") {
    return { ok: false, error: "invalid_group_context" };
  }

  const normalizedType: CommunityGroupType | undefined =
    typeRaw && isCommunityType(typeRaw) ? typeRaw : undefined;
  const normalizedScope: CommunityGroupScope | undefined =
    scopeRaw && isCommunityScope(scopeRaw) ? scopeRaw : undefined;

  const normalized: CanonicalCommunityGroupParams = {
    group,
    type: normalizedType,
    scope: normalizedScope,
    topicKey: topicKey ?? undefined,
    topicLabel: topicLabel ?? undefined,
    dossierId: dossierId ?? undefined,
    dossierTitle: dossierTitle ?? undefined,
    regionLabel: regionLabel ?? undefined,
    reasonLabel: reasonLabel ?? undefined,
    communityLabel: communityLabel ?? undefined,
  };

  return { ok: true, value: { mode: "group", params: normalized } };
}

export function buildCommunityHref(input?: CommunityDeepLinkInput | null): string {
  if (!input) return "/community";
  const group = clean(input.group) || clean(input.communityKey);
  if (!group) return "/community";

  const params = new URLSearchParams();
  params.set("group", group);

  const type = clean(input.type);
  if (type && isCommunityType(type)) params.set("type", type);

  const scope = clean(input.scope);
  if (scope && isCommunityScope(scope)) params.set("scope", scope);

  const topicKey = clean(input.topicKey) || clean(input.topic);
  if (topicKey) params.set("topicKey", topicKey);

  const topicLabel = clean(input.topicLabel);
  if (topicLabel) params.set("topicLabel", topicLabel);

  const dossierId = clean(input.dossierId) || clean(input.dossier);
  if (dossierId) params.set("dossierId", dossierId);

  const dossierTitle = clean(input.dossierTitle);
  if (dossierTitle) params.set("dossierTitle", dossierTitle);

  const regionLabel = clean(input.regionLabel) || clean(input.region);
  if (regionLabel) params.set("regionLabel", regionLabel);

  const reasonLabel = clean(input.reasonLabel) || clean(input.reason);
  if (reasonLabel) params.set("reasonLabel", reasonLabel);

  const communityLabel = clean(input.communityLabel);
  if (communityLabel) params.set("communityLabel", communityLabel);

  return `/community?${params.toString()}`;
}
